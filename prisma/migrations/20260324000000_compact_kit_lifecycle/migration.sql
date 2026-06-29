-- Compact KitStatus: KIT_SENT + IN_TRANSIT → SHIPPED, RECEIVED merged into EVALUATING
--
-- Transaction-safe / portable rewrite: never adds an enum value and uses it in
-- the same transaction (Postgres error 55P04). Instead we recreate the enum
-- fresh (with SHIPPED) and remap the dropped values inline during the USING cast.

-- Step 1: RECEIVED → EVALUATING while RECEIVED is still a valid enum member.
UPDATE "Kit"
SET status = 'EVALUATING',
    "evaluationStartAt" = COALESCE("evaluationStartAt", "receivedAt", NOW())
WHERE status::text = 'RECEIVED';

-- Step 2: Recreate the enum without KIT_SENT / IN_TRANSIT / RECEIVED, with SHIPPED.
ALTER TABLE "Kit" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "KitStatus" RENAME TO "KitStatus_old";
CREATE TYPE "KitStatus" AS ENUM ('PENDING', 'SHIPPED', 'EVALUATING', 'OFFER_SENT', 'ACCEPTED', 'DECLINED', 'PAID', 'RETURNED', 'CANCELLED');

-- Step 3: Retype the column, mapping the now-removed KIT_SENT / IN_TRANSIT to SHIPPED.
ALTER TABLE "Kit" ALTER COLUMN "status" TYPE "KitStatus" USING (
  CASE status::text
    WHEN 'KIT_SENT' THEN 'SHIPPED'
    WHEN 'IN_TRANSIT' THEN 'SHIPPED'
    ELSE status::text
  END::"KitStatus"
);
ALTER TABLE "Kit" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"KitStatus";
DROP TYPE "KitStatus_old";
