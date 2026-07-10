# MedPaie

Application de suivi de paie pour cabinets médicaux libéraux (Guadeloupe / Martinique), interfacée avec [macompta.fr](https://macompta.fr).

Trois espaces selon le rôle :

- **Assistante médicale** — saisie mensuelle des variables de paie (heures supplémentaires majorées 25 %/50 %, primes, indemnités kilométriques) et des demandes de congés.
- **Médecin employeur** — même vue que l'assistante, avec validation en un clic des variables et des congés.
- **Admin Elodiatech** — pilotage multi-cabinets, export CSV des variables pour import dans macompta.fr, injection des liens de fiches de paie, suivi de la facturation mensuelle.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Supabase (Postgres, Auth, Row Level Security)
- React Router

## Démarrage

```bash
npm install
cp .env.example .env   # renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

### Base de données

Le schéma est dans `supabase/migrations/0001_init.sql` : tables `cabinets`, `profiles`,
`payroll_variables`, `leave_requests`, `documents`, `invoices`, toutes protégées par des
policies RLS (accès limité au cabinet de l'utilisateur, accès total pour le rôle `admin`).

À appliquer sur un projet Supabase via le SQL Editor, ou avec la CLI Supabase :

```bash
supabase db push
```

Après la première migration, créez au moins un cabinet réel (autre que le cabinet `a-affecter`
utilisé par défaut) et affectez-y vos utilisateurs (`cabinet_id`, `role`) depuis la table
`profiles`, par exemple via le SQL Editor ou une interface d'administration Supabase.

## Ce qui est couvert dans ce scaffold initial

- Authentification Supabase (email / mot de passe) et récupération du rôle.
- Layout responsive (barre latérale desktop, navigation basse mobile).
- Dashboards Assistante / Médecin (variables, congés, documents) avec RLS.
- Dashboard Admin (liste des cabinets, détail par cabinet, export CSV, injection de liens
  documents, facturation).

## Prochaines étapes (hors scope de ce premier commit)

- Scanner mobile + OCR pour les justificatifs (arrêts de travail, notes de frais).
- Moteur de notifications automatisées (rappel J25, alerte retard J27) via Supabase Edge
  Functions / `pg_cron`.
- Messagerie interne sécurisée et chatbot IA réglementaire (IDCC 3206).
- Intégration API Google Drive pour l'archivage automatique des documents.
- Intégration API macompta.fr / Net-Entreprises / URSSAF et génération automatisée des
  factures mensuelles (Edge Function du 1er du mois).
