'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Download, TrendingDown, TrendingUp } from 'lucide-react'
import type { PartyWithBalance } from '@/lib/calculations'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  parties: PartyWithBalance[]
}

export default function ReportsClient({ parties }: Props) {
  const suppliers = parties.filter(p => p.party_type === 'supplier')
  const customers = parties.filter(p => p.party_type === 'customer')

  const totalPayable = useMemo(
    () => suppliers.reduce((s, p) => s + (p.balance > 0 ? p.balance : 0), 0),
    [suppliers]
  )
  const totalReceivable = useMemo(
    () => customers.reduce((s, p) => s + (p.balance > 0 ? p.balance : 0), 0),
    [customers]
  )

  function downloadCSV() {
    const rows: string[][] = [
      ['Party Name', 'Type', 'Total Bills', 'Total Paid', 'Total Received', 'Balance', 'Status'],
    ]
    parties.forEach(p => {
      const bal = p.balance
      const status = p.party_type === 'supplier'
        ? (bal > 0 ? 'Payable' : bal < 0 ? 'Advance Paid' : 'Settled')
        : (bal > 0 ? 'Receivable' : bal < 0 ? 'Advance Received' : 'Settled')
      rows.push([p.party_name, p.party_type, p.total_bills.toFixed(2), p.total_paid.toFixed(2), p.total_received.toFixed(2), Math.abs(bal).toFixed(2), status])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `party-balance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function getBalanceDisplay(party: PartyWithBalance) {
    const bal = party.balance
    if (party.party_type === 'supplier') {
      if (bal > 0) return { label: 'Payable', amount: formatCurrency(bal), color: 'text-red-600' }
      if (bal < 0) return { label: 'Adv Paid', amount: formatCurrency(Math.abs(bal)), color: 'text-amber-600' }
      return { label: 'Settled', amount: '₹0', color: 'text-slate-500' }
    } else {
      if (bal > 0) return { label: 'Receivable', amount: formatCurrency(bal), color: 'text-emerald-600' }
      if (bal < 0) return { label: 'Adv Rcvd', amount: formatCurrency(Math.abs(bal)), color: 'text-amber-600' }
      return { label: 'Settled', amount: '₹0', color: 'text-slate-500' }
    }
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-xs lg:text-sm mt-0.5 hidden sm:block">Summary of all party balances</p>
        </div>
        <button id="export-csv-btn" onClick={downloadCSV} className="btn-secondary text-xs lg:text-sm px-3 lg:px-4 py-2 lg:py-2.5">
          <Download className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
        <div className="stat-card border-l-4 border-l-red-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payable</p>
          <p className="text-xl lg:text-2xl font-extrabold text-red-600 mt-1">{formatCurrency(totalPayable)}</p>
          <div className="hidden sm:flex items-center gap-1 mt-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-slate-500">to {suppliers.length} supplier(s)</span>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Receivable</p>
          <p className="text-xl lg:text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(totalReceivable)}</p>
          <div className="hidden sm:flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-500">from {customers.length} customer(s)</span>
          </div>
        </div>
      </div>

      {/* Suppliers */}
      {suppliers.length > 0 && (
        <div className="card overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-slate-200 bg-blue-50">
            <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Suppliers ({suppliers.length})</h2>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Party Name</th>
                  <th className="text-right">Total Bills</th>
                  <th className="text-right">Total Paid</th>
                  <th className="text-right">Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(p => {
                  const info = getBalanceDisplay(p)
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/party/${p.id}`} className="font-semibold text-indigo-700 hover:underline">
                          {p.party_name}
                        </Link>
                      </td>
                      <td className="text-right">{formatCurrency(p.total_bills)}</td>
                      <td className="text-right">{formatCurrency(p.total_paid)}</td>
                      <td className={`text-right font-bold ${info.color}`}>{info.amount}</td>
                      <td><span className={`text-xs font-semibold ${info.color}`}>{info.label}</span></td>
                    </tr>
                  )
                })}
                <tr style={{ backgroundColor: '#fef2f2' }}>
                  <td className="font-bold text-red-700">TOTAL</td>
                  <td className="text-right font-bold">{formatCurrency(suppliers.reduce((s, p) => s + p.total_bills, 0))}</td>
                  <td className="text-right font-bold">{formatCurrency(suppliers.reduce((s, p) => s + p.total_paid, 0))}</td>
                  <td className="text-right font-extrabold text-red-600">{formatCurrency(totalPayable)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="sm:hidden divide-y divide-slate-100">
            {suppliers.map(p => {
              const info = getBalanceDisplay(p)
              return (
                <Link key={p.id} href={`/party/${p.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 active:bg-slate-100">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{p.party_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Bills: {formatCurrency(p.total_bills)} · Paid: {formatCurrency(p.total_paid)}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className={`font-bold text-sm ${info.color}`}>{info.amount}</p>
                    <p className={`text-xs font-semibold ${info.color}`}>{info.label}</p>
                  </div>
                </Link>
              )
            })}
            <div className="px-4 py-3 bg-red-50 flex items-center justify-between">
              <p className="font-bold text-red-700 text-sm">TOTAL PAYABLE</p>
              <p className="font-extrabold text-red-600">{formatCurrency(totalPayable)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Customers */}
      {customers.length > 0 && (
        <div className="card overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-slate-200 bg-emerald-50">
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Customers ({customers.length})</h2>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Party Name</th>
                  <th className="text-right">Total Bills</th>
                  <th className="text-right">Total Received</th>
                  <th className="text-right">Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(p => {
                  const info = getBalanceDisplay(p)
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/party/${p.id}`} className="font-semibold text-indigo-700 hover:underline">
                          {p.party_name}
                        </Link>
                      </td>
                      <td className="text-right">{formatCurrency(p.total_bills)}</td>
                      <td className="text-right">{formatCurrency(p.total_received)}</td>
                      <td className={`text-right font-bold ${info.color}`}>{info.amount}</td>
                      <td><span className={`text-xs font-semibold ${info.color}`}>{info.label}</span></td>
                    </tr>
                  )
                })}
                <tr style={{ backgroundColor: '#ecfdf5' }}>
                  <td className="font-bold text-emerald-700">TOTAL</td>
                  <td className="text-right font-bold">{formatCurrency(customers.reduce((s, p) => s + p.total_bills, 0))}</td>
                  <td className="text-right font-bold">{formatCurrency(customers.reduce((s, p) => s + p.total_received, 0))}</td>
                  <td className="text-right font-extrabold text-emerald-600">{formatCurrency(totalReceivable)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="sm:hidden divide-y divide-slate-100">
            {customers.map(p => {
              const info = getBalanceDisplay(p)
              return (
                <Link key={p.id} href={`/party/${p.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 active:bg-slate-100">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{p.party_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Bills: {formatCurrency(p.total_bills)} · Rcvd: {formatCurrency(p.total_received)}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className={`font-bold text-sm ${info.color}`}>{info.amount}</p>
                    <p className={`text-xs font-semibold ${info.color}`}>{info.label}</p>
                  </div>
                </Link>
              )
            })}
            <div className="px-4 py-3 bg-emerald-50 flex items-center justify-between">
              <p className="font-bold text-emerald-700 text-sm">TOTAL RECEIVABLE</p>
              <p className="font-extrabold text-emerald-600">{formatCurrency(totalReceivable)}</p>
            </div>
          </div>
        </div>
      )}

      {parties.length === 0 && (
        <div className="card py-16 text-center">
          <p className="text-slate-400">No parties added yet.</p>
        </div>
      )}
    </div>
  )
}
