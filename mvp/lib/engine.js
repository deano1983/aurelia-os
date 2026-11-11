'use strict';
// Aurelia OS — Unified Cross-Cloud & Cross-OS Engine (Zero-Blob Metadata Pointer Index)
// Powers Flagship (Aurelia OS) + 3 Subset Spin-Offs:
//   1. Velvet Cadence (LinkedIn Voice-to-Authority & Cloud Proof Engine)
//   2. Sovereign Brief (Cross-Cloud Executive Report, Deadline & Life Dossier)
//   3. GlowGrid Studio (iCloud-to-Windows Media Drop & Upload Consistency Radar)

const PROVIDERS = {
  icloud: { id: 'icloud', label: 'Apple iCloud (iOS / macOS)', icon: 'iCloud', scheme: 'icloud://' },
  gdrive: { id: 'gdrive', label: 'Google Drive (Android / Workspace)', icon: 'GDrive', scheme: 'gdrive://' },
  onedrive: { id: 'onedrive', label: 'Microsoft OneDrive (Windows / M365)', icon: 'OneDrive', scheme: 'onedrive://' },
};

const HANDOFF_TARGETS = {
  ig_reels: {
    id: 'ig_reels',
    label: 'Instagram Reels (Assisted 2-Tap Native Handoff)',
    deepLinkUri: 'instagram://camera',
    webFallbackUri: 'https://www.instagram.com/',
    steps: [
      'Tap 1: Clipboard auto-stages caption, hook & CTA; Cloud Pointer resolves native iOS/Android media stream.',
      'Tap 2: Native Instagram Reels camera opens with audio & trim pre-selected for instant publish.',
    ],
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok Creator Studio (Assisted 2-Tap Native Handoff)',
    deepLinkUri: 'snssdk1233://studio/upload',
    webFallbackUri: 'https://www.tiktok.com/upload',
    steps: [
      'Tap 1: Auto-copy viral POV hook + hashtag block and stage Zero-Blob cloud video pointer.',
      'Tap 2: Launch TikTok upload sheet with native OS media picker bound to cloud pointer.',
    ],
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn Authority Publisher (Direct API + Native Handoff)',
    deepLinkUri: 'linkedin://shareArticle',
    webFallbackUri: 'https://www.linkedin.com/feed/',
    steps: [
      'Tap 1: Stage authority post + 4-slide PDF carousel proof attachment from OneDrive/GDrive.',
      'Tap 2: Open LinkedIn composer or trigger direct API schedule in prime executive window.',
    ],
  },
  board_deck: {
    id: 'board_deck',
    label: 'Executive Board Dossier (OneDrive / Outlook Sign-Off)',
    deepLinkUri: 'ms-excel://ofe|u|',
    webFallbackUri: 'https://onedrive.live.com/',
    steps: [
      'Tap 1: Verify all linked cross-cloud pointers (OneDrive XLSX, GDrive PDF, iCloud Keynote) pass readiness check.',
      'Tap 2: Open native Windows/M365 sign-off dispatch with executive summary pre-filled.',
    ],
  },
};

const ENERGY_PROFILES = ['camera_ready', 'deep_exec', 'quick_admin', 'recharge'];
const DOMAINS = ['executive', 'creator', 'personal'];

