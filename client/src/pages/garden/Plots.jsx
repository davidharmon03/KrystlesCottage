import { useState, useEffect, useRef } from 'react'
import api from '../../api'

const PALETTE = [
  { label: 'Empty', color: null, bg: 'bg-white', border: 'border-gray-300' },
  { label: 'Red', color: '#ef4444', bg: 'bg-red-400', border: 'border-red-500' },
  { label: 'Orange', color: '#f97316', bg: 'bg-orange-400', border: 'border-orange-500' },
  { label: 'Green', color: '#22c55e', bg: 'bg-green-400', border: 'border-green-500' },
  { label: 'Lavender', color: '#a78bfa', bg: 'bg-violet-400', border: 'border-violet-500' },
  { label: 'Yellow', color: '#eab308', bg: 'bg-yellow-400', border: 'border-yellow-500' },
  { label: 'Blue', color: '#38bdf8', bg: 'bg-sky-400', border: 'border-sky-500' },
  { label: 'Brown', color: '#92400e', bg: 'bg-amber-800', border: 'border-amber-900' },
]

const TYPE_LABELS = {
  raised_bed: 'Raised Bed',
  bucket: 'Bucket',
  row: 'Row',
}

function PlotTypeBadge({ type }) {
  const styles = {
    raised_bed: 'bg-green-100 text-green-800',
    bucket: 'bg-sky-100 text-sky-800',
    row: 'bg-amber-100 text-amber-800',
  }
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[type] || 'bg-gray-100 text-gray-700'}`}
    >
      {TYPE_LABELS[type] || type}
    </span>
  )
}

function dimensionLabel(plot) {
  if (plot.type === 'bucket') {
    return `${plot.bucket_count || 1} × ${plot.bucket_size || 'bucket'}`
  }
  if (plot.width && plot.length) {
    return `${plot.width} × ${plot.length} ft`
  }
  return null
}

// ─── Cell Popover ─────────────────────────────────────────────────────────────
function CellPopover({ x, y, initial, onSave, onClose }) {
  const [label, setLabel] = useState(initial?.label || '')
  const [color, setColor] = useState(initial?.color || null)
  const ref = useRef()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-52"
      style={{ top: '110%', left: '50%', transform: 'translateX(-50%)' }}
    >
      <p className="text-xs text-gray-500 mb-1 font-medium">
        Cell ({x}, {y})
      </p>
      <input
        autoFocus
        type="text"
        placeholder="What's planted here?"
        value={label}
        onChange={e => setLabel(e.target.value)}
        className="w-full text-sm border border-gray-300 rounded px-2 py-1 mb-2 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      <div className="flex flex-wrap gap-1 mb-2">
        {PALETTE.map(p => (
          <button
            key={p.label}
            title={p.label}
            onClick={() => setColor(p.color)}
            className={`w-6 h-6 rounded-full border-2 ${p.bg} ${color === p.color ? 'border-gray-800 scale-110' : p.border} transition-transform`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ label: label.trim(), color })}
          className="flex-1 text-xs bg-green-700 text-white rounded py-1 hover:bg-green-800 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="flex-1 text-xs bg-gray-100 text-gray-700 rounded py-1 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Blueprint: Raised Bed / Row ──────────────────────────────────────────────
function GridBlueprint({ plot, cells, onChange }) {
  const [activeCell, setActiveCell] = useState(null)

  const cols = Math.max(1, Math.ceil(plot.type === 'row' ? plot.length : plot.width) || 1)
  const rows = plot.type === 'row' ? 1 : Math.max(1, Math.ceil(plot.length) || 1)

  const cellKey = (x, y) => `${x},${y}`
  const cellMap = {}
  for (const c of cells) cellMap[cellKey(c.cell_x, c.cell_y)] = c

  function handleCellClick(x, y) {
    setActiveCell(activeCell?.x === x && activeCell?.y === y ? null : { x, y })
  }

  function handleSave({ label, color }) {
    const { x, y } = activeCell
    onChange(x, y, label, color)
    setActiveCell(null)
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, 48px)` }}>
        {Array.from({ length: rows }, (_, y) =>
          Array.from({ length: cols }, (_, x) => {
            const key = cellKey(x, y)
            const cell = cellMap[key]
            const isActive = activeCell?.x === x && activeCell?.y === y
            return (
              <div key={key} className="relative">
                <button
                  onClick={() => handleCellClick(x, y)}
                  title={`(${x + 1}, ${y + 1})${cell?.label ? ': ' + cell.label : ''}`}
                  className={`w-12 h-12 border rounded flex items-center justify-center text-[10px] font-medium leading-tight overflow-hidden transition-all
                    ${isActive ? 'border-green-700 ring-2 ring-green-400' : 'border-green-200 hover:border-green-400'}
                  `}
                  style={{
                    backgroundColor: cell?.color || '#f0fdf4',
                    color: cell?.color ? '#fff' : '#374151',
                  }}
                >
                  {cell?.label ? (
                    <span className="px-0.5 text-center leading-tight line-clamp-2">
                      {cell.label}
                    </span>
                  ) : (
                    <span className="text-green-300 text-xs">+</span>
                  )}
                </button>
                {isActive && (
                  <CellPopover
                    x={x + 1}
                    y={y + 1}
                    initial={cell}
                    onSave={handleSave}
                    onClose={() => setActiveCell(null)}
                  />
                )}
              </div>
            )
          })
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {cols} × {rows} grid · {cols * rows} sq ft
      </p>
    </div>
  )
}

