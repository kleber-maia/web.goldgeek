import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { PaymentDetailsService } from '../src/lib/services/payment-details.service';
import { z } from 'zod';

// Development-only rollout. Prints counts, never account details or environment values.
async function main() {
  const host = new URL(process.env.DATABASE_URL || '').hostname;
  if (!host.startsWith('ep-sweet-mountain-') && !(host === '127.0.0.1' && process.env.NODE_ENV === 'test')) throw new Error('This script only supports the development or isolated test database.');
  const apply = process.argv.includes('--apply');
  const counts = { customers: 0, payments: 0, invalid: 0 };
  let cursor: string | undefined;
  do {
    const rows = await prisma.customer.findMany({ take: 100, orderBy: { id: 'asc' }, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), select: { id: true, paymentPreferences: true, updatedAt: true } });
    for (const row of rows) {
      if (!row.paymentPreferences) continue;
      const value = z.object({ method: z.string(), accountInfo: z.record(z.string(), z.string()) }).safeParse(row.paymentPreferences);
      if (!value.success) continue;
      counts.customers++;
      if (apply) await prisma.customer.update({ where: { id: row.id, updatedAt: row.updatedAt }, data: { paymentPreferences: { method: value.data.method, accountInfo: PaymentDetailsService.encrypt(value.data.accountInfo) } } });
    }
    cursor = rows.length === 100 ? rows[rows.length - 1].id : undefined;
  } while (cursor);
  do {
    const rows = await prisma.payment.findMany({ take: 100, orderBy: { id: 'asc' }, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), select: { id: true, accountInfo: true, updatedAt: true } });
    for (const row of rows) {
      if (!row.accountInfo) continue;
      const value = z.record(z.string(), z.string()).safeParse(row.accountInfo);
      if (!value.success) continue;
      counts.payments++;
      if (apply) await prisma.payment.update({ where: { id: row.id, updatedAt: row.updatedAt }, data: { accountInfo: PaymentDetailsService.encrypt(value.data) } });
    }
    cursor = rows.length === 100 ? rows[rows.length - 1].id : undefined;
  } while (cursor);
  process.stdout.write(`${apply ? 'Encrypted' : 'Dry run'}: ${JSON.stringify(counts)}\n`);
}
main().catch(() => { process.stderr.write('Payment encryption stopped. No sensitive details were logged.\n'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
