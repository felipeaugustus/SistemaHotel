import { createCodeChallenge, createRandomString } from './pkce'
import { clearTokens, getTokens, saveTokens, type Tokens } from './tokens'

const CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID ?? 'hotel-frontend'
const PKCE_KEY = 'hotel.pkce'

function redirectUri(): string {
  return `${window.location.origin}/callback`
}

export function isAuthenticated(): boolean {
  return getTokens() !== null
}

async function buildAuthorizeParams(): Promise<URLSearchParams> {
  const verifier = createRandomString()
  const state = createRandomString()
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }))

  return new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    code_challenge: await createCodeChallenge(verifier),
    code_challenge_method: 'S256',
    state,
  })
}

export async function buildLoginUrl(): Promise<string> {
  const params = await buildAuthorizeParams()
  params.set('prompt', 'login')
  return `/o/authorize/?${params}`
}

export async function buildRegisterUrl(): Promise<string> {
  const next = `/o/authorize/?${await buildAuthorizeParams()}`
  return `/accounts/register/?${new URLSearchParams({ next })}`
}

export async function login(): Promise<void> {
  window.location.assign(await buildLoginUrl())
}

export async function register(): Promise<void> {
  window.location.assign(await buildRegisterUrl())
}

export async function completeLogin(search: string): Promise<void> {
  const params = new URLSearchParams(search)
  const saved = JSON.parse(sessionStorage.getItem(PKCE_KEY) ?? 'null')
  sessionStorage.removeItem(PKCE_KEY)

  const code = params.get('code')
  if (!saved || !code || params.get('state') !== saved.state) {
    throw new Error('Não foi possível concluir o login. Tente novamente.')
  }

  saveTokens(
    await requestTokens({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      code_verifier: saved.verifier,
    }),
  )
}

export async function refreshTokens(): Promise<boolean> {
  const current = getTokens()
  if (!current) return false

  try {
    saveTokens(
      await requestTokens({ grant_type: 'refresh_token', refresh_token: current.refreshToken }),
    )
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function logout(): Promise<void> {
  const tokens = getTokens()
  clearTokens()
  if (!tokens) return

  // Os tokens já saíram do navegador; se a revogação falhar, a saída continua.
  await fetch('/o/revoke_token/', {
    method: 'POST',
    body: new URLSearchParams({ token: tokens.refreshToken, client_id: CLIENT_ID }),
  }).catch(() => undefined)
}

async function requestTokens(body: Record<string, string>): Promise<Tokens> {
  const response = await fetch('/o/token/', {
    method: 'POST',
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  })
  if (!response.ok) {
    throw new Error('Não foi possível obter o token de acesso.')
  }

  const data = await response.json()
  return { accessToken: data.access_token, refreshToken: data.refresh_token }
}
