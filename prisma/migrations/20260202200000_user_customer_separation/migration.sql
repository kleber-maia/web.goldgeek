-- User/Customer Separation Migration
-- This migration separates User (admins only) from Customer (independent with email)

-- Step 1: Add email column to Customer as nullable first
ALTER TABLE "Customer" ADD COLUMN "email" TEXT;

-- Step 2: Copy emails from User to Customer for existing customers
UPDATE "Customer" c
SET "email" = u."email"
FROM "User" u
WHERE c."userId" = u."id";

-- Step 3: Make email column required and unique
ALTER TABLE "Customer" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- Step 4: Create CustomerMagicLink table
CREATE TABLE "CustomerMagicLink" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerMagicLink_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create indexes for CustomerMagicLink
CREATE UNIQUE INDEX "CustomerMagicLink_token_key" ON "CustomerMagicLink"("token");
CREATE INDEX "CustomerMagicLink_token_idx" ON "CustomerMagicLink"("token");
CREATE INDEX "CustomerMagicLink_customerId_idx" ON "CustomerMagicLink"("customerId");

-- Step 6: Add foreign key for CustomerMagicLink
ALTER TABLE "CustomerMagicLink" ADD CONSTRAINT "CustomerMagicLink_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Migrate magic links from CUSTOMER users to CustomerMagicLink
INSERT INTO "CustomerMagicLink" ("id", "customerId", "token", "expiresAt", "usedAt", "createdAt")
SELECT ml."id", c."id", ml."token", ml."expiresAt", ml."usedAt", ml."createdAt"
FROM "MagicLink" ml
JOIN "User" u ON ml."userId" = u."id"
JOIN "Customer" c ON c."userId" = u."id"
WHERE u."role" = 'CUSTOMER';

-- Step 8: Delete magic links for CUSTOMER users (they're now in CustomerMagicLink)
DELETE FROM "MagicLink" ml
USING "User" u
WHERE ml."userId" = u."id" AND u."role" = 'CUSTOMER';

-- Step 9: Delete CUSTOMER users from User table (they're now independent in Customer)
DELETE FROM "User" WHERE "role" = 'CUSTOMER';

-- Step 10: Drop the role column from User (no longer needed, all Users are admins)
ALTER TABLE "User" DROP COLUMN "role";

-- Step 11: Drop the userId index and foreign key from Customer
DROP INDEX IF EXISTS "Customer_userId_idx";
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_userId_fkey";

-- Step 12: Drop the userId column from Customer
ALTER TABLE "Customer" DROP COLUMN "userId";

-- Step 13: Create new email index on Customer
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- Step 14: Drop the UserRole enum type (no longer used)
DROP TYPE IF EXISTS "UserRole";
