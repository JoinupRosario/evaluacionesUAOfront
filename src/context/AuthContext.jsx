import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    }
    setLoading(false)
  }, [token])

  const login = async (email, password) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const response = await axios.post(`${apiUrl}/auth/login`, { email, password })
      const { token: newToken, user: userData } = response.data
      
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al iniciar sesión'
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const response = await axios.put(`${apiUrl}/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      })
      
      return { success: true, message: response.data.message || 'Contraseña actualizada exitosamente' }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al cambiar contraseña'
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      changePassword,
      isAuthenticated: !!token,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}
