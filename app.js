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
  const data = await postApi('/api/cascade');
  if (data && Array.isArray(data.items)) {
    localState.items = data.items;
    showToast('Cascaded flexible creator uploads +24h — Hard deadlines protected!');
    await render();
    return;
  }
  const r = AureliaEngine.cascadeReschedule(localState.items, 24);
  localState.items = r.items;
  showToast(`Cascaded ${r.shiftedCount} flexible item(s) +24h!`);
  await render();
}

async function resetDemo() {
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
    showToast(`Indexed ${payload.rawSizeMb} MB cloud asset with 12 KB pointer ($0.00 egress)!`);
    await render();
    return;
  }

  const pointer = AureliaEngine.createCloudPointer(payload);
  localState.assets.unshift(pointer);
  showToast(`Indexed ${pointer.rawSizeMb} MB cloud asset with 12 KB pointer ($0.00 egress)!`);
  await render();
}
async function runVoice() {
  const transcript = (document.getElementById('voiceIn') && document.getElementById('voiceIn').value) || '';
  const select = document.getElementById('proofAssetSelect');
  const proofAsset = (select && select.value) || 'Q3 Board Financial Pack.xlsx (Windows / ONEDRIVE)';

  let bundle = await postApi('/api/voice', { transcript, proofAsset });

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
      'Between our 9 AM board review on Windows OneDrive and my 11 AM client keynote, here is the #1 operational shift that lifted our net margin to 94%: we stopped moving raw files across clouds and unified our executive and authority rhythm.';
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
    `<b>TAX INVOICE: ${inv.invoiceNumber}</b><span>Issued: ${inv.issuedDate} &middot; ${inv.vendorName}</span></div>` +
    `<div style="font-size:14px;margin-bottom:6px"><b>Bill To:</b> ${inv.buyerName} (${inv.companyName})</div>` +
    `<div style="font-size:14px;margin-bottom:6px"><b>Subscription:</b> ${inv.productName}</div>` +
    `<div style="font-size:13px;color:#475569;margin-bottom:8px"><b>Recommended Corporate GL Category:</b> <code>${inv.glCategory}</code></div>` +
    `<div style="font-size:15px;background:#fff;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:10px">` +
    `Ex-GST: <b>$${inv.exGstAmount.toFixed(2)}</b> &nbsp;|&nbsp; GST (10%): <b>$${inv.gstAmount.toFixed(2)}</b> &nbsp;|&nbsp; Total Paid/Due: <b style="color:#15803d">$${inv.totalIncGst.toFixed(2)} AUD</b></div>` +
    `<div style="font-size:13px;background:#f8fafc;padding:8px 10px;border:1px dashed #94a3b8;border-radius:6px;margin-bottom:10px">` +
    `<b>Direct B2B EFT / Remittance:</b> ${session.eftBankDetails.accountName} &middot; BSB <code>${session.eftBankDetails.bsb}</code> &middot; Acc <code>${session.eftBankDetails.accountNumber}</code> &middot; Ref: <code>${session.eftBankDetails.reference}</code></div>` +
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
  w.document.write(`<!DOCTYPE html><html><head><title>Tax Invoice ${inv.invoiceNumber}</title><style>body{font-family:'Segoe UI',sans-serif;padding:32px;color:#18181b;line-height:1.5}h1{margin:0;color:#1e1b2e}.box{border:2px solid #1e1b2e;border-radius:10px;padding:20px;margin-top:18px}</style></head><body><h1>TAX INVOICE &mdash; ${inv.invoiceNumber}</h1><div><b>Vendor:</b> ${inv.vendorName} &middot; <b>Date:</b> ${inv.issuedDate}</div><div class="box"><div><b>Bill To:</b> ${inv.buyerName} &mdash; ${inv.companyName}</div><div><b>Product:</b> ${inv.productName} (${inv.billingCycle})</div><div><b>Corporate GL Code:</b> ${inv.glCategory}</div><div><b>Included Capabilities:</b> ${inv.features}</div><hr><div><b>Subtotal (Ex-GST):</b> $${inv.exGstAmount.toFixed(2)} AUD</div><div><b>GST (10%):</b> $${inv.gstAmount.toFixed(2)} AUD</div><div style="font-size:20px;font-weight:900;margin-top:6px">TOTAL: $${inv.totalIncGst.toFixed(2)} AUD</div></div><script>window.onload=function(){window.print();}</script></body></html>`);
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

window.setMode = setMode;
window.cascade = cascade;
window.resetDemo = resetDemo;
window.addAssetPointer = addAssetPointer;
window.runVoice = runVoice;
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
})();
