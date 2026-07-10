-- Supprime les données de démonstration créées par seed_demo.sql, y compris
-- les 4 comptes de test (medecin.demo1 / assistante.demo1 / medecin.demo2 /
-- assistante.demo2). À exécuter dans Supabase → SQL Editor quand tu as fini
-- de tester.

delete from payroll_variables where cabinet_id in ('cabinet-demo-1', 'cabinet-demo-2');
delete from leave_requests where cabinet_id in ('cabinet-demo-1', 'cabinet-demo-2');
delete from time_entries where cabinet_id in ('cabinet-demo-1', 'cabinet-demo-2');
delete from documents where cabinet_id in ('cabinet-demo-1', 'cabinet-demo-2');

delete from profiles where email in (
  'medecin.demo1@elodiatech.com', 'assistante.demo1@elodiatech.com',
  'medecin.demo2@elodiatech.com', 'assistante.demo2@elodiatech.com'
);
delete from auth.users where email in (
  'medecin.demo1@elodiatech.com', 'assistante.demo1@elodiatech.com',
  'medecin.demo2@elodiatech.com', 'assistante.demo2@elodiatech.com'
);

delete from cabinets where id in ('cabinet-demo-1', 'cabinet-demo-2');
