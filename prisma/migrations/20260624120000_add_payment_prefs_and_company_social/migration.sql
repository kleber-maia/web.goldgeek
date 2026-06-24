-- Columns present in schema.prisma but never captured in a migration
-- (originally introduced on the dev database via `prisma db push`).
-- Written idempotently so it is safe to apply to databases that already
-- have these columns.

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT,
ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT,
ADD COLUMN IF NOT EXISTS "supportEmail" TEXT,
ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "paymentPreferences" JSONB;
