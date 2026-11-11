'use strict';
/*
 * Aurelia OS — Day 1–30 Outreach Execution Engine
 * UMD module: runs in Node (`require`) and in the browser (`window.AureliaOutreach`).
 *
 * Turns the static 100-client CRM target list into an executable daily DM/email
 * cadence: product-mode routing, 300-char LinkedIn connection notes, 45-second
 * voice-note scripts, Day-3 and Day-7 follow-ups, email variants, and weighted
 * pipeline mathematics so the $10,845 MRR sprint can be tracked daily.
 */

const SITE = 'https://deano1983.github.io/aurelia-os/';

const PRODUCT_MODES = {
  velvet: {
    key: 'velvet',
    label: 'Velvet Cadence',
    wave: 1,
    priceAud: 99,
    priceLabel: '$49–$149/mo (B2B expensable)',
    expensable: true,
    offer:
      'a 90-second iPhone voice note plus a OneDrive or Google Drive proof chart becomes a finished LinkedIn post, a 4-slide carousel brief and a video hook',
    proof:
      'clients expense it 100% under Professional Development / PR Software, and we issue the ABN 61 794 639 443 GST tax invoice with a finance approval memo',
    partner: '30% recurring partner share',
    pain: 'chasing a busy executive for the raw insight, then hunting down the OneDrive chart that proves it',
    cta: 'Open to a 2-minute walkthrough of the 90-second voice-to-post flow this week?',
    noteLead:
      'Velvet Cadence turns a 90-second iPhone voice note plus a OneDrive chart into a finished LinkedIn post, a 4-slide carousel and a video hook. Partners earn 30% recurring.',
    subject: '90 seconds of voice into a finished LinkedIn post',
    path: 'deck.html',
  },
  sovereign: {
    key: 'sovereign',
    label: 'Sovereign Brief',
    wave: 2,
    priceAud: 39,
    priceLabel: '$39/mo or $399/yr Executive Charter',
    expensable: true,
    offer:
      'Windows OneDrive board packs, Google Drive client briefs and iOS iCloud calendar boundaries land in one readiness radar with 1-tap cascade rescheduling',
    proof:
      'no file ever reaches our servers — the index stores under 15 KB of metadata pointers, which is what gets it past IT and security review',
    partner: '$100 instant bounty or 25% recurring share',
    pain: 'the board pack living in OneDrive while the real calendar, and the school pickup, live in iCloud',
    cta: 'Worth a 2-minute look at the zero-blob dossier radar this week?',
    noteLead:
      'Sovereign Brief unifies OneDrive board packs, Google Drive briefs and iCloud calendars into one readiness radar, and no file ever leaves the client cloud. Partners earn $100 bounty or 25% recurring.',
    subject: 'One dossier radar across OneDrive, Drive and iCloud',
    path: 'index.html',
  },
  glowgrid: {
    key: 'glowgrid',
    label: 'GlowGrid Studio',
    wave: 3,
    priceAud: 29,
    priceLabel: '$19–$29/mo plus the $49 Hook Vault',
    expensable: false,
    offer:
      '4K iPhone footage drops into a Windows editing pipeline with no cable, a 4-stage upload radar, and a 2-tap native handoff into IG Reels or TikTok',
    proof:
      'video never leaves iCloud, so there is no upload queue, no re-compression and no monthly storage bill for either side',
    partner: '35% recurring affiliate',
    pain: 'moving a 4K clip from an iPhone to a Windows edit bay without a cable, a compressor or another cloud bill',
    cta: 'Want the 2-minute iPhone-to-Windows drop walkthrough this week?',
    noteLead:
      'GlowGrid Studio drops 4K iPhone clips onto a Windows edit bay in seconds, then hands off to IG Reels or TikTok in 2 taps. Affiliates earn 35% recurring.',
    subject: '4K iPhone clips onto the Windows edit bay in 10 seconds',
    path: 'index.html',
  },
  aurelia: {
    key: 'aurelia',
    label: 'Aurelia OS',
    wave: 4,
    priceAud: 149,
    priceLabel: '$79–$199/mo all-access suite',
    expensable: true,
    offer:
      'all three engines under one roof: voice-to-authority, the cross-cloud board dossier, and the iCloud-to-Windows creator drop',
    proof:
      'it runs on the same database as the spin-offs, so anyone starting on the $19–$99 tier upgrades in one click with zero migration',
    partner: '30% recurring partner share',
    pain: 'three apps, three clouds, and a calendar that never agrees with any of them',
    cta: 'Open to a 2-minute look at the all-access suite this week?',
    noteLead:
      'Aurelia OS bundles voice-to-authority, cross-cloud board dossiers and the iCloud-to-Windows creator drop in one suite. Partners earn 30% recurring.',
    subject: 'One command suite across all three clouds',
    path: 'deck.html',
  },
};

