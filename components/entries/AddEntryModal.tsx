'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { entrySchema, type EntryFormData } from '@/lib/validations'
import type { Party } from '@/lib/calculations'

interface Props {
  party: Party
  onClose: () => void
  onSuccess: () => void
}

function getEntryTypes(partyType: string) {
  if (partyType === 'supplier') return ['bill', 'paid'] as const
  return ['bill', 'received'] as const
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function AddEntryModal({ party, onClose, onSuccess }: Props) {
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
      entry_type: 'bill',
      entry_date: getTodayDate(),
    },
  })

  const selectedType = watch('entry_type')

  async function onSubmit(data: EntryFormData) {
    setServerError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('party_entries').insert({
      party_id: party.id,
      user_id: user.id,
      entry_number: data.entry_number.trim(),
      entry_date: data.entry_date,
      entry_type: data.entry_type,
      amount: data.amount,
    })

    if (error) { setServerError(error.message); return }
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Entry</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
              {party.party_name} · {party.party_type.toUpperCase()}
            </p>
          </div>
          <button id="close-add-entry-modal" onClick={onClose} className="btn-ghost p-1 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Entry Type Toggle */}
          <div>
            <label className="form-label">Entry Type <span className="text-red-500">*</span></label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              {entryTypes.map(type => (
                <label
                  key={type}
                  htmlFor={`entry-type-${type}`}
                  className={`
                    flex-1 text-center py-3 text-sm font-bold cursor-pointer transition-colors
                    ${selectedType === type
                      ? type === 'bill'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100'
                    }
                  `}
                >
                  <input
                    id={`entry-type-${type}`}
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
            <label htmlFor="entry_number" className="form-label">
              Entry / Ref No <span className="text-red-500">*</span>
            </label>
            <input
              id="entry_number"
              type="text"
              placeholder="e.g. INV-001"
              className="form-input"
              autoCapitalize="characters"
              {...register('entry_number')}
            />
            {errors.entry_number && <p className="form-error">{errors.entry_number.message}</p>}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="entry_date" className="form-label">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="entry_date"
              type="date"
              className="form-input"
              {...register('entry_date')}
            />
            {errors.entry_date && <p className="form-error">{errors.entry_date.message}</p>}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="form-label">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">₹</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="form-input pl-8"
                inputMode="decimal"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && <p className="form-error">{errors.amount.message}</p>}
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              <p className="text-red-600 text-sm">{serverError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              id="save-entry-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
            >
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
