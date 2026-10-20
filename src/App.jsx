import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import CrearEvaluacion from './pages/CrearEvaluacion'
import ResponderEvaluacion from './pages/ResponderEvaluacion'
import Resultados from './pages/Resultados'
import Formularios from './pages/Formularios'
import CrearFormulario from './pages/CrearFormulario'
import Reportes from './pages/Reportes'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'

const isConsultaReportes = (user) => user?.conexion_role === 'Consulta reportes'

const PrivateRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" />
  if (isConsultaReportes(user)) return <Navigate to="/reportes" replace />
  return <Layout>{children}</Layout>
}

const AdminGeneralRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" />
  if (isConsultaReportes(user)) return <Navigate to="/reportes" replace />
  if (user?.conexion_role !== 'Administrador General') {
    return <Navigate to="/dashboard" replace />
  }
  return <Layout>{children}</Layout>
}

const ReportesRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" />
  const allowed = user?.conexion_role === 'Administrador General' || isConsultaReportes(user)
  if (!allowed) return <Navigate to="/dashboard" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/api/auth/azure/callback" element={<AuthCallback />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/formularios" element={<AdminGeneralRoute><Formularios /></AdminGeneralRoute>} />
      <Route path="/crear-formulario" element={<AdminGeneralRoute><CrearFormulario /></AdminGeneralRoute>} />
      <Route path="/editar-formulario/:id" element={<AdminGeneralRoute><CrearFormulario /></AdminGeneralRoute>} />
      <Route path="/reportes" element={<ReportesRoute><Reportes /></ReportesRoute>} />
      <Route path="/crear-evaluacion" element={<PrivateRoute><CrearEvaluacion /></PrivateRoute>} />
      <Route path="/editar-evaluacion/:id" element={<PrivateRoute><CrearEvaluacion /></PrivateRoute>} />
      <Route path="/responder-evaluacion/:token" element={<ResponderEvaluacion />} />
      <Route path="/evaluacion/:token" element={<ResponderEvaluacion />} />
      <Route path="/resultados/:id" element={<PrivateRoute><Resultados /></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
