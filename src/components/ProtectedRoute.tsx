import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../lib/database.types'

function BlockedMessage({ message, onSignOut }: { message: string; onSignOut: () => void }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm text-slate-600">{message}</p>
      <button
        onClick={onSignOut}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Se déconnecter
      </button>
    </div>
  )
}

export default function ProtectedRoute({
  children,
  allow,
}: {
  children: ReactNode
  allow?: Role[]
}) {
  const { session, profile, cabinetActive, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-slate-600">
        Chargement…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (!profile) {
    return (
      <BlockedMessage
        message="Votre compte est authentifié, mais aucun profil cabinet n'est associé à votre adresse e-mail. Contactez votre administrateur Elodiatech."
        onSignOut={signOut}
      />
    )
  }

  if (!profile.active) {
    return (
      <BlockedMessage
        message="Ce compte a été désactivé. Contactez votre administrateur Elodiatech si vous pensez qu'il s'agit d'une erreur."
        onSignOut={signOut}
      />
    )
  }

  // Le rôle admin gère tous les cabinets, indépendamment du statut de l'un d'eux.
  if (profile.role !== 'admin') {
    if (profile.cabinet_id === 'a-affecter') {
      return (
        <BlockedMessage
          message="Ton compte a bien été créé mais n'est pas encore affecté à un cabinet. Contacte ton administrateur Elodiatech."
          onSignOut={signOut}
        />
      )
    }
    if (!cabinetActive) {
      return (
        <BlockedMessage
          message="Le cabinet auquel ce compte est rattaché a été désactivé. Contactez votre administrateur Elodiatech si vous pensez qu'il s'agit d'une erreur."
          onSignOut={signOut}
        />
      )
    }
  }

  if (allow && !allow.includes(profile.role)) return <Navigate to="/" replace />

  return <>{children}</>
}
