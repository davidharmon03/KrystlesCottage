import axios from 'axios'

// The refresh token is what keeps people signed in for 7 days. It is kept beside
// the access token in localStorage; held only in memory, it was lost on every
// reload, and members were signed out 15 minutes after reopening the app.
const REFRESH_KEY = 'kbh_refresh'
let isRefreshing = false
let failedQueue = []

const storage = {
  get: key => { try { return localStorage.getItem(key) } catch { return null } },
  set: (key, value) => { try { localStorage.setItem(key, value) } catch {} },
  remove: key => { try { localStorage.removeItem(key) } catch {} },
}

export const setRefreshToken = (token) => { if (token) storage.set(REFRESH_KEY, token) }
export const clearRefreshToken = () => { storage.remove(REFRESH_KEY) }
export const getRefreshToken = () => storage.get(REFRESH_KEY)

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

// The server serves both the website and the API from one address, so '/api' works
// everywhere: locally (vite proxies it) and in production (same origin).
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
})

// Request interceptor — attach access token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('kbh_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle 401 with silent refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // Don't retry refresh or login endpoints, and don't retry already-retried requests
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Queue requests that arrive while a refresh is already in-flight
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      }).catch(err => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) throw new Error('No saved sign-in')
      const res = await axios.post(API_BASE + '/auth/refresh', { refreshToken })
      const newToken = res.data.token
      localStorage.setItem('kbh_token', newToken)
      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      localStorage.removeItem('kbh_token')
      localStorage.removeItem('kbh_user')
      clearRefreshToken()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
