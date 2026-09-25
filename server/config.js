import 'dotenv/config'
import { z } from 'zod'

const booleanValue = z
  .string()
  .optional()
  .transform((value) => value === 'true' || value === '1')

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
)

const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional(),
)

const optionalSecret = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(16).optional(),
)

const nodeEnvironment = z.preprocess(
  (value) => (typeof value === 'string' ? (value.trim().toLowerCase() || undefined) : value),
  z.enum(['development', 'test', 'production']).default('development'),
)

const environmentSchema = z.object({
  NODE_ENV: nodeEnvironment,
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgres://prime:prime@localhost:5432/prime_club'),
  DB_SSL: booleanValue,
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  JWT_SECRET: z.string().min(32).default('prime-club-development-jwt-secret-change-me'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  ACCESS_CODE_PEPPER: z.string().min(32).default('prime-club-development-access-pepper-change-me'),
  CORS_ORIGIN: z.string().default('http://localhost:5173').transform((value) => value.trim() || 'http://localhost:5173'),
  TRUST_PROXY: booleanValue,
  AUTO_EXPIRE_INTERVAL_MS: z.coerce.number().int().min(1000).default(30000),
  RUN_EXPIRATION_WORKER: booleanValue.default(true),
  DB_SSL_CA: z.string().optional(),
  DEMO_ADMIN_PASSWORD: z.string().min(8).default('demo12345'),
  TELEGRAM_ENABLED: booleanValue.default(false),
  TELEGRAM_BOT_TOKEN: optionalString,
  TELEGRAM_BOT_USERNAME: optionalString,
  TELEGRAM_MINI_APP_URL: optionalUrl,
  TELEGRAM_WEBHOOK_SECRET: optionalSecret,
  TELEGRAM_WEBHOOK_URL: optionalUrl,
  TELEGRAM_AUTH_MAX_AGE_SECONDS: z.coerce.number().int().min(300).max(86_400).default(86_400),
  TELEGRAM_AUTH_CLOCK_SKEW_SECONDS: z.coerce.number().int().min(0).max(300).default(60),
})

function isPlaceholderSecret(value) {
  return ['development', 'change-me', 'replace-with'].some((marker) => value.toLowerCase().includes(marker))
}

export function getConfig(environment = process.env) {
  const values = environmentSchema.parse(environment)
  if (values.NODE_ENV === 'production') {
    if (isPlaceholderSecret(values.JWT_SECRET)) {
      throw new Error('Production uchun real JWT_SECRET talab qilinadi')
    }
    if (isPlaceholderSecret(values.ACCESS_CODE_PEPPER)) {
      throw new Error('Production uchun real ACCESS_CODE_PEPPER talab qilinadi')
    }
    if (!values.DB_SSL) {
      throw new Error('Production uchun DB_SSL=true talab qilinadi')
    }
    if (values.TELEGRAM_ENABLED) {
      if (!values.TELEGRAM_BOT_TOKEN) {
        throw new Error('Telegram enabled bo‘lganda TELEGRAM_BOT_TOKEN talab qilinadi')
      }
      if (!values.TELEGRAM_WEBHOOK_SECRET) {
        throw new Error('Telegram enabled bo‘lganda TELEGRAM_WEBHOOK_SECRET talab qilinadi')
      }
    }
  }

  const corsOrigins = values.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)

  return {
    nodeEnv: values.NODE_ENV,
    port: values.PORT,
    database: {
      url: values.DATABASE_URL,
      ssl: values.DB_SSL ? { rejectUnauthorized: true, ca: values.DB_SSL_CA || undefined } : undefined,
      max: values.DB_POOL_MAX,
    },
    jwt: {
      secret: values.JWT_SECRET,
      accessTtl: values.JWT_ACCESS_TTL,
      refreshTtlDays: values.REFRESH_TOKEN_TTL_DAYS,
    },
    accessCodePepper: values.ACCESS_CODE_PEPPER,
    corsOrigins: corsOrigins.length > 0 ? corsOrigins : ['http://localhost:5173'],
    trustProxy: values.TRUST_PROXY,
    autoExpireIntervalMs: values.AUTO_EXPIRE_INTERVAL_MS,
    runExpirationWorker: values.RUN_EXPIRATION_WORKER,
    demoAdminPassword: values.DEMO_ADMIN_PASSWORD,
    telegram: {
      enabled: values.TELEGRAM_ENABLED,
      botToken: values.TELEGRAM_BOT_TOKEN || null,
      botUsername: values.TELEGRAM_BOT_USERNAME || null,
      miniAppUrl: values.TELEGRAM_MINI_APP_URL || null,
      webhookSecret: values.TELEGRAM_WEBHOOK_SECRET || null,
      webhookUrl: values.TELEGRAM_WEBHOOK_URL || null,
      authMaxAgeSeconds: values.TELEGRAM_AUTH_MAX_AGE_SECONDS,
      authClockSkewSeconds: values.TELEGRAM_AUTH_CLOCK_SKEW_SECONDS,
    },
  }
}
