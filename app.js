/* global AureliaEngine */
'use strict';

const WORKSPACE_STORAGE_KEY = 'aurelia.workspace.v1';
const TRIAL_STORAGE_KEY = 'aurelia.trial.v1';
const DRAFTS_STORAGE_KEY = 'aurelia.drafts.v1';
const STREAK_STORAGE_KEY = 'aurelia.streak.v1';
const CTL_STORAGE_KEY = 'aurelia.ctl.v1';

function escapeHtml(val) {
  return String(val == null ? '' : val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const VOICE_VARIANTS = [
  { id: 'authority', label: 'Executive authority' },
  { id: 'punchy', label: 'Short & punchy' },
  { id: 'story', label: 'Human story' },
];
let voiceVariants = [];
let currentVoiceIndex = 0;

function readStoredWorkspace() {
  try {
    const data = JSON.parse(localStorage.getItem(WORKSPACE_STORAGE_KEY) || 'null');
    if (data && Array.isArray(data.assets) && Array.isArray(data.items)) return data;
  } catch (_) {}
  return null;
}

function persistWorkspace() {
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({ assets: localState.assets, items: localState.items }));
  } catch (_) {}
}

function clearStoredWorkspace() {
  try { localStorage.removeItem(WORKSPACE_STORAGE_KEY); } catch (_) {}
}

async function clearAllUserData() {
  try {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    localStorage.removeItem(TRIAL_STORAGE_KEY);
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
    localStorage.removeItem(STREAK_STORAGE_KEY);
    localStorage.removeItem(CTL_STORAGE_KEY);
  } catch (_) {}
  localState = AureliaEngine.getInitialDemoState();
  voiceVariants = [];
  lastVoiceBundle = null;
  const decOut = document.getElementById('ctlDecryptedOut');
  if (decOut) decOut.innerHTML = '';
  const sealOut = document.getElementById('ctlSealedOut');
  if (sealOut) sealOut.innerHTML = '';
  await postApi('/api/reset');
  showToast('Cleared saved workspace, trial, streak, drafts and C.T.L. vault from this browser.');
  await render();
}

function readTrial() {
  try { return JSON.parse(localStorage.getItem(TRIAL_STORAGE_KEY) || 'null'); } catch (_) { return null; }
}

function startTrial() {
  try { localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify({ startedAt: Date.now() })); } catch (_) {}
  showToast('Your 7-day trial started — no card required.');
  renderReleasePanel();
}

let mode = 'all';
let localState = readStoredWorkspace() || AureliaEngine.getInitialDemoState();
let lastVoiceBundle = null;
let serverOnline = false;

const MODE_META = {
  all: {
    name: 'Flagship: Aurelia OS ($79–$199/mo)',
    tagline: 'Unified Cross-Cloud & Cross-OS Sovereign Command Suite (iOS/iCloud + Windows/OneDrive + Android/GDrive)',
    timelineTitle: 'Unified Daily Command Timeline (Reports, Uploads & Life)',
  },
  velvet: {
    name: 'Spin-Off 1: Velvet Cadence ($49–$149/mo)',
    tagline: 'LinkedIn Voice-to-Authority Studio & Cross-Cloud Proof Engine for Female Founders & Executives',
    timelineTitle: 'Velvet Cadence — Authority Publishing & Proof Schedule',
  },
  sovereign: {
    name: 'Spin-Off 2: Sovereign Brief ($39/mo)',
    tagline: 'Cross-Cloud Executive Report, Hard Board Deadlines & Protected Personal Boundary Radar',
    timelineTitle: 'Sovereign Brief — Executive Dossier & Boundary Timeline',
  },
  glowgrid: {
    name: 'Spin-Off 3: GlowGrid Studio ($19–$29/mo)',
    tagline: 'iCloud-to-Windows 4K Media Drop, Multi-Stage Upload Reminders & Assisted 2-Tap Native Handoff',
    timelineTitle: 'GlowGrid Studio — Creator Upload Radar & 2-Tap Native Handoff',
  },
};

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.style.display = 'none'; }, 2600);
}

function copyText(text, label) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied ' + label + ' to clipboard!')).catch(() => fallbackCopy(text, label));
  } else {
    fallbackCopy(text, label);
  }
}

function fallbackCopy(text, label) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(ta);
  showToast('Copied ' + label + ' to clipboard!');
}

function computeClientPayload(stateObj) {
  const collisions = AureliaEngine.detectCollisions(stateObj.items, 2);
  const rawMbSaved = stateObj.assets.reduce((s, a) => s + (Number(a.rawSizeMb) || 0), 0);
  const dossiers = {};
  const handoffs = {};
  stateObj.items.forEach((item) => {
    dossiers[item.id] = AureliaEngine.scoreDossierReadiness(item, stateObj.assets, stateObj.items);
    handoffs[item.id] = AureliaEngine.handoffPacket(item, stateObj.assets);
  });
  return {
    assets: stateObj.assets,
    items: stateObj.items,
    collisions,
    dossiers,
    handoffs,
    metrics: { rawMbSaved, pointerKbUsed: stateObj.assets.length * 12, serverEgressUsd: 0 },
  };
}

async function fetchState() {
  const isLocalServer = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname || '');
  if (!isLocalServer) {
    serverOnline = false;
    return computeClientPayload(localState);
  }
  try {
    const res = await fetch('/api/state', { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.assets) && Array.isArray(data.items)) {
        serverOnline = true;
        localState = { assets: data.assets, items: data.items };
        persistWorkspace();
        return computeClientPayload(localState);
      }
    }
  } catch (_) {
    serverOnline = false;
  }
  return computeClientPayload(localState);
}

// Server-sync helper: the workspace runs solo (client engine) on static HTTPS
// deploys — only talk to the optional Node API once /api/state proved it exists,
// so GitHub Pages never sees doomed POSTs (405) fired from the browser.
async function postApi(path, body) {
  if (!serverOnline) return null;
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return await res.json();
  } catch (_) {}
  return null;
}

function setMode(m, btn) {
  mode = m;
  document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  render();
}

