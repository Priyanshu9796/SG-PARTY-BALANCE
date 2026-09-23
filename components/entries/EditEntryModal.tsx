'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { entrySchema, type EntryFormData } from '@/lib/validations'
import type { Party, PartyEntry } from '@/lib/calculations'

interface Props {
  party: Party
  entry: PartyEntry
  onClose: () => void
  onSuccess: () => void
}

function getEntryTypes(partyType: string) {
  if (partyType === 'supplier') return ['bill', 'paid'] as const
  return ['bill', 'received'] as const
}

export default function EditEntryModal({ party, entry, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState('')
  const entryTypes = getEntryTypes(party.party_type)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      entry_number: entry.entry_number,
      entry_date: entry.entry_date,
      entry_type: entry.entry_type as 'bill' | 'paid' | 'received',
      amount: Number(entry.amount),
    },
  })

  const selectedType = watch('entry_type')

  async function onSubmit(data: EntryFormData) {
    setServerError('')
    const supabase = createClient()

    const { error } = await supabase
      .from('party_entries')
      .update({
        entry_number: data.entry_number.trim(),
        entry_date: data.entry_date,
        entry_type: data.entry_type,
        amount: data.amount,
      })
      .eq('id', entry.id)

    if (error) {
      setServerError(error.message)
      return
    }

    onSuccess()
  }

  const typeLabels: Record<string, string> = {
    bill: 'BILL',
    paid: 'PAID',
    received: 'RECEIVED',
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Entry</h2>
            <p className="text-xs text-slate-500 mt-0.5">{party.party_name} · {party.party_type.toUpperCase()}</p>
          </div>
          <button id="close-edit-entry-modal" onClick={onClose} className="btn-ghost p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Entry Type Selector */}
          <div>
            <label className="form-label">Entry Type <span className="text-red-500">*</span></label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {entryTypes.map(type => (
                <label
                  key={type}
                  htmlFor={`edit-entry-type-${type}`}
                  className={`flex-1 text-center py-2.5 text-sm font-semibold cursor-pointer transition-colors ${
                    selectedType === type
                      ? type === 'bill'
                        ? 'bg-amber-500 text-white'
                        : 'bg-green-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    id={`edit-entry-type-${type}`}
                    type="radio"
                    value={type}
                    className="sr-only"
                    {...register('entry_type')}
                  />
                  {typeLabels[type]}
                </label>
              ))}
            </div>
          </div>

          {/* Entry Number */}
          <div>
            <label htmlFor="edit_entry_number" className="form-label">
              Entry / Reference No <span className="text-red-500">*</span>
            </label>
            <input
              id="edit_entry_number"
              type="text"
              className="form-input"
              {...register('entry_number')}
            />
            {errors.entry_number && (
              <p className="form-error">{errors.entry_number.message}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="edit_entry_date" className="form-label">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="edit_entry_date"
              type="date"
              className="form-input"
              {...register('entry_date')}
            />
            {errors.entry_date && (
              <p className="form-error">{errors.entry_date.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="edit_amount" className="form-label">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">₹</span>
              <input
                id="edit_amount"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input pl-8"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <p className="form-error">{errors.amount.message}</p>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              <p className="text-red-600 text-sm">{serverError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              id="update-entry-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
            >
              {isSubmitting ? 'Updating...' : 'Update Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
