-- CreateIndex
CREATE INDEX IF NOT EXISTS "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "viewing_requests_tenantId_idx" ON "viewing_requests"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "viewing_requests_listingId_idx" ON "viewing_requests"("listingId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "listing_images_listingId_idx" ON "listing_images"("listingId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_listingId_idx" ON "reviews"("listingId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_landlordId_idx" ON "reviews"("landlordId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_tenantId_idx" ON "reviews"("tenantId");
