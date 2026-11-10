import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { getTokens, saveTokens } from '../auth/tokens'
import { server } from '../test/server'
import { ApiError, apiFetch, errorMessage } from './client'

describe('apiFetch', () => {
  it('envia o access token no cabeçalho Authorization', async () => {
    saveTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    let authorization: string | null = null
    server.use(
      http.get('/api/guests/', ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json([])
      }),
    )

    await apiFetch('/api/guests/')

    expect(authorization).toBe('Bearer access-1')
  })

  it('renova o token e repete a requisição quando recebe 401', async () => {
    saveTokens({ accessToken: 'expired', refreshToken: 'refresh-1' })
    server.use(
      http.get('/api/guests/', ({ request }) =>
        request.headers.get('Authorization') === 'Bearer renewed'
          ? HttpResponse.json([{ id: 1 }])
          : HttpResponse.json({}, { status: 401 }),
      ),
      http.post('/o/token/', () =>
        HttpResponse.json({ access_token: 'renewed', refresh_token: 'refresh-2' }),
      ),
    )

    expect(await apiFetch('/api/guests/')).toEqual([{ id: 1 }])
  })

  it('encerra a sessão quando a API recusa até o token renovado', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    saveTokens({ accessToken: 'expired', refreshToken: 'refresh-1' })
    server.use(
      http.get('/api/guests/', () => HttpResponse.json({}, { status: 401 })),
      http.post('/o/token/', () =>
        HttpResponse.json({ access_token: 'renewed', refresh_token: 'refresh-2' }),
      ),
    )

    await expect(apiFetch('/api/guests/')).rejects.toMatchObject({ status: 401 })
    expect(getTokens()).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('lança ApiError com o corpo da resposta de erro', async () => {
    server.use(
      http.post('/api/reservations/1/check-in/', () =>
        HttpResponse.json({ detail: 'Fora do horário.' }, { status: 409 }),
      ),
    )

    const request = apiFetch('/api/reservations/1/check-in/', { method: 'POST' })

    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({
      status: 409,
      data: { detail: 'Fora do horário.' },
    })
  })
})

describe('errorMessage', () => {
  it('usa o detail retornado pela API', () => {
    expect(errorMessage(new ApiError(409, { detail: 'Fora do horário.' }))).toBe('Fora do horário.')
  })

  it('junta as mensagens de validação dos campos', () => {
    const error = new ApiError(400, { check_out_date: ['A saída deve ser depois da entrada.'] })

    expect(errorMessage(error)).toBe('A saída deve ser depois da entrada.')
  })

  it('usa uma mensagem genérica para erros desconhecidos', () => {
    expect(errorMessage(new Error('falha de rede'))).toBe('Algo deu errado. Tente novamente.')
  })
})
