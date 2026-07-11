-- La politique de confidentialité de MedPaie (page /mentions-legales) promet
-- explicitement : « Au sein d'un cabinet, une assistante médicale ne voit pas
-- les données des autres salariés. » Ce n'était vrai que côté interface — les
-- policies de lecture sur payroll_variables, leave_requests, time_entries et
-- documents restaient ouvertes à tout le cabinet, y compris entre collègues.
-- Un appel API direct (hors UI) par une salariée technophile aurait donc pu
-- lire les heures, primes, congés (dont les arrêts maladie, accidents du
-- travail, congés maternité — des données de santé) et fiches de paie de ses
-- collègues. On aligne la base sur la promesse déjà écrite : chaque salarié
-- ne lit plus que sa propre ligne ; le médecin employeur et l'admin
-- conservent une vision complète de leur cabinet (nécessaire à la validation
-- et aux statistiques d'équipe).

-- ============================================================
-- payroll_variables
-- ============================================================
drop policy if exists "Lecture des variables du cabinet" on payroll_variables;

create policy "Lecture des variables du cabinet" on payroll_variables
  for select using (
    employee_id = auth.uid()
    or public.current_user_role() = 'admin'
    or (public.current_user_role() = 'employer' and cabinet_id = public.current_user_cabinet_id())
  );

-- ============================================================
-- leave_requests
-- ============================================================
drop policy if exists "Lecture des congés du cabinet" on leave_requests;

create policy "Lecture des congés du cabinet" on leave_requests
  for select using (
    employee_id = auth.uid()
    or public.current_user_role() = 'admin'
    or (public.current_user_role() = 'employer' and cabinet_id = public.current_user_cabinet_id())
  );

-- ============================================================
-- time_entries (jusqu'ici une seule policy "for all" cabinet-wide)
-- ============================================================
drop policy if exists "Accès aux heures du cabinet" on time_entries;

create policy "Lecture des heures du cabinet" on time_entries
  for select using (
    employee_id = auth.uid()
    or public.current_user_role() = 'admin'
    or (public.current_user_role() = 'employer' and cabinet_id = public.current_user_cabinet_id())
  );

create policy "Salarié saisit ses propres heures" on time_entries
  for insert with check (
    employee_id = auth.uid() and cabinet_id = public.current_user_cabinet_id()
  );

create policy "Salarié modifie ses propres heures" on time_entries
  for update
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

create policy "Employeur/admin gèrent les heures de leur cabinet" on time_entries
  for update
  using (
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'employer' and cabinet_id = public.current_user_cabinet_id())
  )
  with check (
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'employer' and cabinet_id = public.current_user_cabinet_id())
  );

create policy "Suppression des heures réservée à l'admin" on time_entries
  for delete using (public.current_user_role() = 'admin');

-- ============================================================
-- documents : même principe, en gardant l'accès aux documents "cabinet
-- entier" (employee_id null) pour tous les membres de ce cabinet.
-- ============================================================
drop policy if exists "Lecture des documents du cabinet" on documents;

create policy "Lecture des documents du cabinet" on documents
  for select using (
    employee_id = auth.uid()
    or (employee_id is null and cabinet_id = public.current_user_cabinet_id())
    or public.current_user_role() = 'admin'
    or (public.current_user_role() = 'employer' and cabinet_id = public.current_user_cabinet_id())
  );
