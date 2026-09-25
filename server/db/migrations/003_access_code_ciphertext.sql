ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS access_code_ciphertext text;
