// Minimal fish-fight save server — Node http, no deps.
// GET  /save/:id  → 200 JSON save | 404 if new player
// POST /save/:id  → 200, body replaces save on disk
//
// Storage: server/saves/<id>.json (one file per player)
// CORS: permissive for local dev.
//
// Run: node server/index.mjs   (port 4567, override with PORT env)
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAVES_DIR = path.join(__dirname, 'saves');
const PORT = Number(process.env.PORT) || 4567;
const MAX_BODY = 64 * 1024; // 64KB — saves are tiny

await fs.mkdir(SAVES_DIR, { recursive: true });

const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const saveFile = (id) => path.join(SAVES_DIR, `${id}.json`);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res, status, body) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { req.destroy(); reject(new Error('body too large')); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

  const match = /^\/save\/([^/]+)\/?$/.exec(req.url || '');
  if (!match) return send(res, 404, { error: 'not found' });
  const id = decodeURIComponent(match[1]);
  if (!ID_RE.test(id)) return send(res, 400, { error: 'bad id' });

  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(saveFile(id), 'utf8');
      return send(res, 200, data);
    } catch (e) {
      if (e.code === 'ENOENT') return send(res, 404, { error: 'no save' });
      return send(res, 500, { error: 'read failed' });
    }
  }

  if (req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const parsed = JSON.parse(raw); // validates JSON
      await fs.writeFile(saveFile(id), JSON.stringify(parsed));
      return send(res, 200, { ok: true });
    } catch {
      return send(res, 400, { error: 'bad body' });
    }
  }

  return send(res, 405, { error: 'method not allowed' });
});

server.listen(PORT, () => {
  console.log(`[fishfight-save] listening on http://localhost:${PORT}`);
  console.log(`[fishfight-save] saves dir: ${SAVES_DIR}`);
});
