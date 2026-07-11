-- Le contrat de travail, les congés payés, la fiscalité (PAS) et la
-- protection sociale d'un salarié sont des décisions qui relèvent du
-- médecin employeur (ou de l'admin), pas de l'auto-déclaration par le
-- salarié. Jusqu'ici seul le salarié lui-même (ou l'admin) pouvait
-- modifier sa propre ligne "profiles" — le médecin n'avait aucun moyen
-- d'y toucher. On étend la policy de mise à jour pour l'y autoriser,
-- mais uniquement sur les salariés de son propre cabinet.

drop policy if exists "Mise à jour de son propre profil" on profiles;

create policy "Mise à jour de son profil, ou par l'employeur/admin" on profiles
  for update using (
    id = auth.uid()
    or public.current_user_role() = 'admin'
    or (
      public.current_user_role() = 'employer'
      and cabinet_id = public.current_user_cabinet_id()
      and role = 'employee'
    )
  );
