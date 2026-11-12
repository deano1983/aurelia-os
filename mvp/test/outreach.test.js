'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const outreach = require('../lib/outreach');

const DATA_PATH = path.join(__dirname, '..', 'public', 'clients-data.js');
const raw = fs.readFileSync(DATA_PATH, 'utf8');
const TARGETS = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));

test('Outreach target list is intact: 100 records with hooks and product routing', () => {
  assert.equal(TARGETS.length, 100);
  const modes = new Set();
  for (const target of TARGETS) {
    const mode = outreach.resolveProductMode(target.Target_Product);
    assert.ok(outreach.PRODUCT_MODES[mode], `unknown mode for #${target.ID}`);
    assert.ok(String(target.Outreach_Hook).length > 40, `#${target.ID} has no usable hook`);
    modes.add(mode);
  }
  assert.deepEqual([...modes].sort(), ['aurelia', 'glowgrid', 'sovereign', 'velvet']);
  // Earliest named product wins when a record spans two doors.
  assert.equal(outreach.resolveProductMode('Sovereign Brief ($399/yr) & Velvet Cadence'), 'sovereign');
  assert.equal(outreach.resolveProductMode('Velvet Cadence & GlowGrid Studio ($29/mo)'), 'velvet');
  assert.equal(outreach.resolveProductMode('GlowGrid Studio ($29/mo) & Velvet Cadence'), 'glowgrid');
  assert.equal(outreach.resolveProductMode('Aurelia OS Suite & Sovereign Brief ($399/yr)'), 'aurelia');
  assert.equal(outreach.resolveProductMode(''), 'velvet');
});

test('Greeting resolver only greets real people and never a brand name', () => {
  const cases = [
    ['Pure Public Relations (Phoebe Netto — Founder & Managing Director)', 'Phoebe'],
    ['Jane Anderson (Women With Influence & Grow With Influence)', 'Jane'],
    ['Sue Ellson (Author of 120 Ways)', 'Sue'],
    ['Column Content Limited (Dr. Mo Shehu - Founder)', 'Mo'],
    ['Ellevate Network (Kristy Wallace — CEO)', 'Kristy'],
    ['Cherie Blair Foundation for Women', 'Cherie'],
  ];
  for (const [org, expected] of cases) {
    assert.equal(outreach.greetingFor({ Organization_or_Leader: org }), expected, org);
  }
  const generic = [
    'Pavilion — Women’s Executive & GTM Community',
    'Double (Tech-Enabled Executive Assistants)',
    'Time Etc (Virtual Assistants for Founders)',
    'Shameless Media Community',
    'Athena Alliance (Board & C-Suite Community)',
  ];
  for (const org of generic) {
    assert.equal(outreach.greetingFor({ Organization_or_Leader: org }), 'there', org);
  }
});

test('LinkedIn connection notes stay inside the 300-character request limit', () => {
  for (const target of TARGETS) {
    const note = outreach.connectionNote(target, outreach.resolveProductMode(target.Target_Product));
    assert.ok(note.length <= outreach.CONNECTION_NOTE_LIMIT, `#${target.ID} note is ${note.length} chars`);
    assert.ok(note.startsWith('Hi '), `#${target.ID} note must open with a greeting`);
    assert.ok(note.includes('voice note'), `#${target.ID} note must offer the voice-note hook`);
    assert.ok(!/\[[A-Za-z ]+\]|\{[a-z_]+\}/.test(note), `#${target.ID} note has an unfilled token`);
  }
});

test('First-touch DM keeps the vetted hook and always closes with an ask', () => {
  const jane = TARGETS.find((t) => t.ID === 1);
  const dm = outreach.firstTouchDm(jane, 'velvet');
  assert.ok(dm.startsWith(jane.Outreach_Hook));
  assert.ok(dm.includes('?'));
  const noQuestion = outreach.firstTouchDm(
    { Organization_or_Leader: 'Acme Agency (Ada Byron — Founder)', Outreach_Hook: 'Short note about Acme.' },
    'sovereign'
  );
  assert.ok(noQuestion.includes(outreach.PRODUCT_MODES.sovereign.cta));
  assert.ok(noQuestion.trim().endsWith('?'));
});

test('Voice-note scripts read in 45–60 seconds and carry the right commercial terms', () => {
  for (const target of TARGETS) {
    const mode = outreach.resolveProductMode(target.Target_Product);
    const script = outreach.voiceNoteScript(target, mode);
    const words = script.split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 90 && words <= 170, `#${target.ID} script is ${words} words`);
    assert.ok(script.includes(outreach.PRODUCT_MODES[mode].label));
    assert.ok(script.includes(outreach.PRODUCT_MODES[mode].partner));
    assert.ok(!/\[[A-Za-z ]+\]|\{[a-z_]+\}/.test(script), `#${target.ID} script has an unfilled token`);
  }
  const velvet = outreach.voiceNoteScript(TARGETS[0], 'velvet');
  assert.ok(velvet.includes('ABN 61 794 639 443'));
  const glow = outreach.voiceNoteScript(TARGETS[0], 'glowgrid');
  assert.ok(glow.includes('35% recurring affiliate'));
});