function populateProofSelect(assets) {
  const select = document.getElementById('proofAssetSelect');
  if (!select) return;
  const current = select.value;
  select.innerHTML = assets.map((a) => {
    const label = `${a.title} (${a.osOrigin} / ${a.provider.toUpperCase()})`;
    return `<option value="${label.replace(/"/g, '&quot;')}">${label}</option>`;
  }).join('');
  if (current && Array.from(select.options).some((o) => o.value === current)) {
    select.value = current;
  }
}
function renderReleasePanel() {
  const el = document.getElementById('releasePanel');
  if (!el) return;
  const params = new URLSearchParams(window.location.search);
  const checkout = params.get('checkout');
  if (checkout === 'success') {
    const invoice = params.get('inv') || 'your Stripe receipt';
    el.innerHTML = `<div class="ok-banner" style="border-width:3px"><div><b>Stripe checkout complete.</b> To activate your paid tier, forward <b>${invoice}</b> and your receipt to <b>velvet.cadence.os@gmail.com</b>. You will receive activation confirmation and next steps. Your saved workspace stays on this device.</div></div>`;
    return;
  }
  if (checkout === 'cancel') {
    el.innerHTML = '<div class="warn"><div>Checkout was cancelled. Your trial and saved workspace are unchanged. Choose a plan below whenever you are ready.</div></div>';
    return;
  }
  const trial = readTrial();
  let daysLeft = null;
  if (trial && Number(trial.startedAt)) {
    const elapsed = Math.floor((Date.now() - Number(trial.startedAt)) / 86400000);
    daysLeft = Math.max(0, 7 - elapsed);
  }
  const status = daysLeft === null ? 'START FREE' : daysLeft > 0 ? `${daysLeft} DAY${daysLeft === 1 ? '' : 'S'} LEFT` : 'TRIAL ENDED';
  const action = daysLeft === null
    ? '<button class="gold sm" onclick="startTrial()">Start my 7 days — no card</button>'
    : '<a class="deck-link" href="#b2bPanel">Choose a plan &rarr;</a>';
  el.innerHTML = `<div class="mode-banner" style="background:#f0fdf4;border:2px solid #15803d;color:#166534;margin-bottom:16px">` +
    `<div><div style="font-size:16px;font-weight:900">Aurelia OS &amp; Velvet Cadence v1.3 · ${status}</div>` +
    `<div style="font-size:13px">No login required: your workspace, streak, drafts and C.T.L. ciphertext vault live in this browser (exportable via Backup .json). Do not enter confidential data on a shared computer; use Clear All Data before leaving a shared device.</div></div>` +
    `<div style="display:flex;gap:8px;flex-wrap:wrap">${action}<a class="deck-link" href="./privacy.html" style="background:#fff;color:#1e1b2e">Privacy &amp; terms</a></div></div>`;
}

async function render() {
  const r = await fetchState();
  renderReleasePanel();
  const meta = MODE_META[mode] || MODE_META.all;

  document.getElementById('modeBanner').innerHTML =
    `<div><div style="font-size:17px;font-weight:900;color:#fde68a">${meta.name}</div>` +
    `<div style="font-size:14px;color:#e2e8f0">${meta.tagline}</div></div>` +
    `<span class="badge" style="background:#312e48;color:#fde68a;border:1px solid #d4af37">` +
    `${serverOnline ? 'Node API + Client Engine Synced' : 'Static HTTPS Client Engine Active'}</span>`;

  document.getElementById('timelineTitle').textContent = meta.timelineTitle;

  const boardDossier = r.dossiers.cmd_1 || Object.values(r.dossiers)[0] || { score: 100, status: 'BOARD_READY' };
  document.getElementById('kpiStrip').innerHTML =
    `<div class="kpi"><div class="kpi-label">Raw Cloud Media Indexed</div><div class="kpi-val">${r.metrics.rawMbSaved} MB</div></div>` +
    `<div class="kpi"><div class="kpi-label">Metadata Pointer Footprint</div><div class="kpi-val">${r.metrics.pointerKbUsed} KB</div></div>` +
    `<div class="kpi"><div class="kpi-label">Server Video Egress</div><div class="kpi-val" style="color:#15803d">$0.00 (pointer-only)</div></div>` +
    `<div class="kpi"><div class="kpi-label">Executive Dossier Readiness</div><div class="kpi-val">${boardDossier.score}% (${boardDossier.status.replace('_', ' ')})</div></div>`;

  document.getElementById('metrics').innerHTML =
    `&#10004; Raw Cloud Media Indexed: <b>${r.metrics.rawMbSaved} MB</b> &middot; Pointer Sync: <b>${r.metrics.pointerKbUsed} KB</b> &middot; Server Video Egress: <b>$0.00 (metadata pointers only)</b>`;

  const cb = document.getElementById('collisionBox');
  cb.innerHTML = r.collisions.length
    ? r.collisions.map((c) =>
      `<div class="warn"><div>&#9888; LIFE-WORK COLLISION (${c.gapMinutes} min apart): <b>${c.titleA}</b> vs <b>${c.titleB}</b> &rarr; ${c.resolution}</div>` +
      `<div><button class="gold" onclick="cascade()">1-Tap Cascade Reschedule (+24h)</button></div></div>`).join('')
    : `<div class="ok-banner"><div>&#10004; <b>Zero Schedule Collisions</b> — Executive Reports, Prime Creator Upload Windows &amp; Personal Boundaries Aligned.</div>` +
      `<button class="outline sm" onclick="resetDemo()">Restore Collision Demo</button></div>`;

  const items = r.items.filter((i) => {
    if (mode === 'all') return true;
    if (mode === 'velvet') return i.domain === 'creator' || i.domain === 'executive';
    if (mode === 'sovereign') return i.domain !== 'creator';
    if (mode === 'glowgrid') return i.domain === 'creator';
    return true;
  });

  const activeCount = items.filter((i) => !i.completed).length;
  document.getElementById('timelineCountBadge').textContent = `${activeCount} Active`;

  document.getElementById('timeline').innerHTML = items.map((i) => {
    const dossier = r.dossiers[i.id] || AureliaEngine.scoreDossierReadiness(i, r.assets, r.items);
    const readinessBadge = i.completed
      ? '<span class="badge b-ready">&#10004; Completed</span>'
      : dossier.status === 'BOARD_READY'
        ? `<span class="badge b-ready">Readiness: ${dossier.score}% READY</span>`
        : `<span class="badge b-action">Readiness: ${dossier.score}% (${dossier.status.replace('_', ' ')})</span>`;

    const handoffButtons = i.domain === 'creator'
      ? `<button class="gold sm" onclick="openHandoff('${i.id}','ig_reels')">&#128241; 1-Tap IG Reels Handoff</button>` +
        `<button class="outline sm" onclick="openHandoff('${i.id}','tiktok')">TikTok Handoff</button>` +
        `<button class="outline sm" onclick="openHandoff('${i.id}','linkedin')">LinkedIn Handoff</button>`
      : `<button class="gold sm" onclick="openHandoff('${i.id}','board_deck')">&#128193; 1-Tap Executive Dossier Sign-Off</button>`;

    const statusActions =
      `<button class="outline sm" onclick="toggleCommandItem('${i.id}')">${i.completed ? 'Reopen' : '&#10003; Mark Done'}</button>` +
      `<button class="outline sm" onclick="deleteCommandItem('${i.id}')">Remove</button>`;

    return `<div class="card" style="${i.completed ? 'opacity:0.72;border-color:#86efac;background:#f0fdf4' : ''}">` +
      `<div><span class="badge b-${i.domain}">${escapeHtml(i.domain)}</span><span class="badge">${escapeHtml(i.energyProfile)}</span>${readinessBadge}${i.cascaded ? '<span class="badge b-ready">+24h Cascaded</span>' : ''}</div>` +
      `<div style="font-size:18px;font-weight:900;margin-top:4px;color:#1e1b2e;${i.completed ? 'text-decoration:line-through' : ''}">${escapeHtml(i.title)}</div>` +
      `<div style="color:#475569;font-size:14px">${escapeHtml(i.channel)} &middot; Due: <b>${escapeHtml(String(i.dueAt).slice(0, 16).replace('T', ' '))} UTC</b> ${i.isHardDeadline ? '<span style="color:#b91c1c">(HARD DEADLINE LOCKED)</span>' : '<span style="color:#0369a1">(Flexible Creator Slot)</span>'}</div>` +
      (i.captionOrBrief ? `<div style="font-size:14px;color:#1e293b;margin-top:4px">Brief: ${escapeHtml(i.captionOrBrief)}</div>` : '') +
      `<div class="rem">${(i.reminders || []).map((m) => `<div style="margin-bottom:3px"><span class="rem-stage">${escapeHtml(m.stage)}</span> ${escapeHtml(m.label)}</div>`).join('')}</div>` +
      `<div class="btn-row">${handoffButtons}${statusActions}</div></div>`;
  }).join('');

  document.getElementById('assets').innerHTML = r.assets.map((a) =>
    `<div class="card"><span class="badge b-${a.provider}">${escapeHtml(a.providerLabel)}</span><span class="badge">${escapeHtml(a.osOrigin)}</span><span class="badge b-${a.domain}">${escapeHtml(a.domain)}</span><br>` +
    `<b style="font-size:17px">${escapeHtml(a.title)}</b><br>` +
    `<span style="color:#475569;font-size:14px">Deep-Link URI: <code>${escapeHtml(a.externalUri)}</code> &middot; Raw Size: <b>${Number(a.rawSizeMb) || 0} MB</b> (Pointer: ${Number(a.pointerKb) || 12} KB &middot; Egress: $0.00)</span>` +
    `<div class="btn-row"><button class="outline sm" onclick="copyText('${String(a.externalUri).replace(/'/g, "\\'")}', 'Cloud Deep-Link URI')">Copy Cloud URI</button></div></div>`
  ).join('');

  const showVelvet = mode === 'all' || mode === 'velvet';
  const showCtl = mode === 'all' || mode === 'velvet' || mode === 'sovereign';
  const showGlow = mode === 'all' || mode === 'glowgrid';
  const velvetEl = document.getElementById('velvetPanel');
  const ctlEl = document.getElementById('ctlPanel');
  const glowEl = document.getElementById('glowgridPanel');
  if (velvetEl) velvetEl.style.display = showVelvet ? '' : 'none';
  if (ctlEl) ctlEl.style.display = showCtl ? '' : 'none';
  if (glowEl) glowEl.style.display = showGlow ? '' : 'none';

  populateProofSelect(r.assets);
  populateCtlAssetSelect(r.assets);
  if (!lastVoiceBundle) runVoice();
  else renderVoiceWorkspace();
  renderCtlVault();
  renderStreak();
  renderMediaKit();
}
async function cascade() {
  const data = await postApi('/api/cascade');
  if (data && Array.isArray(data.items)) {
    localState.items = data.items;
    persistWorkspace();
    showToast('Cascaded flexible creator uploads +24h — Hard deadlines protected!');
    await render();
    return;
  }
  const r = AureliaEngine.cascadeReschedule(localState.items, 24);
  localState.items = r.items;
  persistWorkspace();
  showToast(`Cascaded ${r.shiftedCount} flexible item(s) +24h!`);
  await render();
}

