-- Permet de désactiver le compte d'un salarié (ou d'un médecin employeur)
-- qui quitte le cabinet, sans supprimer son historique de paie/congés.
-- Un compte désactivé ne peut plus se connecter (voir ProtectedRoute côté
-- app) et n'est plus compté dans les effectifs/facturation.

alter table profiles add column active boolean not null default true;

create index idx_profiles_cabinet_active on profiles(cabinet_id, active);
