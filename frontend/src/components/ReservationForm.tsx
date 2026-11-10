import { useState, type FormEvent } from 'react'
import { errorMessage } from '../api/client'
import type { Guest } from '../api/guests'
import { createReservation } from '../api/reservations'
import Alert, { type Feedback } from './Alert'

type Props = {
  guest: Guest
  onCreated: () => void
  onCancel: () => void
}

export default function ReservationForm({ guest, onCreated, onCancel }: Props) {
  const [feedback, setFeedback] = useState<Feedback>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    try {
      await createReservation({
        guest_id: guest.id,
        check_in_date: String(data.get('check_in_date')),
        check_out_date: String(data.get('check_out_date')),
        has_car: data.get('has_car') === 'on',
      })
      onCreated()
    } catch (error) {
      setFeedback({ type: 'error', message: errorMessage(error) })
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>Nova reserva para {guest.name}</h2>
      <Alert feedback={feedback} />
      <label>
        Entrada
        <input name="check_in_date" type="date" required />
      </label>
      <label>
        Saída
        <input name="check_out_date" type="date" required />
      </label>
      <label className="checkbox">
        <input name="has_car" type="checkbox" />
        Vai usar o estacionamento
      </label>
      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit">Reservar</button>
      </div>
    </form>
  )
}
