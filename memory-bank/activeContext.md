# Aurelia OS (Women's Executive & Creator Command Suite) — Active Context

Last checked: 2026-11-12 Australia/Brisbane.

## Project Overview
Third venture in Dean's Higgsfield-style digital product factory (`C:\dev\aurelia-os`):
- **Flagship Hub:** **Aurelia OS** — *The Sovereign Command Suite for Modern Women of Influence* (cross-platform iOS, Windows, Android, Web + cross-cloud iCloud, Google Drive, OneDrive).
- **3 Fast-Monetizing 4-Week Subset Spin-Offs (built on the same shared monorepo & SQLite schema):**
  1. **Velvet Cadence** ($49–$149/mo, B2B expensable): Voice-to-Authority & Cross-Cloud Proof Engine for successful women on LinkedIn, founders, consultants & executives.
  2. **Sovereign Brief** ($39/mo or $399/yr): Cross-Cloud Executive Report, Deadline & Life Chief-of-Staff unifying Windows OneDrive/Outlook, Google Drive, and iOS iCloud/EventKit.
  3. **GlowGrid Studio** ($19–$29/mo or $199/yr): iPhone/iCloud-to-Windows/Android Content Drop & Upload Consistency Radar for aspiring female influencers and 5-to-9 creators.

## Core Architecture Breakthrough ("Zero-Blob Metadata Pointer Index")
- Separates Control Plane (`<15 KB` SQLite CRDT metadata record + `<25 KB` client-side WebP thumbnail + deep-link URI `icloud://`, `gdrive://`, `onedrive://`) from Data Plane (raw 4K videos and board PDFs stay inside the user's native cloud storage).
- **Result:** $0.00 video bandwidth egress, `<$35/mo` total infrastructure burn for the first 2,500 users (**92–96% gross margin**), and **zero 6-month Google CASA or Meta API security audits** (uses Google Picker `drive.file`, OneDrive File Picker, iOS Capacitor `EventKit`/`PHPhotoLibrary` bridge, and Assisted 2-Tap Native Handoff).

## Live Public HTTPS Website Deployed (`$0.00` Unlimited Bandwidth)
- **Public marketing landing page (site root, conversion front door):**
  `https://deano1983.github.io/aurelia-os/` *(local `http://127.0.0.1:3002/`, file `mvp/public/index.html`)*
- **Live Interactive Workspace (Aurelia OS + Velvet Cadence + Sovereign Brief + GlowGrid Studio):**
  `https://deano1983.github.io/aurelia-os/workspace.html` *(moved from `/` so the marketing page can own the root; deep links `?mode=velvet|sovereign|glowgrid|all` still work)*
- **Live Commercial & Investor Deck + $10k MRR Simulator:**
  `https://deano1983.github.io/aurelia-os/deck.html`
- **Live 100-Client & Partner Outbound CRM Command Board:**
  `https://deano1983.github.io/aurelia-os/clients.html`
- **Live Day 1–30 Outreach Execution Console:**
  `https://deano1983.github.io/aurelia-os/outreach.html`
- **GitHub Repository:** `https://github.com/deano1983/aurelia-os`

## Documents in Repo (`C:\dev\aurelia-os`)
- `01-product-and-subset-strategy.md` — full 1+3 product & hidden-niche strategy from `niche-strategist`.
- `02-crossplatform-cloud-architecture.md` — full cross-OS/cross-cloud blueprint & SQLite schema from `crossplatform-architect`.
- `03-commercial-diligence-and-ranking.md` — commercial due diligence, unit economics, and 30-day sequenced build ranking.
- `04-go-to-market-and-monetization-playbook.md` — complete unit economics (`$0.114/mo` infra+AI COGS, `92.4%–96.7%` gross margin), B2B corporate expense packaging for **Velvet Cadence**, Executive Assistant (EA) channel strategy for **Sovereign Brief**, micro-influencer affiliate loop for **GlowGrid Studio**, and 30-day `$10k MRR` sprint plan.
- `05-100-client-and-partner-target-list.csv` — **100 verified client spaces, agencies, communities & partner networks** across 10 cohorts (AU/Global LinkedIn Ghostwriters, AU Female Founder Networks, Global Executive Women Hubs, EA Communities, Virtual EA Agencies, Female UGC Coaches, 5-to-9 Creator Communities, Fractional Exec Collectives, Corporate Women & Board Programs) with personalized outreach hooks.

## MVP & Dual-Provider Payment Stack (`C:\dev\aurelia-os\mvp`)
- **Automated Tests:** `27/27` passing (`node --test` in `C:\dev\aurelia-os\mvp`) — engine, outreach cadence, landing offer, site-wide link integrity, precache and manifest checks.
- **Dual-Provider Payment Engine:** Supports **Stripe Direct** (`STRIPE_SECRET_KEY` auto-loaded from `.env` + Payment Links), **Lemon Squeezy Merchant-of-Record** (global VAT/GST + auto-split 25%–35% affiliate payouts), and **Direct B2B Corporate EFT / Remittance** (`ABN 61 794 639 443`, `BSB 062-948`, `Acc 72448917`) with instant printable GST Tax Invoice and Finance Expense Approval Memo.

## Live E2E Verification (playwright-core + headless Chromium, 2026-11-12)
- **Live public site: `48/49` checks passed.** All 5 pages (landing, workspace, deck, clients CRM, outreach console) functional on GitHub Pages: 100 CRM targets, Day-1 35/35 DM batch, mark-sent pipeline, message packs, $10,845 MRR simulator, collision→cascade lifecycle, IG Reels handoff modal, zero uncaught JS exceptions.
- **Local (fully fixed build): `49/49` checks passed** including new **offline PWA check** — the service-worker precache boots the whole workspace with zero network.
- **Static-deploy findings fixed in `mvp/public` (pending redeploy):**
  1. `sw.js` v3: precache + offline fallback now resolve paths against the service worker's own scope (works at domain root *and* the `/aurelia-os/` GitHub Pages subpath; `register('./sw.js')` in `app.js`).
  2. `app.js`: new `postApi()` helper — the workspace only calls the optional Node API after `/api/state` proves it exists, so static deploys emit no doomed POSTs (405) from the browser; client-engine fallbacks unchanged.
  3. `deck.html` / `clients.html` / `outreach.html`: added `<link rel="icon" / rel="apple-touch-icon">` (removes `/favicon.ico` 404 console noise on direct page entry).
