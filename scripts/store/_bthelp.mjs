import { setup, DEVICES } from './common.mjs';
export const SHOT = '/private/tmp/claude-501/-Users-sevaan/04a71ae5-eb6a-4f90-ae24-1b4114851804/scratchpad/playtest-slick-bugs/';
DEVICES.small = { ...DEVICES.phone, viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, safeTop: 20, safeBottom: 0 };
export async function setup2(browser, kind = 'phone', opts = {}) {
  const { p, ctx, errs } = await setup(browser, kind, opts);
  await ctx.route(/\/js\/main\.js/, async (route) => { const r = await route.fetch(); let b = await r.text();
    b = b.replace("if (!isNative()) return 'app-only';", "if (!isNative()) { if (window.__fakeOn) { const id = newRemindId(); if (key) { remindIds.set(key, { id, at, title, body }); saveRems(); } return 'on'; } return 'app-only'; }");
    b = b.replace('function buzz(p) {', 'function buzz(p) { (window.__buzz ??= []).push([p, performance.now() | 0]);');
    b += `\n;window.__store = { state, sky }; window.__h = { obFinish, odFuse, cardsTurnOver, toggleNight, prFold, intoBinder, openPassRemind, openAround, openSky, openCollection, closeCollection, closePanel, openPanel, showCaptureCard, recordSighting, now, setRB: (v) => { revealIntoBinder = v; }, get rb() { return revealIntoBinder; }, get ap() { return activePanel; }, get odT() { return odNowTimer; }, get co() { return collectionOpen; }, get arFlash() { return arFlash; }, get arPings() { return [...arPings.keys()]; }, setPan: (v) => { arPan = v; }, get arPan() { return arPan; }, get arRaf() { return arRaf; } };`;
    await route.fulfill({ response: r, body: b, headers: { ...r.headers(), 'content-type': 'text/javascript' } }); });
  const cons = [];
  p.on('console', (m) => { if (m.type() === 'error') cons.push(m.text()); });
  await p.reload(); await p.waitForTimeout(8000);
  return { p, ctx, errs, cons };
}
export const col = (p) => p.frames().find((f) => f.url().includes('cards.html'));
