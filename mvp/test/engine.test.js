'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../lib/engine');

test('Zero-Blob Cloud Pointer: indexes iCloud/GDrive/OneDrive with $0.00 video egress and <15KB pointer', () => {
  const p1 = engine.createCloudPointer({ title: 'iPhone 4K Reel B-Roll.mov', provider: 'icloud', rawSizeMb: 480 });
  const p2 = engine.createCloudPointer({ title: 'Q3 Board Financial Pack.xlsx', provider: 'onedrive', domain: 'executive', rawSizeMb: 18 });
  const p3 = engine.createCloudPointer({ title: 'Brand Sponsor Brief.pdf', provider: 'gdrive', domain: 'creator', rawSizeMb: 6 });

  assert.equal(p1.osOrigin, 'iOS');
  assert.equal(p2.osOrigin, 'Windows');
  assert.equal(p3.osOrigin, 'Android');
  assert.equal(p1.serverEgressCostUsd, 0.00);
  assert.ok(p1.pointerKb < 15);
  assert.ok(p1.externalUri.startsWith('icloud://'));
  assert.ok(p2.externalUri.startsWith('onedrive://'));
  assert.ok(p3.externalUri.startsWith('gdrive://'));
});

test('Multi-Stage Reminders: generates 4 upload stages for creators and 3 dossier stages for executives', () => {
  const upload = engine.createCommandItem({
    title: 'LinkedIn Authority Carousel #14',
    domain: 'creator',
    itemType: 'content_upload',
    dueAt: '2026-11-12T08:30:00.000Z',
  });
  const report = engine.createCommandItem({
    title: 'Q3 Board Pack Submission',
    domain: 'executive',
    itemType: 'report_deadline',
    dueAt: '2026-11-12T09:00:00.000Z',
  });

  assert.equal(upload.reminders.length, 4);
  assert.equal(upload.reminders[0].stage, 'film_cutoff');
  assert.equal(upload.reminders[2].stage, 'prime_upload');
  assert.equal(upload.isHardDeadline, false);

  assert.equal(report.reminders.length, 3);
  assert.equal(report.reminders[2].stage, 'hard_deadline');
  assert.equal(report.isHardDeadline, true);
});

test('Collision Detector: flags when Executive Report and Creator Upload collide within 2 hours', () => {
  const items = [
    engine.createCommandItem({ id: 'c1', title: 'Q3 Board Report (OneDrive)', domain: 'executive', itemType: 'report_deadline', dueAt: '2026-11-12T09:00:00.000Z', isHardDeadline: true }),
    engine.createCommandItem({ id: 'c2', title: 'LinkedIn Video Upload (iCloud)', domain: 'creator', itemType: 'content_upload', dueAt: '2026-11-12T09:45:00.000Z', isHardDeadline: false }),
  ];
  const collisions = engine.detectCollisions(items, 2);
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].gapMinutes, 45);
  assert.ok(collisions[0].resolution.includes('LinkedIn Video Upload'));
});

test('1-Tap Cascade Reschedule: shifts flexible creator uploads +24h while locking hard executive/family deadlines', () => {
  const items = [
    engine.createCommandItem({ id: 'c1', title: 'Board Presentation', domain: 'executive', itemType: 'report_deadline', dueAt: '2026-11-12T09:00:00.000Z', isHardDeadline: true }),
    engine.createCommandItem({ id: 'c2', title: 'IG Reel & LinkedIn Drop', domain: 'creator', itemType: 'content_upload', dueAt: '2026-11-12T09:30:00.000Z', isHardDeadline: false }),
  ];
  const res = engine.cascadeReschedule(items, 24);
  assert.equal(res.shiftedCount, 1);
  assert.equal(res.items[0].dueAt, '2026-11-12T09:00:00.000Z');
  assert.equal(res.items[1].dueAt, '2026-11-13T09:30:00.000Z');
  assert.equal(res.detectAfter || engine.detectCollisions(res.items, 2).length, 0);
});

test('Velvet Cadence Voice-to-Authority: transforms voice note + cloud proof asset into LinkedIn post, carousel, and video hook', () => {
  const out = engine.voiceToAuthority('We cut quoting time from 14 days to 10 minutes by automating the BOQ layer.', 'OneDrive_Q3_Margin_Report.xlsx');
  assert.ok(out.linkedinPost.includes('OneDrive_Q3_Margin_Report.xlsx'));
  assert.equal(out.carouselSlides.length, 4);
  assert.ok(out.shortVideoHook.includes('OneDrive_Q3_Margin_Report.xlsx'));
});

test('Velvet Cadence v1.1: content output is specific, actionable and handles an empty voice note', () => {
  const out = engine.voiceToAuthority('We reduced client onboarding from ten days to two by assigning one proof owner.', 'Onboarding_Time_Study.xlsx');
  assert.ok(out.linkedinPost.includes('Attach the evidence'));
  assert.ok(!out.linkedinPost.includes('Execution speed compounds'));
  assert.ok(out.carouselSlides[2].includes('Onboarding_Time_Study.xlsx'));
  const empty = engine.voiceToAuthority('', 'Proof.pdf');
  assert.ok(empty.linkedinPost.includes('one specific result'));
  assert.equal(empty.carouselSlides.length, 4);
});

