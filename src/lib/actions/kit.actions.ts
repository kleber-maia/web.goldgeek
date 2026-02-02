'use server';

import { prisma } from '@/lib/db';
import { KitService } from '@/lib/services/kit.service';
import { CustomerService } from '@/lib/services/customer.service';
import {
  appraisalRequestSchema,
  type AppraisalRequestInput,
} from '@/lib/validators/appraisal-request';
import { createMagicLink, createSession } from '@/lib/auth';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create an appraisal request (public - no auth required)
 * This also creates/finds the user and customer
 */
export async function createAppraisalRequest(
  data: AppraisalRequestInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validated = appraisalRequestSchema.parse(data);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: validated.customer.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: validated.customer.email,
          role: 'CUSTOMER',
        },
      });
    }

    // Find or create customer profile
    let customer = await CustomerService.getByUserId(user.id);

    if (!customer) {
      customer = await CustomerService.upsertProfile(user.id, {
        firstName: validated.customer.firstName,
        lastName: validated.customer.lastName,
        phone: validated.customer.phone,
        companyName: validated.customer.companyName,
      });
    }

    // Add shipping address if not exists
    const existingAddresses = await prisma.address.findMany({
      where: {
        customerId: customer.id,
        type: 'shipping',
      },
    });

    let shippingAddress;
    if (existingAddresses.length === 0) {
      shippingAddress = await CustomerService.addAddress(customer.id, {
        ...validated.shippingAddress,
        isDefault: true,
      });
    } else {
      shippingAddress = existingAddresses[0];
    }

    // Create kit
    const kit = await KitService.create({
      customerId: customer.id,
      type: validated.kitType,
      estimatedValue: validated.estimatedValue,
      notes: validated.notes,
      shippingAddress: {
        street1: validated.shippingAddress.street1,
        street2: validated.shippingAddress.street2,
        city: validated.shippingAddress.city,
        state: validated.shippingAddress.state,
        zipCode: validated.shippingAddress.zipCode,
        country: validated.shippingAddress.country || 'US',
      },
    });

    // Create magic link for authentication
    const token = await createMagicLink(validated.customer.email);
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

    // TODO: Send email with magic link and kit details

    return {
      success: true,
      data: {
        kit,
        magicLinkUrl: process.env.NODE_ENV === 'development' ? magicLinkUrl : undefined,
      },
    };
  } catch (error: any) {
    console.error('Error creating appraisal request:', error);
    return {
      success: false,
      error: error.message || 'Failed to create appraisal request',
    };
  }
}
