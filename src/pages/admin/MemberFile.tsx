import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import Card from '../../components/Card'
import type { Profile } from '../../lib/database.types'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin Elodiatech',
  employer: 'Médecin employeur',
  employee: 'Assistante médicale',
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">
        {value === null || value === undefined || value === '' ? '—' : value}
      </span>
    </div>
  )
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

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>
  if (!member) return <p className="text-sm text-slate-500">Membre introuvable.</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={id ? `/cabinets/${id}` : '/'}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Retour au cabinet
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">
          {member.first_name} {member.last_name}
        </h1>
        <p className="text-sm text-slate-500">
          {ROLE_LABELS[member.role]} · {member.email}
        </p>
      </div>

      <Card title="État civil">
        <div className="flex flex-col divide-y divide-slate-100">
          <Row label="Nom de naissance" value={member.birth_name} />
          <Row label="Date de naissance" value={safeDate(member.birth_date)} />
          <Row label="Lieu de naissance" value={member.birth_place} />
          <Row label="Sexe" value={member.gender === 'homme' ? 'Homme' : member.gender === 'femme' ? 'Femme' : null} />
          <Row label="Adresse" value={member.address} />
          <Row label="NIR" value={member.nir} />
          <Row label="NTT" value={member.ntt} />
          <Row label="Téléphone" value={member.phone} />
          <Row label="RIB (IBAN)" value={member.iban} />
        </div>
      </Card>

      <Card title="Contrat de travail">
        <div className="flex flex-col divide-y divide-slate-100">
          <Row label="Poste / qualification" value={member.position_title} />
          <Row label="Coefficient / niveau" value={member.coefficient} />
          <Row label="Type de contrat" value={member.contract_type?.toUpperCase()} />
          <Row
            label="Temps de travail"
            value={
              member.work_time_type === 'temps_plein'
                ? 'Temps plein'
                : member.work_time_type === 'temps_partiel'
                  ? 'Temps partiel'
                  : null
            }
          />
          <Row label="Heures par semaine" value={member.weekly_hours} />
          <Row label="Salaire de base" value={member.base_salary ? `${member.base_salary} €` : null} />
          <Row label="Date d'embauche" value={safeDate(member.hire_date)} />
          <Row label="Date de fin (CDD)" value={safeDate(member.contract_end_date)} />
          <Row label="Fin de période d'essai" value={safeDate(member.trial_period_end)} />
          <Row label="Numéro de contrat" value={member.contract_number} />
        </div>
      </Card>

      <Card title="Congés payés">
        <div className="flex flex-col divide-y divide-slate-100">
          <Row label="Solde acquis" value={member.paid_leave_acquired != null ? `${member.paid_leave_acquired} j` : null} />
          <Row label="Solde pris" value={member.paid_leave_taken != null ? `${member.paid_leave_taken} j` : null} />
        </div>
      </Card>

      <Card title="Fiscalité — Prélèvement à la source">
        <div className="flex flex-col divide-y divide-slate-100">
          <Row label="Taux" value={member.pas_rate != null ? `${member.pas_rate} %` : null} />
          <Row label="Type de taux" value={member.pas_rate_type} />
          <Row label="Date de début" value={safeDate(member.pas_start_date)} />
        </div>
      </Card>

      <Card title="Protection sociale">
        <div className="flex flex-col divide-y divide-slate-100">
          <Row label="Mutuelle" value={member.mutuelle_affiliated ? 'Affilié(e)' : 'Non affilié(e)'} />
          <Row label="Date d'affiliation mutuelle" value={safeDate(member.mutuelle_date)} />
          <Row label="Régime mutuelle" value={member.mutuelle_regime} />
          <Row label="Motif de dispense" value={member.mutuelle_waiver_reason} />
          <Row label="Prévoyance" value={member.prevoyance_affiliated ? 'Affilié(e)' : 'Non affilié(e)'} />
          <Row label="Date d'affiliation prévoyance" value={safeDate(member.prevoyance_date)} />
          <Row label="Catégorie prévoyance" value={member.prevoyance_category} />
          <Row label="Tranche retraite complémentaire" value={member.retirement_tranche} />
        </div>
      </Card>
    </div>
  )
}
