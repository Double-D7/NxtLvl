# Show Team — Demo Account (for App Store + Play reviewers)

Both stores auto-reject apps behind a login unless you give the reviewer working
credentials. This builds one demo account that works for **both** stores.

**Login the reviewers will use:**
- Email: `demo@showteam.app`
- Password: `ShowTeam#Demo2026`  *(a demo account with only fake data — a known password is fine and expected)*

You'll set that password in Step 1. It's already written into both listing files'
review notes.

---

## How it works (30-second version)
Your app turns a brand-new user's **local browser data** into their cloud team on
first login. So we: (1) create the login, (2) seed one browser with a realistic
herd, (3) log in once — the app pushes that herd to the cloud. After that, any
device that logs in as demo sees the full app.

You do **not** need any service keys or database access — just the Supabase
dashboard and a browser.

---

## Step 1 — Create the login (Supabase dashboard, ~1 min)
1. Go to https://supabase.com/dashboard → your Show Team project.
2. **Authentication → Users → Add user**.
3. Email: `demo@showteam.app`
4. Password: `ShowTeam#Demo2026`
5. **Check "Auto Confirm User"** (important — this skips email verification, so you
   don't need a working mailbox for that address).
6. Create user.

## Step 2 — Seed one browser with the demo herd (~1 min)
1. Open **https://showteam.app** in Chrome on your Mac. **Do not log in yet.**
   - If it shows the marketing page, go to **https://showteam.app/?app=1** to open the app.
2. Open DevTools: **View → Developer → JavaScript Console** (or ⌥⌘J).
3. Open `seed-demo.js` (in this folder), copy the **entire** file, paste it into the
   console, press **Return**.
4. You should see: `✅ Demo herd loaded into this browser.`

## Step 3 — Log in once to publish it to the cloud (~1 min)
1. Still on showteam.app, go to the app's login screen.
2. Log in with `demo@showteam.app` / `ShowTeam#Demo2026`.
3. The app creates the "Devitt Show Team" from the seeded data and syncs it up.
4. Look around — you should see 5 pigs, a Barn Pulse, an upcoming show ~18 days out,
   feed programs, evaluations, etc. That confirms it worked.

## Step 4 — Verify from a clean device (recommended, ~1 min)
1. Open a **private/incognito** window (or your phone) → showteam.app/?app=1.
2. Log in as demo@showteam.app.
3. You should see the same full herd. ✅ The demo account is now live for reviewers.

---

## Notes
- **Don't run day-to-day on this account.** It's the reviewers' sandbox. Use your
  own real account for your actual herd.
- **Refreshing the dates:** the demo show is ~18 days out from when you seeded, which
  covers a normal review window. If a review drags on and the dates look stale, just
  repeat Steps 2–3 in a browser already logged in as demo — re-seeding overwrites the
  local copy, and the next save syncs the fresher dates up. (Ask me and I'll give you
  the exact re-seed-while-logged-in steps.)
- **Same account, both stores.** Put these same credentials in Apple's App Review
  Notes and Google Play's "App access" section (both already reference them).
