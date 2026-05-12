import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { Users, CreditCard, UserCheck, UsersRound, TrendingUp, UserPlus } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color = 'text-moss-600', bg = 'bg-moss-50', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all' : ''}`}
    >
      <div className={`w-11 h-11 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{value ?? '—'}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div>
      <h1 className="text-xl font-serif font-semibold text-ink mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users}      label="Total Users"    value={stats?.totalUsers}   color="text-slate-600" bg="bg-slate-100" onClick={() => navigate('/admin/users?plan=all')} />
        <StatCard icon={CreditCard} label="Paid (Pro)"     value={stats?.paidUsers}    color="text-moss-600"  bg="bg-moss-50"   onClick={() => navigate('/admin/users?plan=pro')} />
        <StatCard icon={UserCheck}  label="Free Users"     value={stats?.freeUsers}    color="text-slate-500" bg="bg-slate-50"  onClick={() => navigate('/admin/users?plan=free')} />
        <StatCard icon={UsersRound} label="Active Groups"  value={stats?.totalGroups}  color="text-terra-500" bg="bg-terra-50"  onClick={() => navigate('/admin/groups')} />
        <StatCard icon={TrendingUp} label="Group Members"  value={stats?.totalMembers} color="text-moss-600"  bg="bg-moss-50"   onClick={() => navigate('/admin/groups')} />
        <StatCard icon={UserPlus}   label="New This Week"  value={stats?.newThisWeek}  color="text-terra-500" bg="bg-terra-50" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-ink mb-1">Quick overview</h2>
        <p className="text-sm text-slate-500">
          {stats?.paidUsers} paying customer{stats?.paidUsers !== 1 ? 's' : ''} with{' '}
          {stats?.totalGroups} group{stats?.totalGroups !== 1 ? 's' : ''} and{' '}
          {stats?.totalMembers} total member{stats?.totalMembers !== 1 ? 's' : ''}.
          {' '}{stats?.freeUsers} user{stats?.freeUsers !== 1 ? 's are' : ' is'} on the free tier.
        </p>
      </div>
    </div>
  )
}
