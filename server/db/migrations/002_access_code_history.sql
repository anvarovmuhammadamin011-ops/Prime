CREATE TABLE IF NOT EXISTS access_code_history (
  code_hash text PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  retired_reason varchar(30)
);

CREATE INDEX IF NOT EXISTS access_code_history_booking_idx
  ON access_code_history (booking_id);

INSERT INTO pcs (pc_number, active, price_per_hour)
SELECT numbers.pc_number, true, 18000
FROM generate_series(1, 20) AS numbers(pc_number)
ON CONFLICT (pc_number) DO UPDATE SET active = true, price_per_hour = EXCLUDED.price_per_hour;
