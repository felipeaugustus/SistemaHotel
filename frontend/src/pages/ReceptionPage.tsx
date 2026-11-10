import { useEffect, useState } from 'react'
import { errorMessage } from '../api/client'
import { checkIn, listReservations, type Reservation } from '../api/reservations'
import Alert, { type Feedback } from '../components/Alert'
import CheckoutDialog from '../components/CheckoutDialog'
import SearchForm from '../components/SearchForm'
import { formatDate, STATUS_LABELS } from '../format'

type Filter = { label: string; params: Record<string, string> }

const FILTERS: Filter[] = [
  { label: 'Aguardando check-in', params: { status: 'RESERVED' } },
  { label: 'Check-in hoje', params: { check_in: 'today' } },
  { label: 'Hospedados', params: { status: 'CHECKED_IN' } },
  { label: 'Todas', params: {} },
]

export default function ReceptionPage() {
  const [filter, setFilter] = useState(FILTERS[0])
  const [search, setSearch] = useState('')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [checkingOut, setCheckingOut] = useState<Reservation | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    listReservations({ ...filter.params, search })
      .then(setReservations)
      .catch((error) => setFeedback({ type: 'error', message: errorMessage(error) }))
  }, [filter, search, reloadKey])

  function reload() {
    setReloadKey((key) => key + 1)
  }

  async function handleCheckIn(reservation: Reservation) {
    try {
      await checkIn(reservation.id)
      setFeedback({ type: 'success', message: `Check-in de ${reservation.guest.name} realizado.` })
      reload()
    } catch (error) {
      setFeedback({ type: 'error', message: errorMessage(error) })
    }
  }

  return (
    <>
      <h1>Recepção</h1>

      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Filtrar reservas">
          {FILTERS.map((option) => (
            <button
              key={option.label}
              className={option === filter ? 'tab active' : 'tab'}
              aria-pressed={option === filter}
              onClick={() => {
                setFilter(option)
                setFeedback(null)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <SearchForm onSearch={setSearch} />
      </div>

      <Alert feedback={feedback} />

      {reservations.length === 0 ? (
        <p className="empty">Nenhuma reserva encontrada.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Hóspede</th>
              <th>Documento</th>
              <th>Telefone</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Carro</th>
              <th>Situação</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id}>
                <td>{reservation.guest.name}</td>
                <td>{reservation.guest.document}</td>
                <td>{reservation.guest.phone}</td>
                <td>{formatDate(reservation.check_in_date)}</td>
                <td>{formatDate(reservation.check_out_date)}</td>
                <td>{reservation.has_car ? 'Sim' : 'Não'}</td>
                <td>{STATUS_LABELS[reservation.status]}</td>
                <td className="actions">
                  {reservation.status === 'RESERVED' && (
                    <button onClick={() => handleCheckIn(reservation)}>Check-in</button>
                  )}
                  {reservation.status === 'CHECKED_IN' && (
                    <button onClick={() => setCheckingOut(reservation)}>Checkout</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {checkingOut && (
        <CheckoutDialog
          reservation={checkingOut}
          onClose={() => setCheckingOut(null)}
          onCheckedOut={reload}
        />
      )}
    </>
  )
}
