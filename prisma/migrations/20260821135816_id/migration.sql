-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateFunction: encode_base32_14
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

-- CreateFunction: id
CREATE OR REPLACE FUNCTION id()
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
  tbl_name := nullif(current_setting('gymmie.id_table', true), '');

  IF tbl_name IS NULL THEN
    raw_query := current_query();
    tbl_matches := regexp_matches(raw_query, '(?i)\bINSERT\s+INTO\s+(?:[a-zA-Z0-9_"]+\.)?"?([a-zA-Z0-9_]+)"?');

    IF tbl_matches IS NOT NULL AND array_length(tbl_matches, 1) >= 1 THEN
      tbl_name := tbl_matches[1];
    END IF;
  END IF;

  IF tbl_name IS NULL THEN
    RAISE EXCEPTION 'id() could not infer caller table name from current query execution context';
  END IF;

  prefix := lower(substr(tbl_name, 1, 1) || regexp_replace(substr(tbl_name, 2), '[aeiouAEIOU]', '', 'g'));

  milliseconds := floor(extract(EPOCH FROM clock_timestamp()) * 1000) - epoch_ms;

  IF milliseconds < 0 THEN
    RAISE EXCEPTION 'system clock is before the configured ID epoch';
  END IF;

  value := milliseconds * random_bits + floor(random() * random_bits);

  RETURN prefix || '_' || encode_base32_14(value);
END;
$$;

-- CreateFunction: assign_id
CREATE OR REPLACE FUNCTION assign_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    PERFORM set_config('gymmie.id_table', TG_TABLE_NAME, true);
    NEW.id := id();
  END IF;
  RETURN NEW;
END;
$$;
