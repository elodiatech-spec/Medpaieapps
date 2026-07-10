import { useEffect, useState, type FormEvent } from 'react'
import { Camera, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../lib/format'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import LeaveCalendar from '../../components/LeaveCalendar'
import {
  LEAVE_TYPE_LABELS,
  EMPLOYEE_LEAVE_TYPES,
  JUSTIFICATION_REQUIRED_TYPES,
  type LeaveRequest,
  type LeaveType,
  type Profile,
} from '../../lib/database.types'

async function uploadJustification(file: File, cabinetId: string, employeeId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${cabinetId}/${employeeId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('justificatifs').upload(path, file)
  if (error) throw error
  return path
}

async function openJustification(path: string) {
  const { data } = await supabase.storage.from('justificatifs').createSignedUrl(path, 60)
  if (data?.signedUrl) window.open(data.signedUrl, '_blank')
}

function JustificationStatus({ leave }: { leave: LeaveRequest }) {
  if (!JUSTIFICATION_REQUIRED_TYPES.includes(leave.leave_type)) return null
  if (!leave.justification_document_url) {
    return <span className="text-xs font-medium text-red-600">Justificatif manquant</span>
  }
  if (!leave.justification_validated) {
    return <span className="text-xs font-medium text-amber-600">Justificatif en attente de validation</span>
  }
  return <span className="text-xs font-medium text-brand-700">Justificatif validé</span>
}

export default function Leaves() {
  const { profile } = useAuth()
  if (!profile) return null
  return profile.role === 'employee' ? <EmployeeLeaves /> : <EmployerLeaves />
}

function EmployeeLeaves() {
  const { profile } = useAuth()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leaveType, setLeaveType] = useState<LeaveType>('conges_payes')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  const justificationRequired = JUSTIFICATION_REQUIRED_TYPES.includes(leaveType)

  async function load() {
    if (!profile) return
    const { data } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', profile.id)
      .order('start_date', { ascending: false })
    setLeaves((data as LeaveRequest[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile || !startDate || !endDate) return
    setSaving(true)
    const { data: inserted, error } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: profile.id,
        cabinet_id: profile.cabinet_id,
        start_date: startDate,
        end_date: endDate,
        leave_type: leaveType,
      })
      .select()
      .single()

    if (!error && inserted && file) {
      try {
        const path = await uploadJustification(file, profile.cabinet_id, profile.id)
        await supabase.from('leave_requests').update({ justification_document_url: path }).eq('id', inserted.id)
      } catch (uploadError) {
        console.error(uploadError)
      }
    }

    setStartDate('')
    setEndDate('')
    setFile(null)
    setSaving(false)
    await load()
  }

  async function addJustification(leaveId: string, selectedFile: File) {
    if (!profile) return
    setUploadingFor(leaveId)
    try {
      const path = await uploadJustification(selectedFile, profile.cabinet_id, profile.id)
      await supabase
        .from('leave_requests')
        .update({ justification_document_url: path, justification_validated: false })
        .eq('id', leaveId)
      await load()
    } catch (err) {
      console.error(err)
    }
    setUploadingFor(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Mes congés</h1>

      <Card title="Calendrier">
        <LeaveCalendar leaves={leaves} />
      </Card>

      <Card title="Nouvelle demande">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Du</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Au</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Motif</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {EMPLOYEE_LEAVE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {LEAVE_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Justificatif {justificationRequired ? '(obligatoire pour ce motif)' : '(optionnel)'}
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-600 hover:border-brand-400">
              <Camera size={18} />
              {file ? file.name : 'Prendre une photo ou choisir un fichier'}
              <input
                type="file"
                accept="image/*,.pdf"
                capture="environment"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Envoyer la demande
          </button>
        </form>
      </Card>

      <Card title="Historique">
        {leaves.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune demande de congé.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {leaves.map((l) => (
              <div key={l.id} className="flex flex-col gap-1.5 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{LEAVE_TYPE_LABELS[l.leave_type]}</p>
                    <p className="text-slate-500">
                      {formatDate(l.start_date)} → {formatDate(l.end_date)}
                    </p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
                <div className="flex items-center justify-between">
                  <JustificationStatus leave={l} />
                  <div className="flex items-center gap-2">
                    {l.justification_document_url && (
                      <button
                        onClick={() => openJustification(l.justification_document_url!)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        Voir <ExternalLink size={12} />
                      </button>
                    )}
                    {JUSTIFICATION_REQUIRED_TYPES.includes(l.leave_type) && !l.justification_document_url && (
                      <label className="cursor-pointer text-xs font-medium text-brand-700 hover:text-brand-800">
                        {uploadingFor === l.id ? 'Envoi…' : 'Ajouter un justificatif'}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) addJustification(l.id, f)
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function EmployerLeaves() {
  const { profile } = useAuth()
  const [leaves, setLeaves] = useState<(LeaveRequest & { employee?: Profile })[]>([])
  const [employees, setEmployees] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const [absenceEmployeeId, setAbsenceEmployeeId] = useState('')
  const [absenceStart, setAbsenceStart] = useState('')
  const [absenceEnd, setAbsenceEnd] = useState('')
  const [savingAbsence, setSavingAbsence] = useState(false)

  async function load() {
    if (!profile) return
    const [{ data: allMembers }, { data: requests }] = await Promise.all([
      supabase.from('profiles').select('*').eq('cabinet_id', profile.cabinet_id),
      supabase
        .from('leave_requests')
        .select('*')
        .eq('cabinet_id', profile.cabinet_id)
        .order('start_date', { ascending: false }),
    ])
    const byEmployee = new Map((allMembers as Profile[] | null)?.map((e) => [e.id, e]))
    setLeaves(((requests as LeaveRequest[]) ?? []).map((r) => ({ ...r, employee: byEmployee.get(r.employee_id) })))
    setEmployees(((allMembers as Profile[]) ?? []).filter((m) => m.role === 'employee'))
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function decide(id: string, status: 'approved' | 'rejected') {
    await supabase.from('leave_requests').update({ status }).eq('id', id)
    await load()
  }

  async function reportAbsence(e: FormEvent) {
    e.preventDefault()
    if (!profile || !absenceEmployeeId || !absenceStart || !absenceEnd) return
    setSavingAbsence(true)
    await supabase.from('leave_requests').insert({
      employee_id: absenceEmployeeId,
      cabinet_id: profile.cabinet_id,
      start_date: absenceStart,
      end_date: absenceEnd,
      leave_type: 'absence_injustifiee',
      status: 'approved',
    })
    setAbsenceEmployeeId('')
    setAbsenceStart('')
    setAbsenceEnd('')
    setSavingAbsence(false)
    await load()
  }

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>

  const employeeMap = new Map(
    leaves.filter((l) => l.employee).map((l) => [l.employee_id, l.employee as Profile]),
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Congés du cabinet</h1>

      <Card title="Planning de l'équipe">
        <LeaveCalendar leaves={leaves} employees={employeeMap} />
      </Card>

      <Card>
        {leaves.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune demande de congé.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {leaves.map((l) => (
              <div key={l.id} className="flex flex-col gap-1.5 py-3 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {l.employee?.first_name} {l.employee?.last_name} — {LEAVE_TYPE_LABELS[l.leave_type]}
                    </p>
                    <p className="text-slate-500">
                      {formatDate(l.start_date)} → {formatDate(l.end_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => decide(l.id, 'approved')}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => decide(l.id, 'rejected')}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Refuser
                        </button>
                      </>
                    ) : (
                      <StatusBadge status={l.status} />
                    )}
                  </div>
                </div>
                <JustificationStatus leave={l} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Signaler une absence injustifiée">
        <form onSubmit={reportAbsence} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Salarié</label>
            <select
              required
              value={absenceEmployeeId}
              onChange={(e) => setAbsenceEmployeeId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">— Sélectionner —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Du</label>
              <input
                type="date"
                required
                value={absenceStart}
                onChange={(e) => setAbsenceStart(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Au</label>
              <input
                type="date"
                required
                value={absenceEnd}
                onChange={(e) => setAbsenceEnd(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingAbsence}
            className="w-fit rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Signaler l'absence
          </button>
        </form>
      </Card>
    </div>
  )
}
