import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CrearEvaluacion from './pages/CrearEvaluacion'
import ResponderEvaluacion from './pages/ResponderEvaluacion'
import Resultados from './pages/Resultados'
import Formularios from './pages/Formularios'
import CrearFormulario from './pages/CrearFormulario'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/formularios" element={<PrivateRoute><Formularios /></PrivateRoute>} />
      <Route path="/crear-formulario" element={<PrivateRoute><CrearFormulario /></PrivateRoute>} />
      <Route path="/editar-formulario/:id" element={<PrivateRoute><CrearFormulario /></PrivateRoute>} />
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
