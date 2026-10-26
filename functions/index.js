// Space Collector server on Firebase (2026-10-26, Sevaan: "Go with Firebase"). A Cloud Run function ("api", Node 22) in
// the personal project space-collector-91cc7, served through Firebase Hosting at https://spacecollector.app/api/…, so
// the Hosting CDN caches what it can (Cache-Control s-maxage) and nearby players share upstream requests.
// Deployed with gcloud (personal login), never the firebase CLI. Same routes as worker/src/index.js:
//   GET  /api/wx?lat&lon        MET Norway (CC BY 4.0), reshaped for js/weather.js; cached 30 min per 0.1°
//   GET  /api/planes?lat&lon&dist   adsb.lol (ODbL); cached 8 s
//   GET  /api/catalog, /api/comets  the repo's daily files (the phone apps keep fresh data with them); cached 3 h
//   POST /api/t                 anonymous usage reports → Firestore collection sc_events
//   GET  /api/stats             the dashboard (?all=1 includes test builds)
import functions from '@google-cloud/functions-framework';
import { Firestore } from '@google-cloud/firestore';
import { DatabaseSync } from 'node:sqlite';
const db = new Firestore();
const ALLOWED = [/^https:\/\/sevaan\.github\.io$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/, /^capacitor:\/\/localhost$/, /^https:\/\/localhost$/, /^https:\/\/spacecollector\.app$/];
const UA = 'SpaceCollector/1.0 (https://spacecollector.app; hello@spacecollector.app)';
const REPO_RAW = 'https://raw.githubusercontent.com/sevaan/space-collector/main/';
const mem = new Map(); // per-instance cache on top of the CDN's
async function cached(key, ms, make) { const h = mem.get(key); if (h && Date.now() - h.at < ms) return h.body; const body = await make(); if (body != null) { mem.set(key, { at: Date.now(), body }); if (mem.size > 2000) mem.clear(); } return body; }
const coord = (q) => { const lat = Number(q.lat), lon = Number(q.lon); return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10 } : null; };
function wmo(sym = '') {
  const s = String(sym).replace(/_(day|night|polartwilight)$/, '');
  if (/thunder/.test(s)) return 95; if (/snow|sleet/.test(s)) return /heavy/.test(s) ? 75 : 71;
  if (/rain/.test(s)) return /heavy/.test(s) ? 65 : /light/.test(s) ? 61 : 63;
  if (s === 'fog') return 45; if (s === 'cloudy') return 3; if (s === 'partlycloudy') return 2; if (s === 'fair') return 1; return 0;
}
async function weather(p) {
  return cached(`wx/${p.lat},${p.lon}`, 30 * 60e3, async () => {
    const r = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${p.lat}&lon=${p.lon}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const ts = (await r.json())?.properties?.timeseries ?? [];
    const rows = ts.map((x) => { const d = x.data ?? {}, n = d.next_1_hours ?? d.next_6_hours ?? d.next_12_hours, det = d.instant?.details ?? {};
      return { t: Date.parse(x.time), step: d.next_1_hours ? 1 : d.next_6_hours ? 6 : 12, cloud: Math.round(det.cloud_area_fraction ?? 0), code: wmo(n?.summary?.symbol_code), temp: det.air_temperature ?? null, wind: det.wind_speed != null ? Math.round(det.wind_speed * 3.6) : null }; });
    const hours = []; for (const r2 of rows) for (let h = 0; h < r2.step && hours.length < 24 * 9; h++) hours.push({ t: r2.t + h * 3600e3, cloud: r2.cloud, code: r2.code, temp: r2.temp, wind: r2.wind });
    return JSON.stringify({ now: rows[0] ? { cloud: rows[0].cloud, code: rows[0].code } : { cloud: 0, code: 0 }, hours, source: 'MET Norway' });
  });
}
async function planes(p, d) {
  return cached(`planes/${p.lat},${p.lon},${d}`, 8e3, async () => { const r = await fetch(`https://api.adsb.lol/v2/point/${p.lat}/${p.lon}/${d}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4000) }); return r.ok ? await r.text() : null; });
}
const repoFile = (path) => cached(`repo/${path}`, 3 * 3600e3, async () => { const r = await fetch(REPO_RAW + path, { headers: { 'User-Agent': UA } }); return r.ok ? await r.text() : null; });

const NAMES = new Set(['install', 'open', 'night', 'end', 'tour', 'motion', 'calib', 'plus', 'err', 'sky', 'help']);
async function report(body) {
  let b; try { b = JSON.parse(String(body ?? '').slice(0, 40000)); } catch { return 400; }
  const iid = String(b?.i ?? ''); if (!/^[a-f0-9]{16,40}$/.test(iid)) return 400;
  const v = String(b?.v ?? '').slice(0, 20), p = ['ios', 'android', 'web'].includes(b?.p) ? b.p : 'web', x = b?.x ? 1 : 0, now = Date.now();
  const rows = (Array.isArray(b?.e) ? b.e : []).slice(0, 60).filter((e) => Array.isArray(e) && NAMES.has(e[0]));
  if (rows.length) { const batch = db.batch(); for (const e of rows) batch.set(db.collection('sc_events').doc(), { ts: Math.min(now, Math.max(now - 30 * 86400000, Number(e[1]) || now)), iid, v, p, x, name: String(e[0]), d: JSON.stringify(e[2] ?? {}).slice(0, 600) }); await batch.commit(); }
  return 204;
}
// The dashboard reuses the SQL from the Val Town / Worker versions over an in-memory SQLite of the events.
async function stats(all) {
  const snap = await db.collection('sc_events').get();
  const s = new DatabaseSync(':memory:'); s.exec('CREATE TABLE sc_events (ts INTEGER, iid TEXT, v TEXT, p TEXT, x INTEGER, name TEXT, d TEXT)');
  const ins = s.prepare('INSERT INTO sc_events VALUES (?, ?, ?, ?, ?, ?, ?)');
  s.exec('BEGIN'); for (const doc of snap.docs) { const e = doc.data(); ins.run(e.ts, e.iid, e.v, e.p, e.x, e.name, e.d); } s.exec('COMMIT');
  const env = { DB: { prepare: (sql) => ({ raw: async () => s.prepare(sql).all().map((r) => Object.values(r)) }) } };
  return statsHtml(env, all);
}

functions.http('api', async (req, res) => {
  const origin = req.get('Origin') ?? '', ok = ALLOWED.some((re) => re.test(origin));
  if (ok) { res.set('Access-Control-Allow-Origin', origin); res.set('Vary', 'Origin'); }
  if (req.method === 'OPTIONS') { res.set('Access-Control-Allow-Methods', 'GET, POST'); res.set('Access-Control-Allow-Headers', 'Content-Type'); return res.status(204).send(''); }
  const path = req.path.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  const json = (body, sMax) => { if (body == null) return res.status(502).send('unavailable'); res.set('Content-Type', 'application/json'); res.set('Cache-Control', `public, max-age=${Math.min(sMax, 300)}, s-maxage=${sMax}`); return res.send(body); };
  try {
    if (path === '/stats' && req.method === 'GET') { res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'private, no-store'); return res.send(await stats(req.query.all === '1')); }
    if (path === '/t' && req.method === 'POST') { if (!ok) return res.status(403).send('Forbidden'); return res.status(await report(typeof req.body === 'string' ? req.body : req.rawBody?.toString() ?? JSON.stringify(req.body))).send(''); }
    if (!ok && origin) return res.status(403).send('Forbidden');
    if (path === '/wx') { const p = coord(req.query); return p ? json(await weather(p), 1800) : res.status(400).send('bad lat/lon'); }
    if (path === '/planes') { const p = coord(req.query), d = Math.min(100, Math.max(1, Math.round(Number(req.query.dist ?? 40)))); return p ? json(await planes(p, d), 8) : res.status(400).send('bad lat/lon'); }
    if (path === '/catalog') { res.set('Access-Control-Allow-Origin', '*'); return json(await repoFile('data/catalog.json'), 3 * 3600); }
    if (path === '/comets') { res.set('Access-Control-Allow-Origin', '*'); return json(await repoFile('data/comets.json'), 3 * 3600); }
    return res.status(404).send('not found');
  } catch (e) { return res.status(502).send(`error: ${String(e?.message ?? e).slice(0, 200)}`); }
});

async function statsHtml(env, all) {
  const W = all ? "1=1" : "x = 0";
  const q = async (sql) => await env.DB.prepare(sql).raw();
  const one = async (sql) => Number((await q(sql))[0]?.[0] ?? 0);
  const installs = await one(`SELECT COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'install'`);
  const firstNight = await one(`SELECT COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'night' AND json_extract(d, '$.f') = 1 AND iid IN (SELECT iid FROM sc_events WHERE name = 'install')`);
  const maxN = await q(`SELECT n, COUNT(*) FROM (SELECT iid, MAX(CAST(json_extract(d, '$.n') AS INTEGER)) AS n FROM sc_events WHERE ${W} AND name = 'night' GROUP BY iid) GROUP BY n ORDER BY n`);
  const reached = (k) => maxN.filter((r) => Number(r[0]) >= k).reduce((a, r) => a + Number(r[1]), 0);
  const any1 = reached(1);
  const days = await q(`SELECT iid, MAX(CAST(json_extract(d, '$.dsi') AS INTEGER)) FROM sc_events WHERE ${W} AND name = 'open' GROUP BY iid`);
  const dRet = (k) => days.filter((r) => Number(r[1]) >= k).length;
  const motion = await q(`SELECT json_extract(d, '$.s'), COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'motion' GROUP BY 1 ORDER BY 2 DESC`);
  const tour = await q(`SELECT json_extract(d, '$.s'), COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'tour' GROUP BY 1 ORDER BY 2 DESC`);
  const ends = await q(`SELECT SUM(CASE WHEN CAST(json_extract(d, '$.c') AS INTEGER) = 0 THEN 1 ELSE 0 END), COUNT(*), SUM(CASE WHEN json_extract(d, '$.dark') = 1 AND CAST(json_extract(d, '$.c') AS INTEGER) = 0 THEN 1 ELSE 0 END), SUM(CASE WHEN json_extract(d, '$.dark') = 1 THEN 1 ELSE 0 END) FROM sc_events WHERE ${W} AND name = 'end'`);
  const errs = await q(`SELECT json_extract(d, '$.m'), COUNT(*), COUNT(DISTINCT iid), MAX(v), MAX(ts) FROM sc_events WHERE ${W} AND name = 'err' GROUP BY 1 ORDER BY 2 DESC LIMIT 15`);
  const plats = await q(`SELECT p, COUNT(DISTINCT iid) FROM sc_events WHERE ${W} GROUP BY p`);
  const vers = await q(`SELECT v, COUNT(DISTINCT iid) FROM sc_events WHERE ${W} GROUP BY v ORDER BY MAX(ts) DESC LIMIT 6`);
  const plus = await q(`SELECT json_extract(d, '$.s'), COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'plus' GROUP BY 1`);
  // The tour (2026-10-25): where people said they were, own location or the time-zone city, the day-one reminder, the
  // big first target outside at night, and Match your sky. Distinct installs.
  const by = async (s, k) => q(`SELECT json_extract(d, '$.${k}'), COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'tour' AND json_extract(d, '$.s') = '${s}' GROUP BY 1 ORDER BY 2 DESC`);
  const tWhere = await by("where", "where"), tDone = await by("done", "where"), tLoc = await by("loc", "loc"), tRare = await by("rare", "pick");
  const tRemind = await one(`SELECT COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'tour' AND json_extract(d, '$.s') = 'remind'`);
  const tFin = await one(`SELECT COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'tour' AND json_extract(d, '$.s') = 'done'`);
  const tRareCaught = await one(`SELECT COUNT(DISTINCT e.iid) FROM sc_events e WHERE ${W.replace("x", "e.x")} AND e.name = 'tour' AND json_extract(e.d, '$.s') = 'rare' AND EXISTS (SELECT 1 FROM sc_events n WHERE n.iid = e.iid AND n.name = 'night' AND json_extract(n.d, '$.f') = 1)`);
  const mShown = await one(`SELECT COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'sky' AND json_extract(d, '$.s') = 'match-shown'`);
  const mDone = await q(`SELECT COUNT(DISTINCT iid), AVG(CAST(json_extract(d, '$.sb') AS REAL)) FROM sc_events WHERE ${W} AND name = 'sky' AND json_extract(d, '$.s') = 'match'`);
  // Compass and the "Nothing caught yet?" card (2026-10-25): how far people turn the sky when they line it up (big turns
  // mean poor compasses), and what the help card's three choices get.
  const cal = (await q(`SELECT COUNT(*), COUNT(DISTINCT iid), AVG(ABS(CAST(json_extract(d, '$.deg') AS REAL))), SUM(CASE WHEN ABS(CAST(json_extract(d, '$.deg') AS REAL)) >= 20 THEN 1 ELSE 0 END), SUM(CASE WHEN json_extract(d, '$.deg') IS NOT NULL THEN 1 ELSE 0 END) FROM sc_events WHERE ${W} AND name = 'calib' AND json_extract(d, '$.s') IS NULL`))[0] ?? [];
  const calRef = await q(`SELECT json_extract(d, '$.ref'), COUNT(*) FROM sc_events WHERE ${W} AND name = 'calib' AND json_extract(d, '$.s') IS NULL GROUP BY 1 ORDER BY 2 DESC`);
  const moonChk = await q(`SELECT json_extract(d, '$.s'), COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'calib' AND json_extract(d, '$.s') IN ('moon-ok', 'moon-off') GROUP BY 1`);
  const helpShown = await one(`SELECT COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'help' AND json_extract(d, '$.s') = 'shown'`);
  const helpPick = await q(`SELECT json_extract(d, '$.pick'), COUNT(*) FROM sc_events WHERE ${W} AND name = 'help' AND json_extract(d, '$.pick') IS NOT NULL GROUP BY 1 ORDER BY 2 DESC`);
  const list = (rs) => rs.map((r) => `${r[0] ?? "–"}: ${r[1]}`).join(" · ") || "–";
  const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : "–");
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const row = (k, v, sub = "") => `<tr><th>${k}</th><td>${v}</td><td class="m">${sub}</td></tr>`;
  const e = (ends[0] ?? [0, 0, 0, 0]).map((n) => Number(n) || 0);
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Space Collector · usage</title>
<style>body{margin:0;padding:24px 16px;background:#080f1b;color:#e8eef6;font:15px/1.45 -apple-system,system-ui,sans-serif}h1{font-size:22px;color:#fff2b3;margin:0 0 4px}h2{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#fa8127;margin:26px 0 8px}
table{border-collapse:collapse;width:100%;max-width:760px}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #22324a;vertical-align:top}th{font-weight:500;color:#c9d3de;width:46%}td{color:#fff2b3;font-variant-numeric:tabular-nums}.m{color:#9fb0c6;font-size:13px}p{color:#9fb0c6;max-width:760px}a{color:#fa8127}</style>
<h1>Space Collector · usage</h1><p>Anonymous: a random ID per install, no places or names. ${all ? 'Including test builds · <a href="?">players only</a>' : 'Players only (test builds left out) · <a href="?all=1">include test builds</a>'}. Updated ${new Date().toUTCString()}.</p>
<h2>The first night</h2><table>${row("New installs", String(installs))}${row("Caught a card on their first night", pct(firstNight, installs), `${firstNight} of ${installs}`)}${row("Finished the tour", esc(tour.map((r) => `${r[0]}: ${r[1]}`).join(" · ") || "–"))}${row("Motion", esc(motion.map((r) => `${r[0]}: ${r[1]}`).join(" · ") || "–"), "live = the phone steers; drag = finger; none = no sensors")}</table>
<h2>The tour</h2><table>${row("Location", esc(list(tLoc)), "own = shared it; tz = the time-zone city")}${row("Set the day-one reminder", pct(tRemind, tFin), `${tRemind} of ${tFin} who finished`)}${row("Big first target, outside at night", esc(list(tRare)), `${tRareCaught} caught a card that night`)}${row("Match your sky", pct(Number(mDone[0]?.[0] ?? 0), mShown), `${mDone[0]?.[0] ?? 0} of ${mShown} shown${mDone[0]?.[1] ? ` · average ${Number(mDone[0][1]).toFixed(1)}` : ""}`)}</table>
<h2>Compass</h2><table>${row("Lined up the sky", String(Number(cal[0]) || 0), `${Number(cal[1]) || 0} installs · against: ${esc(list(calRef))}`)}${row("Average turn", cal[4] ? `${Math.round(Number(cal[2]))}°` : "–", "how far people turned the sky to match the real one")}${row("Turned 20° or more", pct(Number(cal[3]) || 0, Number(cal[4]) || 0), "a big turn means a poor compass")}${row("Moon check", esc(list(moonChk)), "moon-off = the drawn Moon was off")}</table>
<h2>Nothing caught yet?</h2><table>${row("Help card shown", String(helpShown), "after 10 min outside at night with no catch")}${row("What they picked", esc(list(helpPick)), "show = be shown something · line = line up · more = see more stars · close")}</table>
<h2>Coming back (nights with a catch)</h2><table>${row("Caught on 1+ nights", String(any1))}${row("2+ nights", pct(reached(2), any1), String(reached(2)))}${row("3+ nights", pct(reached(3), any1), String(reached(3)))}${row("7+ nights", pct(reached(7), any1), String(reached(7)))}${row("14+ nights", pct(reached(14), any1), String(reached(14)))}</table>
<h2>Coming back (days since install, any open)</h2><table>${row("Opened again on day 1+", pct(dRet(1), days.length), `${dRet(1)} of ${days.length}`)}${row("Day 3+", pct(dRet(3), days.length), String(dRet(3)))}${row("Day 7+", pct(dRet(7), days.length), String(dRet(7)))}${row("Day 28+", pct(dRet(28), days.length), String(dRet(28)))}</table>
<h2>Sessions</h2><table>${row("Ended without a catch", pct(Number(e[0]), Number(e[1])), `${e[0]} of ${e[1]}`)}${row("…of those after dark", pct(Number(e[2]), Number(e[3])), `${e[2]} of ${e[3]} dark sessions`)}${row("Plus", esc(plus.map((r) => `${r[0]}: ${r[1]}`).join(" · ") || "–"))}</table>
<h2>Errors</h2><table>${errs.map((r) => row(esc(r[0]), String(r[1]), `${r[2]} installs · v${esc(r[3])} · ${new Date(Number(r[4])).toISOString().slice(0, 16).replace("T", " ")}`)).join("") || row("None reported", "")}</table>
<h2>Who</h2><table>${row("Platforms", esc(plats.map((r) => `${r[0]}: ${r[1]}`).join(" · ")))}${row("Latest versions", esc(vers.map((r) => `${r[0]}: ${r[1]}`).join(" · ")))}</table>`;
  return html;
}
