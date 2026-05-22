import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../api'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found.')
      return
    }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Invalid or expired link.')
      })
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-moss-900 via-moss-700 to-moss-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        {status === 'loading' && (
          <>
            <Loader size={40} className="text-moss-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-moss-500 mx-auto mb-4" />
            <h1 className="font-serif font-semibold text-ink text-xl mb-2">Email Verified!</h1>
            <p className="text-slate-500 text-sm mb-6">Your email address has been confirmed. You're good to go.</p>
            <Link to="/" className="btn-primary w-full block text-center">
              Go to Dashboard
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h1 className="font-serif font-semibold text-ink text-xl mb-2">Verification Failed</h1>
            <p className="text-slate-500 text-sm mb-6">{message}</p>
            <Link to="/" className="btn-ghost w-full block text-center">
              Back to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
