// Rappels de saisie (J25) et alertes de retard (J27+) sur les variables de paie.
// Déclenché quotidiennement par pg_cron (voir supabase/migrations/0005_cron_jobs.sql).
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

Deno.serve(async () => {
  const now = new Date()
  const day = now.getDate()

  if (day !== 25 && day < 27) {
    return new Response(JSON.stringify({ skipped: true, day }), { status: 200 })
  }

  const monthPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: cabinets } = await supabase.from('cabinets').select('id, name').eq('active', true)

  let sent = 0

  for (const cabinet of cabinets ?? []) {
    const { data: employees } = await supabase
      .from('profiles')
      .select('id, email, first_name')
      .eq('cabinet_id', cabinet.id)
      .eq('role', 'employee')

    const { data: employers } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('cabinet_id', cabinet.id)
      .eq('role', 'employer')

    for (const employee of employees ?? []) {
      const { data: variable } = await supabase
        .from('payroll_variables')
        .select('status')
        .eq('employee_id', employee.id)
        .eq('month_period', monthPeriod)
        .maybeSingle()

      const status = variable?.status ?? null

      if (day === 25 && !status) {
        await sendEmail(
          employee.email,
          'Rappel : saisissez vos variables de paie',
          `<p>Bonjour ${employee.first_name},</p><p>Pensez à saisir vos variables de paie du mois sur MedPaie avant le 27.</p>`,
        )
        sent++
      }

      if (day >= 27 && status !== 'validated') {
        await sendEmail(
          employee.email,
          'Alerte : variables de paie non validées',
          `<p>Bonjour ${employee.first_name},</p><p>Vos variables de paie du mois ne sont pas encore validées par votre médecin. Merci de les compléter au plus vite si ce n'est pas fait.</p>`,
        )
        sent++
        for (const employer of employers ?? []) {
          await sendEmail(
            employer.email,
            `Alerte : variables non validées — ${cabinet.name}`,
            `<p>Bonjour ${employer.first_name},</p><p>Les variables de paie de ${employee.first_name} ne sont pas encore validées pour ${cabinet.name}. La date limite approche.</p>`,
          )
          sent++
        }
      }
    }
  }

  return new Response(JSON.stringify({ done: true, sent }), { status: 200 })
})
