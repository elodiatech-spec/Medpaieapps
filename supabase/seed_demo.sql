-- Jeu de données de démonstration — 2 cabinets, pour tester l'application
-- "grandeur nature" (vue multi-cabinets, notifications, gestion de paie,
-- statistiques) sans utiliser un vrai cabinet client.
--
-- ÉTAPES :
-- 1. Ouvre MedPaie sur /inscription et crée 4 comptes de test, tous avec
--    le même mot de passe si tu veux (au moins 6 caractères) :
--      - medecin.demo1@elodiatech.com   (médecin employeur, cabinet 1)
--      - assistante.demo1@elodiatech.com (assistante médicale, cabinet 1)
--      - medecin.demo2@elodiatech.com   (médecin employeur, cabinet 2)
--      - assistante.demo2@elodiatech.com (assistante médicale, cabinet 2)
--    (si tu utilises d'autres e-mails, remplace TOUTES les occurrences
--    correspondantes ci-dessous avant d'exécuter le script)
-- 2. Colle ce fichier dans Supabase → SQL Editor → Run.
-- 3. Connecte-toi avec ton compte admin : les 2 cabinets, leurs salariés et
--    leurs congés/variables apparaissent dans "Cabinets", "Salariés",
--    "Gestion de paie" et le centre de notifications.
--
-- Ce script est rejouable sans dupliquer les données (ON CONFLICT / clauses
-- WHERE NOT EXISTS). Pour tout supprimer ensuite : seed_demo_cleanup.sql.

-- ============================================================
-- 1) Cabinets de démonstration
-- ============================================================
insert into cabinets (id, name, city, department, plan, billing_commitment, active)
values
  ('cabinet-demo-1', 'Cabinet Démo — Fort-de-France', 'Fort-de-France', 'Martinique', 'medi_cab', 'engagement_12_mois', true),
  ('cabinet-demo-2', 'Cabinet Démo — Pointe-à-Pitre', 'Pointe-à-Pitre', 'Guadeloupe', 'medi_paie_solo', 'sans_engagement', true)
on conflict (id) do nothing;

-- ============================================================
-- 2) Affecte les 4 comptes de test créés via /inscription
-- ============================================================
update profiles set
  cabinet_id = 'cabinet-demo-1', role = 'employer', first_name = 'Julie', last_name = 'Martin'
where email = 'medecin.demo1@elodiatech.com';

update profiles set
  cabinet_id = 'cabinet-demo-1', role = 'employee', first_name = 'Awa', last_name = 'Cadette',
  position_title = 'Assistante médicale', contract_type = 'cdi', work_time_type = 'temps_plein',
  weekly_hours = 35, hire_date = (current_date - interval '18 months')::date, base_salary = 1850
where email = 'assistante.demo1@elodiatech.com';

update profiles set
  cabinet_id = 'cabinet-demo-2', role = 'employer', first_name = 'Marc', last_name = 'Petit'
where email = 'medecin.demo2@elodiatech.com';

update profiles set
  cabinet_id = 'cabinet-demo-2', role = 'employee', first_name = 'Sarah', last_name = 'Joseph',
  position_title = 'Assistante médicale', contract_type = 'cdd', work_time_type = 'temps_plein',
  weekly_hours = 35, hire_date = (current_date - interval '3 months')::date,
  contract_end_date = (current_date + interval '20 days')::date, base_salary = 1800
where email = 'assistante.demo2@elodiatech.com';

-- ============================================================
-- 3) Heures hebdomadaires des 12 dernières semaines (cabinet 1 uniquement,
--    pour la courbe de taux de présence)
-- ============================================================
insert into time_entries (employee_id, cabinet_id, week_start_date, hours_worked)
select
  p.id, 'cabinet-demo-1', d::date,
  case when extract(week from d)::int % 3 = 0 then 38 else 35 end
from profiles p
cross join generate_series(
  date_trunc('week', current_date) - interval '11 weeks',
  date_trunc('week', current_date),
  interval '1 week'
) as d
where p.email = 'assistante.demo1@elodiatech.com'
on conflict (employee_id, week_start_date) do nothing;

-- ============================================================
-- 4) Variables de paie
--    Cabinet 1 : mois en cours soumis, mois précédent validé.
--    Cabinet 2 : rien saisi ce mois-ci (apparaît en "manquantes" dans
--    Gestion de paie, pour tester ce cas).
-- ============================================================
insert into payroll_variables (employee_id, cabinet_id, month_period, overtime_hours_25, kilometric_expenses, bonus_amount, status)
select p.id, 'cabinet-demo-1', date_trunc('month', current_date)::date, 6, 42.50, 0, 'submitted'
from profiles p where p.email = 'assistante.demo1@elodiatech.com'
on conflict (employee_id, month_period) do nothing;

insert into payroll_variables (employee_id, cabinet_id, month_period, overtime_hours_25, kilometric_expenses, bonus_amount, status)
select p.id, 'cabinet-demo-1', (date_trunc('month', current_date) - interval '1 month')::date, 3, 18.00, 50, 'validated'
from profiles p where p.email = 'assistante.demo1@elodiatech.com'
on conflict (employee_id, month_period) do nothing;

-- ============================================================
-- 5) Congés
--    Cabinet 1 : congé payé approuvé + arrêt maladie sans justificatif
--    (peuple le centre de notifications admin).
--    Cabinet 2 : demande de congé encore en attente de décision du médecin.
-- ============================================================
insert into leave_requests (employee_id, cabinet_id, start_date, end_date, leave_type, status)
select p.id, 'cabinet-demo-1', current_date + 20, current_date + 24, 'conges_payes', 'approved'
from profiles p
where p.email = 'assistante.demo1@elodiatech.com'
  and not exists (select 1 from leave_requests l where l.employee_id = p.id and l.leave_type = 'conges_payes');

insert into leave_requests (employee_id, cabinet_id, start_date, end_date, leave_type, status)
select p.id, 'cabinet-demo-1', current_date - 2, current_date, 'maladie', 'approved'
from profiles p
where p.email = 'assistante.demo1@elodiatech.com'
  and not exists (select 1 from leave_requests l where l.employee_id = p.id and l.leave_type = 'maladie');

insert into leave_requests (employee_id, cabinet_id, start_date, end_date, leave_type, status)
select p.id, 'cabinet-demo-2', current_date + 10, current_date + 12, 'rtt', 'pending'
from profiles p
where p.email = 'assistante.demo2@elodiatech.com'
  and not exists (select 1 from leave_requests l where l.employee_id = p.id and l.leave_type = 'rtt');

-- ============================================================
-- 6) Exemple de document (lien fiche de paie macompta.fr, cabinet 1)
-- ============================================================
insert into documents (cabinet_id, employee_id, document_name, document_type, macompta_paie_url, period)
select
  'cabinet-demo-1', p.id,
  'Bulletin de paie — ' || to_char(current_date - interval '1 month', 'TMMonth YYYY'),
  'fiche_de_paie', 'https://www.macompta.fr/exemple-fiche-de-paie',
  (date_trunc('month', current_date) - interval '1 month')::date
from profiles p
where p.email = 'assistante.demo1@elodiatech.com'
  and not exists (select 1 from documents d where d.employee_id = p.id and d.document_type = 'fiche_de_paie');
