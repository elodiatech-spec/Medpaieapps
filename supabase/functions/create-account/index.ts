// Permet à l'admin Elodiatech de créer directement, depuis l'application,
// le compte d'un médecin employeur ou d'une assistante médicale et de
// l'affecter à un cabinet — sans passer par le tableau de bord Supabase.
//
// La création d'un compte auth (auth.admin.createUser) exige la clé de
// service, qui ne doit jamais être exposée au navigateur : cette étape
// passe donc obligatoirement par une Edge Function. Le trigger
// on_auth_user_created (migration 0001) crée ensuite automatiquement la
// ligne "profiles" à partir des métadonnées transmises ici.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Authentification requise.' }, 401)

  const { data: userData, error: userError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )
  if (userError || !userData.user) return json({ error: 'Session invalide.' }, 401)

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return json({ error: 'Réservé aux administrateurs Elodiatech.' }, 403)
  }

  const { email, firstName, lastName, role, cabinetId } = await req.json()

  if (!email || !firstName || !lastName || !role || !cabinetId) {
    return json({ error: 'Champs manquants.' }, 400)
  }
  if (role !== 'employer' && role !== 'employee') {
    return json({ error: 'Rôle invalide.' }, 400)
  }

  // Mot de passe temporaire aléatoire : la personne le définira elle-même
  // via l'e-mail "définir votre mot de passe" envoyé juste après.
  const temporaryPassword = crypto.randomUUID()

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      role,
      cabinet_id: cabinetId,
    },
  })

  if (createError) {
    const message = createError.message.includes('already been registered')
      ? 'Un compte existe déjà avec cet e-mail.'
      : createError.message
    return json({ error: message }, 400)
  }

  return json({ userId: created.user?.id })
})
