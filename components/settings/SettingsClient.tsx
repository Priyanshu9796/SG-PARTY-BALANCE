'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, KeyRound, Mail, CheckCircle } from 'lucide-react'

export default function SettingsClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Account preferences</p>
      </div>

      {/* Account Info */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Mail className="w-[18px] h-[18px] text-indigo-700" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Account</h2>
        </div>
        <div className="bg-slate-50 rounded-lg px-4 py-3">
          <p className="text-xs font-medium text-slate-500 mb-0.5">Logged in as</p>
          <p className="font-semibold text-slate-900">{email || '—'}</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <KeyRound className="w-[18px] h-[18px] text-indigo-700" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="new_password" className="form-label">New Password</label>
            <input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="form-input"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm_password" className="form-label">Confirm New Password</label>
            <input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="form-input"
              autoComplete="new-password"
            />
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              <p className="text-red-600 text-sm">{passwordError}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3.5 py-2.5 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-green-700 text-sm font-medium">Password updated successfully.</p>
            </div>
          )}

          <button
            id="change-password-btn"
            type="submit"
            disabled={passwordLoading}
            className="btn-primary"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
            <LogOut className="w-[18px] h-[18px] text-red-700" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sign Out</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Sign out of this device. You will need to log in again.</p>
        <button
          id="settings-logout-btn"
          onClick={handleLogout}
          className="btn-danger"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
