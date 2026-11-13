'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC = path.join(__dirname, '..', 'public');
const read = (file) => fs.readFileSync(path.join(PUBLIC, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(PUBLIC, file));

const PAGES = fs.readdirSync(PUBLIC).filter((file) => file.endsWith('.html'));

test('Landing page is the front door and carries the full offer', () => {
  const html = read('index.html');
  assert.match(html, /<title>Aurelia OS/);
  assert.match(html, /name="description"/);
  assert.match(html, /property="og:title"/);
  // all four doors and their prices
  for (const door of ['Velvet Cadence', 'Sovereign Brief', 'GlowGrid Studio']) {
    assert.ok(html.includes(door), `landing page must name ${door}`);
  }
  for (const price of ['$49', '$99', '$149', '$39', '$399', '$29', '$19', '$199']) {
    assert.ok(html.includes(price), `landing page must show ${price}`);
  }
  assert.ok(html.includes('ABN 61 794 639 443'), 'landing page must carry the ABN');
  assert.ok(html.includes('GST'), 'landing page must explain GST invoicing');
  assert.ok(/sub-15 KB|under 15 KB/i.test(html), 'landing page must state the pointer size');
  assert.ok(html.includes('id="pricing"') && html.includes('id="faq"'), 'anchors used by the nav must exist');
});

test('Landing page CTAs point at real pages and the checkout panel', () => {
  const html = read('index.html');
  const required = [
    './workspace.html',
    './workspace.html#b2bPanel',
    './workspace.html?mode=velvet',
    './workspace.html?mode=sovereign',
    './workspace.html?mode=glowgrid',
    './workspace.html?mode=all',
    './deck.html',
    './clients.html',
    './outreach.html',
  ];
  for (const href of required) {
    assert.ok(html.includes(`href="${href}"`), `landing page is missing CTA ${href}`);
  }
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', 'workspace.html')));
});

test('Every internal link and asset across the public site resolves to a real file', () => {
  const missing = [];
  for (const page of PAGES) {
    const html = read(page);
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    for (const ref of refs) {
      if (/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(ref)) continue;
      if (ref.includes('${')) continue; // runtime template value, not a static link
      const clean = ref.split('#')[0].split('?')[0];
      if (!clean) continue;
      const target = clean.replace(/^\.\//, '');
      if (!exists(target)) missing.push(`${page} -> ${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('Service worker precache list is complete and every entry exists', () => {
  const source = read('sw.js');
  const block = source.slice(source.indexOf('const ASSETS'), source.indexOf('];', source.indexOf('const ASSETS')));
  const entries = [...block.matchAll(/'([^']+)'/g)].map((match) => match[1]);
  assert.ok(entries.includes('/workspace.html'), 'precache must include the workspace app shell');
  assert.ok(entries.includes('/outreach.html'), 'precache must include the outreach console');
  assert.ok(entries.includes('/clients.html'), 'precache must include the CRM board');
  for (const entry of entries) {
    if (entry === '/') continue;
    const file = entry.replace(/^\//, '');
    assert.ok(exists(file), `service worker precaches missing file ${entry}`);
  }
});

test('Web app manifest installs the workspace, not the marketing page', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.equal(manifest.start_url, './workspace.html');
  assert.equal(manifest.display, 'standalone');
  for (const shortcut of manifest.shortcuts) {
    const target = shortcut.url.split('?')[0].replace(/^\.\//, '');
    assert.ok(exists(target), `shortcut target ${shortcut.url} does not exist`);
  }
});

test('Velvet Cadence is purchasable: all three tiers carry a real Stripe Payment Link', () => {
  const engine = require('../lib/engine');
  const html = read('index.html');
  const tiers = { velvet_solo: 49, velvet_pro: 99, velvet_ea: 149 };
  const seen = new Set();
  for (const [planId, amount] of Object.entries(tiers)) {
    const plan = engine.PRICING_PLANS[planId];
    assert.equal(plan.amountAud, amount);
    assert.match(plan.stripePaymentLink, /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]{16,}$/, `${planId} needs a real payment link`);
    assert.ok(!seen.has(plan.stripePaymentLink), 'each tier must have its own link');
    seen.add(plan.stripePaymentLink);
    assert.ok(html.includes(`href="${plan.stripePaymentLink}"`), `landing page must link the ${planId} checkout`);
    const session = engine.createDualCheckoutSession({ planId, provider: 'stripe', affiliateRef: 'partner_x' });
    assert.equal(session.stripeLive, true);
    assert.ok(session.stripeCheckoutUrl.startsWith(plan.stripePaymentLink + '?'));
    assert.ok(session.stripeCheckoutUrl.includes('utm_source=partner_x'));
    assert.ok(!session.stripeCheckoutUrl.includes('prefilled_email'), 'the demo buyer email must never be prefilled into a real checkout');
  }
  // plans without a payment link must not be reported as purchasable
  assert.equal(engine.createDualCheckoutSession({ planId: 'glowgrid_pro', provider: 'stripe' }).stripeLive, false);
});
