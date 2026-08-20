CREATE OR REPLACE FUNCTION encode_base32_14(n NUMERIC)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  alphabet CONSTANT TEXT := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  encoded TEXT := '';
  remainder INTEGER;
  digit_position INTEGER;
  value NUMERIC := n;
BEGIN
  IF value < 0 OR value <> trunc(value) OR value >= power(32::NUMERIC, 14) THEN
    RAISE EXCEPTION 'value must fit in 14 Crockford Base32 characters';
  END IF;

  FOR digit_position IN 1..14 LOOP
    remainder := mod(value, 32)::INTEGER;
    encoded := substr(alphabet, remainder + 1, 1) || encoded;
    value := trunc(value / 32);
  END LOOP;

  RETURN encoded;
END;
$$;

CREATE OR REPLACE FUNCTION generate_id(p_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
STRICT
AS $$
DECLARE
  epoch_ms CONSTANT NUMERIC := 1704067200000;
  random_bits CONSTANT NUMERIC := 268435456;
  milliseconds NUMERIC;
  value NUMERIC;
BEGIN
  IF p_prefix = '' THEN
    RAISE EXCEPTION 'ID prefix cannot be empty';
  END IF;

  milliseconds := floor(extract(EPOCH FROM clock_timestamp()) * 1000) - epoch_ms;

  IF milliseconds < 0 THEN
    RAISE EXCEPTION 'system clock is before the configured ID epoch';
  END IF;

  value := milliseconds * random_bits + floor(random() * random_bits);

  RETURN p_prefix || '_' || encode_base32_14(value);
END;
$$;

CREATE TABLE "user" (
  "id" VARCHAR(32) NOT NULL DEFAULT generate_id('usr'),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session" (
  "id" VARCHAR(32) NOT NULL DEFAULT generate_id('ssn'),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" VARCHAR(32) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account" (
  "id" VARCHAR(32) NOT NULL DEFAULT generate_id('acct'),
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" VARCHAR(32) NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification" (
  "id" VARCHAR(32) NOT NULL DEFAULT generate_id('vrf'),
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

ALTER TABLE "session"
  ADD CONSTRAINT "session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "account"
  ADD CONSTRAINT "account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
