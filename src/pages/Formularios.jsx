import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import Alert from '../components/Alert'

function Formularios() {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, surveyId: null })
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'success', details: null })

  useEffect(() => {
    fetchSurveys()
  }, [])

  const fetchSurveys = async () => {
    try {
      const response = await api.get('/surveys')
      setSurveys(response.data)
    } catch (error) {
      console.error('Error al obtener formularios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (id) => {
    setConfirmDialog({ isOpen: true, surveyId: id })
  }

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/surveys/${confirmDialog.surveyId}`)
      setAlert({
        isOpen: true,
        title: 'Éxito',
        message: 'Formulario eliminado correctamente',
        type: 'success'
      })
      fetchSurveys()
    } catch (error) {
      console.error('Error al eliminar formulario:', error)
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo eliminar el formulario',
        type: 'error',
        details: error.response?.data?.error || error.message
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formularios</h1>
          <p className="text-gray-600 mt-1">Crea y gestiona formularios de evaluación</p>
        </div>
            <Link
              to="/crear-formulario"
              className="bg-red-800 hover:bg-red-900 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-colors flex items-center space-x-2"
            >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Formulario</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div>
          <p className="mt-4 text-gray-600">Cargando formularios...</p>
        </div>
      ) : surveys.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay formularios creados</h3>
          <p className="text-gray-600 mb-6">Comienza creando tu primer formulario de evaluación</p>
          <Link
            to="/crear-formulario"
            className="inline-flex items-center px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 font-medium"
          >
            Crear Formulario
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex-1">
                  {survey.name}
                </h3>
                <div className="flex flex-col items-end space-y-1">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      survey.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : survey.status === 'DRAFT'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {survey.status === 'ACTIVE' ? 'Activo' : survey.status === 'DRAFT' ? 'Borrador' : 'Archivado'}
                  </span>
                  {survey.survey_type && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        survey.survey_type === 'MONITORING'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-orange-100 text-orange-800 border border-orange-200'
                      }`}
                    >
                      {survey.survey_type === 'MONITORING' ? 'Monitoría' : 'Práctica'}
                    </span>
                  )}
                </div>
              </div>

              {survey.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {survey.description}
                </p>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{survey.questions_count} preguntas totales</span>
                  </span>
                  <span>
                    {new Date(survey.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Mostrar los 3 formularios */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
                    <div className="w-6 h-6 bg-red-800 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-white text-xs font-bold">E</span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">Estudiante</p>
                    <p className="text-xs text-gray-500">{survey.student_questions || 0} preguntas</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">Tutor</p>
                    <p className="text-xs text-gray-500">{survey.tutor_questions || 0} preguntas</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded p-2 text-center">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-white text-xs font-bold">M</span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">Monitor</p>
                    <p className="text-xs text-gray-500">{survey.monitor_questions || 0} preguntas</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/editar-formulario/${survey.id}`}
                  className="flex-1 bg-red-50 text-red-800 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDeleteClick(survey.id)}
                  className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, surveyId: null })}
        onConfirm={handleDeleteConfirm}
        title="Confirmar eliminación"
        message="¿Está seguro de eliminar este formulario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Alerta de resultado */}
      <Alert
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        details={alert.details}
      />
    </div>
  )
}

export default Formularios
