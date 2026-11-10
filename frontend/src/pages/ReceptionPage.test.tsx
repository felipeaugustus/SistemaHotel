import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { Reservation } from '../api/reservations'
import { makeReservation, weekendBill } from '../test/fixtures'
import { server } from '../test/server'
import ReceptionPage from './ReceptionPage'

function mockReservations(byFilter: Record<string, Reservation[]>) {
  const requests: URLSearchParams[] = []
  server.use(
    http.get('/api/reservations/', ({ request }) => {
      const params = new URL(request.url).searchParams
      requests.push(params)
      const filter = params.get('status') ?? params.get('check_in') ?? ''
      return HttpResponse.json(byFilter[filter] ?? [])
    }),
  )
  return requests
}

describe('ReceptionPage', () => {
  it('lista os hóspedes que ainda não fizeram check-in ao abrir', async () => {
    const requests = mockReservations({ RESERVED: [makeReservation()] })

    render(<ReceptionPage />)

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check-in' })).toBeInTheDocument()
    expect(requests[0].get('status')).toBe('RESERVED')
  })

  it('lista os hóspedes que estão no hotel', async () => {
    const requests = mockReservations({
      CHECKED_IN: [makeReservation({ status: 'CHECKED_IN' })],
    })
    render(<ReceptionPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Hospedados' }))

    expect(await screen.findByRole('button', { name: 'Checkout' })).toBeInTheDocument()
    expect(requests.at(-1)?.get('status')).toBe('CHECKED_IN')
  })

  it('lista as reservas com check-in previsto para hoje', async () => {
    const requests = mockReservations({ today: [makeReservation()] })
    render(<ReceptionPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Check-in hoje' }))

    await waitFor(() => expect(requests.at(-1)?.get('check_in')).toBe('today'))
    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check-in hoje' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('busca por nome, documento ou telefone', async () => {
    const requests = mockReservations({})
    render(<ReceptionPage />)

    await userEvent.type(screen.getByRole('textbox', { name: /buscar/i }), '11999')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => expect(requests.at(-1)?.get('search')).toBe('11999'))
  })

  it('alerta quando o check-in é feito antes das 14h', async () => {
    mockReservations({ RESERVED: [makeReservation()] })
    server.use(
      http.post('/api/reservations/10/check-in/', () =>
        HttpResponse.json(
          { detail: 'O check-in só pode ser feito a partir das 14h do dia da reserva.' },
          { status: 409 },
        ),
      ),
    )
    render(<ReceptionPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Check-in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('a partir das 14h')

    await userEvent.click(screen.getByRole('button', { name: 'Hospedados' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('faz o check-in e atualiza a lista', async () => {
    const requests = mockReservations({ RESERVED: [makeReservation()] })
    server.use(
      http.post('/api/reservations/10/check-in/', () =>
        HttpResponse.json(makeReservation({ status: 'CHECKED_IN' })),
      ),
    )
    render(<ReceptionPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Check-in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Check-in de Maria Silva realizado.')
    await waitFor(() => expect(requests).toHaveLength(2))
  })

  it('mostra a conta detalhada e conclui o checkout', async () => {
    mockReservations({ CHECKED_IN: [makeReservation({ status: 'CHECKED_IN' })] })
    let checkedOut = false
    server.use(
      http.get('/api/reservations/10/checkout-preview/', () => HttpResponse.json(weekendBill)),
      http.post('/api/reservations/10/check-out/', () => {
        checkedOut = true
        return HttpResponse.json(weekendBill)
      }),
    )
    render(<ReceptionPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Hospedados' }))

    await userEvent.click(await screen.findByRole('button', { name: 'Checkout' }))

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Checkout após 12h (50% da diária)')).toBeInTheDocument()
    expect(within(dialog).getAllByText('Diária')).toHaveLength(3)
    expect(within(dialog).getAllByText('Estacionamento')).toHaveLength(3)
    expect(within(dialog).getByRole('row', { name: /total/i })).toHaveTextContent('595,00')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar checkout' }))

    expect(await within(dialog).findByText('Checkout concluído.')).toBeInTheDocument()
    expect(checkedOut).toBe(true)
  })
})
