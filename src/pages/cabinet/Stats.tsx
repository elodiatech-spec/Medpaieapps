import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { weeksInMonth } from '../../lib/format'
import Card from '../../components/Card'
import TrendChart from '../../components/TrendChart'
import type { LeaveRequest, Profile, TimeEntry } from '../../lib/database.types'

function lastMonths(n: number): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
  }
  return result
}

function monthLabel(period: string): string {
  const d = new Date(period + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { month: 'short' })
}

export default function Stats() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [attendanceData, setAttendanceData] = useState<{ label: string; value: number }[]>([])
  const [absenceData, setAbsenceData] = useState<{ label: string; value: number }[]>([])

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const months = lastMonths(12)
      const allWeeks = months.flatMap((m) => weeksInMonth(m))
      const firstWeek = allWeeks[0]
      const firstMonth = months[0]

      const [{ data: employees }, { data: entries }, { data: absences }] = await Promise.all([
        supabase.from('profiles').select('*').eq('cabinet_id', profile.cabinet_id).eq('role', 'employee'),
        supabase
          .from('time_entries')
          .select('*')
          .eq('cabinet_id', profile.cabinet_id)
          .gte('week_start_date', firstWeek),
        supabase
          .from('leave_requests')
          .select('*')
          .eq('cabinet_id', profile.cabinet_id)
          .eq('leave_type', 'absence_injustifiee')
          .gte('start_date', firstMonth),
      ])

      const employeeList = (employees as Profile[]) ?? []
      const entryList = (entries as TimeEntry[]) ?? []
      const absenceList = (absences as LeaveRequest[]) ?? []

      const attendance = months.map((month) => {
        const weeks = weeksInMonth(month)
        const worked = entryList
          .filter((e) => weeks.includes(e.week_start_date))
          .reduce((sum, e) => sum + Number(e.hours_worked), 0)
        const contractual = employeeList.reduce(
          (sum, emp) => sum + (emp.weekly_hours ?? 35) * weeks.length,
          0,
        )
        const rate = contractual > 0 ? Math.round((worked / contractual) * 100) : 0
        return { label: monthLabel(month), value: rate }
      })

      const absencesByMonth = months.map((month) => {
        const monthDate = new Date(month + 'T00:00:00')
        const count = absenceList.filter((a) => {
          const d = new Date(a.start_date + 'T00:00:00')
          return d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth()
        }).length
        return { label: monthLabel(month), value: count }
      })

      setAttendanceData(attendance)
      setAbsenceData(absencesByMonth)
      setLoading(false)
    })()
  }, [profile])

  if (!profile) return null
  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Statistiques</h1>
        <p className="text-sm text-slate-500">Vue sur les 12 derniers mois</p>
      </div>

      <Card>
        <TrendChart
          title="Taux de présence de l'équipe"
          data={attendanceData}
          kind="line"
          color="#0f9d8a"
          unit=" %"
        />
      </Card>

      <Card>
        <TrendChart
          title="Absences injustifiées"
          data={absenceData}
          kind="bar"
          color="#dc2626"
        />
      </Card>
    </div>
  )
}
