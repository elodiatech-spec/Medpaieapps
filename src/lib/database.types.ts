export type Role = 'admin' | 'employer' | 'employee'

export type Plan =
  | 'medi_paie_solo'
  | 'medi_cab'
  | 'medi_paie_cabplus'
  | 'medi_paie_equipe'
  | 'medi_paie_equipeplus'

export type BillingCommitment = 'sans_engagement' | 'engagement_12_mois'

export type PayrollStatus = 'draft' | 'submitted' | 'validated'

export type LeaveType = 'conges_payes' | 'rtt' | 'maladie' | 'evenement_familial'

export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export type DocumentType = 'fiche_de_paie' | 'justificatif_absence' | 'facture_mensuelle'

export interface Cabinet {
  id: string
  name: string
  city: string | null
  department: 'Guadeloupe' | 'Martinique' | null
  plan: Plan
  billing_commitment: BillingCommitment
  active: boolean
  created_at: string
  // Fiche établissement
  siret: string | null
  naf_code: string | null
  address: string | null
  contact_phone: string | null
  contact_email: string | null
  convention_code: string | null
  at_mp_risk_code: string | null
  at_mp_rate: number | null
  bank_iban: string | null
  bank_bic: string | null
  urssaf_region: string | null
  retirement_org: string | null
  prevoyance_org_name: string | null
  prevoyance_contract_number: string | null
  mutuelle_org_name: string | null
  mutuelle_contract_number: string | null
}

export interface PortalCredential {
  id: string
  cabinet_id: string
  portal_name: string
  portal_url: string | null
  username: string | null
  secret_id: string | null
  notes: string | null
  created_at: string
}

export interface Message {
  id: string
  cabinet_id: string
  sender_id: string
  body: string
  created_at: string
}

export type Gender = 'homme' | 'femme'
export type PasRateType = 'personnalise' | 'neutre' | 'individualise'
export type MutuelleRegime = 'isole' | 'famille'
export type PrevoyanceCategory = 'cadre' | 'non_cadre'
export type RetirementTranche = 'T1' | 'T2'

export interface Profile {
  id: string
  cabinet_id: string
  first_name: string
  last_name: string
  role: Role
  email: string
  phone: string | null
  // État civil
  birth_name: string | null
  birth_date: string | null
  birth_place: string | null
  gender: Gender | null
  address: string | null
  nir: string | null
  ntt: string | null
  iban: string | null
  // Contrat de travail
  position_title: string | null
  contract_type: 'cdi' | 'cdd' | null
  work_time_type: 'temps_plein' | 'temps_partiel' | null
  hire_date: string | null
  contract_end_date: string | null
  weekly_hours: number | null
  coefficient: string | null
  base_salary: number | null
  trial_period_end: string | null
  contract_number: string | null
  // Congés payés
  paid_leave_acquired: number | null
  paid_leave_taken: number | null
  // Fiscalité — prélèvement à la source
  pas_rate: number | null
  pas_rate_type: PasRateType | null
  pas_start_date: string | null
  // Protection sociale
  mutuelle_affiliated: boolean | null
  mutuelle_date: string | null
  mutuelle_regime: MutuelleRegime | null
  mutuelle_waiver_reason: string | null
  prevoyance_affiliated: boolean | null
  prevoyance_date: string | null
  prevoyance_category: PrevoyanceCategory | null
  retirement_tranche: RetirementTranche | null
  created_at: string
}

export interface TimeEntry {
  id: string
  employee_id: string
  cabinet_id: string
  week_start_date: string
  hours_worked: number
  created_at: string
  updated_at: string
}

export interface PayrollVariable {
  id: string
  employee_id: string
  cabinet_id: string
  month_period: string
  overtime_hours_25: number
  overtime_hours_50: number
  kilometric_expenses: number
  bonus_amount: number
  notes: string | null
  status: PayrollStatus
  updated_at: string
}

export interface LeaveRequest {
  id: string
  employee_id: string
  cabinet_id: string
  start_date: string
  end_date: string
  leave_type: LeaveType
  justification_document_url: string | null
  status: LeaveStatus
  created_at: string
}

export interface AppDocument {
  id: string
  cabinet_id: string
  employee_id: string | null
  document_name: string
  document_type: DocumentType
  google_drive_id: string | null
  macompta_paie_url: string | null
  period: string | null
  created_at: string
}

export interface Invoice {
  id: string
  cabinet_id: string
  period: string
  headcount: number
  amount_ttc: number
  pdf_url: string | null
  sent_at: string | null
  status: 'pending' | 'sent' | 'paid'
  created_at: string
}

export const PLAN_LABELS: Record<Plan, string> = {
  medi_paie_solo: 'MEDI PAIE SOLO',
  medi_cab: 'MEDI CAB',
  medi_paie_cabplus: 'MEDI PAIE CAB+',
  medi_paie_equipe: 'MEDI PAIE EQUIPE',
  medi_paie_equipeplus: 'MEDI PAIE EQUIPE+',
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  conges_payes: 'Congés payés',
  rtt: 'RTT',
  maladie: 'Arrêt maladie',
  evenement_familial: 'Événement familial',
}