function createCloudPointer(input) {
  const provider = PROVIDERS[input.provider] ? input.provider : 'icloud';
  const rawSizeMb = Number(input.rawSizeMb) || 250;
  const pointerKb = 12;
  return {
    id: input.id || 'ast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title: String(input.title || 'Untitled Cloud Asset'),
    provider,
    providerLabel: PROVIDERS[provider].label,
    osOrigin: String(input.osOrigin || (provider === 'icloud' ? 'iOS' : provider === 'onedrive' ? 'Windows' : 'Android')),
    externalUri: String(input.externalUri || (PROVIDERS[provider].scheme + 'asset/' + Date.now())),
    mimeType: String(input.mimeType || 'video/mp4'),
    domain: DOMAINS.includes(input.domain) ? input.domain : 'creator',
    rawSizeMb,
    pointerKb,
    serverEgressCostUsd: 0.00,
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

function buildReminders(item) {
  const dueMs = new Date(item.dueAt).getTime();
  if (Number.isNaN(dueMs)) return [];
  const H = 3600 * 1000;
  if (item.itemType === 'content_upload') {
    return [
      { stage: 'film_cutoff', offsetHours: -24, fireAt: new Date(dueMs - 24 * H).toISOString(), label: 'Filming & Voice Capture Cutoff (iOS/Android -> Cloud Pointer)' },
      { stage: 'edit_review', offsetHours: -6, fireAt: new Date(dueMs - 6 * H).toISOString(), label: 'Windows/Cross-Cloud Edit & Proof Asset Verification' },
      { stage: 'prime_upload', offsetHours: 0, fireAt: new Date(dueMs).toISOString(), label: 'Prime Upload Window — 1-Tap Native Handoff (' + (item.channel || 'LinkedIn/IG') + ')' },
      { stage: 'analytics_report', offsetHours: 6, fireAt: new Date(dueMs + 6 * H).toISOString(), label: 'Post-Upload Engagement & Sponsor Deliverable Snapshot' },
    ];
  }
  if (item.itemType === 'report_deadline') {
    return [
      { stage: 'dossier_prep', offsetHours: -48, fireAt: new Date(dueMs - 48 * H).toISOString(), label: '48h Executive Dossier Check — Verify OneDrive/GDrive/iCloud attachments' },
      { stage: 'final_signoff', offsetHours: -4, fireAt: new Date(dueMs - 4 * H).toISOString(), label: '4h Final Sign-Off & Board/Client Distribution Alert' },
      { stage: 'hard_deadline', offsetHours: 0, fireAt: new Date(dueMs).toISOString(), label: 'HARD DEADLINE — ' + item.title },
    ];
  }
  return [
    { stage: 'prep_alert', offsetHours: -2, fireAt: new Date(dueMs - 2 * H).toISOString(), label: '2h Transition Buffer — Protect Personal/Wellness Boundary' },
    { stage: 'event_start', offsetHours: 0, fireAt: new Date(dueMs).toISOString(), label: item.title },
  ];
}

function createCommandItem(input) {
  const domain = DOMAINS.includes(input.domain) ? input.domain : 'executive';
  const itemType = input.itemType || (domain === 'creator' ? 'content_upload' : domain === 'executive' ? 'report_deadline' : 'life_event');
  const dueAt = input.dueAt || new Date(Date.now() + 3600 * 1000 * 4).toISOString();
  const item = {
    id: input.id || 'cmd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title: String(input.title || 'Untitled Command Item'),
    domain,
    itemType,
    channel: String(input.channel || (domain === 'creator' ? 'LinkedIn' : domain === 'executive' ? 'Board / OneDrive' : 'Personal / iCloud')),
    energyProfile: ENERGY_PROFILES.includes(input.energyProfile) ? input.energyProfile : (domain === 'creator' ? 'camera_ready' : 'deep_exec'),
    status: input.status || 'scheduled',
    isHardDeadline: Boolean(input.isHardDeadline ?? (itemType !== 'content_upload')),
    dueAt,
    linkedAssetIds: Array.isArray(input.linkedAssetIds) ? input.linkedAssetIds : [],
    captionOrBrief: String(input.captionOrBrief || ''),
  };
  item.reminders = buildReminders(item);
  return item;
}

function detectCollisions(items, windowHours = 2) {
  const sorted = [...items].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  const collisions = [];
  const winMs = windowHours * 3600 * 1000;
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const tA = new Date(sorted[i].dueAt).getTime();
      const tB = new Date(sorted[j].dueAt).getTime();
      if (Math.abs(tB - tA) <= winMs) {
        collisions.push({
          itemA: sorted[i].id,
          itemB: sorted[j].id,
          titleA: sorted[i].title,
          titleB: sorted[j].title,
          domains: [sorted[i].domain, sorted[j].domain],
          gapMinutes: Math.round(Math.abs(tB - tA) / 60000),
          resolution: sorted[j].isHardDeadline && !sorted[i].isHardDeadline
            ? `Cascade '${sorted[i].title}' (+24h to next ${sorted[i].energyProfile} slot)`
            : `Cascade '${sorted[j].title}' (+24h to next ${sorted[j].energyProfile} slot)`,
        });
      }
    }
  }
  return collisions;
}