async function resetDemo() {
  clearStoredWorkspace();
  const data = await postApi('/api/reset');
  if (data && Array.isArray(data.items)) {
    localState = { assets: data.assets, items: data.items };
    showToast('Demo state reset!');
    await render();
    return;
  }
  localState = AureliaEngine.getInitialDemoState();
  showToast('Demo state reset!');
  await render();
}

async function addAssetPointer() {
  const titleEl = document.getElementById('newAssetTitle');
  const providerEl = document.getElementById('newAssetProvider');
  const domainEl = document.getElementById('newAssetDomain');
  const sizeEl = document.getElementById('newAssetSize');

  const payload = {
    title: (titleEl && titleEl.value.trim()) || 'New Cross-Cloud Asset.mov',
    provider: (providerEl && providerEl.value) || 'icloud',
    domain: (domainEl && domainEl.value) || 'creator',
    rawSizeMb: Number(sizeEl && sizeEl.value) || 250,
  };

  const data = await postApi('/api/assets', payload);
  if (data) {
    if (Array.isArray(data.assets)) localState.assets = data.assets;
    else if (data.id) localState.assets.unshift(data);
    persistWorkspace();
    showToast(`Indexed ${payload.rawSizeMb} MB cloud asset with 12 KB pointer ($0.00 egress)!`);
    await render();
    return;
  }

  const pointer = AureliaEngine.createCloudPointer(payload);
  localState.assets.unshift(pointer);
  persistWorkspace();
  showToast(`Indexed ${pointer.rawSizeMb} MB cloud asset with 12 KB pointer ($0.00 egress)!`);
  await render();
}

async function addCommandItem() {
  const titleEl = document.getElementById('newItemTitle');
  const title = titleEl ? titleEl.value.trim() : '';
  if (!title) {
    showToast('Name the deadline or publishing slot first.');
    if (titleEl) titleEl.focus();
    return;
  }
  const domain = document.getElementById('newItemDomain').value;
  const itemType = document.getElementById('newItemType').value;
  const dueValue = document.getElementById('newItemDue').value;
  let dueAt;
  try {
    dueAt = dueValue ? new Date(dueValue).toISOString() : new Date(Date.now() + 86400000).toISOString();
  } catch (_) {
    showToast('Choose a valid due date and time.');
    return;
  }
  const payload = {
    title,
    domain,
    itemType,
    dueAt,
    channel: 'My workspace',
    isHardDeadline: itemType !== 'content_upload',
    captionOrBrief: 'Created in my Velvet Cadence workspace.',
    linkedAssetIds: [],
  };
  const data = await postApi('/api/items', payload);
  if (data && Array.isArray(data.items)) {
    localState.items = data.items;
  } else {
    localState.items.push(AureliaEngine.createCommandItem({ ...payload, id: 'cmd_' + Date.now() }));
  }
  persistWorkspace();
  titleEl.value = '';
  showToast('Added to your timeline and saved on this device.');
  await render();
}
function readDraftHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(DRAFTS_STORAGE_KEY) || '[]');
    return Array.isArray(history) ? history : [];
  } catch (_) { return []; }
}

