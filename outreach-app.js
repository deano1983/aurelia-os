/* global AureliaOutreach, AURELIA_100_CLIENTS */
'use strict';

const ENGINE = window.AureliaOutreach;
const TARGETS = window.AURELIA_100_CLIENTS || [];
const STORAGE_KEY = 'aurelia.outreach.pipeline.v1';
const PREFS_KEY = 'aurelia.outreach.prefs.v1';
const CONTACTED = new Set(['dm_sent', 'follow_up_1', 'follow_up_2', 'replied', 'demo_booked', 'trial', 'paid']);

const sequenceCache = new Map();
let pipeline = loadJson(STORAGE_KEY, {});
let prefs = Object.assign({ quota: 35, startDate: '2026-11-11', day: '1' }, loadJson(PREFS_KEY, {}));
let plan = ENGINE.planCampaign(TARGETS, { dailyQuota: prefs.quota, startDate: prefs.startDate });

function loadJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pipeline));
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (_) {
    showToast('Browser storage is unavailable — progress will not persist.');
  }
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { el.style.display = 'none'; }, 2400);
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => showToast('Copied to clipboard'),
      () => legacyCopy(text)
    );
  } else {
    legacyCopy(text);
  }
}

function legacyCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  document.body.appendChild(area);
  area.select();
  try { document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(area);
  showToast('Copied to clipboard');
}

function recordFor(id) {
  return Object.assign(ENGINE.blankRecord(), pipeline[id] || {});
}

function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function nudge(id, status) {
  const record = recordFor(id);
  record.status = status;
  record.lastTouch = new Date().toISOString();
  pipeline[id] = record;
  saveState();
}

function markSent(id) {
  const current = recordFor(id).status;
  nudge(id, current === 'not_contacted' ? 'dm_sent' : ENGINE.advanceStatus(current));
  const card = document.getElementById('card-' + id);
  if (card) {
    const next = recordFor(id).status;
    card.classList.toggle('done', CONTACTED.has(next) && next !== 'paid');
    card.classList.toggle('paid', next === 'paid');
    const badge = card.querySelector('.badge.status');
    if (badge) badge.textContent = ENGINE.STATUS_META[next].label;
    const select = card.querySelector('select.status-select');
    if (select) select.value = next;
    const button = card.querySelector('button.advance');
    if (button) button.textContent = next === 'paid' ? 'Paid ✓' : 'Advance stage →';
  }
  renderKpis();
  renderBatch();
  showToast('Moved to ' + ENGINE.STATUS_META[recordFor(id).status].label);
}

function setStatus(id, status) {
  if (!ENGINE.STATUS_META[status]) return;
  nudge(id, status);
  const card = document.getElementById('card-' + id);
  if (card) {
    card.classList.toggle('done', CONTACTED.has(status) && status !== 'paid');
    card.classList.toggle('paid', status === 'paid');
    const badge = card.querySelector('.badge.status');
    if (badge) badge.textContent = ENGINE.STATUS_META[status].label;
  }
  renderKpis();
  renderBatch();
}

function sequenceFor(row) {
  if (!sequenceCache.has(row.id)) sequenceCache.set(row.id, ENGINE.buildOutreachSequence(row.target));
  return sequenceCache.get(row.id);
}

function copyMsg(id, key, button) {
  const row = plan.find((entry) => entry.id === id);
  if (!row) return;
  const message = sequenceFor(row).messages[key];
  if (!message) return;
  const text = message.subject ? `Subject: ${message.subject}\n\n${message.body}` : message.body;
  copyText(text);
  if (button) {
    const original = button.textContent;
    button.textContent = 'Copied ✓';
    window.setTimeout(() => { button.textContent = original; }, 1600);
  }
}

function onToggle(element) {
  if (!element.open) return;
  const body = element.querySelector('.msgs');
  if (!body || body.dataset.filled === '1') return;
  const row = plan.find((entry) => entry.id === Number(element.dataset.id));
  if (!row) return;
  const messages = sequenceFor(row).messages;
  body.innerHTML = Object.keys(messages)
    .map((key) => {
      const message = messages[key];
      const count = ENGINE.toCharCount(message);
      const over = message.limit && count > message.limit;
      return [
        '<div class="msg">',
        '<div class="msg-head">',
        `<span class="msg-title">${esc(message.label)}</span>`,
        `<span class="count${over ? ' over' : ''}">${count}${message.limit ? ' / ' + message.limit : ''} chars</span>`,
        `<button class="sm" onclick="copyMsg(${row.id}, '${key}', this)">Copy</button>`,
        '</div>',
        message.subject ? `<div class="msg-body"><b>Subject:</b> ${esc(message.subject)}</div>` : '',
        `<div class="msg-body">${esc(message.body)}</div>`,
        '</div>',
      ].join('');
    })
    .join('');
  body.dataset.filled = '1';
}

