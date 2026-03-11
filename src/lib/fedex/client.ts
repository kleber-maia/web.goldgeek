import type {
  FedExTokenResponse,
  FedExShipRequest,
  FedExShipResponse,
  FedExLabelResult,
  FedExAddressValidationRequest,
  FedExAddressValidationResponse,
  AddressValidationResult,
  FedExTrackingSubscriptionRequest,
  FedExAddress,
  FedExContact,
  FedExParty,
} from './types';

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  return process.env.FEDEX_SANDBOX_MODE === 'true'
    ? 'https://apis-sandbox.fedex.com'
    : 'https://apis.fedex.com';
}

function getAccountNumber(): string {
  const n = process.env.FEDEX_ACCOUNT_NUMBER;
  if (!n) throw new Error('FEDEX_ACCOUNT_NUMBER is not set');
  return n;
}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.FEDEX_CLIENT_ID;
  const clientSecret = process.env.FEDEX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('FEDEX_CLIENT_ID and FEDEX_CLIENT_SECRET must be set');
  }
  return { clientId, clientSecret };
}

// ---------------------------------------------------------------------------
// Token cache (in-memory, process-scoped — fine for server-side Next.js)
// ---------------------------------------------------------------------------

let cachedToken: string | null = null;
let tokenExpiresAt = 0; // unix ms

// ---------------------------------------------------------------------------
// FedExClient
// ---------------------------------------------------------------------------

export class FedExClient {
  // -------------------------------------------------------------------------
  // OAuth token
  // -------------------------------------------------------------------------

  static async getToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && now < tokenExpiresAt - 60_000) {
      return cachedToken;
    }

    const { clientId, clientSecret } = getCredentials();
    const url = `${getBaseUrl()}/oauth/token`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`FedEx OAuth failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as FedExTokenResponse;
    cachedToken = data.access_token;
    tokenExpiresAt = now + data.expires_in * 1000;
    return cachedToken;
  }

  // -------------------------------------------------------------------------
  // Internal request helper
  // -------------------------------------------------------------------------

  private static async request<T>(
    path: string,
    body: unknown
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${getBaseUrl()}${path}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-locale': 'en_US',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`FedEx API error ${res.status} at ${path}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Create shipment (label generation)
  // -------------------------------------------------------------------------

  static async createShipment(request: FedExShipRequest): Promise<FedExLabelResult> {
    const raw = await this.request<FedExShipResponse>('/ship/v1/shipments', request);

    const shipment = raw.output?.transactionShipments?.[0];
    if (!shipment) {
      throw new Error('FedEx: no shipment returned in response');
    }

    const masterTracking = shipment.masterTrackingNumber ?? '';
    const pkgDetail = shipment.completedShipmentDetail?.completedPackageDetails?.[0];
    const trackingNumber =
      pkgDetail?.trackingIds?.[0]?.trackingNumber ?? masterTracking;

    if (!trackingNumber) {
      throw new Error('FedEx: could not extract tracking number from response');
    }

    // Try primary path: completedPackageDetails[0].label
    const label = pkgDetail?.label;
    let labelData = label?.encodedLabel;
    let labelUrl = label?.url;

    // Fallback: pieceResponses[0].packageDocuments (used by sandbox & newer API versions)
    if (!labelData) {
      const piece = (shipment as any).pieceResponses?.[0];
      const doc = piece?.packageDocuments?.find(
        (d: any) => d.contentType === 'LABEL'
      );
      if (doc) {
        labelData = doc.encodedLabel;
        labelUrl = labelUrl || doc.url;
      }
    }

    const rateDetails = shipment.shipmentRating?.shipmentRateDetails;
    const cost = rateDetails
      ? (rateDetails.find((r) => r.rateType === 'PAYOR_ACCOUNT_SHIPMENT') ??
          rateDetails[0])?.totalNetCharge?.amount
      : undefined;

    return {
      trackingNumber,
      masterTrackingNumber: masterTracking || trackingNumber,
      labelData,
      labelUrl,
      cost,
      externalId: masterTracking || trackingNumber,
      rawResponse: raw,
    };
  }

  // -------------------------------------------------------------------------
  // Validate address
  // -------------------------------------------------------------------------

  static async validateAddress(address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<AddressValidationResult> {
    const streetLines = address.street2
      ? [address.street1, address.street2]
      : [address.street1];

    const requestBody: FedExAddressValidationRequest = {
      addressesToValidate: [
        {
          address: {
            streetLines,
            city: address.city,
            stateOrProvinceCode: address.state,
            postalCode: address.zipCode,
            countryCode: 'US',
          },
        },
      ],
    };

    let raw: FedExAddressValidationResponse;
    try {
      raw = await this.request<FedExAddressValidationResponse>(
        '/address/v1/addresses/resolve',
        requestBody
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { valid: false, message: `Address validation failed: ${msg}` };
    }

    const resolved = raw.output?.resolvedAddresses?.[0];
    if (!resolved) {
      return { valid: false, message: 'Address could not be resolved' };
    }

    const streets = resolved.streetLinesToken ?? [];

    return {
      valid: true,
      classification: resolved.classification as AddressValidationResult['classification'],
      standardized: {
        street1: streets[0] ?? address.street1,
        street2: streets[1],
        city: resolved.city ?? address.city,
        state: resolved.stateOrProvinceCode ?? address.state,
        zipCode: resolved.postalCode ?? address.zipCode,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Subscribe to tracking events (webhook)
  // -------------------------------------------------------------------------

  static async subscribeTracking(
    trackingNumber: string,
    webhookUrl: string
  ): Promise<void> {
    const body: FedExTrackingSubscriptionRequest = {
      trackingInfo: [
        {
          trackingNumberInfo: {
            trackingNumber,
            trackingIdType: 'FEDEX',
            carrierCode: 'FDXG',
          },
        },
      ],
      notificationDetail: {
        notificationEventType: [
          'ON_SHIPMENT',
          'ON_PICKUP',
          'ON_DELIVERY',
          'ON_EXCEPTION',
          'ON_IN_TRANSIT',
        ],
        webhookDetail: {
          urlName: webhookUrl,
        },
        localization: {
          languageCode: 'en',
        },
      },
    };

    try {
      await this.request('/notifyapi/v1/notifications/subscriptions', body);
    } catch (err) {
      // Non-fatal: label is still usable even if webhook subscription fails.
      // Log and continue so the label creation doesn't break.
      console.error('FedEx tracking subscription failed (non-fatal):', err);
    }
  }

  // -------------------------------------------------------------------------
  // Build party object (shared helper used by ShippingService)
  // -------------------------------------------------------------------------

  static buildParty(
    contact: { name: string; phone: string; company?: string },
    address: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zipCode: string;
    },
    accountNumber?: string
  ): FedExParty {
    const fedexAddress: FedExAddress = {
      streetLines: address.street2
        ? [address.street1, address.street2]
        : [address.street1],
      city: address.city,
      stateOrProvinceCode: address.state,
      postalCode: address.zipCode,
      countryCode: 'US',
    };

    const fedexContact: FedExContact = {
      personName: contact.name,
      phoneNumber: contact.phone.replace(/\D/g, ''),
      ...(contact.company ? { companyName: contact.company } : {}),
    };

    const party: FedExParty = {
      contact: fedexContact,
      address: fedexAddress,
    };

    if (accountNumber) {
      party.accountNumber = { value: accountNumber };
    }

    return party;
  }
}
