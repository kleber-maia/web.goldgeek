CREATE TABLE "ShippingOperation" (
  "id" TEXT PRIMARY KEY,
  "kitId" TEXT NOT NULL REFERENCES "Kit"("id") ON DELETE CASCADE,
  "type" "ShippingLabelType" NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'STARTED',
  "result" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ShippingOperation_status_updatedAt_idx" ON "ShippingOperation"("status", "updatedAt");
ALTER TABLE "ShippingOperation" ENABLE ROW LEVEL SECURITY;
