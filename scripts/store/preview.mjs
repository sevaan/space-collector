// App Store captures, step 3 of 3: the App Preview videos (the clips that autoplay on the store page). Records the real
// app in Chromium with the DevTools screencast while a script plays it, then ffmpeg makes an App Store-ready H.264 MP4 at
// 30 fps with a silent stereo track: store/appstore/<device>/preview.mp4 (iPhone 886 × 1920, iPad 1200 × 1600), ~27 s.
// The 2026-10-24 cut (marketing review, Sevaan: "captions, let's see it"): the catch lands by ~4 s (it autoplays muted in
// search results), then Tonight's countdown and Show me, the shiny Hubble, the Moon's phases, the patch wall, with a few
// short captions over the header strip, clear of the cards (window.__cap, drawn in the page so they're in the footage).
// Usage: node scripts/store/preview.mjs [phone|pad|all] [--when=…]   (needs ffmpeg and the local server on 8765)
import { chromium } from 'playwright';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, DEVICES, setup, hideNoise, jumpToHero, storeExtras, storeStorage, captureNight } from './common.mjs';

const args = process.argv.slice(2), which = args.find((a) => !a.startsWith('--')) ?? 'all', when = args.find((a) => a.startsWith('--when='))?.slice(7);
const OUT = { phone: [886, 1920], pad: [1200, 1600] };
// The phone records at 443 × 960 @2x so the frames are exactly 886 × 1920; the iPad at its own size, scaled to 1200 × 1600.
const REC = { phone: { ...DEVICES.phone, viewport: { width: 443, height: 960 }, deviceScaleFactor: 2 }, pad: DEVICES.pad };

