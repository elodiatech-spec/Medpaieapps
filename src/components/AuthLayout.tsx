import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import Logo from './Logo'
import PoweredByElodiatech from './PoweredByElodiatech'

const TRUST_POINTS = [
  'Variables de paie et congés centralisés en un seul endroit',
  'Un gestionnaire de paie dédié chez Elodiatech pour chaque cabinet',
  'Interface identique pour le médecin et son assistante',
]

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-svh bg-white">
      {/* Panneau de marque (desktop uniquement) */}
      <div className="relative hidden w-1/2 shrink-0 flex-col justify-between overflow-hidden bg-slate-50 p-12 lg:flex">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 15% 15%, rgba(6,182,212,0.12), transparent 55%), radial-gradient(circle at 85% 85%, rgba(244,63,94,0.08), transparent 50%)',
          }}
        />
        <Link to="/offres" className="relative z-10 text-sm font-medium text-slate-500 hover:text-slate-700">
          ← Voir nos offres
        </Link>

        <div className="relative z-10 flex flex-col items-start gap-8">
          <img src="/medpaie-logo-full.png" alt="MedPaie" className="w-72 max-w-full" />
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              La paie de votre cabinet médical, sans y penser
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Conçu pour les cabinets médicaux de Guadeloupe et de Martinique.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
                <Check size={16} className="mt-0.5 shrink-0 text-brand-600" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <PoweredByElodiatech />
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
            <Logo size={44} className="lg:hidden" />
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>

          {children}

          {footer}

          <div className="lg:hidden">
            <PoweredByElodiatech className="mt-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
