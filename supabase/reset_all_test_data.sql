-- ⚠️ DESTRUCTEUR — supprime DÉFINITIVEMENT tous les cabinets, salariés,
-- médecins, congés, variables de paie, documents, factures et messages.
-- Seul ton compte administrateur est conservé.
-- À utiliser uniquement pour repartir sur une base vierge avant un test
-- grandeur nature. Aucune annulation possible après exécution.
--
-- À coller dans Supabase → SQL Editor → Run.

-- 1) Données rattachées aux cabinets/salariés
delete from documents;
delete from leave_requests;
delete from payroll_variables;
delete from time_entries;
delete from messages;
delete from portal_credentials;
delete from invoices;

-- 2) Comptes salariés/médecins (tout sauf les admins)
delete from profiles where role != 'admin';
delete from auth.users where id not in (select id from profiles);

-- 3) Cabinets (on garde le cabinet technique "a-affecter" utilisé par
--    l'inscription en attendant qu'un admin affecte le nouveau compte)
delete from cabinets where id != 'a-affecter';
