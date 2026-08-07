// Show Team — permanent account deletion (App Store requirement).
//
// Deletes the calling user's account and their data:
//  - teams they OWN  → the team's media (Storage), push subscriptions, invites,
//    members and the team row itself are all removed.
//  - teams they're a MEMBER of (owned by someone else) → they're removed from the
//    membership table and from the shared JSON roster (data.users).
//  - their push subscriptions, then finally the Supabase Auth user.
//
// Deploy:  supabase functions deploy delete-account
// (Uses the SERVICE ROLE key from the function's environment — never shipped to
//  the client. The caller is identified from their own JWT, so a user can only
//  ever delete themselves.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
    if (!jwt) return json({ error: 'Not authenticated' }, 401)

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

    // Identify the caller from their own token — they can only delete themselves.
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401)
    const uid = userData.user.id

    // 1) Teams this user OWNS → remove everything under them.
    const { data: owned } = await admin.from('teams').select('id').eq('owner', uid)
    for (const t of owned || []) {
      const teamId = t.id
      try {
        const { data: files } = await admin.storage.from('media').list(teamId, { limit: 1000 })
        if (files && files.length) {
          await admin.storage.from('media').remove(files.map((f: any) => `${teamId}/${f.name}`))
        }
      } catch (_) { /* storage may be empty */ }
      await admin.from('push_subscriptions').delete().eq('team_id', teamId)
      await admin.from('team_invites').delete().eq('team_id', teamId)
      await admin.from('team_members').delete().eq('team_id', teamId)
      await admin.from('teams').delete().eq('id', teamId)
    }

    // 2) Teams they're a MEMBER of (owned by others) → drop them from the roster too.
    const { data: mems } = await admin.from('team_members').select('team_id').eq('user_id', uid)
    for (const m of mems || []) {
      try {
        const { data: team } = await admin.from('teams').select('data').eq('id', m.team_id).single()
        const doc: any = team?.data
        if (doc && Array.isArray(doc.users)) {
          doc.users = doc.users.filter((u: any) => u.id !== uid)
          await admin.from('teams').update({ data: doc }).eq('id', m.team_id)
        }
      } catch (_) { /* best-effort roster cleanup */ }
    }
    await admin.from('team_members').delete().eq('user_id', uid)
    await admin.from('push_subscriptions').delete().eq('user_id', uid)

    // 3) Finally, delete the Auth user itself.
    const { error: delErr } = await admin.auth.admin.deleteUser(uid)
    if (delErr) return json({ error: delErr.message }, 500)

    return json({ ok: true })
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
