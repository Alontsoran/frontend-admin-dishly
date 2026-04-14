import axios from 'axios'

/** Backend בפרודקשן (Vercel) — ניתן לעקוף עם VITE_API_URL */
const PRODUCTION_API_BASE = 'https://backend-dowe.vercel.app/api'

// Development: local backend. Production: Vercel backend (override with VITE_API_URL)
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? PRODUCTION_API_BASE : 'http://localhost:5000/api')

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes for AI requests
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 401: רק כשלא מדובר במסך התחברות — אחרת נמחק טוקן ומפנים (מונע לולאה על POST /auth/login שנכשל)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const reqUrl = String(error.config?.url || '')
      const isLoginPost = reqUrl.includes('/auth/login')
      if (!isLoginPost) {
        localStorage.removeItem('auth_token')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)
