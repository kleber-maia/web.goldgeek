'use server';

import { prisma } from '@/lib/db';
import { KitService } from '@/lib/services/kit.service';
import { CustomerService } from '@/lib/services/customer.service';
import {
  appraisalRequestSchema,
  type AppraisalRequestInput,
} from '@/lib/validators/appraisal-request';
import { createMagicLink } from '@/lib/auth';

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
): Promise<ActionResult> {
  try {
    // Validate input
    const validated = appraisalRequestSchema.parse(data);
    const normalizedEmail = validated.customer.email.toLowerCase().trim();

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
      include: { addresses: true },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: normalizedEmail,
          firstName: validated.customer.firstName,
          lastName: validated.customer.lastName,
          phone: validated.customer.phone,
          companyName: validated.customer.companyName,
        },
        include: { addresses: true },
      });
    } else {
      // Update customer profile if needed
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          firstName: validated.customer.firstName || customer.firstName,
          lastName: validated.customer.lastName || customer.lastName,
          phone: validated.customer.phone || customer.phone,
          companyName: validated.customer.companyName || customer.companyName,
        },
        include: { addresses: true },
      });
    }

    // Add shipping address if not exists
    const existingAddresses = customer.addresses.filter(
      (addr) => addr.type === 'shipping'
    );

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
    const result = await createMagicLink(normalizedEmail);
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${result.token}`;

    // TODO: Send email with magic link and kit details

    return {
      success: true,
      data: {
        kit,
        magicLinkUrl: process.env.NODE_ENV === 'development' ? magicLinkUrl : undefined,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create appraisal request';
    console.error('Error creating appraisal request:', error);
    return {
      success: false,
      error: message,
    };
  }
}
