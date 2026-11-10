import { useState, type FormEvent } from 'react'
import { errorMessage } from '../api/client'
import { createGuest, type Guest } from '../api/guests'
import Alert, { type Feedback } from './Alert'

type Props = {
  onCreated: (guest: Guest) => void
}

export default function GuestForm({ onCreated }: Props) {
  const [feedback, setFeedback] = useState<Feedback>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    try {
      const guest = await createGuest({
        name: String(data.get('name')),
        document: String(data.get('document')),
        phone: String(data.get('phone')),
      })
      form.reset()
      setFeedback(null)
      onCreated(guest)
    } catch (error) {
      setFeedback({ type: 'error', message: errorMessage(error) })
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>Novo hóspede</h2>
      <Alert feedback={feedback} />
      <label>
        Nome
        <input name="name" required />
      </label>
      <label>
        Documento
        <input name="document" required />
      </label>
      <label>
        Telefone
        <input name="phone" type="tel" required />
      </label>
      <button type="submit">Cadastrar</button>
    </form>
  )
}
