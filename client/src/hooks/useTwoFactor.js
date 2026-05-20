import { useState, useRef } from 'react'
import api from '../api'

// In-memory 2FA session store — cleared on page refresh (intentional)
const sessions = {}

export function useTwoFactor() {
  const [state, setState] = useState('idle') // idle | sending | waiting | verifying | error
  const [error, setError] = useState('')
  const resolveRef = useRef(null)
  const rejectRef  = useRef(null)
  const purposeRef = useRef('login')

  // Returns a promise — resolves with twoFaToken on success, rejects on cancel
  const request = (purpose = 'login') => {
    purposeRef.current = purpose

    // Check if we already have a valid session for this purpose
    const existing = sessions[purpose]
    if (existing && new Date(existing.expiresAt) > new Date()) {
      return Promise.resolve(existing.token)
    }

    return new Promise((resolve, reject) => {
      resolveRef.current = resolve
      rejectRef.current  = reject
      setState('sending')
      setError('')

      api.post('/auth/2fa/send', { purpose })
        .then(() => setState('waiting'))
        .catch(() => {
          setError('Failed to send code. Check your email settings.')
          setState('error')
          reject(new Error('send_failed'))
        })
    })
  }

  const submit = async (code) => {
    setState('verifying')
    setError('')
    try {
      const res = await api.post('/auth/2fa/verify', { code, purpose: purposeRef.current })
      // Cache the session token in memory
      sessions[purposeRef.current] = {
        token:     res.data.twoFaToken,
        expiresAt: res.data.expiresAt,
      }
      setState('idle')
      resolveRef.current?.(res.data.twoFaToken)
    } catch {
      setError('Invalid or expired code. Try again.')
      setState('waiting')
    }
  }

  const cancel = () => {
    setState('idle')
    setError('')
    rejectRef.current?.(new Error('cancelled'))
  }

  const isOpen = state === 'waiting' || state === 'verifying' || state === 'sending' || state === 'error'

  // Get current session token for a purpose (to attach to sensitive requests)
  const getToken = (purpose = 'login') => {
    const s = sessions[purpose]
    if (!s || new Date(s.expiresAt) <= new Date()) return null
    return s.token
  }
