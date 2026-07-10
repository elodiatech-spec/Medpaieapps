-- Planifie l'appel quotidien des relances de justificatifs manquants ou
-- non validés. À exécuter APRÈS avoir déployé la fonction Edge
-- "justification-reminders" (voir supabase/functions/README.md).

select cron.schedule(
  'justification-reminders-daily',
  '0 14 * * *', -- tous les jours à 14h UTC (~10h en Martinique/Guadeloupe)
  $$
  select net.http_post(
    url := 'https://mxcykylzbqbpeannnnkt.supabase.co/functions/v1/justification-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer sb_publishable_Df2y9aoRy4zEr-5RyvzSEQ_7h3L-RQC',
      'Content-Type', 'application/json'
    )
  );
  $$
);
