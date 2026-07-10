import { useState, type FormEvent } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/AuthLayout'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Login() {
  const { session, signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError(error)
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accède à ton espace MedPaie."
      footer={
        <>
          <Link
            to="/mot-de-passe-oublie"
            className="mt-4 block text-center text-sm text-slate-600 hover:text-slate-800"
          >
            Mot de passe oublié ?
          </Link>
          <Link
            to="/inscription"
            className="mt-2 block text-center text-sm text-slate-600 hover:text-slate-800"
          >
            Pas encore de compte ? Créer un compte
          </Link>
          <Link
            to="/mentions-legales"
            className="mt-6 block text-center text-xs text-slate-400 hover:text-slate-600"
          >
            Mentions légales &amp; confidentialité
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Configuration Supabase manquante : les variables VITE_SUPABASE_URL et
          VITE_SUPABASE_ANON_KEY ne sont pas renseignées sur ce déploiement.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="vous@cabinet.fr"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </AuthLayout>
  )
}
