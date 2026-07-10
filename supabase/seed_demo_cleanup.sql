-- Supprime les données de démonstration créées par seed_demo.sql, y compris
-- les 2 comptes de test (médecin.demo / assistante.demo). À exécuter dans
-- Supabase → SQL Editor quand tu as fini de tester.

delete from payroll_variables where cabinet_id = 'cabinet-demo';
delete from leave_requests where cabinet_id = 'cabinet-demo';
delete from time_entries where cabinet_id = 'cabinet-demo';
delete from documents where cabinet_id = 'cabinet-demo';

delete from profiles where email in ('medecin.demo@elodiatech.com', 'assistante.demo@elodiatech.com');
delete from auth.users where email in ('medecin.demo@elodiatech.com', 'assistante.demo@elodiatech.com');

delete from cabinets where id = 'cabinet-demo';