function cascadeReschedule(items, shiftHours = 24) {
  const shiftMs = shiftHours * 3600 * 1000;
  let shiftedCount = 0;
  const updated = items.map((item) => {
    if (item.isHardDeadline) return { ...item, cascaded: false };
    shiftedCount++;
    const nextDue = new Date(new Date(item.dueAt).getTime() + shiftMs).toISOString();
    const moved = { ...item, dueAt: nextDue, cascaded: true };
    moved.reminders = buildReminders(moved);
    return moved;
  });
  return { items: updated, shiftedCount };
}

function voiceToAuthority(voiceTranscript, proofAssetTitle = 'Q3 Executive Metric Deck.xlsx') {
  const clean = String(voiceTranscript || '').trim();
  return {
    linkedinPost: `${clean}\n\nWhat we are seeing across the numbers right now (pulled straight from ${proofAssetTitle}):\n• Execution speed compounds when your team stops fighting fragmented tools.\n• Protect your deep-work and authority windows like board meetings.\n\nHow are you structuring your week to protect high-leverage output?`,
    carouselSlides: [
      `Slide 1 (Hook): ${clean.slice(0, 90)}...`,
      `Slide 2 (The Data): Key breakdown from ${proofAssetTitle}`,
      `Slide 3 (The Shift): Moving from fragmented clouds to one command rhythm`,
      `Slide 4 (Takeaway): 3 rules for high-output women in leadership`,
    ],
    shortVideoHook: `POV: You have 4 minutes between a board report on Windows and filming on your iPhone — here is the exact insight from ${proofAssetTitle}.`,
  };
}

function inferTargetKey(item, explicitTarget) {
  if (explicitTarget && HANDOFF_TARGETS[explicitTarget]) return explicitTarget;
  const ch = String((item && item.channel) || '').toLowerCase();
  if (item && item.domain === 'executive') return 'board_deck';
  if (ch.includes('tiktok')) return 'tiktok';
  if (ch.includes('ig') || ch.includes('reel') || ch.includes('instagram')) return 'ig_reels';
  return 'linkedin';
}

function handoffPacket(item, assets = [], targetKey) {
  const resolvedTargetKey = inferTargetKey(item, targetKey);
  const target = HANDOFF_TARGETS[resolvedTargetKey];
  const assetMap = new Map((assets || []).map((a) => [a.id, a]));
  const linkedAssets = ((item && item.linkedAssetIds) || []).map((id) => assetMap.get(id)).filter(Boolean);
  const fallbackAsset = linkedAssets[0] || (assets && assets[0]) || createCloudPointer({ title: 'Default Cloud Asset', provider: 'icloud' });
  const resolvedAssets = linkedAssets.length ? linkedAssets : [fallbackAsset];
  const cloudUris = resolvedAssets.map((a) => a.externalUri);
  const totalRawMb = resolvedAssets.reduce((sum, a) => sum + (Number(a.rawSizeMb) || 0), 0);
  const clipboardPayload = [
    `[${item ? item.title : 'Aurelia Handoff'}]`,
    item && item.captionOrBrief ? item.captionOrBrief : 'Executive & Creator high-leverage brief staged via Aurelia OS.',
    `Proof / Media Pointers: ${resolvedAssets.map((a) => `${a.title} (${a.externalUri})`).join(' | ')}`,
  ].join('\n');

  return {
    itemId: item ? item.id : 'adhoc',
    itemTitle: item ? item.title : 'Instant Native Handoff',
    targetId: target.id,
    targetLabel: target.label,
    deepLinkUri: target.deepLinkUri,
    webFallbackUri: target.webFallbackUri,
    primaryCloudUri: fallbackAsset.externalUri,
    cloudUris,
    resolvedAssets: resolvedAssets.map((a) => ({
      id: a.id, title: a.title, provider: a.provider, osOrigin: a.osOrigin, externalUri: a.externalUri, rawSizeMb: a.rawSizeMb,
    })),
    clipboardPayload,
    steps: target.steps,
    zeroBlobSavingsMb: totalRawMb,
    serverEgressCostUsd: 0.00,
    ready: cloudUris.every((u) => u.startsWith('icloud://') || u.startsWith('onedrive://') || u.startsWith('gdrive://')),
  };
}

