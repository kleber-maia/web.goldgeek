-- AlterTable
ALTER TABLE "Kit" ALTER COLUMN "type" SET DEFAULT 'DIGITAL';

-- =========================================================================
-- Ensure PostgREST roles exist before REVOKEing from them.
-- On Supabase these roles preexist; on Neon / plain Postgres they don't,
-- so create them as inert NOLOGIN roles. Makes this migration portable.
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

-- =========================================================================
-- Enable Row Level Security on all tables
-- The postgres role (table owner, used by Prisma) bypasses RLS automatically.
-- With no permissive policies, anon/authenticated roles see zero rows.
-- =========================================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MagicLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerMagicLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Kit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Offer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Return" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShippingLabel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimelineEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanySettings" ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- Revoke ALL privileges from PostgREST roles on existing tables
-- =========================================================================

REVOKE ALL ON TABLE "User" FROM anon, authenticated;
REVOKE ALL ON TABLE "MagicLink" FROM anon, authenticated;
REVOKE ALL ON TABLE "Customer" FROM anon, authenticated;
REVOKE ALL ON TABLE "CustomerMagicLink" FROM anon, authenticated;
REVOKE ALL ON TABLE "Address" FROM anon, authenticated;
REVOKE ALL ON TABLE "Kit" FROM anon, authenticated;
REVOKE ALL ON TABLE "Item" FROM anon, authenticated;
REVOKE ALL ON TABLE "Offer" FROM anon, authenticated;
REVOKE ALL ON TABLE "Payment" FROM anon, authenticated;
REVOKE ALL ON TABLE "Return" FROM anon, authenticated;
REVOKE ALL ON TABLE "ShippingLabel" FROM anon, authenticated;
REVOKE ALL ON TABLE "TimelineEvent" FROM anon, authenticated;
REVOKE ALL ON TABLE "CompanySettings" FROM anon, authenticated;

-- =========================================================================
-- Prevent future tables/sequences/functions from being auto-exposed
-- =========================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated;
