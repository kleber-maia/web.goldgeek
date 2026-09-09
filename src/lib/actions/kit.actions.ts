'use server';

import { AppraisalRequestService } from '@/lib/services/appraisal-request.service';
import { AwaitingShipmentKitError } from '@/lib/services/kit.service';
import { AuthRateLimitService } from '@/lib/services/auth-rate-limit.service';
import { serializePrismaData } from '@/lib/db/utils';
import { headers } from 'next/headers';
import { z } from 'zod';
import { appRoutes, buildAbsoluteUrl, buildBaseUrlFromHeaders, resolveBaseUrl } from '@/lib/url';
import {
  appraisalRequestSchema,
  type AppraisalRequestInput,
} from '@/lib/validators/appraisal-request';
import { createMagicLink, getSession } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create an appraisal request (public - no auth required)
 * This also creates/finds the customer
 */
export async function createAppraisalRequest(
  data: AppraisalRequestInput
) {
  try {
    // Validate input
    const validated = appraisalRequestSchema.parse(data);
    const normalizedEmail = validated.customer.email.toLowerCase().trim();

    const session = await getSession();
    if (!await AuthRateLimitService.allow(`intake:${normalizedEmail}`, 5)) return { success: false, error: 'Too many requests. Please try again in 15 minutes.' };
    const { kit } = await AppraisalRequestService.create(validated, session?.type === 'customer' ? session.id : undefined);

    const headerList = await headers();
    const baseUrl =
      resolveBaseUrl(
        buildBaseUrlFromHeaders(headerList),
        process.env.NEXT_PUBLIC_APP_URL
      ) || 'http://localhost:3000';

    // Create magic link for authentication
    const result = await createMagicLink(normalizedEmail);
    const nextPath = appRoutes.accountKit(kit.id);
    const magicLinkUrl = buildAbsoluteUrl(
      baseUrl,
      appRoutes.authVerify(result.token, nextPath)
    );

    // Send magic link email to customer
    const emailSent = await sendMagicLinkEmail(normalizedEmail, magicLinkUrl, baseUrl);
    if (!emailSent) {
      console.error('Failed to send magic link email to:', normalizedEmail);
    }

    return {
      success: true,
      data: {
        kit: serializePrismaData(kit),
        emailSent,
        magicLinkUrl: process.env.NODE_ENV === 'development' ? magicLinkUrl : undefined,
      },
    };
  } catch (error: unknown) {
    if (error instanceof AwaitingShipmentKitError) return { success: false, error: `${error.message} Open My Kits in your account to continue.` };
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      const message = firstIssue?.message || 'Please check your form inputs and try again.';
      return { success: false, error: message };
    }
    const message = error instanceof Error && error.message === 'Please sign in to request another kit for this email address.'
      ? error.message : 'Unable to submit your request. Please retry or contact support.';
    console.error('Error creating appraisal request:', error);
    return {
      success: false,
      error: message,
    };
  }
}