function scoreDossierReadiness(item, assets = [], allItems = []) {
  const assetMap = new Map((assets || []).map((a) => [a.id, a]));
  const linkedAssets = ((item && item.linkedAssetIds) || []).map((id) => assetMap.get(id)).filter(Boolean);
  const hasLinkedAssets = linkedAssets.length > 0;
  const hasBrief = Boolean(item && String(item.captionOrBrief || '').trim().length >= 10);
  const hasMultiStageReminders = Boolean(item && Array.isArray(item.reminders) && item.reminders.length >= 2);
  const activeCollisions = allItems.length
    ? detectCollisions(allItems, 2).filter((c) => c.itemA === item.id || c.itemB === item.id)
    : [];
  const collisionFree = activeCollisions.length === 0;

  let score = 0;
  if (hasLinkedAssets) score += 40;
  if (hasBrief) score += 25;
  if (hasMultiStageReminders) score += 15;
  if (collisionFree) score += 20;

  const providersCovered = [...new Set(linkedAssets.map((a) => a.provider))];
  const status = score >= 90 ? 'BOARD_READY' : score >= 70 ? 'ACTION_NEEDED' : 'AT_RISK';

  return {
    itemId: item ? item.id : '',
    title: item ? item.title : '',
    score,
    status,
    hasLinkedAssets,
    hasBrief,
    hasMultiStageReminders,
    collisionFree,
    activeCollisionCount: activeCollisions.length,
    providersCovered,
    summary: status === 'BOARD_READY'
      ? `100% Ready — ${linkedAssets.length} cross-cloud pointer(s) verified, zero schedule collisions.`
      : !collisionFree
        ? `${score}% Ready — Schedule collision detected; run 1-Tap Cascade Reschedule (+24h).`
        : `${score}% Ready — Attach cloud proof pointer or complete brief.`,
  };
}

function getInitialDemoState() {
  const assets = [
    createCloudPointer({ id: 'ast_1', title: 'Q3 Board Financial Pack.xlsx', provider: 'onedrive', osOrigin: 'Windows', externalUri: 'onedrive://finance/q3-board-financial-pack.xlsx', mimeType: 'application/vnd.ms-excel', domain: 'executive', rawSizeMb: 24 }),
    createCloudPointer({ id: 'ast_2', title: 'iPhone 16 Pro 4K Founder Storytime.mov', provider: 'icloud', osOrigin: 'iOS', externalUri: 'icloud://photos/iphone16pro-4k-founder-storytime.mov', mimeType: 'video/quicktime', domain: 'creator', rawSizeMb: 640 }),
    createCloudPointer({ id: 'ast_3', title: 'Sponsor Campaign Brief & Deliverables.pdf', provider: 'gdrive', osOrigin: 'Android', externalUri: 'gdrive://campaigns/sponsor-brief-deliverables.pdf', mimeType: 'application/pdf', domain: 'creator', rawSizeMb: 8 }),
  ];
  const items = [
    createCommandItem({ id: 'cmd_1', title: 'Q3 Board Financial Report Sign-Off', domain: 'executive', itemType: 'report_deadline', channel: 'Windows OneDrive / Outlook', energyProfile: 'deep_exec', isHardDeadline: true, dueAt: '2026-11-12T09:00:00.000Z', linkedAssetIds: ['ast_1'], captionOrBrief: 'Final EBITDA & margin deck for board distribution across M365.' }),
    createCommandItem({ id: 'cmd_2', title: 'LinkedIn Authority Carousel + IG Reel Drop', domain: 'creator', itemType: 'content_upload', channel: 'LinkedIn + IG Reels', energyProfile: 'camera_ready', isHardDeadline: false, dueAt: '2026-11-12T09:45:00.000Z', linkedAssetIds: ['ast_1', 'ast_2'], captionOrBrief: 'How we cut quoting time from 2 weeks to 10 minutes + 4K founder storytime.' }),
    createCommandItem({ id: 'cmd_3', title: 'Sponsor Reel Deliverable & Brand Sign-Off', domain: 'creator', itemType: 'content_upload', channel: 'IG Reels + TikTok', energyProfile: 'camera_ready', isHardDeadline: false, dueAt: '2026-11-12T13:30:00.000Z', linkedAssetIds: ['ast_2', 'ast_3'], captionOrBrief: '60s vertical cut with sponsor deliverables PDF proof.' }),
    createCommandItem({ id: 'cmd_4', title: 'Executive Wellness & School Pickup Boundary', domain: 'personal', itemType: 'life_event', channel: 'Apple iCloud / EventKit', energyProfile: 'recharge', isHardDeadline: true, dueAt: '2026-11-12T16:30:00.000Z', linkedAssetIds: ['ast_3'], captionOrBrief: 'Protected personal recharge & family pickup window — hard stop.' }),
  ];
  return { assets, items };
}

