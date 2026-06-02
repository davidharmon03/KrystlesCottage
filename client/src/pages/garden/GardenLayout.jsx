import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { label: 'Plots',         to: '/garden/plots' },
  { label: 'Plants',        to: '/garden/plants' },
  { label: 'Harvest Log',   to: '/garden/harvest' },
  { label: 'Calendar',      to: '/garden/calendar' },
  { label: 'Growing Guides',to: '/garden/guides' },
]

export default function GardenLayout() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-800 mb-4">🌱 Garden</h1>
      <nav className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
        {tabs.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `px-4 py-2 rounded-t text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-700 text-white'
                  : 'text-green-800 hover:bg-green-100'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
