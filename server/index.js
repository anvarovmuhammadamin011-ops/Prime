import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { getConfig } from './config.js'
import { assertSchema, createPool } from './db/client.js'
import { startExpirationWorker } from './worker.js'

export async function startServer({ config = getConfig(), pool = createPool(config) } = {}) {
  try {
    await assertSchema(pool)
  } catch (error) {
    await pool.end()
    throw error
  }
  const app = createApp({ pool, config })
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(config.port, () => resolve(instance))
    instance.once('error', reject)
  })
  const stopWorker = config.runExpirationWorker
    ? startExpirationWorker(pool, config.autoExpireIntervalMs)
    : () => {}
  let stopped = false
  const stop = async () => {
    if (stopped) return
    stopped = true
    stopWorker()
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    await pool.end()
  }
  return { app, server, pool, stop, config }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const instance = await startServer()
  console.log(`Prime Club API ${instance.config?.nodeEnv || 'server'} rejimida ishga tushdi`)
  const shutdown = async () => {
    await instance.stop()
    process.exit(0)
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}
