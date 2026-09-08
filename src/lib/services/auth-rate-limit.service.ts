import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db';

export class AuthRateLimitService {
  static async allow(identity: string, maximum: number): Promise<boolean> {
    const key = createHash('sha256').update(identity).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "AuthRequestLimit" ("key", "count", "expiresAt")
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "AuthRequestLimit"."expiresAt" <= ${now} THEN 1 ELSE "AuthRequestLimit"."count" + 1 END,
        "expiresAt" = CASE WHEN "AuthRequestLimit"."expiresAt" <= ${now} THEN ${expiresAt} ELSE "AuthRequestLimit"."expiresAt" END
      RETURNING "count"`;
    return rows[0].count <= maximum;
  }
}
