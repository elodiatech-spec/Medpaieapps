-- MedPaie : fiche établissement, coffre-fort d'identifiants chiffré,
-- messagerie interne.

-- ============================================================
-- Fiche établissement : données de l'entreprise (cabinet médical)
-- ============================================================
alter table cabinets
  add column siret text,
  add column naf_code text,
  add column address text,
  add column contact_phone text,
  add column contact_email text,
  add column convention_code text, -- IDCC ou nom de l'OPCO
  add column at_mp_risk_code text,
  add column at_mp_rate numeric,
  add column bank_iban text,
  add column bank_bic text,
  add column urssaf_region text,
  add column retirement_org text,
  add column prevoyance_org_name text,
  add column prevoyance_contract_number text,
  add column mutuelle_org_name text,
  add column mutuelle_contract_number text;

-- ============================================================
-- Portails déclaratifs & coffre-fort d'identifiants (chiffré via Vault)
-- ============================================================
create extension if not exists supabase_vault cascade;

create table portal_credentials (
  id uuid default gen_random_uuid() primary key,
  cabinet_id text references cabinets(id) not null,
  portal_name text not null, -- ex: 'URSSAF', 'Net-Entreprises', 'Retraite complémentaire', 'Mutuelle'
  portal_url text,
  username text,
  secret_id uuid, -- référence vers vault.secrets : mot de passe chiffré, jamais en clair ici
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table portal_credentials enable row level security;

create policy "Coffre-fort réservé à l'admin" on portal_credentials
  for all using (public.current_user_role() = 'admin');

-- Écrit (ou remplace) le mot de passe chiffré d'un accès portail.
-- Le mot de passe en clair ne transite que le temps de l'appel, il n'est
-- jamais stocké tel quel : vault.create_secret le chiffre immédiatement.
create or replace function public.set_portal_password(p_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret_id uuid;
  v_old_secret_id uuid;
begin
  if public.current_user_role() != 'admin' then
    raise exception 'unauthorized';
  end if;

  select secret_id into v_old_secret_id from portal_credentials where id = p_id;

  v_secret_id := vault.create_secret(p_password);
  update portal_credentials set secret_id = v_secret_id where id = p_id;

  if v_old_secret_id is not null then
    delete from vault.secrets where id = v_old_secret_id;
  end if;
end;
$$;

-- Déchiffre et renvoie le mot de passe, réservé à l'admin.
create or replace function public.get_portal_password(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret_id uuid;
  v_password text;
begin
  if public.current_user_role() != 'admin' then
    raise exception 'unauthorized';
  end if;

  select secret_id into v_secret_id from portal_credentials where id = p_id;
  if v_secret_id is null then
    return null;
  end if;

  select decrypted_secret into v_password from vault.decrypted_secrets where id = v_secret_id;
  return v_password;
end;
$$;

-- ============================================================
-- Messagerie interne sécurisée (un fil de discussion par cabinet)
-- ============================================================
create table messages (
  id uuid default gen_random_uuid() primary key,
  cabinet_id text references cabinets(id) not null,
  sender_id uuid references profiles(id) not null,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages enable row level security;

create policy "Lecture des messages du cabinet" on messages
  for select using (
    cabinet_id = public.current_user_cabinet_id()
    or public.current_user_role() = 'admin'
  );

create policy "Envoi de messages dans son cabinet" on messages
  for insert with check (
    sender_id = auth.uid()
    and (
      cabinet_id = public.current_user_cabinet_id()
      or public.current_user_role() = 'admin'
    )
  );

create index idx_messages_cabinet on messages(cabinet_id, created_at);

alter publication supabase_realtime add table messages;
