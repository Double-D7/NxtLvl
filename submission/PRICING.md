# Show Team — Pricing Plan

> Working plan for how Show Team makes money while staying easy for show families to
> commit to. Keep this as the single source of truth; update it as the market tells us things.
> Last updated: October 7, 2026.

## The goal
Ease user commitment enough to grow fast in a tight-knit, word-of-mouth community, while
earning enough to fund full-time development — so Show Team can become the standard for how
show-livestock families manage their program.

## Who's paying, and how they think
- **High-spend, high-passion, underserved.** A family spends thousands per animal (purchase,
  feed, supplements, entries, travel). A $5–$10 app is trivial against that — but *cheap signals
  disposable*. Price for value, not for bargain-hunting.
- **They think in seasons, not months.** Show life is cyclical (prep → show → off-season).
  Annual pricing matches their mental model and kills off-season churn.
- **It's a family + advisor activity.** Price the *household/team* as one unit. Counting seats
  creates friction and feels unfair; one price for "everyone in the barn" is a selling point.
- **Community-driven.** Barns, county circuits, and advisors talk. Free users are marketing.

## The structure

### Free tier — "Get started"
- **1 animal**, core tracking (weights, feed, photos, tasks), single device.
- Genuinely useful forever for a first-year 4-H kid with one pig.
- Clearly outgrown the moment you add a second animal or want the family involved.
- **Purpose:** grassroots adoption + word of mouth. Free users are the top of the funnel.

### Show Team Pro — the paid tier (one tier, keep it simple)
- **$79 / year** (hero price) — or **$9.99 / month** (low-commitment on-ramp).
  - Annual ≈ $6.58/mo, ~1/3 off monthly. Most serious families take annual — that's the goal.
- **Priced per family/team**, not per seat: covers parents, kids, and the advisor on one plan.
- **14-day free trial** so there's no "will I even use it?" risk.

**Pro unlocks what's already built** (no features to invent — the value exists and demos well):
- Unlimited animals
- Team & advisor collaboration + cloud sync (invites, roles, animal assignments)
- Prep Programs — Hair & Hide (the crown jewel)
- Feed Room analytics, Coach Scorecard, Season Review
- Show/packing mode, Record-Book readiness, reports, QR pen cards

Value ladder in one line: **Free = "track my animal." Pro = "run my whole program with my team."**

### Founding Families — launch-only offer
- Early adopters lock in at **$49 / year for life.**
- Creates urgency, rewards the first believers, seeds the core community and feedback loop.
- These families become evangelists.

## The money math (be clear-eyed)
- Apple/Google take **15%** (small-business rate, under $1M/yr). $79 → you net ~**$67**.
- 500 paying families × $79 ≈ **$39K/yr** gross (~$33K net)
- 2,000 families × $79 ≈ **$158K/yr** gross
- 4-H has millions of participants; FFA ~1M. Serious show families are a real, reachable slice.
  Low-single-digit penetration of the niche funds a full-time build.

## Rollout — don't delay launch to build billing

### Phase 1 — Launch now (free, everything unlocked)
- Ship as **"Founding Season — free for early families."**
- No billing code, no added App Review risk → submit immediately.
- Start gathering users, testimonials, and feedback while interest is hot.

### Phase 2 — Monetize (fast-follow, a few weeks out)
- Build the paywall + **StoreKit (iOS) + Play Billing (Android)** + an entitlement check.
- Flip on Pro ($79/yr, $9.99/mo), the 14-day trial, and the 1-animal free tier.
- **Grandfather every Founding-Season user into $49/yr for life.**
- The "get in now before it's paid" angle *helps* launch marketing.

We lose nothing by waiting a few weeks to charge, de-risk the submission, and convert a warm,
grateful base instead of cold-charging strangers on day one.

## Things to revisit later (not now)
- **Web checkout via Stripe** on showteam.app (keeps ~97% vs the store's 85%); US rules now allow
  linking out from the app. Consider once there's volume.
- **School/chapter or multi-family plans** for 4-H clubs / FFA chapters / breeders with many families.
- **Annual "show-year" promotions** timed to the start of major circuits.
- **Price testing**: $79 vs $89/yr, trial length (7 vs 14 days), free-tier limit (1 vs 2 animals).

## Decision log
- 2026-10-07: **LOCKED.** Launch-free "Founding Season" first, monetize as fast-follow.
  Hero price **$79/yr** (or **$9.99/mo**), priced per family, **1-animal free tier**,
  **Founding Families $49/yr for life**. Signed off by David Devitt. These are the numbers
  Phase 2 billing will implement.
