'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { partySchema, type PartyFormData } from '@/lib/validations'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function AddPartyModal({ onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartyFormData>({
    resolver: zodResolver(partySchema),
    defaultValues: { party_type: 'supplier' },
  })

  async function onSubmit(data: PartyFormData) {
    setServerError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('parties').insert({
      party_name: data.party_name.trim(),
      party_type: data.party_type,
      user_id: user.id,
    })

    if (error) {
      setServerError(error.code === '23505' ? 'A party with this name already exists.' : error.message)
      return
    }
    onSuccess()
  }

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-box animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Add New Party</h2>
          <button id="close-add-party-modal" onClick={onClose} className="btn-ghost p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Party Name */}
          <div>
            <label htmlFor="party_name" className="form-label">
              Party Name <span className="text-red-500">*</span>
            </label>
            <input
              id="party_name"
              type="text"
              placeholder="e.g. ABC Electronics"
              className="form-input"
              autoCapitalize="words"
              {...register('party_name')}
            />
            {errors.party_name && <p className="form-error">{errors.party_name.message}</p>}
          </div>

          {/* Party Type */}
          <div>
            <label className="form-label">
              Party Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['supplier', 'customer'] as const).map(type => (
                <label
                  key={type}
                  htmlFor={`type-${type}`}
                  className="party-type-option"
                >
                  <input
                    id={`type-${type}`}
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
            {errors.party_type && <p className="form-error">{errors.party_type.message}</p>}
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
              id="save-party-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
            >
              {isSubmitting ? 'Saving...' : 'Save Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
