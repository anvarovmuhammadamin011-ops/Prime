import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { getConfig } from '../config.js'
import { createPool, withTransaction } from './client.js'

export async function seedDatabase(pool, config) {
  if (config.nodeEnv === 'production' && !config.demoSeedEnabled) {
    throw new Error('Demo seed production muhitida faqat DEMO_SEED_ENABLED=true bilan ishga tushiriladi')
  }
  const passwordHash = await bcrypt.hash(config.demoAdminPassword, 12)
  const demoUsers = [
    ['Abdulloh Karimov', '+998901234567', 'user', null],
    ['Muhammadamin', '+998902222222', 'user', '100000002'],
    ['Sardor Rahimov', '+998903333333', 'user', '100000003'],
    ['Prime Admin', '+998901111111', 'admin', '100000001'],
    ['Prime Superadmin', '+998900000000', 'superadmin', '100000004'],
  ]

  await withTransaction(pool, async (client) => {
    for (const [name, phone, role, telegramId] of demoUsers) {
      await client.query(
        `INSERT INTO users (name, phone, password_hash, role, telegram_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (phone) DO UPDATE SET
           name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           telegram_id = EXCLUDED.telegram_id`,
        [name, phone, passwordHash, role, telegramId],
      )
    }

    await client.query(
      `INSERT INTO club_settings (id, club_name, price_per_hour, max_duration, pc_count, timezone)
       VALUES (1, 'Prime Game Club', 18000, 4, 20, 'Asia/Tashkent')
       ON CONFLICT (id) DO UPDATE SET
         club_name = EXCLUDED.club_name,
         price_per_hour = EXCLUDED.price_per_hour,
         max_duration = EXCLUDED.max_duration,
         pc_count = EXCLUDED.pc_count,
         timezone = EXCLUDED.timezone`,
    )

    await client.query(
      `INSERT INTO pcs (pc_number, active, price_per_hour)
       SELECT numbers.pc_number, true, 18000
       FROM generate_series(1, 20) AS numbers(pc_number)
       ON CONFLICT (pc_number) DO UPDATE SET
         active = true,
         price_per_hour = EXCLUDED.price_per_hour`,
    )
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = getConfig()
  const pool = createPool(config)
  try {
    await seedDatabase(pool, config)
    console.log('Demo ma’lumotlari seed qilindi')
  } finally {
    await pool.end()
  }
}
