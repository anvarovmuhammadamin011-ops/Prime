import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getConfig } from '../config.js'
import { createPool } from './client.js'

const migrationsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')
const migrationLockKey = 'prime-club-schema-migrations'

export async function runMigrations(pool) {
  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [migrationLockKey])
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort()
    const appliedResult = await client.query('SELECT version FROM schema_migrations')
    const applied = new Set(appliedResult.rows.map((row) => row.version))

    for (const file of files) {
      if (applied.has(file)) continue
      const sql = await readFile(path.join(migrationsDirectory, file), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file])
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }

    return files
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(hashtext($1))', [migrationLockKey])
    } finally {
      client.release()
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = getConfig()
  const pool = createPool(config)
  try {
    const files = await runMigrations(pool)
    console.log(`Migratsiyalar bajarildi: ${files.length}`)
  } finally {
    await pool.end()
  }
}
