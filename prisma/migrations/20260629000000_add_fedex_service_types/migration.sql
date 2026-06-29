-- Add per-direction FedEx service type to CompanySettings.
-- Valuable legs (inbound + return) default to air; kit delivery to ground.
-- Idempotent ADDs keep this safe to re-run across dev (Supabase) and prod (Neon).
ALTER TABLE "CompanySettings"
  ADD COLUMN IF NOT EXISTS "fedexValuableServiceType" TEXT NOT NULL DEFAULT 'PRIORITY_OVERNIGHT';

ALTER TABLE "CompanySettings"
  ADD COLUMN IF NOT EXISTS "fedexKitDeliveryServiceType" TEXT NOT NULL DEFAULT 'FEDEX_GROUND';
