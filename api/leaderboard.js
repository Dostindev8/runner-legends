/**
 * Vercel serverless — leaderboard best-effort (memoria de instancia).
 * Validación server-side + rate limit por IP. Sin secretos en cliente.
 */

const NAME_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 _.\-]{1,16}$/;
const store = globalThis.__rlLbStore || (globalThis.__rlLbStore = { rows: [], hits: new Map() });

function sanitizeName(raw) {
  let s = String(raw == null ? 'Jugador' : raw).trim().slice(0, 16);
  if (!NAME_RE.test(s)) s = s.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 _.\-]/g, '').slice(0, 16);
  return s || 'Jugador';
}

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim().slice(0, 64);
  return String(req.socket && req.socket.remoteAddress || 'unknown').slice(0, 64);
}

function rateLimit(ip) {
  const now = Date.now();
  const prev = store.hits.get(ip) || 0;
  if (now - prev < 3000) return false;
  store.hits.set(ip, now);
  if (store.hits.size > 5000) store.hits.clear();
  return true;
}

function validateBody(body) {
  if (!body || typeof body !== 'object') return null;
  const dist = Math.max(0, Math.min(20000, Math.floor(Number(body.dist) || 0)));
  const combo = Math.max(0, Math.min(999, Math.floor(Number(body.combo) || 0)));
  const kills = Math.max(0, Math.min(500, Math.floor(Number(body.kills) || 0)));
  if (dist <= 0) return null;
  return {
    name: sanitizeName(body.name),
    dist,
    combo,
    kills,
    diff: String(body.diff || 'normal').slice(0, 16),
    world: String(body.world || 'neon').slice(0, 24),
    at: Date.now()
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://runner-legends.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'GET') {
    const top = store.rows.slice().sort((a, b) => b.dist - a.dist || b.combo - a.combo).slice(0, 20);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ top, note: 'best-effort instance memory' }));
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }

  const ip = clientIp(req);
  if (!rateLimit(ip)) {
    res.statusCode = 429;
    res.end(JSON.stringify({ error: 'rate_limited' }));
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  const row = validateBody(body);
  if (!row) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'invalid_score' }));
    return;
  }

  store.rows.push(row);
  store.rows.sort((a, b) => b.dist - a.dist || b.combo - a.combo);
  store.rows = store.rows.slice(0, 100);
  const top = store.rows.slice(0, 20);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: true, top }));
};
