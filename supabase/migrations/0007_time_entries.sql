-- Déclaration hebdomadaire des heures travaillées, utilisée pour calculer
-- automatiquement les heures supplémentaires majorées (25 %/50 %) des
-- variables de paie mensuelles, et pour donner au médecin un taux de
-- présence de son équipe.

create table time_entries (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references profiles(id) not null,
  cabinet_id text references cabinets(id) not null,
  week_start_date date not null, -- lundi de la semaine (ISO)
  hours_worked numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (employee_id, week_start_date)
);

alter table time_entries enable row level security;

create policy "Accès aux heures du cabinet" on time_entries
  for all using (
    cabinet_id = public.current_user_cabinet_id()
    or public.current_user_role() = 'admin'
  );

create index idx_time_entries_employee_week on time_entries(employee_id, week_start_date);
