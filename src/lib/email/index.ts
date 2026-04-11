import { readFile } from 'fs/promises';
import path from 'path';
import { Resend, type Attachment } from 'resend';
import { SettingsService, type CompanyInfo } from '@/lib/services/settings.service';
import { appRoutes, buildAbsoluteUrl, resolveBaseUrl } from '@/lib/url';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Attachment[];
}

const LOGO_CONTENT_ID = 'goldgeek-logo';

/**
 * Load email configuration from company settings.
 * Returns the sender address, website URL, and full company info.
 */
async function getEmailConfig() {
  try {
    const info = await SettingsService.getCompanyInfo();
    const senderEmail = info.email || process.env.EMAIL_FROM || '';
    const fromEmail = senderEmail.includes('<')
      ? senderEmail
      : senderEmail
        ? `${info.name} <${senderEmail}>`
        : `${info.name} <noreply@example.com>`;
    const websiteUrl = resolveBaseUrl(
      info.websiteUrl,
      process.env.NEXT_PUBLIC_APP_URL
    );
    return { fromEmail, websiteUrl, company: info };
  } catch {
    const name = 'Gold Geek';
    return {
      fromEmail: process.env.EMAIL_FROM || `${name} <noreply@example.com>`,
      websiteUrl: resolveBaseUrl(process.env.NEXT_PUBLIC_APP_URL),
      company: { name } as CompanyInfo,
    };
  }
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    let from = options.from;
    if (!from) {
      const config = await getEmailConfig();
      from = config.fromEmail;
    }

    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
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

async function getEmailDefaults(baseUrl?: string) {
  const config = await getEmailConfig();
  const appUrl = resolveBaseUrl(baseUrl, config.websiteUrl);
  const fallbackLogoUrl = buildAbsoluteUrl(
    appUrl,
    '/images/logos/GoldGeekLogo-horizontal.png'
  );
  const logoAttachment = await getLogoAttachment();
  const logoUrl = logoAttachment ? `cid:${LOGO_CONTENT_ID}` : fallbackLogoUrl;
  const year = new Date().getFullYear();
  const companyName = config.company.name;
  return {
    appUrl,
    logoUrl,
    year,
    companyName,
    company: config.company,
    attachments: logoAttachment ? [logoAttachment] : undefined,
  };
}

async function getLogoAttachment(): Promise<Attachment | undefined> {
  try {
    const content = await readFile(
      path.join(process.cwd(), 'public/images/logos/GoldGeekLogo-horizontal.png')
    );

    return {
      filename: 'GoldGeekLogo-horizontal.png',
      content,
      contentType: 'image/png',
      contentId: LOGO_CONTENT_ID,
    };
  } catch (error) {
    console.error('Failed to load email logo attachment:', error);
    return undefined;
  }
}

function emailShell(title: string, logoUrl: string, year: number, companyName: string, body: string, footerNote?: string): string {
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
                    <img src="${logoUrl}" alt="${companyName}" width="180" style="display: block; width: 180px; max-width: 180px; height: auto;" />
                    <div style="margin-top: 10px; font-size: 18px; font-weight: 600; letter-spacing: 0.4px; color: #57370D;">
                      ${companyName}
                    </div>
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
                    <p style="margin: 0; font-size: 12px; color: #A09488;">&copy; ${year} ${companyName}. All rights reserved.</p>
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
  const { logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in to ${companyName}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F5F0EB; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F0EB; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
                <!-- Header with logo -->
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <img src="${logoUrl}" alt="${companyName}" width="180" style="display: block; width: 180px; max-width: 180px; height: auto;" />
                    <div style="margin-top: 10px; font-size: 18px; font-weight: 600; letter-spacing: 0.4px; color: #57370D;">
                      ${companyName}
                    </div>
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
                              Sign In to ${companyName}
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
                      &copy; ${year} ${companyName}. All rights reserved.
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
    subject: `Sign in to ${companyName}`,
    html,
    text: `Sign in to ${companyName}\n\nClick this link to sign in: ${magicLinkUrl}\n\nThis link will expire in 15 minutes.`,
    attachments,
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
  const { logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);

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

  const html = emailShell(`Your ${companyName} Offer is Ready`, logoUrl, year, companyName, body);

  return sendEmail({
    to: email,
    subject: `Your ${companyName} Offer is Ready - $${totalValue.toFixed(2)}`,
    html,
    text: `Your ${companyName} Offer is Ready\n\nOffer ${offerNumber}: $${totalValue.toFixed(2)}\n\nView your offer: ${offerUrl}\n\nThis offer is valid for 7 days.`,
    attachments,
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
  const { logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);

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
      Thank you for choosing ${companyName}!
    </p>`;

  const html = emailShell(`Payment Sent - ${companyName}`, logoUrl, year, companyName, body);

  return sendEmail({
    to: email,
    subject: `Payment Sent - ${companyName}`,
    html,
    text: `Payment Sent\n\nPayment ${paymentNumber}\nAmount: $${amount.toFixed(2)}\nMethod: ${method}${trackingNumber ? `\nTracking: ${trackingNumber}` : ''}\n\nThank you for choosing ${companyName}!`,
    attachments,
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
  const { appUrl, logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);
  const kitUrl = buildAbsoluteUrl(appUrl, appRoutes.accountKits());

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

  const html = emailShell(`Kit Received - ${companyName}`, logoUrl, year, companyName, body);

  return sendEmail({
    to: email,
    subject: `Kit Received - ${kitNumber} - ${companyName}`,
    html,
    text: `We've Received Your Kit!\n\nKit ${kitNumber} has arrived at our facility.\n\nOur expert evaluators will carefully assess your items and send you an offer within 24-48 hours.\n\nView status: ${kitUrl}`,
    attachments,
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
  const { logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);
  const trackUrl = fedexTrackingUrl(trackingNumber);

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Your ${companyName} Kit is On Its Way!</h1>
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

  const html = emailShell(`Your ${companyName} Kit is On Its Way!`, logoUrl, year, companyName, body);

  return sendEmail({
    to: email,
    subject: `Your ${companyName} Kit is On Its Way! - ${kitNumber}`,
    html,
    text: `Your ${companyName} Kit is On Its Way!\n\nKit ${kitNumber} has been shipped.\nTracking: ${trackingNumber}\n\nTrack your package: ${trackUrl}\n\nOnce your kit arrives, place your items inside and use the prepaid return label to send them back.`,
    attachments,
  });
}

/**
 * Send package in transit email (customer's package heading to company)
 */
export async function sendPackageInTransitEmail(
  email: string,
  kitNumber: string,
  trackingNumber: string,
  baseUrl?: string
): Promise<boolean> {
  const { logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);
  const trackUrl = fedexTrackingUrl(trackingNumber);

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Your Package is On Its Way to ${companyName}</h1>
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

  const html = emailShell(`Your Package is On Its Way to ${companyName}`, logoUrl, year, companyName, body);

  return sendEmail({
    to: email,
    subject: `Package In Transit - ${kitNumber} - ${companyName}`,
    html,
    text: `Your Package is On Its Way to ${companyName}\n\nKit ${kitNumber} is in transit.\nTracking: ${trackingNumber}\n\nTrack your package: ${trackUrl}\n\nWe'll notify you as soon as we receive it.`,
    attachments,
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
  const { logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);
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

  const html = emailShell('Your Items Are Being Returned', logoUrl, year, companyName, body);

  return sendEmail({
    to: email,
    subject: `Return Shipped - ${kitNumber} - ${companyName}`,
    html,
    text: `Your Items Are Being Returned\n\nKit: ${kitNumber}\nReturn: ${returnNumber}\nTracking: ${trackingNumber}\n\nTrack your package: ${trackUrl}`,
    attachments,
  });
}

/**
 * Send offer expired email
 */
export async function sendOfferExpiredEmail(
  email: string,
  offerNumber: string,
  kitNumber: string,
  kitUrl: string,
  baseUrl?: string
): Promise<boolean> {
  const { logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Your Offer Has Expired</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      The offer <strong style="color: #2E1F0C;">${offerNumber}</strong> for kit <strong style="color: #2E1F0C;">${kitNumber}</strong> has expired after 7 days.
    </p>
    <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #7A6B5D;">Don't worry — you can still contact us to discuss your items or request a new evaluation.</p>
    </div>
    ${ctaButton(kitUrl, 'View Kit Details')}`;

  const html = emailShell(`Offer Expired - ${companyName}`, logoUrl, year, companyName, body);

  return sendEmail({
    to: email,
    subject: `Offer Expired - ${kitNumber} - ${companyName}`,
    html,
    text: `Your Offer Has Expired\n\nOffer ${offerNumber} for kit ${kitNumber} has expired.\n\nContact us to discuss your items or request a new evaluation.\n\nView details: ${kitUrl}`,
    attachments,
  });
}

/**
 * Send kit created confirmation email
 */
export async function sendKitCreatedEmail(
  email: string,
  kitNumber: string,
  kitType: string,
  options?: {
    baseUrl?: string;
    actionUrl?: string;
  }
): Promise<boolean> {
  const { appUrl, logoUrl, year, companyName, attachments } = await getEmailDefaults(
    options?.baseUrl
  );
  const actionUrl =
    options?.actionUrl || buildAbsoluteUrl(appUrl, appRoutes.accountKits());

  const typeLabel = kitType === 'DIGITAL' ? 'Digital Kit' : 'Physical Kit';
  const nextStep = kitType === 'DIGITAL'
    ? 'Print your shipping label from your dashboard and drop off your package at a FedEx location.'
    : 'Your kit box will be shipped to you shortly. Once it arrives, place your items inside and use the prepaid return label.';

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Kit Request Confirmed!</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      Your appraisal kit <strong style="color: #2E1F0C;">${kitNumber}</strong> has been created.
    </p>
    <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488; width: 80px;">Kit</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${kitNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #A09488;">Type</td>
          <td style="padding: 6px 0; font-size: 14px; color: #2E1F0C; font-weight: 500;">${typeLabel}</td>
        </tr>
      </table>
    </div>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      <strong style="color: #57370D;">Next step:</strong> ${nextStep}
    </p>
    ${ctaButton(actionUrl, 'View My Kit')}`;

  const html = emailShell(`Kit Request Confirmed - ${companyName}`, logoUrl, year, companyName, body);

  return sendEmail({
    to: email,
    subject: `Kit Request Confirmed - ${kitNumber} - ${companyName}`,
    html,
    text: `Kit Request Confirmed\n\nKit ${kitNumber} (${typeLabel}) has been created.\n\nNext step: ${nextStep}\n\nView your kit: ${actionUrl}`,
    attachments,
  });
}

/**
 * Send evaluation started email
 */
export async function sendEvaluationStartedEmail(
  email: string,
  kitNumber: string,
  baseUrl?: string
): Promise<boolean> {
  const { appUrl, logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);
  const kitUrl = buildAbsoluteUrl(appUrl, appRoutes.accountKits());

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Evaluation Has Started!</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      Our team has started evaluating the items in kit <strong style="color: #2E1F0C;">${kitNumber}</strong>.
    </p>
    <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #57370D;">What to expect</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #7A6B5D; line-height: 1.5;">
            <strong style="color: #AD7B2A;">1.</strong> Each item is carefully inspected and tested
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #7A6B5D; line-height: 1.5;">
            <strong style="color: #AD7B2A;">2.</strong> We'll prepare a detailed offer within 24–48 hours
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #7A6B5D; line-height: 1.5;">
            <strong style="color: #AD7B2A;">3.</strong> You'll receive an email when your offer is ready to review
          </td>
        </tr>
      </table>
    </div>
    ${ctaButton(kitUrl, 'View Kit Status')}`;

  const html = emailShell(`Evaluation Started - ${companyName}`, logoUrl, year, companyName, body);

  return sendEmail({
    to: email,
    subject: `Evaluation Started - ${kitNumber} - ${companyName}`,
    html,
    text: `Evaluation Has Started!\n\nOur team has started evaluating the items in kit ${kitNumber}.\n\nWe'll prepare a detailed offer within 24-48 hours.\n\nView status: ${kitUrl}`,
    attachments,
  });
}

/**
 * Send admin notification when customer accepts offer
 */
export async function sendOfferAcceptedAdminEmail(
  adminEmails: string[],
  offerNumber: string,
  kitNumber: string,
  customerName: string,
  totalValue: number,
  baseUrl?: string
): Promise<boolean> {
  const { appUrl, logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Offer Accepted</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      <strong style="color: #2E1F0C;">${customerName}</strong> has accepted offer <strong style="color: #2E1F0C;">${offerNumber}</strong>.
    </p>
    <div style="background-color: #D1FAE5; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #065F46; width: 80px;">Offer</td>
          <td style="padding: 6px 0; font-size: 14px; color: #065F46; font-weight: 500;">${offerNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #065F46;">Kit</td>
          <td style="padding: 6px 0; font-size: 14px; color: #065F46; font-weight: 500;">${kitNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #065F46;">Amount</td>
          <td style="padding: 6px 0; font-size: 20px; color: #065F46; font-weight: 700;">$${totalValue.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      Please process the payment at your earliest convenience.
    </p>
    ${ctaButton(buildAbsoluteUrl(appUrl, appRoutes.adminPayments()), 'Go to Payments')}`;

  const html = emailShell(`Offer Accepted - ${companyName} Admin`, logoUrl, year, companyName, body);

  return sendEmail({
    to: adminEmails,
    subject: `Offer Accepted - ${offerNumber} ($${totalValue.toFixed(2)})`,
    html,
    text: `Offer Accepted\n\n${customerName} accepted offer ${offerNumber} for kit ${kitNumber}.\nAmount: $${totalValue.toFixed(2)}\n\nPlease process the payment.`,
    attachments,
  });
}

/**
 * Send admin notification when customer declines offer
 */
export async function sendOfferDeclinedAdminEmail(
  adminEmails: string[],
  offerNumber: string,
  kitNumber: string,
  customerName: string,
  baseUrl?: string
): Promise<boolean> {
  const { appUrl, logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #57370D; text-align: center;">Offer Declined</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #7A6B5D; text-align: center; line-height: 1.5;">
      <strong style="color: #2E1F0C;">${customerName}</strong> has declined offer <strong style="color: #2E1F0C;">${offerNumber}</strong> for kit <strong style="color: #2E1F0C;">${kitNumber}</strong>.
    </p>
    <div style="background-color: #FEE2E2; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #991B1B;">A return has been automatically created. Please generate a return shipping label.</p>
    </div>
    ${ctaButton(buildAbsoluteUrl(appUrl, appRoutes.adminReturns()), 'Go to Returns')}`;

  const html = emailShell(`Offer Declined - ${companyName} Admin`, logoUrl, year, companyName, body);

  return sendEmail({
    to: adminEmails,
    subject: `Offer Declined - ${offerNumber} - ${kitNumber}`,
    html,
    text: `Offer Declined\n\n${customerName} declined offer ${offerNumber} for kit ${kitNumber}.\n\nA return has been automatically created. Please generate a return shipping label.`,
    attachments,
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
  const { appUrl, logoUrl, year, companyName, attachments } = await getEmailDefaults(baseUrl);
  const accountUrl = buildAbsoluteUrl(appUrl, appRoutes.accountKits());

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
      Thank you for giving ${companyName} the opportunity to evaluate your items. We hope to serve you again in the future!
    </p>
    ${ctaButton(accountUrl, 'View Account')}`;

  const html = emailShell('Your Items Have Been Delivered', logoUrl, year, companyName, body);

  return sendEmail({
    to: email,
    subject: `Return Delivered - ${kitNumber} - ${companyName}`,
    html,
    text: `Your Items Have Been Delivered\n\nKit: ${kitNumber}\nReturn: ${returnNumber}\n\nYour returned items have been delivered successfully.\n\nThank you for giving ${companyName} the opportunity to evaluate your items!`,
    attachments,
  });
}
