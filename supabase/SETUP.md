# Turn on shared cloud sync (Supabase)

This makes multiple people see and update the **same** data live across
phones, tablets and computers. About 5–10 minutes, one-time.

The app works fine without this (local-only). Everything below is optional
until you want sharing.

---

## 1. Create a free Supabase project

1. Go to **https://supabase.com** → sign up → **New project**.
2. Name it (e.g. `devitt-show-team`), pick a region near you, set a database
   password (save it somewhere), and create. Give it ~2 minutes to provision.

## 2. Run the database setup

1. In your project, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this repo, copy its entire contents, paste
   into the editor, and click **Run**.
3. You should see "Success". This creates the tables, security rules, the live
   sync channel, and the private `media` storage bucket.

## 3. Get your keys

1. Open **Project Settings → API**.
2. Copy the **Project URL** (e.g. `https://abcd1234.supabase.co`).
3. Copy the **anon public** key (a long `eyJ...` string).

> Both are safe to put in the app. The anon key can only do what the security
> rules (Row-Level Security) allow — it does **not** grant admin access.

## 4. Connect the app — pick ONE

**Option A — in the app (fastest, great for testing):**
Open the app → **More → Connect to cloud** → paste the URL and anon key →
**Connect & reload**.

**Option B — commit it (so every device is pre-configured):**
Edit `config.js` and fill in:

```js
window.DFST_CONFIG = {
  supabaseUrl:     "https://abcd1234.supabase.co",
  supabaseAnonKey: "eyJhbGciOi..."
};
```

Commit and deploy. Now the site is cloud-enabled for everyone who opens it.

## 5. Create the team + invite family

1. Reload the app. You'll get a real **Create account** screen.
2. Sign up as the **owner** (e.g. your email). Your existing on-device animals
   automatically become the team's shared cloud data.
3. Go to **Team → Invite**, enter a family member's email and role, send.
4. They open the app, tap **Create an account**, sign up **with that same
   email**, and they're instantly on the team — seeing the same animals.

Add a weight on one phone; it appears on the others within a second.

---

## Optional: Google / Apple sign-in

The "Continue with Google/Apple" buttons work once you enable those providers:

- **Google:** Supabase → **Authentication → Providers → Google** → enable and
  paste a Google OAuth client ID/secret (from Google Cloud Console). Add your
  site URL to **Authentication → URL Configuration → Redirect URLs**.
- **Apple:** same screen, **Apple** provider (requires an Apple Developer
  account).

Email/password works with no extra setup.

## Optional: smoother email confirmation

By default Supabase emails a confirmation link on sign-up. For a family app you
can turn that off at **Authentication → Providers → Email → "Confirm email"
(off)** so people can sign in immediately. Leave it on if you prefer verified
emails.

---

## How it works (for the curious)

- **One document per team.** The whole dataset is a single JSON row in `teams`.
  Every device loads it into memory, writes push it back, and Supabase
  **Realtime** streams changes to everyone else. Simple, robust, and plenty for
  a family operation.
- **Security.** `team_members` + Row-Level Security guarantee you can only read
  or write teams you belong to. Media URLs are private and signed.
- **Offline.** Each device keeps a local cache, so the barn still works with no
  signal; changes sync when you're back online.
- **Trade-off.** Because a team shares one document, two people editing the
  *exact same second* is last-write-wins. Realtime keeps everyone current, so
  in practice this is a non-issue at family scale. If you ever outgrow it, the
  data layer (`Cloud`/`DB` in `app.js`) is isolated so it can be upgraded to
  per-record tables without touching the UI.

## Troubleshooting

- **"Could not create team" / permission errors:** re-run `schema.sql` — the
  security policies probably didn't apply.
- **Invite didn't work:** the person must sign up with the **exact** email you
  invited (case-insensitive). Check **Team** shows them as pending.
- **Media not loading on another device:** confirm the `media` bucket exists
  (Storage tab) and the storage policies from `schema.sql` ran.
- **Nothing syncs:** open the browser console; check the Project URL/anon key
  are correct in **More → Connect to cloud**.
