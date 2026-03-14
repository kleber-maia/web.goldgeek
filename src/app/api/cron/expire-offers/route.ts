import { NextRequest, NextResponse } from 'next/server';
import { OfferService } from '@/lib/services/offer.service';
import { prisma } from '@/lib/db';
import { sendOfferExpiredEmail } from '@/lib/email';
import { ActivityService } from '@/lib/services/activity.service';

/**
 * Cron endpoint to expire overdue offers.
 *
 * Call via: POST /api/cron/expire-offers
 * Protected by CRON_SECRET header.
 *
 * For Vercel Cron, add to vercel.json:
 * { "crons": [{ "path": "/api/cron/expire-offers", "schedule": "0 0,6,12,18 * * *" }] }
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find offers that are SENT and past expiration before marking them
    const expiredOffers = await prisma.offer.findMany({
      where: {
        status: 'SENT',
        expiresAt: { lt: new Date() },
      },
      include: {
        kit: {
          include: {
            customer: true,
          },
        },
      },
    });

    // Mark them expired
    const count = await OfferService.markExpired();

    // Log activity and send emails for each expired offer
    for (const offer of expiredOffers) {
      await ActivityService.logEvent({
        kitId: offer.kitId,
        type: 'STATUS_CHANGED',
        title: 'Offer Expired',
        description: `Offer ${offer.offerNumber} has expired`,
        metadata: { offerId: offer.id },
      });

      // Send email to customer
      const email = offer.kit.customer?.email;
      if (email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://goldgeek.com';
        const kitUrl = `${appUrl}/account/kit/${offer.kitId}`;
        sendOfferExpiredEmail(
          email,
          offer.offerNumber,
          offer.kit.kitNumber,
          kitUrl,
        ).catch((err) => console.error('Failed to send offer expired email:', err));
      }
    }

    return NextResponse.json({
      success: true,
      expiredCount: count,
    });
  } catch (error) {
    console.error('Error expiring offers:', error);
    return NextResponse.json(
      { error: 'Failed to expire offers' },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
