BEGIN;
ALTER TABLE "ShippingLabel" ADD COLUMN "lastCarrierEventAt" TIMESTAMP(3);
CREATE TABLE "CarrierReceipt" (
  "id" TEXT PRIMARY KEY,
  "trackingNumber" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "NotificationOutbox" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "kind" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedUntil" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT
);
CREATE INDEX "NotificationOutbox_sentAt_nextAttemptAt_idx" ON "NotificationOutbox"("sentAt", "nextAttemptAt");
ALTER TABLE "CarrierReceipt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationOutbox" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "CarrierReceipt", "NotificationOutbox" FROM PUBLIC;
COMMIT;
