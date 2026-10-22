import { webkit } from 'playwright';
import { setup } from './common.mjs';
export const OUT = '/private/tmp/claude-501/-Users-sevaan/04a71ae5-eb6a-4f90-ae24-1b4114851804/scratchpad/playtest-slick-ux/';
const EXPOSE = '\n;window.__store = { state, sky }; window.__t = { showCaptureCard, closePanel, obFinish, cardsTurnOver, toggleNight, openAround, openPassRemind, showVTab, openSky, openCollection, openDebug, prFold, intoBinder, setRev: (v) => { revealIntoBinder = v; }, get collectionOpen() { return collectionOpen; }, get activePanel() { return activePanel; } };';
export async function start({ when, small = false, plus = false } = {}) {
  const browser = await webkit.launch();
  const { p, ctx, errs } = await setup(browser, 'phone', { when });
  await ctx.route(/\/js\/main\.js/, async (route) => { const r = await route.fetch(); await route.fulfill({ response: r, body: (await r.text()) + EXPOSE, headers: { ...r.headers(), 'content-type': 'text/javascript' } }); });
  if (small) await p.setViewportSize({ width: 375, height: 667 });
  if (plus) await p.evaluate(() => localStorage.setItem('plusTest', '1'));
  await p.reload(); await p.waitForTimeout(9000);
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  return { browser, p, ctx, errs };
}
export async function frames(p, name, n, gap) { for (let i = 0; i < n; i++) { await p.screenshot({ path: `${OUT}${name}-${String(i).padStart(2, '0')}.png`, scale: 'css' }); if (gap) await p.waitForTimeout(gap); } }
export const shot = (p, name) => p.screenshot({ path: `${OUT}${name}.png`, scale: 'css' });
