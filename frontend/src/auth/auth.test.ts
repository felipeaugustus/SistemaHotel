import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import {
  buildLoginUrl,
  buildRegisterUrl,
  completeLogin,
  isAuthenticated,
  logout,
  refreshTokens,
} from './auth'
import { createCodeChallenge } from './pkce'
import { getTokens, saveTokens } from './tokens'

function savedPkce() {
  return JSON.parse(sessionStorage.getItem('hotel.pkce')!)
}

describe('buildLoginUrl', () => {
  it('monta a URL de autorização com PKCE S256 e pede o login de novo', async () => {
    const url = new URL(await buildLoginUrl(), window.location.origin)
    const params = url.searchParams
    const { verifier, state } = savedPkce()

    expect(url.pathname).toBe('/o/authorize/')
    expect(params.get('response_type')).toBe('code')
    expect(params.get('client_id')).toBe('hotel-frontend')
    expect(params.get('redirect_uri')).toBe(`${window.location.origin}/callback`)
    expect(params.get('code_challenge_method')).toBe('S256')
    expect(params.get('code_challenge')).toBe(await createCodeChallenge(verifier))
    expect(params.get('state')).toBe(state)
    expect(params.get('prompt')).toBe('login')
  })
})

describe('buildRegisterUrl', () => {
  it('abre o cadastro e volta para a autorização depois de criar a conta', async () => {
    const url = new URL(await buildRegisterUrl(), window.location.origin)
    const next = new URL(url.searchParams.get('next')!, window.location.origin)
    const { verifier, state } = savedPkce()

    expect(url.pathname).toBe('/accounts/register/')
    expect(next.pathname).toBe('/o/authorize/')
    expect(next.searchParams.get('code_challenge')).toBe(await createCodeChallenge(verifier))
    expect(next.searchParams.get('state')).toBe(state)
    expect(next.searchParams.has('prompt')).toBe(false)
  })
})

describe('completeLogin', () => {
  it('troca o code pelo token enviando o verifier', async () => {
    await buildLoginUrl()
    const { verifier, state } = savedPkce()
    let tokenRequest: URLSearchParams | undefined
    server.use(
      http.post('/o/token/', async ({ request }) => {
        tokenRequest = new URLSearchParams(await request.text())
        return HttpResponse.json({ access_token: 'access-1', refresh_token: 'refresh-1' })
      }),
    )

    await completeLogin(`?code=abc&state=${state}`)

    expect(tokenRequest?.get('grant_type')).toBe('authorization_code')
    expect(tokenRequest?.get('code')).toBe('abc')
    expect(tokenRequest?.get('code_verifier')).toBe(verifier)
    expect(getTokens()).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    expect(isAuthenticated()).toBe(true)
  })

  it('recusa um state diferente do enviado', async () => {
    await buildLoginUrl()

    await expect(completeLogin('?code=abc&state=outro')).rejects.toThrow()
    expect(isAuthenticated()).toBe(false)
  })
})

describe('refreshTokens', () => {
  it('troca o refresh token por novos tokens', async () => {
    saveTokens({ accessToken: 'old', refreshToken: 'refresh-old' })
    server.use(
      http.post('/o/token/', () =>
        HttpResponse.json({ access_token: 'new', refresh_token: 'refresh-new' }),
      ),
    )

    expect(await refreshTokens()).toBe(true)
    expect(getTokens()).toEqual({ accessToken: 'new', refreshToken: 'refresh-new' })
  })

  it('encerra a sessão quando o refresh token não é mais válido', async () => {
    saveTokens({ accessToken: 'old', refreshToken: 'expired' })
    server.use(http.post('/o/token/', () => HttpResponse.json({}, { status: 400 })))

    expect(await refreshTokens()).toBe(false)
    expect(isAuthenticated()).toBe(false)
  })
})

describe('logout', () => {
  it('revoga o refresh token e limpa a sessão', async () => {
    saveTokens({ accessToken: 'access', refreshToken: 'refresh' })
    let revokedToken: string | null = null
    server.use(
      http.post('/o/revoke_token/', async ({ request }) => {
        revokedToken = new URLSearchParams(await request.text()).get('token')
        return new HttpResponse(null, { status: 200 })
      }),
    )

    await logout()

    expect(revokedToken).toBe('refresh')
    expect(isAuthenticated()).toBe(false)
  })

  it('sai mesmo quando a revogação falha por erro de rede', async () => {
    saveTokens({ accessToken: 'access', refreshToken: 'refresh' })
    server.use(http.post('/o/revoke_token/', () => HttpResponse.error()))

    await expect(logout()).resolves.toBeUndefined()
    expect(isAuthenticated()).toBe(false)
  })
})
