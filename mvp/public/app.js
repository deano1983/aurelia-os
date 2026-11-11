/* global AureliaEngine */
'use strict';

let mode = 'all';
let localState = AureliaEngine.getInitialDemoState();
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
  try {
    const res = await fetch('/api/state', { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.assets) && Array.isArray(data.items)) {
        serverOnline = true;
        localState = { assets: data.assets, items: data.items };
        return computeClientPayload(localState);
      }
    }
  } catch (_) {
    serverOnline = false;
  }
  return computeClientPayload(localState);
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
async function render() {
  const r = await fetchState();
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
    `<div class="kpi"><div class="kpi-label">Server Video Egress</div><div class="kpi-val" style="color:#15803d">$0.00 (94% GM)</div></div>` +
    `<div class="kpi"><div class="kpi-label">Executive Dossier Readiness</div><div class="kpi-val">${boardDossier.score}% (${boardDossier.status.replace('_', ' ')})</div></div>`;

  document.getElementById('metrics').innerHTML =
    `&#10004; Raw Cloud Media Indexed: <b>${r.metrics.rawMbSaved} MB</b> &middot; Pointer Sync: <b>${r.metrics.pointerKbUsed} KB</b> &middot; Video Egress: <b>$0.00 (94% Gross Margin)</b>`;

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

  document.getElementById('timelineCountBadge').textContent = `${items.length} Active`;

  document.getElementById('timeline').innerHTML = items.map((i) => {
    const dossier = r.dossiers[i.id] || AureliaEngine.scoreDossierReadiness(i, r.assets, r.items);
    const readinessBadge = dossier.status === 'BOARD_READY'
      ? `<span class="badge b-ready">Readiness: ${dossier.score}% READY</span>`
      : `<span class="badge b-action">Readiness: ${dossier.score}% (${dossier.status.replace('_', ' ')})</span>`;

    const handoffButtons = i.domain === 'creator'
      ? `<button class="gold sm" onclick="openHandoff('${i.id}','ig_reels')">&#128241; 1-Tap IG Reels Handoff</button>` +
        `<button class="outline sm" onclick="openHandoff('${i.id}','tiktok')">TikTok Handoff</button>` +
        `<button class="outline sm" onclick="openHandoff('${i.id}','linkedin')">LinkedIn Handoff</button>`
      : `<button class="gold sm" onclick="openHandoff('${i.id}','board_deck')">&#128193; 1-Tap Executive Dossier Sign-Off</button>`;

    return `<div class="card">` +
      `<div><span class="badge b-${i.domain}">${i.domain}</span><span class="badge">${i.energyProfile}</span>${readinessBadge}${i.cascaded ? '<span class="badge b-ready">+24h Cascaded</span>' : ''}</div>` +
      `<div style="font-size:18px;font-weight:900;margin-top:4px;color:#1e1b2e">${i.title}</div>` +
      `<div style="color:#475569;font-size:14px">${i.channel} &middot; Due: <b>${i.dueAt.slice(0, 16).replace('T', ' ')} UTC</b> ${i.isHardDeadline ? '<span style="color:#b91c1c">(HARD DEADLINE LOCKED)</span>' : '<span style="color:#0369a1">(Flexible Creator Slot)</span>'}</div>` +
      (i.captionOrBrief ? `<div style="font-size:14px;color:#1e293b;margin-top:4px">Brief: ${i.captionOrBrief}</div>` : '') +
      `<div class="rem">${i.reminders.map((m) => `<div style="margin-bottom:3px"><span class="rem-stage">${m.stage}</span> ${m.label}</div>`).join('')}</div>` +
      `<div class="btn-row">${handoffButtons}</div></div>`;
  }).join('');

  document.getElementById('assets').innerHTML = r.assets.map((a) =>
    `<div class="card"><span class="badge b-${a.provider}">${a.providerLabel}</span><span class="badge">${a.osOrigin}</span><span class="badge b-${a.domain}">${a.domain}</span><br>` +
    `<b style="font-size:17px">${a.title}</b><br>` +
    `<span style="color:#475569;font-size:14px">Deep-Link URI: <code>${a.externalUri}</code> &middot; Raw Size: <b>${a.rawSizeMb} MB</b> (Pointer: ${a.pointerKb} KB &middot; Egress: $0.00)</span>` +
    `<div class="btn-row"><button class="outline sm" onclick="copyText('${a.externalUri.replace(/'/g, "\\'")}', 'Cloud Deep-Link URI')">Copy Cloud URI</button></div></div>`
  ).join('');

  populateProofSelect(r.assets);
  if (!lastVoiceBundle) runVoice();
}
async function cascade() {
  try {
    const res = await fetch('/api/cascade', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        localState.items = data.items;
        showToast('Cascaded flexible creator uploads +24h — Hard deadlines protected!');
        await render();
        return;
      }
    }
  } catch (_) {}
  const r = AureliaEngine.cascadeReschedule(localState.items, 24);
  localState.items = r.items;
  showToast(`Cascaded ${r.shiftedCount} flexible item(s) +24h!`);
  await render();
}

