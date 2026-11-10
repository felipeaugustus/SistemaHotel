import { describe, expect, it } from 'vitest'
import { createCodeChallenge, createRandomString } from './pkce'

describe('PKCE', () => {
  it('cria o challenge como SHA-256 em base64url do verifier', async () => {
    const challenge = await createCodeChallenge('verificador-de-teste-com-43-caracteres-abcd')

    expect(challenge).toBe('xTYftuPEN5gtcCIaZSfl-MHKUU2iXMtc2TtFmMT4zDs')
  })

  it('gera valores aleatórios seguros para URL', () => {
    const first = createRandomString()

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(createRandomString()).not.toBe(first)
  })
})
