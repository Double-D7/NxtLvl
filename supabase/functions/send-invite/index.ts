// Show Team — send a branded team invitation email.
//
// The client already records the invite (team_invites row keyed by email); this
// function just emails the person a polished "you've been invited" message with
// a one-tap link that opens the app with their address pre-filled. They still
// become a member the normal way — by signing up with that email — so the email
// is a convenience + professionalism layer, never a security boundary.
//
// Auth: the caller is identified from their OWN JWT and must be an Owner or
// Administrator of the team they're inviting to, so the verified showteam.app
// sending domain can't be used to spam arbitrary addresses.
//
// Requires a Resend API key (transactional email) stored as a function secret:
//   supabase secrets set RESEND_API_KEY=re_xxx
// Deploy:  supabase functions deploy send-invite
// See supabase/INVITE_SETUP.md for the full one-time setup (domain, DNS, key).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const esc = (s: string) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// From address the recipient sees. Display name is the inviting team; the
// address is on the authenticated showteam.app domain (no "via" tag), and
// replies are routed back to the person who invited them.
const FROM_ADDRESS = 'invites@showteam.app'
const BRAND = 'Show Team'
const LOGO = 'https://showteam.app/icon-192.png'

function inviteEmailHTML(opts: {
  teamName: string; inviterName: string; role: string; email: string; acceptUrl: string
}) {
  const { teamName, inviterName, role, email, acceptUrl } = opts
  const roleLine = role && role !== 'Editor'
    ? `as ${/^[aeiou]/i.test(role) ? 'an' : 'a'} <b>${esc(role)}</b>`
    : 'to their team'
  const subject = `${inviterName} invited you to ${teamName} on ${BRAND}`
  const preheader = `Join ${teamName} ${role ? 'as ' + role : ''} — weights, feed, and show day, all in sync.`
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f0fa;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0fa;padding:28px 12px;">
 <tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 30px rgba(59,27,110,.12);">
   <tr><td style="background:#3B1B6E;padding:26px 32px;" align="center">
     <img src="${LOGO}" width="52" height="52" alt="${esc(BRAND)}" style="border-radius:13px;display:block;margin:0 auto 10px;">
     <div style="font:800 15px -apple-system,Segoe UI,Roboto,Arial,sans-serif;letter-spacing:3px;color:#c9b8ff;">SHOW TEAM</div>
   </td></tr>
   <tr><td style="padding:34px 32px 8px;">
     <h1 style="margin:0 0 14px;font:800 24px -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a1030;">You're invited</h1>
     <p style="margin:0 0 18px;font:400 16px/1.55 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#3d3355;">
       <b style="color:#1a1030;">${esc(inviterName)}</b> invited you to join <b style="color:#1a1030;">${esc(teamName)}</b> ${roleLine} on ${BRAND} — the daily operating system for serious show-livestock families.</p>
     <p style="margin:0 0 26px;font:400 15px/1.55 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#6a6088;">
       You'll see the animals you're assigned, log weigh-ins and hair &amp; hide inspections, and send coaching recommendations — everything in sync across the team.</p>
   </td></tr>
   <tr><td align="center" style="padding:0 32px 30px;">
     <a href="${esc(acceptUrl)}" style="display:inline-block;background:#6D28D9;color:#ffffff;text-decoration:none;font:800 16px -apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:15px 34px;border-radius:12px;">Accept invitation</a>
     <p style="margin:16px 0 0;font:400 13px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#8a80a5;">
       Create your account with <b style="color:#3d3355;">${esc(email)}</b> to join.</p>
   </td></tr>
   <tr><td style="padding:0 32px 26px;">
     <div style="border-top:1px solid #ece7f6;padding-top:16px;font:400 12px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#9a91b0;">
       Button not working? Open <span style="color:#6D28D9;">${esc(acceptUrl)}</span><br>
       If you weren't expecting this invitation, you can safely ignore this email.</div>
   </td></tr>
  </table>
  <div style="max-width:520px;margin:16px auto 0;font:400 12px -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#a9a0c0;text-align:center;">
    ${BRAND} · <a href="https://showteam.app" style="color:#8a80a5;">showteam.app</a></div>
 </td></tr>
</table></body></html>`
  const text = `${inviterName} invited you to join ${teamName}${role ? ' as ' + role : ''} on ${BRAND}.

Accept your invitation: ${acceptUrl}

Create your account with ${email} to join. You'll be able to log weigh-ins and inspections and send coaching recommendations, all in sync with the team.

If you weren't expecting this, you can ignore this email.
${BRAND} · showteam.app`
  return { subject, html, text }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return json({ error: 'Email sending not configured' }, 501)

    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
    if (!jwt) return json({ error: 'Not authenticated' }, 401)

    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const role = String(body.role || 'Editor').trim()
    const teamId = String(body.teamId || '').trim()
    const appUrl = (String(body.appUrl || 'https://showteam.app/').trim()) || 'https://showteam.app/'
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'A valid email is required' }, 400)
    if (!teamId) return json({ error: 'Missing team' }, 400)

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

    // Identify the caller and confirm they may invite to THIS team.
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401)
    const uid = userData.user.id

    const { data: mem } = await admin.from('team_members').select('role').eq('team_id', teamId).eq('user_id', uid).maybeSingle()
    if (!mem || !['Owner', 'Administrator'].includes(String(mem.role))) {
      return json({ error: 'Only an owner or administrator can send invitations' }, 403)
    }

    // Authoritative team name + inviter name (don't trust client display strings).
    const { data: team } = await admin.from('teams').select('name,data').eq('id', teamId).single()
    const teamName = (team?.data as any)?.team?.name || team?.name || 'a Show Team'
    const inviterName = (userData.user.user_metadata as any)?.name
      || (userData.user.email || '').split('@')[0] || 'A teammate'
    const inviterEmail = userData.user.email || undefined

    const acceptUrl = `${appUrl.replace(/[#?].*$/, '').replace(/\/?$/, '/')}?app=1&invite=${encodeURIComponent(email)}`
    const { subject, html, text } = inviteEmailHTML({ teamName, inviterName, role, email, acceptUrl })

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${teamName} <${FROM_ADDRESS}>`,
        to: [email],
        reply_to: inviterEmail,
        subject, html, text,
      }),
    })
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '')
      return json({ error: 'Email provider rejected the send', detail }, 502)
    }
    return json({ ok: true })
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
