import { Link } from 'react-router-dom'
import { Stethoscope, Check, Sparkles } from 'lucide-react'

interface PlanCard {
  name: string
  headcount: string
  priceEngaged: string
  priceFree: string
  pitch: string
  highlight?: boolean
}

const PLANS: PlanCard[] = [
  {
    name: 'MEDI PAIE SOLO',
    headcount: '1 salarié',
    priceEngaged: '79,00 €',
    priceFree: '99,00 €',
    pitch: 'Vous formez un binôme unique avec votre assistante ? MEDI PAIE SOLO gère votre paie en un clic.',
  },
  {
    name: 'MEDI CAB',
    headcount: '3 salariés',
    priceEngaged: '149,00 €',
    priceFree: '189,00 €',
    pitch: 'Pilotez la paie et les congés de votre petit cabinet médical en toute simplicité.',
    highlight: true,
  },
  {
    name: 'MEDI PAIE CAB+',
    headcount: '4 salariés',
    priceEngaged: '219,00 €',
    priceFree: '279,00 €',
    pitch: "Votre structure médicale grandit ? Votre forfait s'adapte en douceur.",
  },
  {
    name: 'MEDI PAIE EQUIPE',
    headcount: '5 salariés',
    priceEngaged: '279,00 €',
    priceFree: '359,00 €',
    pitch: "Fédérez votre équipe de soins autour d'un portail RH et paie ultra-performant.",
  },
  {
    name: 'MEDI PAIE EQUIPE+',
    headcount: 'Plus de 5 salariés',
    priceEngaged: 'Dès 329,00 €',
    priceFree: 'Dès 419,00 €',
    pitch: 'Une gestion sociale de haute voltige pour vos structures médicales d’envergure. Sur devis.',
  },
]

const FEATURES = [
  'Saisie mensuelle guidée des heures supplémentaires, primes et frais professionnels',
  'Congés en ligne avec justificatif et validation en un clic',
  'Fiches de paie et documents centralisés et accessibles à tout moment',
  'Un gestionnaire de paie dédié chez Elodiatech pour chaque cabinet',
  'Interface identique pour le médecin et son assistante — zéro courbe d’apprentissage',
]

export default function Offers() {
  return (
    <div className="min-h-svh bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Stethoscope size={18} />
          </div>
          <span className="text-lg font-semibold text-slate-900">MedPaie</span>
        </div>
        <Link
          to="/login"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Se connecter
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12 text-center">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <Sparkles size={14} /> Guadeloupe &amp; Martinique
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          La paie de votre cabinet médical, sans y penser
        </h1>
        <p className="mt-4 text-base text-slate-600">
          MedPaie simplifie à l'extrême la collecte des variables de paie et la gestion
          administrative de votre assistante médicale, en lien direct avec macompta.fr et un
          gestionnaire de paie dédié chez Elodiatech.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
              <Check size={16} className="mt-0.5 shrink-0 text-brand-600" />
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-6 text-center text-xl font-semibold text-slate-900">Nos offres</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl p-6 shadow-sm ring-1 ${
                plan.highlight ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-900 ring-black/5'
              }`}
            >
              <p className={`text-xs font-medium ${plan.highlight ? 'text-brand-100' : 'text-brand-600'}`}>
                {plan.headcount}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{plan.name}</h3>
              <div className="mt-4">
                <p className="text-2xl font-semibold">
                  {plan.priceEngaged}
                  <span className={`text-sm font-normal ${plan.highlight ? 'text-brand-100' : 'text-slate-500'}`}>
                    {' '}
                    TTC/mois
                  </span>
                </p>
                <p className={`text-xs ${plan.highlight ? 'text-brand-100' : 'text-slate-500'}`}>
                  avec engagement 12 mois · {plan.priceFree} TTC/mois sans engagement
                </p>
              </div>
              <p className={`mt-4 flex-1 text-sm ${plan.highlight ? 'text-brand-50' : 'text-slate-600'}`}>
                {plan.pitch}
              </p>
              <Link
                to="/login"
                className={`mt-6 rounded-lg py-2 text-center text-sm font-medium ${
                  plan.highlight
                    ? 'bg-white text-brand-700 hover:bg-brand-50'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                En savoir plus
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Tarifs TTC (TVA locale de 8,5 % applicable en Guadeloupe et en Martinique).
        </p>
      </section>
    </div>
  )
}