test('Follow-up cadence and email versions are channel-appropriate', () => {
  const seq = outreach.buildOutreachSequence(TARGETS[0]);
  assert.deepEqual(Object.keys(seq.messages), [
    'connection_note',
    'first_dm',
    'voice_note',
    'follow_up_day3',
    'follow_up_day7',
    'email',
  ]);
  assert.notEqual(seq.messages.follow_up_day3.body, seq.messages.first_dm.body);
  assert.ok(seq.messages.follow_up_day3.body.includes(outreach.SITE));
  assert.ok(seq.messages.follow_up_day7.body.includes('closing the loop'));
  assert.ok(seq.messages.email.subject.includes('Velvet Cadence'));
  assert.ok(seq.messages.email.body.includes(outreach.SITE));
  assert.ok(seq.messages.email.body.includes('ABN 61 794 639 443'));
  const glowTarget = TARGETS.find((t) => outreach.resolveProductMode(t.Target_Product) === 'glowgrid');
  const glowgrid = outreach.buildOutreachSequence(glowTarget);
  assert.ok(glowgrid.messages.email.body.includes('35% recurring affiliate'));
  assert.ok(glowgrid.messages.email.body.includes('no corporate approval needed'));
  assert.equal(glowgrid.mode, 'glowgrid');
});

test('Campaign planner spreads 100 targets across 35-per-day sprint batches', () => {
  const plan = outreach.planCampaign(TARGETS, { dailyQuota: 35, startDate: '2026-11-11' });
  assert.equal(plan.length, 100);
  assert.equal(plan[0].day, 1);
  assert.equal(plan[0].scheduledDate, '2026-11-11');
  assert.equal(plan[99].scheduledDate, '2026-11-13');
  const perDay = plan.reduce((acc, row) => {
    acc[row.day] = (acc[row.day] || 0) + 1;
    return acc;
  }, {});
  assert.deepEqual(perDay, { 1: 35, 2: 35, 3: 30 });
  const waves = plan.map((row) => row.wave);
  assert.deepEqual(waves, [...waves].sort((a, b) => a - b));
  const batch1 = outreach.dailyBatch(plan, 1);
  assert.equal(batch1.length, 35);
  assert.equal(batch1[0].position, 0);
  assert.equal(outreach.dailyBatch(plan, 4).length, 0);
  assert.equal(outreach.planCampaign(TARGETS, { dailyQuota: 10 })[99].day, 10);
  assert.equal(outreach.planCampaign(TARGETS, { dailyQuota: 0 })[99].day, 3);
});


test('Pipeline metrics convert statuses into MRR, reply rate and quota pressure', () => {
  const records = [
    { status: 'not_contacted', mode: 'velvet' },
    { status: 'dm_sent', mode: 'velvet' },
    { status: 'follow_up_1', mode: 'sovereign' },
    { status: 'replied', mode: 'velvet' },
    { status: 'demo_booked', mode: 'aurelia' },
    { status: 'trial', mode: 'glowgrid' },
    { status: 'paid', mode: 'velvet' },
    { status: 'paid', mode: 'glowgrid' },
    { status: 'not_now', mode: 'sovereign' },
  ];
  const metrics = outreach.pipelineMetrics(records, { contactedToday: 12, dailyQuota: 35 });
  assert.equal(metrics.total, 9);
  assert.equal(metrics.contacted, 7);
  assert.equal(metrics.replies, 5);
  assert.equal(metrics.demos, 4);
  assert.equal(metrics.trials, 1);
  assert.equal(metrics.paid, 2);
  assert.equal(metrics.mrr, 128); // Velvet $99 + GlowGrid $29
  assert.equal(metrics.replyRate, 71.4);
  assert.equal(metrics.closeRate, 28.6);
  assert.equal(metrics.counts.not_contacted, 1);
  assert.equal(metrics.quotaRemaining, 23);
  assert.ok(metrics.weightedMrr > 128 && metrics.weightedMrr < 400);
  assert.equal(outreach.pipelineMetrics([]).replyRate, 0);
  assert.equal(outreach.pipelineMetrics([]).quotaRemaining, 35);
});

test('Pipeline CSV export is spreadsheet-safe and round-trips the campaign plan', () => {
  const csv = outreach.toPipelineCsv([
    {
      id: 7,
      day: 1,
      scheduledDate: '2026-11-11',
      status: 'dm_sent',
      mode: 'velvet',
      Organization_or_Leader: 'Klowt (Amelia Sordell - Founder & CEO)',
      Location: 'Sydney, NSW',
      Deal_Type: '30% Recurring Partner Share',
      Website_or_Channel: 'https://klowt.com',
      lastTouch: '2026-11-11T00:00:00Z',
      note: 'Said "send it over"',
    },
  ]);
  const lines = csv.split('\n');
  assert.equal(lines[0], outreach.CSV_HEADERS.join(','));
  assert.equal(lines.length, 2);
  assert.ok(lines[1].startsWith('7,1,2026-11-11,dm_sent,velvet,'));
  assert.ok(lines[1].includes('"Sydney, NSW"'));
  assert.ok(lines[1].includes('"Said ""send it over"""'));
  assert.equal(outreach.toPipelineCsv([]).split('\n').length, 1);
});

test('Status advance walks the pipeline but stops at paid', () => {
  assert.equal(outreach.advanceStatus('not_contacted'), 'dm_sent');
  assert.equal(outreach.advanceStatus('dm_sent'), 'follow_up_1');
  assert.equal(outreach.advanceStatus('replied'), 'demo_booked');
  assert.equal(outreach.advanceStatus('paid'), 'paid');
  assert.equal(outreach.advanceStatus('bogus'), 'dm_sent');
  assert.deepEqual(outreach.blankRecord(), { status: 'not_contacted', lastTouch: null, note: '' });
  assert.equal(outreach.addDays('2026-11-11', 2), '2026-11-13');
  assert.equal(outreach.addDays('2026-12-31', 1), '2027-01-01');
});

test('Outreach engine loads in the browser bundle with a window global and no CommonJS', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'outreach-engine.js'), 'utf8');
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  assert.equal(typeof sandbox.window.AureliaOutreach, 'object');
  assert.equal(sandbox.window.AureliaOutreach.STATUS_FLOW.length, 9);
  assert.equal(typeof sandbox.window.AureliaOutreach.planCampaign, 'function');
});

