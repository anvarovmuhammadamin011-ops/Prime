import { fileURLToPath } from 'node:url'
import { assertSchema, createPool } from './db/client.js'
import { getConfig } from './config.js'
import { expireState } from './services/booking-service.js'

export function startExpirationWorker(pool, intervalMs = 30_000) {
  let running = false
  const run = async () => {
    if (running) return
    running = true
    try {
      await assertSchema(pool)
      await expireState(pool)
    } catch (error) {
      console.error('Auto-expire worker failed', error)
    } finally {
      running = false
    }
  }

  const timer = setInterval(run, intervalMs)
  timer.unref()
  void run()
  return () => clearInterval(timer)
}

export async function startWorker() {
  const config = getConfig()
  const pool = createPool(config)
  const stop = startExpirationWorker(pool, config.autoExpireIntervalMs)
  const close = async () => {
    stop()
    await pool.end()
  }
  process.once('SIGINT', close)
  process.once('SIGTERM', close)
  return { pool, stop: close }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await startWorker()
  console.log('Auto-expire worker ishga tushdi')
}
