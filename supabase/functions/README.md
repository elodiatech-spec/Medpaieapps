# Fonctions Edge — notifications & facturation

Trois fonctions autonomes (aucun fichier partagé), à déployer depuis le
tableau de bord Supabase (**Edge Functions** → **Deploy a new function** →
**Via Editor**, coller le contenu de chaque `index.ts`) :

- **payroll-reminders** : rappels de saisie (J25) et alertes de retard (J27+),
  déclenchée quotidiennement par `pg_cron`.
- **notify-validation** : confirme à l'admin qu'un médecin vient de valider
  des variables de paie, déclenchée par un Database Webhook sur `UPDATE` de
  `payroll_variables`.
- **monthly-invoice** : calcule et enregistre la facture du mois pour chaque
  cabinet actif, envoie un e-mail récapitulatif au médecin employeur.
  Déclenchée le 1er de chaque mois par `pg_cron`.

## Étapes de mise en service

1. **Secret** : Project Settings → Edge Functions → Secrets → ajouter
   `RESEND_API_KEY` avec la clé Resend (`re_...`). Ne jamais mettre cette
   clé dans le code du dépôt.
2. **Déployer** les 3 fonctions via l'éditeur du tableau de bord, en leur
   donnant exactement les noms `payroll-reminders`, `notify-validation` et
   `monthly-invoice`.
3. Pour `payroll-reminders` et `monthly-invoice` : dans les réglages de la
   fonction, **désactiver "Enforce JWT Verification"** (elles sont appelées
   par `pg_cron`, pas par un utilisateur connecté).
4. **Webhook** pour `notify-validation` : Database → Webhooks → Create a new
   webhook → table `payroll_variables`, événement `UPDATE`, cible la
   fonction `notify-validation`.
5. **Cron** : exécuter `supabase/migrations/0005_cron_jobs.sql` dans le SQL
   Editor (les valeurs du projet y sont déjà renseignées).
