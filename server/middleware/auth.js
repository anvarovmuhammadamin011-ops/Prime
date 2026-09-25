import { AppError, asyncHandler } from '../utils/errors.js'
import { verifyAccessToken } from '../utils/crypto.js'
import { getUser } from '../services/auth-service.js'

export function createAuthenticate(pool, config) {
  return asyncHandler(async (request, _response, next) => {
    const header = request.get('authorization') || ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Autentifikatsiya talab qilinadi')
    }

    let payload
    try {
      payload = verifyAccessToken(token, config.jwt.secret)
    } catch {
      throw new AppError(401, 'INVALID_ACCESS_TOKEN', 'Access token yaroqsiz')
    }

    const user = await getUser(pool, payload.sub)
    if (!user) throw new AppError(401, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi')
    request.user = user
    request.auth = payload
    next()
  })
}

export function requireRoles(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Bu amalni bajarish huquqi yo‘q'))
    }
    next()
  }
}

export function getRequestMetadata(request) {
  return {
    userAgent: request.get('user-agent') || null,
    ipAddress: request.ip || request.socket?.remoteAddress || null,
  }
}
