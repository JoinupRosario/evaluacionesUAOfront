import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Alert from '../components/Alert'

function Dashboard() {
  // const [activeTab, setActiveTab] = useState('practices') // 'practices' o 'monitoring' - COMENTADO: No se usa monitorias
  const [evaluations, setEvaluations] = useState([])
  // const [monitoringEvaluations, setMonitoringEvaluations] = useState([]) // COMENTADO: No se usa monitorias
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedRows, setSelectedRows] = useState([])
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null)
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'success', details: null })
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [mongoDetails, setMongoDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  // const [isMonitoringEvaluation, setIsMonitoringEvaluation] = useState(false) // COMENTADO: No se usa monitorias
  const [responseModalOpen, setResponseModalOpen] = useState(false)
  const [responseData, setResponseData] = useState(null)
  const [loadingResponse, setLoadingResponse] = useState(false)
  const [currentEvaluationId, setCurrentEvaluationId] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingStatusMessage, setUpdatingStatusMessage] = useState('')
  const [updatingEvaluationId, setUpdatingEvaluationId] = useState(null)
  const dropdownRef = useRef(null)
  const [periodFilter, setPeriodFilter] = useState('')
  const [surveyTypeFilter, setSurveyTypeFilter] = useState('')
  const [periodos, setPeriodos] = useState([])
  const [tiposEncuesta, setTiposEncuesta] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [pendingShouldSendChanges, setPendingShouldSendChanges] = useState({})
  const [savingChanges, setSavingChanges] = useState(false)

  useEffect(() => {
    fetchFilterOptions()
  }, []) // COMENTADO: activeTab eliminado, no se usa monitorias

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchEvaluations()
    // COMENTADO: No se usa monitorias, solo se cargan prácticas
  }, [currentPage, itemsPerPage, periodFilter, surveyTypeFilter, searchTerm])

  const fetchFilterOptions = async () => {
    try {
      // Cargar períodos
      const periodosResponse = await api.get('/academics/periodos')
      setPeriodos(periodosResponse.data)

      // Cargar tipos de encuesta - COMENTADO: Solo prácticas, no se usa monitorias
      const tiposResponse = await api.get('/academics/tipos-encuesta')
      setTiposEncuesta(tiposResponse.data)
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error)
    }
  }

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: itemsPerPage
      }
      
      // Agregar filtros si están activos
      if (periodFilter) {
        params.period = periodFilter
      }
      if (surveyTypeFilter) {
        params.type_survey = surveyTypeFilter
      }
      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await api.get('/evaluations', { params })
      
      if (response.data.data) {
        setEvaluations(response.data.data)
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages)
          setTotal(response.data.pagination.total)
        }
      } else {
        setEvaluations(response.data)
      }
    } catch (error) {
      console.error('Error al obtener evaluaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  // COMENTADO: Función eliminada - No se usa monitorias
  // const fetchMonitoringEvaluations = async () => { ... }

  // Usar las evaluaciones directamente (ya vienen filtradas del servidor)
  const paginatedEvaluations = evaluations // COMENTADO: Solo prácticas, no se usa monitorias

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedEvaluations.map(e => e.id))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id))
    } else {
      setSelectedRows([...selectedRows, id])
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'SENT': 'bg-red-100 text-red-800',
      'CREATED': 'bg-yellow-100 text-yellow-800',
      'FINALIZED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800'
  }

  const handleStatusChange = async (evaluationId, newStatus) => {
    setUpdatingStatus(true)
    setUpdatingEvaluationId(evaluationId)
    setUpdatingStatusMessage('Actualizando estado de la evaluación...')
    setOpenStatusDropdown(null)
    
    try {
      await api.put(`/evaluations/${evaluationId}`, { status: newStatus })
      
      // Si el estado cambia a SENT, mostrar mensaje adicional
      if (newStatus === 'SENT') {
        setUpdatingStatusMessage('Enviando correos...')
        // Dar un momento para que el backend procese el envío de correos
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      // Actualizar el estado local
      setEvaluations(evaluations.map(evaluation => 
        evaluation.id === evaluationId ? { ...evaluation, status: newStatus } : evaluation
      ))
      // COMENTADO: No se actualiza monitoringEvaluations porque no se usa monitorias
      
      setUpdatingStatus(false)
      setUpdatingStatusMessage('')
      setUpdatingEvaluationId(null)
      
      setAlert({
        isOpen: true,
        title: 'Éxito',
        message: newStatus === 'SENT' 
          ? 'Estado actualizado correctamente. Los correos se están enviando.' 
          : 'Estado de la evaluación actualizado correctamente',
        type: 'success'
      })
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      setUpdatingStatus(false)
      setUpdatingStatusMessage('')
      setUpdatingEvaluationId(null)
      
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo actualizar el estado de la evaluación',
        type: 'error',
        details: error.response?.data?.error || error.message
      })
    }
  }

  const statusOptions = ['CREATED', 'SENT', 'FINALIZED']

  const handleViewDetails = async (evaluationId) => {
    setLoadingDetails(true)
    setViewModalOpen(true)
    try {
      const response = await api.get(`/evaluations/${evaluationId}/mongo`)
      const data = response.data
      
      // COMENTADO: No se detecta tipo de evaluación porque no se usa monitorias
      // Solo se manejan prácticas
      
      setMongoDetails(data)
    } catch (error) {
      console.error('Error al obtener detalles:', error)
      
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'No se pudieron cargar los detalles de la evaluación',
        type: 'error',
        details: error.response?.data?.error || error.message
      })
      setViewModalOpen(false)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleViewResponse = async (evaluationId, legalizationId, actorType) => {
    setLoadingResponse(true)
    setResponseModalOpen(true)
    setCurrentEvaluationId(evaluationId)
    try {
      const response = await api.get(`/evaluations/${evaluationId}/response`, {
        params: {
          legalization_id: legalizationId,
          actor_type: actorType
        }
      })
      setResponseData(response.data)
    } catch (error) {
      console.error('Error al obtener respuestas:', error)
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'No se pudieron obtener las respuestas',
        type: 'error',
        details: error.response?.data?.error || error.message
      })
      setResponseModalOpen(false)
    } finally {
      setLoadingResponse(false)
    }
  }

  // Función para manejar cambios en checkboxes de should_send
  const handleShouldSendChange = (legalizationId, actorType, newValue) => {
    setPendingShouldSendChanges(prev => ({
      ...prev,
      [`${actorType}_${legalizationId}`]: { legalization_id: legalizationId, actor_type: actorType, should_send: newValue }
    }))
  }

  // Función para obtener el valor actual de should_send (considerando cambios pendientes)
  const getShouldSendValue = (legalizationId, actorType, originalValue) => {
    const key = `${actorType}_${legalizationId}`
    if (pendingShouldSendChanges[key] !== undefined) {
      return pendingShouldSendChanges[key].should_send
    }
    return originalValue !== undefined ? originalValue : true
  }

  // Función para seleccionar/deseleccionar todos de un tipo
  const handleSelectAllType = (actorType, emails, selectAll) => {
    const changes = {}
    emails.forEach(item => {
      const key = `${actorType}_${item.legalization_id}`
      changes[key] = { legalization_id: item.legalization_id, actor_type: actorType, should_send: selectAll }
    })
    setPendingShouldSendChanges(prev => ({ ...prev, ...changes }))
  }

  // Función para verificar si todos están seleccionados
  const areAllSelected = (actorType, emails) => {
    if (!emails || emails.length === 0) return false
    return emails.every(item => getShouldSendValue(item.legalization_id, actorType, item.should_send))
  }

  // Función para guardar los cambios de should_send
  const saveShouldSendChanges = async () => {
    if (Object.keys(pendingShouldSendChanges).length === 0) {
      setAlert({
        isOpen: true,
        title: 'Info',
        message: 'No hay cambios pendientes para guardar',
        type: 'info'
      })
      return
    }

    setSavingChanges(true)
    try {
      const tokens = Object.values(pendingShouldSendChanges)
      await api.put(`/evaluations/${mongoDetails.evaluation_id_mysql}/tokens/should-send`, { tokens })
      
      // Actualizar mongoDetails con los nuevos valores
      setMongoDetails(prev => {
        const updated = { ...prev }
        
        // Actualizar student_emails
        if (updated.student_emails) {
          updated.student_emails = updated.student_emails.map(item => {
            const change = pendingShouldSendChanges[`student_${item.legalization_id}`]
            return change ? { ...item, should_send: change.should_send } : item
          })
        }
        
        // Actualizar boss_emails
        if (updated.boss_emails) {
          updated.boss_emails = updated.boss_emails.map(item => {
            const change = pendingShouldSendChanges[`boss_${item.legalization_id}`]
            return change ? { ...item, should_send: change.should_send } : item
          })
        }
        
        // Actualizar monitor_emails
        if (updated.monitor_emails) {
          updated.monitor_emails = updated.monitor_emails.map(item => {
            const change = pendingShouldSendChanges[`monitor_${item.legalization_id}`]
            return change ? { ...item, should_send: change.should_send } : item
          })
        }
        
        return updated
      })
      
      setPendingShouldSendChanges({})
      setAlert({
        isOpen: true,
        title: 'Éxito',
        message: 'Configuración de envío guardada correctamente',
        type: 'success'
      })
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'No se pudieron guardar los cambios',
        type: 'error',
        details: error.response?.data?.error || error.message
      })
    } finally {
      setSavingChanges(false)
    }
  }

  // Contar cuántos están seleccionados para envío
  const countSelectedForSend = (actorType, emails) => {
    if (!emails || emails.length === 0) return 0
    return emails.filter(item => getShouldSendValue(item.legalization_id, actorType, item.should_send)).length
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Gestiona tus evaluaciones</p>
        </div>
        <Link
          to="/crear-evaluacion"
          className="bg-red-800 hover:bg-red-900 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Evaluación</span>
        </Link>
      </div>

      {/* COMENTADO: Pestañas eliminadas - No se usa monitorias, solo prácticas */}
      {/* <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          ...
        </nav>
      </div> */}

      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Búsqueda
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Filtro por Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={periodFilter}
              onChange={(e) => {
                setPeriodFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Todos los períodos</option>
              {periodos.map((periodo) => (
                <option key={periodo.id} value={periodo.id}>
                  {periodo.period}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo de Encuesta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Encuesta
            </label>
            <select
              value={surveyTypeFilter}
              onChange={(e) => {
                setSurveyTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Todos los tipos</option>
              {tiposEncuesta.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón para limpiar filtros */}
        {(periodFilter || surveyTypeFilter || searchInput) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setPeriodFilter('')
                setSurveyTypeFilter('')
                setSearchInput('')
                setSearchTerm('')
                setCurrentPage(1)
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando evaluaciones...</p>
          </div>
        ) : paginatedEvaluations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontraron evaluaciones</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === paginatedEvaluations.length && paginatedEvaluations.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-red-800 focus:ring-red-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      NOMBRE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      PERÍODO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      TIPO DE ENCUESTA
                    </th>
                    {/* COMENTADO: Columnas condicionales eliminadas - Solo se muestran columnas de prácticas */}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      CANT. JEFES
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      CANT. ESTUDIANTES
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      % JEFES
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      % ESTUDIANTES
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      INICIO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      FINALIZACIÓN
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      ESTADO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEvaluations.map((evaluation, index) => (
                    <tr
                      key={evaluation.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(evaluation.id)}
                          onChange={() => handleSelectRow(evaluation.id)}
                          className="rounded border-gray-300 text-red-800 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {evaluation.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {evaluation.period_name || evaluation.period || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {evaluation.type_survey_name || '-'}
                      </td>
                      {/* COMENTADO: Celdas condicionales eliminadas - Solo se muestran datos de prácticas */}
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">
                        {evaluation.total_bosses || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">
                        {evaluation.total_students || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">
                        {evaluation.percentage_bosses || 0}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">
                        {evaluation.percentage_students || 0}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(evaluation.start_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(evaluation.finish_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() => setOpenStatusDropdown(
                              openStatusDropdown === evaluation.id ? null : evaluation.id
                            )}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(evaluation.status || 'CREATED')} hover:opacity-80 transition-opacity`}
                          >
                            <span>{evaluation.status || 'CREATED'}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {openStatusDropdown === evaluation.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenStatusDropdown(null)}
                              />
                              <div className="absolute z-20 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200">
                                {statusOptions.map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusChange(evaluation.id, status)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-md last:rounded-b-md ${
                                      (evaluation.status || 'CREATED') === status ? 'bg-gray-100 font-medium' : ''
                                    }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(evaluation.id)}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                            title="Ver detalles de MongoDB"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {/* COMENTADO: Botón "Bajar Reporte" eliminado */}
                          <Link
                            to={`/editar-evaluacion/${evaluation.id}?type=practice`}
                            className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                            title="Editar evaluación"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Mostrar</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">por página</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded ${
                        currentPage === pageNum
                          ? 'bg-red-600 text-white'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-2 text-gray-700">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
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

      {/* COMENTADO: Modal de monitorías eliminado - No se usa monitorias */}

      {/* Modal de detalles de MongoDB - PRÁCTICAS */}
      {viewModalOpen && mongoDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => {
                setViewModalOpen(false)
                setMongoDetails(null)
                // COMENTADO: setIsMonitoringEvaluation eliminado - No se usa monitorias
              }}
            />

            {/* Modal PRÁCTICAS */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full max-w-[95vw]">
              <div className="bg-white px-3 sm:px-4 pt-4 pb-3 sm:pt-5 sm:pb-4 sm:p-6">
                {/* Banner para evaluaciones del sistema anterior */}
                {mongoDetails.is_legacy && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-amber-800">Evaluación del Sistema Anterior</p>
                        <p className="text-xs text-amber-700">Los datos de actores se obtuvieron dinámicamente. Esta evaluación no tiene links de acceso generados.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    Detalles de Evaluación - Práctica {mongoDetails.is_legacy ? '(Sistema Anterior)' : '(MongoDB)'}
                  </h3>
                  <button
                    onClick={() => {
                      setViewModalOpen(false)
                      setMongoDetails(null)
                      // COMENTADO: setIsMonitoringEvaluation eliminado - No se usa monitorias
                    }}
                    className="text-gray-400 hover:text-gray-500 flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loadingDetails ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="mt-4 text-gray-600">Cargando detalles...</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Información General */}
                    <div className="border-b pb-3 sm:pb-4">
                      <h4 className="text-sm sm:text-md font-semibold text-gray-900 mb-2 sm:mb-3">Información General</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="font-medium text-gray-700">ID MongoDB:</span>
                          <p className="text-gray-900">{mongoDetails._id}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">ID MySQL:</span>
                          <p className="text-gray-900">{mongoDetails.evaluation_id_mysql}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Nombre:</span>
                          <p className="text-gray-900">{mongoDetails.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Período:</span>
                          <p className="text-gray-900">{mongoDetails.period}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Estado:</span>
                          <p className="text-gray-900">{mongoDetails.status}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Creado por:</span>
                          <p className="text-gray-900">{mongoDetails.user_creator}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Fecha de creación:</span>
                          <p className="text-gray-900">{formatDate(mongoDetails.createdAt)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Última actualización:</span>
                          <p className="text-gray-900">{formatDate(mongoDetails.updatedAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Totales - SOLO PRÁCTICAS */}
                    <div className="border-b pb-3 sm:pb-4">
                      <h4 className="text-sm sm:text-md font-semibold text-gray-900 mb-2 sm:mb-3">Totales</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Estudiantes:</span>
                          <p className="text-gray-900">{mongoDetails.total_students || 0}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Jefes:</span>
                          <p className="text-gray-900">{mongoDetails.total_bosses || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Correos de Estudiantes */}
                    <div className="border-b pb-3 sm:pb-4">
                      <div className="flex justify-between items-center mb-2 sm:mb-3">
                        <h4 className="text-sm sm:text-md font-semibold text-gray-900">
                          Correos de Estudiantes ({mongoDetails.student_emails?.length || 0})
                          {!mongoDetails.is_legacy && (
                            <span className="ml-2 text-xs font-normal text-blue-600">
                              ({countSelectedForSend('student', mongoDetails.student_emails)} seleccionados para envío)
                            </span>
                          )}
                        </h4>
                        {!mongoDetails.is_legacy && mongoDetails.student_emails && mongoDetails.student_emails.length > 0 && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSelectAllType('student', mongoDetails.student_emails, true)}
                              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Todos
                            </button>
                            <button
                              onClick={() => handleSelectAllType('student', mongoDetails.student_emails, false)}
                              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Ninguno
                            </button>
                          </div>
                        )}
                      </div>
                      {mongoDetails.student_emails && mongoDetails.student_emails.length > 0 ? (
                        <div className="max-h-48 overflow-x-auto overflow-y-auto">
                          <table className="min-w-full text-xs sm:text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                {!mongoDetails.is_legacy && (
                                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={areAllSelected('student', mongoDetails.student_emails)}
                                      onChange={(e) => handleSelectAllType('student', mongoDetails.student_emails, e.target.checked)}
                                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                      title="Seleccionar/deseleccionar todos"
                                    />
                                  </th>
                                )}
                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700">ID</th>
                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700">Correo</th>
                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700">Link</th>
                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {mongoDetails.student_emails.map((item, idx) => (
                                <tr key={idx} className={!getShouldSendValue(item.legalization_id, 'student', item.should_send) ? 'bg-gray-50 opacity-60' : ''}>
                                  {!mongoDetails.is_legacy && (
                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={getShouldSendValue(item.legalization_id, 'student', item.should_send)}
                                        onChange={(e) => handleShouldSendChange(item.legalization_id, 'student', e.target.checked)}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        title={getShouldSendValue(item.legalization_id, 'student', item.should_send) ? 'Marcado para envío' : 'No se enviará correo'}
                                      />
                                    </td>
                                  )}
                                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 whitespace-nowrap">{item.legalization_id}</td>
                                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 break-all">{item.email}</td>
                                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                                    {item.link ? (
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(item.link)
                                          alert('Link copiado al portapapeles')
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-xs underline break-all"
                                        title="Copiar link"
                                      >
                                        Copiar
                                      </button>
                                    ) : (
                                      <span className="text-gray-400 text-xs">No generado</span>
                                    )}
                                  </td>
                                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                                    <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                                      {item.usado ? (
                                        <>
                                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-green-100 text-green-800 rounded">Usado</span>
                                          <button
                                            onClick={() => handleViewResponse(mongoDetails.evaluation_id_mysql, item.legalization_id, 'student')}
                                            className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                            title="Ver respuestas"
                                          >
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                          </button>
                                        </>
                                      ) : (
                                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gray-100 text-gray-800 rounded">Pendiente</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No hay correos de estudiantes registrados</p>
                      )}
                    </div>

                    {/* Correos de Jefes */}
                    {/* COMENTADO: Condición eliminada - Solo se manejan prácticas, no se usa monitorias */}
                    <div className="border-b pb-3 sm:pb-4">
                        <div className="flex justify-between items-center mb-2 sm:mb-3">
                          <h4 className="text-sm sm:text-md font-semibold text-gray-900">
                            Correos de Jefes ({mongoDetails.boss_emails?.length || 0})
                            {!mongoDetails.is_legacy && (
                              <span className="ml-2 text-xs font-normal text-blue-600">
                                ({countSelectedForSend('boss', mongoDetails.boss_emails)} seleccionados para envío)
                              </span>
                            )}
                          </h4>
                          {!mongoDetails.is_legacy && mongoDetails.boss_emails && mongoDetails.boss_emails.length > 0 && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSelectAllType('boss', mongoDetails.boss_emails, true)}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              >
                                Todos
                              </button>
                              <button
                                onClick={() => handleSelectAllType('boss', mongoDetails.boss_emails, false)}
                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                Ninguno
                              </button>
                            </div>
                          )}
                        </div>
                        {mongoDetails.boss_emails && mongoDetails.boss_emails.length > 0 ? (
                          <div className="max-h-48 overflow-x-auto overflow-y-auto">
                            <table className="min-w-full text-xs sm:text-sm">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  {!mongoDetails.is_legacy && (
                                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-700">
                                      <input
                                        type="checkbox"
                                        checked={areAllSelected('boss', mongoDetails.boss_emails)}
                                        onChange={(e) => handleSelectAllType('boss', mongoDetails.boss_emails, e.target.checked)}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        title="Seleccionar/deseleccionar todos"
                                      />
                                    </th>
                                  )}
                                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700">ID</th>
                                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700">Correo</th>
                                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700">Link</th>
                                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700">Estado</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {mongoDetails.boss_emails.map((item, idx) => (
                                  <tr key={idx} className={!getShouldSendValue(item.legalization_id, 'boss', item.should_send) ? 'bg-gray-50 opacity-60' : ''}>
                                    {!mongoDetails.is_legacy && (
                                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-center">
                                        <input
                                          type="checkbox"
                                          checked={getShouldSendValue(item.legalization_id, 'boss', item.should_send)}
                                          onChange={(e) => handleShouldSendChange(item.legalization_id, 'boss', e.target.checked)}
                                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                          title={getShouldSendValue(item.legalization_id, 'boss', item.should_send) ? 'Marcado para envío' : 'No se enviará correo'}
                                        />
                                      </td>
                                    )}
                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 whitespace-nowrap">{item.legalization_id}</td>
                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 break-all">{item.email}</td>
                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                                      {item.link ? (
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(item.link)
                                            alert('Link copiado al portapapeles')
                                          }}
                                          className="text-blue-600 hover:text-blue-800 text-xs underline break-all"
                                          title="Copiar link"
                                        >
                                          Copiar
                                        </button>
                                      ) : (
                                        <span className="text-gray-400 text-xs">No generado</span>
                                      )}
                                    </td>
                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                                      <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                                        {item.usado ? (
                                          <>
                                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-green-100 text-green-800 rounded">Usado</span>
                                            <button
                                              onClick={() => handleViewResponse(mongoDetails.evaluation_id_mysql, item.legalization_id, 'boss')}
                                              className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                              title="Ver respuestas"
                                            >
                                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                              </svg>
                                            </button>
                                          </>
                                        ) : (
                                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gray-100 text-gray-800 rounded">Pendiente</span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-xs sm:text-sm">No hay correos de jefes registrados</p>
                        )}
                      </div>

                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                {!mongoDetails.is_legacy && Object.keys(pendingShouldSendChanges).length > 0 && (
                  <button
                    type="button"
                    onClick={saveShouldSendChanges}
                    disabled={savingChanges}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-sm sm:text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto disabled:opacity-50"
                  >
                    {savingChanges ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Guardar Cambios ({Object.keys(pendingShouldSendChanges).length})
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setViewModalOpen(false)
                    setPendingShouldSendChanges({})
                    setMongoDetails(null)
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-sm sm:text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Respuestas */}
      {responseModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Respuestas de Evaluación
              </h3>
              <button
                onClick={() => {
                  setResponseModalOpen(false)
                  setResponseData(null)
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingResponse ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-4 text-gray-600">Cargando respuestas...</p>
              </div>
            ) : responseData ? (
              <div className="space-y-6">
                {/* Información General */}
                <div className="border-b pb-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Información</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Evaluación:</span>
                      <p className="text-gray-900">{responseData.evaluation.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Legalización ID:</span>
                      <p className="text-gray-900">{responseData.legalization_id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tipo de Actor:</span>
                      <p className="text-gray-900">
                        {responseData.actor_type === 'student' ? 'Estudiante' : 
                         responseData.actor_type === 'boss' ? 'Jefe de Práctica' : 
                         responseData.actor_type === 'monitor' ? 'Monitor/Tutor' :
                         // COMENTADO: teacher y coordinator eliminados - No se usa monitorias
                         responseData.actor_type}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Fecha de Respuesta:</span>
                      <p className="text-gray-900">
                        {responseData.date_answer ? new Date(responseData.date_answer).toLocaleString('es-ES') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Respuestas */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Respuestas ({responseData.answers?.length || 0})
                  </h4>
                  {responseData.answers && responseData.answers.length > 0 ? (
                    <div className="space-y-4">
                      {responseData.answers.map((answer, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <p className="font-semibold text-gray-800 mb-2">
                            {index + 1}. {answer.pregunta_texto}
                          </p>
                          <div className="ml-4">
                            {answer.pregunta_tipo === 'scale' ? (
                              <p className="text-gray-700">
                                <span className="font-medium">Valor:</span> {answer.respuesta}
                              </p>
                            ) : answer.pregunta_tipo === 'multiple_choice' || answer.pregunta_tipo === 'checkbox' ? (
                              <p className="text-gray-700">
                                <span className="font-medium">Opción seleccionada:</span> {answer.respuesta}
                              </p>
                            ) : (
                              <p className="text-gray-700 whitespace-pre-wrap">{answer.respuesta}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay respuestas disponibles</p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setResponseModalOpen(false)
                  setResponseData(null)
                }}
                className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de progreso al actualizar estado */}
      {updatingStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Actualizando estado</h3>
              <p className="text-sm text-gray-600 text-center">{updatingStatusMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
