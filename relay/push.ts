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
import webpush from "npm:web-push@3.6.7";
import { blob } from "https://esm.town/v/std/blob";

const ALLOWED = [/^https:\/\/sevaan\.github\.io$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
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
  const origin = req.headers.get("Origin") ?? "";
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
