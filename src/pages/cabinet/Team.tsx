import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, IdCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/Card'
import type { Profile } from '../../lib/database.types'

export default function Team() {
  const { profile } = useAuth()
  const [employees, setEmployees] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('cabinet_id', profile.cabinet_id)
        .eq('role', 'employee')
        .order('first_name')
      setEmployees((data as Profile[]) ?? [])
      setLoading(false)
    })()
  }, [profile])

  if (loading) return <p className="text-sm text-slate-600">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Mon équipe</h1>
        <p className="text-sm text-slate-600">
          Contrat de travail, congés payés, fiscalité et protection sociale de tes salariés.
        </p>
      </div>

      <Card>
        {employees.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun salarié affecté à ton cabinet pour le moment.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {employees.map((e) => (
              <Link
                key={e.id}
                to={`/equipe/${e.id}`}
                className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <IdCard size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {e.first_name} {e.last_name}
                      {!e.active && (
                        <span className="ml-2 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                          Désactivé
                        </span>
                      )}
                    </p>
                    <p className="text-slate-600">{e.position_title || e.email}</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
