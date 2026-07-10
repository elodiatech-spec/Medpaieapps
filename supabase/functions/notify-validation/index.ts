// Confirme à l'admin Elodiatech :
// 1. qu'un médecin vient de valider les variables de paie d'un salarié
//    (payroll_variables.status = 'validated')
// 2. qu'un nouveau justificatif vient d'être transmis par une salariée
//    (leave_requests.justification_document_url passe de vide à renseigné)
// Déclenché par des triggers SQL directs (voir supabase/migrations/0006 et 0011).
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

async function notifyAdmins(subject: string, html: string) {
  const { data: admins } = await supabase.from('profiles').select('email, first_name').eq('role', 'admin')
  for (const admin of admins ?? []) {
    await sendEmail(admin.email, subject, `<p>Bonjour ${admin.first_name},</p>${html}`)
  }
}

Deno.serve(async (req) => {
  const payload = await req.json()
  const record = payload.record

  if (payload.table === 'payroll_variables' && record?.status === 'validated') {
    const { data: employee } = await supabase
      .from('profiles')
      .select('first_name, last_name, cabinet_id')
      .eq('id', record.employee_id)
      .single()
    const { data: cabinet } = await supabase
      .from('cabinets')
      .select('name')
      .eq('id', employee?.cabinet_id)
      .single()

    await notifyAdmins(
      `Variables validées — ${cabinet?.name ?? ''}`,
      `<p>Les variables de paie de ${employee?.first_name} ${employee?.last_name} (${cabinet?.name}) viennent d'être validées par le médecin employeur. Vous pouvez procéder à l'export CSV.</p>`,
    )
    return new Response('ok', { status: 200 })
  }

  if (payload.table === 'leave_requests' && record?.justification_document_url) {
    const { data: employee } = await supabase
      .from('profiles')
      .select('first_name, last_name, cabinet_id')
      .eq('id', record.employee_id)
      .single()
    const { data: cabinet } = await supabase
      .from('cabinets')
      .select('name')
      .eq('id', employee?.cabinet_id)
      .single()

    await notifyAdmins(
      `Nouveau justificatif à valider — ${cabinet?.name ?? ''}`,
      `<p>${employee?.first_name} ${employee?.last_name} (${cabinet?.name}) vient de transmettre un justificatif. Merci de le vérifier et de le valider dans MedPaie.</p>`,
    )
    return new Response('ok', { status: 200 })
  }

  return new Response('ignored', { status: 200 })
})