// ─── Blueprint: Buckets ───────────────────────────────────────────────────────
function BucketBlueprint({ plot, cells, onChange }) {
  const [activeCell, setActiveCell] = useState(null)
  const count = plot.bucket_count || 1

  const cellMap = {}
  for (const c of cells) cellMap[c.cell_x] = c

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 flex-wrap">
        {Array.from({ length: count }, (_, i) => {
          const cell = cellMap[i]
          const isActive = activeCell === i
          return (
            <div key={i} className="relative flex flex-col items-center">
              <button
                onClick={() => setActiveCell(isActive ? null : i)}
                title={cell?.label ? `Bucket ${i + 1}: ${cell.label}` : `Bucket ${i + 1}`}
                className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-[10px] font-medium transition-all
                  ${isActive ? 'border-green-700 ring-2 ring-green-400' : 'border-green-300 hover:border-green-500'}
                `}
                style={{
                  backgroundColor: cell?.color || '#f0fdf4',
                  color: cell?.color ? '#fff' : '#374151',
                }}
              >
                {cell?.label ? (
                  <span className="text-center leading-tight px-1 line-clamp-2">{cell.label}</span>
                ) : (
                  <span className="text-green-300 text-lg">+</span>
                )}
              </button>
              <span className="text-[10px] text-gray-500 mt-1">
                {plot.bucket_size || ''} #{i + 1}
              </span>
              {isActive && (
                <CellPopover
                  x={i + 1}
                  y={0}
                  initial={cell}
                  onSave={({ label, color }) => {
                    onChange(i, 0, label, color)
                    setActiveCell(null)
                  }}
                  onClose={() => setActiveCell(null)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Add / Edit Plot Modal ────────────────────────────────────────────────────
function PlotModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || 'raised_bed',
    width: initial?.width || '',
    length: initial?.length || '',
    bucket_size: initial?.bucket_size || '5gal',
    bucket_count: initial?.bucket_count || 1,
    notes: initial?.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{initial ? 'Edit Plot' : 'Add Plot'}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Front Raised Bed"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => set('type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="raised_bed">Raised Bed</option>
              <option value="bucket">Bucket</option>
              <option value="row">Row</option>
            </select>
          </div>

          {(form.type === 'raised_bed' || form.type === 'row') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width (ft)</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={form.width}
                  onChange={e => set('width', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length (ft)</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={form.length}
                  onChange={e => set('length', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {form.type === 'bucket' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bucket Size</label>
                <select
                  value={form.bucket_size}
                  onChange={e => set('bucket_size', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="5gal">5 Gallon</option>
                  <option value="2gal">2 Gallon</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
                <input
                  type="number"
                  min="1"
                  value={form.bucket_count}
                  onChange={e => set('bucket_count', parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Plot'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Plots() {
  const [plots, setPlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [cells, setCells] = useState({}) // { plotId: [...cells] }
  const [dirtyIds, setDirtyIds] = useState(new Set())
  const [savingId, setSavingId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editPlot, setEditPlot] = useState(null)

  useEffect(() => {
    api
      .get('/garden/plots')
      .then(r => setPlots(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load plots'))
      .finally(() => setLoading(false))
  }, [])

  async function selectPlot(id) {
    if (selectedId === id) {
      setSelectedId(null)
      return
    }
    setSelectedId(id)
    if (!cells[id]) {
      const r = await api.get(`/garden/plots/${id}/cells`)
      setCells(c => ({ ...c, [id]: r.data }))
    }
  }

  function updateCell(plotId, x, y, label, color) {
    setCells(prev => {
      const existing = (prev[plotId] || []).filter(c => !(c.cell_x === x && c.cell_y === y))
      const updated =
        label || color ? [...existing, { cell_x: x, cell_y: y, label, color }] : existing
      return { ...prev, [plotId]: updated }
    })
    setDirtyIds(d => new Set([...d, plotId]))
  }

  function clearAll(plotId) {
    setCells(c => ({ ...c, [plotId]: [] }))
    setDirtyIds(d => new Set([...d, plotId]))
  }

  async function saveLayout(plotId) {
    setSavingId(plotId)
    try {
      const r = await api.put(`/garden/plots/${plotId}/cells`, { cells: cells[plotId] || [] })
      setCells(c => ({ ...c, [plotId]: r.data }))
      setDirtyIds(d => {
        const next = new Set(d)
        next.delete(plotId)
        return next
      })
    } catch (e) {
      alert(e.response?.data?.error || 'Save failed')
    } finally {
      setSavingId(null)
    }
  }

  async function handleAddPlot(form) {
    const r = await api.post('/garden/plots', form)
    setPlots(p => [r.data, ...p])
    setShowModal(false)
  }

  async function handleEditPlot(form) {
    const r = await api.patch(`/garden/plots/${editPlot.id}`, form)
    setPlots(p => p.map(x => (x.id === editPlot.id ? r.data : x)))
    setEditPlot(null)
  }

  async function handleDelete(plot) {
    if (!confirm(`Delete "${plot.name}"? This can't be undone.`)) return
    await api.delete(`/garden/plots/${plot.id}`)
    setPlots(p => p.filter(x => x.id !== plot.id))
    if (selectedId === plot.id) setSelectedId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading plots…
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Garden Plots</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Design and track your beds, rows, and containers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Plot
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Empty state */}
      {plots.length === 0 && !error && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🌱</div>
          <p className="font-medium text-gray-600">No plots yet</p>
          <p className="text-sm mt-1">Add your first raised bed, bucket, or row to get started.</p>
        </div>
      )}

      {/* Plot cards */}
      <div className="space-y-3">
        {plots.map(plot => {
          const isOpen = selectedId === plot.id
          const isDirty = dirtyIds.has(plot.id)
          const plotCells = cells[plot.id] || []

          return (
            <div
              key={plot.id}
              className={`border rounded-xl overflow-hidden transition-all ${isOpen ? 'border-green-400 shadow-md' : 'border-gray-200 hover:border-green-300'}`}
            >
              {/* Card header */}
              <div
                className={`flex items-center justify-between px-5 py-4 cursor-pointer ${isOpen ? 'bg-green-50' : 'bg-white hover:bg-gray-50'}`}
                onClick={() => selectPlot(plot.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">
                    {plot.type === 'raised_bed' ? '🌿' : plot.type === 'bucket' ? '🪣' : '🌾'}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">{plot.name}</span>
                      <PlotTypeBadge type={plot.type} />
                    </div>
                    {dimensionLabel(plot) && (
                      <p className="text-xs text-gray-500 mt-0.5">{dimensionLabel(plot)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setEditPlot(plot)
                    }}
                    className="text-gray-400 hover:text-green-700 text-sm px-2 py-1 rounded hover:bg-green-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(plot)
                    }}
                    className="text-gray-400 hover:text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                  <span
                    className={`text-gray-400 text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  >
                    ▾
                  </span>
                </div>
              </div>

              {/* Blueprint */}
              {isOpen && (
                <div className="px-5 pb-5 pt-4 border-t border-green-100 bg-white">
                  {plot.notes && <p className="text-sm text-gray-500 italic mb-4">{plot.notes}</p>}

                  {/* Render blueprint based on type */}
                  {plot.type === 'bucket' ? (
                    <BucketBlueprint
                      plot={plot}
                      cells={plotCells}
                      onChange={(x, y, label, color) => updateCell(plot.id, x, y, label, color)}
                    />
                  ) : (
                    <GridBlueprint
                      plot={plot}
                      cells={plotCells}
                      onChange={(x, y, label, color) => updateCell(plot.id, x, y, label, color)}
                    />
                  )}

                  {/* Controls */}
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => saveLayout(plot.id)}
                      disabled={savingId === plot.id || !isDirty}
                      className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
                    >
                      {savingId === plot.id ? 'Saving…' : 'Save Layout'}
                    </button>
                    <button
                      onClick={() => clearAll(plot.id)}
                      className="bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Clear All
                    </button>
                    {isDirty && (
                      <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add modal */}
      {showModal && <PlotModal onSave={handleAddPlot} onClose={() => setShowModal(false)} />}

      {/* Edit modal */}
      {editPlot && (
        <PlotModal initial={editPlot} onSave={handleEditPlot} onClose={() => setEditPlot(null)} />
      )}
    </div>
  )
}
