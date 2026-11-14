# Velvet Cadence / Aurelia OS — Incident Response & Pre-Launch Compliance Runbook

**Owner:** Dean Collins (Aurelia Systems / Velvet Cadence, ABN 61 794 639 443)  
**Primary support & security contact:** `velvet.cadence.os@gmail.com`  
**Status:** Draft prepared for owner review before commit/deploy.

---

## 1. Daily Payment & Activation SOP (Required while activation is manual)

Because GitHub Pages is static hosting, Stripe webhooks do not create server-side user accounts automatically on the public site. Until a backend auth/webhook server is live:

1. Check Stripe Dashboard (`acct_1UbLqeBCqzAWx5LT`) and `velvet.cadence.os@gmail.com` at **09:00 and 17:00 AEST** daily.
2. For every paid checkout:
   - Verify the payment status is **Succeeded** in Stripe.
   - Reply to the buyer within the same business day confirming their tier, receipt/invoice reference, and onboarding walkthrough.
3. For every refund or cancellation email:
   - Cancel the subscription in Stripe immediately.
   - If within 14 days of first payment (or required under Australian Consumer Law), trigger a full refund in Stripe and email the refund receipt.

---

## 2. Incident Playbooks

### A. Site Down or Broken Service Worker (`sw.js`)
- **Symptoms:** Users see stale pages, broken scripts, or offline cache errors.
- **Immediate action (under 15 min):**
  1. Bump `CACHE_NAME` in `mvp/public/sw.js` (currently `aurelia-os-v6`).
  2. Redeploy `gh-pages`.
  3. Instruct affected users to click **Clear All Data** in the workspace header or clear site data in browser settings.

### B. Stripe Dispute, Wrong Charge, or Unrecognized Statement Descriptor
- **Symptoms:** Customer emails about a charge or opens a bank dispute.
- **Immediate action (under 2 hours):**
  1. Look up the charge in Stripe by customer email or `client_reference_id` (`AUR-...`).
  2. Issue an immediate full refund in Stripe rather than contesting legitimate confusion on early subscriptions.
  3. Confirm in Stripe Settings that statement descriptor is `VELVET CADENCE` and support email is `velvet.cadence.os@gmail.com`.

### C. Suspected Credential Compromise (GitHub, Stripe, or Email)
- **Immediate action (under 30 min):**
  1. Rotate passwords and revoke active sessions in Google, GitHub and Stripe.
  2. In Stripe Dashboard → **Product catalogue → Payment links**, deactivate all active payment links until control is confirmed.
  3. Audit recent commits on `main` and `gh-pages` for unauthorized script changes.

### D. Privacy / Data Exposure Report (Notifiable Data Breaches — Australia)
- **Architecture reality:** The static workspace stores user trial/deadline/draft data in the user's own browser `localStorage`; raw cloud files are not uploaded to Aurelia servers.
- **If a customer reports exposed billing or support records:**
  1. Contain the source immediately (revoke shared link, rotate email/Stripe access).
  2. Assess within 30 days whether the incident is an **eligible data breach** (likely to result in serious harm) under the Privacy Act 1988 (Cth).
  3. If eligible, notify affected individuals and the Office of the Australian Information Commissioner (OAIC) using the OAIC Notifiable Data Breach statement form.

---

## 3. Custom HTTPS Domain Procurement & Setup (Google Pay / Cloudflare or Porkbun)

I cannot charge your Google Pay account directly from this sandbox. Here is the fastest, lowest-cost path you can complete in 5 minutes:

1. **Buy the domain (accepts Google Pay / card):**
   - Recommended registrars: **Porkbun** or **Cloudflare Registrar** (at-cost renewal, free WHOIS privacy, free DNS).
   - Recommended domain candidates to check: `velvetcadence.com`, `velvetcadence.com.au` (requires your ABN `61 794 639 443`), or `aureliaos.com`.
2. **Point DNS to GitHub Pages:**
   - Add four `A` records for `@`:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Add one `CNAME` record for `www` → `deano1983.github.io`.
3. **Enable free Let's Encrypt HTTPS certificate on GitHub:**
   - Open `https://github.com/deano1983/aurelia-os/settings/pages`.
   - Enter your custom domain and click **Save** (this writes the `CNAME` file).
   - Wait 5–15 minutes for DNS check, then tick **Enforce HTTPS**.
