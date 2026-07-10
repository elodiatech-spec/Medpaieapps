import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-brand-50 px-4 text-center">
      <Logo size={48} />
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Page introuvable</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cette adresse ne correspond à aucune page de MedPaie.
        </p>
      </div>
      <Link
        to="/"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Retour à l'accueil
      </Link>
    </div>
  )
}
