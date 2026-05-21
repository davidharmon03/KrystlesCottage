import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Printer, Plus, Trash2, Link, Tag, CalendarDays, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import QRCode from 'qrcode'

// ─────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────

async function makeQR(url) {
  if (!url) return null
  try {
    return await QRCode.toDataURL(url, {
      width: 80, margin: 1,
      color: { dark: '#3d2b1f', light: '#fdf8f0' },
    })
  } catch { return null }
}

const PRINT_TYPES = [
  { id: 'labels',   label: 'Bag Labels',    icon: Tag,            desc: 'Vacuum-sealed bag instruction cards' },
  { id: 'menu',     label: 'Weekly Menu',   icon: CalendarDays,   desc: 'Printable weekly meal plan' },
  { id: 'shopping', label: 'Shopping List', icon: ShoppingCart,   desc: 'Organized grocery list by category' },
  { id: 'cards',    label: 'Meal Cards',    icon: UtensilsCrossed, desc: 'Recipe cards for any dish' },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEALS = ['Breakfast', 'Lunch', 'Dinner']
const SHOP_CATEGORIES = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Bakery', 'Other']

// ─────────────────────────────────────────────
// BAG LABELS
// ─────────────────────────────────────────────

const BLANK_LABEL = {
  item_name: '', source: 'Grown in the Garden', cook_temp: '',
  cook_time: '', date_sealed: new Date().toISOString().split('T')[0],
  contents: '', notes: '', link_url: '',
}

function LabelCard({ label, index, onDelete, qrDataUrl }) {
  return (
    <div className="print-label bg-parchment border-2 border-dashed border-terra-300 rounded-xl p-5 relative" style={{ fontFamily: "'Lora', Georgia, serif" }}>
      {onDelete && (
        <button onClick={() => onDelete(index)} className="absolute top-3 right-3 text-slate-300 hover:text-red-400 no-print">
          <Trash2 size={14} />
        </button>
      )}
      <div className="flex items-start justify-between mb-4 pb-3 border-b border-terra-200">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded-full bg-moss-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">K</span>
            </div>
            <span className="text-xs font-semibold text-moss-700 uppercase tracking-widest">Cuisine</span>
          </div>
          <p className="text-xs text-terra-600 italic">Healthy · Organic · Community-Driven</p>
        </div>
        <div className="flex items-end gap-2">
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR" width={56} height={56} className="rounded" style={{ imageRendering: 'pixelated' }} />
          )}
          {label.date_sealed && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Sealed</p>
              <p className="text-xs font-semibold text-ink">{label.date_sealed}</p>
            </div>
          )}
        </div>
      </div>
      <h2 className="text-xl font-bold text-ink mb-1 leading-tight">{label.item_name || 'Item Name'}</h2>
      {label.contents && <p className="text-xs text-slate-600 mb-3 italic">{label.contents}</p>}
      {label.source && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-moss-500 text-sm">🌿</span>
          <p className="text-xs text-moss-700 font-medium">{label.source}</p>
        </div>
      )}
      {(label.cook_temp || label.cook_time) && (
        <div className="bg-terra-50 border border-terra-200 rounded-lg p-3 mb-3">
          <p className="text-xs font-bold text-terra-800 uppercase tracking-wider mb-1.5">Cooking Instructions</p>
          <div className="flex gap-4">
            {label.cook_temp && <div><p className="text-xs text-slate-500">Temperature</p><p className="text-sm font-semibold text-terra-700">{label.cook_temp}</p></div>}
            {label.cook_time && <div><p className="text-xs text-slate-500">Time</p><p className="text-sm font-semibold text-terra-700">{label.cook_time}</p></div>}
          </div>
        </div>
      )}
      {label.notes && <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2 mt-2">{label.notes}</p>}
      <p className="text-xs text-slate-300 mt-3 text-center tracking-widest">— Krystle's Cottage —</p>
    </div>
  )
}

