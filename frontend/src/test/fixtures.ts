import type { Guest } from '../api/guests'
import type { Bill, Reservation } from '../api/reservations'

export const maria: Guest = {
  id: 1,
  name: 'Maria Silva',
  document: '12345678900',
  phone: '11999990000',
}

export function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 10,
    guest: maria,
    check_in_date: '2026-11-06',
    check_out_date: '2026-11-09',
    has_car: true,
    status: 'RESERVED',
    checked_in_at: null,
    checked_out_at: null,
    ...overrides,
  }
}

export const weekendBill: Bill = {
  charges: [
    { type: 'DAILY', date: '2026-11-06', amount: '120.00' },
    { type: 'PARKING', date: '2026-11-06', amount: '15.00' },
    { type: 'DAILY', date: '2026-11-07', amount: '180.00' },
    { type: 'PARKING', date: '2026-11-07', amount: '20.00' },
    { type: 'DAILY', date: '2026-11-08', amount: '180.00' },
    { type: 'PARKING', date: '2026-11-08', amount: '20.00' },
    { type: 'LATE_CHECKOUT', date: '2026-11-09', amount: '60.00' },
  ],
  total: '595.00',
}
