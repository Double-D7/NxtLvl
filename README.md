# Devitt Family Show Team

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
| **Feed** | Versioned feed programs — **changing feed never erases the old program**; each change is a dated version. Multi-product meals, objectives, advisor recs, per-program weight response (gain + ADG), duplicate-to-reuse, and side-by-side **compare**. |
| **Progress media** | Photos & videos stored privately **on-device** (IndexedDB), with gallery / timeline / **before-and-after** views that show weight Δ, days between, and ADG for the period. |
| **Shows** | Shows, entries (division/class/weight/exhibitor), and full results (placing, champion/banner, showmanship, sale price, premiums, judge comments, lessons). |
| **Calendar & tasks** | Shared month view + task list with priorities, recurrence and animal links. |
| **Health · Exercise · Measurements** | Treatments/vaccinations with **withdrawal tracking** (never suggests dosages), exercise logs, and body measurements with charts. |
| **Expenses & income** | Per-animal cost tracking, cost of gain, and net result. |
| **Reports** | ADG ranking, species mix, show results, and one-tap exports: **season summary** (printable / Save-as-PDF), animals CSV, weights CSV, and a full JSON backup/restore. |
| **Team** | Roles (Owner · Administrator · Editor · Contributor · Viewer · Advisor) with permission gating, invitations, and an advisor-recommendation review flow (accept / modify / decline). |
| **Archive** | Finish an animal's career without deleting it — every record is preserved, searchable, and **restorable**. |

## Design

Show-livestock brand direction: **deep purple + teal**, white, black, light-gray
surfaces. High-contrast for bright outdoor barn use, large touch targets,
bottom navigation with a quick-add button, confirmation toasts, and helpful
empty states.

## Architecture & the cloud path

This is a **local-first** build: all structured data lives in `localStorage`
and media blobs in `IndexedDB`, behind a single data layer (`DB.*` in
`app.js`). The UI never touches storage directly.

That boundary is deliberate. To make the app fully **cloud + multi-user** —
secure auth (email/Google/Apple), a relational database (e.g. Postgres/Supabase
with **row-level security** keyed on `team_id`), object storage with signed
URLs for media, and real-time sync across devices — you swap the data layer for
API calls without rewriting the interface. Login, teams, roles, the audit log,
per-record `createdBy/updatedBy` stamps, and archive semantics are already
modeled for that transition.

## Files

- `index.html` — app shell + styles
- `app.js` — the entire application (data layer, router, views)
- `sw.js` — service worker (network-first HTML, cache-first assets; never
  touches user data)
- `manifest.webmanifest`, `icon.svg`, `icon-*.png`, `apple-touch-icon.png` — PWA install assets

*Built as a long-term, scalable record system for the Devitt Family Show Team —
not a single-season tracker.*
