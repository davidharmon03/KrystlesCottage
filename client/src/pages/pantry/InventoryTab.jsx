// Pantry > Inventory tab, and the Pantry / Refrigerator / Freezer pages.
import { useState, useEffect, useCallback } from 'react'
import api from '../../api'
import { photoUrl } from '../../components/PhotoUpload'
import BarcodeScanner from '../../components/BarcodeScanner'
import { Package, Plus, Trash2, Loader, Scan, Camera } from 'lucide-react'
import {
  CATEGORIES,
  PREP_METHODS,
  PREP_METHOD_LABELS,
  STORAGE_COLORS,
  LOCATION_TITLES,
  Spinner,
  ProductThumb,
  MealPhotoButton,
  ProductSearch,
} from './shared'

function InvForm({ onAdd, loading, gid, locationFilter }) {
  const EMPTY = {
    name: '',
    quantity: '',
    category: 'produce',
    storage_location: locationFilter || 'pantry',
    prep_method: 'none',
    notes: '',
    product_id: null,
    product_image_url: '',
  }
  const [form, setForm] = useState(EMPTY)
  const [barcode, setBarcode] = useState('')
  const [barcodeLoading, setBarcodeLoading] = useState(false)
  const [barcodeError, setBarcodeError] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)

  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }))

  const onProductSelect = p => {
    setForm(v => ({
      ...v,
      name: p.name || v.name,
      category: p.category || v.category,
      product_id: p.id || null,
      product_image_url: p.image_url || p.image_path || '',
    }))
  }

  const lookupBarcode = async () => {
    if (!barcode.trim()) return
    setBarcodeLoading(true)
    setBarcodeError('')
    try {
      const res = await api.get(`/products/barcode/${barcode.trim()}`)
      if (res.data) {
        onProductSelect(res.data)
        setBarcode('')
      } else {
        setBarcodeError('Product not found')
      }
    } catch {
      setBarcodeError('Lookup failed')
    } finally {
      setBarcodeLoading(false)
    }
  }

  const submit = e => {
    e.preventDefault()
    onAdd(form).then(() => {
      setForm(EMPTY)
      setBarcode('')
    })
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3">
        <ProductSearch
          gid={gid}
          placeholder="Search catalog to pre-fill…"
          onSelect={onProductSelect}
        />

        <div>
          <label className="label">Barcode scan / enter</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Scan
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                className="input pl-8"
                placeholder="Scan or type barcode…"
                value={barcode}
                onChange={e => {
                  setBarcode(e.target.value)
                  setBarcodeError('')
                }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), lookupBarcode())}
              />
            </div>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              title="Open camera scanner"
              className="btn-ghost text-sm flex items-center gap-1 flex-shrink-0 p-1.5"
            >
              <Camera size={14} />
            </button>
            <button
              type="button"
              onClick={lookupBarcode}
              disabled={barcodeLoading || !barcode.trim()}
              className="btn-ghost text-sm flex items-center gap-1 flex-shrink-0"
            >
              {barcodeLoading ? <Loader size={13} className="animate-spin" /> : 'Look up'}
            </button>
          </div>
          {barcodeError && <p className="text-xs text-red-500 mt-1">{barcodeError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Item name *</label>
            <div className="flex items-center gap-2">
              {form.product_image_url && (
                <ProductThumb
                  product={{ image_url: form.product_image_url, name: form.name }}
                  size={36}
                />
              )}
              <input
                required
                className="input flex-1"
                placeholder="e.g. Chicken breast"
                value={form.name}
                onChange={set('name')}
              />
            </div>
          </div>
          <div>
            <label className="label">Quantity *</label>
            <input
              required
              className="input"
              placeholder="e.g. 2 lbs"
              value={form.quantity}
              onChange={set('quantity')}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select
              className="input"
              value={form.storage_location}
              onChange={set('storage_location')}
              disabled={!!locationFilter}
            >
              <option value="pantry">Pantry</option>
              <option value="refrigerator">Refrigerator</option>
              <option value="freezer">Freezer</option>
            </select>
          </div>
          <div>
            <label className="label">Prep Method</label>
            <select className="input" value={form.prep_method} onChange={set('prep_method')}>
              {PREP_METHODS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input
            className="input"
            placeholder="Any extra info"
            value={form.notes}
            onChange={set('notes')}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus size={15} /> {loading ? 'Adding…' : 'Add Item'}
        </button>
      </form>

      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={async scannedBarcode => {
          setBarcode(scannedBarcode)
          setBarcodeError('')
          // Auto-lookup the scanned barcode
          setBarcodeLoading(true)
          try {
            const res = await api.get(`/products/barcode/${scannedBarcode.trim()}`)
            if (res.data) {
              onProductSelect(res.data)
              setBarcode('')
            } else {
              setBarcodeError('Product not found')
            }
          } catch {
            setBarcodeError('Lookup failed')
          } finally {
            setBarcodeLoading(false)
          }
        }}
      />
    </>
  )
}

// ── Vacuum seal add form ──────────────────────────────────────────────────────

// One inventory list for both uses: the Inventory tab (all locations) and the
// Pantry / Refrigerator / Freezer pages (locationFilter set).
export function InventoryTab({ gid, locationFilter }) {
  const [inv, setInv] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingInv, setAddingInv] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/pantry/${gid}/inventory`)
      setInv(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [gid])

  useEffect(() => {
    load()
  }, [load])

  const addInv = async form => {
    setAddingInv(true)
    try {
      await api.post(`/pantry/${gid}/inventory`, form)
      await load()
    } finally {
      setAddingInv(false)
    }
  }
  const deleteInv = async id => {
    if (!confirm('Remove item?')) return
    await api.delete(`/pantry/${gid}/inventory/${id}`)
    setInv(v => v.filter(i => i.id !== id))
  }

  const displayedInv = locationFilter
    ? inv.filter(item => item.storage_location === locationFilter)
    : inv

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {displayedInv.length} item{displayedInv.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setAddingInv(v => !v)}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus size={15} /> Add Item
        </button>
      </div>
      {addingInv && (
        <div className="card border-moss-200 bg-moss-50">
          <InvForm
            gid={gid}
            locationFilter={locationFilter}
            onAdd={async f => {
              await addInv(f)
              setAddingInv(false)
            }}
            loading={addingInv}
          />
        </div>
      )}
      {loading ? (
        <Spinner />
      ) : displayedInv.length === 0 ? (
        <div className="card text-center py-10 text-slate-400">
          <Package size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {locationFilter
              ? `No items in ${LOCATION_TITLES[locationFilter] || locationFilter}.`
              : 'No inventory yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedInv.map(item => (
            <div key={item.id} className="card flex items-center gap-3 min-h-[64px] py-3">
              {/* Meal photo (actual item) — falls back to product catalog thumb */}
              {item.meal_photo_path ? (
                <img
                  src={photoUrl(item.meal_photo_path)}
                  alt={item.name || item.item_name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-slate-100"
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <ProductThumb
                  product={{
                    image_url: item.product_image_url,
                    name: item.name || item.item_name,
                  }}
                  size={40}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm">{item.name || item.item_name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mt-0.5">
                  {!locationFilter && (
                    <span
                      className={`px-1.5 py-0.5 rounded font-medium ${STORAGE_COLORS[item.storage_type] || 'bg-slate-100 text-slate-600'}`}
                    >
                      {item.storage_type}
                    </span>
                  )}
                  {item.prep_method && item.prep_method !== 'none' && (
                    <span className="px-1.5 py-0.5 rounded bg-terra-100 text-terra-700 font-medium">
                      {PREP_METHOD_LABELS[item.prep_method] || item.prep_method}
                    </span>
                  )}
                  {item.quantity && <span>qty: {item.quantity}</span>}
                  {item.category && <span className="capitalize">{item.category}</span>}
                  {item.use_by_date && (
                    <span
                      className={
                        new Date(item.use_by_date) < new Date() ? 'text-red-500 font-medium' : ''
                      }
                    >
                      use by {item.use_by_date}
                    </span>
                  )}
                </div>
                {item.notes && <p className="text-xs text-slate-300 mt-0.5">{item.notes}</p>}
              </div>
              <MealPhotoButton
                gid={gid}
                itemId={item.id}
                field="inventory_item_id"
                existingPath={item.meal_photo_path}
                onUploaded={photo =>
                  setInv(prev =>
                    prev.map(i =>
                      i.id === item.id ? { ...i, meal_photo_path: photo.image_path } : i
                    )
                  )
                }
              />
              <button
                onClick={() => deleteInv(item.id)}
                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
