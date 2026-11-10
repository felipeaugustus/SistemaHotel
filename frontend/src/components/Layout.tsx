import { NavLink, Outlet, useNavigate } from 'react-router'
import { logout } from '../auth/auth'

export default function Layout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="header">
        <strong>Sistema Hotel</strong>
        <nav>
          <NavLink to="/" end>
            Recepção
          </NavLink>
          <NavLink to="/guests">Hóspedes</NavLink>
        </nav>
        <button className="secondary" onClick={handleLogout}>
          Sair
        </button>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  )
}
