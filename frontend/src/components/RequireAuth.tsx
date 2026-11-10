import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { isAuthenticated } from '../auth/auth'

export default function RequireAuth({ children }: { children: ReactNode }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}
