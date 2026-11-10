import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { maria } from '../test/fixtures'
import { server } from '../test/server'
import GuestsPage from './GuestsPage'

function mockGuests() {
  const searches: (string | null)[] = []
  server.use(
    http.get('/api/guests/', ({ request }) => {
      searches.push(new URL(request.url).searchParams.get('search'))
      return HttpResponse.json([maria])
    }),
  )
  return searches
}

function capturePost(path: string, response: Response) {
  const bodies: unknown[] = []
  server.use(
    http.post(path, async ({ request }) => {
      bodies.push(await request.json())
      return response
    }),
  )
  return bodies
}

describe('GuestsPage', () => {
  it('lista e busca hóspedes', async () => {
    const searches = mockGuests()
    render(<GuestsPage />)

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox', { name: /buscar/i }), '12345')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => expect(searches.at(-1)).toBe('12345'))
  })

  it('cadastra um hóspede', async () => {
    mockGuests()
    const joao = { name: 'João Souza', document: '98765432100', phone: '21988887777' }
    const bodies = capturePost('/api/guests/', HttpResponse.json({ id: 2, ...joao }, { status: 201 }))
    render(<GuestsPage />)

    await userEvent.type(screen.getByLabelText('Nome'), joao.name)
    await userEvent.type(screen.getByLabelText('Documento'), joao.document)
    await userEvent.type(screen.getByLabelText('Telefone'), joao.phone)
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByText('João Souza cadastrado(a).')).toBeInTheDocument()
    expect(bodies).toEqual([joao])
  })

  it('mostra o erro quando o documento já está cadastrado', async () => {
    mockGuests()
    capturePost(
      '/api/guests/',
      HttpResponse.json({ document: ['hóspede com este documento já existe.'] }, { status: 400 }),
    )
    render(<GuestsPage />)

    await userEvent.type(screen.getByLabelText('Nome'), 'Outra Pessoa')
    await userEvent.type(screen.getByLabelText('Documento'), maria.document)
    await userEvent.type(screen.getByLabelText('Telefone'), '21988887777')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByText('hóspede com este documento já existe.')).toBeInTheDocument()
  })

  it('cria uma reserva para o hóspede', async () => {
    mockGuests()
    const bodies = capturePost('/api/reservations/', HttpResponse.json({}, { status: 201 }))
    render(<GuestsPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Nova reserva' }))
    await userEvent.type(screen.getByLabelText('Entrada'), '2026-11-06')
    await userEvent.type(screen.getByLabelText('Saída'), '2026-11-09')
    await userEvent.click(screen.getByLabelText('Vai usar o estacionamento'))
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))

    expect(await screen.findByText('Reserva de Maria Silva criada.')).toBeInTheDocument()
    expect(bodies).toEqual([
      { guest_id: 1, check_in_date: '2026-11-06', check_out_date: '2026-11-09', has_car: true },
    ])
  })

  it('mostra o erro de validação da reserva', async () => {
    mockGuests()
    capturePost(
      '/api/reservations/',
      HttpResponse.json(
        { check_out_date: ['A data de saída deve ser posterior à data de entrada.'] },
        { status: 400 },
      ),
    )
    render(<GuestsPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Nova reserva' }))
    await userEvent.type(screen.getByLabelText('Entrada'), '2026-11-09')
    await userEvent.type(screen.getByLabelText('Saída'), '2026-11-09')
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))

    expect(
      await screen.findByText('A data de saída deve ser posterior à data de entrada.'),
    ).toBeInTheDocument()
  })
})
