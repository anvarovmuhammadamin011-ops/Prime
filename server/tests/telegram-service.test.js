import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyTelegramInitData } from '../services/telegram-service.js'

const botToken = '123456:TEST-TOKEN'
const now = new Date('2026-09-25T10:00:00.000Z')

function createInitData(authDate = Math.floor(now.getTime() / 1000)) {
  const values = new URLSearchParams({
    auth_date: String(authDate),
    query_id: 'test-query',
    user: JSON.stringify({ id: 987654321, first_name: 'Ali', username: 'ali_test' }),
  })
  const checkString = [...values.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = crypto.createHmac('sha256', secret).update(checkString).digest('hex')
  return `${values.toString()}&hash=${hash}`
}

const options = {
  botToken,
  authMaxAgeSeconds: 86_400,
  authClockSkewSeconds: 60,
}

describe('Telegram init data validation', () => {
  it('accepts a valid signed init data payload', () => {
    const result = verifyTelegramInitData(createInitData(), options, now)
    expect(result.telegramId).toBe('987654321')
    expect(result.username).toBe('ali_test')
  })

  it('rejects a modified payload', () => {
    const raw = createInitData().replace('Ali', 'Veli')
    expect(() => verifyTelegramInitData(raw, options, now)).toThrow('init data yaroqsiz')
  })

  it('rejects expired init data', () => {
    const authDate = Math.floor(now.getTime() / 1000) - options.authMaxAgeSeconds - 1
    expect(() => verifyTelegramInitData(createInitData(authDate), options, now)).toThrow('init data yaroqsiz')
  })

  it('rejects duplicate keys', () => {
    const raw = `${createInitData()}&auth_date=1`
    expect(() => verifyTelegramInitData(raw, options, now)).toThrow('init data yaroqsiz')
  })
})
