export type Tokens = {
  accessToken: string
  refreshToken: string
}

const TOKENS_KEY = 'hotel.tokens'

export function getTokens(): Tokens | null {
  const saved = sessionStorage.getItem(TOKENS_KEY)
  return saved ? JSON.parse(saved) : null
}

export function saveTokens(tokens: Tokens): void {
  sessionStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
}

export function clearTokens(): void {
  sessionStorage.removeItem(TOKENS_KEY)
}