const PRICING_PLANS = {
  velvet_pro: {
    id: 'velvet_pro',
    product: 'Velvet Cadence — Executive Authority Pro',
    mode: 'velvet',
    amountAud: 99,
    billingCycle: 'Monthly (B2B Corporate Expensable)',
    glCategory: 'Professional Development / Executive Communications & PR Software',
    features: '90-Sec Voice-to-Authority Studio + Tri-Cloud Proof Vault (OneDrive/GDrive/iCloud) + 4-Slide Carousel Briefs',
  },
  velvet_ea: {
    id: 'velvet_ea',
    product: 'Velvet Cadence — Executive + EA Dual Seat',
    mode: 'velvet',
    amountAud: 149,
    billingCycle: 'Monthly (B2B Corporate Expensable)',
    glCategory: 'Professional Development / Executive Communications & PR Software',
    features: 'Delegated EA Proof Attachment Queue + 1-Tap Executive Mobile Sign-Off + Ghostwriter Workspace',
  },
  sovereign_annual: {
    id: 'sovereign_annual',
    product: 'Sovereign Brief — Annual Executive Charter',
    mode: 'sovereign',
    amountAud: 399,
    billingCycle: 'Annual Pass (Saves $69/yr — B2B Expensable)',
    glCategory: 'Executive Productivity & Board Governance Software',
    features: 'Cross-Cloud Board Dossier Readiness + Windows OneDrive/iOS iCloud Sync + 1-Tap Cascade Reschedule',
  },
  glowgrid_pro: {
    id: 'glowgrid_pro',
    product: 'GlowGrid Studio — Creator Pro + Hook Vault',
    mode: 'glowgrid',
    amountAud: 29,
    billingCycle: 'Monthly Creator Pass',
    glCategory: 'Digital Media & Creator Production Software',
    features: 'iPhone/iCloud-to-Windows Zero-Blob 4K Media Drop + 4-Stage Upload Radar + 2-Tap IG/TikTok Handoff',
  },
  aurelia_suite: {
    id: 'aurelia_suite',
    product: 'Aurelia OS — All-Access Sovereign Suite (1+3 Bundle)',
    mode: 'all',
    amountAud: 149,
    billingCycle: 'Monthly All-Access Suite (B2B Corporate Expensable)',
    glCategory: 'Executive Operations, Cloud Workflow & Communications Suite',
    features: 'Full Aurelia OS Hub + Velvet Cadence + Sovereign Brief + GlowGrid Studio (Unlimited Cloud Pointers)',
  },
};