for (const kind of which === 'all' ? Object.keys(OUT) : [which]) {
  DEVICES[kind] = REC[kind];
  const b = await chromium.launch();
  const night = captureNight(when), { p, ctx, errs } = await setup(b, kind, { when, heroIss: true, clear: true, extra: storeExtras(night), storage: storeStorage(night) });
  await hideNoise(p);
  // Captions: short, over the header strip (clear of every card), ~2 s each, fading in and out (the app's own display font and colours).
  await p.evaluate(() => { const c = document.createElement('div'); c.id = 'sc-cap';
    c.style.cssText = 'position:fixed;left:50%;top:calc(var(--safe-top,0px) + 14px);transform:translate(-50%,8px);z-index:2147483647;pointer-events:none;opacity:0;transition:opacity .35s,transform .35s;padding:10px 18px;border-radius:14px;background:rgba(8,15,27,.82);box-shadow:0 0 0 1px #fff2b326,0 10px 30px rgba(0,0,0,.5);color:#fff2b3;font:400 22px/1.15 "SC Display",Impact,sans-serif;letter-spacing:.01em;text-align:center;white-space:nowrap';
    document.body.append(c); let t = 0;
    window.__cap = (text, ms = 2000) => { clearTimeout(t); c.textContent = text; c.style.opacity = '1'; c.style.transform = 'translate(-50%,0)'; t = setTimeout(() => { c.style.opacity = '0'; c.style.transform = 'translate(-50%,8px)'; }, ms); }; });
  const cap = (text, ms) => p.evaluate(([t, m]) => window.__cap(t, m), [text, ms]);
  const tmp = join(ROOT, 'scripts/.cache/preview-' + kind); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const cdp = await ctx.newCDPSession(p), frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => { const f = join(tmp, `${String(frames.length).padStart(5, '0')}.jpg`); writeFileSync(f, Buffer.from(data, 'base64')); frames.push({ f, t: metadata.timestamp }); await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); });
  const w = (ms) => p.waitForTimeout(ms);
  // The script. Steering goes through the app's own drag view, eased, so it moves like a hand.
  await jumpToHero(p); // the same hero as the screenshots: the ISS (reference-accurate art), not whatever is up
  await p.evaluate(() => { const st = window.__store.state; st.drag.on = true; st.pinnedId = null; window.__pan = 0.06; window.__aim = null;
    const step = () => { const s = window.__store.state;
      if (window.__aim != null) { const it = s.items.find((x) => x.obj.id === window.__aim); if (it) { let da = ((it.look.az - s.drag.az + 540) % 360) - 180; s.drag.az = (s.drag.az + da * (window.__ease ?? 0.06) + 360) % 360; s.drag.el += (Math.max(it.look.el, 15) - s.drag.el) * (window.__ease ?? 0.06); } }
      else s.drag.az = (s.drag.az + window.__pan + 360) % 360;
      requestAnimationFrame(step); };
    st.drag.el = 32; requestAnimationFrame(step); });
  await w(600);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: OUT[kind][0], maxHeight: OUT[kind][1], everyNthFrame: 1 });
  // 0–4 s: a quick swing past two real things, lock on the hero, Collect (the catch has to land early: muted autoplay).
  const tour = await p.evaluate(() => { const s = window.__store.state, own = new Set(s.sightings.map((x) => String(x.objectId)));
    const ok = s.items.filter((x) => x.look?.visible && x.look.el > 18 && x.look.el < 75 && !own.has(String(x.obj.id)) && !x.obj.family && x.obj.type !== 'station' && x.obj.type !== 'debris');
    return ok.slice(0, 2).sort((a, b) => a.look.az - b.look.az).map((x) => [x.obj.id, x.obj.name]); });
  console.log(kind, 'tour', tour.map((t) => t[1]).join(' → '));
  await cap('Point your phone at the night sky', 2200);
  await p.evaluate(() => { window.__ease = 0.16; });
  for (const [id] of tour) { await p.evaluate((id) => { window.__aim = id; }, id); await w(650); }
  const target = await p.evaluate(() => { const s = window.__store.state, own = new Set(s.sightings.map((x) => String(x.objectId))), rank = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    const it = s.items.filter((x) => x.look?.visible && x.look.el > 12 && !own.has(String(x.obj.id)) && !x.obj.family).sort((a, b) => (b.obj.type === 'station') - (a.obj.type === 'station') || (rank[a.obj.tier] ?? 5) - (rank[b.obj.tier] ?? 5) || (a.look.mag ?? 9) - (b.look.mag ?? 9))[0];
    window.__aim = it?.obj.id ?? null; return it ? it.obj.name : null; });
  console.log(kind, 'target', target);
  await w(1900);                                                                             // swing round, lock on
  await p.click('#d-cta').catch((e) => console.log(kind, 'no Collect', e.message.slice(0, 60)));
  // 4–9 s: the card flies out and turns over
  await w(900); await cap('Every catch is a card', 2600); await w(4000);
  await p.locator('#reveal .x-close').first().click().catch(() => {}); await w(500);
  await p.evaluate(() => { window.__aim = null; window.__pan = 0; });
  // 9–14 s: Tonight: the next new card counting down; Show me turns the sky to where it will rise
  await p.click('#nav-sky').catch(() => {}); await w(900); await cap('Know when to look up', 2600); await w(1900);
  await p.locator('#visible .nh-go').first().click().catch((e) => console.log(kind, 'no Show me', e.message.slice(0, 60))); await w(2300);
  // 14–19 s: the Collection, the shiny Hubble tilting
  await p.click('#nav-collection'); await w(1700);
  const f = p.frameLocator('#collection-frame');
  await f.locator('.card-tile', { hasText: /hubble/i }).first().click().catch(() => {}); await w(1300);
  await cap('Lucky catches shine', 2200);
  { const r = await f.locator('#slot .card').first().boundingBox().catch(() => null);
    if (r) for (const [x, y] of [[0.5, 0.5], [0.2, 0.25], [0.8, 0.3], [0.7, 0.75], [0.3, 0.6]]) await p.mouse.move(r.x + r.width * x, r.y + r.height * y, { steps: 14 }); }
  await w(600);
  await f.locator('#viewer').evaluate((v) => v.open && v.close()).catch(() => {}); await w(500);
  // 19–23 s: the Moon and its phase stamps
  await f.locator('.card-tile', { hasText: /moon/i }).first().click().catch(() => {}); await w(1200);
  await cap('Catch every phase', 2000); await w(2400);
  await f.locator('#viewer').evaluate((v) => v.open && v.close()).catch(() => {}); await w(500);
  // 23–27 s: the patch wall
  await f.locator('#tab-patches').click().catch(() => {}); await w(1000);
  await cap('Free to play · no ads', 2600); await w(3000);
  await cdp.send('Page.stopScreencast'); await w(300);
  // Frames come when the page changes; give each its real duration, then make a constant 30 fps.
  const list = frames.map((fr, i) => `file '${fr.f}'\nduration ${(((frames[i + 1]?.t ?? fr.t + 1) - fr.t)).toFixed(4)}`).join('\n') + `\nfile '${frames.at(-1).f}'\n`;
  writeFileSync(join(tmp, 'list.txt'), list);
  const out = join(ROOT, 'store/appstore', kind); mkdirSync(out, { recursive: true });
  const [W, H] = OUT[kind];
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'), '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-vf', `scale=${W}:${H}:flags=lanczos,fps=30,format=yuv420p`, '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17', '-preset', 'slow', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', join(out, 'preview.mp4')]);
  console.log(kind, frames.length, 'frames →', join(out, 'preview.mp4'), errs.length ? errs : '');
  await b.close();
}
