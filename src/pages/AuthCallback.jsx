import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { handleAzureCallback } = useAuth()
  const [error, setError] = useState(null)
  const processedRef = useRef(false) // Prevenir procesamiento múltiple

  useEffect(() => {
    // Prevenir que se procese múltiples veces
    if (processedRef.current) {
      return
    }

    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Si hay error de Azure AD
    if (errorParam) {
      processedRef.current = true
      const errorMessage = errorDescription || errorParam
      navigate(`/login?error=azure_auth_failed&message=${encodeURIComponent(errorMessage)}`, { replace: true })
      return
    }

    // Si no hay código, puede ser que ya tengamos el token (flujo antiguo)
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')

    if (token && userParam) {
      // Flujo antiguo: token ya viene en la URL
      processedRef.current = true
      try {
        const user = JSON.parse(decodeURIComponent(userParam))
        handleAzureCallback(token, user)
        // Limpiar la URL antes de redirigir
        window.history.replaceState({}, '', '/dashboard')
        navigate('/dashboard', { replace: true })
      } catch (error) {
        console.error('Error al procesar callback:', error)
        navigate('/login?error=callback_parse_error', { replace: true })
      }
      return
    }

    // Nuevo flujo: recibimos el código de Azure AD y lo enviamos al backend
    if (code) {
      processedRef.current = true // Marcar como procesado antes de hacer la llamada
      
      const exchangeCode = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
          const response = await axios.post(`${apiUrl}/auth/azure/exchange`, { code })
          
          const { token, user } = response.data
          handleAzureCallback(token, user)
          
          // Limpiar la URL antes de redirigir para evitar recargas accidentales
          window.history.replaceState({}, '', '/dashboard')
          navigate('/dashboard', { replace: true })
        } catch (error) {
          console.error('Error al intercambiar código:', error)
          let errorMessage = 'Error al procesar la autenticación'
          
          if (error.response?.data?.error) {
            errorMessage = error.response.data.error
          } else if (error.message) {
            errorMessage = error.message
          }
          
          // Si el código ya fue usado, mostrar mensaje específico
          if (errorMessage.includes('already redeemed') || errorMessage.includes('invalid_grant')) {
            errorMessage = 'El código de autorización ya fue utilizado. Por favor, intenta iniciar sesión nuevamente.'
          }
          
          navigate(`/login?error=exchange_error&message=${encodeURIComponent(errorMessage)}`, { replace: true })
        }
      }

      exchangeCode()
    } else {
      // No hay código ni token
      processedRef.current = true
      navigate('/login?error=missing_code', { replace: true })
    }
  }, [searchParams, navigate, handleAzureCallback])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Procesando autenticación...</p>
      </div>
    </div>
  )
}

export default AuthCallback