function persistCurrentDraft() {
  const history = readDraftHistory();
  if (!history.length || !lastVoiceBundle) return;
  history[0].variants = voiceVariants;
  history[0].updatedAt = new Date().toISOString();
  try { localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(history)); } catch (_) {}
}

function saveDraftHistory(transcript) {
  const history = readDraftHistory();
  history.unshift({
    id: Date.now(),
    createdAt: new Date().toISOString(),
    transcript,
    variants: voiceVariants,
  });
  try { localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(history.slice(0, 5))); } catch (_) {}
}

function restoreLatestDraft() {
  const latest = readDraftHistory()[0];
  if (!latest || !Array.isArray(latest.variants) || !latest.variants.length) return false;
  voiceVariants = latest.variants;
  currentVoiceIndex = 0;
  lastVoiceBundle = voiceVariants[0].bundle;
  const input = document.getElementById('voiceIn');
  if (input && latest.transcript) input.value = latest.transcript;
  return true;
}

function selectVoiceVariant(value) {
  const index = Number(value);
  if (!voiceVariants[index]) return;
  currentVoiceIndex = index;
  lastVoiceBundle = voiceVariants[index].bundle;
  persistCurrentDraft();
  renderVoiceWorkspace();
}

function updateVoicePart(part, value) {
  if (!lastVoiceBundle) return;
  if (part === 'post') lastVoiceBundle.linkedinPost = value;
  if (part === 'carousel') lastVoiceBundle.carouselSlides = value.split('\n');
  if (part === 'hook') lastVoiceBundle.shortVideoHook = value;
  voiceVariants[currentVoiceIndex].bundle = lastVoiceBundle;
  persistCurrentDraft();
}

function downloadVoiceDraft() {
  if (!lastVoiceBundle) return;
  const markdown = `# LinkedIn post\n\n${lastVoiceBundle.linkedinPost}\n\n# Carousel brief\n\n${lastVoiceBundle.carouselSlides.map((s) => `- ${s}`).join('\n')}\n\n# Video hook\n\n${lastVoiceBundle.shortVideoHook}\n`;
  const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'velvet-cadence-draft.md';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Markdown draft downloaded.');
}

function renderVoiceWorkspace() {
  const out = document.getElementById('voiceOut');
  if (!out || !lastVoiceBundle) return;
  const options = voiceVariants.map((v, i) => `<option value="${i}">${v.label}</option>`).join('');
  out.innerHTML = `<div class="card">` +
    `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">` +
    `<b>First Post Studio — choose and edit your draft</b>` +
    `<div style="display:flex;gap:8px;flex-wrap:wrap"><select id="voiceVariantSelect" onchange="selectVoiceVariant(this.value)" style="width:auto">${options}</select>` +
    `<button class="outline sm" onclick="downloadVoiceDraft()">Download .md</button></div></div>` +
    `<div style="font-size:13px;color:#166534;background:#f0fdf4;padding:8px;border-radius:6px;margin-bottom:10px">Your edits save automatically on this device. Nothing publishes until you copy or download it.</div>` +
    `<label for="voicePostEdit" style="font-size:13px;font-weight:800">LinkedIn post (editable)</label>` +
    `<textarea id="voicePostEdit" rows="10" oninput="updateVoicePart('post',this.value)" style="margin:6px 0 10px"></textarea>` +
    `<label for="voiceCarouselEdit" style="font-size:13px;font-weight:800">4-slide carousel brief (editable)</label>` +
    `<textarea id="voiceCarouselEdit" rows="7" oninput="updateVoicePart('carousel',this.value)" style="margin:6px 0 10px"></textarea>` +
    `<label for="voiceHookEdit" style="font-size:13px;font-weight:800">Short-form video hook (editable)</label>` +
    `<textarea id="voiceHookEdit" rows="3" oninput="updateVoicePart('hook',this.value)" style="margin:6px 0 10px"></textarea>` +
    `<div class="btn-row"><button class="gold sm" onclick="copyVoicePart('post')">Copy LinkedIn post</button>` +
    `<button class="outline sm" onclick="copyVoicePart('carousel')">Copy carousel</button>` +
    `<button class="outline sm" onclick="copyVoicePart('hook')">Copy video hook</button></div></div>`;
  document.getElementById('voiceVariantSelect').value = String(currentVoiceIndex);
  document.getElementById('voicePostEdit').value = lastVoiceBundle.linkedinPost;
  document.getElementById('voiceCarouselEdit').value = lastVoiceBundle.carouselSlides.join('\n');
  document.getElementById('voiceHookEdit').value = lastVoiceBundle.shortVideoHook;
}

async function runVoice() {
  const transcript = (document.getElementById('voiceIn') && document.getElementById('voiceIn').value) || '';
  const select = document.getElementById('proofAssetSelect');
  const proofAsset = (select && select.value) || 'Q3 Board Financial Pack.xlsx (Windows / ONEDRIVE)';
  const audience = (document.getElementById('voiceAudience') && document.getElementById('voiceAudience').value) || 'executives and consultants';
  const preferredTone = (document.getElementById('voiceTone') && document.getElementById('voiceTone').value) || 'authority';

  voiceVariants = VOICE_VARIANTS.map((variant) => ({
    ...variant,
    bundle: AureliaEngine.voiceToAuthority(transcript, proofAsset, { tone: variant.id, audience }),
  }));
  currentVoiceIndex = Math.max(0, VOICE_VARIANTS.findIndex((v) => v.id === preferredTone));
  lastVoiceBundle = voiceVariants[currentVoiceIndex].bundle;
  saveDraftHistory(transcript);
  renderVoiceWorkspace();
}

function copyVoicePart(part) {
  if (!lastVoiceBundle) return;
  if (part === 'post') copyText(lastVoiceBundle.linkedinPost, 'LinkedIn Authority Post');
  if (part === 'carousel') copyText(lastVoiceBundle.carouselSlides.join('\n'), '4-Slide Carousel Brief');
  if (part === 'hook') copyText(lastVoiceBundle.shortVideoHook, 'Short-Form Video Hook');
}

let activeHandoffPayload = '';
let lastInvoice = null;
let lastPartnerKit = null;
let deferredPwaPrompt = null;
let speechRec = null;
let isRecording = false;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

function installAppPrompt() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.then(() => { deferredPwaPrompt = null; });
    return;
  }
  showToast('PWA Ready: On iOS Safari tap Share -> Add to Home Screen; on Windows Edge/Chrome click Install in the address bar!');
}

