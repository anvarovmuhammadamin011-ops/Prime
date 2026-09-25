import { AppError } from '../utils/errors.js'

export function notFoundHandler(request, _response, next) {
  next(new AppError(404, 'NOT_FOUND', `${request.method} ${request.originalUrl} topilmadi`))
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error)
    return
  }

  let normalized = error
  if (error?.name === 'ZodError') {
    normalized = new AppError(400, 'VALIDATION_ERROR', 'Ma’lumotlar to‘g‘ri emas', error.issues)
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    normalized = new AppError(400, 'INVALID_JSON', 'JSON ma’lumoti noto‘g‘ri')
  } else if (!(error instanceof AppError)) {
    normalized = new AppError(500, 'INTERNAL_ERROR', 'Kutilmagan server xatosi')
  }

  if (normalized.statusCode >= 500) {
    console.error(normalized.code, error)
  }

  response.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
    },
    requestId: request.id,
  })
}
