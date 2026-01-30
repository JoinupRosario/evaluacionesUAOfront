import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Alert from '../components/Alert'

function ResponderEvaluacion() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'success', details: null })

  useEffect(() => {
    fetchEvaluation()
  }, [token])

  const fetchEvaluation = async () => {
    try {
      const response = await api.get(`/evaluations/access-token/${token}`)
      const responseData = response.data
      
      // Adaptar la estructura de datos
      setData({
        evaluation: responseData.evaluation,
        accessToken: responseData.accessToken,
        questions: responseData.questions || []
      })
      
      // Inicializar respuestas vacías
      const initialAnswers = {}
      if (responseData.questions && responseData.questions.length > 0) {
        responseData.questions.forEach((q) => {
          initialAnswers[q._id] = ''
        })
      }
      setAnswers(initialAnswers)
    } catch (error) {
      console.error('Error al cargar evaluación:', error)
      setAlert({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Token inválido o evaluación no encontrada',
        type: 'error',
        details: error.response?.data?.details || error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Formatear respuestas como array de objetos con pregunta_id y respuesta
      const answersArray = Object.entries(answers)
        .filter(([_, respuesta]) => respuesta !== '' && respuesta !== null)
        .map(([pregunta_id, respuesta]) => ({
          pregunta_id,
          respuesta: typeof respuesta === 'object' ? JSON.stringify(respuesta) : String(respuesta)
        }))

      await api.post('/evaluations/access-token/submit', {
        token,
        answers: answersArray
      })

      setAlert({
        isOpen: true,
        title: 'Éxito',
        message: 'Evaluación enviada correctamente. Gracias por tu participación.',
        type: 'success'
      })
      
      // Redirigir después de cerrar la alerta
      setTimeout(() => {
        // No redirigir, solo mostrar mensaje de éxito
        setSubmitting(false)
      }, 2000)
    } catch (error) {
      console.error('Error al enviar respuestas:', error)
      setAlert({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'No se pudieron enviar las respuestas',
        type: 'error',
        details: error.response?.data?.details || error.message
      })
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">No se pudo cargar la evaluación</p>
        </div>
      </div>
    )
  }

  // Determinar el tipo de actor para mostrar información
  const getActorLabel = () => {
    if (!data?.accessToken) return ''
    const actorType = data.accessToken.actor_type
    if (actorType === 'student') return 'Estudiante'
    if (actorType === 'boss') return 'Jefe de Práctica'
    if (actorType === 'monitor') return 'Monitor/Tutor'
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {data.evaluation?.name || 'Evaluación'}
          </h2>
          {data.accessToken && (
            <p className="text-sm text-gray-500 mb-6">
              Tipo: {getActorLabel()} | Email: {data.accessToken.email}
            </p>
          )}

          {data.questions && data.questions.length > 0 ? (
            <form onSubmit={handleSubmit}>
              {data.questions.map((question, index) => (
                <div key={question._id} className="mb-6 pb-6 border-b border-gray-200 last:border-b-0">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {index + 1}. {question.texto}
                    {question.requerida && <span className="text-red-500"> *</span>}
                  </label>

                  {question.tipo === 'texto' && (
                    <textarea
                      value={answers[question._id] || ''}
                      onChange={(e) =>
                        handleAnswerChange(question._id, e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows="4"
                      placeholder="Escribe tu respuesta aquí..."
                      required={question.requerida}
                    />
                  )}

                  {question.tipo === 'opcion_multiple' && question.opciones && question.opciones.length > 0 && (
                    <div className="space-y-2">
                      {question.opciones.map((opcion, idx) => (
                        <label
                          key={idx}
                          className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="radio"
                            name={question._id}
                            value={opcion.valor || opcion.texto}
                            checked={answers[question._id] === (opcion.valor || opcion.texto)}
                            onChange={(e) =>
                              handleAnswerChange(question._id, e.target.value)
                            }
                            className="w-4 h-4 text-red-600 focus:ring-red-500"
                            required={question.requerida}
                          />
                          <span className="text-gray-700">{opcion.texto || opcion.valor}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.tipo === 'escala' && (
                    <div className="space-y-3">
                      <input
                        type="range"
                        min={question.scale_min || 1}
                        max={question.scale_max || 5}
                        value={answers[question._id] || Math.floor((question.scale_min || 1 + question.scale_max || 5) / 2)}
                        onChange={(e) =>
                          handleAnswerChange(question._id, e.target.value)
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                        required={question.requerida}
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>
                          {question.scale_min || 1} 
                          {question.scale_labels?.min_label ? ` (${question.scale_labels.min_label})` : ''}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span>
                          {question.scale_max || 5}
                          {question.scale_labels?.max_label ? ` (${question.scale_labels.max_label})` : ''}
                        </span>
                      </div>
                      <p className="text-center text-gray-700 font-medium mt-2">
                        Valor seleccionado: <span className="text-red-600">
                          {answers[question._id] || Math.floor(((question.scale_min || 1) + (question.scale_max || 5)) / 2)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-800 hover:bg-red-900 text-white px-8 py-3 rounded-lg font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enviando...' : 'Enviar Evaluación'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Esta evaluación aún no tiene preguntas configuradas.</p>
              <p className="text-sm text-gray-500">Por favor, contacta al administrador.</p>
            </div>
          )}
        </div>
      </div>

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

export default ResponderEvaluacion
