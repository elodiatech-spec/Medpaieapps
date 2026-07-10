// Génère la facture du mois pour chaque cabinet actif et envoie un e-mail
// récapitulatif au médecin employeur. Déclenché le 1er de chaque mois par
// pg_cron (voir supabase/migrations/0005_cron_jobs.sql).
//
// Remarque : cette fonction calcule le montant et enregistre la facture en
// base + envoie un e-mail récapitulatif HTML. La génération d'un vrai PDF
// joint n'est pas encore implémentée (à ajouter dans un second temps).
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

const PRICES: Record<string, { engaged: number; free: number }> = {
  medi_paie_solo: { engaged: 79, free: 99 },
  medi_cab: { engaged: 149, free: 189 },
  medi_paie_cabplus: { engaged: 219, free: 279 },
  medi_paie_equipe: { engaged: 279, free: 359 },
  medi_paie_equipeplus: { engaged: 329, free: 419 },
}

Deno.serve(async () => {
  const now = new Date()
  if (now.getDate() !== 1) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 })
  }

  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: cabinets } = await supabase.from('cabinets').select('*').eq('active', true)

  let invoiced = 0

  for (const cabinet of cabinets ?? []) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('cabinet_id', cabinet.id)
      .eq('role', 'employee')

    const price = PRICES[cabinet.plan] ?? PRICES.medi_paie_solo
    const amount = cabinet.billing_commitment === 'engagement_12_mois' ? price.engaged : price.free

    const { error: insertError } = await supabase.from('invoices').insert({
      cabinet_id: cabinet.id,
      period,
      headcount: count ?? 0,
      amount_ttc: amount,
      status: 'pending',
    })

    // Contrainte unique (cabinet_id, period) : déjà facturé ce mois-ci, on passe.
    if (insertError) continue

    const { data: employers } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('cabinet_id', cabinet.id)
      .eq('role', 'employer')

    for (const employer of employers ?? []) {
      await sendEmail(
        employer.email,
        `Votre facture MedPaie — ${period.slice(0, 7)}`,
        `<p>Bonjour ${employer.first_name},</p><p>Votre facture du mois s'élève à ${amount.toFixed(2)} € TTC pour ${count ?? 0} salarié(s) déclaré(s).</p>`,
      )
    }

    await supabase
      .from('invoices')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('cabinet_id', cabinet.id)
      .eq('period', period)

    invoiced++
  }

  return new Response(JSON.stringify({ done: true, invoiced }), { status: 200 })
})
