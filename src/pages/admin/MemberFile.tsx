import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import Card from '../../components/Card'
import InfoRow from '../../components/InfoRow'
import EmployeeContractForm from '../../components/EmployeeContractForm'
import type { Profile } from '../../lib/database.types'

function StatusToggle({ member, onChanged }: { member: Profile; onChanged: (m: Profile) => void }) {
  const [saving, setSaving] = useState(false)

  async function toggle() {
    setSaving(true)
    const { data } = await supabase
      .from('profiles')
      .update({ active: !member.active })
      .eq('id', member.id)
      .select()
      .single()
    setSaving(false)
    if (data) onChanged(data as Profile)
  }

  return (
    <Card title="Statut du compte">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${member.active ? 'text-brand-700' : 'text-red-600'}`}>
          {member.active ? 'Compte actif' : 'Compte désactivé'}
        </span>
        <button
          onClick={toggle}
          disabled={saving}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
            member.active
              ? 'border border-red-200 text-red-600 hover:bg-red-50'
              : 'bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] text-white hover:bg-brand-700'
          }`}
        >
          {member.active ? 'Désactiver ce compte' : 'Réactiver ce compte'}
        </button>
      </div>
      {member.active === false && (
        <p className="mt-2 text-xs text-slate-600">
          Ce compte ne peut plus se connecter à MedPaie et n'est plus compté dans les effectifs
          facturés.
        </p>
      )}
    </Card>
  )
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin Elodiatech',
  employer: 'Médecin employeur',
  employee: 'Assistante médicale',
}

function safeDate(d: string | null): string | null {
  return d ? formatDate(d) : null
}

export default function MemberFile() {
  const { memberId, id } = useParams<{ memberId: string; id: string }>()
  const [member, setMember] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!memberId) return
    ;(async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', memberId).single()
      setMember(data as Profile | null)
      setLoading(false)
    })()
  }, [memberId])

  if (loading) return <p className="text-sm text-slate-600">Chargement…</p>
  if (!member) return <p className="text-sm text-slate-600">Membre introuvable.</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={id ? `/cabinets/${id}` : '/'}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Retour au cabinet
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">
          {member.first_name} {member.last_name}
        </h1>
        <p className="text-sm text-slate-600">
          {ROLE_LABELS[member.role]} · {member.email}
        </p>
      </div>

      {member.role !== 'admin' && <StatusToggle member={member} onChanged={setMember} />}

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

      {member.role !== 'admin' && <EmployeeContractForm member={member} onSaved={setMember} />}
    </div>
  )
}
