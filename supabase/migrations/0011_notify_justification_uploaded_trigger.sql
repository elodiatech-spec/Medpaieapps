-- Déclenche la fonction Edge "notify-validation" (mise à jour pour gérer ce
-- second cas) dès qu'une salariée transmet un justificatif, pour que l'admin
-- n'ait pas à attendre la relance quotidienne pour le découvrir.

create or replace function public.trigger_notify_justification_uploaded()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.justification_document_url is not null
     and (old.justification_document_url is null or old.justification_document_url is distinct from new.justification_document_url)
  then
    perform net.http_post(
      url := 'https://mxcykylzbqbpeannnnkt.supabase.co/functions/v1/notify-validation',
      headers := jsonb_build_object(
        'Authorization', 'Bearer sb_publishable_Df2y9aoRy4zEr-5RyvzSEQ_7h3L-RQC',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('table', 'leave_requests', 'record', to_jsonb(new))
    );
  end if;
  return new;
end;
$$;

create trigger on_leave_request_justification_uploaded
  after update on leave_requests
  for each row
  execute function public.trigger_notify_justification_uploaded();

-- Cas où le justificatif est fourni dès la création de la demande.
create or replace function public.trigger_notify_justification_uploaded_insert()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.justification_document_url is not null then
    perform net.http_post(
      url := 'https://mxcykylzbqbpeannnnkt.supabase.co/functions/v1/notify-validation',
      headers := jsonb_build_object(
        'Authorization', 'Bearer sb_publishable_Df2y9aoRy4zEr-5RyvzSEQ_7h3L-RQC',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('table', 'leave_requests', 'record', to_jsonb(new))
    );
  end if;
  return new;
end;
$$;

create trigger on_leave_request_created_with_justification
  after insert on leave_requests
  for each row
  execute function public.trigger_notify_justification_uploaded_insert();
