import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { completeLogin } from '../auth/auth'

export default function CallbackPage() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    // O StrictMode roda o efeito duas vezes em desenvolvimento, e o code só pode ser usado uma vez.
    if (started.current) return
    started.current = true

    completeLogin(search)
      .then(() => navigate('/', { replace: true }))
      .catch((loginError: Error) => setError(loginError.message))
  }, [search, navigate])

  return (
    <main className="centered">
      <div className="card login">
        {error ? (
          <>
            <p role="alert" className="alert alert-error">
              {error}
            </p>
            <Link to="/login">Voltar para o login</Link>
          </>
        ) : (
          <p>Entrando...</p>
        )}
      </div>
    </main>
  )
}
