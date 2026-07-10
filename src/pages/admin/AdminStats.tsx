import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/format'
import Card from '../../components/Card'
import TrendChart from '../../components/TrendChart'
import {
  PLAN_LABELS,
  PLAN_PRICES,
  type Cabinet,
  type Invoice,
  type Plan,
} from '../../lib/database.types'

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

export default function AdminStats() {
  const [loading, setLoading] = useState(true)
  const [cabinets, setCabinets] = useState<Cabinet[]>([])
  const [headcount, setHeadcount] = useState(0)
  const [revenueData, setRevenueData] = useState<{ label: string; value: number }[]>([])

  useEffect(() => {
    ;(async () => {
      const months = lastMonths(12)

      const [{ data: cabinetData }, { count: employeeCount }, { data: invoiceData }] = await Promise.all([
        supabase.from('cabinets').select('*').eq('active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employee'),
        supabase.from('invoices').select('*').gte('period', months[0]),
      ])

      const cabinetList = (cabinetData as Cabinet[]) ?? []
      const invoiceList = (invoiceData as Invoice[]) ?? []

      const revenue = months.map((month) => {
        const total = invoiceList
          .filter((inv) => inv.period === month)
          .reduce((sum, inv) => sum + Number(inv.amount_ttc), 0)
        return { label: monthLabel(month), value: Math.round(total) }
      })

      setCabinets(cabinetList)
      setHeadcount(employeeCount ?? 0)
      setRevenueData(revenue)
      setLoading(false)
    })()
  }, [])

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>

  const mrr = cabinets.reduce((sum, c) => {
    const price = PLAN_PRICES[c.plan]
    return sum + (c.billing_commitment === 'engagement_12_mois' ? price.engaged : price.free)
  }, 0)

  const planCounts = cabinets.reduce((acc, c) => {
    acc[c.plan] = (acc[c.plan] ?? 0) + 1
    return acc
  }, {} as Record<Plan, number>)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Chiffre d'affaires</h1>
        <p className="text-sm text-slate-500">Vue d'ensemble sur tous les cabinets actifs</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium text-slate-500">MRR estimé</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(mrr)}</p>
          <p className="mt-0.5 text-xs text-slate-400">Par mois, tarifs en vigueur</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">Cabinets actifs</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{cabinets.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">Salariés suivis</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{headcount}</p>
        </Card>
      </div>

      <Card>
        <TrendChart
          title="Revenu facturé (12 derniers mois)"
          data={revenueData}
          kind="line"
          color="#0891b2"
          unit=" €"
        />
      </Card>

      <Card title="Répartition par offre">
        <div className="flex flex-col divide-y divide-slate-100">
          {Object.entries(PLAN_LABELS).map(([value, label]) => {
            const count = planCounts[value as Plan] ?? 0
            const pct = cabinets.length > 0 ? Math.round((count / cabinets.length) * 100) : 0
            return (
              <div key={value} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-slate-500">
                  {count} cabinet(s) {cabinets.length > 0 ? `· ${pct}%` : ''}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
