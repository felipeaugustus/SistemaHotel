import { useEffect, useState } from 'react'
import { errorMessage } from '../api/client'
import { checkOut, previewCheckout, type Bill, type Reservation } from '../api/reservations'
import Alert, { type Feedback } from './Alert'
import BillTable from './BillTable'

type Props = {
  reservation: Reservation
  onClose: () => void
  onCheckedOut: () => void
}

export default function CheckoutDialog({ reservation, onClose, onCheckedOut }: Props) {
  const [bill, setBill] = useState<Bill | null>(null)
  const [finished, setFinished] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    previewCheckout(reservation.id)
      .then(setBill)
      .catch((error) => setFeedback({ type: 'error', message: errorMessage(error) }))
  }, [reservation.id])

  async function handleConfirm() {
    try {
      setBill(await checkOut(reservation.id))
      setFinished(true)
      setFeedback({ type: 'success', message: 'Checkout concluído.' })
      onCheckedOut()
    } catch (error) {
      setFeedback({ type: 'error', message: errorMessage(error) })
    }
  }

  return (
    <div className="overlay">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <h2 id="checkout-title">Checkout de {reservation.guest.name}</h2>
        <Alert feedback={feedback} />
        {bill && <BillTable bill={bill} />}
        <div className="dialog-actions">
          <button className="secondary" onClick={onClose}>
            {finished ? 'Fechar' : 'Cancelar'}
          </button>
          {!finished && (
            <button onClick={handleConfirm} disabled={!bill}>
              Confirmar checkout
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
