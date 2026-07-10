import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card'
import { PLAN_LABELS, type BillingCommitment, type Cabinet, type Plan } from '../../lib/database.types'

function toInputValue(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

export default function CabinetEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cabinet, setCabinet] = useState<Cabinet | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data } = await supabase.from('cabinets').select('*').eq('id', id).single()
      const cab = data as Cabinet | null
      setCabinet(cab)
      if (cab) {
        setForm({
          name: cab.name,
          city: toInputValue(cab.city),
          department: cab.department ?? 'Martinique',
          plan: cab.plan,
          billing_commitment: cab.billing_commitment,
          siret: toInputValue(cab.siret),
          naf_code: toInputValue(cab.naf_code),
          address: toInputValue(cab.address),
          contact_phone: toInputValue(cab.contact_phone),
          contact_email: toInputValue(cab.contact_email),
          convention_code: toInputValue(cab.convention_code),
          at_mp_risk_code: toInputValue(cab.at_mp_risk_code),
          at_mp_rate: toInputValue(cab.at_mp_rate),
          bank_iban: toInputValue(cab.bank_iban),
          bank_bic: toInputValue(cab.bank_bic),
          urssaf_region: toInputValue(cab.urssaf_region),
          retirement_org: toInputValue(cab.retirement_org),
          prevoyance_org_name: toInputValue(cab.prevoyance_org_name),
          prevoyance_contract_number: toInputValue(cab.prevoyance_contract_number),
          mutuelle_org_name: toInputValue(cab.mutuelle_org_name),
          mutuelle_contract_number: toInputValue(cab.mutuelle_contract_number),
        })
      }
      setLoading(false)
    })()
  }, [id])

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('cabinets')
      .update({
        name: form.name.trim(),
        city: form.city.trim() || null,
        department: form.department,
        plan: form.plan,
        billing_commitment: form.billing_commitment,
        siret: form.siret.trim() || null,
        naf_code: form.naf_code.trim() || null,
        address: form.address.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        convention_code: form.convention_code.trim() || null,
        at_mp_risk_code: form.at_mp_risk_code.trim() || null,
        at_mp_rate: form.at_mp_rate ? Number(form.at_mp_rate) : null,
        bank_iban: form.bank_iban.trim() || null,
        bank_bic: form.bank_bic.trim() || null,
        urssaf_region: form.urssaf_region.trim() || null,
        retirement_org: form.retirement_org.trim() || null,
        prevoyance_org_name: form.prevoyance_org_name.trim() || null,
        prevoyance_contract_number: form.prevoyance_contract_number.trim() || null,
        mutuelle_org_name: form.mutuelle_org_name.trim() || null,
        mutuelle_contract_number: form.mutuelle_contract_number.trim() || null,
      })
      .eq('id', id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setSaved(true)
  }

  async function toggleActive() {
    if (!id || !cabinet) return
    const { error } = await supabase
      .from('cabinets')
      .update({ active: !cabinet.active })
      .eq('id', id)
    if (!error) {
      if (cabinet.active) {
        navigate('/', { replace: true })
      } else {
        setCabinet({ ...cabinet, active: true })
      }
    }
  }

  if (loading || !cabinet) return <p className="text-sm text-slate-500">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={`/cabinets/${id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Retour au cabinet
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Modifier {cabinet.name}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card title="Informations générales">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom du cabinet" value={form.name} onChange={(v) => set('name', v)} span2 />
            <Field label="Ville" value={form.city} onChange={(v) => set('city', v)} />
            <SelectField
              label="Département"
              value={form.department}
              onChange={(v) => set('department', v)}
              options={[
                ['Martinique', 'Martinique'],
                ['Guadeloupe', 'Guadeloupe'],
              ]}
            />
            <SelectField
              label="Offre"
              value={form.plan}
              onChange={(v) => set('plan', v)}
              options={Object.entries(PLAN_LABELS) as [Plan, string][]}
            />
            <SelectField
              label="Engagement"
              value={form.billing_commitment}
              onChange={(v) => set('billing_commitment', v as BillingCommitment)}
              options={[
                ['engagement_12_mois', 'Avec engagement (12 mois)'],
                ['sans_engagement', 'Sans engagement'],
              ]}
            />
          </div>
        </Card>

        <Card title="Identité de l'entreprise">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SIRET" value={form.siret} onChange={(v) => set('siret', v)} />
            <Field label="Code NAF / APE" value={form.naf_code} onChange={(v) => set('naf_code', v)} />
            <Field label="Adresse complète" value={form.address} onChange={(v) => set('address', v)} span2 />
            <Field label="Téléphone" value={form.contact_phone} onChange={(v) => set('contact_phone', v)} />
            <Field label="E-mail" value={form.contact_email} onChange={(v) => set('contact_email', v)} />
            <Field
              label="Convention collective (IDCC) / OPCO"
              value={form.convention_code}
              onChange={(v) => set('convention_code', v)}
              span2
            />
          </div>
        </Card>

        <Card title="Accident du travail / Maladie professionnelle">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Code risque AT/MP" value={form.at_mp_risk_code} onChange={(v) => set('at_mp_risk_code', v)} />
            <Field label="Taux AT/MP (%)" type="number" value={form.at_mp_rate} onChange={(v) => set('at_mp_rate', v)} />
            <Field label="URSSAF de rattachement" value={form.urssaf_region} onChange={(v) => set('urssaf_region', v)} span2 />
          </div>
        </Card>

        <Card title="Banque de l'entreprise">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="IBAN" value={form.bank_iban} onChange={(v) => set('bank_iban', v)} />
            <Field label="BIC" value={form.bank_bic} onChange={(v) => set('bank_bic', v)} />
          </div>
        </Card>

        <Card title="Organismes de cotisation">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Retraite complémentaire" value={form.retirement_org} onChange={(v) => set('retirement_org', v)} span2 />
            <Field label="Organisme prévoyance" value={form.prevoyance_org_name} onChange={(v) => set('prevoyance_org_name', v)} />
            <Field label="N° contrat prévoyance" value={form.prevoyance_contract_number} onChange={(v) => set('prevoyance_contract_number', v)} />
            <Field label="Organisme mutuelle" value={form.mutuelle_org_name} onChange={(v) => set('mutuelle_org_name', v)} />
            <Field label="N° contrat mutuelle" value={form.mutuelle_contract_number} onChange={(v) => set('mutuelle_contract_number', v)} />
          </div>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-brand-700">Cabinet mis à jour.</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={toggleActive}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            {cabinet.active ? 'Désactiver ce cabinet' : 'Réactiver ce cabinet'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  span2 = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  span2?: boolean
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? 'sm:col-span-2' : ''}`}>
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  )
}
