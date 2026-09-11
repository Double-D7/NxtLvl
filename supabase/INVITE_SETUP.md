# Invitation emails — one-time setup

When you invite someone to your team, Show Team can send them a branded
invitation email from your own domain (`invites@showteam.app`) with a one-tap
"Accept invitation" button that opens the app with their email pre-filled.

The invite itself already works without this (they can sign up with the invited
email). This setup just turns on the email. ~15 minutes, done once.

## Who the email comes from
- **Display:** the inviting team's name, e.g. `Devitt Show Team <invites@showteam.app>`
- **Authenticated as** `showteam.app` (via SPF/DKIM below), so it lands in the
  inbox and shows no "via" tag.
- **Replies go to the inviter** (reply-to = the email of whoever sent the invite).
- **Delivered by** Resend (a transactional email service) on behalf of your domain.

---

## 1. Create a Resend account + verify showteam.app
1. Sign up at https://resend.com (free tier: 3,000 emails/mo, 100/day).
2. **Domains → Add Domain →** `showteam.app`.
3. Resend shows a set of **DNS records** (an SPF `TXT`, DKIM `CNAME`/`TXT`
   records, and usually a DMARC `TXT`). Add each one in **Cloudflare → DNS**
   for showteam.app exactly as shown.
   - These are email-auth records; they do **not** affect your website or the
     Email Routing you set up for `support@showteam.app`.
4. Back in Resend, click **Verify**. Wait until the domain shows **Verified**
   (DNS can take a few minutes).

## 2. Create an API key
1. Resend → **API Keys → Create API Key** (Sending access is enough).
2. Copy the key (starts with `re_`). You won't see it again.

## 3. Give the key to the Show Team function
From the repo root, with the Supabase CLI logged in to your project:
```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase functions deploy send-invite
```
That's it. The next invite you send will email a branded invitation.

---

## Changing the look or the from-name
- The email template + from address live in
  `supabase/functions/send-invite/index.ts` (`inviteEmailHTML` and
  `FROM_ADDRESS`). Edit, then re-run `supabase functions deploy send-invite`.
- The from **display name** is the team name automatically; the address is
  `invites@showteam.app`.

## If something's off
- **Not configured yet:** invites still record; the app shows "Invite saved —
  they can sign up with <email>" instead of "Invitation emailed". No error, no
  lost invite.
- **502 from the provider:** domain not verified in Resend yet, or the key is
  wrong — re-check steps 1–3.
- **Only owners/administrators** can trigger invite emails; the function
  verifies the caller's role server-side so the domain can't be used to spam.

## Optional: use a different provider
The function posts to Resend's API. To use Postmark/SendGrid instead, swap the
`fetch('https://api.resend.com/emails', …)` call for that provider's send API
(same idea: `from`, `to`, `reply_to`, `subject`, `html`, `text`) and set its key
as `RESEND_API_KEY` (or rename the env var to match).
