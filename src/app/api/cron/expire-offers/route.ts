import { NextResponse } from 'next/server';
import { OfferService } from '@/lib/services/offer.service';

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, expiredCount: await OfferService.markExpired() });
  } catch {
    return NextResponse.json({ error: 'Failed to expire offers' }, { status: 503 });
  }
}
export const GET = POST;