function renderKpis() {
  const records = plan.map((row) => ({ status: recordFor(row.id).status, mode: row.mode }));
  const sentToday = plan.filter((row) => {
    const record = recordFor(row.id);
    return record.lastTouch && String(record.lastTouch).slice(0, 10) === todayIso() && CONTACTED.has(record.status);
  }).length;
  const metrics = ENGINE.pipelineMetrics(records, {
    contactedToday: sentToday,
    dailyQuota: Number(prefs.quota),
  });
  const tiles = [
    ['Targets', metrics.total, '4 product doors, 10 cohorts'],
    ['Touches today', `${sentToday} / ${prefs.quota}`, `${metrics.quotaRemaining} left in today's quota`],
    ['Contacted', metrics.contacted, 'first touch or later'],
    ['Replies', metrics.replies, `${metrics.replyRate}% reply rate`],
    ['Demos', metrics.demos, `${metrics.demoRate}% of contacted`],
    ['Paid', metrics.paid, `${metrics.closeRate}% close rate`],
    ['Closed MRR', `A$${metrics.mrr}`, 'at $99 / $39 / $29 / $149'],
    ['Weighted pipeline', `A$${metrics.weightedMrr}`, 'stage-probability weighted'],
  ];
  document.getElementById('kpis').innerHTML = tiles
    .map(
      ([label, value, hint]) =>
        `<div class="kpi"><div class="lbl">${esc(label)}</div><div class="val">${esc(value)}</div><div class="hint">${esc(hint)}</div></div>`
    )
    .join('');
}

function batchRows() {
  const day = document.getElementById('day').value;
  if (day === 'all') return plan;
  return ENGINE.dailyBatch(plan, Number(day));
}

function renderBatch() {
  const rows = batchRows();
  const sent = rows.filter((row) => CONTACTED.has(recordFor(row.id).status)).length;
  const day = document.getElementById('day').value;
  const label = day === 'all'
    ? `Full sprint — ${plan.length} targets`
    : `Day ${day} batch — ${rows.length} targets`;
  document.getElementById('batchLabel').textContent = label;
  document.getElementById('batchCount').textContent = `${sent} / ${rows.length} sent`;
  const pct = rows.length ? Math.min(100, Math.round((sent / rows.length) * 100)) : 0;
  const bar = document.getElementById('batchBar');
  bar.style.width = pct + '%';
  bar.parentElement.title = `${pct}% of the selected batch is in play (quota ${prefs.quota}/day)`;
}

function statusOptions(selected) {
  return ENGINE.STATUS_FLOW.map(
    (status) =>
      `<option value="${status}"${status === selected ? ' selected' : ''}>${esc(ENGINE.STATUS_META[status].label)}</option>`
  ).join('');
}

function cardHtml(row) {
  const record = recordFor(row.id);
  const status = ENGINE.STATUS_META[record.status] ? record.status : 'not_contacted';
  const target = row.target;
  const mode = ENGINE.PRODUCT_MODES[row.mode];
  const classes = ['card'];
  if (CONTACTED.has(status) && status !== 'paid') classes.push('done');
  if (status === 'paid') classes.push('paid');
  return [
    `<div class="${classes.join(' ')}" id="card-${row.id}">`,
    '<div>',
    `<span class="badge">#${esc(row.id)}</span>`,
    `<span class="badge day">Day ${esc(row.day)} · ${esc(row.scheduledDate)}</span>`,
    `<span class="badge mode">${esc(mode.label)}</span>`,
    `<span class="badge status">${esc(ENGINE.STATUS_META[status].label)}</span>`,
    `<div class="org">${esc(target.Organization_or_Leader)}</div>`,
    `<div class="meta">${esc(target.Location)} · ${esc(target.Deal_Type)}</div>`,
    `<div class="fit">${esc(target.Why_High_Fit)}</div>`,
    '</div>',
    '<div class="row">',
    `<button class="gold sm advance" onclick="markSent(${row.id})">${status === 'paid' ? 'Paid ✓' : 'Mark sent / advance →'}</button>`,
    `<select class="status-select" onchange="setStatus(${row.id}, this.value)">${statusOptions(status)}</select>`,
    `<a class="badge" style="background:#e0f2fe;color:#0369a1;text-decoration:none" href="${esc(target.Website_or_Channel)}" target="_blank" rel="noopener">Channel →</a>`,
    '</div>',
    `<details data-id="${row.id}" ontoggle="onToggle(this)"><summary>Message pack — DM, 300-char note, voice script, follow-ups, email</summary><div class="msgs"></div></details>`,
    '</div>',
  ].join('');
}

function filteredRows() {
  const query = document.getElementById('q').value.trim().toLowerCase();
  const product = document.getElementById('prod').value;
  const status = document.getElementById('status').value;
  const day = document.getElementById('day').value;
  return plan.filter((row) => {
    if (day !== 'all' && String(row.day) !== day) return false;
    if (product && row.mode !== product) return false;
    if (status && recordFor(row.id).status !== status) return false;
    if (query && !JSON.stringify(row.target).toLowerCase().includes(query)) return false;
    return true;
  });
}

