'use strict';
// Aurelia OS — Zero-Dependency Node Server (Port 3002)
// Serves the Unified 1+3 Workspace (Aurelia OS + Velvet Cadence + Sovereign Brief + GlowGrid Studio)
const http = require('http');
const fs = require('fs');
const path = require('path');
const engine = require('./lib/engine');

const PORT = process.env.PORT || 3002;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const state = {
  assets: [
    engine.createCloudPointer({ id: 'ast_1', title: 'Q3 Board Financial Pack.xlsx', provider: 'onedrive', osOrigin: 'Windows', mimeType: 'application/vnd.ms-excel', domain: 'executive', rawSizeMb: 24 }),
    engine.createCloudPointer({ id: 'ast_2', title: 'iPhone 16 Pro 4K Founder Storytime.mov', provider: 'icloud', osOrigin: 'iOS', mimeType: 'video/quicktime', domain: 'creator', rawSizeMb: 640 }),
    engine.createCloudPointer({ id: 'ast_3', title: 'Sponsor Campaign Brief & Deliverables.pdf', provider: 'gdrive', osOrigin: 'Android', mimeType: 'application/pdf', domain: 'creator', rawSizeMb: 8 }),
  ],
  items: [
    engine.createCommandItem({ id: 'cmd_1', title: 'Q3 Board Financial Report Sign-Off', domain: 'executive', itemType: 'report_deadline', channel: 'Windows OneDrive / Outlook', energyProfile: 'deep_exec', isHardDeadline: true, dueAt: '2026-11-12T09:00:00.000Z', linkedAssetIds: ['ast_1'], captionOrBrief: 'Final EBITDA & margin deck for board distribution.' }),
    engine.createCommandItem({ id: 'cmd_2', title: 'LinkedIn Authority Carousel + Video Drop', domain: 'creator', itemType: 'content_upload', channel: 'LinkedIn + IG Reels', energyProfile: 'camera_ready', isHardDeadline: false, dueAt: '2026-11-12T09:45:00.000Z', linkedAssetIds: ['ast_1', 'ast_2'], captionOrBrief: 'How we cut quoting time from 2 weeks to 10 minutes.' }),
    engine.createCommandItem({ id: 'cmd_3', title: 'Executive Wellness & School Pickup Boundary', domain: 'personal', itemType: 'life_event', channel: 'Apple iCloud / EventKit', energyProfile: 'recharge', isHardDeadline: true, dueAt: '2026-11-12T15:30:00.000Z', linkedAssetIds: [] }),
  ],
};

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', (c) => { d += c; if (d.length > 1e5) req.destroy(); });
    req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    if (req.method === 'GET' && u.pathname === '/api/health') {
      return send(res, 200, { ok: true, app: 'aurelia-os-mvp', mode: 'zero-blob-cross-cloud' });
    }
    if (req.method === 'GET' && u.pathname === '/api/state') {
      const collisions = engine.detectCollisions(state.items, 2);
      const rawMbSaved = state.assets.reduce((s, a) => s + a.rawSizeMb, 0);
      return send(res, 200, { assets: state.assets, items: state.items, collisions, metrics: { rawMbSaved, pointerKbUsed: state.assets.length * 12, serverEgressUsd: 0 } });
    }
    if (req.method === 'POST' && u.pathname === '/api/cascade') {
      const r = engine.cascadeReschedule(state.items, 24);
      state.items = r.items;
      return send(res, 200, { shiftedCount: r.shiftedCount, items: state.items, collisions: engine.detectCollisions(state.items, 2) });
    }
    if (req.method === 'POST' && u.pathname === '/api/voice') {
      const b = await readBody(req);
      return send(res, 200, engine.voiceToAuthority(b.transcript, b.proofAsset));
    }
    if (req.method === 'POST' && u.pathname === '/api/assets') {
      const b = await readBody(req);
      const a = engine.createCloudPointer(b);
      state.assets.unshift(a);
      return send(res, 201, a);
    }
    if (req.method === 'GET') {
      const file = path.join(PUBLIC, u.pathname === '/' ? 'index.html' : u.pathname);
      if (file.startsWith(PUBLIC) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
        return fs.createReadStream(file).pipe(res);
      }
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, () => console.log(`Aurelia OS MVP -> http://localhost:${PORT}`));
