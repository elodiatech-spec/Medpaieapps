// Confirme à l'admin Elodiatech qu'un médecin vient de valider les variables
// de paie d'un salarié. Déclenché par un Database Webhook Supabase sur
// UPDATE de la table payroll_variables (voir README des fonctions).
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendEmail } from '../_shared/resend.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

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
