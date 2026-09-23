'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, KeyRound, Mail, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function SettingsClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setEmail(user.email)
    }
    loadUser()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return }

    setPasswordLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) { setPasswordError(error.message) }
    else { setPasswordSuccess(true); setNewPassword(''); setConfirmPassword('') }
    setPasswordLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-4 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">Account preferences</p>
      </div>

      {/* Account Info */}
      <div className="card p-4 lg:p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
            <Mail className="w-[18px] h-[18px] text-indigo-700" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Account</h2>
        </div>
        <div className="bg-slate-50 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-slate-500 mb-0.5">Logged in as</p>
          <p className="font-semibold text-slate-900 break-all">{email || '—'}</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-4 lg:p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
            <KeyRound className="w-[18px] h-[18px] text-indigo-700" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="new_password" className="form-label">New Password</label>
            <div className="relative">
              <input
                id="new_password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="form-input pr-12"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                {showNew ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm_password" className="form-label">Confirm New Password</label>
            <div className="relative">
              <input
                id="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="form-input pr-12"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                {showConfirm ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{passwordError}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-green-700 text-sm font-medium">Password updated successfully.</p>
            </div>
          )}

          <button
            id="change-password-btn"
            type="submit"
            disabled={passwordLoading}
            className="btn-primary w-full sm:w-auto justify-center"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="card p-4 lg:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <LogOut className="w-[18px] h-[18px] text-red-700" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sign Out</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Sign out of this device.</p>
        <button
          id="settings-logout-btn"
          onClick={handleLogout}
          className="btn-danger w-full sm:w-auto justify-center"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
