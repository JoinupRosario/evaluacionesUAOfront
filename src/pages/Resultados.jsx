import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

function Resultados() {
  const { id } = useParams()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [id])

  const fetchResults = async () => {
    try {
      const response = await api.get(`/evaluations/${id}/resultados`)
      setResults(response.data)
    } catch (error) {
      console.error('Error al obtener resultados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando resultados...</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">No se pudieron cargar los resultados</p>
      </div>
    )
  }

  const groupedAnswers = results.answers.reduce((acc, answer) => {
    const studentId = answer.estudiante_id._id || answer.estudiante_id
    if (!acc[studentId]) {
      acc[studentId] = {
        student: answer.estudiante_id,
        answers: []
      }
    }
    acc[studentId].answers.push(answer)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Resultados</h2>
            <Link
              to="/dashboard"
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Volver al Dashboard
            </Link>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Estado de Completación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Total Respuestas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {results.answers.length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {results.statuses.filter((s) => s.completada).length}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {results.statuses.filter((s) => !s.completada).length}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Respuestas por Estudiante
            </h3>
            <div className="space-y-4">
              {Object.values(groupedAnswers).map((group, idx) => (
                <div key={idx} className="border border-gray-300 rounded-md p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    {group.student.nombre} {group.student.apellido} -{' '}
                    {group.student.email}
                  </h4>
                  <div className="space-y-2">
                    {group.answers.map((answer, aIdx) => (
                      <div key={aIdx} className="bg-gray-50 p-3 rounded-md">
                        <p className="font-medium text-sm text-gray-700 mb-1">
                          {answer.pregunta_id?.texto || 'Pregunta'}
                        </p>
                        <p className="text-gray-600">{answer.respuesta}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(answer.fecha_respuesta).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Resultados
