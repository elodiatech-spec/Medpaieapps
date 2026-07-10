-- Étend les types de congés aux catégories légales et ajoute la validation
-- des justificatifs par l'admin + le stockage sécurisé des fichiers
-- scannés (photo/PDF) par l'assistante.

alter table leave_requests drop constraint if exists leave_requests_leave_type_check;
alter table leave_requests add constraint leave_requests_leave_type_check check (
  leave_type in (
    'conges_payes',
    'rtt',
    'maladie',
    'accident_travail',
    'accident_trajet',
    'maternite',
    'conge_parental',
    'evenement_familial',
    'absence_injustifiee'
  )
);

alter table leave_requests
  add column justification_validated boolean not null default false;

-- ============================================================
-- Stockage des justificatifs (photo/PDF scanné depuis le mobile)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('justificatifs', 'justificatifs', false)
on conflict (id) do nothing;

create policy "Upload justificatifs du cabinet" on storage.objects
  for insert with check (
    bucket_id = 'justificatifs'
    and (
      (storage.foldername(name))[1] = public.current_user_cabinet_id()
      or public.current_user_role() = 'admin'
    )
  );

create policy "Lecture justificatifs du cabinet" on storage.objects
  for select using (
    bucket_id = 'justificatifs'
    and (
      (storage.foldername(name))[1] = public.current_user_cabinet_id()
      or public.current_user_role() = 'admin'
    )
  );

create policy "Suppression justificatifs du cabinet" on storage.objects
  for delete using (
    bucket_id = 'justificatifs'
    and (
      (storage.foldername(name))[1] = public.current_user_cabinet_id()
      or public.current_user_role() = 'admin'
    )
  );
