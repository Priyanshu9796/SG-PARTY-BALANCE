'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { PartyWithBalance } from '@/lib/calculations'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  party: PartyWithBalance
}

function getBalanceInfo(party: PartyWithBalance) {
  const isSupplier = party.party_type === 'supplier'
  const bal = party.balance

  if (bal > 0) {
    return {
      label: isSupplier ? 'Pay' : 'Receive',
      amount: formatCurrency(bal),
      colorClass: isSupplier ? 'text-red-600' : 'text-emerald-600',
      bgClass: isSupplier ? 'bg-red-50' : 'bg-emerald-50',
    }
  } else if (bal < 0) {
    return {
      label: isSupplier ? 'Advance Paid' : 'Advance Rcvd',
      amount: formatCurrency(Math.abs(bal)),
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
    }
  } else {
    return {
      label: 'Settled',
      amount: '₹0',
      colorClass: 'text-slate-500',
      bgClass: 'bg-slate-50',
    }
  }
}

export default function PartyCard({ party }: Props) {
  const info = getBalanceInfo(party)

  return (
    <Link
      href={`/party/${party.id}`}
      className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
          party.party_type === 'supplier'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          {party.party_name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{party.party_name}</p>
          <span className={party.party_type === 'supplier' ? 'badge-supplier' : 'badge-customer'}>
            {party.party_type.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className={`text-right px-2.5 py-1 rounded-lg ${info.bgClass}`}>
          <p className="text-xs text-slate-500 font-medium">{info.label}</p>
          <p className={`font-bold text-sm ${info.colorClass}`}>{info.amount}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </div>
    </Link>
  )
}
