import React, { createContext, useContext, useState, useEffect } from 'react'
import { AxiosError } from 'axios'
import api from '../services/api'
import { User, UserRole } from '../types'
import { toast } from 'react-toastify'

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

type ApiErrorResponse = {
  message?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    return (error.response?.data as ApiErrorResponse | undefined)?.message || fallback
  }

  return fallback
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, refreshToken, userId, fullName, role, customerId } = response.data
      
      const loggedUser: User = { id: userId, email, fullName, role, active: true, customerId }
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(loggedUser))
      
      setUser(loggedUser)
      toast.success(`Welcome back, ${fullName}!`)
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error, 'Login failed. Check your email and password.')
      toast.error(msg)
      throw error
    }
  }

  const register = async (fullName: string, email: string, password: string, phone: string, role: UserRole) => {
    try {
      const response = await api.post('/auth/register', { fullName, email, password, phone, role })
      const { token, refreshToken, userId, role: responseRole, customerId } = response.data
      
      const loggedUser: User = { id: userId, email, fullName, role: responseRole, active: true, customerId }
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(loggedUser))
      
      setUser(loggedUser)
      toast.success('Registration successful!')
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error, 'Registration failed. This email may already be in use.')
      toast.error(msg)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
    toast.info('Logged out successfully.')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
