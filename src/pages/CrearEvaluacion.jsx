import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Alert from '../components/Alert'

function CrearEvaluacion() {
  const { id } = useParams() // Obtener el ID de la URL para edición
  const isDuplicatingRef = useRef(false) // Ref para evitar que useEffect interfiera al duplicar

  const [formData, setFormData] = useState({
    name: '',
    period: '',
    practice_type: '',
    type_survey: '', // ID del formulario (item.id de MySQL)
    // COMENTADO: faculty_id eliminado - ya no se usa
    program_faculty_ids: [], // Ahora contiene program_id directamente
    start_date: '',
    finish_date: '',
    alert_value: '',
    alert_unit: 'DAYS',
    alert_when: 'AFTER_START_PRACTICE'
  })
  const [periodos, setPeriodos] = useState([])
  // COMENTADO: facultades eliminado - ya no se usa
  const [tiposPractica, setTiposPractica] = useState([])
  const [tiposEncuesta, setTiposEncuesta] = useState([])
  const [programas, setProgramas] = useState([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'success', details: null })
  const [isDuplicating, setIsDuplicating] = useState(false)
  const navigate = useNavigate()

  const isEditing = !!id && !isDuplicating // Determinar si estamos en modo edición (no si estamos duplicando)

  useEffect(() => {
    fetchData()
    if (isEditing && !isDuplicating && !isDuplicatingRef.current) {
      fetchEvaluationData()
    }
  }, [isEditing, id]) // Removido isDuplicating de las dependencias para evitar re-ejecuciones innecesarias

  // COMENTADO: useEffect de facultad eliminado - ahora se cargan todos los programas al inicio

  const fetchEvaluationData = async () => {
    try {
      setLoading(true)
      
      const response = await api.get(`/evaluations/${id}`)
      const evaluation = response.data

      if (!evaluation) {
        setAlert({
          isOpen: true,
          title: 'Error',
          message: 'Evaluación no encontrada',
          type: 'error'
        })
        navigate('/dashboard')
        return
      }

      // Formatear fechas para los inputs de tipo date
      const formatDateForInput = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toISOString().split('T')[0]
      }

      // Cargar datos de evaluación de práctica
      setFormData({
        name: evaluation.name || '',
        period: evaluation.period?.toString() || '',
        practice_type: evaluation.practice_type?.toString() || '',
        type_survey: evaluation.type_survey?.toString() || '', // Cargar type_survey
        // COMENTADO: faculty_id eliminado
        program_faculty_ids: evaluation.program_faculty_ids || [], // Ahora contiene program_id directamente
        start_date: formatDateForInput(evaluation.start_date),
        finish_date: formatDateForInput(evaluation.finish_date),
        alert_value: evaluation.alert_value?.toString() || '',
        alert_unit: evaluation.alert_unit || 'DAYS',
        alert_when: evaluation.alert_when || 'AFTER_START_PRACTICE'
      })

      // COMENTADO: Ya no se necesita cargar programas por facultad, se cargan todos al inicio
    } catch (error) {
      console.error('Error al cargar evaluación:', error)
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo cargar la evaluación para edición',
        type: 'error',
        details: error.response?.data?.error || error.message
      })
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      // COMENTADO: facultades eliminado - ya no se usa
      const [periodosRes, tiposRes, tiposEncuestaRes, programasRes] = await Promise.all([
        api.get('/academics/periodos'),
        api.get('/academics/tipos-practica'),
        api.get('/academics/tipos-encuesta'),
        api.get('/academics/programas') // Cargar todos los programas al inicio
      ])
      setPeriodos(periodosRes.data)
      // COMENTADO: setFacultades eliminado
      setTiposPractica(tiposRes.data)
      setTiposEncuesta(tiposEncuestaRes.data)
      setProgramas(programasRes.data) // Cargar todos los programas
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  // COMENTADO: fetchProgramas eliminado - ahora se cargan todos los programas en fetchData

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleProgramToggle = (programId) => {
    const currentIds = formData.program_faculty_ids || []
    if (currentIds.includes(programId)) {
      setFormData({
        ...formData,
        program_faculty_ids: currentIds.filter(id => id !== programId)
      })
    } else {
      setFormData({
        ...formData,
        program_faculty_ids: [...currentIds, programId]
      })
    }
  }

  const handleRemoveProgram = (programId) => {
    setFormData({
      ...formData,
      program_faculty_ids: formData.program_faculty_ids.filter(id => id !== programId)
    })
  }

  const handleDuplicate = () => {
    // Marcar que estamos duplicando para evitar que useEffect interfiera
    isDuplicatingRef.current = true
    
    // Modificar el nombre para indicar que es una copia (evitar duplicar " (Copia)")
    const currentName = formData.name || 'Nueva Evaluación'
    const nameWithoutCopy = currentName.replace(/\s*\(Copia\)\s*$/, '')
    
    // Actualizar el estado del nombre y cambiar a modo duplicación
    setFormData(prev => ({
      ...prev,
      name: `${nameWithoutCopy} (Copia)`
    }))
    
    setIsDuplicating(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setProcessing(true)
    setProcessingMessage(
      isDuplicating 
        ? 'Duplicando evaluación...' 
        : isEditing 
        ? 'Actualizando evaluación...' 
        : 'Creando evaluación...'
    )

    try {
      // Preparar datos para enviar
      const payload = {
        name: formData.name,
        period: parseInt(formData.period),
        practice_type: formData.practice_type ? parseInt(formData.practice_type) : null,
        type_survey: formData.type_survey ? parseInt(formData.type_survey) : null, // Incluir type_survey
        // COMENTADO: faculty_id eliminado - ya no se usa
        program_faculty_ids: formData.program_faculty_ids.map(id => parseInt(id)), // Ahora contiene program_id directamente
        start_date: formData.start_date,
        finish_date: formData.finish_date,
        alert_value: formData.alert_value ? parseInt(formData.alert_value) : 0,
        alert_unit: formData.alert_unit,
        alert_when: formData.alert_when
      }

      setProcessingMessage('Guardando información...')
      
      let response
      if (isEditing && !isDuplicating) {
        response = await api.put(`/evaluations/${id}`, payload)
      } else {
        response = await api.post('/evaluations', payload)
      }

      setProcessingMessage('Calculando totales de estudiantes y jefes...')
      // Esperar un poco para que el backend procese
      await new Promise(resolve => setTimeout(resolve, 2000))

      setProcessingMessage('Generando links de acceso únicos...')
      // Esperar un poco más para la generación de tokens
      await new Promise(resolve => setTimeout(resolve, 2000))

      setProcessingMessage('Finalizando...')
      await new Promise(resolve => setTimeout(resolve, 500))

      setProcessing(false)
      setAlert({
        isOpen: true,
        title: 'Éxito',
        message: isDuplicating 
          ? 'Evaluación duplicada y creada correctamente'
          : isEditing 
          ? 'Evaluación actualizada correctamente' 
          : 'Evaluación creada correctamente',
        type: 'success'
      })
      
      // Redirigir después de cerrar la alerta
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (error) {
      console.error(`Error al ${isEditing ? 'actualizar' : 'crear'} evaluación:`, error)
      setProcessing(false)
      setAlert({
        isOpen: true,
        title: 'Error',
        message: `No se pudo ${isEditing ? 'actualizar' : 'crear'} la evaluación`,
        type: 'error',
        details: error.response?.data?.error || error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedPrograms = programas.filter(p => 
    formData.program_faculty_ids.includes(p.id)
  )

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 rounded-lg p-2">
              <svg className="w-6 h-6 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isDuplicating ? 'Duplicar Evaluación' : isEditing ? 'Editar Evaluación' : 'Crear Nueva Evaluación'}
            </h1>
          </div>
          {/* Botones de acción */}
          <div className="flex items-center space-x-3">
            {isEditing && !isDuplicating && (
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Duplicar Evaluación</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="evaluation-form"
              disabled={loading}
              className="px-6 py-2.5 bg-red-800 text-white rounded-lg font-medium hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    {isDuplicating 
                      ? 'Crear Evaluación Duplicada' 
                      : isEditing 
                      ? 'Actualizar Evaluación' 
                      : 'Crear Evaluación'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-gray-600 ml-14">
          {isDuplicating 
            ? 'Modifica los datos de la evaluación duplicada y guárdala como una nueva evaluación'
            : 'Completa el formulario para configurar una nueva evaluación de práctica'}
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-red-800 to-red-900 text-white px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Información de la Evaluación</h2>
              <p className="text-red-100 text-sm mt-1">Datos principales y configuración</p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">

          <form id="evaluation-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Sección: Información Básica */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-px bg-gray-200 flex-1"></div>
                <h3 className="text-lg font-semibold text-gray-800 px-4">Información Básica</h3>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Nombre de la Evaluación <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Evaluación Final - Finanzas y Comercio Internacional"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Período Académico <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white"
                    required
                  >
                    <option value="">Selecciona un período</option>
                    {periodos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.period}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Tipo de Encuesta <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type_survey"
                    value={formData.type_survey}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white"
                    required
                  >
                    <option value="">Selecciona un tipo de encuesta</option>
                    {tiposEncuesta.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.value || t.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sección: Configuración Académica */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-px bg-gray-200 flex-1"></div>
                <h3 className="text-lg font-semibold text-gray-800 px-4">Configuración Académica</h3>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Tipo de Práctica
                  </label>
                  <select
                    name="practice_type"
                    value={formData.practice_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Selecciona un tipo</option>
                    {tiposPractica.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name || t.value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* COMENTADO: Campo de facultad eliminado - ya no se usa */}

                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Programas Asociados
                    {selectedPrograms.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({selectedPrograms.length} {selectedPrograms.length === 1 ? 'programa seleccionado' : 'programas seleccionados'})
                      </span>
                    )}
                  </label>
                  {selectedPrograms.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[80px] mb-3">
                      {selectedPrograms.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center px-4 py-2 bg-red-50 text-red-800 rounded-lg text-sm font-medium border border-red-200 hover:bg-red-100 transition-colors"
                        >
                          {p.code && (
                            <span className="mr-2 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-semibold">
                              {p.code}
                            </span>
                          )}
                          <span>{p.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProgram(p.id)}
                            className="ml-2 text-red-800 hover:text-red-900 hover:bg-red-200 rounded-full p-0.5 transition-colors"
                            title="Eliminar programa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <select
                    name="program_select"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleProgramToggle(parseInt(e.target.value))
                        e.target.value = ''
                      }
                    }}
                    disabled={programas.length === 0}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white ${
                      programas.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {programas.length === 0 
                        ? 'No hay programas disponibles'
                        : selectedPrograms.length === 0
                        ? 'Selecciona un programa'
                        : 'Agregar otro programa'}
                    </option>
                    {programas
                      .filter(p => !formData.program_faculty_ids.includes(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `[${p.code}] ` : ''}{p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sección: Fechas y Temporización */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-px bg-gray-200 flex-1"></div>
                <h3 className="text-lg font-semibold text-gray-800 px-4">Fechas y Temporización</h3>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Fecha de Inicio <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Fecha de Finalización <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="finish_date"
                      value={formData.finish_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Configuración de Alerta */}
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
                <label className="block text-gray-700 text-sm font-semibold mb-3">
                  Configuración de Envío Automático
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Enviar encuesta</span>
                  <input
                    type="number"
                    name="alert_value"
                    value={formData.alert_value}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <select
                    name="alert_unit"
                    value={formData.alert_unit}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                  >
                    <option value="DAYS">Días</option>
                    <option value="WEEKS">Semanas</option>
                    <option value="MONTHS">Meses</option>
                  </select>
                  <select
                    name="alert_when"
                    value={formData.alert_when}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                  >
                    <option value="AFTER_START_PRACTICE">
                      Después de iniciar la práctica
                    </option>
                    <option value="BEFORE_END_PRACTICE">
                      Antes de finalizar la práctica
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </form>
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

      {/* Modal de Proceso */}
      {processing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isDuplicating 
                  ? 'Duplicando Evaluación' 
                  : isEditing 
                  ? 'Actualizando Evaluación' 
                  : 'Creando Evaluación'}
              </h3>
              <p className="text-gray-600 mb-4">{processingMessage}</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ Guardando información en MySQL y MongoDB</p>
                <p>✓ Calculando totales de actores</p>
                <p>✓ Generando links de acceso únicos</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CrearEvaluacion
