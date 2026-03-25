-- Compact KitStatus: KIT_SENT + IN_TRANSIT → SHIPPED, RECEIVED merged into EVALUATING

-- Step 1: Add new SHIPPED value
ALTER TYPE "KitStatus" ADD VALUE IF NOT EXISTS 'SHIPPED';

-- Step 2: Migrate existing data
UPDATE "Kit" SET status = 'SHIPPED' WHERE status IN ('KIT_SENT', 'IN_TRANSIT');
UPDATE "Kit" SET status = 'EVALUATING', "evaluationStartAt" = COALESCE("evaluationStartAt", "receivedAt", NOW()) WHERE status = 'RECEIVED';

-- Step 3: Remove old enum values by recreating the enum
ALTER TABLE "Kit" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "KitStatus" RENAME TO "KitStatus_old";
CREATE TYPE "KitStatus" AS ENUM ('PENDING', 'SHIPPED', 'EVALUATING', 'OFFER_SENT', 'ACCEPTED', 'DECLINED', 'PAID', 'RETURNED', 'CANCELLED');
ALTER TABLE "Kit" ALTER COLUMN "status" TYPE "KitStatus" USING status::text::"KitStatus";
ALTER TABLE "Kit" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"KitStatus";
DROP TYPE "KitStatus_old";
