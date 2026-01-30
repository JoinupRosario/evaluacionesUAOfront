import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Alert from '../components/Alert'

const QUESTION_TYPES = [
  { value: 'text', label: 'Texto corto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'multiple_choice', label: 'Opción múltiple' },
  { value: 'checkbox', label: 'Casillas de verificación' },
  { value: 'scale', label: 'Escala' },
  { value: 'date', label: 'Fecha' },
  { value: 'number', label: 'Número' }
]

function CrearFormulario() {
  const navigate = useNavigate()
  const { id } = useParams() // Para edición
  const isEditing = !!id
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  // Preguntas separadas para cada formulario
  const [studentQuestions, setStudentQuestions] = useState([])
  const [tutorQuestions, setTutorQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(isEditing) // Para cargar datos al editar
  const [activeTab, setActiveTab] = useState('student') // 'student', 'tutor'
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'success', details: null })

  // Cargar datos si está editando
  useEffect(() => {
    if (isEditing) {
      fetchSurveyData()
    }
  }, [id])

  const fetchSurveyData = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/surveys/${id}`)
      const survey = response.data

      setFormData({
        name: survey.name,
        description: survey.description || ''
      })

      setStudentQuestions(survey.student_form?.questions || [])
      setTutorQuestions(survey.tutor_form?.questions || [])
    } catch (error) {
      console.error('Error al cargar formulario:', error)
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo cargar el formulario',
        type: 'error'
      })
      navigate('/formularios')
    } finally {
      setLoadingData(false)
    }
  }

  // Función genérica para agregar pregunta
  const addQuestion = (formType) => {
    const newQuestion = {
      type: 'text',
      question: '',
      required: false,
      options: [],
      scale_min: 1,
      scale_max: 5,
      scale_labels: { min_label: '', max_label: '' },
      order: 0
    }

    if (formType === 'student') {
      newQuestion.order = studentQuestions.length + 1
      setStudentQuestions([...studentQuestions, newQuestion])
    } else if (formType === 'tutor') {
      newQuestion.order = tutorQuestions.length + 1
      setTutorQuestions([...tutorQuestions, newQuestion])
    }
  }

  // Función genérica para actualizar pregunta
  const updateQuestion = (formType, index, field, value) => {
    if (formType === 'student') {
      const updated = [...studentQuestions]
      updated[index] = { ...updated[index], [field]: value }
      setStudentQuestions(updated)
    } else if (formType === 'tutor') {
      const updated = [...tutorQuestions]
      updated[index] = { ...updated[index], [field]: value }
      setTutorQuestions(updated)
    }
  }

  const updateQuestionOption = (formType, questionIndex, optionIndex, value) => {
    if (formType === 'student') {
      const updated = [...studentQuestions]
      if (!updated[questionIndex].options) {
        updated[questionIndex].options = []
      }
      updated[questionIndex].options[optionIndex] = { label: value, value: value }
      setStudentQuestions(updated)
    } else if (formType === 'tutor') {
      const updated = [...tutorQuestions]
      if (!updated[questionIndex].options) {
        updated[questionIndex].options = []
      }
      updated[questionIndex].options[optionIndex] = { label: value, value: value }
      setTutorQuestions(updated)
    }
  }

  const addOption = (formType, questionIndex) => {
    if (formType === 'student') {
      const updated = [...studentQuestions]
      if (!updated[questionIndex].options) {
        updated[questionIndex].options = []
      }
      updated[questionIndex].options.push({ label: '', value: '' })
      setStudentQuestions(updated)
    } else if (formType === 'tutor') {
      const updated = [...tutorQuestions]
      if (!updated[questionIndex].options) {
        updated[questionIndex].options = []
      }
      updated[questionIndex].options.push({ label: '', value: '' })
      setTutorQuestions(updated)
    }
  }

  const removeOption = (formType, questionIndex, optionIndex) => {
    if (formType === 'student') {
      const updated = [...studentQuestions]
      updated[questionIndex].options.splice(optionIndex, 1)
      setStudentQuestions(updated)
    } else if (formType === 'tutor') {
      const updated = [...tutorQuestions]
      updated[questionIndex].options.splice(optionIndex, 1)
      setTutorQuestions(updated)
    }
  }

  const removeQuestion = (formType, index) => {
    if (formType === 'student') {
      const updated = studentQuestions.filter((_, i) => i !== index)
      updated.forEach((q, i) => { q.order = i + 1 })
      setStudentQuestions(updated)
    } else if (formType === 'tutor') {
      const updated = tutorQuestions.filter((_, i) => i !== index)
      updated.forEach((q, i) => { q.order = i + 1 })
      setTutorQuestions(updated)
    }
  }

  const moveQuestion = (formType, index, direction) => {
    let questions, setQuestions
    if (formType === 'student') {
      questions = studentQuestions
      setQuestions = setStudentQuestions
    } else if (formType === 'tutor') {
      questions = tutorQuestions
      setQuestions = setTutorQuestions
    } else {
      return // No hay más tipos
    }

    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return
    }

    const updated = [...questions]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    updated[index].order = index + 1
    updated[newIndex].order = newIndex + 1
    setQuestions(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setAlert({
        isOpen: true,
        title: 'Campo requerido',
        message: 'El nombre del formulario es requerido',
        type: 'warning'
      })
      return
    }

    // Validar que al menos un formulario tenga preguntas
    if (studentQuestions.length === 0 && tutorQuestions.length === 0) {
      setAlert({
        isOpen: true,
        title: 'Preguntas requeridas',
        message: 'Debe agregar al menos una pregunta en alguno de los formularios',
        type: 'warning'
      })
      return
    }

    // Validar que todas las preguntas tengan texto
    const allQuestions = [...studentQuestions, ...tutorQuestions]
    const invalidQuestions = allQuestions.filter(q => !q.question.trim())
    if (invalidQuestions.length > 0) {
      setAlert({
        isOpen: true,
        title: 'Preguntas incompletas',
        message: 'Todas las preguntas deben tener un texto',
        type: 'warning'
      })
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        survey_type: 'PRACTICE', // Solo prácticas
        student_questions: studentQuestions.map(q => {
          const question = {
            type: q.type,
            question: q.question,
            required: q.required,
            order: q.order
          }
          if (q.type === 'multiple_choice' || q.type === 'checkbox') {
            question.options = q.options.filter(opt => opt.label.trim())
          }
          if (q.type === 'scale') {
            question.scale_min = q.scale_min
            question.scale_max = q.scale_max
            question.scale_labels = q.scale_labels
          }
          return question
        }),
        tutor_questions: tutorQuestions.map(q => {
          const question = {
            type: q.type,
            question: q.question,
            required: q.required,
            order: q.order
          }
          if (q.type === 'multiple_choice' || q.type === 'checkbox') {
            question.options = q.options.filter(opt => opt.label.trim())
          }
          if (q.type === 'scale') {
            question.scale_min = q.scale_min
            question.scale_max = q.scale_max
            question.scale_labels = q.scale_labels
          }
          return question
        })
      }

      if (isEditing) {
        // Actualizar formulario existente
        await api.put(`/surveys/${id}`, payload)
        
        const details = [
          `Estudiante (${studentQuestions.length} preguntas)`,
          `Tutor (${tutorQuestions.length} preguntas)`
        ]

        setAlert({
          isOpen: true,
          title: 'Formulario actualizado exitosamente',
          message: 'Se han actualizado los 2 formularios independientes:',
          type: 'success',
          details: details
        })

        // Navegar después de cerrar el alert
        setTimeout(() => {
          navigate('/formularios')
        }, 2000)
      } else {
        // Crear nuevo formulario
        const response = await api.post('/surveys', payload)
        
        const details = [
          `Estudiante (${studentQuestions.length} preguntas)`,
          `Tutor (${tutorQuestions.length} preguntas)`
        ]

        setAlert({
          isOpen: true,
          title: 'Formulario creado exitosamente',
          message: 'Se han creado 2 formularios independientes:',
          type: 'success',
          details: details
        })

        // Navegar después de cerrar el alert
        setTimeout(() => {
          navigate('/formularios')
        }, 2000)
      }
    } catch (error) {
      console.error('Error al crear formulario:', error)
      setAlert({
        isOpen: true,
        title: 'Error al crear formulario',
        message: error.response?.data?.error || 'Error al crear el formulario',
        type: 'error',
        details: error.response?.data?.details || null
      })
    } finally {
      setLoading(false)
    }
  }

  // Componente para renderizar preguntas
  const renderQuestions = (formType, questions, setQuestions) => {
    const formLabels = {
      student: { name: 'Estudiante', color: 'red', icon: 'E' },
      tutor: { name: 'Tutor', color: 'green', icon: 'T' }
    }
    const label = formLabels[formType]

    return (
      <div className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 mb-2 font-medium">No hay preguntas para {label.name}</p>
            <p className="text-gray-500 text-sm mb-4">Agrega preguntas específicas para este formulario</p>
            <button
              type="button"
              onClick={() => addQuestion(formType)}
              className={`bg-${label.color}-600 hover:bg-${label.color}-700 text-white px-6 py-2 rounded-lg font-medium transition-colors`}
            >
              Agregar Primera Pregunta
            </button>
          </div>
        ) : (
          questions.map((question, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className={`bg-gradient-to-br from-${label.color}-600 to-${label.color}-700 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-md`}>
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Pregunta {index + 1} - {label.name}</h3>
                    <p className="text-xs text-gray-500">Formulario específico para {label.name}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => moveQuestion(formType, index, 'up')}
                    disabled={index === 0}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover arriba"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(formType, index, 'down')}
                    disabled={index === questions.length - 1}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover abajo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(formType, index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar pregunta"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Tipo de Pregunta
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(formType, index, 'type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Pregunta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => updateQuestion(formType, index, 'question', e.target.value)}
                    placeholder="Escribe tu pregunta aquí"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(formType, index, 'required', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-gray-700 text-sm">Pregunta obligatoria</label>
                </div>

                {/* Opciones para multiple_choice y checkbox */}
                {(question.type === 'multiple_choice' || question.type === 'checkbox') && (
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Opciones
                    </label>
                    <div className="space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option.label || ''}
                            onChange={(e) => updateQuestionOption(formType, index, optIndex, e.target.value)}
                            placeholder={`Opción ${optIndex + 1}`}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(formType, index, optIndex)}
                            className="text-red-600 hover:text-red-800 px-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(formType, index)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        + Agregar opción
                      </button>
                    </div>
                  </div>
                )}

                {/* Configuración de escala */}
                {question.type === 'scale' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Mínimo
                      </label>
                      <input
                        type="number"
                        value={question.scale_min}
                        onChange={(e) => updateQuestion(formType, index, 'scale_min', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Máximo
                      </label>
                      <input
                        type="number"
                        value={question.scale_max}
                        onChange={(e) => updateQuestion(formType, index, 'scale_max', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Etiqueta Mínimo
                      </label>
                      <input
                        type="text"
                        value={question.scale_labels?.min_label || ''}
                        onChange={(e) => {
                          const updated = { ...question }
                          updated.scale_labels = { ...updated.scale_labels, min_label: e.target.value }
                          updateQuestion(formType, index, 'scale_labels', updated.scale_labels)
                        }}
                        placeholder="Ej: Muy malo"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Etiqueta Máximo
                      </label>
                      <input
                        type="text"
                        value={question.scale_labels?.max_label || ''}
                        onChange={(e) => {
                          const updated = { ...question }
                          updated.scale_labels = { ...updated.scale_labels, max_label: e.target.value }
                          updateQuestion(formType, index, 'scale_labels', updated.scale_labels)
                        }}
                        placeholder="Ej: Excelente"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  if (loadingData) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-red-100 rounded-lg p-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Formulario de Evaluación' : 'Crear Formulario de Evaluación'}
          </h1>
        </div>
        <p className="text-gray-600 ml-14">
          {isEditing ? 'Edita los 2 formularios independientes' : 'Crea 2 formularios independientes: Estudiante y Tutor'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Información del Formulario</h2>
              <p className="text-red-100 text-sm mt-1">Datos compartidos para los 2 formularios</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Información básica */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Nombre del Formulario <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Evaluación de Prácticas 2024"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Este nombre se usará para los 2 formularios
                </p>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional del formulario"
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Tabs para los 3 formularios */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-6">
              <div className="h-px bg-gray-200 flex-1"></div>
              <h2 className="text-xl font-semibold text-gray-800 px-4">Preguntas por Formulario</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'student'
                    ? 'border-red-600 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${activeTab === 'student' ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    <span className="text-xs font-bold">E</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span>Estudiante ({studentQuestions.length})</span>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tutor')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'tutor'
                    ? 'border-green-600 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${activeTab === 'tutor' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    <span className="text-xs font-bold">T</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span>Tutor ({tutorQuestions.length})</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Contenido de las tabs */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  Agrega preguntas específicas para el formulario de <strong>{activeTab === 'student' ? 'Estudiante' : 'Tutor'}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => addQuestion(activeTab)}
                  className={`bg-${activeTab === 'student' ? 'red' : 'green'}-600 hover:bg-${activeTab === 'student' ? 'red' : 'green'}-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-md hover:shadow-lg transition-all`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Agregar Pregunta</span>
                </button>
              </div>

              {activeTab === 'student' && renderQuestions('student', studentQuestions, setStudentQuestions)}
              {activeTab === 'tutor' && renderQuestions('tutor', tutorQuestions, setTutorQuestions)}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/formularios')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (!formData.name.trim())}
                className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creando formularios...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{isEditing ? 'Actualizar Formularios' : 'Crear 2 Formularios'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Componente de Alert */}
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

export default CrearFormulario
