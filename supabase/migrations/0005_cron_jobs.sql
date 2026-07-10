-- Planifie l'appel quotidien des rappels de paie et l'appel mensuel de
-- facturation. À exécuter APRÈS avoir déployé les fonctions Edge
-- "payroll-reminders" et "monthly-invoice" (voir supabase/functions/README.md).
--
-- Remplacez <PROJECT_REF> et <ANON_KEY> par les valeurs de votre projet
-- avant d'exécuter cette migration.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Rappels/alertes de paie : tous les jours à 13h UTC (~9h en Martinique/Guadeloupe, UTC-4)
select cron.schedule(
  'payroll-reminders-daily',
  '0 13 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/payroll-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer <ANON_KEY>', 'Content-Type', 'application/json')
  );
  $$
);

-- Facturation mensuelle : le 1er de chaque mois à 8h UTC
select cron.schedule(
  'monthly-invoice',
  '0 8 1 * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/monthly-invoice',
    headers := jsonb_build_object('Authorization', 'Bearer <ANON_KEY>', 'Content-Type', 'application/json')
  );
  $$
);
