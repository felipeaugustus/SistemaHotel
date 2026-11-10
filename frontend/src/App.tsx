import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import CallbackPage from './pages/CallbackPage'
import GuestsPage from './pages/GuestsPage'
import LoginPage from './pages/LoginPage'
import ReceptionPage from './pages/ReceptionPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<ReceptionPage />} />
        <Route path="/guests" element={<GuestsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
