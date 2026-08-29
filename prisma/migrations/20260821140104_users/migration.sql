-- CreateEnum
CREATE TYPE "StripeAccountStatus" AS ENUM (
    'ACTIVATED',
    'DISABLED',
    'PENDING',
    'RESTRICTED'
);

-- CreateTable: user
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'US',
    "timezone" TEXT DEFAULT 'America/New_York',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "stripeAccountId" TEXT,
    "stripeAccountStatus" "StripeAccountStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_email_uidx" UNIQUE ("email")
);

CREATE INDEX "user_stripeAccountId_idx" ON "user"("stripeAccountId");

CREATE TRIGGER assign_id
BEFORE INSERT ON "user"
FOR EACH ROW
EXECUTE FUNCTION assign_id();

-- CreateReferenceTable: user
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'citus') THEN
    PERFORM create_reference_table('user');
  END IF;
END $$;