function BagLabels() {
  const [labels, setLabels] = useState([{ ...BLANK_LABEL }])
  const [activeIdx, setActiveIdx] = useState(0)
  const [qrUrls, setQrUrls] = useState({})

  const activeLabel = labels[activeIdx] || BLANK_LABEL

  useEffect(() => {
    labels.forEach((label, i) => {
      if (label.link_url) {
        makeQR(label.link_url).then(dataUrl => setQrUrls(prev => ({ ...prev, [i]: dataUrl })))
      } else {
        setQrUrls(prev => { const next = { ...prev }; delete next[i]; return next })
      }
    })
  }, [labels])

  const updateActive = updates => setLabels(prev => prev.map((l, i) => i === activeIdx ? { ...l, ...updates } : l))
  const addLabel = () => { setLabels(prev => [...prev, { ...BLANK_LABEL }]); setActiveIdx(labels.length) }
  const deleteLabel = idx => {
    if (labels.length === 1) return
    const newLabels = labels.filter((_, i) => i !== idx)
    setLabels(newLabels)
    setActiveIdx(Math.min(activeIdx, newLabels.length - 1))
    setQrUrls(prev => {
      const next = {}
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k)
        if (ki < idx) next[ki] = v
        else if (ki > idx) next[ki - 1] = v
      })
      return next
    })
  }
  const set = field => e => updateActive({ [field]: e.target.value })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="no-print space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink font-serif">Labels ({labels.length})</h3>
            <button onClick={addLabel} className="text-sm text-moss-600 hover:text-moss-700 font-medium flex items-center gap-1">
              <Plus size={14} /> Add label
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {labels.map((l, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors border ${activeIdx === i ? 'bg-moss-500 text-white border-moss-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {l.item_name || `Label ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
        <div className="card space-y-3">
          <h3 className="font-semibold text-ink font-serif">Edit Label {activeIdx + 1}</h3>
          <div><label className="label">Item name *</label><input className="input" placeholder="e.g. Garlic Herb Ribeye" value={activeLabel.item_name} onChange={set('item_name')} /></div>
          <div><label className="label">Contents / Description</label><input className="input" placeholder="e.g. 2 ribeye steaks, seasoned with rosemary" value={activeLabel.contents} onChange={set('contents')} /></div>
          <div><label className="label">Source</label><input className="input" placeholder="e.g. Grown in the Garden" value={activeLabel.source} onChange={set('source')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cook temperature</label><input className="input" placeholder="e.g. 450°F" value={activeLabel.cook_temp} onChange={set('cook_temp')} /></div>
            <div><label className="label">Cook time</label><input className="input" placeholder="e.g. 3-4 min per side" value={activeLabel.cook_time} onChange={set('cook_time')} /></div>
          </div>
          <div><label className="label">Date sealed</label><input type="date" className="input" value={activeLabel.date_sealed} onChange={set('date_sealed')} /></div>
          <div>
            <label className="label flex items-center gap-1.5"><Link size={13} className="text-slate-400" /> Link URL (generates QR code)</label>
            <input className="input" type="url" placeholder="https://… (recipe, notes, etc.)" value={activeLabel.link_url} onChange={set('link_url')} />
            {qrUrls[activeIdx] && (
              <div className="mt-2 flex items-center gap-2">
                <img src={qrUrls[activeIdx]} alt="QR preview" width={48} height={48} className="rounded border border-slate-200" />
                <p className="text-xs text-slate-400">QR will appear on the label</p>
              </div>
            )}
          </div>
          <div><label className="label">Notes</label><textarea className="input resize-none" rows={2} placeholder="Any additional notes…" value={activeLabel.notes} onChange={set('notes')} /></div>
        </div>
        <div className="card bg-parchment border-terra-200">
          <h4 className="font-semibold text-terra-800 text-sm font-serif mb-2">Print Tips</h4>
          <ul className="text-xs text-terra-700 space-y-1">
            <li>• Print on parchment paper for best food-safe results</li>
            <li>• Fold the label and seal inside the vacuum bag</li>
            <li>• Add a recipe URL to generate a QR code on the label</li>
            <li>• Use "Print to PDF" to save for digital sharing</li>
          </ul>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-ink mb-3 font-serif no-print">Preview</h3>
        <div className="space-y-4">
          {labels.map((l, i) => (
            <LabelCard key={i} label={l} index={i} qrDataUrl={qrUrls[i] || null} onDelete={labels.length > 1 ? deleteLabel : null} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// WEEKLY MENU
// ─────────────────────────────────────────────

const BLANK_MENU = () => {
  const grid = {}
  DAYS.forEach(d => { grid[d] = {}; MEALS.forEach(m => { grid[d][m] = '' }) })
  return { title: "This Week's Menu", week_of: new Date().toISOString().split('T')[0], notes: '', grid }
}

function WeeklyMenu() {
  const [menu, setMenu] = useState(BLANK_MENU())

  const setMeal = (day, meal, val) => setMenu(prev => ({
    ...prev, grid: { ...prev.grid, [day]: { ...prev.grid[day], [meal]: val } }
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="no-print space-y-4">
        <div className="card space-y-3">
          <h3 className="font-semibold text-ink font-serif">Menu Details</h3>
          <div><label className="label">Menu title</label><input className="input" placeholder="This Week's Menu" value={menu.title} onChange={e => setMenu(p => ({ ...p, title: e.target.value }))} /></div>
          <div><label className="label">Week of</label><input type="date" className="input" value={menu.week_of} onChange={e => setMenu(p => ({ ...p, week_of: e.target.value }))} /></div>
          <div><label className="label">Footer notes</label><input className="input" placeholder="e.g. All meals organic · Serves 4" value={menu.notes} onChange={e => setMenu(p => ({ ...p, notes: e.target.value }))} /></div>
        </div>
        <div className="card space-y-4">
          <h3 className="font-semibold text-ink font-serif">Meals</h3>
          {DAYS.map(day => (
            <div key={day}>
              <p className="text-sm font-semibold text-terra-700 mb-2">{day}</p>
              <div className="space-y-2">
                {MEALS.map(meal => (
                  <div key={meal} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-20 flex-shrink-0">{meal}</span>
                    <input className="input flex-1" placeholder={`${day} ${meal}…`} value={menu.grid[day][meal]} onChange={e => setMeal(day, meal, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-ink mb-3 font-serif no-print">Preview</h3>
        <div className="print-label bg-parchment border-2 border-dashed border-terra-300 rounded-xl p-5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          <div className="text-center mb-4 pb-3 border-b border-terra-200">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-moss-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">K</span>
              </div>
              <span className="text-xs font-semibold text-moss-700 uppercase tracking-widest">Krystle's Cottage</span>
            </div>
            <h2 className="text-xl font-bold text-ink">{menu.title || "This Week's Menu"}</h2>
            {menu.week_of && <p className="text-xs text-slate-500 mt-0.5">Week of {menu.week_of}</p>}
          </div>
          <div className="space-y-3">
            {DAYS.map(day => {
              const hasMeals = MEALS.some(m => menu.grid[day][m])
              if (!hasMeals) return null
              return (
                <div key={day} className="border-b border-terra-100 pb-2 last:border-0">
                  <p className="text-xs font-bold text-terra-700 uppercase tracking-wider mb-1">{day}</p>
                  <div className="space-y-0.5">
                    {MEALS.map(m => menu.grid[day][m] ? (
                      <div key={m} className="flex gap-2">
                        <span className="text-xs text-slate-400 w-18 flex-shrink-0">{m}:</span>
                        <span className="text-xs text-ink">{menu.grid[day][m]}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )
            })}
          </div>
          {menu.notes && <p className="text-xs text-slate-400 italic mt-3 text-center">{menu.notes}</p>}
          <p className="text-xs text-slate-300 mt-3 text-center tracking-widest">— Krystle's Cottage —</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SHOPPING LIST
// ─────────────────────────────────────────────

const BLANK_ITEM = (category = 'Produce') => ({ name: '', qty: '', category, checked: false })

function ShoppingList() {
  const [listTitle, setListTitle] = useState('Shopping List')
  const [items, setItems] = useState([BLANK_ITEM()])
  const [newItem, setNewItem] = useState(BLANK_ITEM())

  const addItem = () => {
    if (!newItem.name.trim()) return
    setItems(prev => [...prev, { ...newItem }])
    setNewItem(BLANK_ITEM(newItem.category))
  }

  const removeItem = idx => setItems(prev => prev.filter((_, i) => i !== idx))

  const byCategory = SHOP_CATEGORIES.map(cat => ({
    cat, items: items.filter(i => i.category === cat && i.name.trim())
  })).filter(g => g.items.length > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="no-print space-y-4">
        <div className="card space-y-3">
          <h3 className="font-semibold text-ink font-serif">List Details</h3>
          <div><label className="label">List title</label><input className="input" placeholder="Shopping List" value={listTitle} onChange={e => setListTitle(e.target.value)} /></div>
        </div>
        <div className="card space-y-3">
          <h3 className="font-semibold text-ink font-serif">Add Item</h3>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Item name" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addItem()} />
            <input className="input w-20" placeholder="Qty" value={newItem.qty} onChange={e => setNewItem(p => ({ ...p, qty: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <select className="input flex-1" value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
              {SHOP_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={addItem} className="btn-terra flex items-center gap-1 flex-shrink-0"><Plus size={14} /> Add</button>
          </div>
        </div>
        {items.some(i => i.name.trim()) && (
          <div className="card space-y-2">
            <h3 className="font-semibold text-ink font-serif">Items ({items.filter(i => i.name.trim()).length})</h3>
            {items.map((item, i) => item.name.trim() ? (
              <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-sm text-ink">{item.name}</span>
                  {item.qty && <span className="text-xs text-slate-400 ml-2">({item.qty})</span>}
                  <span className="text-xs text-moss-600 ml-2 bg-moss-50 px-1.5 py-0.5 rounded">{item.category}</span>
                </div>
                <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-400"><Trash2 size={13} /></button>
              </div>
            ) : null)}
          </div>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-ink mb-3 font-serif no-print">Preview</h3>
        <div className="print-label bg-parchment border-2 border-dashed border-terra-300 rounded-xl p-5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          <div className="text-center mb-4 pb-3 border-b border-terra-200">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-moss-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">K</span>
              </div>
              <span className="text-xs font-semibold text-moss-700 uppercase tracking-widest">Krystle's Cottage</span>
            </div>
            <h2 className="text-xl font-bold text-ink">{listTitle || 'Shopping List'}</h2>
          </div>
          {byCategory.length === 0 ? (
            <p className="text-xs text-slate-400 text-center italic">Add items to see preview</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map(({ cat, items: catItems }) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-terra-700 uppercase tracking-wider mb-1.5">{cat}</p>
                  <ul className="space-y-1">
                    {catItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm border border-slate-400 flex-shrink-0 inline-block" />
                        <span className="text-xs text-ink">{item.name}{item.qty ? ` — ${item.qty}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-300 mt-4 text-center tracking-widest">— Krystle's Cottage —</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MEAL CARDS
// ─────────────────────────────────────────────

const BLANK_CARD = { name: '', servings: '', prep_time: '', cook_time: '', ingredients: '', instructions: '', notes: '' }

function MealCards() {
  const [cards, setCards] = useState([{ ...BLANK_CARD }])
  const [activeIdx, setActiveIdx] = useState(0)

  const active = cards[activeIdx] || BLANK_CARD
  const update = updates => setCards(prev => prev.map((c, i) => i === activeIdx ? { ...c, ...updates } : c))
  const addCard = () => { setCards(prev => [...prev, { ...BLANK_CARD }]); setActiveIdx(cards.length) }
  const deleteCard = idx => {
    if (cards.length === 1) return
    const next = cards.filter((_, i) => i !== idx)
    setCards(next)
    setActiveIdx(Math.min(activeIdx, next.length - 1))
  }
  const set = field => e => update({ [field]: e.target.value })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="no-print space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink font-serif">Cards ({cards.length})</h3>
            <button onClick={addCard} className="text-sm text-moss-600 hover:text-moss-700 font-medium flex items-center gap-1"><Plus size={14} /> Add card</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {cards.map((c, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors border ${activeIdx === i ? 'bg-moss-500 text-white border-moss-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {c.name || `Card ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
        <div className="card space-y-3">
          <h3 className="font-semibold text-ink font-serif">Edit Card {activeIdx + 1}</h3>
          <div><label className="label">Recipe name *</label><input className="input" placeholder="e.g. Roasted Garlic Chicken" value={active.name} onChange={set('name')} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Servings</label><input className="input" placeholder="e.g. 4" value={active.servings} onChange={set('servings')} /></div>
            <div><label className="label">Prep time</label><input className="input" placeholder="e.g. 15 min" value={active.prep_time} onChange={set('prep_time')} /></div>
            <div><label className="label">Cook time</label><input className="input" placeholder="e.g. 45 min" value={active.cook_time} onChange={set('cook_time')} /></div>
          </div>
          <div><label className="label">Ingredients (one per line)</label><textarea className="input resize-none" rows={5} placeholder={"2 cups flour\n1 tsp salt\n…"} value={active.ingredients} onChange={set('ingredients')} /></div>
          <div><label className="label">Instructions</label><textarea className="input resize-none" rows={5} placeholder="Step-by-step instructions…" value={active.instructions} onChange={set('instructions')} /></div>
          <div><label className="label">Notes</label><textarea className="input resize-none" rows={2} placeholder="Tips, variations, storage…" value={active.notes} onChange={set('notes')} /></div>
          {cards.length > 1 && (
            <button onClick={() => deleteCard(activeIdx)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><Trash2 size={12} /> Remove this card</button>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-ink mb-3 font-serif no-print">Preview</h3>
        <div className="space-y-4">
          {cards.map((card, i) => (
            <div key={i} className="print-label bg-parchment border-2 border-dashed border-terra-300 rounded-xl p-5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-terra-200">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-6 h-6 rounded-full bg-moss-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">K</span>
                    </div>
                    <span className="text-xs font-semibold text-moss-700 uppercase tracking-widest">Recipe Card</span>
                  </div>
                  <h2 className="text-xl font-bold text-ink mt-1">{card.name || 'Recipe Name'}</h2>
                </div>
                <div className="text-right text-xs text-slate-500 space-y-0.5">
                  {card.servings && <p>Serves {card.servings}</p>}
                  {card.prep_time && <p>Prep: {card.prep_time}</p>}
                  {card.cook_time && <p>Cook: {card.cook_time}</p>}
                </div>
              </div>
              {card.ingredients && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-terra-800 uppercase tracking-wider mb-1.5">Ingredients</p>
                  <ul className="space-y-0.5">
                    {card.ingredients.split('\n').filter(l => l.trim()).map((line, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs text-ink"><span className="text-terra-400 mt-0.5">•</span>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
              {card.instructions && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-terra-800 uppercase tracking-wider mb-1.5">Instructions</p>
                  <p className="text-xs text-ink leading-relaxed whitespace-pre-line">{card.instructions}</p>
                </div>
              )}
              {card.notes && <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2">{card.notes}</p>}
              <p className="text-xs text-slate-300 mt-3 text-center tracking-widest">— Krystle's Cottage —</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN: Print Center
// ─────────────────────────────────────────────

export default function Labels() {
  const [printType, setPrintType] = useState('labels')

  const active = PRINT_TYPES.find(t => t.id === printType)
  const ActiveIcon = active?.icon || Tag

  return (
    <div className="max-w-5xl mx-auto">
      <div className="section-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-parchment border border-terra-200 flex items-center justify-center">
            <Printer size={20} className="text-terra-500" />
          </div>
          <div>
            <h1 className="page-title">Print Center</h1>
            <p className="text-sm text-slate-500">Print menus, shopping lists, meal cards, bag labels, and more</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="btn-terra flex items-center gap-2 no-print">
          <Printer size={16} /> Print
        </button>
      </div>

      {/* Print type selector */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {PRINT_TYPES.map(type => {
          const Icon = type.icon
          const isActive = printType === type.id
          return (
            <button key={type.id} onClick={() => setPrintType(type.id)}
              className={`card text-left transition-all border-2 ${isActive ? 'border-moss-500 bg-moss-50' : 'border-transparent hover:border-terra-200'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${isActive ? 'bg-moss-500' : 'bg-parchment border border-terra-200'}`}>
                <Icon size={16} className={isActive ? 'text-white' : 'text-terra-500'} />
              </div>
              <p className={`text-sm font-semibold font-serif ${isActive ? 'text-moss-700' : 'text-ink'}`}>{type.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{type.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Active print type */}
      {printType === 'labels'   && <BagLabels />}
      {printType === 'menu'     && <WeeklyMenu />}
      {printType === 'shopping' && <ShoppingList />}
      {printType === 'cards'    && <MealCards />}
    </div>
  )
}
