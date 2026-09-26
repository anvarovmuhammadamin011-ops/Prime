CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY DEFAULT (substr(lower(hex(randomblob(4))),1,8)||'-'||substr(lower(hex(randomblob(2))),1,4)||'-4'||substr(lower(hex(randomblob(2))),1,3)||'-a'||substr(lower(hex(randomblob(2))),1,3)||'-'||substr(lower(hex(randomblob(6))),1,12)),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  telegram_id text UNIQUE,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (length(name) <= 80),
  CHECK (phone GLOB '+998[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
);

CREATE TABLE IF NOT EXISTS club_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  club_name text NOT NULL,
  price_per_hour real NOT NULL,
  max_duration integer NOT NULL,
  pc_count integer NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Tashkent',
  updated_by text REFERENCES users(id) ON DELETE SET NULL,
  updated_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (price_per_hour >= 1000),
  CHECK (max_duration BETWEEN 1 AND 12),
  CHECK (pc_count BETWEEN 1 AND 20)
);

CREATE TABLE IF NOT EXISTS pcs (
  id text PRIMARY KEY DEFAULT (substr(lower(hex(randomblob(4))),1,8)||'-'||substr(lower(hex(randomblob(2))),1,4)||'-4'||substr(lower(hex(randomblob(2))),1,3)||'-a'||substr(lower(hex(randomblob(2))),1,3)||'-'||substr(lower(hex(randomblob(6))),1,12)),
  pc_number integer NOT NULL UNIQUE,
  active integer NOT NULL DEFAULT 1,
  price_per_hour real NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (pc_number BETWEEN 1 AND 1000),
  CHECK (price_per_hour >= 1000)
);

CREATE TABLE IF NOT EXISTS bookings (
  id text PRIMARY KEY DEFAULT (substr(lower(hex(randomblob(4))),1,8)||'-'||substr(lower(hex(randomblob(2))),1,4)||'-4'||substr(lower(hex(randomblob(2))),1,3)||'-a'||substr(lower(hex(randomblob(2))),1,3)||'-'||substr(lower(hex(randomblob(6))),1,12)),
  user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pc_id text NOT NULL REFERENCES pcs(id) ON DELETE RESTRICT,
  start_at text NOT NULL,
  end_at text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'expired', 'no_show')),
  duration_hours real NOT NULL,
  price_per_hour real NOT NULL,
  total_price real NOT NULL,
  access_code_hash text,
  access_code_ciphertext text,
  access_code_issued_at text,
  access_code_used_at text,
  arrival_choice integer,
  arrival_confirmed_at text,
  arrival_due_at text,
  reminder_sent_at text,
  approved_at text,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (end_at > start_at),
  CHECK (duration_hours > 0),
  CHECK (price_per_hour >= 1000 AND total_price >= 1000),
  CHECK (arrival_choice IS NULL OR arrival_choice IN (5, 10)),
  CHECK (access_code_used_at IS NULL OR access_code_hash IS NULL)
);

CREATE TABLE IF NOT EXISTS access_code_history (
  code_hash text PRIMARY KEY,
  booking_id text NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  issued_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  retired_at text,
  retired_reason text
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY DEFAULT (substr(lower(hex(randomblob(4))),1,8)||'-'||substr(lower(hex(randomblob(2))),1,4)||'-4'||substr(lower(hex(randomblob(2))),1,3)||'-a'||substr(lower(hex(randomblob(2))),1,3)||'-'||substr(lower(hex(randomblob(6))),1,12)),
  booking_id text NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  pc_id text NOT NULL REFERENCES pcs(id) ON DELETE RESTRICT,
  user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  started_by text REFERENCES users(id) ON DELETE SET NULL,
  started_at text NOT NULL,
  ends_at text NOT NULL,
  ended_at text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (ends_at > started_at)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id text PRIMARY KEY DEFAULT (substr(lower(hex(randomblob(4))),1,8)||'-'||substr(lower(hex(randomblob(2))),1,4)||'-4'||substr(lower(hex(randomblob(2))),1,3)||'-a'||substr(lower(hex(randomblob(2))),1,3)||'-'||substr(lower(hex(randomblob(6))),1,12)),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at text NOT NULL,
  revoked_at text,
  user_agent text,
  ip_address text,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS reminder_deliveries (
  id text PRIMARY KEY DEFAULT (substr(lower(hex(randomblob(4))),1,8)||'-'||substr(lower(hex(randomblob(2))),1,4)||'-4'||substr(lower(hex(randomblob(2))),1,3)||'-a'||substr(lower(hex(randomblob(2))),1,3)||'-'||substr(lower(hex(randomblob(6))),1,12)),
  booking_id text NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  channel text NOT NULL,
  sent_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  delivery_status text NOT NULL DEFAULT 'sent',
  error_message text,
  UNIQUE (booking_id, channel)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY DEFAULT (substr(lower(hex(randomblob(4))),1,8)||'-'||substr(lower(hex(randomblob(2))),1,4)||'-4'||substr(lower(hex(randomblob(2))),1,3)||'-a'||substr(lower(hex(randomblob(2))),1,3)||'-'||substr(lower(hex(randomblob(6))),1,12)),
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata text NOT NULL DEFAULT '{}',
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_access_code_unique ON bookings (access_code_hash) WHERE access_code_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_active_per_booking ON sessions (booking_id) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_active_per_pc ON sessions (pc_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS bookings_user_start_idx ON bookings (user_id, start_at DESC);
CREATE INDEX IF NOT EXISTS bookings_pc_start_idx ON bookings (pc_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS bookings_status_start_idx ON bookings (status, start_at);
CREATE INDEX IF NOT EXISTS sessions_active_end_idx ON sessions (ends_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id, expires_at);
CREATE INDEX IF NOT EXISTS access_code_history_booking_idx ON access_code_history (booking_id);

CREATE TRIGGER IF NOT EXISTS users_set_updated_at
BEFORE UPDATE ON users FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS club_settings_set_updated_at
BEFORE UPDATE ON club_settings FOR EACH ROW
BEGIN
  UPDATE club_settings SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS pcs_set_updated_at
BEFORE UPDATE ON pcs FOR EACH ROW
BEGIN
  UPDATE pcs SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS bookings_set_updated_at
BEFORE UPDATE ON bookings FOR EACH ROW
BEGIN
  UPDATE bookings SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

INSERT OR IGNORE INTO club_settings (id, club_name, price_per_hour, max_duration, pc_count, timezone)
VALUES (1, 'Prime Game Club', 18000, 4, 20, 'Asia/Tashkent');

WITH RECURSIVE series(pc_number) AS (
  SELECT 1 UNION ALL SELECT pc_number + 1 FROM series WHERE pc_number < 20
)
INSERT INTO pcs (pc_number, active, price_per_hour)
SELECT series.pc_number, 1, 18000 FROM series WHERE 1
ON CONFLICT (pc_number) DO UPDATE SET active = 1, price_per_hour = excluded.price_per_hour;
