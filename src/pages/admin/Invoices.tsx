import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatMonthPeriod } from '../../lib/format'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import type { Cabinet, Invoice } from '../../lib/database.types'

export default function Invoices() {
  const [invoices, setInvoices] = useState<(Invoice & { cabinet?: Cabinet })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [{ data: inv }, { data: cabs }] = await Promise.all([
        supabase.from('invoices').select('*').order('period', { ascending: false }),
        supabase.from('cabinets').select('*'),
      ])
      const byCabinet = new Map((cabs as Cabinet[] | null)?.map((c) => [c.id, c]))
      setInvoices(((inv as Invoice[]) ?? []).map((i) => ({ ...i, cabinet: byCabinet.get(i.cabinet_id) })))
      setLoading(false)
    })()
  }, [])

  if (loading) return <p className="text-sm text-slate-600">Chargement…</p>

  const totalTTC = invoices.reduce((sum, i) => sum + i.amount_ttc, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Facturation</h1>
        <p className="text-sm text-slate-600">{formatCurrency(totalTTC)} TTC au total</p>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-600">
            Aucune facture générée pour le moment. La génération mensuelle automatisée (Edge
            Function) créera une ligne ici le 1er de chaque mois.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{inv.cabinet?.name ?? inv.cabinet_id}</p>
                  <p className="text-slate-600 capitalize">
                    {formatMonthPeriod(inv.period)} · {inv.headcount} salarié(s)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900">{formatCurrency(inv.amount_ttc)}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
