// The Pantry page (also the Pantry / Refrigerator / Freezer, Shopping and Bulk Buy pages).
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LOCATION_TITLES, NoGroup } from './shared'
import { ShoppingListTab } from './ShoppingListTab'
import { InventoryTab } from './InventoryTab'
import { VacuumSealTab } from './VacuumSealTab'
import { BulkBuyTab } from './BulkBuyTab'

const TABS = ['Shopping', 'Inventory', 'Vacuum Seal', 'Bulk Buy']

// Each tab is its own file in this folder and loads its own data, so work on one
// tab never touches another.
export default function Pantry({ locationFilter, defaultTab }) {
  const { user } = useAuth()
  const initialTab = defaultTab ? Math.max(0, TABS.indexOf(defaultTab)) : 0
  const [tab, setTab] = useState(initialTab)

  const activeGroup = user?.groups?.[0]
  const gid = activeGroup?.id

  if (!activeGroup) return <NoGroup />

  const pageTitle = locationFilter ? LOCATION_TITLES[locationFilter] || locationFilter : 'Pantry'

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 overflow-x-hidden">
      <h1 className="text-xl md:text-2xl font-serif text-ink font-semibold">{pageTitle}</h1>

      {/* Hide tab bar when a location filter is active — jump straight to inventory */}
      {!locationFilter && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 whitespace-nowrap ${
                tab === i ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {locationFilter ? (
        <InventoryTab gid={gid} locationFilter={locationFilter} />
      ) : (
        <>
          {tab === 0 && <ShoppingListTab gid={gid} />}
          {tab === 1 && <InventoryTab gid={gid} />}
          {tab === 2 && <VacuumSealTab gid={gid} />}
          {tab === 3 && <BulkBuyTab gid={gid} />}
        </>
      )}
    </div>
  )
}
