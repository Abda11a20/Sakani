-- Repair only bed-listing availability from the actual listing_beds statuses.
-- Contracts, tenants, and bed rows are not changed by this migration. Listing
-- status is reconciled only between active and rented; all other statuses stay
-- untouched.
WITH bed_availability AS (
  SELECT
    l."id" AS "listingId",
    COUNT(b."id") FILTER (WHERE b."status" = 'available')::INTEGER AS "availableBeds"
  FROM "listings" AS l
  LEFT JOIN "listing_beds" AS b ON b."listingId" = l."id"
  WHERE l."unitType" = 'bed'
  GROUP BY l."id"
)
UPDATE "listings" AS l
SET
  "availableBeds" = a."availableBeds",
  "status" = CASE
    WHEN l."status" = 'active' AND a."availableBeds" = 0 THEN 'rented'::"ListingStatus"
    WHEN l."status" = 'rented' AND a."availableBeds" > 0 THEN 'active'::"ListingStatus"
    ELSE l."status"
  END
FROM bed_availability AS a
WHERE l."id" = a."listingId";
