-- CreateTable: user
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_email_uidx" UNIQUE ("email")
);

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
