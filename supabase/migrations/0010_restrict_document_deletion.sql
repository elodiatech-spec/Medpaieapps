-- Les pièces jointes (justificatifs, fiches de paie, factures) ne doivent
-- pouvoir être supprimées ni par le médecin employeur ni par la salariée,
-- seulement par l'admin Elodiatech. Jusqu'ici les policies "for all"
-- accordaient aussi le droit de suppression à tout membre du cabinet.

-- ============================================================
-- Table documents
-- ============================================================
drop policy if exists "Accès aux documents autorisés" on documents;

create policy "Lecture des documents du cabinet" on documents
  for select using (
    cabinet_id = public.current_user_cabinet_id()
    or public.current_user_role() = 'admin'
  );

create policy "Ajout de documents réservé à l'admin" on documents
  for insert with check (public.current_user_role() = 'admin');

create policy "Modification de documents réservée à l'admin" on documents
  for update using (public.current_user_role() = 'admin');

create policy "Suppression de documents réservée à l'admin" on documents
  for delete using (public.current_user_role() = 'admin');

-- ============================================================
-- Bucket justificatifs (Storage)
-- ============================================================
drop policy if exists "Suppression justificatifs du cabinet" on storage.objects;

create policy "Suppression justificatifs réservée à l'admin" on storage.objects
  for delete using (
    bucket_id = 'justificatifs'
    and public.current_user_role() = 'admin'
  );
