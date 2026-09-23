export type PartyType = 'supplier' | 'customer'
export type EntryType = 'bill' | 'paid' | 'received'

export interface Party {
  id: string
  user_id: string
  party_name: string
  party_type: PartyType
  created_at: string
  updated_at: string
}

export interface PartyEntry {
  id: string
  user_id: string
  party_id: string
  entry_number: string
  entry_date: string
  entry_type: EntryType
  amount: number
  created_at: string
  updated_at: string
}

export interface PartyWithBalance extends Party {
  total_bills: number
  total_paid: number
  total_received: number
  balance: number
}

export interface PartyBalance {
  total_bills: number
  total_paid: number
  total_received: number
  balance: number
  balance_label: string
  balance_status: 'payable' | 'receivable' | 'advance_paid' | 'advance_received' | 'settled'
}

export function calculateBalance(
  partyType: PartyType,
  entries: PartyEntry[]
): PartyBalance {
  const total_bills = entries
    .filter(e => e.entry_type === 'bill')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const total_paid = entries
    .filter(e => e.entry_type === 'paid')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const total_received = entries
    .filter(e => e.entry_type === 'received')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const balance =
    partyType === 'supplier'
      ? total_bills - total_paid
      : total_bills - total_received

  let balance_label: string
  let balance_status: PartyBalance['balance_status']

  if (partyType === 'supplier') {
    if (balance > 0) {
      balance_label = 'YOU HAVE TO PAY'
      balance_status = 'payable'
    } else if (balance < 0) {
      balance_label = 'ADVANCE PAID'
      balance_status = 'advance_paid'
    } else {
      balance_label = 'NOTHING TO PAY'
      balance_status = 'settled'
    }
  } else {
    if (balance > 0) {
      balance_label = 'YOU HAVE TO RECEIVE'
      balance_status = 'receivable'
    } else if (balance < 0) {
      balance_label = 'ADVANCE RECEIVED'
      balance_status = 'advance_received'
    } else {
      balance_label = 'NOTHING TO RECEIVE'
      balance_status = 'settled'
    }
  }

  return {
    total_bills,
    total_paid,
    total_received,
    balance: Math.abs(balance),
    balance_label,
    balance_status,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}
