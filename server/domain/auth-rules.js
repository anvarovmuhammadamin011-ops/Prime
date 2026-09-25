export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 9 && digits.startsWith('9')) return `+998${digits}`
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`
  return null
}

export function validatePhone(value) {
  return Boolean(normalizePhone(value))
}

export function isStaffRole(role) {
  return role === 'admin' || role === 'superadmin'
}