function toggleVoiceDictation() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = document.getElementById('micBtn');
  if (!SR) {
    showToast('Simulating 90s executive voice capture...');
    document.getElementById('voiceIn').value =
      'Between our 9 AM board review on Windows OneDrive and my 11 AM client keynote, here is the operational shift that saved my team hours every week: we stopped moving raw files across clouds and unified our executive and publishing rhythm.';
    runVoice();
    return;
  }
  if (isRecording && speechRec) {
    speechRec.stop();
    isRecording = false;
    if (btn) btn.innerHTML = '&#127897; Dictate Live Voice Note';
    return;
  }
  speechRec = new SR();
  speechRec.lang = 'en-AU';
  speechRec.interimResults = false;
  speechRec.onresult = (ev) => {
    const t = ev.results[0][0].transcript;
    document.getElementById('voiceIn').value = t;
    runVoice();
    showToast('Voice note captured & converted to LinkedIn Authority Bundle!');
  };
  speechRec.onend = () => {
    isRecording = false;
    if (btn) btn.innerHTML = '&#127897; Dictate Live Voice Note';
  };
  isRecording = true;
  if (btn) btn.innerHTML = '&#9209; Stop Recording...';
  speechRec.start();
}
function openHandoff(itemId, targetKey) {
  const item = localState.items.find((i) => i.id === itemId) || localState.items[0];
  const packet = AureliaEngine.handoffPacket(item, localState.assets, targetKey);
  activeHandoffPayload = packet.clipboardPayload;
  const modal = document.getElementById('handoffModal');
  const body = document.getElementById('handoffModalBody');
  document.getElementById('handoffModalTitle').textContent = packet.targetLabel;

  body.innerHTML =
    `<div style="margin-bottom:10px"><span class="badge b-ready">Zero-Blob Savings: ${packet.zeroBlobSavingsMb} MB</span><span class="badge b-icloud">Server Egress: $0.00</span></div>` +
    `<div style="font-size:15px;margin-bottom:8px"><b>Command Item:</b> ${packet.itemTitle}</div>` +
    `<div style="font-size:14px;margin-bottom:8px"><b>Native App Deep-Link URI:</b> <code>${packet.deepLinkUri}</code></div>` +
    `<div style="font-size:14px;margin-bottom:10px"><b>Resolved Cloud Asset Pointers:</b><br>` +
    packet.resolvedAssets.map((a) => `&bull; <b>${a.title}</b> (${a.osOrigin}) &rarr; <code>${a.externalUri}</code> (${a.rawSizeMb} MB)`).join('<br>') +
    `</div><div class="card" style="background:#fefce8;border-color:#d4af37"><b>Assisted 2-Tap Execution Protocol:</b><br>${packet.steps.map((s) => '&check; ' + s).join('<br>')}</div>` +
    `<div style="font-size:13px;color:#475569;margin-bottom:4px">Auto-Staged Clipboard Payload:</div>` +
    `<pre style="white-space:pre-wrap;font-family:inherit;font-size:13.5px;background:#f8fafc;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin:0 0 12px 0">${packet.clipboardPayload}</pre>` +
    `<div class="btn-row">` +
    `<button class="gold" onclick="copyText(activeHandoffPayload, 'Handoff Caption & Cloud Pointers')">Tap 1: Copy Staged Caption &amp; Cloud Pointers</button>` +
    `<a class="deck-link" href="${packet.webFallbackUri}" target="_blank" rel="noopener noreferrer" onclick="showToast('Launching native handoff target: ${packet.deepLinkUri}')">Tap 2: Launch ${packet.targetId.toUpperCase()} Native Handoff &rarr;</a></div>`;

  modal.classList.add('open');
}

function closeHandoffModal() {
  const modal = document.getElementById('handoffModal');
  if (modal) modal.classList.remove('open');
}

function populateInvoicePlans() {
  const sel = document.getElementById('invPlan');
  if (!sel || sel.options.length > 0) return;
  Object.values(AureliaEngine.PRICING_PLANS).forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.product} — $${p.amountAud} AUD (${p.billingCycle})`;
    sel.appendChild(opt);
  });
}

function renderInvoice() {
  populateInvoicePlans();
  const planId = (document.getElementById('invPlan') && document.getElementById('invPlan').value) || 'velvet_pro';
  const buyerName = (document.getElementById('invBuyer') && document.getElementById('invBuyer').value) || 'Sarah Jenkins, Managing Director';
  const companyName = (document.getElementById('invCompany') && document.getElementById('invCompany').value) || 'Meridian Advisory Partners Pty Ltd';
  const session = AureliaEngine.createDualCheckoutSession({ planId, buyerName, companyName, provider: 'stripe' });
  const inv = session.invoice;
  lastInvoice = inv;
  const out = document.getElementById('invoiceOut');
  if (!out) return;
  out.innerHTML =
    `<div class="card" style="background:#fefce8;border-color:#d4af37">` +
    `<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;border-bottom:2px solid #d4af37;padding-bottom:6px;margin-bottom:8px">` +
    `<b>PRO-FORMA TAX INVOICE ESTIMATE: ${inv.invoiceNumber}</b><span>Issued: ${inv.issuedDate} &middot; ${inv.vendorName}</span></div>` +
    `<div style="font-size:14px;margin-bottom:6px"><b>Bill To:</b> ${inv.buyerName} (${inv.companyName})</div>` +
    `<div style="font-size:14px;margin-bottom:6px"><b>Subscription:</b> ${inv.productName}</div>` +
    `<div style="font-size:13px;color:#475569;margin-bottom:8px"><b>Recommended Corporate GL Category:</b> <code>${inv.glCategory}</code></div>` +
    `<div style="font-size:15px;background:#fff;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:10px">` +
    `Ex-GST: <b>$${inv.exGstAmount.toFixed(2)}</b> &nbsp;|&nbsp; GST (10%): <b>$${inv.gstAmount.toFixed(2)}</b> &nbsp;|&nbsp; Total Paid/Due: <b style="color:#15803d">$${inv.totalIncGst.toFixed(2)} AUD</b></div>` +
    `<div style="font-size:13px;background:#f8fafc;padding:8px 10px;border:1px dashed #94a3b8;border-radius:6px;margin-bottom:10px">` +
    `<b>Corporate EFT / PO option:</b> ${session.eftBankDetails.paymentTerms} Ref: <code>${session.eftBankDetails.reference}</code> &middot; Contact: <code>velvet.cadence.os@gmail.com</code></div>` +
    `<div style="font-size:12.5px;color:#475569;margin-bottom:10px">This preview is a pre-checkout expense estimate. A paid Stripe receipt is required for a final tax invoice record; Aurelia Systems is not responsible for misuse of unverified estimates.</div>` +
    `<div class="btn-row" style="margin-bottom:8px">` +
    `<button class="gold sm" onclick="launchCheckout('stripe')">&#128179; Checkout via Stripe (Direct / Apple Pay / Corp Card)</button>` +
    `</div>` +
    `<div class="btn-row">` +
    `<button class="outline sm" onclick="copyText(lastInvoice.approvalMemo, 'Finance Expense Approval Memo')">1-Click Copy Finance Approval Email</button>` +
    `<button class="outline sm" onclick="printCorporateInvoice()">Print / Save PDF Tax Invoice</button></div></div>`;
}

