import { apiFetch } from './client'
import type { Guest } from './guests'

export type ReservationStatus = 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT'

export type Reservation = {
  id: number
  guest: Guest
  check_in_date: string
  check_out_date: string
  has_car: boolean
  status: ReservationStatus
  checked_in_at: string | null
  checked_out_at: string | null
}

export type ReservationInput = {
  guest_id: number
  check_in_date: string
  check_out_date: string
  has_car: boolean
}

export type Charge = {
  type: 'DAILY' | 'PARKING' | 'LATE_CHECKOUT'
  date: string
  amount: string
}

export type Bill = {
  charges: Charge[]
  total: string
}

export function listReservations(filters: Record<string, string>): Promise<Reservation[]> {
  return apiFetch(`/api/reservations/?${new URLSearchParams(filters)}`)
}

export function createReservation(reservation: ReservationInput): Promise<Reservation> {
  return apiFetch('/api/reservations/', { method: 'POST', body: JSON.stringify(reservation) })
}

export function checkIn(id: number): Promise<Reservation> {
  return apiFetch(`/api/reservations/${id}/check-in/`, { method: 'POST' })
}

export function previewCheckout(id: number): Promise<Bill> {
  return apiFetch(`/api/reservations/${id}/checkout-preview/`)
}

export function checkOut(id: number): Promise<Bill> {
  return apiFetch(`/api/reservations/${id}/check-out/`, { method: 'POST' })
}