function render() {
  const rows = filteredRows();
  const list = document.getElementById('list');
  if (!rows.length) {
    list.innerHTML = '<div class="panel"><h2>No targets match these filters</h2><div>Clear the search or product filter to see the rest of the sprint.</div></div>';
  } else {
    list.innerHTML = rows.map(cardHtml).join('');
  }
  renderBatch();
  renderKpis();
}


function initDayOptions() {
  const select = document.getElementById('day');
  const maxDay = plan.reduce((max, row) => Math.max(max, row.day), 1);
  const options = [];
  for (let day = 1; day <= maxDay; day += 1) {
    const rows = ENGINE.dailyBatch(plan, day);
    options.push(
      `<option value="${day}">Day ${day} — ${rows[0] ? rows[0].scheduledDate : ''} (${rows.length} targets)</option>`
    );
  }
  options.push(`<option value="all">All ${maxDay} days (${plan.length} targets)</option>`);
  select.innerHTML = options.join('');
  select.value = prefs.day === 'all' || Number(prefs.day) <= maxDay ? prefs.day : '1';
  prefs.day = select.value;
}

function initStatusOptions() {
  document.getElementById('status').innerHTML =
    '<option value="">All stages</option>' +
    ENGINE.STATUS_FLOW.map(
      (status) => `<option value="${status}">${esc(ENGINE.STATUS_META[status].label)}</option>`
    ).join('');
}

function onQuotaChange() {
  const input = document.getElementById('quota');
  const quota = Math.min(200, Math.max(1, Math.round(Number(input.value) || 35)));
  input.value = quota;
  prefs.quota = quota;
  prefs.day = '1';
  plan = ENGINE.planCampaign(TARGETS, { dailyQuota: quota, startDate: prefs.startDate });
  sequenceCache.clear();
  saveState();
  initDayOptions();
  render();
  showToast(`Quota set to ${quota} DMs/day — ${plan[plan.length - 1].day} sprint days`);
}

function exportCsv() {
  const rows = plan.map((row) => {
    const record = recordFor(row.id);
    return Object.assign({}, row.target, {
      day: row.day,
      scheduledDate: row.scheduledDate,
      mode: row.mode,
      status: record.status,
      lastTouch: record.lastTouch || '',
      note: record.note || '',
    });
  });
  const blob = new Blob([ENGINE.toPipelineCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `aurelia-outreach-pipeline-${todayIso()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Exported ${rows.length}-target pipeline CSV`);
}

function copyBatchSummary() {
  const rows = batchRows();
  const counts = rows.reduce((acc, row) => {
    acc[row.mode] = (acc[row.mode] || 0) + 1;
    return acc;
  }, {});
  const mix = Object.keys(counts)
    .map((mode) => `${ENGINE.PRODUCT_MODES[mode].label} ${counts[mode]}`)
    .join(' · ');
  const lines = rows.map((row, index) => {
    const record = recordFor(row.id);
    return `${index + 1}. ${row.target.Organization_or_Leader} — ${ENGINE.STATUS_META[record.status].label}`;
  });
  const day = document.getElementById('day').value;
  const header = day === 'all'
    ? `Aurelia OS outreach — full sprint (${rows.length} targets)`
    : `Aurelia OS outreach — Day ${day} batch (${rows.length} targets, ${rows[0] ? rows[0].scheduledDate : ''})`;
  copyText([header, `Product mix: ${mix}`, '', ...lines].join('\n'));
}

function resetPipeline() {
  if (!window.confirm('Reset all outreach progress stored in this browser?')) return;
  pipeline = {};
  saveState();
  render();
  showToast('Pipeline reset');
}

function boot() {
  const list = document.getElementById('list');
  if (!ENGINE) {
    list.innerHTML = '<div class="panel"><h2>Engine failed to load</h2><div>outreach-engine.js did not initialise.</div></div>';
    return;
  }
  if (!TARGETS.length) {
    list.innerHTML = '<div class="panel"><h2>Target list failed to load</h2><div>clients-data.js did not initialise.</div></div>';
    return;
  }
  document.getElementById('quota').value = prefs.quota;
  initStatusOptions();
  initDayOptions();
  render();
  document.getElementById('day').addEventListener('change', () => {
    prefs.day = document.getElementById('day').value;
    saveState();
    renderBatch();
  });
  focusFromQuery();
}

// Deep link straight to one target's message pack: outreach.html?target=42
function focusFromQuery() {
  const focus = Number(new URLSearchParams(window.location.search).get('target'));
  if (!focus) return;
  const row = plan.find((entry) => entry.id === focus);
  if (!row) return;
  prefs.day = String(row.day);
  document.getElementById('day').value = prefs.day;
  document.getElementById('q').value = row.target.Organization_or_Leader;
  render();
  const details = document.querySelector(`details[data-id="${focus}"]`);
  if (details) {
    details.open = true;
    onToggle(details);
  }
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

