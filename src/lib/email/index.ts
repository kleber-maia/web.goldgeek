import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@goldgeek.com',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    console.log('Email sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// --- Template helpers ---

function getEmailDefaults(baseUrl?: string) {
  const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://goldgeek.com';
  const logoUrl = `${appUrl}/images/logos/GoldGeekLogo-horizontal.png`;
  const year = new Date().getFullYear();
  return { appUrl, logoUrl, year };
}

function emailShell(title: string, logoUrl: string, year: number, body: string, footerNote?: string): string {
  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F5F0EB; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F0EB; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <img src="${logoUrl}" alt="Gold Geek" width="180" style="display: block; max-width: 180px; height: auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 2px 8px rgba(87, 55, 13, 0.08);">
                    <div style="height: 4px; background: linear-gradient(90deg, #AD7B2A, #FBEF9C, #AD7B2A); border-radius: 12px 12px 0 0;"></div>
                    <div style="padding: 40px 40px 36px 40px;">
                      ${body}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 28px 20px 0 20px;">
                    ${footerNote ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #A09488; line-height: 1.5;">${footerNote}</p>` : ''}
                    <p style="margin: 0; font-size: 12px; color: #A09488;">&copy; ${year} Gold Geek. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`;
}

function ctaButton(href: string, text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 4px 0 0 0;">
                  <a href="${href}" style="display: inline-block; background-color: #AD7B2A; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 8px; letter-spacing: 0.3px;">${text}</a>
                </td>
              </tr>
            </table>`;
}

function fedexTrackingUrl(trackingNumber: string): string {
  return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
}

// --- Email templates ---

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLinkUrl: string,
  baseUrl?: string
): Promise<boolean> {
  const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://goldgeek.com';
  const logoUrl = `${appUrl}/images/logos/GoldGeekLogo-horizontal.png`;
  const year = new Date().getFullYear();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in to Gold Geek</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F5F0EB; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F0EB; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
                <!-- Header with logo -->
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <img src="${logoUrl}" alt="Gold Geek" width="180" style="display: block; max-width: 180px; height: auto;" />
                  </td>
                </tr>
                <!-- Main card -->
                <tr>
                  <td style="background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 2px 8px rgba(87, 55, 13, 0.08);">
                    <!-- Gold accent bar -->
                    <div style="height: 4px; background: linear-gradient(90deg, #AD7B2A, #FBEF9C, #AD7B2A); border-radius: 12px 12px 0 0;"></div>
                    <div style="padding: 40px 40px 36px 40px;">
                      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Sign in to your account</h1>
                      <p style="margin: 0 0 28px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
                        Click the button below to securely sign in.<br>This link expires in 15 minutes.
                      </p>
                      <!-- CTA button -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 4px 0 28px 0;">
                            <a href="${magicLinkUrl}" style="display: inline-block; background-color: #AD7B2A; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 8px; letter-spacing: 0.3px;">
                              Sign In to Gold Geek
                            </a>
                          </td>
                        </tr>
                      </table>
                      <!-- Divider -->
                      <div style="height: 1px; background-color: #EDE8E2; margin: 0 0 20px 0;"></div>
                      <p style="margin: 0 0 6px 0; font-size: 13px; color: #A09488; line-height: 1.5;">
                        If the button doesn't work, copy and paste this link:
                      </p>
                      <p style="margin: 0; font-size: 13px; word-break: break-all; line-height: 1.5;">
                        <a href="${magicLinkUrl}" style="color: #AD7B2A; text-decoration: underline;">${magicLinkUrl}</a>
                      </p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 28px 20px 0 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #A09488; line-height: 1.5;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #A09488;">
                      &copy; ${year} Gold Geek. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Sign in to Gold Geek',
    html,
    text: `Sign in to Gold Geek\n\nClick this link to sign in: ${magicLinkUrl}\n\nThis link will expire in 15 minutes.`,
  });
}

/**
 * Send offer ready email
 */
