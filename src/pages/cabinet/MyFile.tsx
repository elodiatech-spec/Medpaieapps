import { useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import Card from '../../components/Card'
import InfoRow from '../../components/InfoRow'
import type { Gender } from '../../lib/database.types'

function toInputValue(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function safeDate(d: string | null): string | null {
  return d ? formatDate(d) : null
}

export default function MyFile() {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState(() => ({
    birth_name: toInputValue(profile?.birth_name),
    birth_date: toInputValue(profile?.birth_date),
    birth_place: toInputValue(profile?.birth_place),
    gender: toInputValue(profile?.gender),
    address: toInputValue(profile?.address),
    nir: toInputValue(profile?.nir),
    ntt: toInputValue(profile?.ntt),
    phone: toInputValue(profile?.phone),
    iban: toInputValue(profile?.iban),
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Mon dossier</h1>
        <p className="text-sm text-slate-600">
          Renseigne ton état civil ci-dessous — il sert à établir ton contrat et ton bulletin de
          paie. Les autres informations (contrat, congés, fiscalité, protection sociale) sont
          gérées par ton médecin employeur ou ton gestionnaire Elodiatech.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
            <Field label="NTT (si NIR pas encore connu)" value={form.ntt} onChange={(v) => set('ntt', v)} />
            <Field label="Téléphone" value={form.phone} onChange={(v) => set('phone', v)} />
            <Field label="RIB (IBAN)" value={form.iban} onChange={(v) => set('iban', v)} />
            <div className="sm:col-span-2">
              <Field label="Adresse complète" value={form.address} onChange={(v) => set('address', v)} />
            </div>
          </div>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-brand-700">État civil enregistré.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-fit rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer mon état civil'}
        </button>
      </form>

      <Card title="Contrat de travail">
        <div className="flex flex-col divide-y divide-slate-100">
          <InfoRow label="Poste / qualification" value={profile.position_title} />
          <InfoRow label="Coefficient / niveau" value={profile.coefficient} />
          <InfoRow label="Type de contrat" value={profile.contract_type?.toUpperCase()} />
          <InfoRow
            label="Temps de travail"
            value={
              profile.work_time_type === 'temps_plein'
                ? 'Temps plein'
                : profile.work_time_type === 'temps_partiel'
                  ? 'Temps partiel'
                  : null
            }
          />
          <InfoRow label="Heures par semaine" value={profile.weekly_hours} />
          <InfoRow label="Salaire de base" value={profile.base_salary ? `${profile.base_salary} €` : null} />
          <InfoRow label="Date d'embauche" value={safeDate(profile.hire_date)} />
          <InfoRow label="Date de fin (CDD)" value={safeDate(profile.contract_end_date)} />
          <InfoRow label="Fin de période d'essai" value={safeDate(profile.trial_period_end)} />
          <InfoRow label="Numéro de contrat" value={profile.contract_number} />
        </div>
      </Card>

      <Card title="Congés payés">
        <div className="flex flex-col divide-y divide-slate-100">
          <InfoRow label="Solde acquis" value={profile.paid_leave_acquired != null ? `${profile.paid_leave_acquired} j` : null} />
          <InfoRow label="Solde pris" value={profile.paid_leave_taken != null ? `${profile.paid_leave_taken} j` : null} />
        </div>
      </Card>

      <Card title="Fiscalité — Prélèvement à la source">
        <div className="flex flex-col divide-y divide-slate-100">
          <InfoRow label="Taux" value={profile.pas_rate != null ? `${profile.pas_rate} %` : null} />
          <InfoRow label="Type de taux" value={profile.pas_rate_type} />
          <InfoRow label="Date de début" value={safeDate(profile.pas_start_date)} />
        </div>
      </Card>

      <Card title="Protection sociale">
        <div className="flex flex-col divide-y divide-slate-100">
          <InfoRow label="Mutuelle" value={profile.mutuelle_affiliated ? 'Affilié(e)' : 'Non affilié(e)'} />
          <InfoRow label="Date d'affiliation mutuelle" value={safeDate(profile.mutuelle_date)} />
          <InfoRow label="Régime mutuelle" value={profile.mutuelle_regime} />
          <InfoRow label="Motif de dispense" value={profile.mutuelle_waiver_reason} />
          <InfoRow label="Prévoyance" value={profile.prevoyance_affiliated ? 'Affilié(e)' : 'Non affilié(e)'} />
          <InfoRow label="Date d'affiliation prévoyance" value={safeDate(profile.prevoyance_date)} />
          <InfoRow label="Catégorie prévoyance" value={profile.prevoyance_category} />
          <InfoRow label="Tranche retraite complémentaire" value={profile.retirement_tranche} />
        </div>
      </Card>
    </div>
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
