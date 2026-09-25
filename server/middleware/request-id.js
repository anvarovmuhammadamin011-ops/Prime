import { randomUUID } from 'node:crypto'

export function requestId(request, response, next) {
  const incoming = request.get('x-request-id')
  request.id = incoming && incoming.length <= 100 ? incoming : randomUUID()
  response.set('x-request-id', request.id)
  next()
}
