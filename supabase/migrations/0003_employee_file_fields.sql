-- Complète le dossier salarié (fiche salarié) avec les champs nécessaires
-- à l'établissement de la paie dans macompta.fr : état civil, contrat de
-- travail, congés payés, fiscalité (PAS) et protection sociale.

alter table profiles
  -- État civil complémentaire
  add column birth_place text,
  add column gender text check (gender in ('homme', 'femme')),
  add column ntt text, -- numéro technique temporaire (si NIR pas encore connu)

  -- Contrat de travail complémentaire
  add column hire_date date,
  add column contract_end_date date, -- date de fin si CDD
  add column weekly_hours numeric, -- ex: 35, 24 (temps partiel)
  add column coefficient text, -- coefficient / niveau selon convention
  add column base_salary numeric, -- salaire de base mensuel ou horaire
  add column trial_period_end date,
  add column contract_number text,

  -- Congés payés
  add column paid_leave_acquired numeric default 0,
  add column paid_leave_taken numeric default 0,

  -- Fiscalité — Prélèvement à la source
  add column pas_rate numeric, -- taux en %
  add column pas_rate_type text check (pas_rate_type in ('personnalise', 'neutre', 'individualise')),
  add column pas_start_date date,

  -- Protection sociale
  add column mutuelle_affiliated boolean default false,
  add column mutuelle_date date,
  add column mutuelle_regime text check (mutuelle_regime in ('isole', 'famille')),
  add column mutuelle_waiver_reason text,
  add column prevoyance_affiliated boolean default false,
  add column prevoyance_date date,
  add column prevoyance_category text check (prevoyance_category in ('cadre', 'non_cadre')),
  add column retirement_tranche text check (retirement_tranche in ('T1', 'T2'));
