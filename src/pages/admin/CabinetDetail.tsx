import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Check, Download, FileSpreadsheet, UserPlus, ExternalLink } from 'lucide-react'
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
  type AppDocument,
  type Role,
} from '../../lib/database.types'

interface OnboardingStep {
  label: string
  done: boolean
  to?: string
  linkLabel?: string
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  fiche_de_paie: 'Fiche de paie',
  justificatif_absence: "Justificatif d'absence",
  facture_mensuelle: 'Facture mensuelle',
}

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
  const [portalCount, setPortalCount] = useState(0)
  const [documents, setDocuments] = useState<AppDocument[]>([])
  const [loading, setLoading] = useState(true)

  const employees = members.filter((m) => m.role === 'employee')
  const activeEmployeeCount = employees.filter((m) => m.active).length

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

  const [newEmail, setNewEmail] = useState('')
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newRole, setNewRole] = useState<Role>('employee')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)
  const [showExistingForm, setShowExistingForm] = useState(false)

  async function load() {
    if (!id) return
    const [{ data: cab }, { data: mem }, { data: vars }, { data: lvs }, { count: portals }, { data: docs }] =
      await Promise.all([
        supabase.from('cabinets').select('*').eq('id', id).single(),
        supabase.from('profiles').select('*').eq('cabinet_id', id),
        supabase.from('payroll_variables').select('*').eq('cabinet_id', id).eq('month_period', period),
        supabase.from('leave_requests').select('*').eq('cabinet_id', id).order('start_date', { ascending: false }).limit(50),
        supabase.from('portal_credentials').select('*', { count: 'exact', head: true }).eq('cabinet_id', id),
        supabase.from('documents').select('*').eq('cabinet_id', id).order('created_at', { ascending: false }),
      ])
    setCabinet(cab as Cabinet)
    setMembers((mem as Profile[]) ?? [])
    setVariables((vars as PayrollVariable[]) ?? [])
    setLeaves((lvs as LeaveRequest[]) ?? [])
    setPortalCount(portals ?? 0)
    setDocuments((docs as AppDocument[]) ?? [])
    setLoading(false)
  }

  async function deleteDocument(docId: string) {
    if (!confirm('Supprimer ce document ? Cette action est définitive.')) return
    await supabase.from('documents').delete().eq('id', docId)
    await load()
  }

  async function assignMember(e: FormEvent) {
    e.preventDefault()
    if (!id || !memberEmail.trim()) return
    setMemberSaving(true)
    setMemberError(null)

    // Vérifie d'abord qu'on ne s'apprête pas à réaffecter un compte
    // administrateur (ex. par erreur de frappe sur sa propre adresse) : ça
    // le priverait de son accès transverse à tous les cabinets.
    const { data: existing } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', memberEmail.trim())
      .maybeSingle()

    if (!existing) {
      setMemberSaving(false)
      setMemberError(
        "Aucun compte trouvé avec cet e-mail. Créez-le d'abord dans Supabase (Authentication > Users), puis réessayez.",
      )
      return
    }
    if (existing.role === 'admin') {
      setMemberSaving(false)
      setMemberError("Ce compte est un compte administrateur Elodiatech, il ne peut pas être affecté à un cabinet.")
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        cabinet_id: id,
        role: memberRole,
        first_name: memberFirstName.trim() || undefined,
        last_name: memberLastName.trim() || undefined,
      })
      .eq('email', memberEmail.trim())
      .neq('role', 'admin')
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

  async function createAccount(e: FormEvent) {
    e.preventDefault()
    if (!id || !newEmail.trim() || !newFirstName.trim() || !newLastName.trim()) return
    setCreating(true)
    setCreateError(null)
    setCreateSuccess(null)

    const { data, error } = await supabase.functions.invoke('create-account', {
      body: {
        email: newEmail.trim(),
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        role: newRole,
        cabinetId: id,
      },
    })

    if (error || data?.error) {
      setCreating(false)
      setCreateError(data?.error ?? error?.message ?? 'Une erreur est survenue.')
      return
    }

    await supabase.auth.resetPasswordForEmail(newEmail.trim(), {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    })

    setCreating(false)
    setCreateSuccess(
      `Compte créé. Un e-mail a été envoyé à ${newEmail.trim()} pour définir son mot de passe.`,
    )
    setNewEmail('')
    setNewFirstName('')
    setNewLastName('')
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

  async function exportExcel() {
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Variables')
    sheet.columns = [
      { header: 'Nom', key: 'nom', width: 18 },
      { header: 'Prénom', key: 'prenom', width: 18 },
      { header: 'NIR', key: 'nir', width: 18 },
      { header: 'Mois', key: 'mois', width: 12 },
      { header: 'Heures sup. 25%', key: 'hs25', width: 16 },
      { header: 'Heures sup. 50%', key: 'hs50', width: 16 },
      { header: 'Indemnités km', key: 'km', width: 16 },
      { header: 'Primes', key: 'primes', width: 12 },
    ]
    sheet.getRow(1).font = { bold: true }

    const byEmployee = new Map(employees.map((e) => [e.id, e]))
    for (const v of variables) {
      const emp = byEmployee.get(v.employee_id)
      sheet.addRow({
        nom: emp?.last_name ?? '',
        prenom: emp?.first_name ?? '',
        nir: emp?.nir ?? '',
        mois: v.month_period,
        hs25: v.overtime_hours_25,
        hs50: v.overtime_hours_50,
        km: v.kilometric_expenses,
        primes: v.bonus_amount,
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `variables_${id}_${period}.xlsx`
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

  if (loading || !cabinet) return <p className="text-sm text-slate-600">Chargement…</p>

  const onboardingSteps: OnboardingStep[] = [
    { label: 'Affecter au moins un membre (médecin ou assistante)', done: members.length > 0 },
    {
      label: 'Compléter la fiche établissement (SIRET, adresse…)',
      done: Boolean(cabinet.siret),
      to: `/cabinets/${id}/modifier`,
      linkLabel: 'Compléter',
    },
    {
      label: 'Configurer au moins un portail (URSSAF, Net-Entreprises…)',
      done: portalCount > 0,
      to: `/cabinets/${id}/portails`,
      linkLabel: 'Configurer',
    },
    { label: 'Déposer un premier document (fiche de paie…)', done: documents.length > 0 },
  ]
  const onboardingComplete = onboardingSteps.every((s) => s.done)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800">
          <ArrowLeft size={16} /> Retour
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{cabinet.name}</h1>
            <p className="text-sm text-slate-600">
              {PLAN_LABELS[cabinet.plan]} · {activeEmployeeCount} salarié(s) actif(s)
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

      {!onboardingComplete && (
        <Card title="Premiers pas pour ce cabinet">
          <div className="flex flex-col divide-y divide-slate-100">
            {onboardingSteps.map((step) => (
              <div key={step.label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      step.done ? 'bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] text-white' : 'border border-slate-300 text-transparent'
                    }`}
                  >
                    <Check size={12} />
                  </span>
                  <span className={step.done ? 'text-slate-400 line-through' : 'text-slate-700'}>
                    {step.label}
                  </span>
                </div>
                {!step.done && step.to && (
                  <Link to={step.to} className="shrink-0 text-xs font-medium text-brand-700 hover:text-brand-800">
                    {step.linkLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Membres du cabinet">
        {members.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun membre affecté à ce cabinet pour le moment.</p>
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
                    {!m.active && (
                      <span className="ml-2 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                        Désactivé
                      </span>
                    )}
                  </p>
                  <p className="text-slate-600">{m.email}</p>
                </div>
                <span className="text-xs font-medium text-slate-600">{ROLE_LABELS[m.role]}</span>
              </Link>
            ))}
          </div>
        )}

        <form onSubmit={createAccount} className="flex flex-col gap-4 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            Créer le compte d'un médecin ou d'une assistante pour ce cabinet. La personne reçoit
            un e-mail pour définir son mot de passe.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Prénom</label>
              <input
                type="text"
                required
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Nom</label>
              <input
                type="text"
                required
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="assistante@cabinet.fr"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Rôle</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="employee">Assistante médicale</option>
              <option value="employer">Médecin employeur</option>
            </select>
          </div>

          {createError && <p className="text-sm text-red-600">{createError}</p>}
          {createSuccess && <p className="text-sm text-brand-700">{createSuccess}</p>}

          <button
            type="submit"
            disabled={creating}
            className="flex w-fit items-center gap-1.5 rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <UserPlus size={16} /> {creating ? 'Création…' : 'Créer le compte'}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowExistingForm((s) => !s)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            {showExistingForm ? 'Masquer' : 'Ou affecter un compte déjà créé (inscrit lui-même sur /inscription)'}
          </button>

          {showExistingForm && (
            <form onSubmit={assignMember} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">E-mail du compte existant</label>
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
                className="flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <UserPlus size={16} /> Affecter au cabinet
              </button>
            </form>
          )}
        </div>
      </Card>

      <Card
        title={`Variables — ${formatMonthPeriod(period)}`}
        action={
          <div className="flex gap-2">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download size={14} /> CSV macompta.fr
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
          </div>
        }
      >
        {variables.length === 0 ? (
          <p className="text-sm text-slate-600">Aucune variable saisie pour ce mois.</p>
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
          <p className="text-sm text-slate-600">Aucune demande récente.</p>
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
                              className="rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
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

      <Card title={`Documents du cabinet${documents.length > 0 ? ` (${documents.length})` : ''}`}>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun document déposé pour ce cabinet pour le moment.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {documents.map((doc) => {
              const recipient = members.find((m) => m.id === doc.employee_id)
              return (
                <div key={doc.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{doc.document_name}</p>
                    <p className="text-xs text-slate-500">
                      {DOCUMENT_TYPE_LABELS[doc.document_type]}
                      {recipient ? ` · ${recipient.first_name} ${recipient.last_name}` : ' · Cabinet entier'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {doc.macompta_paie_url && (
                      <a
                        href={doc.macompta_paie_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        Ouvrir <ExternalLink size={12} />
                      </a>
                    )}
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
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
              <label className="text-sm font-medium text-slate-700">Destinataire (optionnel)</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">— Cabinet entier —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({ROLE_LABELS[m.role]})
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
            <label className="text-sm font-medium text-slate-700">Lien vers le document (macompta.fr)</label>
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
            className="w-fit rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Ajouter le document
          </button>
        </form>
      </Card>
    </div>
  )
}