const STATUS_FLOW = [
  'not_contacted',
  'dm_sent',
  'follow_up_1',
  'follow_up_2',
  'replied',
  'demo_booked',
  'trial',
  'paid',
  'not_now',
];

const STATUS_META = {
  not_contacted: { label: 'Not contacted', probability: 0 },
  dm_sent: { label: 'DM sent', probability: 0.02 },
  follow_up_1: { label: 'Follow-up 1 (Day 3)', probability: 0.04 },
  follow_up_2: { label: 'Follow-up 2 (Day 7)', probability: 0.06 },
  replied: { label: 'Replied', probability: 0.15 },
  demo_booked: { label: 'Demo booked', probability: 0.4 },
  trial: { label: 'Trial / sandbox', probability: 0.65 },
  paid: { label: 'Paid', probability: 1 },
  not_now: { label: 'Not now', probability: 0 },
};

// Words that signal an organisation, a role or a place rather than a person's name.
const ORG_WORDS = new Set([
  'women', 'woman', 'female', 'male', 'global', 'national', 'network', 'networks', 'agency', 'agencies',
  'studio', 'studios', 'group', 'groups', 'community', 'collective', 'academy', 'summit', 'club',
  'society', 'association', 'institute', 'institution', 'partners', 'partner', 'consulting', 'company',
  'media', 'podcast', 'podcasts', 'ventures', 'capital', 'foundation', 'council', 'school', 'university',
  'directory', 'platform', 'conference', 'program', 'programs', 'hub', 'labs', 'solutions', 'advisory',
  'relations', 'influence', 'leadership', 'digital', 'creative', 'brand', 'brands', 'the', 'and',
  'with', 'for', 'of', 'on', 'in', 'a', 'an', 'ceo', 'founder', 'founders', 'co-founder', 'founder',
  'director', 'directors', 'chief', 'officer', 'executive', 'executives', 'co', 'inc', 'ltd', 'pty',
  'international', 'australia', 'australian', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide',
  'canberra', 'auckland', 'london', 'york', 'author', 'speaker', 'coach', 'strategist', 'consultant',
  'trainer', 'mentor', 'advisor', 'editor', 'writer', 'host', 'creator', 'investor', 'entrepreneur',
  'builder', 'builders', 'lawyer', 'accountant', 'etc', 'american', 'british', 'canadian', 'european',
  'asian', 'indian', 'irish', 'scottish', 'aussie', 'kiwi', 'part', 'time', 'full', 'board', 'sales',
  'marketing', 'management', 'support', 'services', 'staffing', 'talent', 'marketplace', 'community',
  'social', 'video', 'reels', 'ugc', 'influencer', 'everyday', 'fractional', 'independent',
  'technologies', 'technology', 'alliance', 'assistant', 'assistants', 'admin', 'administrative',
  'professionals', 'execs', 'consultants', 'virtual', 'freelance', 'online', 'collective',
  'daily', 'weekly', 'newsletter', 'digest', 'email', 'inbox',
]);

// Narrow set of nouns that can legitimately follow "First Last" in an unbracketed
// organisation name ("Cherie Blair Foundation for Women"), used to avoid treating
// brand names ("Shameless Media Community") as people.
const ORG_NOUNS = new Set([
  'foundation', 'network', 'group', 'institute', 'council', 'partners', 'academy', 'agency',
  'studio', 'ventures', 'capital', 'company', 'trust', 'fund', 'university', 'school',
]);

