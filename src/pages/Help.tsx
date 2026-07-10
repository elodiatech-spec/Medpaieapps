import { useAuth } from '../contexts/AuthContext'
import Card from '../components/Card'
import type { Role } from '../lib/database.types'

interface Item {
  q: string
  a: string
}

const EMPLOYEE_ITEMS: Item[] = [
  {
    q: 'Comment déclarer mes heures et variables de paie ?',
    a: "Va dans « Variables », renseigne tes heures supplémentaires, tes primes et tes indemnités kilométriques du mois, puis clique sur « Soumettre ». Ton médecin employeur recevra ta déclaration pour validation.",
  },
  {
    q: 'Comment faire une demande de congé ?',
    a: "Va dans « Congés » puis « Nouvelle demande ». Choisis le type de congé et les dates. Pour un arrêt maladie, un accident du travail/de trajet ou un congé maternité, joins une photo ou un PDF du justificatif directement depuis ton téléphone ou ton ordinateur : c'est obligatoire pour que la demande soit validée.",
  },
  {
    q: 'Où trouver mes fiches de paie ?',
    a: 'Dans « Documents ». Ton administrateur y dépose le lien de chaque fiche de paie dès qu\'elle est disponible.',
  },
  {
    q: 'Comment contacter mon médecin employeur ou Elodiatech ?',
    a: 'Depuis « Messagerie », directement dans l\'application — pas besoin de passer par e-mail ou SMS.',
  },
  {
    q: 'Comment changer mon mot de passe ?',
    a: 'Clique sur l\'icône ⚙️ « Mon compte » (en bas de la barre latérale, ou en haut sur mobile), puis renseigne ton nouveau mot de passe.',
  },
]

const EMPLOYER_ITEMS: Item[] = [
  {
    q: 'Comment valider les variables de paie de mon assistante ?',
    a: "Depuis l'accueil ou « Variables », les déclarations « soumises » attendent ta validation. Vérifie les heures et primes, puis valide en un clic — l'administrateur Elodiatech est alors notifié pour préparer la paie.",
  },
  {
    q: 'Comment traiter une demande de congé ?',
    a: "Dans « Congés », tu vois toutes les demandes en attente. Pour les congés qui exigent un justificatif (arrêt maladie, accident…), vérifie qu'un document a bien été joint avant d'approuver.",
  },
  {
    q: 'Où voir le taux de présence et les absences de mon équipe ?',
    a: 'Dans « Statistiques » : taux de présence mensuel et évolution des absences injustifiées sur 12 mois.',
  },
  {
    q: 'Comment changer mon mot de passe ?',
    a: 'Clique sur l\'icône ⚙️ « Mon compte » (en bas de la barre latérale, ou en haut sur mobile), puis renseigne ton nouveau mot de passe.',
  },
]

const ADMIN_ITEMS: Item[] = [
  {
    q: 'Comment savoir ce qui a besoin de mon attention ?',
    a: 'Le « Centre de notifications » en haut de l\'accueil regroupe, pour tous les cabinets : les justificatifs à vérifier, les variables de paie soumises ce mois-ci et les congés en attente. Une pastille rouge s\'affiche aussi sur « Cabinets » dans le menu dès qu\'il y a quelque chose à traiter.',
  },
  {
    q: 'Comment créer un nouveau cabinet ?',
    a: 'Depuis l\'accueil, formulaire « Nouveau cabinet » : nom, ville, département, offre et engagement.',
  },
  {
    q: 'Comment affecter un compte à un cabinet ?',
    a: "La personne crée d'abord son compte via la page d'inscription (ou tu la trouves dans « Comptes en attente d'affectation » sur l'accueil). Ensuite, ouvre la fiche du cabinet concerné, section « Membres du cabinet », et renseigne son e-mail avec le bon rôle.",
  },
  {
    q: 'Comment déposer le lien d\'une fiche de paie ?',
    a: "Sur la fiche du cabinet, section « Injecter un lien de document », choisis le salarié concerné, colle le lien macompta.fr et enregistre. Il apparaît alors dans « Documents » côté salarié et médecin.",
  },
  {
    q: 'Comment désactiver le compte d\'un salarié qui quitte le cabinet ?',
    a: "Ouvre sa fiche depuis la liste des membres du cabinet, puis clique sur « Désactiver ce compte ». Il ne pourra plus se connecter et ne sera plus compté dans les effectifs facturés.",
  },
  {
    q: 'Où voir le chiffre d\'affaires global ?',
    a: 'Dans « Statistiques » : MRR estimé, nombre de cabinets actifs, salariés suivis, revenu facturé sur 12 mois et répartition par offre.',
  },
  {
    q: 'Où gérer les identifiants URSSAF / Net-Entreprises d\'un cabinet ?',
    a: 'Sur la fiche du cabinet, bouton « Portails & coffre-fort » : les identifiants y sont stockés de façon chiffrée.',
  },
]

const SECTIONS: Record<Role, { title: string; items: Item[] }> = {
  employee: { title: 'Guide — Assistante médicale', items: EMPLOYEE_ITEMS },
  employer: { title: 'Guide — Médecin employeur', items: EMPLOYER_ITEMS },
  admin: { title: 'Guide — Administrateur Elodiatech', items: ADMIN_ITEMS },
}

function Accordion({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {items.map((item) => (
        <details key={item.q} className="group py-3">
          <summary className="cursor-pointer list-none text-sm font-medium text-slate-900 marker:content-none">
            <span className="flex items-center justify-between gap-3">
              {item.q}
              <span className="shrink-0 text-slate-400 transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-2 text-sm text-slate-600">{item.a}</p>
        </details>
      ))}
    </div>
  )
}

export default function Help() {
  const { profile } = useAuth()
  if (!profile) return null

  const mySection = SECTIONS[profile.role]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Aide</h1>
        <p className="text-sm text-slate-500">Questions fréquentes, classées par espace.</p>
      </div>

      <Card title={mySection.title}>
        <Accordion items={mySection.items} />
      </Card>

      {(Object.keys(SECTIONS) as Role[])
        .filter((role) => role !== profile.role)
        .map((role) => (
          <Card key={role} title={SECTIONS[role].title}>
            <Accordion items={SECTIONS[role].items} />
          </Card>
        ))}

      <p className="text-center text-xs text-slate-400">
        Une question qui n'est pas listée ici ? Contacte l'équipe Elodiatech.
      </p>
    </div>
  )
}
