import { describe, expect, it } from 'vitest'
import { decryptAccessCode, encryptAccessCode } from '../utils/crypto.js'

const pepper = 'p'.repeat(32)

describe('access code encryption', () => {
  it('round-trips a code with authenticated encryption', () => {
    const encrypted = encryptAccessCode('012345', pepper)
    expect(encrypted).not.toContain('012345')
    expect(decryptAccessCode(encrypted, pepper)).toBe('012345')
  })

  it('returns null when the ciphertext or pepper is invalid', () => {
    const encrypted = encryptAccessCode('012345', pepper)
    expect(decryptAccessCode(`${encrypted}tampered`, pepper)).toBeNull()
    expect(decryptAccessCode(encrypted, 'q'.repeat(32))).toBeNull()
  })
})
