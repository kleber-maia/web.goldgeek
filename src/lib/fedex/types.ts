// ============================================================================
// FedEx API Type Definitions
// ============================================================================

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

export interface FedExTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
  scope: string;
}

// ---------------------------------------------------------------------------
// Shared address types
// ---------------------------------------------------------------------------

export interface FedExAddress {
  streetLines: string[];
  city: string;
  stateOrProvinceCode: string;
  postalCode: string;
  countryCode: string;
  residential?: boolean;
}

export interface FedExContact {
  personName: string;
  phoneNumber: string;
  companyName?: string;
}

export interface FedExParty {
  contact: FedExContact;
  address: FedExAddress;
  accountNumber?: { value: string };
}

// ---------------------------------------------------------------------------
// Ship API – Request
// ---------------------------------------------------------------------------

export interface FedExLabelSpecification {
  labelFormatType: 'COMMON2D' | 'LABEL_DATA_ONLY';
  imageType: 'PDF' | 'PNG' | 'ZPLII';
  labelStockType?: string;
  labelPrintingOrientation?: 'TOP_EDGE_OF_TEXT_FIRST' | 'BOTTOM_EDGE_OF_TEXT_FIRST';
}

export interface FedExPackageWeight {
  units: 'LB' | 'KG';
  value: number;
}

export interface FedExPackageDimensions {
  length: number;
  width: number;
  height: number;
  units: 'IN' | 'CM';
}

export interface FedExRequestedPackage {
  weight: FedExPackageWeight;
  dimensions?: FedExPackageDimensions;
  customerReferences?: Array<{
    customerReferenceType: 'CUSTOMER_REFERENCE' | 'INVOICE_NUMBER' | 'P_O_NUMBER';
    value: string;
  }>;
}

export interface FedExShipmentSpecialServicesRequested {
  specialServiceTypes?: string[];
}

export interface FedExRequestedShipment {
  shipper: FedExParty;
  recipients: FedExParty[];
  serviceType: string; // e.g. 'FEDEX_GROUND'
  packagingType: string; // e.g. 'YOUR_PACKAGING'
  pickupType: string; // e.g. 'DROPOFF_AT_FEDEX_LOCATION'
  requestedPackageLineItems: FedExRequestedPackage[];
  labelSpecification: FedExLabelSpecification;
  shippingChargesPayment: {
    paymentType: 'SENDER';
    payor: { responsibleParty: { accountNumber: { value: string } } };
  };
  shipDatestamp?: string; // YYYY-MM-DD
  specialServicesRequested?: FedExShipmentSpecialServicesRequested;
}

export interface FedExShipRequest {
  labelResponseOptions: 'LABEL' | 'URL_ONLY';
  requestedShipment: FedExRequestedShipment;
  accountNumber: { value: string };
}

// ---------------------------------------------------------------------------
// Ship API – Response
// ---------------------------------------------------------------------------

export interface FedExCompletedShipmentDetail {
  masterTrackingId?: {
    trackingIdType: string;
    trackingNumber: string;
  };
  completedPackageDetails?: Array<{
    trackingIds?: Array<{
      trackingIdType: string;
      trackingNumber: string;
    }>;
    label?: {
      type: string;
      imageType: string;
      encodedLabel?: string; // base64
      url?: string;
    };
  }>;
}

export interface FedExShipmentRateDetail {
  rateType: string;
  totalNetCharge?: {
    amount: number;
    currency: string;
  };
}

export interface FedExShipResponse {
  transactionId?: string;
  output?: {
    transactionShipments?: Array<{
      masterTrackingNumber?: string;
      serviceType?: string;
      shipDatestamp?: string;
      completedShipmentDetail?: FedExCompletedShipmentDetail;
      shipmentRating?: {
        shipmentRateDetails?: FedExShipmentRateDetail[];
      };
    }>;
    alerts?: Array<{ code: string; message: string; alertType: string }>;
  };
}

// Normalized result after parsing the raw API response
export interface FedExLabelResult {
  trackingNumber: string;
  masterTrackingNumber: string;
  labelData?: string; // base64 PDF
  labelUrl?: string;
  cost?: number;
  externalId: string;
  rawResponse: FedExShipResponse;
}

// ---------------------------------------------------------------------------
// Address Validation – Request / Response
// ---------------------------------------------------------------------------

export interface FedExAddressValidationRequest {
  addressesToValidate: Array<{
    address: FedExAddress;
  }>;
}

export interface FedExResolvedAddress {
  resolvedAddresses?: Array<{
    streetLinesToken?: string[];
    city?: string;
    stateOrProvinceCode?: string;
    postalCode?: string;
    countryCode?: string;
    classification?: 'RESIDENTIAL' | 'BUSINESS' | 'MIXED' | 'UNKNOWN';
    attributes?: Record<string, string>;
  }>;
  alerts?: Array<{ code: string; message: string; alertType: string }>;
}

export interface FedExAddressValidationResponse {
  output?: {
    resolvedAddresses?: FedExResolvedAddress['resolvedAddresses'];
    alerts?: FedExResolvedAddress['alerts'];
  };
}

// Normalized result
export interface AddressValidationResult {
  valid: boolean;
  classification?: 'RESIDENTIAL' | 'BUSINESS' | 'MIXED' | 'UNKNOWN';
  standardized?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  message?: string;
}

// ---------------------------------------------------------------------------
// Tracking Webhook
// ---------------------------------------------------------------------------

export interface FedExTrackingEvent {
  eventType: string; // e.g. 'DL', 'IT', 'OC'
  eventDescription: string;
  exceptionCode?: string;
  exceptionDescription?: string;
  timestamp?: string;
  eventTime?: string;
  address?: {
    city?: string;
    stateOrProvinceCode?: string;
    countryCode?: string;
    postalCode?: string;
  };
}

export interface FedExTrackingInfo {
  trackingNumber: string;
  trackingNumberInfo?: {
    trackingNumber: string;
    trackingIdType?: string;
  };
  latestStatusDetail?: {
    code: string;
    derivedCode?: string;
    description?: string;
    statusByLocale?: string;
  };
  events?: FedExTrackingEvent[];
  dateAndTimes?: Array<{
    type: string;
    dateTime: string;
  }>;
}

export interface FedExTrackingWebhookPayload {
  event: string; // e.g. 'TRACKING_UPDATE'
  eventTime?: string;
  trackingInfo?: FedExTrackingInfo;
  trackingNumber?: string; // top-level shortcut
}

// ---------------------------------------------------------------------------
// Tracking Subscription
// ---------------------------------------------------------------------------

export interface FedExTrackingSubscriptionRequest {
  trackingInfo: Array<{
    trackingNumberInfo: {
      trackingNumber: string;
      trackingIdType?: string;
      carrierCode?: string;
    };
    shipDateBegin?: string;
    shipDateEnd?: string;
  }>;
  notificationDetail?: {
    notificationEventType?: string[];
    webhookDetail?: {
      urlName: string;
    };
    localization?: {
      languageCode: string;
    };
  };
}
