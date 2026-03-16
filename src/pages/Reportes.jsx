import { useState, useEffect } from 'react'
import api from '../services/api'
import Alert from '../components/Alert'

function Reportes() {
  const [periodos, setPeriodos] = useState([])
  const [selectedPeriodIds, setSelectedPeriodIds] = useState([])
  const [loadingPeriodos, setLoadingPeriodos] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'success', details: null })

  useEffect(() => {
    fetchPeriodos()
  }, [])

  const fetchPeriodos = async () => {
    try {
      // En Reportes se listan todos los períodos (no solo los que contienen P)
      const res = await api.get('/academics/periodos-todos')
      setPeriodos(res.data || [])
    } catch (error) {
      console.error('Error al cargar períodos:', error)
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'No se pudieron cargar los períodos',
        type: 'error',
        details: error.response?.data?.error || error.message
      })
    } finally {
      setLoadingPeriodos(false)
    }
  }

  const togglePeriod = (id) => {
    setSelectedPeriodIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedPeriodIds(periodos.map((p) => p.id))
  }

  const selectNone = () => {
    setSelectedPeriodIds([])
  }

  const handleBajarDetallado = async () => {
    if (selectedPeriodIds.length === 0) {
      setAlert({
        isOpen: true,
        title: 'Seleccione períodos',
        message: 'Seleccione al menos un período para generar el reporte.',
        type: 'warning'
      })
      return
    }
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const params = new URLSearchParams()
      selectedPeriodIds.forEach((id) => params.append('periodIds', id))
      const url = `${baseURL}/reports/legalizaciones-detallado?${params.toString()}`
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Error ${response.status}`)
      }
      const blob = await response.blob()
      const disposition = response.headers.get('Content-Disposition')
      const filenameMatch = disposition?.match(/filename="?(.+?)"?$/)
      const filename = filenameMatch ? filenameMatch[1] : `detallado_legalizaciones_${new Date().toISOString().split('T')[0]}.xlsx`
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      link.click()
      window.URL.revokeObjectURL(link.href)
      setAlert({
        isOpen: true,
        title: 'Descarga correcta',
        message: 'El reporte se ha descargado correctamente.',
        type: 'success'
      })
    } catch (error) {
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo generar el reporte',
        type: 'error',
        details: error.message || error.response?.data?.error
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">Descarga reportes detallados (solo Administrador General)</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Detallado de legalizaciones</h2>
        <p className="text-sm text-gray-600 mb-4">
          Seleccione uno o más períodos y descargue el Excel con el detalle de legalizaciones.
        </p>

        {loadingPeriodos ? (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-800"></div>
            Cargando períodos...
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={selectAll}
                className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                onClick={selectNone}
                className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Ninguno
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {periodos.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPeriodIds.includes(p.id)}
                      onChange={() => togglePeriod(p.id)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-800">{p.period}</span>
                  </label>
                ))}
              </div>
              {periodos.length === 0 && (
                <p className="text-sm text-gray-500">No hay períodos disponibles.</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleBajarDetallado}
              disabled={downloading || selectedPeriodIds.length === 0}
              className="inline-flex items-center px-4 py-2 bg-red-800 hover:bg-red-900 text-white text-sm font-medium rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Bajar detallado de legalizaciones
                </>
              )}
            </button>
          </>
        )}
      </div>

      <Alert
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        details={alert.details}
        onClose={() => setAlert((a) => ({ ...a, isOpen: false }))}
      />
    </div>
  )
}

export default Reportes
