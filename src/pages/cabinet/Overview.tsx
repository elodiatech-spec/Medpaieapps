import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, CalendarDays, FileText, ArrowRight, IdCard, BarChart3, FileWarning, CalendarClock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { currentMonthPeriod, formatMonthPeriod, formatDate } from '../../lib/format'
import Card from '../../components/Card'
import PageHero from '../../components/PageHero'
import StatusBadge from '../../components/StatusBadge'
import {
  JUSTIFICATION_REQUIRED_TYPES,
  LEAVE_TYPE_LABELS,
  type PayrollVariable,
  type LeaveRequest,
  type Profile,
} from '../../lib/database.types'

interface Deadline {
  employee: Profile
  label: string
  date: string
}

function within30Days(dateStr: string | null): boolean {
  if (!dateStr) return false
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const in30 = new Date()
  in30.setDate(now.getDate() + 30)
  return target >= now && target <= in30
}

export default function Overview() {
  const { profile } = useAuth()
  const [myVariable, setMyVariable] = useState<PayrollVariable | null>(null)
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
  const [pendingVariables, setPendingVariables] = useState(0)
  const [pendingJustifications, setPendingJustifications] = useState<(LeaveRequest & { employee?: Profile })[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)

  const period = currentMonthPeriod()
  const isEmployer = profile?.role === 'employer'

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      if (isEmployer) {
        const [{ data: leaves }, { count }, { data: justifLeaves }, { data: employees }] = await Promise.all([
          supabase
            .from('leave_requests')
            .select('*')
            .eq('cabinet_id', profile.cabinet_id)
            .eq('status', 'pending')
            .order('start_date', { ascending: true }),
          supabase
            .from('payroll_variables')
            .select('*', { count: 'exact', head: true })
            .eq('cabinet_id', profile.cabinet_id)
            .eq('month_period', period)
            .eq('status', 'submitted'),
          supabase
            .from('leave_requests')
            .select('*')
            .eq('cabinet_id', profile.cabinet_id)
            .neq('status', 'rejected')
            .in('leave_type', JUSTIFICATION_REQUIRED_TYPES),
          supabase
            .from('profiles')
            .select('*')
            .eq('cabinet_id', profile.cabinet_id)
            .eq('role', 'employee')
            .eq('active', true),
        ])
        setPendingLeaves((leaves as LeaveRequest[]) ?? [])
        setPendingVariables(count ?? 0)

        const employeeList = (employees as Profile[]) ?? []
        const employeeMap = new Map(employeeList.map((e) => [e.id, e]))
        setPendingJustifications(
          ((justifLeaves as LeaveRequest[]) ?? [])
            .filter((l) => !l.justification_document_url || !l.justification_validated)
            .map((l) => ({ ...l, employee: employeeMap.get(l.employee_id) })),
        )

        const upcoming: Deadline[] = []
        for (const emp of employeeList) {
          if (emp.contract_type === 'cdd' && within30Days(emp.contract_end_date)) {
            upcoming.push({ employee: emp, label: 'Fin de CDD', date: emp.contract_end_date! })
          }
          if (within30Days(emp.trial_period_end)) {
            upcoming.push({ employee: emp, label: "Fin de période d'essai", date: emp.trial_period_end! })
          }
        }
        upcoming.sort((a, b) => a.date.localeCompare(b.date))
        setDeadlines(upcoming)
      } else {
        const [{ data: variable }, { data: leaves }] = await Promise.all([
          supabase
            .from('payroll_variables')
            .select('*')
            .eq('employee_id', profile.id)
            .eq('month_period', period)
            .maybeSingle(),
          supabase
            .from('leave_requests')
            .select('*')
            .eq('employee_id', profile.id)
            .eq('status', 'pending'),
        ])
        setMyVariable(variable as PayrollVariable | null)
        setPendingLeaves((leaves as LeaveRequest[]) ?? [])
      }
      setLoading(false)
    })()
  }, [profile, isEmployer, period])

  if (!profile) return null

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        eyebrow={formatMonthPeriod(period)}
        title={`Bonjour ${profile.first_name} 👋`}
        subtitle={
          isEmployer
            ? "Voici où en est votre cabinet ce mois-ci."
            : 'Voici vos démarches du mois.'
        }
        stat={
          isEmployer && !loading ? (
            <div className="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-semibold">{pendingVariables + pendingLeaves.length}</p>
              <p className="text-xs text-brand-100">à traiter</p>
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <p className="text-sm text-slate-600">Chargement…</p>
      ) : isEmployer ? (
        <>
          <Card title="À valider ce mois-ci">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/variables"
                className="flex flex-1 items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-brand-300"
              >
                <div>
                  <p className="text-sm text-slate-600">Variables de paie soumises</p>
                  <p className="text-2xl font-semibold text-slate-900">{pendingVariables}</p>
                </div>
                <ArrowRight size={18} className="text-slate-400" />
              </Link>
              <Link
                to="/conges"
                className="flex flex-1 items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-brand-300"
              >
                <div>
                  <p className="text-sm text-slate-600">Demandes de congés</p>
                  <p className="text-2xl font-semibold text-slate-900">{pendingLeaves.length}</p>
                </div>
                <ArrowRight size={18} className="text-slate-400" />
              </Link>
            </div>
          </Card>

          {(pendingJustifications.length > 0 || deadlines.length > 0) && (
            <Card title="Événements à venir">
              <div className="flex flex-col gap-4">
                {pendingJustifications.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <FileWarning size={15} className="text-red-500" />
                      Justificatifs à vérifier ({pendingJustifications.length})
                    </p>
                    <div className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-100">
                      {pendingJustifications.map((l) => (
                        <Link
                          key={l.id}
                          to="/conges"
                          className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50"
                        >
                          <span className="text-slate-700">
                            {l.employee ? `${l.employee.first_name} ${l.employee.last_name}` : 'Salarié·e'}
                            <span className="ml-1.5 text-slate-500">· {LEAVE_TYPE_LABELS[l.leave_type]}</span>
                          </span>
                          <span className="text-xs text-slate-500">
                            {l.justification_document_url ? 'à valider' : 'aucun document reçu'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {deadlines.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <CalendarClock size={15} className="text-amber-500" />
                      Échéances contractuelles (30 jours)
                    </p>
                    <div className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-100">
                      {deadlines.map((d, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="text-slate-700">
                            {d.employee.first_name} {d.employee.last_name}
                            <span className="ml-1.5 text-slate-500">· {d.label}</span>
                          </span>
                          <span className="text-xs font-medium text-amber-700">{formatDate(d.date)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card title="Mes variables du mois">
          {myVariable ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Statut de votre déclaration</p>
              <StatusBadge status={myVariable.status} />
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Vous n'avez pas encore saisi vos variables pour ce mois.
            </p>
          )}
          <Link
            to="/variables"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700"
          >
            Saisir mes variables <ArrowRight size={16} />
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link
          to="/variables"
          className="flex flex-col items-center gap-2 rounded-xl bg-white p-5 text-center shadow-card border border-slate-200/80 transition hover:shadow-deep hover:ring-2 hover:ring-brand-200"
        >
          <ClipboardList className="text-brand-600" size={22} />
          <span className="text-sm font-medium text-slate-800">Variables de paie</span>
        </Link>
        <Link
          to="/conges"
          className="flex flex-col items-center gap-2 rounded-xl bg-white p-5 text-center shadow-card border border-slate-200/80 transition hover:shadow-deep hover:ring-2 hover:ring-brand-200"
        >
          <CalendarDays className="text-brand-600" size={22} />
          <span className="text-sm font-medium text-slate-800">Congés</span>
        </Link>
        <Link
          to="/documents"
          className="flex flex-col items-center gap-2 rounded-xl bg-white p-5 text-center shadow-card border border-slate-200/80 transition hover:shadow-deep hover:ring-2 hover:ring-brand-200"
        >
          <FileText className="text-brand-600" size={22} />
          <span className="text-sm font-medium text-slate-800">Documents</span>
        </Link>
        {isEmployer ? (
          <Link
            to="/statistiques"
            className="flex flex-col items-center gap-2 rounded-xl bg-white p-5 text-center shadow-card border border-slate-200/80 transition hover:shadow-deep hover:ring-2 hover:ring-brand-200"
          >
            <BarChart3 className="text-brand-600" size={22} />
            <span className="text-sm font-medium text-slate-800">Statistiques</span>
          </Link>
        ) : (
          <Link
            to="/dossier"
            className="flex flex-col items-center gap-2 rounded-xl bg-white p-5 text-center shadow-card border border-slate-200/80 transition hover:shadow-deep hover:ring-2 hover:ring-brand-200"
          >
            <IdCard className="text-brand-600" size={22} />
            <span className="text-sm font-medium text-slate-800">Mon dossier</span>
          </Link>
        )}
      </div>
    </div>
  )
}
