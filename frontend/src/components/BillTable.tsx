import type { Bill } from '../api/reservations'
import { CHARGE_LABELS, formatDate, formatMoney } from '../format'

export default function BillTable({ bill }: { bill: Bill }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th className="amount">Valor</th>
        </tr>
      </thead>
      <tbody>
        {bill.charges.map((charge, index) => (
          <tr key={index}>
            <td>{formatDate(charge.date)}</td>
            <td>{CHARGE_LABELS[charge.type]}</td>
            <td className="amount">{formatMoney(charge.amount)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th colSpan={2}>Total</th>
          <th className="amount">{formatMoney(bill.total)}</th>
        </tr>
      </tfoot>
    </table>
  )
}
