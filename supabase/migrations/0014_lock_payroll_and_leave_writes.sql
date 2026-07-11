-- Jusqu'ici, les policies "for all" sur payroll_variables et leave_requests
-- accordaient un accès en écriture total à tout membre du cabinet (salarié
-- ou médecin), du moment que le cabinet_id correspondait — la même faille
-- déjà corrigée sur "documents" par la migration 0010. Concrètement, rien
-- côté base n'empêchait une assistante technophile d'appeler l'API
-- Supabase directement (hors interface) pour s'auto-valider sa propre
-- variable de paie après soumission, ou s'auto-approuver son propre congé,
-- contournant entièrement le pouvoir de validation du médecin employeur.
-- L'interface ne propose jamais ces actions, mais ne les empêchait pas
-- réellement. On resserre donc l'écriture ; la lecture reste inchangée.

-- ============================================================
-- payroll_variables
-- ============================================================
drop policy if exists "Accès aux variables du cabinet" on payroll_variables;

create policy "Lecture des variables du cabinet" on payroll_variables
  for select using (
    cabinet_id = public.current_user_cabinet_id()
    or public.current_user_role() = 'admin'
  );

create policy "Salarié crée sa propre variable" on payroll_variables
  for insert with check (
    (employee_id = auth.uid() and cabinet_id = public.current_user_cabinet_id())
    or public.current_user_role() = 'admin'
    or (public.current_user_role() = 'employer' and cabinet_id = public.current_user_cabinet_id())
  );

-- Le salarié ne peut modifier sa ligne que tant qu'elle est en brouillon, et
-- ne peut la faire passer que vers "draft" (enregistrer) ou "submitted"
-- (soumettre) — jamais vers "validated".
create policy "Salarié modifie sa variable tant qu'elle est en brouillon" on payroll_variables
  for update
  using (employee_id = auth.uid() and status = 'draft')
  with check (employee_id = auth.uid() and status in ('draft', 'submitted'));

create policy "Employeur/admin gèrent les variables de leur cabinet" on payroll_variables
  for update
  using (
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'employer' and cabinet_id = public.current_user_cabinet_id())
  )
  with check (
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'employer' and cabinet_id = public.current_user_cabinet_id())
  );

create policy "Suppression des variables réservée à l'admin" on payroll_variables
  for delete using (public.current_user_role() = 'admin');

-- ============================================================
-- leave_requests
-- ============================================================
drop policy if exists "Gestion des congés du cabinet" on leave_requests;

create policy "Lecture des congés du cabinet" on leave_requests
  for select using (
    cabinet_id = public.current_user_cabinet_id()
    or public.current_user_role() = 'admin'
  );

create policy "Création d'une demande de congé" on leave_requests
  for insert with check (
    (employee_id = auth.uid() and cabinet_id = public.current_user_cabinet_id())
    or public.current_user_role() = 'admin'
    or (public.current_user_role() = 'employer' and cabinet_id = public.current_user_cabinet_id())
  );

create policy "Modification des congés par le cabinet" on leave_requests
  for update using (
    cabinet_id = public.current_user_cabinet_id()
    or public.current_user_role() = 'admin'
  )
  with check (
    cabinet_id = public.current_user_cabinet_id()
    or public.current_user_role() = 'admin'
  );

create policy "Suppression des congés réservée à l'admin" on leave_requests
  for delete using (public.current_user_role() = 'admin');

-- La policy de modification ci-dessus reste large au niveau ligne (la RLS de
-- Postgres ne sait pas restreindre par colonne) : un déclencheur complète
-- donc la protection pour empêcher une salariée de modifier le statut, les
-- dates ou le type de sa propre demande via un appel API direct — seul
-- l'ajout/remplacement de son justificatif lui reste permis sur sa propre
-- demande. Le médecin employeur et l'admin ne sont pas concernés.
create or replace function public.enforce_leave_request_employee_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() in ('admin', 'employer') then
    return new;
  end if;

  if old.employee_id is distinct from auth.uid() then
    raise exception 'Modification non autorisée.';
  end if;

  if new.status is distinct from old.status
     or new.start_date is distinct from old.start_date
     or new.end_date is distinct from old.end_date
     or new.leave_type is distinct from old.leave_type
     or new.employee_id is distinct from old.employee_id
     or new.cabinet_id is distinct from old.cabinet_id
  then
    raise exception 'Seul le justificatif peut être modifié par la salariée elle-même.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_leave_request_employee_update on leave_requests;
create trigger trg_enforce_leave_request_employee_update
  before update on leave_requests
  for each row
  execute function public.enforce_leave_request_employee_update();
