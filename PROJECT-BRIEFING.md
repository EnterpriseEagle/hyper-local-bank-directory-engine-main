# BANK NEAR ME - Full Project Briefing

## What This Is

A hyper-local Australian bank directory engine at **banknearme.com.au**. It's a programmatic SEO play with 15,000+ suburb-level pages that rank for long-tail searches like "commonwealth bank parramatta" and "ATM near me [suburb]". Built on Next.js 15 with App Router, deployed on Vercel.

The owner also owns: **cbanearme.com**, **helpwithhomeloan.com**, **helpwithhomeloan.com.au**, **helpwithmortgage.com.au** (all parked, phase 2).

## Tech Stack

- **Framework:** Next.js 15.3.5 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind CSS 4, Shadcn UI (50+ components)
- **Database:** SQLite via LibSQL + Drizzle ORM (file:./data/banknearme.db)
- **Email:** Resend API
- **Deployment:** Vercel with cron jobs
- **Package Manager:** Bun (bun.lock present), also has package-lock.json

## How It Makes Money

Revenue comes from **affiliate referrals** — when someone on a bank/suburb page clicks a "switch bank" CTA, they're sent to a bank's referral program. The site earns $30-$125 per successful account switch.

### Current Affiliate Setup
- Offers configured in `src/lib/affiliate-offers.ts`
- Priority system: first active offer wins, Ubank ($30) is the fallback
- Three pre-configured offers: ING ($125, inactive), Ubank ($30, active), Amex Platinum (inactive)
- **URLs are still placeholders** — need real Commission Factory/affiliate network links

### Monetization Infrastructure Built
1. **Click tracking** — `POST /api/track-click` logs every affiliate click with offer ID, page URL, suburb, state, IP hash. Rate limited 20/min/IP.
2. **Conversion webhook** — `POST /api/conversion-webhook` receives postbacks from affiliate networks when a click converts.
3. **Revenue estimation** — `src/lib/revenue.ts` calculates estimated revenue using per-offer conversion rates (default 8%).
4. **Weekly email digest** — `GET /api/weekly-report` runs every Monday 9am via Vercel cron. Sends a clean HTML email with clicks, estimated conversions, revenue breakdown by offer and page.
5. **Stats API** — `GET /api/stats?period=7d|24h|30d` for on-demand performance checks.

All APIs protected by `CRON_SECRET` environment variable.

## Database Schema

### Existing tables (site content):
- `suburbs` — 15K+ Australian suburbs (name, slug, state, postcode, lat/lng)
- `banks` — Banking institutions (name, slug, type)
- `branches` — Physical branches/ATMs (bank_id, suburb_id, address, status, opening_hours, BSB)
- `status_reports` — Community-submitted status reports (branch_id, suburb_id, report_type, ip_hash)

### Monetization tables (newly added):
- `affiliate_clicks` — Click tracking (offer_id, placement, page_url, suburb_slug, state_slug, referrer, user_agent, ip_hash)
- `affiliate_conversions` — Conversion tracking (click_id FK, offer_id, status, revenue_estimate, external_ref)
- `weekly_digests` — Weekly report snapshots (week_start/end, total_clicks, total_conversions, estimated_revenue, top_offer, top_page, report_json)

## Site Architecture / URL Structure

```
/                                    → Homepage (hero search, bank links)
/[state]                             → State page (e.g., /new-south-wales)
/[state]/[suburb]                    → Suburb page (e.g., /new-south-wales/parramatta)
/bank                                → All banks listing
/bank/[bankSlug]                     → Bank national page (e.g., /bank/commonwealth-bank)
/bank/[bankSlug]/[stateSlug]         → Bank state page
/bank/[bankSlug]/[stateSlug]/[suburbSlug] → Bank suburb page (most granular)
/atm/[suburbSlug]                    → ATM finder for suburb
/closures                            → Recent branch closures
/sitemap.xml                         → Dynamic sitemap
/robots.txt                          → Dynamic robots.txt
```

### API Routes:
```
POST /api/search              → Site search
POST /api/report              → Community status reports (rate limited 5/min)
POST /api/track-click         → Affiliate click tracking (rate limited 20/min)
GET  /api/weekly-report       → Weekly email digest (cron, auth required)
GET  /api/stats               → Performance stats (auth required)
POST /api/conversion-webhook  → Affiliate conversion postback (auth required)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/data.ts` | All database queries (getBankBySlug, getSuburbBySlug, getBankBranchesInSuburb, etc.) |
| `src/lib/db/schema.ts` | Drizzle ORM schema for all 7 tables |
| `src/lib/db/index.ts` | Database connection setup |
| `src/lib/affiliate-offers.ts` | Affiliate offer configurations and getActiveOffer() |
| `src/lib/seo-content.ts` | SEO title/description/FAQ generators per page type |
| `src/lib/revenue.ts` | Revenue estimation engine, weekly report generation |
| `src/lib/email.ts` | Resend email sending with HTML template |
| `src/lib/rate-limit.ts` | In-memory IP-based rate limiter |
| `src/components/affiliate-link.tsx` | Client component: renders CTA, fires tracking on click |
| `src/components/switch-banner.tsx` | Sticky "switch bank" banner on suburb/state pages |
| `src/components/status-reporter.tsx` | Community status reporting (working/closed/empty/queue) |
| `src/app/layout.tsx` | Root layout with nav, footer, conditional GA, scripts |
| `vercel.json` | Cron: weekly report Monday 9am |
| `.env.example` | Required env vars template |

## Environment Variables

```
RESEND_API_KEY=re_xxxxxxxxxxxx          # Resend for email
REPORT_EMAIL=you@example.com            # Weekly digest recipient
CRON_SECRET=your-random-secret-here     # API auth token
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX          # Google Analytics (optional)
```

## Current State

- Site is deployed and functional with all suburb/bank/ATM pages
- Monetization tracking infrastructure is built and tested
- Weekly email system works (tested, delivers to Hotmail)
- **No real affiliate links yet** — URLs in affiliate-offers.ts are placeholders
- **No Google Analytics set up yet**
- **No Google Search Console submission yet** (sitemap not submitted)
- **Sitemap may exceed 50K URL limit** (known issue, needs chunking)
- Build ignores TypeScript and ESLint errors (`ignoreBuildErrors: true`)

## Revenue Projections (Realistic)

- **Month 1-3:** Google indexes pages. 5-20K visits. $0-500/month
- **Month 3-6:** SEO traction. 50-100K visits. $1-5K/month
- **Month 6-12:** Ranking for long-tail. 200K+ visits. $5-15K/month
- **Year 2+:** $20K/week possible with credit cards + home loan leads added

## Immediate TODO

1. Sign up for Commission Factory, get real affiliate links
2. Submit sitemap to Google Search Console
3. Set up GA4, add NEXT_PUBLIC_GA_ID to Vercel env vars
4. Fix sitemap chunking (>50K URLs)
5. Add JSON-LD structured data to pages
6. Build helpwithhomeloan.com.au (phase 2 — home loan lead gen)
