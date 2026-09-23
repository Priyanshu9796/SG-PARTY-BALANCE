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
    const supabase = createClient()
    if (entries.length > 0) {
      alert('Cannot delete a party with existing transactions. Please delete all entries first.')
      return
    }
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

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back nav */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Parties
      </Link>

      {/* Party Header */}
      <div className="card p-5 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 ${
              party.party_type === 'supplier'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {party.party_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{party.party_name}</h1>
              <span className={party.party_type === 'supplier' ? 'badge-supplier' : 'badge-customer'}>
                {party.party_type.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="edit-party-btn"
              onClick={() => setShowEditParty(true)}
              className="btn-secondary text-xs px-3 py-2"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Party
            </button>
            <button
              id="add-entry-btn"
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Balance Summary Card */}
      <div className="card p-5 mb-5">
        <div className="grid grid-cols-3 divide-x divide-slate-200">
          <div className="pr-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Bills</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(balance.total_bills)}</p>
          </div>
          <div className="px-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Total {party.party_type === 'supplier' ? 'Paid' : 'Received'}
            </p>
            <p className="text-lg font-bold text-slate-800">
              {formatCurrency(party.party_type === 'supplier' ? balance.total_paid : balance.total_received)}
            </p>
          </div>
          <div className="pl-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {balance.balance_label}
            </p>
            <p className={`text-2xl font-extrabold tracking-tight ${balanceColor}`}>
              {balance.balance_status === 'settled' ? '—' : formatCurrency(balance.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Transactions</h2>
        </div>

        {entries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No entries yet. Click &quot;Add Entry&quot; to get started.</p>
          </div>
        ) : (
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
                  <td className="text-slate-600">{formatDate(entry.entry_date)}</td>
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
        )}

        {/* Bottom balance callout */}
        {balance.balance_status !== 'settled' && (
          <div className={`px-4 py-4 border-t border-slate-200 flex items-center justify-between ${
            balance.balance_status === 'payable' ? 'bg-red-50' :
            balance.balance_status === 'receivable' ? 'bg-emerald-50' :
            'bg-amber-50'
          }`}>
            <p className={`text-sm font-bold uppercase tracking-wider ${balanceColor}`}>
              {balance.balance_label}
            </p>
            <p className={`text-2xl font-extrabold ${balanceColor}`}>
              {formatCurrency(balance.balance)}
            </p>
          </div>
        )}

        {balance.balance_status === 'settled' && entries.length > 0 && (
          <div className="px-4 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-center">
            <p className="text-slate-500 text-sm font-semibold">✓ Account Settled — Nothing to Pay or Receive</p>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      {entries.length === 0 && (
        <div className="mt-6 border border-red-200 rounded-xl p-4 bg-red-50">
          <p className="text-sm font-semibold text-red-700 mb-2">Danger Zone</p>
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

      {/* Modals */}
      {showAddModal && (
        <AddEntryModal
          party={party}
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            setShowAddModal(false)
            await refreshEntries()
          }}
        />
      )}

      {editEntry && (
        <EditEntryModal
          entry={editEntry}
          party={party}
          onClose={() => setEditEntry(null)}
          onSuccess={async () => {
            setEditEntry(null)
            await refreshEntries()
          }}
        />
      )}

      {showEditParty && (
        <EditPartyModal
          party={party}
          onClose={() => setShowEditParty(false)}
          onSuccess={updated => {
            setParty(updated)
            setShowEditParty(false)
          }}
        />
      )}
    </div>
  )
}
