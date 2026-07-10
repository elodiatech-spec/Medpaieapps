// Alerte la salariée et le médecin employeur quand un congé qui exige
// légalement un justificatif (arrêt maladie, accident du travail, accident
// de trajet, maternité) n'a pas de justificatif transmis, ou que celui-ci
// n'a pas encore été validé par l'admin. Déclenché quotidiennement par
// pg_cron (voir supabase/migrations/0009_justification_reminders_cron.sql).
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.error('RESEND_API_KEY manquante — email non envoyé', { to, subject })
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('RESEND_FROM') ?? 'MedPaie <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    console.error('Échec envoi email Resend', res.status, await res.text())
  }
}

const JUSTIFICATION_REQUIRED_TYPES = ['maladie', 'accident_travail', 'accident_trajet', 'maternite']
const LEAVE_TYPE_LABELS: Record<string, string> = {
  maladie: 'Arrêt maladie',
  accident_travail: 'Accident du travail',
  accident_trajet: 'Accident de trajet',
  maternite: 'Congé maternité',
}

Deno.serve(async () => {
  const { data: pendingLeaves } = await supabase
    .from('leave_requests')
    .select('id, employee_id, cabinet_id, leave_type, start_date, end_date, justification_document_url, justification_validated')
    .in('leave_type', JUSTIFICATION_REQUIRED_TYPES)
    .neq('status', 'rejected')
    .or('justification_document_url.is.null,justification_validated.eq.false')

  let sent = 0

  for (const leave of pendingLeaves ?? []) {
    const missing = !leave.justification_document_url
    const reason = missing ? "n'a pas encore de justificatif transmis" : "a un justificatif en attente de validation par l'administrateur"
    const label = LEAVE_TYPE_LABELS[leave.leave_type] ?? leave.leave_type

    const { data: employee } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', leave.employee_id)
      .single()

    const { data: employers } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('cabinet_id', leave.cabinet_id)
      .eq('role', 'employer')

    if (employee) {
      await sendEmail(
        employee.email,
        `Justificatif à transmettre — ${label}`,
        `<p>Bonjour ${employee.first_name},</p><p>Votre déclaration "${label}" du ${leave.start_date} au ${leave.end_date} ${reason}. Merci de régulariser dès que possible depuis MedPaie.</p>`,
      )
      sent++
    }

    for (const employer of employers ?? []) {
      await sendEmail(
        employer.email,
        `Justificatif en attente — ${employee?.first_name ?? ''} ${employee?.last_name ?? ''}`,
        `<p>Bonjour ${employer.first_name},</p><p>La déclaration "${label}" de ${employee?.first_name} ${employee?.last_name} ${reason}.</p>`,
      )
      sent++
    }
  }

  return new Response(JSON.stringify({ done: true, sent }), { status: 200 })
})
