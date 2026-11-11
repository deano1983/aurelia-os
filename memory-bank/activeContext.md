# Aurelia OS (Women's Executive & Creator Command Suite) — Active Context

Last checked: 2026-11-11 Australia/Brisbane.

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

## Documents in Repo (`C:\dev\aurelia-os`)
- `01-product-and-subset-strategy.md` — full 1+3 product & hidden-niche strategy from `niche-strategist`.
- `02-crossplatform-cloud-architecture.md` — full cross-OS/cross-cloud blueprint & SQLite schema from `crossplatform-architect`.
- `03-commercial-diligence-and-ranking.md` — commercial due diligence, unit economics, and 30-day sequenced build ranking.
- `04-go-to-market-and-monetization-playbook.md` — complete unit economics (`$0.114/mo` infra+AI COGS, `92.4%–96.7%` gross margin), B2B corporate expense packaging for **Velvet Cadence**, Executive Assistant (EA) channel strategy for **Sovereign Brief**, micro-influencer affiliate loop for **GlowGrid Studio**, and 30-day `$10k MRR` sprint plan.

## MVP & Live Public Deployment (`C:\dev\aurelia-os\mvp`)
- **Automated Tests:** `8/8` passing (`node --test` in `C:\dev\aurelia-os\mvp`) covering Zero-Blob Cloud Pointers (`icloud://`, `onedrive://`, `gdrive://`), multi-stage reminders, Life-Work Collision Detector, 1-Tap Cascade Reschedule (`+24h`), Velvet Cadence Voice-to-Authority bundle generation, Assisted 2-Tap Native Handoff packets, Executive Dossier readiness scoring, and 100% parity between `lib/engine.js` and `public/engine-client.js`.
- **Interactive Workspace (`public/index.html` + `public/app.js` + `public/engine-client.js`):** Full interactive tabs for Flagship **Aurelia OS** and all 3 Spin-Offs (**Velvet Cadence**, **Sovereign Brief**, **GlowGrid Studio**), Fit-to-All responsive CSS across mobile (`375px`), tablet (`768px`), and PC (`1400px`).
- **Interactive Product & Commercial Deck (`public/deck.html`):** Large-Bold, Fit-to-All responsive web showcase with interactive MRR/margin simulator.
