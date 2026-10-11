// Show Team — permanently delete the signed-in user's account and data.
//
// Called by the in-app "Delete account" flow (More → Account → Delete account),
// and backs the public deletion request at https://showteam.app/delete-account.html.
//
// Behaviour, keyed off the caller's OWN verified JWT:
//   • Team OWNER  → the entire team is deleted: its teams row (all animals,
//                   weights, photos, records live in that row's JSONB), every
//                   team_members link, and every pending team_invite.
//   • Team MEMBER → only their own membership link is removed; the team's
//                   shared records stay with the remaining members.
//   • In every case the user's auth account is permanently deleted, so their
//                   sign-in and email are erased from the system.
//
// There is no way to act on another user: the uid comes only from the verified
// JWT, never from the request body.

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

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401)
    const uid = userData.user.id

    // Teams this user owns — via the teams.owner column and via an Owner membership.
    const ownedIds = new Set<string>()
    {
      const { data: ownedByCol } = await admin.from('teams').select('id').eq('owner', uid)
      for (const r of ownedByCol || []) ownedIds.add(String((r as any).id))
    }
    const { data: memberships } = await admin
      .from('team_members').select('team_id, role').eq('user_id', uid)
    for (const m of memberships || []) {
      if (String((m as any).role) === 'Owner') ownedIds.add(String((m as any).team_id))
    }

    const owned = [...ownedIds]
    // Full team deletion for owned teams (children first, then the team row).
    if (owned.length) {
      await admin.from('team_invites').delete().in('team_id', owned)
      await admin.from('team_members').delete().in('team_id', owned)
      await admin.from('teams').delete().in('id', owned)
    }

    // For any remaining membership (member, not owner), remove just this user's link.
    await admin.from('team_members').delete().eq('user_id', uid)

    // Pending invites addressed to this user's email, in any team.
    const email = (userData.user.email || '').trim().toLowerCase()
    if (email) await admin.from('team_invites').delete().eq('email', email)

    // Finally, delete the auth user itself.
    const { error: delErr } = await admin.auth.admin.deleteUser(uid)
    if (delErr) return json({ error: 'Could not delete account', detail: delErr.message }, 500)

    return json({ ok: true, teamsDeleted: owned.length })
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
