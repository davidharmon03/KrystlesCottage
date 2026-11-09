// Pantry: constants and small pieces shared by every tab.
import { useState, useCallback, useRef } from 'react'
import api from '../../api'
import { photoUrl } from '../../components/PhotoUpload'
import { Package, Loader, Search, Camera } from 'lucide-react'

export const CATEGORIES = ['protein', 'produce', 'staple', 'dairy', 'grain', 'condiment', 'other']
export const PREP_METHODS = [
  { value: 'none', label: 'None / Raw' },
  { value: 'vacuum_sealed', label: 'Vacuum Sealed' },
  { value: 'ziploc', label: 'Ziploc Bag' },
  { value: 'glass_jar', label: 'Glass Jar' },
  { value: 'canned', label: 'Canned' },
  { value: 'dehydrated', label: 'Dehydrated' },
]
export const PREP_METHOD_LABELS = Object.fromEntries(PREP_METHODS.map(p => [p.value, p.label]))
export const BULK_CATS = [
  'protein',
  'produce',
  'staple',
  'dairy',
  'grain',
  'paper goods',
  'condiment',
  'other',
]
export const SECTION_ORDER = [
  'produce',
  'meat',
  'dairy',
  'frozen',
  'bakery',
  'pantry',
  'bulk',
  'beverages',
  'deli',
  'household',
  'other',
]
export const SECTION_EMOJI = {
  produce: '🥦',
  meat: '🥩',
  dairy: '🥛',
  frozen: '🧊',
  bakery: '🍞',
  pantry: '🥫',
  bulk: '⚖️',
  beverages: '🥤',
  deli: '🧀',
  household: '🧺',
  other: '📦',
}

export const STORAGE_COLORS = {
  'vacuum sealed': 'bg-moss-100 text-moss-700',
  frozen: 'bg-blue-100 text-blue-700',
  fresh: 'bg-green-100 text-green-700',
  canned: 'bg-amber-100 text-amber-700',
  'dry storage': 'bg-slate-100 text-slate-600',
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export const LOCATION_TITLES = {
  pantry: 'Pantry',
  refrigerator: 'Refrigerator',
  freezer: 'Freezer',
}

export function NoGroup() {
  return (
    <div className="text-center py-16 text-slate-400">
      <p className="font-medium">Join or create a group to get started.</p>
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-moss-200 border-t-moss-600 rounded-full animate-spin" />
    </div>
  )
}

export function ProductThumb({ product, size = 40 }) {
  if (!product) return null
  const base = '' // uploads are served from the same address as the site
  const src = product.image_path
    ? `${base}/${product.image_path}`
    : product.product_image_path
      ? `${base}/${product.product_image_path}`
      : product.image_url || product.product_image_url || null

  const s = { width: size, height: size }
  if (!src)
    return (
      <div
        style={s}
        className="rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"
      >
        <Package size={Math.round(size * 0.45)} className="text-slate-300" />
      </div>
    )
  return (
    <img
      src={src}
      alt={product.name || ''}
      style={s}
      className="rounded-lg object-cover flex-shrink-0 bg-slate-100"
      onError={e => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

// ── Meal photo button — inline upload for existing inventory / VS items ───────
export function MealPhotoButton({ gid, itemId, field, existingPath, onUploaded }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const displayUrl = previewUrl || photoUrl(existingPath)

  const handleFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      fd.append('group_id', gid)
      fd.append(field, itemId)
      fd.append('stage', 'stored')
      const res = await api.post('/photos', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onUploaded?.(res.data)
    } catch {
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      {displayUrl ? (
        <div
          className="relative w-10 h-10 cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <img
            src={displayUrl}
            alt="meal photo"
            className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-100"
            onError={e => {
              e.currentTarget.style.display = 'none'
            }}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
              <Loader size={13} className="animate-spin text-moss-600" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-10 h-10 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center hover:border-moss-400 hover:bg-moss-50 transition-colors"
        >
          {uploading ? (
            <Loader size={13} className="animate-spin text-moss-600" />
          ) : (
            <Camera size={13} className="text-slate-400" />
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Product search typeahead ──────────────────────────────────────────────────
export function ProductSearch({ gid, placeholder, onSelect, className = '' }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  const search = useCallback(
    async val => {
      if (!val.trim() || val.length < 2) {
        setResults([])
        setOpen(false)
        return
      }
      setLoading(true)
      try {
        const res = await api.get('/products/search', { params: { q: val, group_id: gid } })
        setResults(res.data)
        setOpen(res.data.length > 0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [gid]
  )

  const handleChange = e => {
    setQ(e.target.value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(e.target.value), 350)
  }

  const select = product => {
    onSelect(product)
    setQ('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          className="input pl-8 pr-8"
          placeholder={placeholder || 'Search products...'}
          value={q}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
        />
        {loading && (
          <Loader
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
          />
        )}
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-72 overflow-y-auto">
          {results.map((p, i) => (
            <button
              key={p.id || p.off_id || i}
              onMouseDown={() => select(p)}
              className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
            >
              <ProductThumb product={p} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {p.brand && <span className="text-xs text-slate-400">{p.brand}</span>}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      p.source === 'open_food_facts'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-moss-100 text-moss-700'
                    }`}
                  >
                    {p.source === 'open_food_facts' ? 'OFF' : 'catalog'}
                  </span>
                </div>
              </div>
              {p.unit_size && (
                <span className="text-xs text-slate-400 flex-shrink-0">{p.unit_size}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Inventory add form ────────────────────────────────────────────────────────
