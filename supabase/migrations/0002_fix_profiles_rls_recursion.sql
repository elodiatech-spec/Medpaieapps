-- Correction : la policy de lecture sur "profiles" s'interrogeait elle-même
-- dans sa propre condition (sous-requête "select ... from profiles" dans une
-- policy de la table profiles), ce qui déclenche une erreur Postgres
-- "infinite recursion detected in policy for relation profiles" et bloque
-- toute lecture de profil, y compris pour un administrateur.
--
-- Solution standard Supabase : passer par des fonctions SECURITY DEFINER,
-- qui contournent la RLS le temps de leur propre exécution et cassent donc
-- la boucle de récursion.

drop policy if exists "Lecture des profils du même cabinet" on profiles;
drop policy if exists "Mise à jour de son propre profil" on profiles;

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.current_user_cabinet_id()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select cabinet_id from profiles where id = auth.uid()
$$;

create policy "Lecture des profils du même cabinet" on profiles
  for select using (
    id = auth.uid()
    or cabinet_id = public.current_user_cabinet_id()
    or public.current_user_role() = 'admin'
  );

create policy "Mise à jour de son propre profil" on profiles
  for update using (
    id = auth.uid() or public.current_user_role() = 'admin'
  );
