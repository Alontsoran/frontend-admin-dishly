import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '@/services/api'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await api.get('/auth/me')
      setUser(response.data.data.user)
    } catch (error) {
      localStorage.removeItem('auth_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, data } = response.data
      
      localStorage.setItem('auth_token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(data.user)
      toast.success('התחברת בהצלחה!')
      navigate('/')
    } catch (error: any) {
      const message = error.response?.data?.error || 'אירעה שגיאה בהתחברות'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    navigate('/login')
    toast.success('התנתקת בהצלחה')
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.patch('/auth/update-profile', data)
      setUser(response.data.data.user)
      toast.success('הפרופיל עודכן בהצלחה')
    } catch (error: any) {
      const message = error.response?.data?.error || 'אירעה שגיאה בעדכון הפרופיל'
      toast.error(message)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
