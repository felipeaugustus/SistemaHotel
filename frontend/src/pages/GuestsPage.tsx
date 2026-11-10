import { useEffect, useState } from 'react'
import { errorMessage } from '../api/client'
import { listGuests, type Guest } from '../api/guests'
import Alert, { type Feedback } from '../components/Alert'
import GuestForm from '../components/GuestForm'
import ReservationForm from '../components/ReservationForm'
import SearchForm from '../components/SearchForm'

export default function GuestsPage() {
  const [search, setSearch] = useState('')
  const [guests, setGuests] = useState<Guest[]>([])
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [reservingFor, setReservingFor] = useState<Guest | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    listGuests(search)
      .then(setGuests)
      .catch((error) => setFeedback({ type: 'error', message: errorMessage(error) }))
  }, [search, reloadKey])

  function handleGuestCreated(guest: Guest) {
    setFeedback({ type: 'success', message: `${guest.name} cadastrado(a).` })
    setReloadKey((key) => key + 1)
  }

  function handleReservationCreated() {
    setFeedback({ type: 'success', message: `Reserva de ${reservingFor?.name} criada.` })
    setReservingFor(null)
  }

  return (
    <>
      <h1>Hóspedes</h1>
      <Alert feedback={feedback} />

      <div className="columns">
        <section>
          <SearchForm onSearch={setSearch} />
          {guests.length === 0 ? (
            <p className="empty">Nenhum hóspede encontrado.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Documento</th>
                  <th>Telefone</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id}>
                    <td>{guest.name}</td>
                    <td>{guest.document}</td>
                    <td>{guest.phone}</td>
                    <td className="actions">
                      <button className="secondary" onClick={() => setReservingFor(guest)}>
                        Nova reserva
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside>
          {reservingFor ? (
            <ReservationForm
              key={reservingFor.id}
              guest={reservingFor}
              onCreated={handleReservationCreated}
              onCancel={() => setReservingFor(null)}
            />
          ) : (
            <GuestForm onCreated={handleGuestCreated} />
          )}
        </aside>
      </div>
    </>
  )
}
