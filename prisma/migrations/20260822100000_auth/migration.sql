-- CreateTable: session
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_token_uidx" UNIQUE ("token"),
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE INDEX "session_userId_idx" ON "session"("userId");

CREATE TRIGGER assign_id
BEFORE INSERT ON "session"
FOR EACH ROW
EXECUTE FUNCTION assign_id();

-- CreateDistributedTable: session by userId
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'citus') THEN
    PERFORM create_distributed_table('session', 'userId');
  END IF;
END $$;

-- CreateTable: account
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "account_issuer_accountId_uidx" UNIQUE ("issuer", "accountId"),
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE INDEX "account_userId_idx" ON "account"("userId");

CREATE TRIGGER assign_id
BEFORE INSERT ON "account"
FOR EACH ROW
EXECUTE FUNCTION assign_id();

-- CreateDistributedTable: account by userId
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'citus') THEN
    PERFORM create_distributed_table('account', 'userId');
  END IF;
END $$;

-- CreateTable: verification
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

CREATE TRIGGER assign_id
BEFORE INSERT ON "verification"
FOR EACH ROW
EXECUTE FUNCTION assign_id();

-- CreateReferenceTable: verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'citus') THEN
    PERFORM create_reference_table('verification');
  END IF;
END $$;
