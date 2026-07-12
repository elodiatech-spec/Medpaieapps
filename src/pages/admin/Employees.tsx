import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card'
import type { Cabinet, Profile } from '../../lib/database.types'

type RoleFilter = 'all' | 'employee' | 'employer'

export default function Employees() {
  const [members, setMembers] = useState<Profile[]>([])
  const [cabinets, setCabinets] = useState<Map<string, Cabinet>>(new Map())
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

  useEffect(() => {
    ;(async () => {
      const [{ data: profiles }, { data: cabinetData }] = await Promise.all([
        supabase.from('profiles').select('*').in('role', ['employee', 'employer']).neq('cabinet_id', 'a-affecter'),
        supabase.from('cabinets').select('*'),
      ])
      setMembers((profiles as Profile[]) ?? [])
      setCabinets(new Map(((cabinetData as Cabinet[]) ?? []).map((c) => [c.id, c])))
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members
      .filter((m) => roleFilter === 'all' || m.role === roleFilter)
      .filter((m) => {
        if (!q) return true
        const cabinetName = cabinets.get(m.cabinet_id)?.name ?? ''
        return (
          `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          cabinetName.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`))
  }, [members, cabinets, query, roleFilter])

  if (loading) return <p className="text-sm text-slate-600">Chargement…</p>

  function renderRow(m: Profile) {
    return (
      <Link
        key={m.id}
        to={`/cabinets/${m.cabinet_id}/membres/${m.id}`}
        className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-slate-50"
      >
        <div>
          <p className="font-medium text-slate-900">
            {m.first_name} {m.last_name}
            {!m.active && (
              <span className="ml-2 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                Désactivé
              </span>
            )}
          </p>
          <p className="text-slate-600">{m.email}</p>
        </div>
        <p className="shrink-0 text-sm font-medium text-slate-700">
          {cabinets.get(m.cabinet_id)?.name ?? m.cabinet_id}
        </p>
      </Link>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Salariés &amp; médecins</h1>
        <p className="text-sm text-slate-600">
          {members.length} personne(s) au total, tous cabinets confondus.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un nom, un e-mail, un cabinet…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex gap-1.5">
            {(
              [
                ['all', 'Tous'],
                ['employee', 'Assistantes'],
                ['employer', 'Médecins'],
              ] as [RoleFilter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setRoleFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  roleFilter === value
                    ? 'bg-brand-600 text-white shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)]'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">Aucun résultat.</p>
        </Card>
      ) : roleFilter !== 'all' ? (
        <Card>
          <div className="flex flex-col divide-y divide-slate-100">{filtered.map(renderRow)}</div>
        </Card>
      ) : (
        <>
          <Card title={`Médecins employeurs (${filtered.filter((m) => m.role === 'employer').length})`}>
            {filtered.filter((m) => m.role === 'employer').length === 0 ? (
              <p className="text-sm text-slate-600">Aucun résultat.</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {filtered.filter((m) => m.role === 'employer').map(renderRow)}
              </div>
            )}
          </Card>
          <Card title={`Assistantes médicales (${filtered.filter((m) => m.role === 'employee').length})`}>
            {filtered.filter((m) => m.role === 'employee').length === 0 ? (
              <p className="text-sm text-slate-600">Aucun résultat.</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {filtered.filter((m) => m.role === 'employee').map(renderRow)}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
