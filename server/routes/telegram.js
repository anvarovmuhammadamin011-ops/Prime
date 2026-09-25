import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { AppError, asyncHandler } from '../utils/errors.js'
import { createAuthenticate, getRequestMetadata } from '../middleware/auth.js'
import {
  isValidTelegramWebhookSecret,
  linkTelegramAccount,
  loginWithTelegram,
  sendTelegramMessage,
  unlinkTelegramAccount,
} from '../services/telegram-service.js'

const initDataSchema = z.object({ initData: z.string().trim().min(1).max(32_768) })
const linkSchema = initDataSchema.extend({
  phone: z.string().min(1),
  password: z.string().min(1).max(128),
})
const unlinkSchema = z.object({ password: z.string().min(1).max(128) })
const updateSchema = z.object({
  update_id: z.number().int().optional(),
  message: z.object({
    text: z.string().max(4096).optional(),
    from: z.object({ id: z.union([z.number().int(), z.string().regex(/^\d+$/)]).optional() }).optional(),
    chat: z.object({ id: z.union([z.number().int(), z.string().regex(/^\d+$/)]) }).optional(),
  }).optional(),
}).passthrough()

function telegramConfig(config) {
  return config?.telegram || {}
}

function assertEnabled(config) {
  const telegram = telegramConfig(config)
  if (!telegram.enabled || !telegram.botToken) {
    throw new AppError(404, 'TELEGRAM_DISABLED', 'Telegram integratsiyasi yoqilgan')
  }
}

export function createTelegramRouter(pool, config) {
  const router = Router()
  const authenticate = createAuthenticate(pool, config)
  const createLimiter = (limit, windowMs) => rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Juda ko‘p urinish. Keyinroq qayta yuboring' } },
  })
  const sessionLimiter = createLimiter(60, 15 * 60 * 1000)
  const linkLimiter = createLimiter(10, 15 * 60 * 1000)
  const unlinkLimiter = createLimiter(10, 15 * 60 * 1000)
  const webhookLimiter = createLimiter(120, 60 * 1000)

  router.post(
    '/session',
    sessionLimiter,
    asyncHandler(async (request, response) => {
      const input = initDataSchema.parse(request.body)
      const result = await loginWithTelegram(pool, config, input.initData, getRequestMetadata(request))
      response.json(result)
    }),
  )

  router.post(
    '/link',
    linkLimiter,
    asyncHandler(async (request, response) => {
      const input = linkSchema.parse(request.body)
      const result = await linkTelegramAccount(pool, config, input, getRequestMetadata(request))
      response.json(result)
    }),
  )

  router.post(
    '/unlink',
    unlinkLimiter,
    authenticate,
    asyncHandler(async (request, response) => {
      const input = unlinkSchema.parse(request.body)
      const result = await unlinkTelegramAccount(pool, config, request.user.id, input.password)
      response.json(result)
    }),
  )

  router.post(
    '/webhook',
    webhookLimiter,
    asyncHandler(async (request, response) => {
      assertEnabled(config)
      const telegram = telegramConfig(config)
      if (!isValidTelegramWebhookSecret(request.get('x-telegram-bot-api-secret-token'), telegram.webhookSecret)) {
        throw new AppError(401, 'INVALID_TELEGRAM_WEBHOOK_SECRET', 'Telegram webhook imzosi yaroqsiz')
      }

      const update = updateSchema.parse(request.body)
      const message = update.message
      if (message?.text && /^\/start(?:@[a-zA-Z0-9_]+)?(?:\s|$)/.test(message.text) && message.chat?.id) {
        try {
          const userName = message.from?.first_name || 'do\'st'
          await sendTelegramMessage(
            config,
            message.chat.id,
            `Salom, ${userName}! 👋\n\nXush kelibsiz, <b>Prime Game Club</b> botiga!\n\nBu yerda siz:\n🎮 Kompyuterlarni band qilishingiz\n⏱ Vaqtni kuzatishingiz\n📱 Telegram orqali oson ro'yxatdan o'tishingiz mumkin.\n\nQuyidagi tugmani bosib Mini Appni oching va o'ynashni boshlang!`,
            telegram.miniAppUrl
              ? {
                  reply_markup: {
                    inline_keyboard: [[{ text: '🎮 Prime Game Club ochish', web_app: { url: telegram.miniAppUrl } }]],
                  },
                  parse_mode: 'HTML',
                }
              : { parse_mode: 'HTML' },
          )
        } catch {
          console.error('Telegram webhook command failed')
        }
      }
      response.json({ ok: true })
    }),
  )

  return router
}