async function resetDemo() {
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        localState = { assets: data.assets, items: data.items };
        showToast('Demo state reset!');
        await render();
        return;
      }
    }
  } catch (_) {}
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

  try {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.assets)) localState.assets = data.assets;
      else if (data && data.id) localState.assets.unshift(data);
      showToast(`Indexed ${payload.rawSizeMb} MB cloud asset with 12 KB pointer ($0.00 egress)!`);
      await render();
      return;
    }
  } catch (_) {}

  const pointer = AureliaEngine.createCloudPointer(payload);
  localState.assets.unshift(pointer);
  showToast(`Indexed ${pointer.rawSizeMb} MB cloud asset with 12 KB pointer ($0.00 egress)!`);
  await render();
}
async function runVoice() {
  const transcript = (document.getElementById('voiceIn') && document.getElementById('voiceIn').value) || '';
  const select = document.getElementById('proofAssetSelect');
  const proofAsset = (select && select.value) || 'Q3 Board Financial Pack.xlsx (Windows / ONEDRIVE)';

  let bundle = null;
  try {
    const res = await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, proofAsset }),
    });
    if (res.ok) bundle = await res.json();
  } catch (_) {}

  if (!bundle || !bundle.linkedinPost) {
    bundle = AureliaEngine.voiceToAuthority(transcript, proofAsset);
  }
  lastVoiceBundle = bundle;

  document.getElementById('voiceOut').innerHTML =
    `<div class="card">` +
    `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">` +
    `<b>1. LinkedIn Executive Authority Post:</b>` +
    `<button class="gold sm" onclick="copyVoicePart('post')">1-Click Copy LinkedIn Post</button></div>` +
    `<pre style="white-space:pre-wrap;font-family:inherit;font-size:15px;background:#fff;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin:8px 0">${bundle.linkedinPost}</pre>` +
    `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:10px">` +
    `<b>2. 4-Slide Authority Carousel Brief:</b>` +
    `<button class="outline sm" onclick="copyVoicePart('carousel')">1-Click Copy 4-Slide Brief</button></div>` +
    `<div style="background:#fff;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin:8px 0;font-size:14.5px">${bundle.carouselSlides.map((s) => '&bull; ' + s).join('<br>')}</div>` +
    `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:10px">` +
    `<b>3. Short-Form Vertical Video Hook (IG Reels / TikTok / Shorts):</b>` +
    `<button class="outline sm" onclick="copyVoicePart('hook')">1-Click Copy Video Hook</button></div>` +
    `<div style="background:#fff;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin-top:8px;font-size:14.5px">${bundle.shortVideoHook}</div></div>`;
}

function copyVoicePart(part) {
  if (!lastVoiceBundle) return;
  if (part === 'post') copyText(lastVoiceBundle.linkedinPost, 'LinkedIn Authority Post');
  if (part === 'carousel') copyText(lastVoiceBundle.carouselSlides.join('\n'), '4-Slide Carousel Brief');
  if (part === 'hook') copyText(lastVoiceBundle.shortVideoHook, 'Short-Form Video Hook');
}

let activeHandoffPayload = '';
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

window.setMode = setMode;
window.cascade = cascade;
window.resetDemo = resetDemo;
window.addAssetPointer = addAssetPointer;
window.runVoice = runVoice;
window.copyVoicePart = copyVoicePart;
window.copyText = copyText;
window.openHandoff = openHandoff;
window.closeHandoffModal = closeHandoffModal;

render();
