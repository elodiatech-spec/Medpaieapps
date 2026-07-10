import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, CalendarDays, FileText, ArrowRight, IdCard, BarChart3 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { currentMonthPeriod, formatMonthPeriod } from '../../lib/format'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import type { PayrollVariable, LeaveRequest } from '../../lib/database.types'

export default function Overview() {
  const { profile } = useAuth()
  const [myVariable, setMyVariable] = useState<PayrollVariable | null>(null)
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
  const [pendingVariables, setPendingVariables] = useState(0)
  const [loading, setLoading] = useState(true)

  const period = currentMonthPeriod()
  const isEmployer = profile?.role === 'employer'

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      if (isEmployer) {
        const [{ data: leaves }, { count }] = await Promise.all([
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
        ])
        setPendingLeaves((leaves as LeaveRequest[]) ?? [])
        setPendingVariables(count ?? 0)
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
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Bonjour {profile.first_name} 👋
        </h1>
        <p className="text-sm text-slate-600 capitalize">{formatMonthPeriod(period)}</p>
      </div>

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
