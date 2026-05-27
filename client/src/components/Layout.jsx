import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import {
  ChefHat, DollarSign, Package, Leaf, LayoutDashboard,
  LogOut, Menu, X, Wrench, Camera, ArrowLeftRight, HelpCircle, Lightbulb, ShoppingBag, MessageSquare,
  RefreshCw, WifiOff, Clock, ShieldCheck, FileText, Printer,
  ChevronDown, ChevronRight, ShoppingCart, Users, Snowflake, Thermometer, Layers
} from 'lucide-react'
import { firstName } from '../utils/userName'
import NotificationBell from './NotificationBell'
import InstallPrompt from './InstallPrompt'

function relativeTime(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)  return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24)   return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function SyncBadge({ onLinkClick }) {
  const { syncMode, syncStatus, lastSyncedAt, pendingCount, syncNow } = useSync()

  const statusConfig = {
    synced:  { dot: 'bg-moss-400',   label: 'Synced',      icon: null },
    pending: { dot: 'bg-amber-400',  label: 'Pending',     icon: null },
    offline: { dot: 'bg-red-400',    label: 'Offline',     icon: WifiOff },
    syncing: { dot: 'bg-blue-400 animate-pulse', label: 'Syncing…', icon: null },
  }
  const cfg = statusConfig[syncStatus] || statusConfig.synced
  const ts  = relativeTime(lastSyncedAt)

  return (
    <div className="mx-3 mb-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <span className="text-xs font-medium text-slate-600 truncate">{cfg.label}</span>
          {ts && <span className="text-[10px] text-slate-400 truncate hidden sm:inline">{ts}</span>}
        </div>
        {syncMode === 'manual' ? (
          <button
            onClick={() => { syncNow(); onLinkClick?.() }}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-1 text-[10px] font-semibold text-moss-600 hover:text-moss-800 disabled:opacity-40 flex-shrink-0"
          >
            <RefreshCw size={10} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            {pendingCount > 0 ? `Sync (${pendingCount})` : 'Sync Now'}
          </button>
        ) : (
          <Clock size={11} className="text-slate-300 flex-shrink-0" />
        )}
      </div>
    </div>
  )
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function AvatarCircle({ user, size = 'md' }) {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }
  const sz = sizes[size] || sizes.md
  if (user?.avatar_path) {
    return (
      <img
        src={`${API_BASE}/uploads/avatars/${user.avatar_path.split('/').pop()}`}
        alt={user.name}
        className={`${sz} rounded-full object-cover flex-shrink-0`}
        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling?.style?.removeProperty('display') }}
      />
    )
  }
  return (
    <div className={`${sz} rounded-full bg-terra-100 flex items-center justify-center flex-shrink-0`}>
      <span className="text-terra-600 font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
    </div>
  )
}

export { AvatarCircle }

// ── Nav group definitions ──────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    key: 'kitchen',
    label: 'Kitchen',
    links: [
      { to: '/kitchen',     label: 'Recipe Library', icon: ChefHat,        color: 'text-terra-500' },
      { to: '/orders',      label: 'Menus & Orders', icon: ShoppingBag,    color: 'text-moss-600'  },
      { to: '/swap',        label: 'Meal Swap',      icon: ArrowLeftRight, color: 'text-moss-600'  },
      { to: '/gallery',     label: 'Meal Gallery',   icon: Camera,         color: 'text-terra-400' },
      { to: '/suggestions', label: 'Suggestions',    icon: Lightbulb,      color: 'text-terra-400' },
      { to: '/equipment',   label: 'Equipment',      icon: Wrench,         color: 'text-terra-400' },
    ],
  },
  {
    key: 'storage',
    label: 'Storage',
    links: [
      { to: '/storage/pantry',       label: 'Pantry',        icon: Package,      color: 'text-terra-500' },
      { to: '/storage/refrigerator', label: 'Refrigerator',  icon: Thermometer,  color: 'text-blue-500'  },
      { to: '/storage/freezer',      label: 'Freezer',       icon: Snowflake,    color: 'text-blue-400'  },
      { to: '/storage/shopping',     label: 'Shopping List', icon: ShoppingCart, color: 'text-moss-600'  },
      { to: '/storage/bulk-buy',     label: 'Bulk Buy Runs', icon: Layers,       color: 'text-moss-500'  },
      { to: '/labels',               label: 'Print Center',  icon: Printer,      color: 'text-slate-400' },
    ],
  },
  {
    key: 'community',
    label: 'Community',
    links: [
      { to: '/chat',         label: 'Group Chat',        icon: MessageSquare, color: 'text-moss-500'  },
      { to: '/corner',       label: 'Corner / Finances', icon: DollarSign,    color: 'text-moss-600'  },
      { to: '/cottage-laws', label: 'Cottage Laws',      icon: FileText,      color: 'text-slate-500' },
      { to: '/garden',       label: 'Garden',            icon: Leaf,          color: 'text-moss-500'  },
    ],
  },
]

