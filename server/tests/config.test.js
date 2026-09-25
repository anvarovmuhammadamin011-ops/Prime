import fs from 'node:fs'
import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { getConfig } from '../config.js'

describe('server configuration', () => {
  it('uses development defaults without production-only checks', () => {
    const config = getConfig({})
    expect(config.nodeEnv).toBe('development')
    expect(config.database.ssl).toBeUndefined()
    expect(config.runExpirationWorker).toBe(true)
  })

  it('accepts the shipped environment example', () => {
    const environment = dotenv.parse(fs.readFileSync(new URL('../../.env.example', import.meta.url)))
    expect(() => getConfig(environment)).not.toThrow()
  })

  it('rejects placeholder production secrets', () => {
    expect(() => getConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'replace-with-a-long-random-secret',
      ACCESS_CODE_PEPPER: 'replace-with-a-long-random-pepper',
      DB_SSL: 'true',
    })).toThrow('real JWT_SECRET')
  })

  it('treats empty optional environment values as unset', () => {
    const config = getConfig({
      CORS_ORIGIN: '',
      TELEGRAM_MINI_APP_URL: '',
      TELEGRAM_WEBHOOK_SECRET: '',
      TELEGRAM_WEBHOOK_URL: '',
    })
    expect(config.corsOrigins).toEqual(['http://localhost:5173'])
    expect(config.telegram.miniAppUrl).toBeNull()
    expect(config.telegram.webhookSecret).toBeNull()
    expect(config.telegram.webhookUrl).toBeNull()
  })

  it('requires a Telegram webhook secret when Telegram is enabled in production', () => {
    expect(() => getConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'a'.repeat(32),
      ACCESS_CODE_PEPPER: 'p'.repeat(32),
      DB_SSL: 'true',
      TELEGRAM_ENABLED: 'true',
      TELEGRAM_BOT_TOKEN: '123:token',
    })).toThrow('TELEGRAM_WEBHOOK_SECRET')
  })

  it('requires verified database TLS in production', () => {
    expect(() => getConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'a'.repeat(32),
      ACCESS_CODE_PEPPER: 'p'.repeat(32),
      DB_SSL: 'false',
    })).toThrow('DB_SSL=true')
  })
})
