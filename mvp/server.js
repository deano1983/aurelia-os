'use strict';
// Aurelia OS — Zero-Dependency Node Server (Port 3002)
// Serves the Unified 1+3 Workspace (Aurelia OS + Velvet Cadence + Sovereign Brief + GlowGrid Studio)
const http = require('http');
const fs = require('fs');
const path = require('path');
const engine = require('./lib/engine');

const PORT = process.env.PORT || 3002;
const PUBLIC = path.join(__dirname, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

let state = engine.getInitialDemoState();

function buildStatePayload() {
  const collisions = engine.detectCollisions(state.items, 2);
  const rawMbSaved = state.assets.reduce((s, a) => s + (Number(a.rawSizeMb) || 0), 0);
  const dossiers = {};
  const handoffs = {};
  for (const item of state.items) {
    dossiers[item.id] = engine.scoreDossierReadiness(item, state.assets, state.items);
    handoffs[item.id] = engine.handoffPacket(item, state.assets);
  }
  return {
    assets: state.assets,
    items: state.items,
    collisions,
    dossiers,
    handoffs,
    metrics: {
      rawMbSaved,
      pointerKbUsed: state.assets.length * 12,
      serverEgressUsd: 0,
    },
  };
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
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
      return send(res, 200, buildStatePayload());
    }
    if (req.method === 'POST' && u.pathname === '/api/cascade') {
      const r = engine.cascadeReschedule(state.items, 24);
      state.items = r.items;
      return send(res, 200, { shiftedCount: r.shiftedCount, ...buildStatePayload() });
    }
    if (req.method === 'POST' && u.pathname === '/api/reset') {
      state = engine.getInitialDemoState();
      return send(res, 200, buildStatePayload());
    }
    if (req.method === 'POST' && u.pathname === '/api/voice') {
      const b = await readBody(req);
      return send(res, 200, engine.voiceToAuthority(b.transcript, b.proofAsset));
    }
    if (req.method === 'POST' && u.pathname === '/api/assets') {
      const b = await readBody(req);
      const a = engine.createCloudPointer(b);
      state.assets.unshift(a);
      return send(res, 201, { asset: a, ...buildStatePayload() });
    }
    if (req.method === 'POST' && u.pathname === '/api/handoff') {
      const b = await readBody(req);
      const item = state.items.find((i) => i.id === b.itemId) || state.items[0];
      return send(res, 200, engine.handoffPacket(item, state.assets, b.target));
    }
    if (req.method === 'GET') {
      const file = path.join(PUBLIC, u.pathname === '/' ? 'index.html' : u.pathname);
      if (file.startsWith(PUBLIC) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain; charset=utf-8' });
        return fs.createReadStream(file).pipe(res);
      }
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: String(e.message || e) });
  }
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`Aurelia OS MVP -> http://localhost:${PORT}`));
}

module.exports = { server };

