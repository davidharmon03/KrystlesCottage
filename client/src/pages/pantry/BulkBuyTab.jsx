// Pantry > Bulk Buy tab: shared purchase runs and who owes what.
import { useState, useEffect, useCallback } from 'react'
import api from '../../api'
import {
  Plus,
  Trash2,
  ShoppingCart,
  X,
  Loader,
  Pencil,
  Users,
  DollarSign,
  ChevronLeft,
  ShoppingBag,
} from 'lucide-react'
import { BULK_CATS, Spinner, ProductThumb, ProductSearch } from './shared'

function BulkRunList({ runs, members, loading, onSelect, onAdd, onDelete }) {
  const [form, setForm] = useState({ name: '', run_date: '', buyer_user_id: '' })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await onAdd(form)
      setForm({ name: '', run_date: '', buyer_user_id: '' })
      setShowForm(false)
      if (res) onSelect(res)
    } finally {
      setCreating(false)
    }
  }

  const STATUS_COLORS = {
    planning: 'bg-amber-100 text-amber-700',
    completed: 'bg-moss-100 text-moss-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {runs.length} run{runs.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus size={15} /> New Run
        </button>
      </div>

      {showForm && (
        <div className="card border-moss-200 bg-moss-50">
          <h3 className="font-semibold text-ink mb-3 font-serif text-sm">New Bulk Buy Run</h3>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Run name *</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Sam's Club April Run"
                  value={form.name}
                  onChange={set('name')}
                />
              </div>
              <div>
                <label className="label">Date *</label>
                <input
                  required
                  type="date"
                  className="input"
                  value={form.run_date}
                  onChange={set('run_date')}
                />
              </div>
              <div>
                <label className="label">Who's buying</label>
                <select
                  className="input"
                  value={form.buyer_user_id}
                  onChange={set('buyer_user_id')}
                >
                  <option value="">— TBD —</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-ghost flex-1 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-1"
              >
                {creating ? <Loader size={14} className="animate-spin" /> : 'Create Run'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : runs.length === 0 ? (
        <div className="card text-center py-10 text-slate-400">
          <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bulk buy runs yet.</p>
          <p className="text-sm mt-1">
            Create a run when the group is planning a warehouse store trip.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map(run => (
            <div
              key={run.id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelect(run)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-ink text-sm">{run.name}</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[run.status] || 'bg-slate-100 text-slate-600'}`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span>📅 {run.run_date}</span>
                    {run.buyer_name && (
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {run.buyer_name} buys
                      </span>
                    )}
                    <span>
                      {run.item_count} item{run.item_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onDelete(run)
                  }}
                  className="p-1.5 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Bulk Buy: Add Item Form ───────────────────────────────────────────────────
function AddItemForm({ members, gid, onAdd }) {
  const [form, setForm] = useState({
    item_name: '',
    category: 'other',
    quantity: '',
    est_cost: '',
    requested_by: '',
    notes: '',
    product_id: null,
    product_image_url: '',
  })
  const [saving, setSaving] = useState(false)
  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }))

  const onProductSelect = p => {
    setForm(v => ({
      ...v,
      item_name: p.name || v.item_name,
      category: p.category || v.category,
      product_id: p.id || null,
      product_image_url: p.image_url || '',
    }))
  }

  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await onAdd(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card border-moss-200 bg-moss-50">
      <h3 className="font-semibold text-ink mb-3 font-serif text-sm">Add Item</h3>
      <ProductSearch
        gid={gid}
        placeholder="Search catalog to pre-fill..."
        onSelect={onProductSelect}
        className="mb-3"
      />
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Item name *</label>
            <div className="flex items-center gap-2">
              {form.product_image_url && (
                <img
                  src={form.product_image_url}
                  alt=""
                  className="w-8 h-8 rounded object-cover flex-shrink-0 bg-slate-100"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
              <input
                required
                className="input flex-1"
                placeholder="e.g. Chicken breast"
                value={form.item_name}
                onChange={set('item_name')}
              />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={set('category')}>
              {BULK_CATS.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input
              className="input"
              placeholder="e.g. 10 lbs"
              value={form.quantity}
              onChange={set('quantity')}
            />
          </div>
          <div>
            <label className="label">Est. cost ($)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              placeholder="0.00"
              value={form.est_cost}
              onChange={set('est_cost')}
            />
          </div>
          <div>
            <label className="label">Requested by</label>
            <select className="input" value={form.requested_by} onChange={set('requested_by')}>
              <option value="">— Anyone —</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <input
              className="input"
              placeholder="Brand preference, etc."
              value={form.notes}
              onChange={set('notes')}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 text-sm flex items-center justify-center gap-1"
          >
            {saving ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <>
                <Plus size={14} /> Add Item
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Bulk Buy: Run detail ──────────────────────────────────────────────────────
function BulkRunDetail({ run, members, gid, onBack, onRunUpdated }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [settlement, setSettlement] = useState(null)
  const [showSettlement, setShowSettlement] = useState(false)
  const [editingCost, setEditingCost] = useState(null)
  const [costVal, setCostVal] = useState('')
  const [showItemForm, setShowItemForm] = useState(false)
  const [editRun, setEditRun] = useState(false)
  const [runForm, setRunForm] = useState({
    name: run.name,
    run_date: run.run_date,
    buyer_user_id: run.buyer_user_id || '',
    status: run.status,
  })

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/pantry/${gid}/bulk-buys/${run.id}/items`)
      setItems(res.data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [gid, run.id])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const addItem = async form => {
    await api.post(`/pantry/${gid}/bulk-buys/${run.id}/items`, form)
    await loadItems()
  }
  const deleteItem = async id => {
    if (!confirm('Remove item?')) return
    await api.delete(`/pantry/${gid}/bulk-buys/${run.id}/items/${id}`)
    await loadItems()
  }
  const saveActualCost = async item => {
    await api.put(`/pantry/${gid}/bulk-buys/${run.id}/items/${item.id}`, {
      actual_cost: costVal === '' ? null : parseFloat(costVal),
    })
    setEditingCost(null)
    await loadItems()
  }
  const fetchSettlement = async () => {
    const res = await api.get(`/pantry/${gid}/bulk-buys/${run.id}/settlement`)
    setSettlement(res.data)
    setShowSettlement(true)
  }
  const saveRunEdits = async () => {
    const res = await api.put(`/pantry/${gid}/bulk-buys/${run.id}`, runForm)
    onRunUpdated(res.data)
    setEditRun(false)
  }

  const totalEst = items.reduce((s, i) => s + (parseFloat(i.est_cost) || 0), 0)
  const totalActual = items.reduce((s, i) => s + (parseFloat(i.actual_cost) || 0), 0)
  const hasActual = items.some(i => i.actual_cost != null)
  const STATUS_COLORS = {
    planning: 'bg-amber-100 text-amber-700',
    completed: 'bg-moss-100 text-moss-700',
  }
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium"
        >
          <ChevronLeft size={16} /> All Runs
        </button>
      </div>

      <div className="card">
        {editRun ? (
          <div className="space-y-3">
            <h3 className="font-semibold text-ink font-serif text-sm">Edit Run</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Name</label>
                <input
                  className="input"
                  value={runForm.name}
                  onChange={e => setRunForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={runForm.run_date}
                  onChange={e => setRunForm(f => ({ ...f, run_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={runForm.status}
                  onChange={e => setRunForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="planning">Planning</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Who's buying</label>
                <select
                  className="input"
                  value={runForm.buyer_user_id}
                  onChange={e => setRunForm(f => ({ ...f, buyer_user_id: e.target.value }))}
                >
                  <option value="">— TBD —</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditRun(false)} className="btn-ghost flex-1 text-sm">
                Cancel
              </button>
              <button onClick={saveRunEdits} className="btn-primary flex-1 text-sm">
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-semibold text-ink">{run.name}</h2>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[run.status] || 'bg-slate-100 text-slate-600'}`}
                >
                  {run.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span>📅 {run.run_date}</span>
                {run.buyer_name && (
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {run.buyer_name} buys
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditRun(true)}
              className="btn-ghost text-sm flex items-center gap-1"
            >
              <Pencil size={14} /> Edit
            </button>
          </div>
        )}
      </div>

      <div className="card bg-slate-50 flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Est. Total</p>
          <p className="text-lg font-bold text-ink">${totalEst.toFixed(2)}</p>
        </div>
        {hasActual && (
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Actual Total
            </p>
            <p className="text-lg font-bold text-moss-700">${totalActual.toFixed(2)}</p>
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowItemForm(v => !v)}
            className="btn-primary text-sm flex items-center gap-1"
          >
            <Plus size={14} /> Add Item
          </button>
          <button onClick={fetchSettlement} className="btn-ghost text-sm flex items-center gap-1">
            <DollarSign size={14} /> Settle Up
          </button>
        </div>
      </div>

      {showItemForm && (
        <AddItemForm
          members={members}
          gid={gid}
          onAdd={async form => {
            await addItem(form)
            setShowItemForm(false)
          }}
        />
      )}

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="card text-center py-8 text-slate-400">
          <ShoppingCart size={28} className="mx-auto mb-2 opacity-30" />
          <p>No items yet. Add some to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="card">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 capitalize">
                {cat}
              </h4>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0"
                  >
                    <ProductThumb
                      product={{ image_url: item.product_image_url, name: item.item_name }}
                      size={36}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{item.item_name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mt-0.5">
                        <span>qty: {item.quantity_needed || '—'}</span>
                        {item.requested_by_name && <span>for {item.requested_by_name}</span>}
                        {item.notes && <span className="text-slate-300">· {item.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Est.</p>
                        <p className="text-sm text-slate-600">
                          {item.est_cost ? `$${parseFloat(item.est_cost).toFixed(2)}` : '—'}
                        </p>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <p className="text-xs text-slate-400">Actual</p>
                        {editingCost === item.id ? (
                          <input
                            autoFocus
                            type="number"
                            step="0.01"
                            className="input text-xs py-0.5 px-1 w-16 text-right"
                            value={costVal}
                            onChange={e => setCostVal(e.target.value)}
                            onBlur={() => saveActualCost(item)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveActualCost(item)
                              if (e.key === 'Escape') setEditingCost(null)
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setEditingCost(item.id)
                              setCostVal(item.actual_cost ?? '')
                            }}
                            className="text-sm font-medium text-moss-700 hover:underline"
                          >
                            {item.actual_cost != null ? (
                              `$${parseFloat(item.actual_cost).toFixed(2)}`
                            ) : (
                              <span className="text-slate-300 italic">set</span>
                            )}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSettlement && settlement && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-ink">Settle Up</h3>
              <button
                onClick={() => setShowSettlement(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              <span className="font-semibold text-ink">
                {settlement.run?.buyer_name || 'Buyer'}
              </span>{' '}
              paid the total. Here's what everyone else owes:
            </p>
            {settlement.settlements?.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                No settlements needed — buyer requested everything.
              </p>
            ) : (
              <div className="space-y-2">
                {settlement.settlements?.map(s => (
                  <div
                    key={s.user_id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-sm font-medium text-ink">{s.name}</span>
                    <span className="text-sm font-bold text-moss-700">
                      ${parseFloat(s.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
              <span className="text-xs text-slate-400">Total paid</span>
              <span className="text-sm font-bold text-ink">
                ${parseFloat(settlement.total || 0).toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => setShowSettlement(false)}
              className="btn-primary w-full mt-4 text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shopping List Tab ─────────────────────────────────────────────────────────

export function BulkBuyTab({ gid }) {
  const [runs, setRuns] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Members come from the group itself (GET /groups/:id); there is no
      // separate /members address. Asking for one used to make the whole
      // Pantry page come up empty.
      const [rRes, gRes] = await Promise.all([
        api.get(`/pantry/${gid}/bulk-buys`),
        api.get(`/groups/${gid}`),
      ])
      setRuns(rRes.data)
      setMembers(gRes.data.members || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [gid])

  useEffect(() => {
    load()
  }, [load])

  const addRun = async form => {
    const res = await api.post(`/pantry/${gid}/bulk-buys`, form)
    await load()
    return res.data
  }
  const deleteRun = async run => {
    if (!confirm(`Delete "${run.name}"?`)) return
    await api.delete(`/pantry/${gid}/bulk-buys/${run.id}`)
    await load()
  }

  if (loading) return <Spinner />
  return selectedRun ? (
    <BulkRunDetail
      run={selectedRun}
      members={members}
      gid={gid}
      onBack={() => setSelectedRun(null)}
      onRunUpdated={updated => setSelectedRun(updated)}
    />
  ) : (
    <BulkRunList
      runs={runs}
      members={members}
      loading={false}
      onSelect={setSelectedRun}
      onAdd={addRun}
      onDelete={deleteRun}
    />
  )
}
