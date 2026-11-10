import { apiFetch } from './client'

export type Guest = {
  id: number
  name: string
  document: string
  phone: string
}

export type GuestInput = Omit<Guest, 'id'>

export function listGuests(search = ''): Promise<Guest[]> {
  return apiFetch(`/api/guests/?${new URLSearchParams({ search })}`)
}

export function createGuest(guest: GuestInput): Promise<Guest> {
  return apiFetch('/api/guests/', { method: 'POST', body: JSON.stringify(guest) })
}
