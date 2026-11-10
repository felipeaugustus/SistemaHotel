import { Navigate } from 'react-router'
import { isAuthenticated, login, register } from '../auth/auth'

export default function LoginPage() {
  if (isAuthenticated()) return <Navigate to="/" replace />

  return (
    <main className="centered">
      <div className="card login">
        <h1>Sistema Hotel</h1>
        <p>Gestão de hóspedes e reservas.</p>
        <button onClick={login}>Entrar</button>
        <button className="secondary" onClick={register}>
          Criar conta
        </button>
      </div>
    </main>
  )
}
