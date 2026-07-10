import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, UserPlus, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { currentMonthPeriod, formatMonthPeriod, formatCurrency } from '../../lib/format'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import LeaveCalendar from '../../components/LeaveCalendar'
import {
  PLAN_LABELS,
  LEAVE_TYPE_LABELS,
  JUSTIFICATION_REQUIRED_TYPES,
  type Cabinet,
  type PayrollVariable,
  type Profile,
  type LeaveRequest,
  type DocumentType,
  type Role,
} from '../../lib/database.types'

async function openJustification(path: string) {
  const { data } = await supabase.storage.from('justificatifs').createSignedUrl(path, 60)
  if (data?.signedUrl) window.open(data.signedUrl, '_blank')
}

const period = currentMonthPeriod()

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin Elodiatech',
  employer: 'Médecin employeur',
  employee: 'Assistante médicale',
}

export default function CabinetDetail() {
  const { id } = useParams<{ id: string }>()
  const [cabinet, setCabinet] = useState<Cabinet | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [variables, setVariables] = useState<PayrollVariable[]>([])
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  const employees = members.filter((m) => m.role === 'employee')

  const [employeeId, setEmployeeId] = useState('')
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState<DocumentType>('fiche_de_paie')
  const [docUrl, setDocUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const [memberEmail, setMemberEmail] = useState('')
  const [memberFirstName, setMemberFirstName] = useState('')
  const [memberLastName, setMemberLastName] = useState('')
  const [memberRole, setMemberRole] = useState<Role>('employee')
  const [memberSaving, setMemberSaving] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)

  async function load() {
    if (!id) return
    const [{ data: cab }, { data: mem }, { data: vars }, { data: lvs }] = await Promise.all([
      supabase.from('cabinets').select('*').eq('id', id).single(),
      supabase.from('profiles').select('*').eq('cabinet_id', id),
      supabase.from('payroll_variables').select('*').eq('cabinet_id', id).eq('month_period', period),
      supabase.from('leave_requests').select('*').eq('cabinet_id', id).order('start_date', { ascending: false }).limit(50),
    ])
    setCabinet(cab as Cabinet)
    setMembers((mem as Profile[]) ?? [])
    setVariables((vars as PayrollVariable[]) ?? [])
    setLeaves((lvs as LeaveRequest[]) ?? [])
    setLoading(false)
  }

  async function assignMember(e: FormEvent) {
    e.preventDefault()
    if (!id || !memberEmail.trim()) return
    setMemberSaving(true)
    setMemberError(null)
    const { data, error } = await supabase
      .from('profiles')
      .update({
        cabinet_id: id,
        role: memberRole,
        first_name: memberFirstName.trim() || undefined,
        last_name: memberLastName.trim() || undefined,
      })
      .eq('email', memberEmail.trim())
      .select()

    setMemberSaving(false)
    if (error) {
      setMemberError(error.message)
      return
    }
    if (!data || data.length === 0) {
      setMemberError(
        "Aucun compte trouvé avec cet e-mail. Créez-le d'abord dans Supabase (Authentication > Users), puis réessayez.",
      )
      return
    }
    setMemberEmail('')
    setMemberFirstName('')
    setMemberLastName('')
    await load()
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function exportCsv() {
    const byEmployee = new Map(employees.map((e) => [e.id, e]))
    const header = ['nom', 'prenom', 'nir', 'mois', 'heures_sup_25', 'heures_sup_50', 'indemnites_km', 'primes']
    const rows = variables.map((v) => {
      const emp = byEmployee.get(v.employee_id)
      return [
        emp?.last_name ?? '',
        emp?.first_name ?? '',
        emp?.nir ?? '',
        v.month_period,
        v.overtime_hours_25,
        v.overtime_hours_50,
        v.kilometric_expenses,
        v.bonus_amount,
      ].join(';')
    })
    const csv = [header.join(';'), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `variables_${id}_${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function validateJustification(leaveId: string) {
    await supabase.from('leave_requests').update({ justification_validated: true }).eq('id', leaveId)
    await load()
  }

  async function addDocument(e: FormEvent) {
    e.preventDefault()
    if (!id || !docName || !docUrl) return
    setSaving(true)
    await supabase.from('documents').insert({
      cabinet_id: id,
      employee_id: employeeId || null,
      document_name: docName,
      document_type: docType,
      macompta_paie_url: docUrl,
      period,
    })
    setDocName('')
    setDocUrl('')
    setEmployeeId('')
    setSaving(false)
    await load()
  }

  if (loading || !cabinet) return <p className="text-sm text-slate-500">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Retour
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{cabinet.name}</h1>
            <p className="text-sm text-slate-500">
              {PLAN_LABELS[cabinet.plan]} · {employees.length} salarié(s)
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/cabinets/${id}/modifier`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Modifier
            </Link>
            <Link
              to={`/cabinets/${id}/portails`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Portails & coffre-fort
            </Link>
            <Link
              to={`/cabinets/${id}/messagerie`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Messagerie
            </Link>
          </div>
        </div>
      </div>

      <Card title="Membres du cabinet">
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun membre affecté à ce cabinet pour le moment.</p>
        ) : (
          <div className="mb-4 flex flex-col divide-y divide-slate-100">
            {members.map((m) => (
              <Link
                key={m.id}
                to={`/cabinets/${id}/membres/${m.id}`}
                className="flex items-center justify-between py-2.5 text-sm hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {m.first_name} {m.last_name}
                  </p>
                  <p className="text-slate-500">{m.email}</p>
                </div>
                <span className="text-xs font-medium text-slate-500">{ROLE_LABELS[m.role]}</span>
              </Link>
            ))}
          </div>
        )}

        <form onSubmit={assignMember} className="flex flex-col gap-4 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Affecter un compte déjà créé dans Supabase (Authentication &gt; Users) à ce cabinet.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">E-mail du compte</label>
            <input
              type="email"
              required
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="assistante@cabinet.fr"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Prénom</label>
              <input
                type="text"
                value={memberFirstName}
                onChange={(e) => setMemberFirstName(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Nom</label>
              <input
                type="text"
                value={memberLastName}
                onChange={(e) => setMemberLastName(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Rôle</label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as Role)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="employee">Assistante médicale</option>
              <option value="employer">Médecin employeur</option>
            </select>
          </div>

          {memberError && <p className="text-sm text-red-600">{memberError}</p>}

          <button
            type="submit"
            disabled={memberSaving}
            className="flex w-fit items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <UserPlus size={16} /> Affecter au cabinet
          </button>
        </form>
      </Card>

      <Card
        title={`Variables — ${formatMonthPeriod(period)}`}
        action={
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download size={14} /> Export CSV macompta.fr
          </button>
        }
      >
        {variables.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune variable saisie pour ce mois.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {variables.map((v) => {
              const emp = employees.find((e) => e.id === v.employee_id)
              return (
                <div key={v.id} className="flex flex-col gap-1 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">
                      {emp?.first_name} {emp?.last_name}
                    </p>
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 text-sm text-slate-600 sm:grid-cols-4">
                    <span>HS 25% : {v.overtime_hours_25} h</span>
                    <span>HS 50% : {v.overtime_hours_50} h</span>
                    <span>Km : {formatCurrency(v.kilometric_expenses)}</span>
                    <span>Primes : {formatCurrency(v.bonus_amount)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card title="Congés">
        <LeaveCalendar leaves={leaves} employees={new Map(members.map((m) => [m.id, m]))} />
      </Card>

      <Card title="Congés récents">
        {leaves.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune demande récente.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {leaves.map((l) => {
              const emp = employees.find((e) => e.id === l.employee_id)
              const needsJustification = JUSTIFICATION_REQUIRED_TYPES.includes(l.leave_type)
              return (
                <div key={l.id} className="flex flex-col gap-1.5 py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">
                      {emp?.first_name} {emp?.last_name} — {LEAVE_TYPE_LABELS[l.leave_type]} —{' '}
                      {l.start_date} → {l.end_date}
                    </span>
                    <StatusBadge status={l.status} />
                  </div>
                  {needsJustification && (
                    <div className="flex items-center gap-3">
                      {l.justification_document_url ? (
                        <>
                          <button
                            onClick={() => openJustification(l.justification_document_url!)}
                            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                          >
                            Voir le justificatif <ExternalLink size={12} />
                          </button>
                          {l.justification_validated ? (
                            <span className="text-xs font-medium text-brand-700">Validé</span>
                          ) : (
                            <button
                              onClick={() => validateJustification(l.id)}
                              className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                            >
                              Valider le justificatif
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs font-medium text-red-600">Justificatif manquant</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card title="Injecter un lien de document (macompta.fr)">
        <form onSubmit={addDocument} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Salarié (optionnel)</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">— Cabinet entier —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.first_name} {e.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Type de document</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="fiche_de_paie">Fiche de paie</option>
                <option value="justificatif_absence">Justificatif d'absence</option>
                <option value="facture_mensuelle">Facture mensuelle</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Nom du document</label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder={`Bulletin de paie — ${formatMonthPeriod(period)}`}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Lien (macompta.fr / Google Drive)</label>
            <input
              type="url"
              required
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="https://…"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Ajouter le document
          </button>
        </form>
      </Card>
    </div>
  )
}