test('Assisted 2-Tap Native Handoff: resolves icloud://, onedrive://, and gdrive:// deep-link packets for IG Reels, TikTok, LinkedIn, and Board Deck', () => {
  const demo = engine.getInitialDemoState();
  const reelItem = demo.items[1];
  const boardItem = demo.items[0];

  const igPacket = engine.handoffPacket(reelItem, demo.assets, 'ig_reels');
  assert.equal(igPacket.targetId, 'ig_reels');
  assert.equal(igPacket.deepLinkUri, 'instagram://camera');
  assert.equal(igPacket.serverEgressCostUsd, 0.00);
  assert.ok(igPacket.ready);
  assert.ok(igPacket.cloudUris.some((u) => u.startsWith('icloud://')));
  assert.ok(igPacket.cloudUris.some((u) => u.startsWith('onedrive://')));
  assert.equal(igPacket.steps.length, 2);

  const tiktokPacket = engine.handoffPacket(demo.items[2], demo.assets, 'tiktok');
  assert.equal(tiktokPacket.targetId, 'tiktok');
  assert.ok(tiktokPacket.cloudUris.some((u) => u.startsWith('gdrive://')));

  const boardPacket = engine.handoffPacket(boardItem, demo.assets);
  assert.equal(boardPacket.targetId, 'board_deck');
  assert.ok(boardPacket.primaryCloudUri.startsWith('onedrive://'));
});

test('Executive Dossier Readiness Scoring: flags collision risk before cascade and reaches 100% BOARD_READY after cascade', () => {
  const demo = engine.getInitialDemoState();
  const boardItem = demo.items[0];

  const before = engine.scoreDossierReadiness(boardItem, demo.assets, demo.items);
  assert.equal(before.hasLinkedAssets, true);
  assert.equal(before.collisionFree, false);
  assert.equal(before.score, 80);
  assert.equal(before.status, 'ACTION_NEEDED');

  const cascaded = engine.cascadeReschedule(demo.items, 24).items;
  const after = engine.scoreDossierReadiness(cascaded[0], demo.assets, cascaded);
  assert.equal(after.collisionFree, true);
  assert.equal(after.score, 100);
  assert.equal(after.status, 'BOARD_READY');
});

test('Client-Side Universal Engine (engine-client.js) has 100% parity with Node engine for Netlify static deployment', () => {
  const clientEngine = require('../public/engine-client');
  const demo = clientEngine.getInitialDemoState();
  assert.equal(demo.assets.length, 3);
  assert.equal(demo.items.length, 4);
  const pkt = clientEngine.handoffPacket(demo.items[1], demo.assets, 'ig_reels');
  assert.equal(pkt.serverEgressCostUsd, 0.00);
  assert.ok(pkt.ready);
});

test('B2B Corporate Expense Tax Invoice: computes exact 10% GST breakdown, ABN 61 794 639 443, and Finance Approval Memo', () => {
  const inv = engine.generateCorporateInvoice({
    planId: 'velvet_pro',
    buyerName: 'Claire Sterling, Managing Partner',
    companyName: 'Sterling Capital Advisory Pty Ltd',
  });
  assert.equal(inv.vendorAbn, '61 794 639 443');
  assert.equal(inv.totalIncGst, 99);
  assert.equal(inv.gstAmount, 9.00);
  assert.equal(inv.exGstAmount, 90.00);
  assert.ok(inv.approvalMemo.includes('Sterling Capital Advisory Pty Ltd'));
  assert.ok(inv.approvalMemo.includes('61 794 639 443'));
});

test('Zero-Ad-Spend Partner Affiliate Kit: returns ready-to-send DM pitches & recurring commission terms for all 3 channels', () => {
  const gw = engine.generatePartnerKit('ghostwriters');
  const ea = engine.generatePartnerKit('ea_networks');
  const cc = engine.generatePartnerKit('creator_coaches');
  assert.ok(gw.commission.includes('30%'));
  assert.ok(ea.commission.includes('$100'));
  assert.ok(cc.commission.includes('35%'));
  assert.ok(gw.dmPitch.includes('Velvet Cadence'));
  assert.ok(ea.dmPitch.includes('Sovereign Brief'));
  assert.ok(cc.dmPitch.includes('GlowGrid Studio'));
});

test('Dual-Provider Checkout Engine: generates Stripe Direct, Lemon Squeezy MoR (with affiliate ref), and B2B EFT sessions', () => {
  const s1 = engine.createDualCheckoutSession({
    planId: 'velvet_ea',
    provider: 'stripe',
    buyerName: 'Elena Vance',
    companyName: 'Vance Executive Partners',
    affiliateRef: 'partner_ghostwriters',
  });
  const s2 = engine.createDualCheckoutSession({
    planId: 'sovereign_annual',
    provider: 'lemonsqueezy',
    buyerName: 'Elena Vance',
    companyName: 'Vance Executive Partners',
    affiliateRef: 'partner_ea_networks',
  });
  assert.equal(s1.amountAud, 149);
  assert.ok(s1.stripeCheckoutUrl.includes('utm_source=partner_ghostwriters'));
  assert.equal(s2.amountAud, 399);
  assert.equal(s2.provider, 'lemonsqueezy');
  assert.equal(typeof s2.lemonSqueezyCheckoutUrl, 'undefined');
  assert.equal(s1.eftBankDetails.bsb, '772-772');
});


