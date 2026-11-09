// Pantry > Shopping tab.
import { useState, useEffect, useCallback } from 'react'
import api from '../../api'
import BarcodeScanner from '../../components/BarcodeScanner'
import { Plus, Trash2, Check, ShoppingCart, X, Camera, Printer } from 'lucide-react'
import { SECTION_ORDER, SECTION_EMOJI, Spinner, ProductThumb, ProductSearch } from './shared'

export function ShoppingListTab({ gid }) {
  const [lists, setLists] = useState([])
  const [activeListId, setActiveListId] = useState(null)
  const [items, setItems] = useState([])
  const [loadingLists, setLoadingLists] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [addingManual, setAddingManual] = useState(false)
  const [manualForm, setManualForm] = useState({
    name: '',
    quantity: '',
    unit: '',
    store_section: 'other',
  })
  const [pendingProduct, setPendingProduct] = useState(null)
  const [pendingQty, setPendingQty] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)

  const loadLists = useCallback(async () => {
    setLoadingLists(true)
    try {
      const res = await api.get('/shopping-lists', { params: { group_id: gid } })
      setLists(res.data)
      if (res.data.length > 0) setActiveListId(id => id || res.data[0].id)
    } catch {
    } finally {
      setLoadingLists(false)
    }
  }, [gid])

  const loadItems = useCallback(async () => {
    if (!activeListId) return
    setLoadingItems(true)
    try {
      const res = await api.get(`/shopping-lists/${activeListId}/items`)
      setItems(res.data)
    } catch {
    } finally {
      setLoadingItems(false)
    }
  }, [activeListId])

  useEffect(() => {
    loadLists()
  }, [loadLists])
  useEffect(() => {
    loadItems()
  }, [loadItems])

  const createList = async () => {
    const res = await api.post('/shopping-lists', {
      group_id: gid,
      name: newListName || 'Weekly Shop',
    })
    setLists(l => [res.data, ...l])
    setActiveListId(res.data.id)
    setShowNewList(false)
    setNewListName('')
  }

  const addFromProduct = async (product, qty) => {
    if (!activeListId) return
    await api.post(`/shopping-lists/${activeListId}/items`, {
      name: product.name,
      product_id: product.id || null,
      quantity: qty || '',
      unit: product.unit_type || '',
      store_section: product.store_section || 'other',
      category: product.category || 'other',
    })
    setPendingProduct(null)
    setPendingQty('')
    await loadItems()
  }

  const addManual = async e => {
    e.preventDefault()
    await api.post(`/shopping-lists/${activeListId}/items`, manualForm)
    setManualForm({ name: '', quantity: '', unit: '', store_section: 'other' })
    setAddingManual(false)
    await loadItems()
  }

  const toggleCheck = async item => {
    const updated = { ...item, is_checked: item.is_checked ? 0 : 1 }
    setItems(prev => prev.map(i => (i.id === item.id ? updated : i)))
    await api.put(`/shopping-lists/${activeListId}/items/${item.id}`, {
      is_checked: updated.is_checked,
    })
  }

  const deleteItem = async item => {
    await api.delete(`/shopping-lists/${activeListId}/items/${item.id}`)
    setItems(prev => prev.filter(i => i.id !== item.id))
  }

  const clearChecked = async () => {
    await api.delete(`/shopping-lists/${activeListId}/items`)
    setItems(prev => prev.filter(i => !i.is_checked))
  }

  const completeList = async () => {
    if (!confirm('Mark this list as complete and archive it?')) return
    await api.put(`/shopping-lists/${activeListId}/complete`)
    setLists(prev => prev.filter(l => l.id !== activeListId))
    setItems([])
    setActiveListId(null)
  }

  const grouped = items.reduce((acc, item) => {
    const s = item.store_section || 'other'
    ;(acc[s] = acc[s] || []).push(item)
    return acc
  }, {})
  const sortedSections = Object.keys(grouped).sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a),
      bi = SECTION_ORDER.indexOf(b)
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
  })
  const checkedCount = items.filter(i => i.is_checked).length

  if (loadingLists) return <Spinner />

  if (lists.length === 0 && !showNewList)
    return (
      <div className="space-y-4">
        <div className="card text-center py-12">
          <ShoppingCart size={36} className="mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="font-medium text-slate-600 mb-1">No shopping lists yet.</p>
          <p className="text-sm text-slate-400 mb-4">
            Create a list to start tracking what you need to buy.
          </p>
          <button onClick={() => setShowNewList(true)} className="btn-primary">
            Create First List
          </button>
        </div>
      </div>
    )

  return (
    <div className="space-y-4">
      {/* List selector row */}
      <div className="flex items-center gap-2 flex-wrap">
        {lists.length > 0 && (
          <select
            className="input flex-1 min-w-0 text-sm"
            value={activeListId || ''}
            onChange={e => setActiveListId(e.target.value)}
          >
            {lists.map(l => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.item_count ?? 0} items
                {l.checked_count > 0 ? `, ${l.checked_count} ✓` : ''})
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setShowNewList(v => !v)}
          className="no-print btn-ghost text-sm flex items-center gap-1"
        >
          <Plus size={14} /> New List
        </button>
        {activeListId && (
          <>
            <button
              onClick={completeList}
              title="Complete list"
              className="no-print btn-ghost text-sm text-slate-400 hover:text-moss-600 flex items-center gap-1"
            >
              <Check size={14} /> Done
            </button>
            <button
              onClick={() => window.print()}
              title="Print list"
              className="no-print btn-ghost text-sm text-slate-400 hover:text-moss-600 flex items-center gap-1"
            >
              <Printer size={14} /> Print
            </button>
          </>
        )}
      </div>

      {showNewList && (
        <div className="card border-moss-200 bg-moss-50 flex gap-2">
          <input
            autoFocus
            className="input flex-1 text-sm"
            placeholder="List name (e.g. Weekly Shop)"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createList()}
          />
          <button onClick={createList} className="btn-primary text-sm">
            Create
          </button>
          <button onClick={() => setShowNewList(false)} className="btn-ghost text-sm">
            Cancel
          </button>
        </div>
      )}

      {activeListId && (
        <>
          {/* Sticky add bar — search + pending confirm + manual toggle */}
          <div className="sticky top-0 z-10 bg-cream pt-1 pb-2 space-y-2">
            <div className="flex gap-2 items-center">
              <ProductSearch
                gid={gid}
                placeholder="Search products to add to list…"
                onSelect={p => {
                  setPendingProduct(p)
                  setPendingQty('')
                }}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                title="Scan barcode"
                className="btn-ghost p-2 flex-shrink-0"
                aria-label="Scan barcode"
              >
                <Camera size={18} />
              </button>
            </div>

            {pendingProduct && (
              <div className="card border-moss-200 bg-moss-50 flex items-center gap-3 py-2.5">
                <ProductThumb product={pendingProduct} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-ink truncate">{pendingProduct.name}</p>
                  {pendingProduct.brand && (
                    <p className="text-xs text-slate-400">{pendingProduct.brand}</p>
                  )}
                </div>
                <input
                  className="input w-20 text-sm"
                  placeholder="Qty"
                  value={pendingQty}
                  onChange={e => setPendingQty(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addFromProduct(pendingProduct, pendingQty)}
                  autoFocus
                />
                <button
                  onClick={() => addFromProduct(pendingProduct, pendingQty)}
                  className="btn-primary text-sm px-3 py-2"
                >
                  Add
                </button>
                <button
                  onClick={() => setPendingProduct(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => setAddingManual(v => !v)}
                className="text-xs text-slate-400 hover:text-moss-600 flex items-center gap-1 py-1"
              >
                <Plus size={12} /> Add item manually
              </button>
              {checkedCount > 0 && (
                <button
                  onClick={clearChecked}
                  className="text-xs text-red-400 hover:text-red-600 py-1"
                >
                  Clear {checkedCount} checked
                </button>
              )}
            </div>
          </div>

          {addingManual && (
            <form onSubmit={addManual} className="card border-slate-200 bg-slate-50 space-y-2">
              <input
                required
                className="input text-sm"
                placeholder="Item name *"
                value={manualForm.name}
                onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input text-sm"
                  placeholder="Quantity"
                  value={manualForm.quantity}
                  onChange={e => setManualForm(f => ({ ...f, quantity: e.target.value }))}
                />
                <select
                  className="input text-sm"
                  value={manualForm.store_section}
                  onChange={e => setManualForm(f => ({ ...f, store_section: e.target.value }))}
                >
                  {SECTION_ORDER.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setAddingManual(false)}
                  className="btn-ghost flex-1 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 text-sm">
                  Add
                </button>
              </div>
            </form>
          )}

          {loadingItems ? (
            <Spinner />
          ) : items.length === 0 ? (
            <div className="card text-center py-8 text-slate-400 text-sm">
              List is empty — search for products above or add manually.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSections.map(section => (
                <div key={section}>
                  {/* Section header — background so it reads clearly as it scrolls */}
                  <div className="flex items-center gap-2 bg-cream py-1.5 mb-1 -mx-1 px-1 border-b border-slate-100">
                    <span>{SECTION_EMOJI[section] || '📦'}</span>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider capitalize">
                      {section}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {grouped[section]
                      .slice()
                      .sort((a, b) => (a.is_checked ? 1 : 0) - (b.is_checked ? 1 : 0))
                      .map(item => (
                        <div
                          key={item.id}
                          onClick={() => toggleCheck(item)}
                          className={`card flex items-center gap-3 min-h-[56px] py-2.5 px-3 cursor-pointer active:bg-slate-50 transition-opacity select-none ${item.is_checked ? 'opacity-50' : ''}`}
                        >
                          {/* Checkbox visual */}
                          <div
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              item.is_checked ? 'bg-moss-500 border-moss-500' : 'border-slate-300'
                            }`}
                            onClick={e => {
                              e.stopPropagation()
                              toggleCheck(item)
                            }}
                          >
                            {item.is_checked && <Check size={13} className="text-white" />}
                          </div>
                          <ProductThumb
                            product={{
                              image_url: item.product_image_url,
                              image_path: item.product_image_path,
                              name: item.name,
                            }}
                            size={36}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium text-ink leading-tight ${item.is_checked ? 'line-through text-slate-400' : ''}`}
                            >
                              {item.name}
                            </p>
                            {item.product_brand && (
                              <p className="text-xs text-slate-400">{item.product_brand}</p>
                            )}
                          </div>
                          {(item.quantity || item.unit) && (
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {[item.quantity, item.unit].filter(Boolean).join(' ')}
                            </span>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              deleteItem(item)
                            }}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 -mr-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={async scannedBarcode => {
          try {
            const res = await api.get(`/products/barcode/${scannedBarcode.trim()}`)
            if (res.data) {
              setPendingProduct(res.data)
              setPendingQty('')
            } else {
              setManualForm(f => ({ ...f, name: scannedBarcode.trim() }))
              setAddingManual(true)
            }
          } catch {
            setManualForm(f => ({ ...f, name: scannedBarcode.trim() }))
            setAddingManual(true)
          }
        }}
      />
    </div>
  )
}

// ── Main Pantry page ──────────────────────────────────────────────────────────
