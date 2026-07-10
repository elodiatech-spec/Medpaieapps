-- ⚠️ DESTRUCTEUR — supprime DÉFINITIVEMENT tous les cabinets, salariés,
-- médecins, congés, variables de paie, documents, factures et messages.
-- Seul ton compte administrateur est conservé.
-- À utiliser uniquement pour repartir sur une base vierge avant un test
-- grandeur nature. Aucune annulation possible après exécution.
--
-- Tolérant aux tables optionnelles pas encore créées sur ce projet
-- (ignore silencieusement une table absente au lieu d'échouer).
--
-- À coller dans Supabase → SQL Editor → Run.

do $$
declare
  t text;
begin
  foreach t in array array[
    'documents', 'leave_requests', 'payroll_variables', 'time_entries',
    'messages', 'portal_credentials', 'invoices'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('delete from %I', t);
    end if;
  end loop;
end $$;

-- Comptes salariés/médecins (tout sauf les admins)
delete from profiles where role != 'admin';
delete from auth.users where id not in (select id from profiles);

-- Cabinets (on garde le cabinet technique "a-affecter" utilisé par
-- l'inscription en attendant qu'un admin affecte le nouveau compte)
delete from cabinets where id != 'a-affecter';
