import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { currentMonthPeriod } from '../lib/format'
import { JUSTIFICATION_REQUIRED_TYPES, type LeaveRequest, type Profile } from '../lib/database.types'

export interface JustificationAlert extends LeaveRequest {
  employee?: Profile
  cabinetName?: string
}

export interface AdminAlerts {
  loading: boolean
  pendingJustifications: JustificationAlert[]
  pendingAccounts: Profile[]
  submittedVariablesCount: number
  pendingLeavesCount: number
  total: number
  refresh: () => Promise<void>
}

export function useAdminAlerts(): AdminAlerts {
  const [loading, setLoading] = useState(true)
  const [pendingJustifications, setPendingJustifications] = useState<JustificationAlert[]>([])
  const [pendingAccounts, setPendingAccounts] = useState<Profile[]>([])
  const [submittedVariablesCount, setSubmittedVariablesCount] = useState(0)
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0)

  async function load() {
    const period = currentMonthPeriod()

    const [{ data: leaves }, { data: pending }, { count: submittedCount }, { count: leavesCount }, { data: profiles }, { data: cabinets }] =
      await Promise.all([
        supabase
          .from('leave_requests')
          .select('*')
          .neq('status', 'rejected')
          .in('leave_type', JUSTIFICATION_REQUIRED_TYPES),
        supabase.from('profiles').select('*').eq('cabinet_id', 'a-affecter').order('created_at', { ascending: false }),
        supabase
          .from('payroll_variables')
          .select('*', { count: 'exact', head: true })
          .eq('month_period', period)
          .eq('status', 'submitted'),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*'),
        supabase.from('cabinets').select('id, name').eq('active', true),
      ])

    const profileMap = new Map((profiles as Profile[] | null)?.map((p) => [p.id, p]))
    const cabinetNameMap = new Map((cabinets as { id: string; name: string }[] | null)?.map((c) => [c.id, c.name]))

    const missingOrUnvalidated = ((leaves as LeaveRequest[]) ?? [])
      .filter((l) => !l.justification_document_url || !l.justification_validated)
      .map((l) => ({
        ...l,
        employee: profileMap.get(l.employee_id),
        cabinetName: cabinetNameMap.get(l.cabinet_id),
      }))

    setPendingJustifications(missingOrUnvalidated)
    setPendingAccounts((pending as Profile[]) ?? [])
    setSubmittedVariablesCount(submittedCount ?? 0)
    setPendingLeavesCount(leavesCount ?? 0)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = pendingJustifications.length + pendingAccounts.length

  return {
    loading,
    pendingJustifications,
    pendingAccounts,
    submittedVariablesCount,
    pendingLeavesCount,
    total,
    refresh: load,
  }
}
