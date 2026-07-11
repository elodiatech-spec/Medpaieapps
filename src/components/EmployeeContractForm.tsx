import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import Card from './Card'
import type {
  MutuelleRegime,
  PrevoyanceCategory,
  Profile,
  RetirementTranche,
} from '../lib/database.types'

function toInputValue(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  )
}

// Contrat, congés payés, fiscalité et protection sociale : des décisions qui
// relèvent de l'employeur (ou de l'admin), pas de l'auto-déclaration par le
// salarié — d'où ce formulaire partagé entre la fiche cabinet (admin) et
// "Mon équipe" (médecin), à l'inverse de l'état civil que le salarié
// renseigne lui-même dans "Mon dossier".
export default function EmployeeContractForm({
  member,
  onSaved,
}: {
  member: Profile
  onSaved: (updated: Profile) => void
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState(() => ({
    position_title: toInputValue(member.position_title),
    coefficient: toInputValue(member.coefficient),
    contract_type: toInputValue(member.contract_type),
    work_time_type: toInputValue(member.work_time_type),
    hire_date: toInputValue(member.hire_date),
    contract_end_date: toInputValue(member.contract_end_date),
    weekly_hours: toInputValue(member.weekly_hours),
    base_salary: toInputValue(member.base_salary),
    trial_period_end: toInputValue(member.trial_period_end),
    contract_number: toInputValue(member.contract_number),
    paid_leave_acquired: toInputValue(member.paid_leave_acquired),
    paid_leave_taken: toInputValue(member.paid_leave_taken),
    pas_rate: toInputValue(member.pas_rate),
    pas_rate_type: toInputValue(member.pas_rate_type),
    pas_start_date: toInputValue(member.pas_start_date),
    mutuelle_affiliated: member.mutuelle_affiliated ?? false,
    mutuelle_date: toInputValue(member.mutuelle_date),
    mutuelle_regime: toInputValue(member.mutuelle_regime),
    mutuelle_waiver_reason: toInputValue(member.mutuelle_waiver_reason),
    prevoyance_affiliated: member.prevoyance_affiliated ?? false,
    prevoyance_date: toInputValue(member.prevoyance_date),
    prevoyance_category: toInputValue(member.prevoyance_category),
    retirement_tranche: toInputValue(member.retirement_tranche),
  }))

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      position_title: form.position_title || null,
      coefficient: form.coefficient || null,
      contract_type: (form.contract_type || null) as 'cdi' | 'cdd' | null,
      work_time_type: (form.work_time_type || null) as 'temps_plein' | 'temps_partiel' | null,
      hire_date: form.hire_date || null,
      contract_end_date: form.contract_end_date || null,
      weekly_hours: form.weekly_hours ? Number(form.weekly_hours) : null,
      base_salary: form.base_salary ? Number(form.base_salary) : null,
      trial_period_end: form.trial_period_end || null,
      contract_number: form.contract_number || null,
      paid_leave_acquired: form.paid_leave_acquired ? Number(form.paid_leave_acquired) : 0,
      paid_leave_taken: form.paid_leave_taken ? Number(form.paid_leave_taken) : 0,
      pas_rate: form.pas_rate ? Number(form.pas_rate) : null,
      pas_rate_type: (form.pas_rate_type || null) as Profile['pas_rate_type'],
      pas_start_date: form.pas_start_date || null,
      mutuelle_affiliated: form.mutuelle_affiliated,
      mutuelle_date: form.mutuelle_date || null,
      mutuelle_regime: (form.mutuelle_regime || null) as MutuelleRegime | null,
      mutuelle_waiver_reason: form.mutuelle_waiver_reason || null,
      prevoyance_affiliated: form.prevoyance_affiliated,
      prevoyance_date: form.prevoyance_date || null,
      prevoyance_category: (form.prevoyance_category || null) as PrevoyanceCategory | null,
      retirement_tranche: (form.retirement_tranche || null) as RetirementTranche | null,
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', member.id)
      .select()
      .single()

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setSaved(true)
    onSaved(data as Profile)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card title="Contrat de travail">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Poste / qualification" value={form.position_title} onChange={(v) => set('position_title', v)} />
          <Field label="Coefficient / niveau" value={form.coefficient} onChange={(v) => set('coefficient', v)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Type de contrat</label>
            <select
              value={form.contract_type}
              onChange={(e) => set('contract_type', e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">—</option>
              <option value="cdi">CDI</option>
              <option value="cdd">CDD</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Temps de travail</label>
            <select
              value={form.work_time_type}
              onChange={(e) => set('work_time_type', e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">—</option>
              <option value="temps_plein">Temps plein</option>
              <option value="temps_partiel">Temps partiel</option>
            </select>
          </div>
          <Field label="Heures par semaine" type="number" value={form.weekly_hours} onChange={(v) => set('weekly_hours', v)} />
          <Field label="Salaire de base (€)" type="number" value={form.base_salary} onChange={(v) => set('base_salary', v)} />
          <Field label="Date d'embauche" type="date" value={form.hire_date} onChange={(v) => set('hire_date', v)} />
          <Field label="Date de fin (si CDD)" type="date" value={form.contract_end_date} onChange={(v) => set('contract_end_date', v)} />
          <Field label="Fin de période d'essai" type="date" value={form.trial_period_end} onChange={(v) => set('trial_period_end', v)} />
          <Field label="Numéro de contrat" value={form.contract_number} onChange={(v) => set('contract_number', v)} />
        </div>
      </Card>

      <Card title="Congés payés">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Solde acquis (jours)" type="number" value={form.paid_leave_acquired} onChange={(v) => set('paid_leave_acquired', v)} />
          <Field label="Solde pris (jours)" type="number" value={form.paid_leave_taken} onChange={(v) => set('paid_leave_taken', v)} />
        </div>
      </Card>

      <Card title="Fiscalité — Prélèvement à la source">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Taux (%)" type="number" value={form.pas_rate} onChange={(v) => set('pas_rate', v)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Type de taux</label>
            <select
              value={form.pas_rate_type}
              onChange={(e) => set('pas_rate_type', e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">—</option>
              <option value="personnalise">Personnalisé</option>
              <option value="neutre">Neutre</option>
              <option value="individualise">Individualisé</option>
            </select>
          </div>
          <Field label="Date de début d'application" type="date" value={form.pas_start_date} onChange={(v) => set('pas_start_date', v)} />
        </div>
      </Card>

      <Card title="Protection sociale">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              id="mutuelle_affiliated"
              type="checkbox"
              checked={form.mutuelle_affiliated}
              onChange={(e) => set('mutuelle_affiliated', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="mutuelle_affiliated" className="text-sm font-medium text-slate-700">
              Affilié(e) à la mutuelle obligatoire
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date d'affiliation mutuelle" type="date" value={form.mutuelle_date} onChange={(v) => set('mutuelle_date', v)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Régime mutuelle</label>
              <select
                value={form.mutuelle_regime}
                onChange={(e) => set('mutuelle_regime', e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">—</option>
                <option value="isole">Isolé</option>
                <option value="famille">Famille</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Field label="Motif de dispense (si non affilié)" value={form.mutuelle_waiver_reason} onChange={(v) => set('mutuelle_waiver_reason', v)} />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
            <input
              id="prevoyance_affiliated"
              type="checkbox"
              checked={form.prevoyance_affiliated}
              onChange={(e) => set('prevoyance_affiliated', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="prevoyance_affiliated" className="text-sm font-medium text-slate-700">
              Affilié(e) à la prévoyance
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date d'affiliation prévoyance" type="date" value={form.prevoyance_date} onChange={(v) => set('prevoyance_date', v)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Catégorie prévoyance</label>
              <select
                value={form.prevoyance_category}
                onChange={(e) => set('prevoyance_category', e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">—</option>
                <option value="cadre">Cadre</option>
                <option value="non_cadre">Non cadre</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Tranche retraite complémentaire</label>
              <select
                value={form.retirement_tranche}
                onChange={(e) => set('retirement_tranche', e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">—</option>
                <option value="T1">T1</option>
                <option value="T2">T2</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-brand-700">Dossier mis à jour.</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
