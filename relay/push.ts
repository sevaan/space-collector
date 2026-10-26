// Space Collector pass alerts (2026-10-10, playtest #14). Real push notifications for "a bright pass in 10 minutes".
// The app works out tonight's passes on the phone and sends this server a short list of alert times; this server keeps
// them and pushes each one when it's due. No sightings are stored: only the push subscription, the next ~36 hours of
// alert texts and a rounded place (~10 km) used to check the weather just before sending.
//
// Deploy on Val Town (same account as the plane relay):
//   1. A val (sevaan/space-collector-push, public); this file is its main.ts with an HTTP trigger. Its URL is PUSH in js/pass-alerts.js.
//   2. In the same val, a second file cron.ts with a Cron trigger (every 15 min, the free plan's minimum):
//        import { cron } from "./main.ts";
//        export default cron;
//   The first request makes and stores the VAPID keys (std/blob "sc-vapid"); nothing to configure.
//
//   GET  /vapid        -> { publicKey }
//   POST /schedule     { sub: PushSubscriptionJSON, alerts: [{ at, title, body, tag }], place?: { lat, lon } }  (replaces that phone's list;
//                      place is rounded to 1 decimal and used only to check the weather before sending)
//   POST /unsubscribe  { endpoint }
//
// Anonymous usage and error reports (2026-10-24, Sevaan: "how do I know if people are coming back?"). The app sends small
// batches of game events, tied only to a random ID made on the phone (no location, no names, no device IDs), and they're
// kept in this val's SQLite. Settings → Help → "Share anonymous usage" turns it off.
//   POST /t      text/plain JSON { i: install id, v: app version, p: ios|android|web, x: 1 for test builds, e: [[name, ms, data]] }
//   GET  /stats  the dashboard (aggregates only): first-night catch rate, nights and days people come back, motion,
//                the tour, sessions without a catch, top errors, versions. ?all=1 includes test builds.
import webpush from "npm:web-push@3.6.7";
import { blob } from "https://esm.town/v/std/blob";
import { sqlite } from "https://esm.town/v/std/sqlite";

