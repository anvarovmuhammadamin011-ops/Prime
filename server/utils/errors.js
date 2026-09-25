export class AppError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)
}

export function notFound(message = 'Resurs topilmadi') {
  return new AppError(404, 'NOT_FOUND', message)
}
