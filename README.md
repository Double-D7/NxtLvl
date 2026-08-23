# Show Team

**Show Livestock Management** — a polished, mobile-first app for a family show
livestock operation to manage an unlimited number of show animals across
species, breeds, seasons and years.

A single-page, installable **PWA**. Open it on a phone in the barn, a tablet, or
a desktop. Add it to your home screen for an app-like, offline-capable
experience. The layout is **fully responsive** — a phone-optimized view with
bottom navigation, and on wide screens a **desktop layout with a left sidebar**
and roomy multi-column content, so it looks clean whether it's used on a phone,
a laptop, or wrapped as a store app.

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
| **Today** (home) | The barn command center. A compact **Barn Pulse** answers "are we on track?" in five seconds — how many animals are **On plan / Watch / Critical**, how many **need weighed**, **tasks today**, and **days to the next show** — each tappable straight to what needs attention. Below it: weekly weigh-in progress, next-show countdown, "Today in the Barn" tasks, attention-needed alerts (weight/ADG/target), recent media & feed changes, team activity. On-plan status is real plan math (projected vs. target), **not** "who's gaining fastest." **Any weight/ADG alert can be reviewed and muted with a written reason** (e.g. "ulcer that week — treated, back on gain") — the note stays on the record and the alert automatically re-checks the next time you log a weight. |
| **Animals** | Unlimited animals with rich profiles, search (name/tag/notch/breeder/sire/dam), filters, and **saved views**. Species-specific ID fields (ear notch for swine, scrapie for sheep/goats, registration/brand for cattle, RFID). |
| **Animal profile** | Organized into **five groups** — **Overview · Plan · Care · Progress · Records** — with a secondary row inside each so nothing is buried in a long horizontal scroll: **Plan** (Game Plan · Weight · Feed), **Care** (Daily · Health · Meds · Exercise), **Progress** (Photos · Measurements · Shows), **Records** (Pedigree · Expenses · Notes · History). The per-animal **Game Plan** tab shows the goal ring, on-plan status, required vs. recent ADG, projected finish and pace checkpoints. Deep links to any view still work. Plus a combined **timeline** so you can see how an animal changed after a feed or management adjustment. |
| **Weights** | One-tap stepper entry, automatic **average daily gain** (period + lifetime), projected show weight, ADG-needed-to-hit-target, and an interactive chart with target/projected lines and feed/show markers. Range toggle (7/30/90/season). |
| **Feed** | Versioned feed programs — **changing feed never erases the old program**; each change is a dated version. **Edit the current program in place** (or any past version) without spawning a new one. Multi-product meals with a **"Same as morning"** one-tap copy for feedings you repeat, **type-ahead product names** pulled from your feed & bedding list (auto-adopting a product's unit — e.g. a **scoop**-measured supplement), objectives, advisor recs, per-program weight response (gain + ADG), duplicate-to-reuse, and side-by-side **compare**. Units include lb/oz/cups/**scoop**/flake/g/mL/cc for odd supplement doses. |
| **Progress media** | Photos & videos stored privately **on-device** (IndexedDB). Each upload is **auto-dated from the file's own capture metadata** — EXIF *DateTimeOriginal* for photos, the QuickTime/MP4 creation time for videos (not the download/export date) — with a quick **confirm-date step** so anything shared or re-exported can be corrected before it lands. Every tile carries a date badge, then media is arranged into a **start-to-finish growth timeline** — grouped by date with the weigh-in weight at each point — plus a **then→now growth-journey** header, a gallery, and a **before-and-after** compare (weight Δ, days, ADG). |
| **Shows** | Shows, entries (division/class/weight/exhibitor), and full results (placing, champion/banner, showmanship, sale price, premiums, judge comments, lessons). |
| **Layover / Care Log** | Staging periods at a breeder's central barn before big shows. Log the breeder's time-specific directions — water, snack, feed, supplement, wash/rinse, walk, blow-out, etc. — each **timestamped** (planned vs actual). Log one direction **across several head at once** (defaults to all animals on the layover; Select all / Clear) and it fans out as its own **individually checkable** entry per animal. Day-by-day timeline, one-tap quick log, active-layover dashboard banner, and a per-animal care history so you build a routine you can review and repeat. |
| **Game Plan (coaching)** | Set a target weight + show date on an animal and the app coaches you to it: a progress ring, **required daily gain**, projected finish, straight-line pace, weekly checkpoints, and a plain-English **coach's read** (push gain / ease off / hold). A board ranks every animal on-track · behind · heavy so you know where to spend feed and attention. |
| **Show Mode** | Each show is a hub, not just a calendar date: countdown, dates/location/deadline/weigh-in/judge/fee, and a roster of who's going. A **readiness snapshot** shows how many entered animals are **on weight**, **need weighed**, or have a **withdrawal conflict** before you load up. A reusable **packing list** (animal equipment · feed · grooming · health & papers · exhibitor · pen & bedding · trailer) checks off and **saves per show**, and its **feed-to-pack** figures automatically from each animal's current ration × days away + a safety margin — e.g. "Maxxed Out 35 lb · Colossal 5 scoops for 5 days." Copy the whole list to a text. Plus the focused **show-day** screen: per-animal weigh-in targets (on-weight / over / under), pack & prep checklist, class schedule with one-tap result entry, and show-day notes. |
| **Record Book** | A compiled career achievement record — team-wide or per animal: class wins, banners & champions, shows, placings, premiums, sale totals and points, grouped by show. **Printable / Save-as-PDF** for a physical record book or sale packet. |
| **Growth reel** | Turn an animal's weekly photos into a shareable **timelapse video** (name/date/weight overlay), right from the Media tab. Speed + angle controls; saves to Photos / shares via the native share sheet. |
| **Shareable page** | A beautiful, **public read-only link** per animal (profile, weight chart, progress photos, pedigree, results) for buyers/sponsors — you choose what's shown, and health/prices/expenses/notes are never included. Links can expire and be revoked. *(Cloud only; run `supabase/shares.sql` once — see below.)* |
| **Calendar & tasks** | Shared month view + task list with priorities, recurrence and animal links. |
| **Phone push reminders** | Real notifications that reach your phone **with the app closed** — weigh-ins due, shows & entry deadlines within 3 days, withdrawal endings, tasks and open layover care. One tidy daily "Today in the barn" digest per device, honouring each person's toggles. *(Cloud only; run `supabase/push.sql` + deploy the Edge Function — see `supabase/PUSH_SETUP.md`.)* |
| **Medications** | A **medication list** where each product carries its **withdrawal time (days)**, plus a per-animal **Meds tab** that logs every dose and **auto-computes the withdrawal-clear date**. Because these are market animals, logging a med checks the shows that animal is **entered in** — if a show falls inside the withdrawal window it **flags a conflict and requires an explicit override**, and the animal's Meds tab / dashboard / calendar show what's in withdrawal and whether it's show-legal. The app never suggests meds, doses, or withdrawal times — you enter those from the label or your vet. |
| **Health · Exercise · Measurements** | Treatments/vaccinations with **withdrawal tracking** (never suggests dosages), exercise logs, and body measurements with charts. |
| **Feed Room (inventory + costs)** | Your barn's feed room. Buy feed **in bulk** and log the lot ("1 ton for $640") — the app derives a **weighted-average cost per pound** across all purchases, and because rations are dated and versioned, that cost **flows into each animal automatically** (daily lb × $/lb × days) even when you change feed constantly. Set what's **on hand** and a **bag size**, and the app estimates **daily use** from every active ration, **how many bags you have**, and **how many days each feed will last** — flagging feeds that are *low* or *out soon*. A one-tap **Shopping list** collects every feed projected to run out within a window you choose (or below its reorder point) with a suggested amount to buy, ready to **Copy/Share**. Same bulk-cost model for **shavings/bedding**, attributed per animal, per pen, or as barn overhead. Drives true **cost of gain** per animal and across the herd. |
| **Expenses & income** | Per-animal cost tracking, cost of gain, and net result — feed & bedding auto-fill from purchases + rations, so you only log the extras (vet, entry fees, transport). |
| **Reports** | ADG ranking, species mix, show results, and one-tap exports: **season summary** (printable / Save-as-PDF), animals CSV, weights CSV, and a full JSON backup/restore. |
| **Team & animal-level access** | Roles (Owner · Administrator · Editor · Contributor · Viewer · Advisor) with permission gating and invitations. Any non-admin member can be **assigned to specific animals** (Team → tap a member → Animal access) — a helper who only feeds four head, or a child who only runs their own projects, then sees **just those animals** across Today and the Animals list. Owners/Administrators always see the whole barn; leaving a member's assignment empty gives them the full herd. |
| **Coach recommendations** | A coach/advisor opens an assigned animal's **Plan** tab and sends a **typed recommendation** — adjust ration, change target weight/date, exercise change, request a weigh-in, request photos, care instruction, or a general note. It **never changes the program on its own**: the owner reviews it and can **Accept**, **Modify** (edit the text, then accept), or **Decline**. On accept it's **converted into the right record** — a target update, a requested-weigh-in/photo **task**, a note on the current ration, or an advisor note — and the whole exchange keeps a **full audit trail** (*sent → accepted/modified/declined, when, by whom, and what was applied*), visible on the animal's Plan tab and the Team screen. |
| **Weekly Coach Brief** | One tap from a helper/coach's page generates a complete **auto-written weekly brief** for their animals: latest **weight + 7-day gain/ADG**, **plan status** (target, days out, required ADG, projection), **current ration**, **recent feed changes**, recent **notes** (health/care/advisor), **upcoming shows** they're entered in, and a flag for any **recommendations awaiting review**. Editable, then **Copy or Share** straight into a text — so a coach knows exactly how every animal is doing without opening the app. |
| **Helpers, feed & weight reports** | Tag each animal with the helper/breeder who feeds it, then from that helper's page generate two one-tap texts: a **Weekly feed report** — every one of their animals' **latest weight + current ration** (amounts shown as clean fractions, AM/PM meals labeled) — and a **Current weights report** — each animal's **latest weigh-in, the gain since the previous one, and ADG** (plus how far off a set target), formatted like the weekly note you already text your breeders. Both are pre-filled and **editable** (add "slop", a new-supplement note, etc.) so you can **Copy or Share them straight into a text message** alongside your weekly videos. |
| **Archive** | Finish an animal's career without deleting it — every record is preserved, searchable, and **restorable**. |
| **QR pen cards** | Print a **barn card** for any animal (or a whole filtered set, from **Animals → Pen cards**) — name, photo, tag, exhibitor, weight and a **QR code**. Clip one to each pen; scanning it opens that animal's **Barn Card** in the app — today's feed (with one-tap *Mark fed*), today's tasks, current weight, next weigh date, alerts, and quick log (weight/photo/note/exercise). The QR encodes the app's own deep link, so **private data still stays behind the normal login** — the code is just a shortcut, not a public data leak. |
| **Barn Mode** | A dedicated big-touch chore screen (**Today → Barn Mode**) for doing the actual work phone-in-one-hand. Each animal is a large card with its **current AM/PM ration** (clean fractions) and a one-tap **Mark fed** per meal, plus **today's tasks** and a **Log weight · due** button — all completable **in place** without opening the full profile. Filter by **species, helper, or pen**, or show **only animals with something left**. A **Daylight** toggle flips to a black-on-white high-contrast layout for bright outdoor barns. Feed-done marks are saved per animal/day/meal and sync with the rest of the team. |
| **Quick Log & Rapid Weigh** | The center **`+`** is a universal **Quick Log** — weight, feed, care, health, exercise, measurement, photo/video, expense, note, event, task, or new animal. Opened from an animal's profile it **preselects that animal**; opened globally it lets you pick, and your **recently used actions surface first**. **Rapid Weigh Mode** runs the whole barn through one big input each — *Batman → weigh → Save & Next → Brutus…* — with live gain/ADG per head and a Skip, so weigh day is a handful of taps. |
| **Check for updates** | **More → App → Check for updates** shows the installed version and force-pulls the newest deploy on demand — refreshes the service worker and reloads into the new build instead of waiting on the cache. |

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
- `calc.js` — **the single authoritative calculation core** (`STCalc`): ADG variants (last-weigh / rolling / lifetime / feed-program), required ADG, projected weight, human target-date states, cost-completeness, and plan status. Pure (no DOM/DB) so it's unit-tested in isolation; app.js's `Calc` wrappers feed it data from `DB`.
- `tests/calc.test.mjs` — dependency-free unit tests for the calc core (same-day / missing / edited / backdated / deleted weights, feed-program boundaries, timezone edges, future & past targets). Run with `npm test`.
- `config.js` — Supabase keys (empty = local-only; fill in to enable cloud)
- `vendor/supabase.js` — vendored Supabase JS client (offline-capable)
- `vendor/qr.js` — vendored QR-code generator (MIT, Kazuhiko Arase; zero deps, offline) used for printable pen cards
- `supabase/schema.sql` + `supabase/SETUP.md` — one-time cloud setup
- `supabase/shares.sql` — optional: run once to enable public shareable animal pages
- `supabase/push.sql` + `supabase/functions/push-reminders/` + `supabase/PUSH_SETUP.md` — optional: phone push notifications
- `supabase/functions/delete-account/` + `supabase/DELETE_ACCOUNT_SETUP.md` — in-app account deletion (App Store requirement); **More → Delete account**
- `share.html` — the public read-only page shareable links open
- `sw.js` — service worker (network-first HTML, cache-first same-origin assets;
  never caches Supabase API calls or touches user data)
- `manifest.webmanifest`, `icon.svg`, `icon-*.png`, `apple-touch-icon.png` — PWA install assets

*Built as a long-term, scalable record system for the Devitt Family Show Team —
not a single-season tracker.*
