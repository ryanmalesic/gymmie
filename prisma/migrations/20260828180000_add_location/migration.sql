-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM (
    'ACTIVE',
    'CLOSED',
    'DRAFT',
    'ONBOARDING',
    'PAUSED',
    'PENDING',
    'REJECTED',
    'RESTRICTED',
    'SUSPENDED'
);

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM (
    'AQUATIC_CENTER',
    'BARRE_STUDIO',
    'BOUTIQUE_GYM',
    'BOXING_GYM',
    'CENTER',
    'CLIMBING_GYM',
    'COMBAT_GYM',
    'COMMERCIAL_GYM',
    'COMMUNITY_CENTER',
    'CROSSFIT_STUDIO',
    'GYM',
    'HOME_GYM',
    'HOTEL_GYM',
    'OTHER',
    'PILATES_STUDIO',
    'REHAB_CENTER',
    'SPIN_STUDIO',
    'STUDIO',
    'TRAINING_STUDIO',
    'UNIVERSITY_GYM',
    'YOGA_STUDIO'
);

-- CreateTable: location
CREATE TABLE "location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "LocationStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "LocationType" NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "location_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT
);

CREATE INDEX "location_ownerId_idx" ON "location"("ownerId");
CREATE INDEX "location_status_idx" ON "location"("status");
CREATE INDEX "location_type_idx" ON "location"("type");

CREATE TRIGGER assign_id
BEFORE INSERT ON "location"
FOR EACH ROW
EXECUTE FUNCTION assign_id();

-- CreateDistributedTable: location by id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'citus') THEN
    PERFORM create_distributed_table('location', 'id');
  END IF;
END $$;
