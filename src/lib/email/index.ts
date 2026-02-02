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
  magicLinkUrl: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in to Gold Geek</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #57370D; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Gold Geek</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #57370D;">Sign in to your account</h2>
          <p>Click the button below to sign in to your Gold Geek account. This link will expire in 15 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLinkUrl}" style="background-color: #AD7B2A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Sign In
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
          <p style="color: #666; font-size: 14px;">Or copy and paste this URL into your browser:<br>
            <a href="${magicLinkUrl}" style="color: #AD7B2A; word-break: break-all;">${magicLinkUrl}</a>
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Gold Geek. All rights reserved.</p>
        </div>
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
