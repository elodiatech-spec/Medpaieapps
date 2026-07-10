import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import PoweredByElodiatech from '../components/PoweredByElodiatech'

function Placeholder({ children }: { children: string }) {
  return <span className="rounded bg-amber-100 px-1 py-0.5 text-amber-800">{children}</span>
}

export default function Legal() {
  return (
    <div className="min-h-svh bg-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/offres" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-lg font-semibold text-slate-900">MedPaie</span>
        </Link>
        <Link to="/login" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          Se connecter
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20 text-sm leading-relaxed text-slate-700">
        <h1 className="mb-8 text-2xl font-semibold text-slate-900">
          Mentions légales &amp; politique de confidentialité
        </h1>

        <section id="mentions-legales" className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">1. Mentions légales</h2>

          <h3 className="mt-5 mb-2 font-medium text-slate-900">Éditeur du site</h3>
          <p>
            L'application MedPaie est éditée par <Placeholder>[À compléter : raison sociale et forme juridique d'Elodiatech]</Placeholder>,
            immatriculée au RCS de <Placeholder>[À compléter : ville]</Placeholder> sous le
            numéro SIRET <Placeholder>[À compléter : n° SIRET]</Placeholder>, dont le siège
            social est situé <Placeholder>[À compléter : adresse complète]</Placeholder>.
          </p>
          <p className="mt-2">
            Numéro de TVA intracommunautaire : <Placeholder>[À compléter]</Placeholder>
            <br />
            Directeur de la publication : <Placeholder>[À compléter : nom]</Placeholder>
            <br />
            Contact : <Placeholder>[À compléter : e-mail de contact]</Placeholder>
          </p>

          <h3 className="mt-5 mb-2 font-medium text-slate-900">Hébergement</h3>
          <p>
            Application (interface web) : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
            États-Unis.
            <br />
            Base de données et fichiers (justificatifs, documents) : Supabase Inc., 970 Toa Payoh
            North #07-04, Singapour.
          </p>

          <h3 className="mt-5 mb-2 font-medium text-slate-900">Propriété intellectuelle</h3>
          <p>
            L'ensemble des éléments de MedPaie (marque, logo, structure, textes) est la propriété
            d'Elodiatech, sauf mention contraire. Toute reproduction ou représentation, totale ou
            partielle, sans autorisation, est interdite.
          </p>
        </section>

        <section id="confidentialite" className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            2. Politique de confidentialité (RGPD)
          </h2>

          <h3 className="mt-5 mb-2 font-medium text-slate-900">Données collectées</h3>
          <p>
            Pour assurer le suivi de la paie et des congés de votre cabinet, MedPaie traite les
            données suivantes : identité et coordonnées, données contractuelles (poste, salaire,
            horaires), données de paie (heures, primes, indemnités), et, lorsque la loi l'exige,
            des justificatifs d'absence pouvant révéler des informations relatives à la santé
            (arrêt maladie, accident du travail, congé maternité).
          </p>

          <h3 className="mt-5 mb-2 font-medium text-slate-900">Finalité et base légale</h3>
          <p>
            Ces données sont traitées dans le cadre de l'exécution du contrat de gestion de paie
            liant le cabinet médical à Elodiatech, et pour le respect des obligations légales et
            sociales de l'employeur (Code du travail, Sécurité sociale).
          </p>

          <h3 className="mt-5 mb-2 font-medium text-slate-900">Accès aux données</h3>
          <p>
            Chaque cabinet ne voit que ses propres données. Au sein d'un cabinet, une assistante
            médicale ne voit pas les données des autres salariés. Les justificatifs d'absence
            transmis ne peuvent être supprimés que par l'équipe Elodiatech, garantissant leur
            conservation pour d'éventuels contrôles.
          </p>

          <h3 className="mt-5 mb-2 font-medium text-slate-900">Durée de conservation</h3>
          <p>
            Les données sont conservées pendant la durée de la relation contractuelle, puis
            archivées conformément aux durées légales de conservation des documents sociaux et de
            paie (5 ans, portées à 50 ans pour certains documents relatifs à la retraite).
          </p>

          <h3 className="mt-5 mb-2 font-medium text-slate-900">Vos droits</h3>
          <p>
            Conformément au Règlement Général sur la Protection des Données, vous disposez d'un
            droit d'accès, de rectification, d'effacement et de portabilité de vos données.
            Pour exercer ces droits, contactez{' '}
            <Placeholder>[À compléter : e-mail dédié RGPD]</Placeholder>.
          </p>
        </section>

        <p className="text-xs text-slate-400">Dernière mise à jour : juillet 2026.</p>
      </main>

      <footer className="border-t border-slate-100 py-6">
        <PoweredByElodiatech />
      </footer>
    </div>
  )
}
