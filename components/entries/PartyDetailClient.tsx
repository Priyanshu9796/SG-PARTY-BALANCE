'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Party, PartyEntry } from '@/lib/calculations'
import { calculateBalance, formatCurrency, formatDate } from '@/lib/calculations'
import AddEntryModal from './AddEntryModal'
import EditEntryModal from './EditEntryModal'
import EditPartyModal from '../party/EditPartyModal'

interface Props {
  party: Party
  initialEntries: PartyEntry[]
}

export default function PartyDetailClient({ party: initialParty, initialEntries }: Props) {
  const router = useRouter()
  const [party, setParty] = useState(initialParty)
  const [entries, setEntries] = useState(initialEntries)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editEntry, setEditEntry] = useState<PartyEntry | null>(null)
  const [showEditParty, setShowEditParty] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const balance = calculateBalance(party.party_type, entries)

  const refreshEntries = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('party_entries')
      .select('*')
      .eq('party_id', party.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setEntries(data as PartyEntry[])
  }, [party.id])

  async function handleDeleteEntry(id: string) {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('party_entries').delete().eq('id', id)
    setDeleteConfirm(null)
    await refreshEntries()
    setDeleting(false)
  }

  async function handleDeleteParty() {
    if (entries.length > 0) {
      alert('Cannot delete a party with existing transactions. Delete all entries first.')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from('parties').delete().eq('id', party.id)
    if (!error) {
      router.push('/')
      router.refresh()
    }
  }

  const balanceColor =
    balance.balance_status === 'payable' ? 'text-red-600' :
    balance.balance_status === 'receivable' ? 'text-emerald-600' :
    balance.balance_status === 'settled' ? 'text-slate-500' :
    'text-amber-600'

  const balanceBg =
    balance.balance_status === 'payable' ? 'bg-red-50 border-red-200' :
    balance.balance_status === 'receivable' ? 'bg-emerald-50 border-emerald-200' :
    balance.balance_status === 'settled' ? 'bg-slate-50 border-slate-200' :
    'bg-amber-50 border-amber-200'

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">

      {/* ── Back nav ── */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Parties
      </Link>

      {/* ── Party Header ── */}
      <div className="card p-4 lg:p-5 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-lg lg:text-xl font-bold shrink-0 ${
              party.party_type === 'supplier'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {party.party_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-slate-900 leading-tight">{party.party_name}</h1>
              <span className={party.party_type === 'supplier' ? 'badge-supplier' : 'badge-customer'}>
                {party.party_type.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="edit-party-btn"
              onClick={() => setShowEditParty(true)}
              className="btn-secondary text-xs px-3 py-2 flex-1 sm:flex-none justify-center"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              id="add-entry-btn"
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs lg:text-sm px-3 lg:px-4 py-2 lg:py-2.5 flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* ── Balance Summary — stacks on mobile ── */}
      <div className="card p-4 lg:p-5 mb-4">
        <div className="grid grid-cols-3 gap-2 lg:gap-0 lg:divide-x lg:divide-slate-200">
          <div className="lg:pr-5 text-center lg:text-left">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 leading-tight">Total Bills</p>
            <p className="text-base lg:text-lg font-bold text-slate-800">{formatCurrency(balance.total_bills)}</p>
          </div>
          <div className="lg:px-5 text-center lg:text-left">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 leading-tight">
              {party.party_type === 'supplier' ? 'Total Paid' : 'Total Rcvd'}
            </p>
            <p className="text-base lg:text-lg font-bold text-slate-800">
              {formatCurrency(party.party_type === 'supplier' ? balance.total_paid : balance.total_received)}
            </p>
          </div>
          <div className="lg:pl-5 text-center lg:text-left">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 leading-tight">
              {balance.balance_status === 'settled' ? 'Balance' : balance.balance_label}
            </p>
            <p className={`text-lg lg:text-2xl font-extrabold tracking-tight ${balanceColor}`}>
              {balance.balance_status === 'settled' ? '—' : formatCurrency(balance.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Balance Callout Banner ── */}
      {balance.balance_status !== 'settled' && (
        <div className={`rounded-xl border px-4 py-3 mb-4 flex items-center justify-between ${balanceBg}`}>
          <p className={`text-sm font-bold uppercase tracking-wide ${balanceColor}`}>
            {balance.balance_label}
          </p>
          <p className={`text-xl lg:text-2xl font-extrabold ${balanceColor}`}>
            {formatCurrency(balance.balance)}
          </p>
        </div>
      )}
      {balance.balance_status === 'settled' && entries.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-4 text-center">
          <p className="text-slate-600 text-sm font-semibold">✓ Account Settled — Nothing to Pay or Receive</p>
        </div>
      )}

      {/* ── Transactions ── */}
      <div className="card overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Transactions ({entries.length})
          </h2>
        </div>

        {entries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">No entries yet. Tap &quot;Add Entry&quot; to get started.</p>
          </div>
        ) : (
          <>
            {/* ── DESKTOP TABLE (hidden on mobile) ── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Entry No</th>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                    <th>Type</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id}>
                      <td className="font-medium text-slate-800">{entry.entry_number}</td>
                      <td className="text-slate-600 whitespace-nowrap">{formatDate(entry.entry_date)}</td>
                      <td className="text-right font-semibold text-slate-900">{formatCurrency(Number(entry.amount))}</td>
                      <td>
                        {entry.entry_type === 'bill' && <span className="badge-bill">BILL</span>}
                        {entry.entry_type === 'paid' && <span className="badge-paid">PAID</span>}
                        {entry.entry_type === 'received' && <span className="badge-received">RECEIVED</span>}
                      </td>
                      <td className="text-right">
                        {deleteConfirm === entry.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs text-slate-600 mr-1">Delete?</span>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={deleting}
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
                            >
                              <Check className="w-3.5 h-3.5" /> Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                            >
                              <X className="w-3.5 h-3.5" /> No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`edit-entry-${entry.id}`}
                              onClick={() => setEditEntry(entry)}
                              className="btn-ghost text-xs"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              id={`delete-entry-${entry.id}`}
                              onClick={() => setDeleteConfirm(entry.id)}
                              className="btn-ghost text-xs text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE ENTRY CARDS (shown only on mobile) ── */}
            <div className="sm:hidden divide-y divide-slate-100">
              {entries.map(entry => (
                <div key={entry.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {entry.entry_type === 'bill' && <span className="badge-bill">BILL</span>}
                        {entry.entry_type === 'paid' && <span className="badge-paid">PAID</span>}
                        {entry.entry_type === 'received' && <span className="badge-received">RECEIVED</span>}
                        <span className="text-xs text-slate-500">{formatDate(entry.entry_date)}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate">{entry.entry_number}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900 text-sm">{formatCurrency(Number(entry.amount))}</p>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  {deleteConfirm === entry.id ? (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-600 flex-1">Delete this entry?</span>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        disabled={deleting}
                        className="text-xs text-red-600 font-bold px-3 py-1.5 bg-red-50 rounded-lg"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs text-slate-600 font-semibold px-3 py-1.5 bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setEditEntry(entry)}
                        className="flex items-center gap-1 text-xs text-indigo-600 font-semibold px-2.5 py-1.5 bg-indigo-50 rounded-lg"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(entry.id)}
                        className="flex items-center gap-1 text-xs text-red-500 font-semibold px-2.5 py-1.5 bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Danger Zone ── */}
      {entries.length === 0 && (
        <div className="border border-red-200 rounded-xl p-4 bg-red-50">
          <p className="text-sm font-semibold text-red-700 mb-1">Danger Zone</p>
          <p className="text-xs text-red-600 mb-3">This party has no transactions and can be permanently deleted.</p>
          <button
            id="delete-party-btn"
            onClick={handleDeleteParty}
            className="btn-danger text-xs px-3 py-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Party
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {showAddModal && (
        <AddEntryModal
          party={party}
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => { setShowAddModal(false); await refreshEntries() }}
        />
      )}
      {editEntry && (
        <EditEntryModal
          entry={editEntry}
          party={party}
          onClose={() => setEditEntry(null)}
          onSuccess={async () => { setEditEntry(null); await refreshEntries() }}
        />
      )}
      {showEditParty && (
        <EditPartyModal
          party={party}
          onClose={() => setShowEditParty(false)}
          onSuccess={updated => { setParty(updated); setShowEditParty(false) }}
        />
      )}
    </div>
  )
}