export async function sendOfferReadyEmail(
  email: string,
  offerNumber: string,
  totalValue: number,
  offerUrl: string,
  baseUrl?: string
): Promise<boolean> {
  const { logoUrl, year } = getEmailDefaults(baseUrl);

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Your Offer is Ready!</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      We've completed the evaluation of your items and are pleased to present our offer.
    </p>
    <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #A09488;">Offer ${offerNumber}</p>
      <p style="margin: 0; font-size: 36px; font-weight: 700; color: #AD7B2A;">$${totalValue.toFixed(2)}</p>
    </div>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      This offer is valid for 7 days. Please review and accept or decline at your convenience.
    </p>
    ${ctaButton(offerUrl, 'View Offer')}`;

  const html = emailShell('Your Gold Geek Offer is Ready', logoUrl, year, body);

  return sendEmail({
    to: email,
    subject: `Your Gold Geek Offer is Ready - $${totalValue.toFixed(2)}`,
    html,
    text: `Your Gold Geek Offer is Ready\n\nOffer ${offerNumber}: $${totalValue.toFixed(2)}\n\nView your offer: ${offerUrl}\n\nThis offer is valid for 7 days.`,
  });
}

/**
 * Send payment sent email
 */
export async function sendPaymentSentEmail(
  email: string,
  paymentNumber: string,
  amount: number,
  method: string,
  trackingNumber?: string,
  baseUrl?: string
): Promise<boolean> {
  const { logoUrl, year } = getEmailDefaults(baseUrl);

  const trackingRow = trackingNumber
    ? `<tr>
        <td style="padding: 8px 0; font-size: 14px; color: #A09488; width: 100px;">Tracking</td>
        <td style="padding: 8px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${trackingNumber}</td>
      </tr>`
    : '';

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Payment Sent!</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      Great news — your payment has been processed and is on its way.
    </p>
    <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #A09488; width: 100px;">Payment</td>
          <td style="padding: 8px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${paymentNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #A09488;">Amount</td>
          <td style="padding: 8px 0; font-size: 20px; color: #AD7B2A; font-weight: 700;">$${amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #A09488;">Method</td>
          <td style="padding: 8px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${method}</td>
        </tr>
        ${trackingRow}
      </table>
    </div>
    <p style="margin: 0; font-size: 14px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      Thank you for choosing Gold Geek!
    </p>`;

  const html = emailShell('Payment Sent - Gold Geek', logoUrl, year, body);

  return sendEmail({
    to: email,
    subject: 'Payment Sent - Gold Geek',
    html,
    text: `Payment Sent\n\nPayment ${paymentNumber}\nAmount: $${amount.toFixed(2)}\nMethod: ${method}${trackingNumber ? `\nTracking: ${trackingNumber}` : ''}\n\nThank you for choosing Gold Geek!`,
  });
}

/**
 * Send kit received email
 */
export async function sendKitReceivedEmail(
  email: string,
  kitNumber: string,
  baseUrl?: string
): Promise<boolean> {
  const { appUrl, logoUrl, year } = getEmailDefaults(baseUrl);
  const kitUrl = `${appUrl}/account/kits`;

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">We've Received Your Kit!</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      Kit <strong style="color: #2E1F0C;">${kitNumber}</strong> has arrived at our facility and is ready for evaluation.
    </p>
    <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #57370D;">What happens next?</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #7A6B5D; line-height: 1.5;">
            <strong style="color: #AD7B2A;">1.</strong> Our expert evaluators will carefully assess each item
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #7A6B5D; line-height: 1.5;">
            <strong style="color: #AD7B2A;">2.</strong> We'll prepare a detailed offer within 24–48 hours
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #7A6B5D; line-height: 1.5;">
            <strong style="color: #AD7B2A;">3.</strong> You'll receive an email as soon as your offer is ready
          </td>
        </tr>
      </table>
    </div>
    ${ctaButton(kitUrl, 'View Kit Status')}`;

  const html = emailShell('Kit Received - Gold Geek', logoUrl, year, body);

  return sendEmail({
    to: email,
    subject: `Kit Received - ${kitNumber} - Gold Geek`,
    html,
    text: `We've Received Your Kit!\n\nKit ${kitNumber} has arrived at our facility.\n\nOur expert evaluators will carefully assess your items and send you an offer within 24-48 hours.\n\nView status: ${kitUrl}`,
  });
}

/**
 * Send kit shipped to customer email (kit box on its way)
 */
