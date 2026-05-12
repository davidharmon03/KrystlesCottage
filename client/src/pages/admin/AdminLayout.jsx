import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutDashboard, Users, UsersRound, LogOut, ChefHat } from 'lucide-react'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const nav = [
    { to: '/admin',        label: 'Dashboard',  icon: LayoutDashboard, end: true },
    { to: '/admin/users',  label: 'Users',       icon: Users },
    { to: '/admin/groups', label: 'Groups',      icon: UsersRound },
  ]

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-terra-500 flex items-center justify-center">
              <ChefHat size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-serif font-semibold text-sm leading-tight">Krystle's Cottage</p>
              <p className="text-slate-400 text-[10px]">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={16} className="flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 truncate mb-2">{user?.email}</p>
          <button
            onClick={() => logout().then(() => navigate('/login'))}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Super Admin</p>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
