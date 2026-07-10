# Fonctions Edge — notifications & facturation

Trois fonctions, à déployer depuis le tableau de bord Supabase (**Edge
Functions** → **Deploy a new function** → **Via Editor**, coller le contenu
de chaque `index.ts`) :

- **payroll-reminders** : rappels de saisie (J25) et alertes de retard (J27+),
  déclenchée quotidiennement par `pg_cron`.
- **notify-validation** : confirme à l'admin qu'un médecin vient de valider
  des variables de paie, déclenchée par un Database Webhook sur `UPDATE` de
  `payroll_variables`.
- **monthly-invoice** : calcule et enregistre la facture du mois pour chaque
  cabinet actif, envoie un e-mail récapitulatif au médecin employeur.
  Déclenchée le 1er de chaque mois par `pg_cron`.

Le dossier `_shared/resend.ts` contient l'appel commun à l'API Resend.

## Étapes de mise en service

1. **Secret** : Project Settings → Edge Functions → Secrets → ajouter
   `RESEND_API_KEY` avec la clé Resend (`re_...`).
2. **Déployer** les 3 fonctions via l'éditeur du tableau de bord (copier le
   contenu de chaque `index.ts` ; pour `_shared/resend.ts`, Supabase le
   propose comme fichier partagé lors du déploiement via CLI — si vous
   déployez via l'éditeur web sans CLI, collez le contenu de `resend.ts`
   directement en haut de chaque fonction à la place de l'import).
3. Pour `payroll-reminders` et `monthly-invoice` : dans les réglages de la
   fonction, **désactiver "Enforce JWT Verification"** (elles sont appelées
   par `pg_cron`, pas par un utilisateur connecté).
4. **Webhook** pour `notify-validation` : Database → Webhooks → Create a new
   webhook → table `payroll_variables`, événement `UPDATE`, cible la
   fonction `notify-validation`.
5. **Cron** : exécuter `supabase/migrations/0005_cron_jobs.sql` dans le SQL
   Editor après avoir remplacé `<PROJECT_REF>` et `<ANON_KEY>` par les
   valeurs du projet.
