import { useEffect, useState } from 'react'
import api from '../../api'
import { useTwoFactor } from '../../hooks/useTwoFactor'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'

const roleBadge = (role) => role === 'owner'
  ? <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">OWNER</span>
  : <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">MEMBER</span>

export default function AdminGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const { getToken } = useTwoFactor()

  useEffect(() => {
    api.get('/admin/groups', { headers: { 'x-2fa-token': getToken('login') || '' } })
      .then(r => setGroups(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-serif font-semibold text-ink">Groups</h1>
        {!loading && (
          <span className="px-2.5 py-0.5 rounded-full text-sm font-semibold bg-slate-100 text-slate-600">
            {groups.length}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-slate-400">No groups yet.</p>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Card header — click to expand */}
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(expanded === g.id ? null : g.id)}
              >
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
                  {/* Group name + invite code */}
                  <div>
                    <p className="font-semibold text-ink truncate">{g.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{g.invite_code}</p>
                  </div>
                  {/* Owner */}
                  <div>
                    <p className="text-sm text-slate-700 font-medium truncate">{g.owner_name}</p>
                    <p className="text-xs text-slate-400 truncate">{g.owner_email}</p>
                  </div>
                  {/* Member count */}
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-600">
                      {g.member_count} / {g.max_members} members
                    </span>
                  </div>
                  {/* Created date */}
                  <p className="text-xs text-slate-400">
                    {new Date(g.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-shrink-0 text-slate-400">
                  {expanded === g.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Expanded member list */}
              {expanded === g.id && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                  {g.members.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Empty group</p>
                  ) : (
                    <div className="space-y-2.5">
                      {g.members.map(m => (
                        <div key={m.id} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-moss-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-moss-700 font-semibold text-xs">{m.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-medium text-ink">{m.name}</span>
                          <span className="text-sm text-slate-400">{m.email}</span>
                          {roleBadge(m.group_role)}
                          <span className="text-xs text-slate-400 ml-auto">
                            Joined {new Date(m.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