export async function sendKitShippedToCustomerEmail(
  email: string,
  kitNumber: string,
  trackingNumber: string,
  baseUrl?: string
): Promise<boolean> {
  const { logoUrl, year } = getEmailDefaults(baseUrl);
  const trackUrl = fedexTrackingUrl(trackingNumber);

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Your Gold Geek Kit is On Its Way!</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      Your appraisal kit for <strong style="color: #2E1F0C;">${kitNumber}</strong> has been shipped and is headed your way.
    </p>
    <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488; width: 100px;">Kit</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${kitNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488;">Tracking</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${trackingNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488;">Carrier</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">FedEx</td>
        </tr>
      </table>
    </div>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      Once your kit arrives, place your items inside and use the prepaid return label to send them back to us.
    </p>
    ${ctaButton(trackUrl, 'Track Package')}`;

  const html = emailShell('Your Gold Geek Kit is On Its Way!', logoUrl, year, body);

  return sendEmail({
    to: email,
    subject: `Your Gold Geek Kit is On Its Way! - ${kitNumber}`,
    html,
    text: `Your Gold Geek Kit is On Its Way!\n\nKit ${kitNumber} has been shipped.\nTracking: ${trackingNumber}\n\nTrack your package: ${trackUrl}\n\nOnce your kit arrives, place your items inside and use the prepaid return label to send them back.`,
  });
}

/**
 * Send package in transit email (customer's package heading to Gold Geek)
 */
export async function sendPackageInTransitEmail(
  email: string,
  kitNumber: string,
  trackingNumber: string,
  baseUrl?: string
): Promise<boolean> {
  const { logoUrl, year } = getEmailDefaults(baseUrl);
  const trackUrl = fedexTrackingUrl(trackingNumber);

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Your Package is On Its Way to Gold Geek</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      We've detected that your package for kit <strong style="color: #2E1F0C;">${kitNumber}</strong> is in transit to our facility.
    </p>
    <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488; width: 100px;">Kit</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${kitNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488;">Tracking</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${trackingNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488;">Carrier</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">FedEx</td>
        </tr>
      </table>
    </div>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      We'll notify you as soon as we receive your package and begin the evaluation.
    </p>
    ${ctaButton(trackUrl, 'Track Package')}`;

  const html = emailShell('Your Package is On Its Way to Gold Geek', logoUrl, year, body);

  return sendEmail({
    to: email,
    subject: `Package In Transit - ${kitNumber} - Gold Geek`,
    html,
    text: `Your Package is On Its Way to Gold Geek\n\nKit ${kitNumber} is in transit.\nTracking: ${trackingNumber}\n\nTrack your package: ${trackUrl}\n\nWe'll notify you as soon as we receive it.`,
  });
}

/**
 * Send return shipped email (declined items being returned to customer)
 */
export async function sendReturnShippedEmail(
  email: string,
  kitNumber: string,
  returnNumber: string,
  trackingNumber: string,
  baseUrl?: string
): Promise<boolean> {
  const { logoUrl, year } = getEmailDefaults(baseUrl);
  const trackUrl = fedexTrackingUrl(trackingNumber);

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Your Items Are Being Returned</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      We're sending your items back as requested. Here are the shipping details.
    </p>
    <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488; width: 100px;">Kit</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${kitNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488;">Return</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${returnNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488;">Tracking</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${trackingNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488;">Carrier</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">FedEx</td>
        </tr>
      </table>
    </div>
    ${ctaButton(trackUrl, 'Track Package')}`;

  const html = emailShell('Your Items Are Being Returned', logoUrl, year, body);

  return sendEmail({
    to: email,
    subject: `Return Shipped - ${kitNumber} - Gold Geek`,
    html,
    text: `Your Items Are Being Returned\n\nKit: ${kitNumber}\nReturn: ${returnNumber}\nTracking: ${trackingNumber}\n\nTrack your package: ${trackUrl}`,
  });
}

/**
 * Send return delivered email (items delivered back to customer)
 */
export async function sendReturnDeliveredEmail(
  email: string,
  kitNumber: string,
  returnNumber: string,
  baseUrl?: string
): Promise<boolean> {
  const { appUrl, logoUrl, year } = getEmailDefaults(baseUrl);
  const accountUrl = `${appUrl}/account/kits`;

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Your Items Have Been Delivered</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      Your returned items for kit <strong style="color: #2E1F0C;">${kitNumber}</strong> have been delivered successfully.
    </p>
    <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488; width: 100px;">Kit</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${kitNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488;">Return</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${returnNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488;">Status</td>
          <td style="padding: 6px 0; font-size: 14px; color: #16a34a; font-weight: 600;">Delivered</td>
        </tr>
      </table>
    </div>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      Thank you for giving Gold Geek the opportunity to evaluate your items. We hope to serve you again in the future!
    </p>
    ${ctaButton(accountUrl, 'View Account')}`;

  const html = emailShell('Your Items Have Been Delivered', logoUrl, year, body);

  return sendEmail({
    to: email,
    subject: `Return Delivered - ${kitNumber} - Gold Geek`,
    html,
    text: `Your Items Have Been Delivered\n\nKit: ${kitNumber}\nReturn: ${returnNumber}\n\nYour returned items have been delivered successfully.\n\nThank you for giving Gold Geek the opportunity to evaluate your items!`,
  });
}
