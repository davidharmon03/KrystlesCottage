import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, X, Loader } from 'lucide-react'

export default function TwoFactorModal({ isOpen, state, error, onSubmit, onCancel, purpose = 'login' }) {
  const [code, setCode] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setCode('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  if (!isOpen) return null

  const purposeLabels = {
    login:          'access the Admin Panel',
    billing:        'manage billing',
    remove_member:  'remove a group member',
    change_password:'change your password',
    change_email:   'change your email',
    delete_account: 'delete your account',
  }

  const label = purposeLabels[purpose] || 'continue'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code.length === 6) onSubmit(code)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-moss-50 flex items-center justify-center">
              <ShieldCheck size={16} className="text-moss-600" />
            </div>
            <h2 className="font-semibold text-ink">Verification Required</h2>
          </div>
          <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {state === 'sending' ? (
          <div className="text-center py-6">
            <Loader size={24} className="animate-spin text-moss-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Sending code to your email…</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-5">
              To {label}, enter the 6-digit code we sent to your email. It expires in 10 minutes.
            </p>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-widest border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-moss-400 transition-colors"
              />

              {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={code.length !== 6 || state === 'verifying'}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-moss-600 text-white text-sm font-medium hover:bg-moss-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {state === 'verifying' ? <Loader size={14} className="animate-spin" /> : null}
                  Verify
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