async function launchCheckout(provider) {
  const planId = (document.getElementById('invPlan') && document.getElementById('invPlan').value) || 'velvet_pro';
  const buyerName = (document.getElementById('invBuyer') && document.getElementById('invBuyer').value) || 'Sarah Jenkins, Managing Director';
  const companyName = (document.getElementById('invCompany') && document.getElementById('invCompany').value) || 'Meridian Advisory Partners Pty Ltd';
  const params = new URLSearchParams(window.location.search);
  const affiliateRef = params.get('ref') || '';
  let session = AureliaEngine.createDualCheckoutSession({ planId, buyerName, companyName, provider, affiliateRef });
  const serverSession = await postApi('/api/checkout', { planId, buyerName, companyName, provider, affiliateRef });
  if (serverSession && serverSession.invoice) session = serverSession;
  const targetUrl = session.stripeCheckoutUrl;
  // Plans with a real Stripe Payment Link go straight to the hosted checkout.
  if (provider === 'stripe' && session.stripeLive && !session.liveStripeSessionId) {
    showToast('Opening secure Stripe checkout — ' + session.productName + ' ($' + session.amountAud + ' AUD/mo)');
    const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = targetUrl;
    return;
  }
  copyText(targetUrl, 'Stripe Checkout Link');
  showToast('Stripe Checkout Ready (' + session.invoice.invoiceNumber + ') — link copied & opening!');
  if (session.liveStripeSessionId) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
}

function printCorporateInvoice() {
  if (!lastInvoice) renderInvoice();
  const inv = lastInvoice;
  const w = window.open('', '_blank', 'width=780,height=680');
  if (!w) {
    copyText(inv.approvalMemo, 'Tax Invoice & Finance Memo');
    return;
  }
  w.document.write(`<!DOCTYPE html><html><head><title>Pro-Forma Tax Invoice Estimate ${inv.invoiceNumber}</title><style>body{font-family:'Segoe UI',sans-serif;padding:32px;color:#18181b;line-height:1.5}h1{margin:0;color:#1e1b2e}.box{border:2px solid #1e1b2e;border-radius:10px;padding:20px;margin-top:18px}</style></head><body><h1>PRO-FORMA TAX INVOICE ESTIMATE &mdash; ${inv.invoiceNumber}</h1><div><b>Vendor:</b> ${inv.vendorName} &middot; <b>Date:</b> ${inv.issuedDate}</div><div class="box"><div><b>Bill To:</b> ${inv.buyerName} &mdash; ${inv.companyName}</div><div><b>Product:</b> ${inv.productName} (${inv.billingCycle})</div><div><b>Corporate GL Code:</b> ${inv.glCategory}</div><div><b>Included Capabilities:</b> ${inv.features}</div><hr><div><b>Subtotal (Ex-GST):</b> $${inv.exGstAmount.toFixed(2)} AUD</div><div><b>GST (10%):</b> $${inv.gstAmount.toFixed(2)} AUD</div><div style="font-size:20px;font-weight:900;margin-top:6px">ESTIMATED TOTAL: $${inv.totalIncGst.toFixed(2)} AUD</div><p style="font-size:12px;color:#475569;margin-top:12px">Valid as a tax invoice only when paired with a paid Stripe receipt or confirmed corporate EFT remittance.</p></div><script>window.onload=function(){window.print();}</script></body></html>`);
  w.document.close();
}

function renderPartnerKit() {
  const sel = document.getElementById('partnerChannelSelect');
  const chId = (sel && sel.value) || 'ghostwriters';
  const kit = AureliaEngine.generatePartnerKit(chId);
  lastPartnerKit = kit;
  const out = document.getElementById('partnerOut');
  if (!out) return;
  out.innerHTML =
    `<div class="card">` +
    `<div style="margin-bottom:6px"><span class="badge b-ready">${kit.commission}</span></div>` +
    `<div style="font-size:14px;margin-bottom:6px"><b>Target Partners:</b> ${kit.targetPartners}</div>` +
    `<div style="font-size:13.5px;color:#475569;margin-bottom:6px"><b>Built-In Viral Loop:</b> ${kit.viralHook}</div>` +
    `<pre style="white-space:pre-wrap;font-family:inherit;font-size:13.5px;background:#fff;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin:0 0 10px 0">${kit.dmPitch}</pre>` +
    `<div class="btn-row">` +
    `<button class="gold sm" onclick="copyText(lastPartnerKit.dmPitch, 'Partner Outbound DM Pitch')">1-Click Copy Partner DM Pitch</button>` +
    `<button class="outline sm" onclick="copyText(window.location.origin + '/?ref=partner_' + lastPartnerKit.id, '30% Partner Referral Link')">Copy Partner Referral Link</button></div></div>`;
}

async function toggleCommandItem(id) {
  const data = await postApi('/api/items/toggle', { id });
  if (data && Array.isArray(data.items)) {
    localState.items = data.items;
  } else {
    localState.items = localState.items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item));
  }
  persistWorkspace();
  showToast('Updated timeline item status.');
  await render();
}

async function deleteCommandItem(id) {
  const data = await postApi('/api/items/delete', { id });
  if (data && Array.isArray(data.items)) {
    localState.items = data.items;
  } else {
    localState.items = localState.items.filter((item) => item.id !== id);
  }
  persistWorkspace();
  showToast('Removed item from timeline.');
  await render();
}

function downloadCalendarIcs() {
  const ics = AureliaEngine.exportCalendarIcs(localState.items, 'Aurelia OS — Sovereign Brief');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'aurelia-sovereign-brief.ics';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Exported .ics calendar for Outlook, Apple Calendar & Google Calendar!');
}

function populateCtlAssetSelect(assets) {
  const select = document.getElementById('ctlAssetSelect');
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">(None — message only)</option>` + assets.map((a) =>
    `<option value="${escapeHtml(a.externalUri)}">${escapeHtml(a.title)} — ${escapeHtml(a.externalUri)}</option>`
  ).join('');
  if (current && Array.from(select.options).some((o) => o.value === current)) {
    select.value = current;
  }
}

