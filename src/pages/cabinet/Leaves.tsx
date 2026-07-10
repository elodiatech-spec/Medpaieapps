import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../lib/format'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import { LEAVE_TYPE_LABELS, type LeaveRequest, type LeaveType, type Profile } from '../../lib/database.types'

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
  const [justification, setJustification] = useState('')
  const [saving, setSaving] = useState(false)

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
    await supabase.from('leave_requests').insert({
      employee_id: profile.id,
      cabinet_id: profile.cabinet_id,
      start_date: startDate,
      end_date: endDate,
      leave_type: leaveType,
      justification_document_url: justification || null,
    })
    setStartDate('')
    setEndDate('')
    setJustification('')
    setSaving(false)
    await load()
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Mes congés</h1>

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
              {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Lien du justificatif (optionnel)
            </label>
            <input
              type="url"
              placeholder="Lien Google Drive du certificat médical…"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
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
              <div key={l.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{LEAVE_TYPE_LABELS[l.leave_type]}</p>
                  <p className="text-slate-500">
                    {formatDate(l.start_date)} → {formatDate(l.end_date)}
                  </p>
                </div>
                <StatusBadge status={l.status} />
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
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!profile) return
    const [{ data: employees }, { data: requests }] = await Promise.all([
      supabase.from('profiles').select('*').eq('cabinet_id', profile.cabinet_id),
      supabase
        .from('leave_requests')
        .select('*')
        .eq('cabinet_id', profile.cabinet_id)
        .order('start_date', { ascending: false }),
    ])
    const byEmployee = new Map((employees as Profile[] | null)?.map((e) => [e.id, e]))
    setLeaves(((requests as LeaveRequest[]) ?? []).map((r) => ({ ...r, employee: byEmployee.get(r.employee_id) })))
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

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Congés du cabinet</h1>

      <Card>
        {leaves.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune demande de congé.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {leaves.map((l) => (
              <div key={l.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    {l.employee?.first_name} {l.employee?.last_name} — {LEAVE_TYPE_LABELS[l.leave_type]}
                  </p>
                  <p className="text-sm text-slate-500">
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
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
