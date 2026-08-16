import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { User } from '../types'
import { toast } from 'react-toastify'

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
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
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Invalid credentials.'
      toast.error(msg)
      throw error;
    }
  }

  const register = async (fullName: string, email: string, password: string, phone: string, role: string) => {
    try {
      const response = await api.post('/auth/register', { fullName, email, password, phone, role })
      const { token, refreshToken, userId, role: responseRole, customerId } = response.data
      
      const loggedUser: User = { id: userId, email, fullName, role: responseRole, active: true, customerId }
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(loggedUser))
      
      setUser(loggedUser)
      toast.success('Registration successful!')
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed. Email might be in use.'
      toast.error(msg)
      throw error;
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
