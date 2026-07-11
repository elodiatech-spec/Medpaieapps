import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import Card from '../../components/Card'
import InfoRow from '../../components/InfoRow'
import EmployeeContractForm from '../../components/EmployeeContractForm'
import type { Profile } from '../../lib/database.types'

function safeDate(d: string | null): string | null {
  return d ? formatDate(d) : null
}

export default function TeamMemberFile() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const [member, setMember] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employeeId) return
    ;(async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', employeeId).single()
      setMember(data as Profile | null)
      setLoading(false)
    })()
  }, [employeeId])

  if (loading) return <p className="text-sm text-slate-600">Chargement…</p>
  if (!member) return <p className="text-sm text-slate-600">Salarié introuvable.</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/equipe"
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Retour à l'équipe
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">
          {member.first_name} {member.last_name}
        </h1>
        <p className="text-sm text-slate-600">{member.email}</p>
      </div>

      <Card title="État civil">
        <p className="mb-3 text-xs text-slate-500">Renseigné par le salarié lui-même dans "Mon dossier".</p>
        <div className="flex flex-col divide-y divide-slate-100">
          <InfoRow label="Nom de naissance" value={member.birth_name} />
          <InfoRow label="Date de naissance" value={safeDate(member.birth_date)} />
          <InfoRow label="Lieu de naissance" value={member.birth_place} />
          <InfoRow label="Sexe" value={member.gender === 'homme' ? 'Homme' : member.gender === 'femme' ? 'Femme' : null} />
          <InfoRow label="Adresse" value={member.address} />
          <InfoRow label="NIR" value={member.nir} />
          <InfoRow label="NTT" value={member.ntt} />
          <InfoRow label="Téléphone" value={member.phone} />
          <InfoRow label="RIB (IBAN)" value={member.iban} />
        </div>
      </Card>

      <EmployeeContractForm member={member} onSaved={setMember} />
    </div>
  )
}
