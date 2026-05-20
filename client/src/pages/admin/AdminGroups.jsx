import { useEffect, useState } from 'react'
import api from '../../api'
import { useTwoFactor } from '../../hooks/useTwoFactor'

const planBadge = (plan) => plan === 'pro'
  ? <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-moss-100 text-moss-700">PRO</span>
  : <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">FREE</span>

export default function AdminGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useTwoFactor()

  useEffect(() => {
    api.get('/admin/groups', { headers: { 'x-2fa-token': getToken('login') || '' } })
      .then(r => setGroups(r.data.groups))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-xl font-serif font-semibold text-ink mb-6">
        Groups <span className="text-slate-400 text-base font-sans font-normal">({groups.length})</span>
      </h1>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-400">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No groups yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Group Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Owner</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Plan</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Members</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Invite Code</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">{g.name}</td>
                  <td className="px-4 py-3">
                    <p className="text-ink font-medium">{g.owner_name}</p>
                    <p className="text-xs text-slate-400">{g.owner_email}</p>
                  </td>
                  <td className="px-4 py-3">{planBadge(g.owner_plan)}</td>
                  <td className="px-4 py-3 text-slate-600">{g.member_count}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{g.invite_code}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(g.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
