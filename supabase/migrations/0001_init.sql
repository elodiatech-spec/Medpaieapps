-- MedPaie : schéma initial
-- Cabinets médicaux, profils utilisateurs, variables de paie, congés, documents, factures.

-- ============================================================
-- Table 0 : cabinets (dossiers clients / cabinets médicaux)
-- ============================================================
create table cabinets (
  id text primary key, -- slug unique, ex: 'cabinet-dupont-fdf'
  name text not null,
  city text,
  department text check (department in ('Guadeloupe', 'Martinique')),
  plan text check (
    plan in ('medi_paie_solo', 'medi_cab', 'medi_paie_cabplus', 'medi_paie_equipe', 'medi_paie_equipeplus')
  ) not null default 'medi_paie_solo',
  billing_commitment text check (billing_commitment in ('sans_engagement', 'engagement_12_mois')) not null default 'sans_engagement',
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- Table 1 : profiles (utilisateurs, rôles et dossier salarié)
-- ============================================================
create table profiles (
  id uuid references auth.users not null primary key,
  cabinet_id text references cabinets(id) not null,
  first_name text not null,
  last_name text not null,
  role text check (role in ('admin', 'employer', 'employee')) not null,
  email text not null,
  phone text,
  -- Dossier salarié (état civil & contrat, cf. 3.2 du cahier des charges)
  birth_name text,
  birth_date date,
  address text,
  nir text, -- numéro de sécurité sociale
  iban text, -- RIB
  position_title text, -- poste occupé
  contract_type text check (contract_type in ('cdi', 'cdd')),
  work_time_type text check (work_time_type in ('temps_plein', 'temps_partiel')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

create policy "Lecture des profils du même cabinet" on profiles
  for select using (
    auth.uid() in (
      select id from profiles where cabinet_id = profiles.cabinet_id
    ) or (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Mise à jour de son propre profil" on profiles
  for update using (
    id = auth.uid() or (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Création automatique d'un profil (rôle par défaut 'employee') à l'inscription.
-- Le cabinet et le rôle définitifs sont ensuite ajustés par l'admin Elodiatech.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, cabinet_id, first_name, last_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'cabinet_id', 'a-affecter'),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'employee'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Cabinet "tampon" utilisé par le trigger tant que l'admin n'a pas affecté
-- le nouvel utilisateur à son cabinet définitif.
insert into cabinets (id, name, plan, active)
values ('a-affecter', 'À affecter', 'medi_paie_solo', false);

-- Policies cabinets (définies ici : elles dépendent de la table profiles)
alter table cabinets enable row level security;

create policy "Lecture du cabinet par ses membres ou l'admin" on cabinets
  for select using (
    id in (select cabinet_id from profiles where id = auth.uid())
    or (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Gestion des cabinets réservée à l'admin" on cabinets
  for insert with check ((select role from profiles where id = auth.uid()) = 'admin');

create policy "Modification des cabinets réservée à l'admin" on cabinets
  for update using ((select role from profiles where id = auth.uid()) = 'admin');

-- ============================================================
-- Table 2 : payroll_variables (saisie des éléments variables)
-- ============================================================
create table payroll_variables (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references profiles(id) not null,
  cabinet_id text references cabinets(id) not null,
  month_period date not null, -- format 'YYYY-MM-01'
  overtime_hours_25 numeric default 0.00, -- majoration 25%
  overtime_hours_50 numeric default 0.00, -- majoration 50%
  kilometric_expenses numeric default 0.00, -- indemnités kilométriques
  bonus_amount numeric default 0.00, -- primes
  notes text,
  status text check (status in ('draft', 'submitted', 'validated')) default 'draft' not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (employee_id, month_period)
);

alter table payroll_variables enable row level security;

create policy "Accès aux variables du cabinet" on payroll_variables
  for all using (
    (select cabinet_id from profiles where id = auth.uid()) = cabinet_id
    or (select role from profiles where id = auth.uid()) = 'admin'
  );

-- ============================================================
-- Table 3 : leave_requests (gestion des absences et congés)
-- ============================================================
create table leave_requests (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references profiles(id) not null,
  cabinet_id text references cabinets(id) not null,
  start_date date not null,
  end_date date not null,
  leave_type text check (leave_type in ('conges_payes', 'rtt', 'maladie', 'evenement_familial')) not null,
  justification_document_url text, -- lien Google Drive
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table leave_requests enable row level security;

create policy "Gestion des congés du cabinet" on leave_requests
  for all using (
    (select cabinet_id from profiles where id = auth.uid()) = cabinet_id
    or (select role from profiles where id = auth.uid()) = 'admin'
  );

-- ============================================================
-- Table 4 : documents (fiches de paie et justificatifs)
-- ============================================================
create table documents (
  id uuid default gen_random_uuid() primary key,
  cabinet_id text references cabinets(id) not null,
  employee_id uuid references profiles(id),
  document_name text not null,
  document_type text check (
    document_type in ('fiche_de_paie', 'justificatif_absence', 'facture_mensuelle')
  ) not null,
  google_drive_id text, -- ID d'archivage sur Google Drive
  macompta_paie_url text, -- lien direct vers le PDF généré par macompta.fr
  period date, -- mois concerné, format 'YYYY-MM-01'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table documents enable row level security;

create policy "Accès aux documents autorisés" on documents
  for all using (
    (select cabinet_id from profiles where id = auth.uid()) = cabinet_id
    or (select role from profiles where id = auth.uid()) = 'admin'
  );

-- ============================================================
-- Table 5 : invoices (facturation mensuelle automatisée, cf. 4.6)
-- ============================================================
create table invoices (
  id uuid default gen_random_uuid() primary key,
  cabinet_id text references cabinets(id) not null,
  period date not null, -- mois facturé, format 'YYYY-MM-01'
  headcount integer not null,
  amount_ttc numeric not null,
  pdf_url text,
  sent_at timestamp with time zone,
  status text check (status in ('pending', 'sent', 'paid')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (cabinet_id, period)
);

alter table invoices enable row level security;

create policy "Accès aux factures du cabinet" on invoices
  for select using (
    (select cabinet_id from profiles where id = auth.uid()) = cabinet_id
    or (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Gestion des factures réservée à l'admin" on invoices
  for all using ((select role from profiles where id = auth.uid()) = 'admin');

-- ============================================================
-- Index utiles
-- ============================================================
create index idx_profiles_cabinet on profiles(cabinet_id);
create index idx_payroll_variables_cabinet_period on payroll_variables(cabinet_id, month_period);
create index idx_leave_requests_cabinet on leave_requests(cabinet_id);
create index idx_documents_cabinet on documents(cabinet_id);
create index idx_invoices_cabinet_period on invoices(cabinet_id, period);