const ALLOWED = [/^https:\/\/sevaan\.github\.io$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
const APP_ORIGINS = [...ALLOWED, /^capacitor:\/\/localhost$/, /^https:\/\/localhost$/, /^https:\/\/spacecollector\.app$/]; // the native apps' web views, for usage reports
const SUBJECT = "https://sevaan.github.io/space-collector/";
// How often the cron runs (Val Town free plan: every 15 min, the minimum). Alerts go out up to one interval early,
// never late; the text says the pass time, so early is fine. If the cron ever runs more often, lower CRON_MINUTES.
const CRON_MINUTES = 15;
const EARLY = (CRON_MINUTES - 1) * 60_000;
type Alert = { at: number; title: string; body: string; tag?: string };
type Place = { lat: number; lon: number };
type Entry = { sub: { endpoint: string; keys: { p256dh: string; auth: string } }; alerts: Alert[]; seen: number; place?: Place };

// Right before sending, is the sky usable there? (2026-10-12, Sevaan got a "look up" alert in fog.) Open-Meteo's current
// conditions at the phone's rounded place (1 decimal, ~10 km). Fog, rain, snow, storms or more than 40% cloud -> skip.
// If the weather can't be fetched, send anyway.
const BAD = (code: number) => code === 45 || code === 48 || (code >= 51 && code <= 67) || (code >= 71 && code <= 86) || code >= 95;
async function skyClear(p?: Place): Promise<boolean> {
  if (!p) return true;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=cloud_cover,weather_code`);
    const c = (await r.json())?.current; if (!c) return true;
    return !(BAD(Number(c.weather_code)) || Number(c.cloud_cover) > 40);
  } catch { return true; }
}

async function vapid(): Promise<{ publicKey: string; privateKey: string }> {
  let k = await blob.getJSON("sc-vapid");
  if (!k?.publicKey) { k = webpush.generateVAPIDKeys(); await blob.setJSON("sc-vapid", k); }
  return k;
}
const load = async (): Promise<Record<string, Entry>> => (await blob.getJSON("sc-subs")) ?? {};
const save = (subs: Record<string, Entry>) => blob.setJSON("sc-subs", subs);

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("Origin") ?? "", path0 = new URL(req.url).pathname;
  if (path0 === "/t") return report(req, origin);
  if (path0 === "/stats" && req.method === "GET") return stats(new URL(req.url).searchParams.get("all") === "1");
  if (!ALLOWED.some((re) => re.test(origin))) return new Response("Forbidden", { status: 403 });
  const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
  if (req.method === "OPTIONS") return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "GET, POST" } });
  const path = new URL(req.url).pathname;
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "GET" && path === "/vapid") return json({ publicKey: (await vapid()).publicKey });
  if (req.method !== "POST") return json({ error: "not found" }, 404);
  let body: any; try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const subs = await load();
  if (path === "/unsubscribe") { delete subs[String(body?.endpoint)]; await save(subs); return json({ ok: true }); }
  if (path === "/schedule") {
    const sub = body?.sub;
    if (!sub?.endpoint || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) return json({ error: "bad subscription" }, 400);
    const now = Date.now();
    const alerts: Alert[] = (Array.isArray(body.alerts) ? body.alerts : [])
      .filter((a: Alert) => Number.isFinite(a?.at) && a.at > now && a.at < now + 36 * 3600_000)
      .slice(0, 12).map((a: Alert) => ({ at: a.at, title: String(a.title).slice(0, 80), body: String(a.body).slice(0, 180), tag: String(a.tag ?? "").slice(0, 40) }));
    const pl = body?.place, place = pl && Number.isFinite(pl.lat) && Number.isFinite(pl.lon) ? { lat: Math.round(pl.lat * 10) / 10, lon: Math.round(pl.lon * 10) / 10 } : undefined;
    subs[sub.endpoint] = { sub, alerts, seen: now, place };
    await save(subs);
    return json({ ok: true, alerts: alerts.length });
  }
  return json({ error: "not found" }, 404);
}

// Run by cron.ts on its Cron trigger: push whatever is due, drop dead subscriptions and stale phones.
export async function cron() {
  const k = await vapid();
  webpush.setVapidDetails(SUBJECT, k.publicKey, k.privateKey);
  const subs = await load(), now = Date.now();
  for (const [endpoint, e] of Object.entries(subs)) {
    if (now - e.seen > 14 * 86400_000) { delete subs[endpoint]; continue; } // the app hasn't checked in for two weeks
    const due = e.alerts.filter((a) => a.at - EARLY <= now && a.at > now - 10 * 60_000);
    e.alerts = e.alerts.filter((a) => a.at - EARLY > now);
    if (due.length && !(await skyClear(e.place))) continue; // clouded over: say nothing
    for (const a of due) {
      try { await webpush.sendNotification(e.sub, JSON.stringify(a), { TTL: 600, urgency: "high" }); }
      catch (err: any) { if (err?.statusCode === 404 || err?.statusCode === 410) { delete subs[endpoint]; break; } }
    }
  }
  await save(subs);
}

// ---------- Anonymous usage and error reports ----------
const NAMES = new Set(["install", "open", "night", "end", "tour", "motion", "calib", "plus", "err", "sky", "help"]);
async function ensureTable() {
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS sc_events (ts INTEGER, iid TEXT, v TEXT, p TEXT, x INTEGER, name TEXT, d TEXT)`);
}
async function report(req: Request, origin: string): Promise<Response> {
  const ok = APP_ORIGINS.some((re) => re.test(origin));
  const cors = ok ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
  if (!ok) return new Response("Forbidden", { status: 403 });
  if (req.method === "OPTIONS") return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" } });
  if (req.method !== "POST") return new Response("not found", { status: 404, headers: cors });
  let b: any; try { b = JSON.parse((await req.text()).slice(0, 40_000)); } catch { return new Response("bad", { status: 400, headers: cors }); }
  const iid = String(b?.i ?? ""); if (!/^[a-f0-9]{16,40}$/.test(iid)) return new Response("bad id", { status: 400, headers: cors });
  const v = String(b?.v ?? "").slice(0, 20), p = ["ios", "android", "web"].includes(b?.p) ? b.p : "web", x = b?.x ? 1 : 0, now = Date.now();
  const rows = (Array.isArray(b?.e) ? b.e : []).slice(0, 60).filter((e: any) => Array.isArray(e) && NAMES.has(e[0]))
    .map((e: any) => ({ sql: "INSERT INTO sc_events (ts, iid, v, p, x, name, d) VALUES (?, ?, ?, ?, ?, ?, ?)", args: [Math.min(now, Math.max(now - 30 * 86400_000, Number(e[1]) || now)), iid, v, p, x, String(e[0]), JSON.stringify(e[2] ?? {}).slice(0, 600)] }));
  if (rows.length) { await ensureTable(); await sqlite.batch(rows); }
  return new Response(null, { status: 204, headers: cors });
}
async function stats(all: boolean): Promise<Response> {
  await ensureTable();
  const W = all ? "1=1" : "x = 0";
  const q = async (sql: string) => (await sqlite.execute(sql)).rows as any[];
  const one = async (sql: string) => Number((await q(sql))[0]?.[0] ?? 0);
  const installs = await one(`SELECT COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'install'`);
  const firstNight = await one(`SELECT COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'night' AND json_extract(d, '$.f') = 1 AND iid IN (SELECT iid FROM sc_events WHERE name = 'install')`);
  const maxN = await q(`SELECT n, COUNT(*) FROM (SELECT iid, MAX(CAST(json_extract(d, '$.n') AS INTEGER)) AS n FROM sc_events WHERE ${W} AND name = 'night' GROUP BY iid) GROUP BY n ORDER BY n`);
  const reached = (k: number) => maxN.filter((r) => Number(r[0]) >= k).reduce((a, r) => a + Number(r[1]), 0);
  const any1 = reached(1);
  const days = await q(`SELECT iid, MAX(CAST(json_extract(d, '$.dsi') AS INTEGER)) FROM sc_events WHERE ${W} AND name = 'open' GROUP BY iid`);
  const dRet = (k: number) => days.filter((r) => Number(r[1]) >= k).length;
  const motion = await q(`SELECT json_extract(d, '$.s'), COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'motion' GROUP BY 1 ORDER BY 2 DESC`);
  const tour = await q(`SELECT json_extract(d, '$.s'), COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'tour' GROUP BY 1 ORDER BY 2 DESC`);
  const ends = await q(`SELECT SUM(CASE WHEN CAST(json_extract(d, '$.c') AS INTEGER) = 0 THEN 1 ELSE 0 END), COUNT(*), SUM(CASE WHEN json_extract(d, '$.dark') = 1 AND CAST(json_extract(d, '$.c') AS INTEGER) = 0 THEN 1 ELSE 0 END), SUM(CASE WHEN json_extract(d, '$.dark') = 1 THEN 1 ELSE 0 END) FROM sc_events WHERE ${W} AND name = 'end'`);
  const errs = await q(`SELECT json_extract(d, '$.m'), COUNT(*), COUNT(DISTINCT iid), MAX(v), MAX(ts) FROM sc_events WHERE ${W} AND name = 'err' GROUP BY 1 ORDER BY 2 DESC LIMIT 15`);
  const plats = await q(`SELECT p, COUNT(DISTINCT iid) FROM sc_events WHERE ${W} GROUP BY p`);
  const vers = await q(`SELECT v, COUNT(DISTINCT iid) FROM sc_events WHERE ${W} GROUP BY v ORDER BY MAX(ts) DESC LIMIT 6`);
  const plus = await q(`SELECT json_extract(d, '$.s'), COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'plus' GROUP BY 1`);
  // The tour (2026-10-25): where people said they were, own location or the time-zone city, the day-one reminder, the
  // big first target outside at night, and Match your sky. Distinct installs.
  const by = async (s: string, k: string) => q(`SELECT json_extract(d, '$.${k}'), COUNT(DISTINCT iid) FROM sc_events WHERE ${W} AND name = 'tour' AND json_extract(d, '$.s') = '${s}' GROUP BY 1 ORDER BY 2 DESC`);
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
  const list = (rs: any[]) => rs.map((r) => `${r[0] ?? "–"}: ${r[1]}`).join(" · ") || "–";
  const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "–");
  const esc = (t: unknown) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const row = (k: string, v: string, sub = "") => `<tr><th>${k}</th><td>${v}</td><td class="m">${sub}</td></tr>`;
  const e = (ends[0] ?? [0, 0, 0, 0]).map((n: unknown) => Number(n) || 0);
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
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
