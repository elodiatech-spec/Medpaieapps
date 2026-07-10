# Fonctions Edge — notifications, facturation & comptes

Cinq fonctions autonomes (aucun fichier partagé), à déployer depuis le
tableau de bord Supabase (**Edge Functions** → **Deploy a new function** →
**Via Editor**, coller le contenu de chaque `index.ts`) :

- **payroll-reminders** : rappels de saisie (J25) et alertes de retard (J27+),
  déclenchée quotidiennement par `pg_cron`.
- **notify-validation** : confirme à l'admin (1) qu'un médecin vient de
  valider des variables de paie, ou (2) qu'une salariée vient de transmettre
  un nouveau justificatif à vérifier. Déclenchée par des triggers SQL sur
  `payroll_variables` et `leave_requests`.
- **monthly-invoice** : calcule et enregistre la facture du mois pour chaque
  cabinet actif, envoie un e-mail récapitulatif au médecin employeur.
  Déclenchée le 1er de chaque mois par `pg_cron`.
- **justification-reminders** : alerte la salariée et le médecin quand un
  congé qui exige légalement un justificatif (arrêt maladie, accident du
  travail, accident de trajet, maternité) n'en a pas, ou que celui-ci
  n'est pas encore validé par l'admin. Déclenchée quotidiennement par
  `pg_cron`.
- **create-account** : permet à l'admin de créer, directement depuis la
  fiche d'un cabinet dans l'application, le compte d'un médecin ou d'une
  assistante (sans passer par le tableau de bord Supabase). Vérifie que
  l'appelant est bien un admin avant de créer le compte avec la clé de
  service, puis un e-mail « définir votre mot de passe » est envoyé à la
  personne. Déclenchée par le formulaire "Créer un compte" de la fiche
  cabinet.

## Étapes de mise en service

1. **Secret** : Project Settings → Edge Functions → Secrets → ajouter
   `RESEND_API_KEY` avec la clé Resend (`re_...`). Ne jamais mettre cette
   clé dans le code du dépôt.
2. **Déployer** les 5 fonctions via l'éditeur du tableau de bord, en leur
   donnant exactement les noms `payroll-reminders`, `notify-validation`,
   `monthly-invoice`, `justification-reminders` et `create-account`.
3. Pour `payroll-reminders`, `monthly-invoice` et `justification-reminders` :
   dans les réglages de la fonction, **désactiver "Enforce JWT
   Verification"** (elles sont appelées par `pg_cron`, pas par un
   utilisateur connecté). Laisser activé pour `notify-validation` et
   `create-account` (appelées par un utilisateur connecté).
4. **Déclencheurs** pour `notify-validation` : exécuter
   `supabase/migrations/0006_notify_validation_trigger.sql` puis
   `supabase/migrations/0011_notify_justification_uploaded_trigger.sql` dans
   le SQL Editor (triggers SQL directs via `pg_net`, plus simples qu'un
   Database Webhook et fonctionnent quelle que soit la version du tableau
   de bord).
5. **Cron** : exécuter `supabase/migrations/0005_cron_jobs.sql` puis
   `supabase/migrations/0009_justification_reminders_cron.sql` dans le SQL
   Editor (les valeurs du projet y sont déjà renseignées).
6. **Mise à jour du code** : si `notify-validation` a déjà été déployée
   avant l'ajout du cas justificatif, retourne dans **Edge Functions** →
   `notify-validation` → onglet **Code**, remplace le contenu par la
   nouvelle version de `supabase/functions/notify-validation/index.ts` et
   redéploie.
