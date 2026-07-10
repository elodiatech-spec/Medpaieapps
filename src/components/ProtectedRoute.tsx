import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../lib/database.types'

export default function ProtectedRoute({
  children,
  allow,
}: {
  children: ReactNode
  allow?: Role[]
}) {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-slate-500">
        Chargement…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (!profile) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-slate-600">
          Votre compte est authentifié, mais aucun profil cabinet n'est associé à votre
          adresse e-mail. Contactez votre administrateur Elodiatech.
        </p>
        <button
          onClick={() => signOut()}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Se déconnecter
        </button>
      </div>
    )
  }

  if (allow && !allow.includes(profile.role)) return <Navigate to="/" replace />

  return <>{children}</>
}
