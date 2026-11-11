let mode = 'all';
function setMode(m, btn) {
  mode = m;
  document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  load();
}
async function load() {
  const r = await (await fetch('/api/state')).json();
  document.getElementById('metrics').innerHTML =
    '&#10004; Raw Cloud Media Indexed: <b>' + r.metrics.rawMbSaved + ' MB</b> &middot; Pointer Sync: <b>' + r.metrics.pointerKbUsed + ' KB</b> &middot; Video Egress: <b>$0.00 (94% Margin)</b>';
  const cb = document.getElementById('collisionBox');
  cb.innerHTML = r.collisions.length
    ? r.collisions.map((c) => `<div class="warn">&#9888; LIFE-WORK COLLISION (${c.gapMinutes} min apart): <b>${c.titleA}</b> vs <b>${c.titleB}</b> &rarr; ${c.resolution} &nbsp;<button class="gold" onclick="cascade()">1-Tap Cascade Reschedule (+24h)</button></div>`).join('')
    : '<div class="card" style="border-color:#15803d;color:#15803d">&#10004; Zero Schedule Collisions — Executive Reports, Upload Windows &amp; Personal Boundaries Aligned.</div>';
  const items = r.items.filter((i) => mode === 'all' || (mode === 'velvet' && i.domain === 'creator') || (mode === 'sovereign' && i.domain !== 'creator') || (mode === 'glowgrid' && i.domain === 'creator'));
  document.getElementById('timeline').innerHTML = items.map((i) => `<div class="card"><span class="badge b-${i.domain}">${i.domain}</span><span class="badge">${i.energyProfile}</span><br><b style="font-size:20px">${i.title}</b><br><span style="color:#475569">${i.channel} &middot; Due: ${i.dueAt.slice(0, 16).replace('T', ' ')} UTC ${i.isHardDeadline ? '(HARD DEADLINE)' : '(Flexible)'}</span><div class="rem">${i.reminders.map((m) => '&bull; <b>' + m.stage + ':</b> ' + m.label).join('<br>')}</div></div>`).join('');
  document.getElementById('assets').innerHTML = r.assets.map((a) => `<div class="card"><span class="badge b-${a.provider}">${a.providerLabel}</span><span class="badge">${a.osOrigin}</span><br><b style="font-size:19px">${a.title}</b><br><span style="color:#475569">URI: <code>${a.externalUri}</code> &middot; Raw: ${a.rawSizeMb} MB (Pointer: ${a.pointerKb} KB)</span></div>`).join('');
}
async function cascade() {
  await fetch('/api/cascade', { method: 'POST' });
  load();
}
async function runVoice() {
  const transcript = document.getElementById('voiceIn').value;
  const r = await (await fetch('/api/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript, proofAsset: 'Q3 Board Financial Pack.xlsx (OneDrive)' }) })).json();
  document.getElementById('voiceOut').innerHTML = `<div class="card"><b>LinkedIn Authority Post:</b><pre style="white-space:pre-wrap;font-family:inherit;font-size:17px">${r.linkedinPost}</pre><b>Carousel Brief:</b><br>${r.carouselSlides.join('<br>')}<br><br><b>Short-Form Video Hook:</b> ${r.shortVideoHook}</div>`;
}
load();
runVoice();
