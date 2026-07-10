# Fonctions Edge — notifications & facturation

Quatre fonctions autonomes (aucun fichier partagé), à déployer depuis le
tableau de bord Supabase (**Edge Functions** → **Deploy a new function** →
**Via Editor**, coller le contenu de chaque `index.ts`) :

- **payroll-reminders** : rappels de saisie (J25) et alertes de retard (J27+),
  déclenchée quotidiennement par `pg_cron`.
- **notify-validation** : confirme à l'admin qu'un médecin vient de valider
  des variables de paie, déclenchée par un trigger SQL sur `UPDATE` de
  `payroll_variables`.
- **monthly-invoice** : calcule et enregistre la facture du mois pour chaque
  cabinet actif, envoie un e-mail récapitulatif au médecin employeur.
  Déclenchée le 1er de chaque mois par `pg_cron`.
- **justification-reminders** : alerte la salariée et le médecin quand un
  congé qui exige légalement un justificatif (arrêt maladie, accident du
  travail, accident de trajet, maternité) n'en a pas, ou que celui-ci
  n'est pas encore validé par l'admin. Déclenchée quotidiennement par
  `pg_cron`.

## Étapes de mise en service

1. **Secret** : Project Settings → Edge Functions → Secrets → ajouter
   `RESEND_API_KEY` avec la clé Resend (`re_...`). Ne jamais mettre cette
   clé dans le code du dépôt.
2. **Déployer** les 4 fonctions via l'éditeur du tableau de bord, en leur
   donnant exactement les noms `payroll-reminders`, `notify-validation`,
   `monthly-invoice` et `justification-reminders`.
3. Pour `payroll-reminders`, `monthly-invoice` et `justification-reminders` :
   dans les réglages de la fonction, **désactiver "Enforce JWT
   Verification"** (elles sont appelées par `pg_cron`, pas par un
   utilisateur connecté). Laisser activé pour `notify-validation`.
4. **Déclencheur** pour `notify-validation` : exécuter
   `supabase/migrations/0006_notify_validation_trigger.sql` dans le SQL
   Editor (trigger SQL direct via `pg_net`, plus simple qu'un Database
   Webhook et fonctionne quelle que soit la version du tableau de bord).
5. **Cron** : exécuter `supabase/migrations/0005_cron_jobs.sql` puis
   `supabase/migrations/0009_justification_reminders_cron.sql` dans le SQL
   Editor (les valeurs du projet y sont déjà renseignées).
