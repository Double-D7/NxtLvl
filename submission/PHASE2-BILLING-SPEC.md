# Show Team — Phase 2 Billing: Implementation Spec

> How we turn on revenue after the free "Founding Season" launch. Companion to
> `PRICING.md` (which sets the prices). This is the build plan, the hard
> constraints, and the decisions still needed. Nothing here changes the current
> free launch.
> Last updated: October 7, 2026.

## 1. Goal
Charge for **Show Team Pro** — $79/yr or $9.99/mo, **per family/team**, 1-animal free
tier, Founding Families grandfathered — across **web, iOS, and Android**, with a single
source of truth for "is this team Pro?" that the app can trust online and offline.

## 2. The core constraint (read this first)
The app is a **PWA** served from showteam.app, wrapped for the stores with PWABuilder
(WKWebView on iOS, TWA on Android). That matters because:

- **Apple requires its own In-App Purchase (StoreKit) for digital subscriptions.** You
  cannot charge for Pro on iOS with Stripe or a web payment — Apple rejects that. And a
  plain WKWebView wrapper **cannot call StoreKit from JavaScript**; StoreKit is native.
- **Google** similarly requires Play Billing for in-app digital subscriptions.
- **Web** (showteam.app in a browser) is the one place you *can* use Stripe and keep ~97%.

**Consequence:** Phase 2 is not just "add a paywall screen." To sell on iOS/Android we need
a native bridge to the stores' billing. The clean way to get that without hand-writing
native StoreKit/Play Billing code is below.

## 3. Recommended architecture
Three decisions, each with a clear recommendation:

### 3a. Billing abstraction → **RevenueCat**
A billing layer that wraps StoreKit **and** Play Billing **and** offers web billing, handles
receipt validation, and gives one cross-platform **entitlement** ("pro") as the answer to
"is this team paid?" Free until ~$2,500/mo tracked revenue, then ~1%. For a solo founder this
removes the most error-prone code (receipts, renewals, refunds, proration) and gives webhooks
to keep our own database in sync.

*Alternative considered:* hand-roll StoreKit 2 + Play Billing + Stripe + three sets of
server-side receipt validation and webhooks into Supabase. ~3× the work and the riskiest
code in the app. Not recommended for launch; revisit only if RevenueCat's cut ever hurts.

