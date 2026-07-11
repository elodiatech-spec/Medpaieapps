import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  currentMonthPeriod,
  formatMonthPeriod,
  formatCurrency,
  formatDate,
  weeksInMonth,
  splitOvertimeLegal,
} from '../../lib/format'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import type { PayrollVariable, Profile, TimeEntry } from '../../lib/database.types'

const period = currentMonthPeriod()

export default function Variables() {
  const { profile } = useAuth()
  if (!profile) return null
  return profile.role === 'employee' ? <EmployeeVariables /> : <EmployerVariables />
}

function EmployeeVariables() {
  const { profile } = useAuth()
  const [variable, setVariable] = useState<PayrollVariable | null>(null)
  const [history, setHistory] = useState<PayrollVariable[]>([])
  const [overtime25, setOvertime25] = useState('0')
  const [overtime50, setOvertime50] = useState('0')
  const [km, setKm] = useState('0')
  const [bonus, setBonus] = useState('0')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const weeks = weeksInMonth(period)
  const [weeklyHours, setWeeklyHours] = useState<Record<string, string>>({})
  const [savingWeekly, setSavingWeekly] = useState(false)

  async function load() {
    if (!profile) return
    const [{ data: current }, { data: past }, { data: entries }] = await Promise.all([
      supabase
        .from('payroll_variables')
        .select('*')
        .eq('employee_id', profile.id)
        .eq('month_period', period)
        .maybeSingle(),
      supabase
        .from('payroll_variables')
        .select('*')
        .eq('employee_id', profile.id)
        .neq('month_period', period)
        .order('month_period', { ascending: false })
        .limit(6),
      supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', profile.id)
        .in('week_start_date', weeks),
    ])
    const cur = current as PayrollVariable | null
    setVariable(cur)
    if (cur) {
      setOvertime25(String(cur.overtime_hours_25))
      setOvertime50(String(cur.overtime_hours_50))
      setKm(String(cur.kilometric_expenses))
      setBonus(String(cur.bonus_amount))
      setNotes(cur.notes ?? '')
    }
    setHistory((past as PayrollVariable[]) ?? [])

    const entryByWeek = new Map(((entries as TimeEntry[]) ?? []).map((e) => [e.week_start_date, e]))
    const defaults: Record<string, string> = {}
    for (const week of weeks) {
      const existing = entryByWeek.get(week)
      defaults[week] = existing ? String(existing.hours_worked) : String(profile.weekly_hours ?? 35)
    }
    setWeeklyHours(defaults)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const locked = variable?.status === 'submitted' || variable?.status === 'validated'

  async function saveWeeklyHours() {
    if (!profile) return
    setSavingWeekly(true)
    for (const week of weeks) {
      await supabase.from('time_entries').upsert(
        {
          employee_id: profile.id,
          cabinet_id: profile.cabinet_id,
          week_start_date: week,
          hours_worked: Number(weeklyHours[week]) || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'employee_id,week_start_date' },
      )
    }
    setSavingWeekly(false)
  }

  function computeOvertimeFromWeekly() {
    const contractual = profile?.weekly_hours ?? 35
    let tier25 = 0
    let tier50 = 0
    for (const week of weeks) {
      const worked = Number(weeklyHours[week]) || 0
      const split = splitOvertimeLegal(worked, contractual)
      tier25 += split.tier25
      tier50 += split.tier50
    }
    setOvertime25(String(tier25))
    setOvertime50(String(tier50))
  }

  async function handleSave(e: FormEvent, submit: boolean) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const payload = {
      employee_id: profile.id,
      cabinet_id: profile.cabinet_id,
      month_period: period,
      overtime_hours_25: Number(overtime25) || 0,
      overtime_hours_50: Number(overtime50) || 0,
      kilometric_expenses: Number(km) || 0,
      bonus_amount: Number(bonus) || 0,
      notes: notes || null,
      status: submit ? ('submitted' as const) : ('draft' as const),
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('payroll_variables')
      .upsert(payload, { onConflict: 'employee_id,month_period' })
    setSaving(false)
    if (!error) await load()
  }

  if (loading) return <p className="text-sm text-slate-600">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 capitalize">
          Variables — {formatMonthPeriod(period)}
        </h1>
        {variable && <StatusBadge status={variable.status} />}
      </div>

      <Card title="Heures travaillées par semaine">
        <div className="flex flex-col gap-3">
          {weeks.map((week) => (
            <div key={week} className="flex items-center justify-between gap-3">
              <label className="text-sm text-slate-600">
                Semaine du {formatDate(week)}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                disabled={locked}
                value={weeklyHours[week] ?? ''}
                onChange={(e) => setWeeklyHours((w) => ({ ...w, [week]: e.target.value }))}
                className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
              />
            </div>
          ))}
          {!locked && (
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={saveWeeklyHours}
                disabled={savingWeekly}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Enregistrer les heures
              </button>
              <button
                type="button"
                onClick={computeOvertimeFromWeekly}
                className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
              >
                Calculer mes heures sup. automatiquement
              </button>
            </div>
          )}
          <p className="text-xs text-slate-400">
            Pré-rempli avec votre base contractuelle ({profile?.weekly_hours ?? 35} h/semaine).
            Ajustez selon vos heures réellement travaillées, puis calculez vos heures sup. — le
            résultat complète les champs ci-dessous, que vous pouvez toujours corriger avant de
            soumettre.
          </p>
        </div>
      </Card>

      <Card>
        <form onSubmit={(e) => handleSave(e, false)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Heures sup. majorées à 25 %"
              value={overtime25}
              onChange={setOvertime25}
              disabled={locked}
            />
            <Field
              label="Heures sup. majorées à 50 %"
              value={overtime50}
              onChange={setOvertime50}
              disabled={locked}
            />
            <Field
              label="Indemnités kilométriques (€)"
              value={km}
              onChange={setKm}
              disabled={locked}
            />
            <Field label="Primes (€)" value={bonus} onChange={setBonus} disabled={locked} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={locked}
              rows={3}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
            />
          </div>

          {locked ? (
            <p className="text-sm text-slate-600">
              Votre déclaration a été soumise et n'est plus modifiable. Contactez votre médecin
              ou votre gestionnaire Elodiatech pour toute correction.
            </p>
          ) : (
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Enregistrer le brouillon
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={(e) => handleSave(e, true)}
                className="rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                Soumettre au médecin
              </button>
            </div>
          )}
        </form>
      </Card>

      {history.length > 0 && (
        <Card title="Historique">
          <div className="flex flex-col divide-y divide-slate-100">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="capitalize text-slate-700">{formatMonthPeriod(h.month_period)}</span>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function EmployerVariables() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<(PayrollVariable & { employee?: Profile })[]>([])
  const [attendance, setAttendance] = useState<{ employee: Profile; rate: number }[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!profile) return
    const weeks = weeksInMonth(period)
    const { data: employees } = await supabase
      .from('profiles')
      .select('*')
      .eq('cabinet_id', profile.cabinet_id)
      .eq('role', 'employee')

    const { data: variables } = await supabase
      .from('payroll_variables')
      .select('*')
      .eq('cabinet_id', profile.cabinet_id)
      .eq('month_period', period)

    const { data: entries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('cabinet_id', profile.cabinet_id)
      .in('week_start_date', weeks)

    const byEmployee = new Map((employees as Profile[] | null)?.map((e) => [e.id, e]))
    const merged = ((variables as PayrollVariable[]) ?? []).map((v) => ({
      ...v,
      employee: byEmployee.get(v.employee_id),
    }))
    setRows(merged)

    const attendanceList = ((employees as Profile[]) ?? []).map((emp) => {
      const contractual = (emp.weekly_hours ?? 35) * weeks.length
      const worked = ((entries as TimeEntry[]) ?? [])
        .filter((e) => e.employee_id === emp.id)
        .reduce((sum, e) => sum + Number(e.hours_worked), 0)
      const rate = contractual > 0 ? Math.round((worked / contractual) * 100) : 0
      return { employee: emp, rate }
    })
    setAttendance(attendanceList)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function validate(id: string) {
    await supabase.from('payroll_variables').update({ status: 'validated' }).eq('id', id)
    await load()
  }

  async function sendBackToDraft(id: string) {
    await supabase.from('payroll_variables').update({ status: 'draft' }).eq('id', id)
    await load()
  }

  if (loading) return <p className="text-sm text-slate-600">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900 capitalize">
        Variables — {formatMonthPeriod(period)}
      </h1>

      {attendance.length > 0 && (
        <Card title="Taux de présence de l'équipe">
          <div className="flex flex-col divide-y divide-slate-100">
            {attendance.map(({ employee, rate }) => (
              <div key={employee.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-700">
                  {employee.first_name} {employee.last_name}
                </span>
                <span className={`font-medium ${rate >= 90 ? 'text-brand-700' : 'text-amber-700'}`}>
                  {rate} %
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-600">Aucune variable saisie pour ce mois.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">
                    {row.employee?.first_name} {row.employee?.last_name}
                  </p>
                  <StatusBadge status={row.status} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600 sm:grid-cols-4">
                  <span>HS 25% : {row.overtime_hours_25} h</span>
                  <span>HS 50% : {row.overtime_hours_50} h</span>
                  <span>Km : {formatCurrency(row.kilometric_expenses)}</span>
                  <span>Primes : {formatCurrency(row.bonus_amount)}</span>
                </div>
                {row.status !== 'draft' && (
                  <div className="mt-1 flex w-fit gap-2">
                    {row.status === 'submitted' && (
                      <button
                        onClick={() => validate(row.id)}
                        className="rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                      >
                        Valider d'un clic
                      </button>
                    )}
                    <button
                      onClick={() => sendBackToDraft(row.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Renvoyer pour correction
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
      />
    </div>
  )
}
