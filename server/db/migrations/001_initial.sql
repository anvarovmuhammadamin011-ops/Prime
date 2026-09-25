CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'active',
    'completed',
    'cancelled',
    'expired',
    'no_show'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE session_status AS ENUM ('active', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL DEFAULT 'user',
  name varchar(80) NOT NULL,
  phone varchar(20) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  telegram_id varchar(64) UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_phone_format CHECK (phone ~ '^\+998[0-9]{9}$')
);

CREATE TABLE IF NOT EXISTS club_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  club_name varchar(40) NOT NULL,
  price_per_hour numeric(12, 2) NOT NULL,
  max_duration smallint NOT NULL,
  pc_count smallint NOT NULL,
  timezone varchar(64) NOT NULL DEFAULT 'Asia/Tashkent',
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_settings_singleton CHECK (id = 1),
  CONSTRAINT club_settings_price CHECK (price_per_hour >= 1000),
  CONSTRAINT club_settings_max_duration CHECK (max_duration BETWEEN 1 AND 12),
  CONSTRAINT club_settings_pc_count CHECK (pc_count BETWEEN 1 AND 20)
);

CREATE TABLE IF NOT EXISTS pcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pc_number smallint NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  price_per_hour numeric(12, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pcs_number_range CHECK (pc_number BETWEEN 1 AND 1000),
  CONSTRAINT pcs_price CHECK (price_per_hour >= 1000)
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pc_id uuid NOT NULL REFERENCES pcs(id) ON DELETE RESTRICT,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  duration_hours numeric(5, 1) NOT NULL,
  price_per_hour numeric(12, 2) NOT NULL,
  total_price numeric(12, 2) NOT NULL,
  access_code_hash text,
  access_code_ciphertext text,
  access_code_issued_at timestamptz,
  access_code_used_at timestamptz,
  arrival_choice smallint,
  arrival_confirmed_at timestamptz,
  arrival_due_at timestamptz,
  reminder_sent_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_time_range CHECK (end_at > start_at),
  CONSTRAINT bookings_duration_range CHECK (duration_hours > 0),
  CONSTRAINT bookings_price_range CHECK (price_per_hour >= 1000 AND total_price >= 1000),
  CONSTRAINT bookings_arrival_choice CHECK (arrival_choice IS NULL OR arrival_choice IN (5, 10)),
  CONSTRAINT bookings_access_code_used CHECK (access_code_used_at IS NULL OR access_code_hash IS NULL)
);

CREATE TABLE IF NOT EXISTS access_code_history (
  code_hash text PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  retired_reason varchar(30)
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  pc_id uuid NOT NULL REFERENCES pcs(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  started_by uuid REFERENCES users(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  ended_at timestamptz,
  status session_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sessions_time_range CHECK (ends_at > started_at)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  user_agent text,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminder_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  channel varchar(20) NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivery_status varchar(20) NOT NULL DEFAULT 'sent',
  error_message text,
  UNIQUE (booking_id, channel)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(80) NOT NULL,
  entity_type varchar(40) NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_access_code_unique
  ON bookings (access_code_hash)
  WHERE access_code_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_active_per_booking
  ON sessions (booking_id)
  WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_active_per_pc
  ON sessions (pc_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS bookings_user_start_idx
  ON bookings (user_id, start_at DESC);

CREATE INDEX IF NOT EXISTS bookings_pc_start_idx
  ON bookings (pc_id, start_at, end_at);

CREATE INDEX IF NOT EXISTS bookings_status_start_idx
  ON bookings (status, start_at);

CREATE INDEX IF NOT EXISTS sessions_active_end_idx
  ON sessions (ends_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx
  ON refresh_tokens (user_id, expires_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS club_settings_set_updated_at ON club_settings;
CREATE TRIGGER club_settings_set_updated_at
BEFORE UPDATE ON club_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS pcs_set_updated_at ON pcs;
CREATE TRIGGER pcs_set_updated_at
BEFORE UPDATE ON pcs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS bookings_set_updated_at ON bookings;
CREATE TRIGGER bookings_set_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_pc_no_overlap'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_pc_no_overlap
      EXCLUDE USING gist (
        pc_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
      )
      WHERE (status IN ('pending', 'approved', 'active'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_user_no_overlap'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_user_no_overlap
      EXCLUDE USING gist (
        user_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
      )
      WHERE (status IN ('pending', 'approved', 'active'));
  END IF;
END $$;

INSERT INTO club_settings (id, club_name, price_per_hour, max_duration, pc_count, timezone)
VALUES (1, 'Prime Game Club', 18000, 4, 20, 'Asia/Tashkent')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pcs (pc_number, active, price_per_hour)
SELECT numbers.pc_number, true, 18000
FROM generate_series(1, 20) AS numbers(pc_number)
ON CONFLICT (pc_number) DO UPDATE SET active = true, price_per_hour = EXCLUDED.price_per_hour;
