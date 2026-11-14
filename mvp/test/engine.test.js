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

test('Velvet Cadence v1.2 First Post Studio: generates distinct authority, punchy and story drafts', () => {
  const transcript = 'We doubled qualified discovery calls in six weeks by attaching one client metric to every post.';
  const authority = engine.voiceToAuthority(transcript, 'Pipeline_Q4.xlsx', { tone: 'authority', audience: 'founders' });
  const punchy = engine.voiceToAuthority(transcript, 'Pipeline_Q4.xlsx', { tone: 'punchy', audience: 'founders' });
  const story = engine.voiceToAuthority(transcript, 'Pipeline_Q4.xlsx', { tone: 'story', audience: 'founders' });
  assert.notEqual(authority.linkedinPost, punchy.linkedinPost);
  assert.notEqual(punchy.linkedinPost, story.linkedinPost);
  assert.ok(punchy.linkedinPost.includes('No blank page'));
  assert.ok(story.linkedinPost.includes('unfinished voice note'));
  assert.ok(story.shortVideoHook.includes('founders'));
  assert.equal(authority.carouselSlides.length, 4);
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
  assert.equal(s1.eftBankDetails.bsb, 'Supplied on verified corporate remittance request');
});

test('C.T.L. Encrypted Interoffice Relay: AES-256-GCM encrypts/decrypts and rejects wrong passphrase or tampered ciphertext', async () => {
  const secretBody = 'Hold Q4 board margin announcement until Chair signs off at 09:30 AEST.';
  const sealed = await engine.encryptCtlMessage({
    sender: 'Sarah Jenkins (MD)',
    recipientRole: 'EA / Ghostwriter',
    subject: 'Board Sign-Off',
    attachmentUri: 'onedrive://finance/q3-board-financial-pack.xlsx',
    body: secretBody,
    passphrase: 'correct-horse-battery',
  });
  assert.match(sealed.packet, /^CTL1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.ok(!sealed.packet.includes('Chair'), 'ciphertext must never expose plaintext');

  const opened = await engine.decryptCtlMessage(sealed.packet, 'correct-horse-battery');
  assert.equal(opened.sender, 'Sarah Jenkins (MD)');
  assert.equal(opened.body, secretBody);
  assert.equal(opened.attachmentUri, 'onedrive://finance/q3-board-financial-pack.xlsx');

  await assert.rejects(
    () => engine.decryptCtlMessage(sealed.packet, 'wrong-passphrase'),
    /Decryption failed/
  );

  const flipped = sealed.packet.slice(0, -2) + (sealed.packet.endsWith('AA') ? 'BB' : 'AA');
  await assert.rejects(
    () => engine.decryptCtlMessage(flipped, 'correct-horse-battery'),
    /Decryption failed/
  );
});

test('Sovereign Brief .ics Calendar Export & Completed Deadline Filtering', () => {
  const demo = engine.getInitialDemoState();
  const ics = engine.exportCalendarIcs(demo.items, 'Sovereign Brief Test');
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('SUMMARY:Q3 Board Financial Report Sign-Off'));
  assert.ok(ics.includes('BEGIN:VALARM'));

  const withCompleted = demo.items.map((item, idx) => (idx === 1 ? { ...item, completed: true } : item));
  assert.equal(engine.detectCollisions(withCompleted, 2).length, 0, 'completed item must clear schedule collision');
  const icsAfter = engine.exportCalendarIcs(withCompleted);
  assert.ok(!icsAfter.includes('LinkedIn Authority Carousel + IG Reel Drop'), 'completed item must be omitted from active .ics export');
});

test('GlowGrid Studio Streak Radar & Sponsor Rate-Card Generator', () => {
  const streak = engine.computeCreatorStreak(['2026-11-12', '2026-11-13', '2026-11-14'], '2026-11-14');
  assert.equal(streak.currentStreakDays, 3);
  assert.equal(streak.longestStreakDays, 3);
  assert.equal(streak.consistencyScore, 75);
  assert.equal(streak.checkedInToday, true);

  const kit = engine.generateCreatorMediaKit({
    creatorName: 'Claire Media',
    niche: 'Executive Tech & Creator Systems',
    totalFollowers: 30000,
    avgReelViews: 15000,
    cpmAud: 50,
  });
  assert.ok(kit.singleReelAud >= 1000);
  assert.ok(kit.threePartBundleAud > kit.singleReelAud * 2);
  assert.ok(kit.markdown.includes('Claire Media'));
});

test('Aurelia OS Suite Backup & Restore: round-trips aurelia.bundle.v1 and strips unencrypted vault entries', () => {
  const bundle = engine.exportWorkspaceBundle({
    workspace: engine.getInitialDemoState(),
    trial: { startedAt: 1794600000000 },
    streakCheckIns: ['2026-11-14'],
    ctlVault: [
      { id: 'ok', packet: 'CTL1.aaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbb.cccccccccccccccc' },
      { id: 'bad', packet: 'PLAINTEXT_SHOULD_BE_DROPPED' },
    ],
  });
  assert.equal(bundle.ctlVault.length, 1);
  const restored = engine.validateWorkspaceBundle(JSON.stringify(bundle));
  assert.equal(restored.schema, 'aurelia.bundle.v1');
  assert.equal(restored.workspace.items.length, 4);
  assert.throws(() => engine.validateWorkspaceBundle('{"schema":"wrong"}'), /Invalid backup file/);
});



