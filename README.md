# Show Team

**Show Livestock Management** — a polished, mobile-first app for a family show
livestock operation to manage an unlimited number of show animals across
species, breeds, seasons and years.

A single-page, installable **PWA**. Open it on a phone in the barn, a tablet, or
a desktop. Add it to your home screen for an app-like, offline-capable
experience.

## Run it

Open `index.html` in any modern browser — no build step, no server. Or use the
deployed GitHub Pages site. On first launch you create the team account and run
a short setup wizard (team → species → invite family → weigh-in day → optional
demo animals).

**Demo data:** the setup wizard can load a realistic show string (Batman,
Biscuit, Spotacus and the rest) so you can explore immediately. It's clearly
marked and removable any time from **More → Remove demo data**.

## What's inside

| Area | What it does |
|------|--------------|
| **Dashboard** | Active-animal & species counts, weekly weigh-in progress, next-show countdown, "Today in the Barn" tasks, attention-needed alerts, recent media & feed changes, team activity. |
| **Animals** | Unlimited animals with rich profiles, search (name/tag/notch/breeder/sire/dam), filters, and **saved views**. Species-specific ID fields (ear notch for swine, scrapie for sheep/goats, registration/brand for cattle, RFID). |
| **Animal profile** | Tabs: Overview · Weight · Feed · Media · Measurements · Health · Exercise · Shows · Pedigree · Expenses · Notes · History — plus a combined **timeline** so you can see how an animal changed after a feed or management adjustment. |
| **Weights** | One-tap stepper entry, automatic **average daily gain** (period + lifetime), projected show weight, ADG-needed-to-hit-target, and an interactive chart with target/projected lines and feed/show markers. Range toggle (7/30/90/season). |
| **Feed** | Versioned feed programs — **changing feed never erases the old program**; each change is a dated version. **Edit the current program in place** (or any past version) without spawning a new one. Multi-product meals with a **"Same as morning"** one-tap copy for feedings you repeat, **type-ahead product names** pulled from your feed & bedding list (auto-adopting a product's unit — e.g. a **scoop**-measured supplement), objectives, advisor recs, per-program weight response (gain + ADG), duplicate-to-reuse, and side-by-side **compare**. Units include lb/oz/cups/**scoop**/flake/g/mL/cc for odd supplement doses. |
| **Progress media** | Photos & videos stored privately **on-device** (IndexedDB). Each upload is **auto-dated from the file's own capture metadata** — EXIF *DateTimeOriginal* for photos, the QuickTime/MP4 creation time for videos (not the download/export date) — with a quick **confirm-date step** so anything shared or re-exported can be corrected before it lands. Every tile carries a date badge, then media is arranged into a **start-to-finish growth timeline** — grouped by date with the weigh-in weight at each point — plus a **then→now growth-journey** header, a gallery, and a **before-and-after** compare (weight Δ, days, ADG). |
| **Shows** | Shows, entries (division/class/weight/exhibitor), and full results (placing, champion/banner, showmanship, sale price, premiums, judge comments, lessons). |
| **Layover / Care Log** | Staging periods at a breeder's central barn before big shows. Log the breeder's time-specific directions — water, snack, feed, supplement, wash/rinse, walk, blow-out, etc. — each **timestamped** (planned vs actual). Log one direction **across several head at once** (defaults to all animals on the layover; Select all / Clear) and it fans out as its own **individually checkable** entry per animal. Day-by-day timeline, one-tap quick log, active-layover dashboard banner, and a per-animal care history so you build a routine you can review and repeat. |
| **Game Plan (coaching)** | Set a target weight + show date on an animal and the app coaches you to it: a progress ring, **required daily gain**, projected finish, straight-line pace, weekly checkpoints, and a plain-English **coach's read** (push gain / ease off / hold). A board ranks every animal on-track · behind · heavy so you know where to spend feed and attention. |
| **Show-day mode** | A focused day-of screen per show: countdown, per-animal **weigh-in targets** (on-weight / over / under flags), a categorized **pack & prep checklist** (papers · animal · pen · exhibitor), your class schedule with one-tap result entry, and show-day notes. |
| **Record Book** | A compiled career achievement record — team-wide or per animal: class wins, banners & champions, shows, placings, premiums, sale totals and points, grouped by show. **Printable / Save-as-PDF** for a physical record book or sale packet. |
| **Growth reel** | Turn an animal's weekly photos into a shareable **timelapse video** (name/date/weight overlay), right from the Media tab. Speed + angle controls; saves to Photos / shares via the native share sheet. |
| **Shareable page** | A beautiful, **public read-only link** per animal (profile, weight chart, progress photos, pedigree, results) for buyers/sponsors — you choose what's shown, and health/prices/expenses/notes are never included. Links can expire and be revoked. *(Cloud only; run `supabase/shares.sql` once — see below.)* |
| **Calendar & tasks** | Shared month view + task list with priorities, recurrence and animal links. |
| **Phone push reminders** | Real notifications that reach your phone **with the app closed** — weigh-ins due, shows & entry deadlines within 3 days, withdrawal endings, tasks and open layover care. One tidy daily "Today in the barn" digest per device, honouring each person's toggles. *(Cloud only; run `supabase/push.sql` + deploy the Edge Function — see `supabase/PUSH_SETUP.md`.)* |
| **Health · Exercise · Measurements** | Treatments/vaccinations with **withdrawal tracking** (never suggests dosages), exercise logs, and body measurements with charts. |
| **Feed & bedding costs** | Buy feed **in bulk** and log the lot ("1 ton for $640") — the app derives a **weighted-average cost per pound** across all your purchases. Because rations are dated and versioned, feed cost then **flows into each animal automatically** (daily lb × $/lb × days on that program) even when you change feed constantly — no hand-entering feed expenses. Same model for **shavings/bedding**, attributed per animal, split across a pen, or held as barn overhead. Drives true **cost of gain** per animal and across the herd. |
| **Expenses & income** | Per-animal cost tracking, cost of gain, and net result — feed & bedding auto-fill from purchases + rations, so you only log the extras (vet, entry fees, transport). |
| **Reports** | ADG ranking, species mix, show results, and one-tap exports: **season summary** (printable / Save-as-PDF), animals CSV, weights CSV, and a full JSON backup/restore. |
| **Team** | Roles (Owner · Administrator · Editor · Contributor · Viewer · Advisor) with permission gating, invitations, and an advisor-recommendation review flow (accept / modify / decline). |
| **Archive** | Finish an animal's career without deleting it — every record is preserved, searchable, and **restorable**. |

## Design

Show-livestock brand direction: **deep purple + teal**, white, black, light-gray
surfaces. High-contrast for bright outdoor barn use, large touch targets,
bottom navigation with a quick-add button, confirmation toasts, and helpful
empty states.

## Shared multi-user cloud sync (Supabase)

The app runs **local-first** out of the box (data on-device). To let multiple
people see and update the **same** data live across devices, connect a free
**Supabase** backend — no server for you to run.

**Setup:** follow **[`supabase/SETUP.md`](supabase/SETUP.md)** — create a free
project, run **[`supabase/schema.sql`](supabase/schema.sql)**, and paste your
Project URL + anon key into `config.js` (or the in-app **More → Connect to
cloud** screen). Then sign up as the owner and invite family by email.

Once connected you get:

- **Real auth** — email/password, plus Google/Apple when you enable those
  providers; email verification and password reset.
- **Shared data** — the whole team works off one cloud dataset; your existing
  on-device animals migrate up automatically on the owner's first sign-in.
- **Live sync** — an edit on one phone appears on the others within a second
  (Supabase Realtime).
- **Private media** — photos/videos go to a private Storage bucket with signed
  URLs; still cached on-device for offline viewing.
- **Team permissions** — enforced by **Row-Level Security** so you can only
  read/write teams you belong to.
- **Offline-friendly** — each device keeps a local cache and syncs when back
  online.

### How it's architected

All reads/writes go through one data layer (`DB.*`), and cloud concerns are
isolated in the `Cloud` module in `app.js`. Each team's dataset is a single
JSON document in the `teams` table, streamed live and guarded by RLS. The UI
never talks to storage or the network directly — so the sync model can be
upgraded later (e.g. to per-record tables) without touching any screen. See the
"How it works" section of `supabase/SETUP.md` for the trade-offs.

## Files

- `index.html` — app shell + styles
- `app.js` — the entire application (data layer, `Cloud` sync module, router, views)
- `config.js` — Supabase keys (empty = local-only; fill in to enable cloud)
- `vendor/supabase.js` — vendored Supabase JS client (offline-capable)
- `supabase/schema.sql` + `supabase/SETUP.md` — one-time cloud setup
- `supabase/shares.sql` — optional: run once to enable public shareable animal pages
- `supabase/push.sql` + `supabase/functions/push-reminders/` + `supabase/PUSH_SETUP.md` — optional: phone push notifications
- `share.html` — the public read-only page shareable links open
- `sw.js` — service worker (network-first HTML, cache-first same-origin assets;
  never caches Supabase API calls or touches user data)
- `manifest.webmanifest`, `icon.svg`, `icon-*.png`, `apple-touch-icon.png` — PWA install assets

*Built as a long-term, scalable record system for the Devitt Family Show Team —
not a single-season tracker.*
