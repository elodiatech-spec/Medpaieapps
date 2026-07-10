-- Déclenche la fonction Edge "notify-validation" dès qu'un médecin valide
-- les variables de paie d'un salarié (payroll_variables.status = 'validated').
-- Remplace l'usage d'un Database Webhook (introuvable dans certaines
-- versions du menu Database du tableau de bord) par un trigger SQL direct,
-- avec le même effet.

create extension if not exists pg_net;

create or replace function public.trigger_notify_validation()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'validated' and (old.status is distinct from new.status) then
    perform net.http_post(
      url := 'https://mxcykylzbqbpeannnnkt.supabase.co/functions/v1/notify-validation',
      headers := jsonb_build_object(
        'Authorization', 'Bearer sb_publishable_Df2y9aoRy4zEr-5RyvzSEQ_7h3L-RQC',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('table', 'payroll_variables', 'record', to_jsonb(new))
    );
  end if;
  return new;
end;
$$;

create trigger on_payroll_variable_validated
  after update on payroll_variables
  for each row
  execute function public.trigger_notify_validation();
