import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from './App'
import { buildLoginUrl, isAuthenticated } from './auth/auth'
import { saveTokens } from './auth/tokens'
import { server } from './test/server'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('rotas', () => {
  beforeEach(() => {
    server.use(http.get('/api/reservations/', () => HttpResponse.json([])))
  })

  it('sem sessão, manda para a tela de login com a opção de criar conta', async () => {
    renderAt('/')

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
  })

  it('com sessão, mostra a recepção', async () => {
    saveTokens({ accessToken: 'access', refreshToken: 'refresh' })

    renderAt('/')

    expect(await screen.findByRole('heading', { name: 'Recepção' })).toBeInTheDocument()
  })

  it('conclui o login no callback e abre a recepção', async () => {
    await buildLoginUrl()
    const { state } = JSON.parse(sessionStorage.getItem('hotel.pkce')!)
    server.use(
      http.post('/o/token/', () =>
        HttpResponse.json({ access_token: 'access', refresh_token: 'refresh' }),
      ),
    )

    renderAt(`/callback?code=abc&state=${state}`)

    expect(await screen.findByRole('heading', { name: 'Recepção' })).toBeInTheDocument()
    expect(isAuthenticated()).toBe(true)
  })

  it('sair revoga o token e volta para o login', async () => {
    saveTokens({ accessToken: 'access', refreshToken: 'refresh' })
    server.use(http.post('/o/revoke_token/', () => new HttpResponse(null, { status: 200 })))
    renderAt('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(isAuthenticated()).toBe(false)
  })
})