const PARTNER_CHANNELS = {
  ghostwriters: {
    id: 'ghostwriters',
    title: 'Channel #1: LinkedIn Ghostwriters & Female Personal Brand Agencies (For Velvet Cadence)',
    commission: '30% Recurring Partner Revenue Share ($30–$45/mo per client)',
    targetPartners: 'Boutique LinkedIn ghostwriting agencies, female founder PR consultants, fractional CMO cohorts',
    dmPitch: 'Hi [Name] — love how you position female executives on LinkedIn. Quick question: how much time do you lose every week chasing busy clients for voice notes and proof numbers sitting on their work laptops?\n\nWe built Velvet Cadence so your clients can dictate a 90-second voice note on their iPhone and attach a OneDrive/Google Drive chart in 1 tap — and it hands you a structured LinkedIn post + 4-slide carousel brief ready to polish. We pay agency partners 30% recurring ($30-$45/mo per seat) and your clients expense it 100% under their company PR/Professional Development budget. Want a free partner sandbox link to test with 2 clients this week?',
    viralHook: 'Every exported 4-slide LinkedIn carousel PDF carries a subtle luxury footer: "Executive Proof Brief assembled via VelvetCadence" — turning every client post into inbound agency + software leads.',
  },
  ea_networks: {
    id: 'ea_networks',
    title: 'Channel #2: Executive Assistant (EA) Communities & Virtual EA Agencies (For Sovereign Brief)',
    commission: '$100 Instant Bounty or 25% Annual Recurring Share per Executive + EA Pair',
    targetPartners: 'The Officials, Practically Perfect PA, Virtual EA agencies, Women-on-Boards coaching cohorts',
    dmPitch: 'Hi [Name] — if you support senior female executives or board directors who use a Windows PC/OneDrive at work and an iPhone/iCloud for life and travel, we built Sovereign Brief specifically for the EA + Executive handoff.\n\nIt unifies OneDrive board packs, Google Drive briefs, and iOS calendar boundaries into a single readiness radar with 1-tap Cascade Rescheduling when meetings overrun — without uploading a single confidential file to third-party servers. We pay EA champions $100 per onboarded executive (or 25% recurring). Can I send you a 2-minute walkthrough link?',
    viralHook: 'Dual-Seat EA Delegation: when an EA invites her Executive (or vice versa), both seats bind into one shared Cross-Cloud Dossier automatically.',
  },
  creator_coaches: {
    id: 'creator_coaches',
    title: 'Channel #3: TikTok / IG Reels UGC & 5-to-9 Creator Coaches (For GlowGrid Studio)',
    commission: '35% Recurring Creator Affiliate Commission + Co-Branded Hook Vault',
    targetPartners: 'Female UGC coaches, Skool/Stan Store creator educators, micro-influencer community hosts',
    dmPitch: 'Hey [Name]! Your community is full of ambitious 5-to-9 women building their creator brand — and their #1 technical bottleneck is getting 4K iPhone/iCloud videos onto their Windows laptop and actually hitting their prime upload windows.\n\nWe built GlowGrid Studio ("AirDrop + Upload Accountability for iPhone + Windows + Android") and we are giving select creator educators a 35% recurring affiliate link plus a custom Hook Vault for your students. Want your custom affiliate link to drop in your bio/course portal today?',
    viralHook: '20-Second TikTok/Reel Screen Demo: "POV: Moving a 640MB 4K iPhone clip to your Windows PC in 0 seconds without cables or Google Drive storage-full errors."',
  },
};

function generateCorporateInvoice(input = {}) {
  const planKey = PRICING_PLANS[input.planId] ? input.planId : 'velvet_pro';
  const plan = PRICING_PLANS[planKey];
  const buyerName = String(input.buyerName || 'Sarah Jenkins, Managing Director').trim();
  const companyName = String(input.companyName || 'Meridian Advisory Partners Pty Ltd').trim();
  const buyerEmail = String(input.buyerEmail || 's.jenkins@meridianadvisory.com.au').trim();
  const totalIncGst = Number(plan.amountAud);
  const gstAmount = Number((totalIncGst / 11).toFixed(2));
  const exGstAmount = Number((totalIncGst - gstAmount).toFixed(2));
  const invoiceNumber = 'AUR-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
  const issuedDate = new Date().toISOString().slice(0, 10);

  const approvalMemo = `Subject: Software Expense Approval — ${plan.product} ($${totalIncGst} AUD)\n\nHi Finance / Operations Team,\n\nI am activating ${plan.product} ($${totalIncGst} AUD ${plan.billingCycle}) for ${companyName}. It automates our executive LinkedIn thought-leadership publishing and cross-cloud report preparation across Microsoft OneDrive, Google Drive, and iOS with zero external file hosting, replacing $1,500+/mo in external agency/ghostwriting overhead.\n\nPlease allocate this tax invoice (${invoiceNumber}, Vendor ABN: 61 794 639 443) under GL Category: "${plan.glCategory}".\n\nThank you,\n${buyerName}`;

  return {
    invoiceNumber,
    issuedDate,
    vendorName: 'Aurelia Systems (ABN 61 794 639 443)',
    vendorAbn: '61 794 639 443',
    buyerName,
    companyName,
    buyerEmail,
    planId: plan.id,
    productName: plan.product,
    billingCycle: plan.billingCycle,
    glCategory: plan.glCategory,
    features: plan.features,
    exGstAmount,
    gstAmount,
    totalIncGst,
    currency: 'AUD',
    approvalMemo,
  };
}

