import { useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card'
import type {
  Gender,
  MutuelleRegime,
  PasRateType,
  PrevoyanceCategory,
  RetirementTranche,
} from '../../lib/database.types'

function toInputValue(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

export default function MyFile() {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState(() => ({
    // État civil
    birth_name: toInputValue(profile?.birth_name),
    birth_date: toInputValue(profile?.birth_date),
    birth_place: toInputValue(profile?.birth_place),
    gender: toInputValue(profile?.gender),
    address: toInputValue(profile?.address),
    nir: toInputValue(profile?.nir),
    ntt: toInputValue(profile?.ntt),
    phone: toInputValue(profile?.phone),
    iban: toInputValue(profile?.iban),
    // Contrat de travail
    position_title: toInputValue(profile?.position_title),
    contract_type: toInputValue(profile?.contract_type),
    work_time_type: toInputValue(profile?.work_time_type),
    hire_date: toInputValue(profile?.hire_date),
    contract_end_date: toInputValue(profile?.contract_end_date),
    weekly_hours: toInputValue(profile?.weekly_hours),
    coefficient: toInputValue(profile?.coefficient),
    base_salary: toInputValue(profile?.base_salary),
    trial_period_end: toInputValue(profile?.trial_period_end),
    contract_number: toInputValue(profile?.contract_number),
    // Congés payés
    paid_leave_acquired: toInputValue(profile?.paid_leave_acquired),
    paid_leave_taken: toInputValue(profile?.paid_leave_taken),
    // Fiscalité
    pas_rate: toInputValue(profile?.pas_rate),
    pas_rate_type: toInputValue(profile?.pas_rate_type),
    pas_start_date: toInputValue(profile?.pas_start_date),
    // Protection sociale
    mutuelle_affiliated: profile?.mutuelle_affiliated ?? false,
    mutuelle_date: toInputValue(profile?.mutuelle_date),
    mutuelle_regime: toInputValue(profile?.mutuelle_regime),
    mutuelle_waiver_reason: toInputValue(profile?.mutuelle_waiver_reason),
    prevoyance_affiliated: profile?.prevoyance_affiliated ?? false,
    prevoyance_date: toInputValue(profile?.prevoyance_date),
    prevoyance_category: toInputValue(profile?.prevoyance_category),
    retirement_tranche: toInputValue(profile?.retirement_tranche),
  }))

  if (!profile) return null

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setError(null)

    const payload = {
      birth_name: form.birth_name || null,
      birth_date: form.birth_date || null,
      birth_place: form.birth_place || null,
      gender: (form.gender || null) as Gender | null,
      address: form.address || null,
      nir: form.nir || null,
      ntt: form.ntt || null,
      phone: form.phone || null,
      iban: form.iban || null,
      position_title: form.position_title || null,
      contract_type: (form.contract_type || null) as 'cdi' | 'cdd' | null,
      work_time_type: (form.work_time_type || null) as 'temps_plein' | 'temps_partiel' | null,
      hire_date: form.hire_date || null,
      contract_end_date: form.contract_end_date || null,
      weekly_hours: form.weekly_hours ? Number(form.weekly_hours) : null,
      coefficient: form.coefficient || null,
      base_salary: form.base_salary ? Number(form.base_salary) : null,
      trial_period_end: form.trial_period_end || null,
      contract_number: form.contract_number || null,
      paid_leave_acquired: form.paid_leave_acquired ? Number(form.paid_leave_acquired) : 0,
      paid_leave_taken: form.paid_leave_taken ? Number(form.paid_leave_taken) : 0,
      pas_rate: form.pas_rate ? Number(form.pas_rate) : null,
      pas_rate_type: (form.pas_rate_type || null) as PasRateType | null,
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

    const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setSaved(true)
    await refreshProfile()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Mon dossier</h1>
        <p className="text-sm text-slate-600">
          Ces informations servent à établir ton contrat et ton bulletin de paie dans
          macompta.fr.
        </p>
      </div>

      <Card title="État civil">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom de naissance" value={form.birth_name} onChange={(v) => set('birth_name', v)} />
          <Field label="Date de naissance" type="date" value={form.birth_date} onChange={(v) => set('birth_date', v)} />
          <Field label="Lieu de naissance" value={form.birth_place} onChange={(v) => set('birth_place', v)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Sexe</label>
            <select
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">—</option>
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
            </select>
          </div>
          <Field label="Numéro de Sécurité sociale (NIR)" value={form.nir} onChange={(v) => set('nir', v)} />
          <Field
            label="NTT (si NIR pas encore connu)"
            value={form.ntt}
            onChange={(v) => set('ntt', v)}
          />
          <Field label="Téléphone" value={form.phone} onChange={(v) => set('phone', v)} />
          <Field label="RIB (IBAN)" value={form.iban} onChange={(v) => set('iban', v)} />
          <div className="sm:col-span-2">
            <Field label="Adresse complète" value={form.address} onChange={(v) => set('address', v)} />
          </div>
        </div>
      </Card>

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
          <Field
            label="Solde acquis (jours)"
            type="number"
            value={form.paid_leave_acquired}
            onChange={(v) => set('paid_leave_acquired', v)}
          />
          <Field
            label="Solde pris (jours)"
            type="number"
            value={form.paid_leave_taken}
            onChange={(v) => set('paid_leave_taken', v)}
          />
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
          <Field
            label="Date de début d'application"
            type="date"
            value={form.pas_start_date}
            onChange={(v) => set('pas_start_date', v)}
          />
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
              <Field
                label="Motif de dispense (si non affilié)"
                value={form.mutuelle_waiver_reason}
                onChange={(v) => set('mutuelle_waiver_reason', v)}
              />
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
      {saved && <p className="text-sm text-brand-700">Dossier enregistré.</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer mon dossier'}
      </button>
    </form>
  )
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
