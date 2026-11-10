import type { Charge, ReservationStatus } from './api/reservations'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatMoney(value: string): string {
  return money.format(Number(value))
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  RESERVED: 'Aguardando check-in',
  CHECKED_IN: 'Hospedado',
  CHECKED_OUT: 'Finalizada',
}

export const CHARGE_LABELS: Record<Charge['type'], string> = {
  DAILY: 'Diária',
  PARKING: 'Estacionamento',
  LATE_CHECKOUT: 'Checkout após 12h (50% da diária)',
}