// Words that start a bracketed descriptor rather than a person's name.
const ROLE_WORDS = new Set([
  'author', 'founder', 'co-founder', 'women', 'woman', 'executive', 'executives', 'director',
  'ceo', 'board', 'coach', 'creator', 'investor', 'entrepreneur', 'president', 'managing', 'chair',
  'partner', 'partners', 'speaker', 'strategist', 'mentor', 'advisor', 'editor', 'writer', 'host',
  'chief', 'head', 'principal', 'owner', 'social', 'video', 'podcast', 'linkedin', 'ugc', 'brand',
]);

const TITLE_WORDS = new Set(['dr', 'mr', 'mrs', 'ms', 'miss', 'prof', 'professor', 'sir', 'dame', 'rev']);

function wordTokens(text) {
  return normalise(text)
    .split(/[^A-Za-z'’-]+/)
    .map((token) => token.replace(/^['’-]+|['’-]+$/g, ''))
    .filter(Boolean);
}

function baseWord(token) {
  return String(token).toLowerCase().replace(/'s$/, '');
}

function isPersonToken(token) {
  return (
    /^[A-Z][A-Za-z'’-]*$/.test(token) &&
    /[a-z]/.test(token) &&
    token.length >= 2 &&
    token.length <= 20 &&
    !ORG_WORDS.has(baseWord(token))
  );
}

function normalise(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function pick(target, key) {
  if (!target) return '';
  if (target[key] != null) return target[key];
  const lower = key.toLowerCase();
  const match = Object.keys(target).find((k) => k.toLowerCase() === lower);
  return match ? target[match] : '';
}

function resolveProductMode(product) {
  const text = normalise(product).toLowerCase();
  const hits = [];
  for (const mode of Object.values(PRODUCT_MODES)) {
    const idx = text.indexOf(mode.label.toLowerCase());
    if (idx >= 0) hits.push({ idx, key: mode.key });
  }
  if (!hits.length) return 'velvet';
  hits.sort((a, b) => a.idx - b.idx || PRODUCT_MODES[a.key].wave - PRODUCT_MODES[b.key].wave);
  return hits[0].key;
}

function firstPersonName(text) {
  const parts = normalise(text).split(/[—–|·]|\s-\s/);
  const tokens = wordTokens(parts[0]);
  const names = [];
  for (const token of tokens) {
    if (TITLE_WORDS.has(token.toLowerCase().replace(/\.$/, ''))) continue;
    if (!isPersonToken(token)) break;
    names.push(token);
    if (names.length === 2) break;
  }
  // Require "First Last" so brand-like single tokens (Tech-Enabled, Everyday) never match.
  return names.length === 2 ? names[0] : '';
}

function shortOrganization(target) {
  const org = normalise(pick(target, 'Organization_or_Leader'));
  return org.split(' (')[0].trim() || org;
}

function bracketStartsWithRole(text) {
  const first = wordTokens(normalise(text).split(/[—–|·]|\s-\s/)[0])[0];
  return Boolean(first) && ROLE_WORDS.has(baseWord(first));
}

function greetingFor(target) {
  const org = normalise(pick(target, 'Organization_or_Leader'));
  const paren = org.match(/\(([^)]+)\)/);
  if (paren) {
    const name = firstPersonName(paren[1]);
    if (name) return name;
    // Some records put the person first and the descriptor in brackets:
    // "Sue Ellson (Author of …)". Only trust an explicit First Last prefix.
    const before = org.slice(0, paren.index).replace(/[-–—|·]\s*$/, '').trim();
    const beforeTokens = wordTokens(before);
    if (
      bracketStartsWithRole(paren[1]) &&
      beforeTokens.length === 2 &&
      beforeTokens.every(isPersonToken)
    ) {
      return beforeTokens[0];
    }
    return 'there';
  }
  // "Cherie Blair Foundation for Women" — a person name followed by an org noun.
  if (/[—–|·]|\s-\s|\//.test(org)) return 'there';
  const tokens = wordTokens(org);
  if (
    tokens.length >= 3 &&
    !TITLE_WORDS.has(tokens[0].toLowerCase()) &&
    isPersonToken(tokens[0]) &&
    isPersonToken(tokens[1]) &&
    ORG_NOUNS.has(baseWord(tokens[2]))
  ) {
    return tokens[0];
  }
  return 'there';
}

function condense(text, maxLength) {
  const limit = Number(maxLength) > 0 ? Number(maxLength) : 200;
  const clean = normalise(text);
  if (clean.length <= limit) return clean;
  const slice = clean.slice(0, limit);
  const sentenceEnd = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '));
  if (sentenceEnd > limit * 0.5) return slice.slice(0, sentenceEnd + 1).trim();
  const wordEnd = slice.lastIndexOf(' ');
  return (wordEnd > 0 ? slice.slice(0, wordEnd) : slice).trim() + '…';
}

function firstSentence(text) {
  const clean = normalise(text);
  const match = clean.match(/^.*?[.!?](\s|$)/);
  return match ? match[0].trim() : clean;
}

const CONNECTION_NOTE_LIMIT = 300;

function connectionNote(target, modeKey) {
  const greeting = greetingFor(target);
  const mode = PRODUCT_MODES[modeKey] || PRODUCT_MODES.velvet;
  const ask = 'Any chance I could send a 90-second voice note?';
  const budget = CONNECTION_NOTE_LIMIT - greeting.length - ask.length - 12;
  let note = `Hi ${greeting} — ${condense(mode.noteLead, Math.max(80, budget))} ${ask}`;
  if (note.length > CONNECTION_NOTE_LIMIT) {
    note = `Hi ${greeting} — ${mode.label} turns a 90-sec voice note into a finished post. ${ask}`;
  }
  return note.slice(0, CONNECTION_NOTE_LIMIT).trim();
}

function firstTouchDm(target, modeKey) {
  const mode = PRODUCT_MODES[modeKey] || PRODUCT_MODES.velvet;
  const hook = normalise(pick(target, 'Outreach_Hook'));
  const base = hook || `Hi ${greetingFor(target)} — we built ${mode.label} for this exact workflow.`;
  return /\?/.test(base) ? base : `${base}\n\n${mode.cta}`;
}


function voiceNoteScript(target, modeKey) {
  const mode = PRODUCT_MODES[modeKey] || PRODUCT_MODES.velvet;
  const greeting = greetingFor(target);
  const org = shortOrganization(target) || 'your team';
  const fit = condense(pick(target, 'Why_High_Fit'), 190);
  const proof = mode.proof.charAt(0).toUpperCase() + mode.proof.slice(1);
  return [
    `Hi ${greeting} — 45-second voice note, no deck.`,
    `I looked at ${org} — ${fit}`,
    `The bottleneck we keep hearing: ${mode.pain}.`,
    `${mode.label} fixes it: ${mode.offer}.`,
    `${proof}.`,
    `If that is useful I will send a 2-minute walkthrough, and there is a ${mode.partner} for ${org}.`,
  ].join(' ');
}

function followUp(target, modeKey, stage) {
  const mode = PRODUCT_MODES[modeKey] || PRODUCT_MODES.velvet;
  const greeting = greetingFor(target);
  const org = shortOrganization(target) || 'your team';
  if (stage === 2) {
    return `Hi ${greeting} — closing the loop on ${mode.label} so I stop cluttering your inbox.\n\nIf it becomes relevant for ${org} later, the workspace and pricing always live at ${SITE}. Reply "sandbox" any time and I will send a free partner seat.`;
  }
  return `Hi ${greeting} — following up on the ${mode.label} note.\n\n2-minute walkthrough: ${SITE}${mode.path}\n\nIf ${org} runs a cohort, directory or partner channel, the ${mode.partner} is on the table. Want me to set up a sandbox seat for two of your people?`;
}

function emailSequence(target, modeKey) {
  const mode = PRODUCT_MODES[modeKey] || PRODUCT_MODES.velvet;
  const greeting = greetingFor(target);
  const org = shortOrganization(target) || 'your team';
  const fit = condense(pick(target, 'Why_High_Fit'), 300);
  const commercial = [
    mode.priceLabel,
    mode.expensable
      ? '100% expensable with an ABN 61 794 639 443 GST tax invoice and a finance approval memo'
      : 'no corporate approval needed',
    `partner terms: ${mode.partner}`,
  ].join(', ');
  return {
    subject: `${org} × ${mode.label} — ${mode.subject}`,
    body: [
      `Hi ${greeting},`,
      '',
      `Quick context: ${fit}`,
      '',
      `${mode.offer}.`,
      `${mode.proof}.`,
      '',
      `Commercials: ${commercial}.`,
      '',
      `2-minute walkthrough: ${SITE}${mode.path}`,
      '',
      '— The Aurelia OS team',
    ].join('\n'),
  };
}

function buildOutreachSequence(target) {
  const modeKey = resolveProductMode(pick(target, 'Target_Product'));
  const mode = PRODUCT_MODES[modeKey];
  const mail = emailSequence(target, modeKey);
  return {
    id: Number(pick(target, 'ID')) || null,
    organization: normalise(pick(target, 'Organization_or_Leader')),
    mode: modeKey,
    modeLabel: mode.label,
    greeting: greetingFor(target),
    wave: mode.wave,
    messages: {
      connection_note: {
        label: 'LinkedIn connection note (max 300 chars)',
        channel: 'linkedin',
        body: connectionNote(target, modeKey),
        limit: CONNECTION_NOTE_LIMIT,
      },
      first_dm: {
        label: 'First-touch LinkedIn DM',
        channel: 'linkedin',
        body: firstTouchDm(target, modeKey),
        limit: 1900,
      },
      voice_note: {
        label: '45-second voice / video note script',
        channel: 'voice',
        body: voiceNoteScript(target, modeKey),
        limit: null,
      },
      follow_up_day3: {
        label: 'Follow-up 1 (Day 3)',
        channel: 'linkedin',
        body: followUp(target, modeKey, 1),
        limit: 1900,
      },
      follow_up_day7: {
        label: 'Follow-up 2 / close (Day 7)',
        channel: 'linkedin',
        body: followUp(target, modeKey, 2),
        limit: 1900,
      },
      email: {
        label: 'Email version',
        channel: 'email',
        subject: mail.subject,
        body: mail.body,
        limit: 4000,
      },
    },
  };
}

function toCharCount(message) {
  if (!message) return 0;
  const subject = message.subject ? `${message.subject}\n` : '';
  return (subject + String(message.body || '')).length;
}

function addDays(isoDate, days) {
  const stamp = /^\d{4}-\d{2}-\d{2}$/.test(String(isoDate)) ? `${isoDate}T00:00:00.000Z` : String(isoDate);
  const date = new Date(stamp);
  if (Number.isNaN(date.getTime())) return String(isoDate);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}


function planCampaign(targets, options) {
  const opts = options || {};
  const rawQuota = Number(opts.dailyQuota);
  const dailyQuota = Number.isFinite(rawQuota) && rawQuota > 0 ? Math.min(200, Math.round(rawQuota)) : 35;
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(opts.startDate || '')) ? opts.startDate : '2026-11-11';

  const rows = (Array.isArray(targets) ? targets : []).map((target, index) => {
    const mode = resolveProductMode(pick(target, 'Target_Product'));
    return {
      target,
      mode,
      index,
      id: Number(pick(target, 'ID')) || index + 1,
    };
  });

  rows.sort((a, b) => PRODUCT_MODES[a.mode].wave - PRODUCT_MODES[b.mode].wave || a.id - b.id);

  return rows.map((row, position) => {
    const day = Math.floor(position / dailyQuota) + 1;
    return {
      id: row.id,
      day,
      position: position % dailyQuota,
      scheduledDate: addDays(startDate, day - 1),
      mode: row.mode,
      wave: PRODUCT_MODES[row.mode].wave,
      organization: normalise(pick(row.target, 'Organization_or_Leader')),
      target: row.target,
    };
  });
}

function dailyBatch(plan, day) {
  const wanted = Number(day);
  return (Array.isArray(plan) ? plan : [])
    .filter((row) => row.day === wanted)
    .sort((a, b) => a.position - b.position);
}

function blankRecord() {
  return { status: 'not_contacted', lastTouch: null, note: '' };
}

function pipelineMetrics(records, options) {
  const opts = options || {};
  const list = Array.isArray(records) ? records : [];
  const counts = {};
  for (const status of STATUS_FLOW) counts[status] = 0;

  let mrr = 0;
  let weightedMrr = 0;
  let contacted = 0;
  let replies = 0;
  let demos = 0;
  let trials = 0;
  let paid = 0;

  for (const record of list) {
    const status = record && STATUS_META[record.status] ? record.status : 'not_contacted';
    counts[status] += 1;
    const modeKey = record && PRODUCT_MODES[record.mode] ? record.mode : 'velvet';
    const price = PRODUCT_MODES[modeKey].priceAud;
    weightedMrr += price * STATUS_META[status].probability;
    const step = STATUS_FLOW.indexOf(status);
    if (step >= 1 && step <= 7) contacted += 1;
    if (step >= 4 && step <= 7) replies += 1;
    if (step >= 5 && step <= 7) demos += 1;
    if (status === 'trial') trials += 1;
    if (status === 'paid') {
      paid += 1;
      mrr += price;
    }
  }

  const contactedToday = Number(opts.contactedToday) || 0;
  const dailyQuota = Number(opts.dailyQuota) || 35;
  return {
    total: list.length,
    counts,
    contacted,
    replies,
    demos,
    trials,
    paid,
    mrr,
    weightedMrr: Math.round(weightedMrr * 100) / 100,
    replyRate: contacted ? Math.round((replies / contacted) * 1000) / 10 : 0,
    demoRate: contacted ? Math.round((demos / contacted) * 1000) / 10 : 0,
    closeRate: contacted ? Math.round((paid / contacted) * 1000) / 10 : 0,
    contactedToday,
    dailyQuota,
    quotaRemaining: Math.max(0, dailyQuota - contactedToday),
  };
}

function csvEscape(value) {
  const text = String(value == null ? '' : value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const CSV_HEADERS = [
  'ID',
  'Day',
  'Scheduled_Date',
  'Status',
  'Product_Mode',
  'Organization_or_Leader',
  'Location',
  'Deal_Type',
  'Website_or_Channel',
  'Last_Touch',
  'Note',
];

function toPipelineCsv(rows) {
  const body = (Array.isArray(rows) ? rows : []).map((row) =>
    [
      row.id != null ? row.id : row.ID,
      row.day != null ? row.day : '',
      row.scheduledDate || row.Scheduled_Date || '',
      row.status || 'not_contacted',
      row.mode || '',
      pick(row, 'Organization_or_Leader'),
      pick(row, 'Location'),
      pick(row, 'Deal_Type'),
      pick(row, 'Website_or_Channel'),
      row.lastTouch || '',
      row.note || '',
    ]
      .map(csvEscape)
      .join(',')
  );
  return [CSV_HEADERS.join(','), ...body].join('\n');
}

function advanceStatus(status) {
  const step = STATUS_FLOW.indexOf(status);
  if (step < 0) return 'dm_sent';
  if (step >= STATUS_FLOW.indexOf('paid')) return 'paid';
  return STATUS_FLOW[step + 1];
}

const AureliaOutreach = {
  SITE,
  PRODUCT_MODES,
  STATUS_FLOW,
  STATUS_META,
  CONNECTION_NOTE_LIMIT,
  CSV_HEADERS,
  resolveProductMode,
  greetingFor,
  shortOrganization,
  condense,
  firstSentence,
  connectionNote,
  firstTouchDm,
  voiceNoteScript,
  followUp,
  emailSequence,
  buildOutreachSequence,
  toCharCount,
  addDays,
  planCampaign,
  dailyBatch,
  blankRecord,
  pipelineMetrics,
  toPipelineCsv,
  advanceStatus,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AureliaOutreach;
}
if (typeof window !== 'undefined') {
  window.AureliaOutreach = AureliaOutreach;
}

