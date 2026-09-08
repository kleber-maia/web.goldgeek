import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification.service';

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await NotificationService.drain();
    return NextResponse.json(result, { status: result.failed ? 503 : 200 });
  } catch {
    return NextResponse.json({ error: 'Notification processing failed' }, { status: 503 });
  }
}

export const GET = POST;
