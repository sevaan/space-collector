// Space Collector pass alerts (2026-10-10, playtest #14). Real push notifications for "a bright pass in 10 minutes".
// The app works out tonight's passes on the phone and sends this server a short list of alert times; this server keeps
// them and pushes each one when it's due. No location or sightings are stored: only the push subscription and the
// next ~36 hours of alert texts.
//
// Deploy on Val Town (same account as the plane relay):
//   1. New val → HTTP. Paste this whole file. Copy its URL (…web.val.run) into PUSH in js/push.js.
//   2. New val → Interval (cron), every minute if your plan allows (otherwise 5). Paste just:
//        import { cron } from "<the HTTP val's module URL, from its menu: Copy → Module URL>";
//        export default cron;
//   The first request makes and stores the VAPID keys (std/blob "sc-vapid"); nothing to configure.
//
//   GET  /vapid        -> { publicKey }
//   POST /schedule     { sub: PushSubscriptionJSON, alerts: [{ at, title, body, tag }] }  (replaces that phone's list)
//   POST /unsubscribe  { endpoint }
import webpush from "npm:web-push@3.6.7";
import { blob } from "https://esm.town/v/std/blob";

const ALLOWED = [/^https:\/\/sevaan\.github\.io$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
const SUBJECT = "https://sevaan.github.io/space-collector/";
const EARLY = 6 * 60_000; // send up to 6 min early, so a 5-minute cron still lands before the pass
type Alert = { at: number; title: string; body: string; tag?: string };
type Entry = { sub: { endpoint: string; keys: { p256dh: string; auth: string } }; alerts: Alert[]; seen: number };

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
    subs[sub.endpoint] = { sub, alerts, seen: now };
    await save(subs);
    return json({ ok: true, alerts: alerts.length });
  }
  return json({ error: "not found" }, 404);
}

// Run every minute (or five) by the Interval val: push whatever is due, drop dead subscriptions and stale phones.
export async function cron() {
  const k = await vapid();
  webpush.setVapidDetails(SUBJECT, k.publicKey, k.privateKey);
  const subs = await load(), now = Date.now();
  for (const [endpoint, e] of Object.entries(subs)) {
    if (now - e.seen > 14 * 86400_000) { delete subs[endpoint]; continue; } // the app hasn't checked in for two weeks
    const due = e.alerts.filter((a) => a.at - EARLY <= now && a.at > now - 10 * 60_000);
    e.alerts = e.alerts.filter((a) => a.at - EARLY > now);
    for (const a of due) {
      try { await webpush.sendNotification(e.sub, JSON.stringify(a), { TTL: 600, urgency: "high" }); }
      catch (err: any) { if (err?.statusCode === 404 || err?.statusCode === 410) { delete subs[endpoint]; break; } }
    }
  }
  await save(subs);
}
