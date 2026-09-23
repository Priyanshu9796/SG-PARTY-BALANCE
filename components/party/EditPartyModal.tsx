'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { partySchema, type PartyFormData } from '@/lib/validations'
import type { Party } from '@/lib/calculations'

interface Props {
  party: Party
  onClose: () => void
  onSuccess: (updated: Party) => void
}

export default function EditPartyModal({ party, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartyFormData>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      party_name: party.party_name,
      party_type: party.party_type,
    },
  })

  async function onSubmit(data: PartyFormData) {
    setServerError('')
    const supabase = createClient()

    const { data: updated, error } = await supabase
      .from('parties')
      .update({
        party_name: data.party_name.trim(),
        party_type: data.party_type,
      })
      .eq('id', party.id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        setServerError('A party with this name already exists.')
      } else {
        setServerError(error.message)
      }
      return
    }

    onSuccess(updated as Party)
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Edit Party</h2>
          <button id="close-edit-party-modal" onClick={onClose} className="btn-ghost p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="edit_party_name" className="form-label">
              Party Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit_party_name"
              type="text"
              className="form-input"
              {...register('party_name')}
            />
            {errors.party_name && (
              <p className="form-error">{errors.party_name.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Party Type <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {(['supplier', 'customer'] as const).map(type => (
                <label
                  key={type}
                  htmlFor={`edit-type-${type}`}
                  className="relative flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer
                             transition-all duration-150 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50
                             border-slate-200 hover:border-slate-300"
                >
                  <input
                    id={`edit-type-${type}`}
                    type="radio"
                    value={type}
                    className="sr-only"
                    {...register('party_type')}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 capitalize">{type}</p>
                    <p className="text-xs text-slate-500">
                      {type === 'supplier' ? 'You owe them' : 'They owe you'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              <p className="text-red-600 text-sm">{serverError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              id="update-party-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
            >
              {isSubmitting ? 'Saving...' : 'Update Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