### 3b. Mobile shell → **migrate iOS & Android to Capacitor**
PWABuilder's outputs can't host a native billing SDK cleanly. **Capacitor** wraps the *same*
web app (zero changes to app.js's UI) in a maintainable native project where the **RevenueCat
plugin** runs. Bonus: a Capacitor shell is a stronger answer to Apple's Guideline 4.2
("minimum functionality") than a bare WebView, which was already our rejection fallback. So
this migration pays off twice.

- The web app keeps shipping from showteam.app exactly as today; Capacitor just loads it.
- One-time setup; thereafter app updates are still just web deploys (the shell rarely changes).

### 3c. Web billing → **RevenueCat Web Billing (Stripe-backed)**
So someone who signs up on showteam.app in a browser can also go Pro. Using RevenueCat's web
billing (rather than raw Stripe) keeps **one** entitlement across web + iOS + Android under a
single RevenueCat customer, so a family that pays on the web is Pro in the iOS app too.

## 4. Entitlement model (the heart of it)
**Pricing is per team**, so entitlement lives on the **team**, not the individual.

- **RevenueCat `app_user_id` = the Supabase `teamId`.** When any member opens the app, the
  RevenueCat SDK identifies as that team, so the whole family sees the team's Pro status
  regardless of which member's Apple/Google account actually paid.
- **Source of truth:** RevenueCat's entitlement for that `app_user_id`.
- **Mirror into Supabase** so the app can gate offline and the server can enforce: a RevenueCat
  **webhook → Supabase edge function** writes the current entitlement onto the team
  (`teams.data.entitlement = { tier, status, renews_at, source }`). Because the team doc already
  syncs to every device, every member's app gets the entitlement for free, and it's cached for
  offline use.
- **Offline/grace:** the app trusts the last-synced `entitlement`; if it can't reach anything,
  it keeps the last-known state (never locks a paying family out because the barn has no signal).

```
 Purchase (Apple / Google / Stripe-web)
        │
        ▼
   RevenueCat  ──(entitlement "pro" on app_user_id=teamId)
        │  webhook
        ▼
 Supabase edge fn  ──writes──▶ teams.data.entitlement
        │                                  │ syncs
        ▼                                  ▼
 server-side gates (RLS/fns)        every member's app reads it (online or offline)
```

## 5. What's gated — Free vs Pro
Maps to features that already exist, so Pro is real value, not artificial crippling.

| Capability | Free | Pro |
|---|---|---|
| Animals | **1** active | Unlimited |
| Weights, feed, photos, tasks, calendar | ✅ | ✅ |
| Cloud sync + team/advisor collaboration + invites | — | ✅ |
| Prep Programs (Hair & Hide) | — | ✅ |
| Feed Room analytics / days-of-supply / shopping | — | ✅ |
| Coach Scorecard | — | ✅ |
| Season Review | — | ✅ |
| Show / packing mode | — | ✅ |
| Record-Book readiness + reports | — | ✅ |
| QR pen cards | — | ✅ |

> **Decision needed (product):** confirm the free/Pro line above — especially whether free is
> single-device local only (no cloud) vs. cloud-backup-but-1-animal. Recommended: **free = local,
> single device, 1 animal**; cloud + team is a headline Pro reason.

## 6. Grandfathering — Founding Families
- Define a **launch cutoff timestamp = 90 days after public launch**. Every team created before
  it is flagged `founding:true`.
- Founding teams get a **permanent Pro entitlement override** (independent of RevenueCat), honored
  by the same `isPro()` check.
- **Honor = comped free for life (LOCKED):** founding teams are Pro at no charge, permanently —
  chosen over a paid $49/yr founding tier for maximum goodwill and the simplest build (no extra
  store product, no RevenueCat offering targeting the cohort). Implemented purely as the
  `founding` flag → `isPro()` returns true.
- The **reviewer demo team** is force-flagged Pro so App Review sees every feature.

## 7. Data model changes (additive, migration-safe)
In `blankDB()` / the team doc (propagated by `mergeDefaults`, so existing users are safe):
- `team.entitlement = { tier:'free'|'pro', status, renews_at, source, updated_at }`
- `team.founding = false`
- `team.createdAt` already exists → used for the cutoff check.
No destructive changes; everything defaults to today's behavior until gating is switched on.

## 8. New app module — `Entitlement` (in app.js)
- `Entitlement.isPro()` → `founding || entitlement.tier==='pro'` (with offline cache).
- `Entitlement.gate(feature)` → returns true/false; non-Pro hitting a gate opens the paywall.
- `Entitlement.animalLimit()` → `isPro() ? Infinity : 1`.
- `Entitlement.refresh()` → on launch + on resume, pulls RevenueCat customer info (native) and
  reconciles with the synced `team.entitlement`.
- Central gating points: `openQuickAdd`/new-animal (limit), the premium routes
  (`programs`, `costs`/Feed Room, `scorecard`, `season`), invite/cloud-connect, reports.
  Each gated entry calls `Entitlement.gate(...)` and shows the paywall if false.

## 9. Paywall UX (and what the stores require)
A branded in-app paywall (matches the dark/purple identity):
- Clear value list (what Pro unlocks), the two prices ($79/yr highlighted, $9.99/mo), **14-day
  free trial** callout.
- Buttons: **Start free trial / Subscribe** (annual + monthly), **Restore purchases** (Apple
  *requires* a restore option), and links to **Terms of Use (EULA)** and **Privacy Policy**
  (Apple *requires* both visible on the paywall).
- On mobile → RevenueCat `purchasePackage`. On web → RevenueCat Web Billing / Stripe Checkout.
- A lightweight "Manage subscription" link in More → routes to the store's management page
  (`showManageSubscriptions`) or Stripe customer portal.

## 10. Store configuration (products)
- **App Store Connect:** auto-renewable subscription group "Show Team Pro" with
  `pro_monthly` ($9.99/mo) and `pro_annual` ($79/yr), 14-day free-trial introductory offer on
  annual. Fill subscription metadata + review screenshot.
- **Google Play Console:** subscription `pro` with monthly + annual base plans, 14-day free
  trial offer.
- **RevenueCat:** one entitlement `pro`; offerings mapping the above; (optional) a founding
  offering; web billing enabled.
- **Small-business program:** enroll in Apple's (15% vs 30%) and Google's equivalent.

## 11. Build order (sub-phases of Phase 2)
1. **Plumbing, no behavior change.** Add `Entitlement` module + data fields + gating call-sites,
   but `isPro()` returns true for everyone (flag off). Mark pre-cutoff teams `founding`. Ship +
   verify nothing changes. *(Pure app.js + tests.)*
2. **RevenueCat + store products.** Create products in both consoles, configure RevenueCat,
   enroll in small-business pricing.
3. **Capacitor migration.** Stand up the Capacitor iOS/Android shells loading showteam.app; add
   the RevenueCat plugin; wire `Entitlement.refresh()` to native customer info. Re-submit the
   wrapped apps.
4. **Paywall + purchase/restore flows** (mobile) and **Web Billing** (browser).
5. **RevenueCat → Supabase webhook** edge function mirroring entitlement onto the team; add
   server-side enforcement where it matters (e.g., reject writing a 2nd animal for a non-Pro team
   in a secured function/RLS, so gating isn't purely client-side).
6. **Flip the flag:** free-tier limits apply to non-Pro, non-founding teams. Founding stay full.
7. **QA pass** (matrix below), then release.

Rough effort: plumbing ~0.5–1 day; RevenueCat/store setup ~1 day (lots of console clicking,
much of it yours); Capacitor migration ~1–2 days; paywall + flows ~1–2 days; webhook + server
enforcement ~1 day; QA ~1 day. Call it **~1 to 1.5 focused weeks**, most of the clock being
store review + sandbox testing, not code.

## 12. Testing matrix
- **Apple sandbox** testers: subscribe (trial → renew), cancel, restore on a second device,
  upgrade monthly→annual.
- **Google** internal testing + license testers: same.
- **Stripe test mode** (web): subscribe, cancel, portal.
- **Cross-platform:** pay on web → Pro in the iOS app (same team). Pay on one member's device →
  every member of the team is Pro.
- **Grandfathering:** a pre-cutoff team is Pro with no purchase; a post-cutoff team is gated.
- **Offline:** go Pro, kill network → still Pro; free team offline → still limited to 1 animal.
- **Reviewer demo team:** full Pro.

## 13. Risks & mitigations
- **Apple 4.2 / "it's just a website":** Capacitor shell + the already-rich feature set mitigates;
  keep the native-feel polish.
- **Paywall rejections:** Apple is strict — restore button, EULA + Privacy links, accurate price
  and trial terms on the paywall. Build to their checklist the first time.
- **Entitlement drift:** webhook mirroring + `refresh()` on launch/resume keeps RevenueCat and our
  team doc in sync; the app always falls back to last-known-good.
- **Client-only gating is bypassable:** add server-side checks on the few things that cost us
  (animal count), so a tampered client can't silently get Pro features that touch the backend.

## 14. Decisions — LOCKED (2026-10-07, David Devitt)
1. **Free/Pro line** — confirmed as in Section 5: free = 1 animal, single-device/local; cloud +
   team + every premium module = Pro.
2. **Founding honor** — **comp Founding-Season teams free for life** (not a paid $49 tier).
3. **Trial length** — **14 days**.
4. **Web billing** — **RevenueCat Web Billing** (unified entitlement across web + iOS + Android).
5. **Timing** — **90-day Founding Season** (free, everything unlocked) before gating is switched on.
   The founding cutoff timestamp = 90 days after public launch.

## 15. Not in scope for Phase 2 (later)
School/chapter multi-family plans; promo codes/coupons; annual "show-year" campaigns; referral
rewards; in-app upsell analytics. All build cleanly on the entitlement model above.
