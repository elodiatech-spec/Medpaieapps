import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Copy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card'
import { PLAN_LABELS, type BillingCommitment, type Cabinet, type Plan, type Profile } from '../../lib/database.types'

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base || 'cabinet'}-${suffix}`
}

export default function AdminHome() {
  const [cabinets, setCabinets] = useState<Cabinet[]>([])
  const [headcounts, setHeadcounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [department, setDepartment] = useState<'Guadeloupe' | 'Martinique'>('Martinique')
  const [plan, setPlan] = useState<Plan>('medi_paie_solo')
  const [billing, setBilling] = useState<BillingCommitment>('engagement_12_mois')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingAccounts, setPendingAccounts] = useState<Profile[]>([])
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  async function load() {
    const { data: cabinetData } = await supabase
      .from('cabinets')
      .select('*')
      .eq('active', true)
      .order('name')

    const { data: profileData } = await supabase
      .from('profiles')
      .select('cabinet_id, role')
      .eq('role', 'employee')

    const { data: pending } = await supabase
      .from('profiles')
      .select('*')
      .eq('cabinet_id', 'a-affecter')
      .order('created_at', { ascending: false })

    const counts: Record<string, number> = {}
    for (const p of profileData ?? []) {
      counts[p.cabinet_id] = (counts[p.cabinet_id] ?? 0) + 1
    }
    setHeadcounts(counts)
    setCabinets((cabinetData as Cabinet[]) ?? [])
    setPendingAccounts((pending as Profile[]) ?? [])
    setLoading(false)
  }

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 1500)
  }

  useEffect(() => {
    load()
  }, [])

  async function createCabinet(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setFormError(null)
    const { error } = await supabase.from('cabinets').insert({
      id: slugify(name),
      name: name.trim(),
      city: city.trim() || null,
      department,
      plan,
      billing_commitment: billing,
      active: true,
    })
    setSaving(false)
    if (error) {
      setFormError(error.message)
      return
    }
    setName('')
    setCity('')
    await load()
  }

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Pilotage multi-cabinets</h1>
        <p className="text-sm text-slate-500">{cabinets.length} cabinet(s) actif(s)</p>
      </div>

      {pendingAccounts.length > 0 && (
        <Card title="Comptes en attente d'affectation">
          <p className="mb-3 text-sm text-slate-500">
            Ces personnes ont créé leur compte mais ne sont affectées à aucun cabinet. Copie
            l'e-mail et va sur la fiche du bon cabinet pour les affecter.
          </p>
          <div className="flex flex-col divide-y divide-slate-100">
            {pendingAccounts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    {p.first_name} {p.last_name}
                  </p>
                  <p className="text-slate-500">{p.email}</p>
                </div>
                <button
                  onClick={() => copyEmail(p.email)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Copy size={12} /> {copiedEmail === p.email ? 'Copié !' : "Copier l'e-mail"}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {cabinets.map((cabinet) => (
          <Link
            key={cabinet.id}
            to={`/cabinets/${cabinet.id}`}
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:ring-brand-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Building2 size={18} />
              </div>
              <div>
                <p className="font-medium text-slate-900">{cabinet.name}</p>
                <p className="text-sm text-slate-500">
                  {PLAN_LABELS[cabinet.plan]} · {headcounts[cabinet.id] ?? 0} salarié(s)
                  {cabinet.city ? ` · ${cabinet.city}` : ''}
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400" />
          </Link>
        ))}
        {cabinets.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">Aucun cabinet actif pour le moment.</p>
          </Card>
        )}
      </div>

      <Card title="Nouveau cabinet">
        <form onSubmit={createCabinet} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Nom du cabinet</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr Martin — Cabinet de Fort-de-France"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Ville (optionnel)</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Département</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as 'Guadeloupe' | 'Martinique')}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="Martinique">Martinique</option>
                <option value="Guadeloupe">Guadeloupe</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Offre</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as Plan)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {Object.entries(PLAN_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Engagement</label>
              <select
                value={billing}
                onChange={(e) => setBilling(e.target.value as BillingCommitment)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="engagement_12_mois">Avec engagement (12 mois)</option>
                <option value="sans_engagement">Sans engagement</option>
              </select>
            </div>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Créer le cabinet
          </button>
        </form>
      </Card>
    </div>
  )
}