function generatePartnerKit(channelId = 'ghostwriters') {
  const ch = PARTNER_CHANNELS[channelId] || PARTNER_CHANNELS.ghostwriters;
  return { ...ch };
}

function createDualCheckoutSession(input = {}) {
  const planKey = PRICING_PLANS[input.planId] ? input.planId : 'velvet_pro';
  const plan = PRICING_PLANS[planKey];
  const provider = ['stripe', 'lemonsqueezy', 'b2b_eft'].includes(input.provider) ? input.provider : 'stripe';
  const buyerEmail = String(input.buyerEmail || 's.jenkins@meridianadvisory.com.au').trim();
  const companyName = String(input.companyName || 'Meridian Advisory Partners Pty Ltd').trim();
  const affiliateRef = String(input.affiliateRef || '').trim();
  const inv = generateCorporateInvoice({
    planId: plan.id,
    buyerName: input.buyerName,
    companyName,
    buyerEmail,
  });

  const stripeParams = new URLSearchParams({
    client_reference_id: inv.invoiceNumber,
    prefilled_email: buyerEmail,
    'locale': 'en-AU',
  });
  if (affiliateRef) stripeParams.set('utm_source', affiliateRef);

  const lsParams = new URLSearchParams({
    'checkout[email]': buyerEmail,
    'checkout[custom][invoice_number]': inv.invoiceNumber,
    'checkout[custom][company_name]': companyName,
    'checkout[custom][gl_category]': plan.glCategory,
  });
  if (affiliateRef) lsParams.set('aff', affiliateRef);

  return {
    provider,
    planId: plan.id,
    productName: plan.product,
    amountAud: plan.amountAud,
    currency: 'AUD',
    billingCycle: plan.billingCycle,
    invoice: inv,
    stripeCheckoutUrl: `https://buy.stripe.com/aurelia_${plan.id}?${stripeParams.toString()}`,
    lemonSqueezyCheckoutUrl: `https://aurelia-os.lemonsqueezy.com/checkout/buy/${plan.id}?${lsParams.toString()}`,
    eftBankDetails: {
      accountName: 'Aurelia Systems (ABN 61 794 639 443)',
      bsb: '062-948',
      accountNumber: '72448917',
      reference: inv.invoiceNumber,
      paymentTerms: 'Immediate activation upon remittance advice or PO sign-off',
    },
    affiliateSplitNote: provider === 'lemonsqueezy'
      ? 'Lemon Squeezy MoR automatically calculates global VAT/GST/Sales Tax and auto-splits 25%–35% recurring affiliate payouts.'
      : provider === 'stripe'
        ? 'Stripe Direct (1.7% + A$0.30 AU cards, Apple Pay / Google Pay / Corporate Amex) + instant ABN 61 794 639 443 GST Tax Invoice.'
        : 'Direct Corporate EFT / PayID Remittance (0% card processing fee, 100% upfront cashflow on Annual Charters).',
  };
}

const AureliaEngine = {
  PROVIDERS,
  HANDOFF_TARGETS,
  ENERGY_PROFILES,
  DOMAINS,
  PRICING_PLANS,
  PARTNER_CHANNELS,
  generateCorporateInvoice,
  generatePartnerKit,
  createDualCheckoutSession,
  createCloudPointer,
  buildReminders,
  createCommandItem,
  detectCollisions,
  cascadeReschedule,
  voiceToAuthority,
  handoffPacket,
  scoreDossierReadiness,
  getInitialDemoState,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AureliaEngine;
}
if (typeof window !== 'undefined') {
  window.AureliaEngine = AureliaEngine;
}