function readCtlVault() {
  try {
    const arr = JSON.parse(localStorage.getItem(CTL_STORAGE_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function saveCtlVaultEntry(entry) {
  const arr = readCtlVault();
  arr.unshift(entry);
  try { localStorage.setItem(CTL_STORAGE_KEY, JSON.stringify(arr.slice(0, 25))); } catch (_) {}
}

function fillLatestDraftIntoCtl() {
  if (!lastVoiceBundle) return;
  const bodyEl = document.getElementById('ctlBody');
  if (bodyEl) {
    bodyEl.value = `Please review & sign off this LinkedIn draft:\n\n${lastVoiceBundle.linkedinPost}`;
    showToast('Loaded current LinkedIn draft into C.T.L. message box.');
  }
}

let lastSealedPacket = '';
let lastSealedLink = '';

async function sealCtlMessage() {
  const passphrase = (document.getElementById('ctlPassphrase') && document.getElementById('ctlPassphrase').value) || '';
  const sender = (document.getElementById('ctlSender') && document.getElementById('ctlSender').value) || 'Executive Desk';
  const recipientRole = (document.getElementById('ctlRecipient') && document.getElementById('ctlRecipient').value) || 'EA / Ghostwriter';
  const subject = (document.getElementById('ctlSubject') && document.getElementById('ctlSubject').value) || 'Interoffice Sign-Off';
  const attachmentUri = (document.getElementById('ctlAssetSelect') && document.getElementById('ctlAssetSelect').value) || '';
  const body = (document.getElementById('ctlBody') && document.getElementById('ctlBody').value) || '';
  const out = document.getElementById('ctlSealedOut');
  if (!out) return;

  try {
    const sealed = await AureliaEngine.encryptCtlMessage({
      sender,
      recipientRole,
      subject,
      attachmentUri,
      body,
      passphrase,
    });
    lastSealedPacket = sealed.packet;
    lastSealedLink = `${window.location.origin}${window.location.pathname}#ctl=${encodeURIComponent(sealed.packet)}`;
    saveCtlVaultEntry({
      id: sealed.meta.id,
      sentAt: sealed.meta.sentAt,
      senderHint: `${sealed.meta.sender} -> ${sealed.meta.recipientRole}`,
      subjectHint: sealed.meta.subject,
      packet: sealed.packet,
    });
    await postApi('/api/ctl-room', { room: 'exec-ea-default', senderHint: sealed.meta.sender, packet: sealed.packet });
    const decryptIn = document.getElementById('ctlDecryptIn');
    if (decryptIn && !decryptIn.value) decryptIn.value = sealed.packet;
    out.innerHTML =
      `<div class="card" style="background:#f0fdf4;border-color:#15803d">` +
      `<div style="font-size:13.5px;color:#166534;font-weight:900;margin-bottom:6px">&#128274; Sealed with ${escapeHtml(sealed.algorithm)} (${sealed.byteLength} chars ciphertext)</div>` +
      `<code style="display:block;max-height:72px;overflow-y:auto;margin-bottom:8px">${escapeHtml(sealed.packet)}</code>` +
      `<div class="btn-row">` +
      `<button class="gold sm" onclick="copyText(lastSealedLink, 'Zero-Server Encrypted #ctl Link')">Copy Encrypted #ctl Link</button>` +
      `<button class="outline sm" onclick="copyText(lastSealedPacket, 'CTL1 Encrypted Packet')">Copy CTL1 Packet</button></div></div>`;
    renderCtlVault();
    showToast('Encrypted C.T.L. packet sealed — zero plaintext stored!');
  } catch (err) {
    out.innerHTML = `<div class="warn" style="margin:0"><div>&#9888; ${escapeHtml(err.message || err)}</div></div>`;
  }
}

async function unlockCtlPacket() {
  const packet = (document.getElementById('ctlDecryptIn') && document.getElementById('ctlDecryptIn').value) || '';
  const passphrase = (document.getElementById('ctlPassphrase') && document.getElementById('ctlPassphrase').value) || '';
  const out = document.getElementById('ctlDecryptedOut');
  if (!out) return;
  try {
    const msg = await AureliaEngine.decryptCtlMessage(packet, passphrase);
    out.innerHTML =
      `<div class="card" style="background:#fff;border-color:#15803d;margin:0">` +
      `<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:6px">` +
      `<span class="badge b-ready">&#10004; AES-GCM Auth Verified</span>` +
      `<span style="font-size:12.5px;color:#475569">${escapeHtml(String(msg.sentAt).slice(0, 19).replace('T', ' '))} UTC</span></div>` +
      `<div style="font-size:14px"><b>From:</b> ${escapeHtml(msg.sender)} &rarr; <b>To:</b> ${escapeHtml(msg.recipientRole)}</div>` +
      `<div style="font-size:14px;margin-bottom:6px"><b>Subject:</b> ${escapeHtml(msg.subject)}</div>` +
      (msg.attachmentUri ? `<div style="font-size:13.5px;margin-bottom:6px"><b>Cloud Pointer:</b> <code>${escapeHtml(msg.attachmentUri)}</code></div>` : '') +
      `<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;background:#f8fafc;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin:0">${escapeHtml(msg.body)}</pre></div>`;
    showToast('C.T.L. packet authenticated & decrypted locally.');
  } catch (err) {
    out.innerHTML = `<div class="warn" style="margin:0"><div>&#9888; ${escapeHtml(err.message || err)}</div></div>`;
  }
}

function loadCtlVaultPacket(idx) {
  const vault = readCtlVault();
  const entry = vault[Number(idx)];
  if (!entry) return;
  const decIn = document.getElementById('ctlDecryptIn');
  if (decIn) decIn.value = entry.packet;
  showToast('Loaded encrypted packet into decrypt box — enter passphrase to unlock.');
}

function renderCtlVault() {
  const el = document.getElementById('ctlVaultList');
  if (!el) return;
  const vault = readCtlVault();
  if (!vault.length) {
    el.innerHTML = '<div style="font-size:13px;color:#475569">Encrypted Vault: 0 sealed packets on this device.</div>';
    return;
  }
  el.innerHTML =
    `<div style="font-size:13px;font-weight:900;color:#1e1b2e;margin-bottom:6px">Local Ciphertext Log (${vault.length} sealed packet${vault.length === 1 ? '' : 's'} — zero plaintext stored):</div>` +
    vault.slice(0, 4).map((v, idx) =>
      `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:7px 10px;margin-bottom:6px;font-size:13px">` +
      `<span><b>${escapeHtml(v.subjectHint || 'Sealed Packet')}</b> &middot; ${escapeHtml(v.senderHint || '')}</span>` +
      `<button class="outline sm" onclick="loadCtlVaultPacket(${idx})">Load Ciphertext</button></div>`
    ).join('');
}

function readStreakCheckIns() {
  try {
    const arr = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function logStreakToday() {
  const today = new Date().toISOString().slice(0, 10);
  const next = [...new Set([...readStreakCheckIns(), today])].sort();
  try { localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
  renderStreak();
  showToast('Logged today\'s creator upload check-in!');
}

function renderStreak() {
  const el = document.getElementById('streakBox');
  if (!el) return;
  const stats = AureliaEngine.computeCreatorStreak(readStreakCheckIns());
  el.innerHTML =
    `<div class="card" style="background:#f0fdf4;border-color:#15803d;margin:0">` +
    `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">` +
    `<div><div style="font-size:16px;font-weight:900;color:#166534">&#128293; Upload Streak: ${stats.currentStreakDays} day${stats.currentStreakDays === 1 ? '' : 's'} &middot; 7-Day Consistency: ${stats.consistencyScore}%</div>` +
    `<div style="font-size:13px;color:#166534">Published ${stats.last7Count}/4 target slots in last 7 days &middot; Best streak: ${stats.longestStreakDays}d</div></div>` +
    `<button class="gold sm" onclick="logStreakToday()">${stats.checkedInToday ? '&#10004; Logged Today' : '+ Log Today\'s Upload'}</button></div></div>`;
}

let lastMediaKit = null;

function renderMediaKit() {
  const out = document.getElementById('mediaKitOut');
  if (!out) return;
  const creatorName = (document.getElementById('mkName') && document.getElementById('mkName').value) || 'Aurelia Creator Studio';
  const niche = (document.getElementById('mkNiche') && document.getElementById('mkNiche').value) || 'Executive Leadership & 5-to-9 Creator Systems';
  const totalFollowers = Number(document.getElementById('mkFollowers') && document.getElementById('mkFollowers').value) || 24000;
  const avgReelViews = Number(document.getElementById('mkViews') && document.getElementById('mkViews').value) || 11500;
  lastMediaKit = AureliaEngine.generateCreatorMediaKit({ creatorName, niche, totalFollowers, avgReelViews });
  out.innerHTML =
    `<div style="font-size:14px;background:#fff;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:8px">` +
    `<div><b>1x Hero Vertical Video (45–60s):</b> <span style="color:#15803d">$${lastMediaKit.singleReelAud} AUD</span></div>` +
    `<div><b>3-Part Conversion Bundle:</b> <span style="color:#15803d">$${lastMediaKit.threePartBundleAud} AUD</span></div>` +
    `<div><b>30-Day Paid Usage / Whitelisting:</b> +$${lastMediaKit.whitelisting30dAud} AUD</div></div>` +
    `<div class="btn-row">` +
    `<button class="gold sm" onclick="copyText(lastMediaKit.markdown, 'Sponsor Rate Card')">Copy Rate Card</button>` +
    `<button class="outline sm" onclick="downloadMediaKitMd()">Download Media Kit .md</button></div>`;
}

function downloadMediaKitMd() {
  if (!lastMediaKit) renderMediaKit();
  const url = URL.createObjectURL(new Blob([lastMediaKit.markdown], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'glowgrid-media-kit.md';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Downloaded GlowGrid Sponsor Media Kit (.md)!');
}

function exportWorkspaceJson() {
  const bundle = AureliaEngine.exportWorkspaceBundle({
    workspace: localState,
    trial: readTrial(),
    drafts: readDraftHistory(),
    streakCheckIns: readStreakCheckIns(),
    ctlVault: readCtlVault(),
  });
  const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `aurelia-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Downloaded full Aurelia OS workspace backup (.json).');
}

function importWorkspaceJson(fileInput) {
  const file = fileInput && fileInput.files && fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const valid = AureliaEngine.validateWorkspaceBundle(String(reader.result || ''));
      localState = valid.workspace;
      persistWorkspace();
      if (valid.trial) localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(valid.trial));
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(valid.drafts));
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(valid.streakCheckIns));
      localStorage.setItem(CTL_STORAGE_KEY, JSON.stringify(valid.ctlVault));
      restoreLatestDraft();
      showToast('Workspace backup restored on this device!');
      await render();
    } catch (err) {
      showToast('Backup import failed: ' + (err.message || err));
    } finally {
      fileInput.value = '';
    }
  };
  reader.readAsText(file);
}

function loadCtlFromHash() {
  const h = String(window.location.hash || '');
  if (!h.startsWith('#ctl=')) return;
  try {
    const packet = decodeURIComponent(h.slice(5));
    const decIn = document.getElementById('ctlDecryptIn');
    if (decIn && packet.startsWith('CTL1.')) {
      decIn.value = packet;
      const panel = document.getElementById('ctlPanel');
      if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth' });
      showToast('Encrypted #ctl packet loaded — enter shared passphrase to unlock.');
    }
  } catch (_) {}
}
window.addEventListener('hashchange', loadCtlFromHash);

window.setMode = setMode;
window.cascade = cascade;
window.resetDemo = resetDemo;
window.clearAllUserData = clearAllUserData;
window.addAssetPointer = addAssetPointer;
window.addCommandItem = addCommandItem;
window.toggleCommandItem = toggleCommandItem;
window.deleteCommandItem = deleteCommandItem;
window.downloadCalendarIcs = downloadCalendarIcs;
window.sealCtlMessage = sealCtlMessage;
window.unlockCtlPacket = unlockCtlPacket;
window.fillLatestDraftIntoCtl = fillLatestDraftIntoCtl;
window.loadCtlVaultPacket = loadCtlVaultPacket;
window.logStreakToday = logStreakToday;
window.renderMediaKit = renderMediaKit;
window.downloadMediaKitMd = downloadMediaKitMd;
window.exportWorkspaceJson = exportWorkspaceJson;
window.importWorkspaceJson = importWorkspaceJson;
window.startTrial = startTrial;
window.runVoice = runVoice;
window.selectVoiceVariant = selectVoiceVariant;
window.updateVoicePart = updateVoicePart;
window.downloadVoiceDraft = downloadVoiceDraft;
window.copyVoicePart = copyVoicePart;
window.copyText = copyText;
window.openHandoff = openHandoff;
window.closeHandoffModal = closeHandoffModal;
window.installAppPrompt = installAppPrompt;
window.toggleVoiceDictation = toggleVoiceDictation;
window.renderInvoice = renderInvoice;
window.launchCheckout = launchCheckout;
window.printCorporateInvoice = printCorporateInvoice;
window.renderPartnerKit = renderPartnerKit;

(function initFromUrl() {
  restoreLatestDraft();
  try {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    if (urlMode && MODE_META[urlMode]) {
      const btn = document.querySelector(`.tab[data-mode="${urlMode}"]`);
      setMode(urlMode, btn);
    } else {
      render();
    }
  } catch (_) {
    render();
  }
  renderInvoice();
  renderPartnerKit();
  loadCtlFromHash();
})();
