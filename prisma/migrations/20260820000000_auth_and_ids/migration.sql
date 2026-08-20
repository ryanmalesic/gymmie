-- 1. Base32 Crockford Encoding Function
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

-- 2. Parameterless ID Generator
CREATE OR REPLACE FUNCTION generate_id()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  -- Epoch: 2026-08-01 00:00:00 UTC (1785542400000 ms)
  epoch_ms CONSTANT NUMERIC := 1785542400000;
  random_bits CONSTANT NUMERIC := 268435456; -- 2^28
  milliseconds NUMERIC;
  value NUMERIC;
  raw_query TEXT;
  tbl_matches TEXT[];
  tbl_name TEXT;
  prefix TEXT;
BEGIN
  raw_query := current_query();
  tbl_matches := regexp_matches(raw_query, '(?i)\bINSERT\s+INTO\s+(?:[a-zA-Z0-9_"]+\.)?"?([a-zA-Z0-9_]+)"?');

  IF tbl_matches IS NULL OR array_length(tbl_matches, 1) < 1 THEN
    RAISE EXCEPTION 'generate_id() could not infer caller table name from current query execution context';
  END IF;

  tbl_name := tbl_matches[1];
  prefix := lower(substr(tbl_name, 1, 1) || regexp_replace(substr(tbl_name, 2), '[aeiouAEIOU]', '', 'g'));

  milliseconds := floor(extract(EPOCH FROM clock_timestamp()) * 1000) - epoch_ms;

  IF milliseconds < 0 THEN
    RAISE EXCEPTION 'system clock is before the configured ID epoch';
  END IF;

  value := milliseconds * random_bits + floor(random() * random_bits);

  RETURN prefix || '_' || encode_base32_14(value);
END;
$$;

-- 3. Database Schema (Ordered: pkey -> fkey -> uidx, alphabetical within groups)
CREATE TABLE "user" (
  "id" VARCHAR(32) NOT NULL DEFAULT generate_id(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_email_uidx" UNIQUE ("email")
);

CREATE TABLE "session" (
  "id" VARCHAR(32) NOT NULL DEFAULT generate_id(),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" VARCHAR(32) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "session_token_uidx" UNIQUE ("token")
);

CREATE TABLE "account" (
  "id" VARCHAR(32) NOT NULL DEFAULT generate_id(),
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
  CONSTRAINT "account_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "account_providerId_accountId_uidx" UNIQUE ("providerId", "accountId")
);

CREATE TABLE "verification" (
  "id" VARCHAR(32) NOT NULL DEFAULT generate_id(),
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- 4. Non-Unique Indexes
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- 5. Conditional Citus Extension Support
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'citus') THEN
    PERFORM create_distributed_table('user', 'id');
    PERFORM create_distributed_table('session', 'userId', colocate_with => 'user');
    PERFORM create_distributed_table('account', 'userId', colocate_with => 'user');
    PERFORM create_reference_table('verification');
  END IF;
END $$;
