import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card'
import type { PortalCredential } from '../../lib/database.types'

const SUGGESTED_PORTALS = [
  { name: 'URSSAF', url: 'https://www.urssaf.fr' },
  { name: 'Net-Entreprises', url: 'https://www.net-entreprises.fr' },
  { name: 'Retraite complémentaire', url: '' },
  { name: 'Mutuelle', url: '' },
]

export default function Portals() {
  const { id } = useParams<{ id: string }>()
  const [credentials, setCredentials] = useState<PortalCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState<Record<string, string>>({})

  const [portalName, setPortalName] = useState('')
  const [portalUrl, setPortalUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!id) return
    const { data } = await supabase
      .from('portal_credentials')
      .select('*')
      .eq('cabinet_id', id)
      .order('portal_name')
    setCredentials((data as PortalCredential[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function addCredential(e: FormEvent) {
    e.preventDefault()
    if (!id || !portalName.trim()) return
    setSaving(true)
    setError(null)

    const { data, error } = await supabase
      .from('portal_credentials')
      .insert({
        cabinet_id: id,
        portal_name: portalName.trim(),
        portal_url: portalUrl.trim() || null,
        username: username.trim() || null,
        notes: notes.trim() || null,
      })
      .select()
      .single()

    if (error || !data) {
      setSaving(false)
      setError(error?.message ?? 'Erreur inconnue')
      return
    }

    if (password) {
      const { error: pwError } = await supabase.rpc('set_portal_password', {
        p_id: data.id,
        p_password: password,
      })
      if (pwError) {
        setSaving(false)
        setError(pwError.message)
        return
      }
    }

    setPortalName('')
    setPortalUrl('')
    setUsername('')
    setPassword('')
    setNotes('')
    setSaving(false)
    await load()
  }

  async function reveal(credId: string) {
    if (revealed[credId]) {
      setRevealed((r) => {
        const next = { ...r }
        delete next[credId]
        return next
      })
      return
    }
    const { data, error } = await supabase.rpc('get_portal_password', { p_id: credId })
    if (!error) {
      setRevealed((r) => ({ ...r, [credId]: (data as string) ?? '(aucun mot de passe enregistré)' }))
    }
  }

  async function remove(credId: string) {
    if (!confirm('Supprimer cet accès ? Cette action est définitive.')) return
    await supabase.from('portal_credentials').delete().eq('id', credId)
    await load()
  }

  if (loading) return <p className="text-sm text-slate-600">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={`/cabinets/${id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Retour au cabinet
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Portails & coffre-fort</h1>
        <p className="text-sm text-slate-600">
          Les mots de passe sont chiffrés en base (Supabase Vault) et ne sont déchiffrés qu'à
          la demande, pour l'administrateur uniquement.
        </p>
      </div>

      <Card title="Accès enregistrés">
        {credentials.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun accès enregistré pour ce cabinet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {credentials.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{c.portal_name}</p>
                  <div className="flex items-center gap-2">
                    {c.portal_url && (
                      <a
                        href={c.portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Ouvrir <ExternalLink size={12} />
                      </a>
                    )}
                    <button
                      onClick={() => remove(c.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {c.username && <p className="text-sm text-slate-600">Identifiant : {c.username}</p>}
                {c.notes && <p className="text-sm text-slate-600">{c.notes}</p>}
                <button
                  onClick={() => reveal(c.id)}
                  className="flex w-fit items-center gap-1.5 text-xs font-medium text-brand-700"
                >
                  {revealed[c.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  {revealed[c.id] ? `Masquer (${revealed[c.id]})` : 'Voir le mot de passe'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Ajouter un accès">
        <form onSubmit={addCredential} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Portail</label>
            <input
              list="portal-suggestions"
              type="text"
              required
              value={portalName}
              onChange={(e) => setPortalName(e.target.value)}
              placeholder="URSSAF, Net-Entreprises, Mutuelle…"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <datalist id="portal-suggestions">
              {SUGGESTED_PORTALS.map((p) => (
                <option key={p.name} value={p.name} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Lien du portail</label>
            <input
              type="url"
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
              placeholder="https://…"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Identifiant</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Notes (optionnel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Enregistrer l'accès
          </button>
        </form>
      </Card>
    </div>
  )
}
