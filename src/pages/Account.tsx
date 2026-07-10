import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/Card'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur Elodiatech',
  employer: 'Médecin employeur',
  employee: 'Assistante médicale',
}

export default function Account() {
  const { profile, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    setPassword('')
    setConfirm('')
    setSuccess(true)
  }

  if (!profile) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Mon compte</h1>
        <p className="text-sm text-slate-500">
          {profile.first_name} {profile.last_name} · {ROLE_LABELS[profile.role]}
        </p>
      </div>

      <Card title="Informations">
        <div className="flex flex-col divide-y divide-slate-100 text-sm">
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500">E-mail</span>
            <span className="font-medium text-slate-900">{profile.email}</span>
          </div>
        </div>
      </Card>

      <Card title="Changer de mot de passe">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="••••••••"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-sm font-medium text-slate-700">
              Confirme le mot de passe
            </label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-brand-700">Mot de passe mis à jour.</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </Card>
    </div>
  )
}
