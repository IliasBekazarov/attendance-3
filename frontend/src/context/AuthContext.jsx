import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext()

export { AuthContext }

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', { username, password })
      const { access, refresh, user } = response.data
      
      localStorage.setItem('token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      navigate('/dashboard')
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const value = {
    user,
    setUser,
    updateUser,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