const ADMIN_LINKS = [
  { to: '/admin/users',  label: 'Users',     icon: Users,           color: 'text-terra-500' },
  { to: '/admin/groups', label: 'Groups',    icon: Users,           color: 'text-terra-400' },
  { to: '/admin',        label: 'Dashboard', icon: LayoutDashboard, color: 'text-terra-600', end: true },
]

const DEFAULT_NAV_STATE = { kitchen: true, storage: true, community: true, admin: true }

function getNavState() {
  try {
    const stored = localStorage.getItem('cottage_nav_state')
    return stored ? { ...DEFAULT_NAV_STATE, ...JSON.parse(stored) } : DEFAULT_NAV_STATE
  } catch {
    return DEFAULT_NAV_STATE
  }
}

export default function Layout() {
  const { user, logout } = useAuth()
  const fn = firstName(user)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const activeGroup = user?.groups?.[0]
  const isAdmin = ['admin', 'superadmin'].includes(user?.role)

  const [navOpen, setNavOpen] = useState(getNavState)

  const toggleGroup = (key) => {
    setNavOpen(prev => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem('cottage_nav_state', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const closeDrawer = () => setDrawerOpen(false)

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-moss-50 text-moss-700' : 'text-slate-600 hover:bg-slate-50'}`

  const GroupHeader = ({ groupKey, label }) => (
    <button
      onClick={() => toggleGroup(groupKey)}
      className="w-full flex items-center justify-between px-3 py-1.5 mt-3 mb-0.5 rounded-lg hover:bg-slate-50 transition-colors group"
    >
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-500">
        {label}
      </p>
      {navOpen[groupKey]
        ? <ChevronDown size={12} className="text-slate-300 group-hover:text-slate-400" />
        : <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-400" />}
    </button>
  )

  // Shared nav content — used by both desktop sidebar and mobile drawer
  const renderNav = (onLinkClick) => (
    <>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Dashboard — always visible */}
        <NavLink to="/" end onClick={onLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-moss-50 text-moss-700' : 'text-slate-600 hover:bg-slate-50'}`}>
          <LayoutDashboard size={17} className="flex-shrink-0" />
          Dashboard
        </NavLink>

        {/* Collapsible groups */}
        {NAV_GROUPS.map(group => (
          <div key={group.key}>
            <GroupHeader groupKey={group.key} label={group.label} />
            {navOpen[group.key] && (
              <div className="space-y-0.5">
                {group.links.map(ch => (
                  <NavLink key={ch.to} to={ch.to} end={ch.end} onClick={onLinkClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-moss-50 text-moss-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <ch.icon size={16} className={`flex-shrink-0 ${ch.color}`} />
                    <span className="truncate">{ch.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Admin Panel — conditional */}
        {isAdmin && (
          <div>
            <GroupHeader groupKey="admin" label="Admin Panel" />
            {navOpen.admin && (
              <div className="space-y-0.5">
                {ADMIN_LINKS.map(ch => (
                  <NavLink key={ch.to} to={ch.to} end={ch.end} onClick={onLinkClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-terra-50 text-terra-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <ch.icon size={16} className={`flex-shrink-0 ${ch.color}`} />
                    <span className="truncate">{ch.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {activeGroup && (
        <div className="px-4 py-3 border-t border-slate-100 bg-moss-50">
          <p className="text-xs text-slate-500 font-medium">Active Group</p>
          <p className="text-sm font-semibold text-moss-700 truncate">{activeGroup.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">Code: <span className="font-mono font-semibold">{activeGroup.invite_code}</span></p>
        </div>
      )}

      <SyncBadge onLinkClick={onLinkClick} />

      <div className="px-4 py-2 border-t border-slate-100 space-y-0.5">
        <NavLink to="/help" onClick={onLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive ? 'text-moss-700 bg-moss-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
          <HelpCircle size={14} />
          Help & Guide
        </NavLink>
        <button
          onClick={() => logout().then(() => navigate('/login'))}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      <div className="px-4 py-4 border-t border-slate-100 flex items-center gap-3">
        <Link to="/profile" onClick={onLinkClick}
          className="flex items-center gap-3 flex-1 min-w-0 group">
          <AvatarCircle user={user} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate group-hover:text-moss-700 transition-colors">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">Edit profile</p>
          </div>
        </Link>
      </div>

      <div className="px-4 pb-3 text-center">
        <p className="text-[10px] text-slate-300">Krystle's Cottage v1.0.0</p>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-cream overflow-x-hidden">

      {/* ── Desktop sidebar — hidden on mobile ── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 flex-shrink-0">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-moss-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-serif font-bold text-lg leading-none">{fn[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-serif font-semibold text-ink text-sm leading-tight">{f