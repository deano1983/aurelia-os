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

module.exports = {
  PROVIDERS,
  ENERGY_PROFILES,
  DOMAINS,
  createCloudPointer,
  buildReminders,
  createCommandItem,
  detectCollisions,
  cascadeReschedule,
  voiceToAuthority,
};

