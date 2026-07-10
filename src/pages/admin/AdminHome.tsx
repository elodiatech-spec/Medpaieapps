import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card'
import { PLAN_LABELS, type Cabinet } from '../../lib/database.types'

export default function AdminHome() {
  const [cabinets, setCabinets] = useState<Cabinet[]>([])
  const [headcounts, setHeadcounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: cabinetData } = await supabase
        .from('cabinets')
        .select('*')
        .eq('active', true)
        .order('name')

      const { data: profileData } = await supabase
        .from('profiles')
        .select('cabinet_id, role')
        .eq('role', 'employee')

      const counts: Record<string, number> = {}
      for (const p of profileData ?? []) {
        counts[p.cabinet_id] = (counts[p.cabinet_id] ?? 0) + 1
      }
      setHeadcounts(counts)
      setCabinets((cabinetData as Cabinet[]) ?? [])
      setLoading(false)
    })()
  }, [])

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Pilotage multi-cabinets</h1>
        <p className="text-sm text-slate-500">{cabinets.length} cabinet(s) actif(s)</p>
      </div>

      <div className="flex flex-col gap-3">
        {cabinets.map((cabinet) => (
          <Link
            key={cabinet.id}
            to={`/cabinets/${cabinet.id}`}
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:ring-brand-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Building2 size={18} />
              </div>
              <div>
                <p className="font-medium text-slate-900">{cabinet.name}</p>
                <p className="text-sm text-slate-500">
                  {PLAN_LABELS[cabinet.plan]} · {headcounts[cabinet.id] ?? 0} salarié(s)
                  {cabinet.city ? ` · ${cabinet.city}` : ''}
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400" />
          </Link>
        ))}
        {cabinets.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">Aucun cabinet actif pour le moment.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
