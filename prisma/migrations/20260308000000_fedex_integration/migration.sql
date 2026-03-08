-- Add KIT_DELIVERY to ShippingLabelType enum
ALTER TYPE "ShippingLabelType" ADD VALUE 'KIT_DELIVERY';

-- Create CompanySettings table (singleton row, id = 'singleton')
CREATE TABLE "CompanySettings" (
    "id"        TEXT NOT NULL DEFAULT 'singleton',
    "name"      TEXT NOT NULL DEFAULT 'Gold Geek',
    "street1"   TEXT NOT NULL DEFAULT '',
    "street2"   TEXT,
    "city"      TEXT NOT NULL DEFAULT '',
    "state"     TEXT NOT NULL DEFAULT '',
    "zipCode"   TEXT NOT NULL DEFAULT '',
    "phone"     TEXT NOT NULL DEFAULT '',
    "email"     TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);
