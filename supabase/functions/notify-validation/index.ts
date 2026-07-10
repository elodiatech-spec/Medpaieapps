// Confirme à l'admin Elodiatech qu'un médecin vient de valider les variables
// de paie d'un salarié. Déclenché par un Database Webhook Supabase sur
// UPDATE de la table payroll_variables (voir README des fonctions).
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

Deno.serve(async (req) => {
  const payload = await req.json()
  const record = payload.record

  if (payload.table !== 'payroll_variables' || record?.status !== 'validated') {
    return new Response('ignored', { status: 200 })
  }

  const { data: admins } = await supabase.from('profiles').select('email, first_name').eq('role', 'admin')
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

  for (const admin of admins ?? []) {
    await sendEmail(
      admin.email,
      `Variables validées — ${cabinet?.name ?? ''}`,
      `<p>Bonjour ${admin.first_name},</p><p>Les variables de paie de ${employee?.first_name} ${employee?.last_name} (${cabinet?.name}) viennent d'être validées par le médecin employeur. Vous pouvez procéder à l'export CSV.</p>`,
    )
  }

  return new Response('ok', { status: 200 })
})
