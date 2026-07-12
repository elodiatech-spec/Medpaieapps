-- Jusqu'ici, un nouveau compte auto-inscrit (page /inscription) et en
-- attente d'affectation à un cabinet n'était visible qu'en se connectant à
-- l'application (bloc "Comptes en attente d'affectation" sur l'accueil
-- admin) — aucun e-mail n'alertait l'admin qu'une action était nécessaire.
-- Ce trigger complète notify-validation (0006, 0011) avec ce troisième cas.

create or replace function public.trigger_notify_pending_account()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.cabinet_id = 'a-affecter' then
    perform net.http_post(
      url := 'https://mxcykylzbqbpeannnnkt.supabase.co/functions/v1/notify-validation',
      headers := jsonb_build_object(
        'Authorization', 'Bearer sb_publishable_Df2y9aoRy4zEr-5RyvzSEQ_7h3L-RQC',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('table', 'profiles', 'record', to_jsonb(new))
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_pending_account_created on profiles;
create trigger on_profile_pending_account_created
  after insert on profiles
  for each row
  execute function public.trigger_notify_pending_account();
