// Pantry > Vacuum Seal tab: the seal log.
import { useState, useEffect, useCallback } from 'react'
import api from '../../api'
import { photoUrl } from '../../components/PhotoUpload'
import BarcodeScanner from '../../components/BarcodeScanner'
import { Plus, Trash2, Layers, Loader, Scan, Camera } from 'lucide-react'
import { Spinner, ProductThumb, MealPhotoButton, ProductSearch } from './shared'

function VSForm({ onAdd, loading, gid }) {
  const EMPTY = {
    item_name: '',
    quantity: '',
    seal_date: '',
    expiry_date: '',
    storage_location: '',
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
      item_name: p.name || v.item_name,
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
                  product={{ image_url: form.product_image_url, name: form.item_name }}
                  size={36}
                />
              )}
              <input
                required
                className="input flex-1"
                placeholder="e.g. Ribeye steaks"
                value={form.item_name}
                onChange={set('item_name')}
              />
            </div>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input
              className="input"
              placeholder="e.g. 4 portions"
              value={form.quantity}
              onChange={set('quantity')}
            />
          </div>
          <div>
            <label className="label">Seal date *</label>
            <input
              required
              type="date"
              className="input"
              value={form.seal_date}
              onChange={set('seal_date')}
            />
          </div>
          <div>
            <label className="label">Expiry date (optional)</label>
            <input
              type="date"
              className="input"
              value={form.expiry_date}
              onChange={set('expiry_date')}
            />
          </div>
          <div>
            <label className="label">Storage location</label>
            <input
              className="input"
              placeholder="e.g. Chest freezer"
              value={form.storage_location}
              onChange={set('storage_location')}
            />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <input
            className="input"
            placeholder="e.g. Cook from frozen at 375°F"
            value={form.notes}
            onChange={set('notes')}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus size={15} /> {loading ? 'Adding…' : 'Log Seal'}
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

// ── Bulk Buy: Run list ────────────────────────────────────────────────────────

export function VacuumSealTab({ gid }) {
  const [vsLog, setVsLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingVs, setAddingVs] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/pantry/${gid}/vacuum-log`)
      setVsLog(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [gid])

  useEffect(() => {
    load()
  }, [load])

  const addVs = async form => {
    setAddingVs(true)
    try {
      await api.post(`/pantry/${gid}/vacuum-log`, form)
      await load()
    } finally {
      setAddingVs(false)
    }
  }
  const deleteVs = async id => {
    if (!confirm('Remove log entry?')) return
    await api.delete(`/pantry/${gid}/vacuum-log/${id}`)
    setVsLog(v => v.filter(i => i.id !== id))
  }

  if (loading) return <Spinner />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {vsLog.length} log entr{vsLog.length !== 1 ? 'ies' : 'y'}
        </p>
        <button
          onClick={() => setAddingVs(v => !v)}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus size={15} /> Log Seal
        </button>
      </div>
      {addingVs && (
        <div className="card border-moss-200 bg-moss-50">
          <VSForm
            gid={gid}
            onAdd={async f => {
              await addVs(f)
              setAddingVs(false)
            }}
            loading={addingVs}
          />
        </div>
      )}
      {vsLog.length === 0 ? (
        <div className="card text-center py-10 text-slate-400">
          <Layers size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No vacuum seal logs yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vsLog.map(entry => (
            <div key={entry.id} className="card flex items-center gap-3 min-h-[64px] py-3">
              {entry.meal_photo_path ? (
                <img
                  src={photoUrl(entry.meal_photo_path)}
                  alt={entry.item_name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-slate-100"
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <ProductThumb
                  product={{
                    image_url: entry.product_image_url,
                    name: entry.item_name,
                  }}
                  size={40}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm">{entry.item_name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mt-0.5">
                  {entry.quantity && <span>qty: {entry.quantity}</span>}
                  {entry.seal_date && <span>sealed {entry.seal_date}</span>}
                  {entry.use_by_date && (
                    <span
                      className={
                        new Date(entry.use_by_date) < new Date() ? 'text-red-500 font-medium' : ''
                      }
                    >
                      use by {entry.use_by_date}
                    </span>
                  )}
                  {entry.storage_location && <span>📍 {entry.storage_location}</span>}
                </div>
                {entry.notes && <p className="text-xs text-slate-300 mt-0.5">{entry.notes}</p>}
              </div>
              <MealPhotoButton
                gid={gid}
                itemId={entry.id}
                field="vacuum_seal_id"
                existingPath={entry.meal_photo_path}
                onUploaded={photo =>
                  setVsLog(prev =>
                    prev.map(e =>
                      e.id === entry.id ? { ...e, meal_photo_path: photo.image_path } : e
                    )
                  )
                }
              />
              <button
                onClick={() => deleteVs(entry.id)}
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
