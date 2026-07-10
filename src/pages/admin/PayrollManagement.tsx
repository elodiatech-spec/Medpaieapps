import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Download, FileSpreadsheet } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { currentMonthPeriod, formatMonthPeriod } from '../../lib/format'
import Card from '../../components/Card'
import type { Cabinet, PayrollVariable, Profile } from '../../lib/database.types'

const period = currentMonthPeriod()

interface CabinetRow {
  cabinet: Cabinet
  employeeCount: number
  submitted: number
  validated: number
  missing: number
}

export default function PayrollManagement() {
  const [rows, setRows] = useState<CabinetRow[]>([])
  const [allVariables, setAllVariables] = useState<(PayrollVariable & { employee?: Profile; cabinetName?: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [{ data: cabinetData }, { data: employeeData }, { data: variableData }] = await Promise.all([
        supabase.from('cabinets').select('*').eq('active', true).order('name'),
        supabase.from('profiles').select('*').eq('role', 'employee').eq('active', true),
        supabase.from('payroll_variables').select('*').eq('month_period', period),
      ])

      const cabinetList = (cabinetData as Cabinet[]) ?? []
      const employeeList = (employeeData as Profile[]) ?? []
      const variableList = (variableData as PayrollVariable[]) ?? []
      const employeeMap = new Map(employeeList.map((e) => [e.id, e]))
      const cabinetNameMap = new Map(cabinetList.map((c) => [c.id, c.name]))

      const computed: CabinetRow[] = cabinetList.map((cabinet) => {
        const cabinetEmployees = employeeList.filter((e) => e.cabinet_id === cabinet.id)
        const cabinetVariables = variableList.filter((v) => v.cabinet_id === cabinet.id)
        const submitted = cabinetVariables.filter((v) => v.status === 'submitted').length
        const validated = cabinetVariables.filter((v) => v.status === 'validated').length
        const declaredEmployeeIds = new Set(cabinetVariables.map((v) => v.employee_id))
        const missing = cabinetEmployees.filter((e) => !declaredEmployeeIds.has(e.id)).length
        return { cabinet, employeeCount: cabinetEmployees.length, submitted, validated, missing }
      })

      setRows(computed)
      setAllVariables(
        variableList.map((v) => ({
          ...v,
          employee: employeeMap.get(v.employee_id),
          cabinetName: cabinetNameMap.get(v.cabinet_id),
        })),
      )
      setLoading(false)
    })()
  }, [])

  function exportAllCsv() {
    const header = ['cabinet', 'nom', 'prenom', 'nir', 'mois', 'heures_sup_25', 'heures_sup_50', 'indemnites_km', 'primes', 'statut']
    const rowsCsv = allVariables.map((v) => [
      v.cabinetName ?? '',
      v.employee?.last_name ?? '',
      v.employee?.first_name ?? '',
      v.employee?.nir ?? '',
      v.month_period,
      v.overtime_hours_25,
      v.overtime_hours_50,
      v.kilometric_expenses,
      v.bonus_amount,
      v.status,
    ].join(';'))
    const csv = [header.join(';'), ...rowsCsv].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paie_tous_cabinets_${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportAllExcel() {
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Paie du mois')
    sheet.columns = [
      { header: 'Cabinet', key: 'cabinet', width: 24 },
      { header: 'Nom', key: 'nom', width: 18 },
      { header: 'Prénom', key: 'prenom', width: 18 },
      { header: 'NIR', key: 'nir', width: 18 },
      { header: 'Mois', key: 'mois', width: 12 },
      { header: 'Heures sup. 25%', key: 'hs25', width: 16 },
      { header: 'Heures sup. 50%', key: 'hs50', width: 16 },
      { header: 'Indemnités km', key: 'km', width: 16 },
      { header: 'Primes', key: 'primes', width: 12 },
      { header: 'Statut', key: 'statut', width: 12 },
    ]
    sheet.getRow(1).font = { bold: true }
    for (const v of allVariables) {
      sheet.addRow({
        cabinet: v.cabinetName ?? '',
        nom: v.employee?.last_name ?? '',
        prenom: v.employee?.first_name ?? '',
        nir: v.employee?.nir ?? '',
        mois: v.month_period,
        hs25: v.overtime_hours_25,
        hs50: v.overtime_hours_50,
        km: v.kilometric_expenses,
        primes: v.bonus_amount,
        statut: v.status,
      })
    }
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paie_tous_cabinets_${period}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p className="text-sm text-slate-600">Chargement…</p>

  const totalMissing = rows.reduce((sum, r) => sum + r.missing, 0)
  const totalSubmitted = rows.reduce((sum, r) => sum + r.submitted, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 capitalize">
          Gestion de paie — {formatMonthPeriod(period)}
        </h1>
        <p className="text-sm text-slate-600">
          Vue d'ensemble des variables de paie du mois, tous cabinets actifs confondus.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-lg bg-brand-50 px-3 py-2 font-medium text-brand-700">
              {totalSubmitted} soumise(s) à valider
            </span>
            {totalMissing > 0 && (
              <span className="rounded-lg bg-amber-50 px-3 py-2 font-medium text-amber-700">
                {totalMissing} salarié(s) n'ont encore rien saisi
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportAllCsv}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download size={14} /> Tout exporter (CSV)
            </button>
            <button
              onClick={exportAllExcel}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileSpreadsheet size={14} /> Tout exporter (Excel)
            </button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {rows.map(({ cabinet, employeeCount, submitted, validated, missing }) => (
          <Link
            key={cabinet.id}
            to={`/cabinets/${cabinet.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:shadow-deep hover:ring-2 hover:ring-brand-200"
          >
            <div>
              <p className="font-medium text-slate-900">{cabinet.name}</p>
              <p className="text-sm text-slate-600">{employeeCount} salarié(s) actif(s)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2 text-xs">
                {validated > 0 && (
                  <span className="rounded-full bg-brand-100 px-2 py-1 font-medium text-brand-700">
                    {validated} validée(s)
                  </span>
                )}
                {submitted > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700">
                    {submitted} à valider
                  </span>
                )}
                {missing > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-1 font-medium text-red-700">
                    {missing} manquante(s)
                  </span>
                )}
                {validated === 0 && submitted === 0 && missing === 0 && (
                  <span className="text-slate-500">Aucun salarié</span>
                )}
              </div>
              <ArrowRight size={18} className="text-slate-400" />
            </div>
          </Link>
        ))}
        {rows.length === 0 && (
          <Card>
            <p className="text-sm text-slate-600">Aucun cabinet actif pour le moment.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
