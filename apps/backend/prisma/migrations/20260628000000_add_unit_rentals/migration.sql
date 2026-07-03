ALTER TABLE "listings"
ADD COLUMN "currentTenantId" TEXT,
ADD COLUMN "rentedSince" TIMESTAMP(3),
ADD COLUMN "rentedUntil" TIMESTAMP(3);

CREATE INDEX "listings_currentTenantId_idx" ON "listings"("currentTenantId");

ALTER TABLE "listings"
ADD CONSTRAINT "listings_currentTenantId_fkey"
FOREIGN KEY ("currentTenantId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
