-- Jeu de données de démonstration, pour tester l'application avec du
-- contenu réaliste (heures, congés, variables de paie, document) sans
-- utiliser un vrai cabinet client.
--
-- ÉTAPES :
-- 1. Ouvre MedPaie sur /inscription et crée 2 comptes de test avec le mot
--    de passe de ton choix :
--      - un médecin employeur, par ex. medecin.demo@elodiatech.com
--      - une assistante médicale, par ex. assistante.demo@elodiatech.com
--    (adapte les e-mails ci-dessous si tu en utilises d'autres — remplace
--    TOUTES les occurrences dans ce fichier avant de l'exécuter)
-- 2. Colle ce fichier dans Supabase → SQL Editor → Run.
-- 3. Connecte-toi avec le compte médecin.demo pour explorer les données.
--
-- Ce script est rejouable sans dupliquer les données (ON CONFLICT / clauses
-- WHERE NOT EXISTS).

-- ============================================================
-- 1) Cabinet de démonstration
-- ============================================================
insert into cabinets (id, name, city, department, plan, billing_commitment, active)
values ('cabinet-demo', 'Cabinet Démo', 'Fort-de-France', 'Martinique', 'medi_cab', 'engagement_12_mois', true)
on conflict (id) do nothing;

-- ============================================================
-- 2) Affecte les 2 comptes de test créés via /inscription
-- ============================================================
update profiles set
  cabinet_id = 'cabinet-demo',
  role = 'employer',
  first_name = 'Julie',
  last_name = 'Martin'
where email = 'medecin.demo@elodiatech.com';

update profiles set
  cabinet_id = 'cabinet-demo',
  role = 'employee',
  first_name = 'Awa',
  last_name = 'Cadette',
  position_title = 'Assistante médicale',
  contract_type = 'cdi',
  work_time_type = 'temps_plein',
  weekly_hours = 35,
  hire_date = (current_date - interval '18 months')::date,
  base_salary = 1850
where email = 'assistante.demo@elodiatech.com';

-- ============================================================
-- 3) Heures hebdomadaires des 12 dernières semaines (fait varier le taux
--    de présence et génère quelques heures supplémentaires)
-- ============================================================
insert into time_entries (employee_id, cabinet_id, week_start_date, hours_worked)
select
  p.id,
  'cabinet-demo',
  d::date,
  case when extract(week from d)::int % 3 = 0 then 38 else 35 end
from profiles p
cross join generate_series(
  date_trunc('week', current_date) - interval '11 weeks',
  date_trunc('week', current_date),
  interval '1 week'
) as d
where p.email = 'assistante.demo@elodiatech.com'
on conflict (employee_id, week_start_date) do nothing;

-- ============================================================
-- 4) Variables de paie : mois en cours (soumis) + mois précédent (validé)
-- ============================================================
insert into payroll_variables (employee_id, cabinet_id, month_period, overtime_hours_25, kilometric_expenses, bonus_amount, status)
select p.id, 'cabinet-demo', date_trunc('month', current_date)::date, 6, 42.50, 0, 'submitted'
from profiles p where p.email = 'assistante.demo@elodiatech.com'
on conflict (employee_id, month_period) do nothing;

insert into payroll_variables (employee_id, cabinet_id, month_period, overtime_hours_25, kilometric_expenses, bonus_amount, status)
select p.id, 'cabinet-demo', (date_trunc('month', current_date) - interval '1 month')::date, 3, 18.00, 50, 'validated'
from profiles p where p.email = 'assistante.demo@elodiatech.com'
on conflict (employee_id, month_period) do nothing;

-- ============================================================
-- 5) Congés : un congé payé déjà approuvé, un arrêt maladie en attente
--    de justificatif (pour peupler le centre de notifications admin)
-- ============================================================
insert into leave_requests (employee_id, cabinet_id, start_date, end_date, leave_type, status)
select p.id, 'cabinet-demo', current_date + 20, current_date + 24, 'conges_payes', 'approved'
from profiles p
where p.email = 'assistante.demo@elodiatech.com'
  and not exists (
    select 1 from leave_requests l where l.employee_id = p.id and l.leave_type = 'conges_payes'
  );

insert into leave_requests (employee_id, cabinet_id, start_date, end_date, leave_type, status)
select p.id, 'cabinet-demo', current_date - 2, current_date, 'maladie', 'approved'
from profiles p
where p.email = 'assistante.demo@elodiatech.com'
  and not exists (
    select 1 from leave_requests l where l.employee_id = p.id and l.leave_type = 'maladie'
  );

-- ============================================================
-- 6) Exemple de document (lien fiche de paie macompta.fr)
-- ============================================================
insert into documents (cabinet_id, employee_id, document_name, document_type, macompta_paie_url, period)
select
  'cabinet-demo',
  p.id,
  'Bulletin de paie — ' || to_char(current_date - interval '1 month', 'TMMonth YYYY'),
  'fiche_de_paie',
  'https://www.macompta.fr/exemple-fiche-de-paie',
  (date_trunc('month', current_date) - interval '1 month')::date
from profiles p
where p.email = 'assistante.demo@elodiatech.com'
  and not exists (
    select 1 from documents d where d.employee_id = p.id and d.document_type = 'fiche_de_paie'
  );
