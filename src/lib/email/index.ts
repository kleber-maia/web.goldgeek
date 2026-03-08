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
  offerUrl: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Gold Geek Offer is Ready</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #57370D; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Gold Geek</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #57370D;">Your Offer is Ready!</h2>
          <p>We've completed the evaluation of your items and are pleased to present our offer.</p>
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #666;">Offer #${offerNumber}</p>
            <h1 style="color: #AD7B2A; margin: 10px 0; font-size: 36px;">$${totalValue.toFixed(2)}</h1>
          </div>
          <p>This offer is valid for 7 days. Please review and accept or decline at your convenience.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${offerUrl}" style="background-color: #AD7B2A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Offer
            </a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Gold Geek. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Your Gold Geek Offer is Ready - $${totalValue.toFixed(2)}`,
    html,
    text: `Your Gold Geek Offer is Ready\n\nOffer #${offerNumber}: $${totalValue.toFixed(2)}\n\nView your offer: ${offerUrl}\n\nThis offer is valid for 7 days.`,
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
  trackingNumber?: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Sent - Gold Geek</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #57370D; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Gold Geek</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #57370D;">Payment Sent!</h2>
          <p>Your payment has been sent via ${method}.</p>
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Payment #:</strong> ${paymentNumber}</p>
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>Method:</strong> ${method}</p>
            ${trackingNumber ? `<p><strong>Tracking #:</strong> ${trackingNumber}</p>` : ''}
          </div>
          <p>Thank you for choosing Gold Geek!</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Gold Geek. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Payment Sent - Gold Geek',
    html,
    text: `Payment Sent\n\nPayment #${paymentNumber}\nAmount: $${amount.toFixed(2)}\nMethod: ${method}${trackingNumber ? `\nTracking: ${trackingNumber}` : ''}`,
  });
}

/**
 * Send kit received email
 */
export async function sendKitReceivedEmail(
  email: string,
  kitNumber: string,
  trackingUrl?: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kit Received - Gold Geek</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #57370D; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Gold Geek</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #57370D;">Kit Received!</h2>
          <p>We've received your kit <strong>#${kitNumber}</strong> and will begin evaluation shortly.</p>
          <p>Our expert evaluators will carefully assess your items and send you an offer within 24-48 hours.</p>
          <p>You'll receive an email notification as soon as your offer is ready.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Gold Geek. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Kit Received - Gold Geek',
    html,
    text: `Kit Received\n\nWe've received your kit #${kitNumber} and will begin evaluation shortly.\n\nYou'll receive an offer within 24-48 hours.`,
  });
}
