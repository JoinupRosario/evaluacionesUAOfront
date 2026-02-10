import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/images/logouao.png'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Verificar si hay errores en la URL (desde Azure AD callback)
  useEffect(() => {
    const urlError = searchParams.get('error')
    const errorMessage = searchParams.get('message')
    const userEmail = searchParams.get('email')
    
    if (urlError) {
      let errorText = 'Error al iniciar sesión'
      
      switch (urlError) {
        case 'azure_login_failed':
          errorText = 'Error al iniciar sesión con Office 365. Por favor, intenta nuevamente.'
          break
        case 'azure_auth_failed':
          errorText = errorMessage || 'Error en la autenticación con Office 365.'
          break
        case 'no_authorization_code':
          errorText = 'No se recibió el código de autorización de Office 365.'
          break
        case 'token_acquisition_failed':
          errorText = 'Error al obtener el token de Office 365.'
          break
        case 'no_email_in_token':
          errorText = 'No se encontró el email en el token de Office 365.'
          break
        case 'user_not_found':
          errorText = userEmail 
            ? `Usuario no encontrado: ${userEmail}. Contacta al administrador.`
            : 'Usuario no encontrado en el sistema. Contacta al administrador.'
          break
        case 'no_roles_assigned':
          errorText = 'Acceso denegado: el usuario no tiene roles asignados.'
          break
        case 'callback_error':
          errorText = errorMessage || 'Error en el proceso de autenticación.'
          break
        case 'exchange_error':
          errorText = errorMessage || 'Error al intercambiar el código de autorización. Por favor, intenta iniciar sesión nuevamente.'
          break
        case 'missing_code':
          errorText = 'No se recibió el código de autorización. Por favor, intenta iniciar sesión nuevamente.'
          break
        default:
          errorText = errorMessage || 'Error desconocido al iniciar sesión.'
      }
      
      setError(errorText)
      // Limpiar los parámetros de la URL
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate])

  const handleAzureLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    window.location.href = `${apiUrl}/auth/azure`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center  px-4 py-8">
      {/* Logo fuera del formulario */}
      <div className="mb-8">
        <img src={logo} alt="Logo" className="h-24 object-contain drop-shadow-lg" />
      </div>

      {/* Formulario de login */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Iniciar Sesión
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Ingresa tus credenciales para continuar
        </p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6 animate-pulse">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Usuario o Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu usuario o email"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O</span>
          </div>
        </div>

        {/* Botón de Office 365 */}
        <button
          type="button"
          onClick={handleAzureLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="10" height="10" fill="#F25022"/>
            <rect x="12.5" y="0.5" width="10" height="10" fill="#7FBA00"/>
            <rect x="0.5" y="12.5" width="10" height="10" fill="#00A4EF"/>
            <rect x="12.5" y="12.5" width="10" height="10" fill="#FFB900"/>
          </svg>
          <span>Iniciar sesión con Office 365</span>
        </button>
      </div>
    </div>
  )
}

export default Login
