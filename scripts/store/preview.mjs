// App Store captures, step 3 of 3: the App Preview videos (the clips that autoplay on the store page). Records the real
// app in Chromium with the DevTools screencast while a script plays it, then ffmpeg makes an App Store-ready H.264 MP4 at
// 30 fps with a silent stereo track: store/appstore/<device>/preview.mp4 (iPhone 886 × 1920, iPad 1200 × 1600), ~27 s.
// The 2026-10-24 cut (marketing review, Sevaan: "captions, let's see it"): the catch lands by ~4 s (it autoplays muted in
// search results), then Tonight's countdown and Show me, the shiny Hubble, the Moon's phases, the patch wall, with a few
// short captions over the header strip, clear of the cards (window.__cap, drawn in the page so they're in the footage).
// Usage: node scripts/store/preview.mjs [phone|pad|all] [--when=…]   (needs ffmpeg and the local server on 8765)
import { chromium } from 'playwright';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
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
  // Captions (2026-10-24, Sevaan picked design/caption-styles.html D, moved to the bottom): the app's Russo One, big and
  // cream with an orange glow, the key word in orange, slamming in low on the screen for ~2.4 s.
  await p.evaluate(() => { const c = document.createElement('div'); c.id = 'sc-cap';
    c.style.cssText = 'position:fixed;left:5%;right:5%;bottom:21%;z-index:2147483647;pointer-events:none;opacity:0;text-align:center;text-wrap:balance;color:#fff2b3;font:400 clamp(26px,7.4vw,46px)/1.05 "SC Display",Impact,sans-serif;letter-spacing:.005em;text-shadow:0 0 18px rgba(250,129,39,.55),0 3px 0 #000,0 0 26px rgba(0,0,0,.95),0 0 4px #000';
    document.body.append(c); let t = 0;
    window.__cap = (html, ms = 2400) => { clearTimeout(t); c.innerHTML = html.replace(/\*(.+?)\*/g, '<span style="color:#fa8127">$1</span>');
      c.getAnimations().forEach((a) => a.cancel());
      c.animate([{ opacity: 0, transform: 'scale(1.7)', filter: 'blur(4px)' }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }], { duration: 420, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'forwards' });
      t = setTimeout(() => c.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(10px)' }], { duration: 320, fill: 'forwards' }), ms); }; });
  const cap = (text, ms) => p.evaluate(([t, m]) => window.__cap(t, m), [text, ms]);
  const tmp = join(ROOT, 'scripts/.cache/preview-' + kind); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const cdp = await ctx.newCDPSession(p), frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => { const f = join(tmp, `${String(frames.length).padStart(5, '0')}.jpg`); writeFileSync(f, Buffer.from(data, 'base64')); frames.push({ f, t: metadata.timestamp }); await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); });
  // The app's sounds, timed in real time here (the page's clock jumps between beats).
  const sfxReal = []; await p.exposeFunction('__sfxReal', (n, delay = 0) => { sfxReal.push([n, Date.now() / 1000 + delay]); });
  const w = (ms) => p.waitForTimeout(ms);
  const at = (iso) => p.clock.setSystemTime(new Date(iso));
  // Steering goes through the app's own drag view, eased, so it moves like a hand: __aim = an object id, or __aimAt = {ra, dec}.
  await p.evaluate(() => { const st = window.__store.state; st.drag.on = true; st.pinnedId = null; window.__pan = 0.05; window.__aim = null; window.__aimAt = null;
    const step = () => { const s = window.__store.state, e = window.__ease ?? 0.06; let az = null, el = null;
      if (window.__aim != null) { const it = s.items.find((x) => x.obj.id === window.__aim); if (it) { az = it.look.az; el = it.look.el; } }
      else if (window.__aimAt) { const q = window.__store.skyAt(window.__aimAt.ra, window.__aimAt.dec); az = q.az; el = q.el; }
      if (az != null) { const da = ((az - s.drag.az + 540) % 360) - 180; s.drag.az = (s.drag.az + da * e + 360) % 360; s.drag.el += (Math.max(el, 12) - s.drag.el) * e; }
      else s.drag.az = (s.drag.az + window.__pan + 360) % 360;
      requestAnimationFrame(step); };
    st.drag.el = 38; requestAnimationFrame(step); });
  // Script A (2026-10-24 writers' room, Sevaan's pick): what it is → you keep it → when to look → a skill → a secret → the name.
  // The page clock jumps between beats (Playwright setSystemTime), each a cut: the ISS at 5:55 AM Oct 18, the rest that evening.
  for (let i = 0; i < 30 && !(await p.evaluate(() => !!window.__store.state.tonight)); i++) await w(1000);
  // Before recording: find a rocket stage that slips into Earth's shadow with nothing else in the circle, to the second
  // (the planner only knows the minute; the app's own countdown, sky.fade, gives the exact moment).
  const cands = await p.evaluate(() => { const st = window.__store.state, T = st.tonight, own = new Set(st.sightings.map((s) => String(s.cardKey)));
    return T.passes.filter((x) => x.eclipseAt && x.peakEl > 30 && (x.eclipseEl ?? 0) > 25 && x.mag < 4 && x.eclipseAt > Date.parse('2026-10-17T19:52:00-04:00') && x.eclipseAt < Date.parse('2026-10-17T21:00:00-04:00')).map((x) => ({ x, o: st.byId.get(x.id) }))
      .filter(({ o }) => o && !o.family && !own.has(String(o.id)) && /R\/B/.test(o.name)).map(({ x, o }) => [x.eclipseAt, o.name, o.id]); });
  let fadeT = null;
  for (const [t, name, id] of cands) {
    await at(new Date(t - 50e3)); await p.evaluate((id) => { window.__ease = 0.6; window.__aim = id; window.__store.state.pinnedId = id; }, id);
    let exact = null; for (let i = 0; i < 45 && !exact; i++) { await p.clock.fastForward(2000); await w(220); exact = await p.evaluate((id) => (window.__store.sky.fade && window.__store.state.targetId === id && !document.getElementById('discover').hidden && !document.getElementById('d-cta').hidden ? Date.now() + window.__store.sky.fade.left * 1000 : null), id); } // in the circle, counting, and collectable
    if (exact) { fadeT = [exact, name, id]; break; }
  }
  await p.evaluate(() => { window.__aim = null; window.__store.state.pinnedId = null; });
  console.log(kind, 'fade', fadeT && new Date(fadeT[0]).toTimeString().slice(0, 8), fadeT?.[1]);
  await at('2026-10-17T19:30:00-04:00'); await w(500);
  await jumpToHero(p); // the ISS pass
  await p.evaluate(() => { const s = window.__store.state; const it = s.items.find((x) => x.obj.type === 'station' && x.look?.visible && !s.sightings.some((y) => String(y.objectId) === String(x.obj.id)));
    if (it) { s.drag.az = (it.look.az + 25) % 360; s.drag.el = Math.max(18, it.look.el - 6); window.__iss = it.obj.id; } });
  await w(800);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: OUT[kind][0], maxHeight: OUT[kind][1], everyNthFrame: 1 });
  // 0–3 s: a busy sky, easing onto the ISS
  await cap('Every light up there has a *name*', 2500);
  await p.evaluate(() => { window.__ease = 0.08; window.__aim = window.__iss; });
  await w(2600);
  await p.click('#d-cta').catch((e) => console.log(kind, 'no Collect (ISS)', e.message.slice(0, 60)));
  // 3–7.5 s: the card
  await w(600); await cap('Catch it. Keep its *card*.', 2600); await w(2800);
  await p.locator('#reveal .x-close').first().click().catch(() => {}); await w(250);
  await p.evaluate(() => { window.__aim = null; window.__pan = 0; });
  // 7.5–12 s: Tonight before dark, counting down; Show me swings the sky to where it will rise
  await at('2026-10-17T18:42:00-04:00'); await w(200);
  await p.click('#nav-sky').catch(() => {}); await w(500);
  // Tonight's headliner card, scrolled to the middle (the hero only counts down when nothing new is up, which after dark is never)
  await p.evaluate(() => { const b = document.querySelector('#visible .hl-go'), v = document.getElementById('visible'), card = b?.closest('[class*="hl"]')?.parentElement ?? b; if (card) v.scrollTo({ top: v.scrollTop + card.getBoundingClientRect().top - innerHeight * 0.32, behavior: 'smooth' }); });
  await cap('Know when to *look up*', 2400); await w(1400);
  await p.locator('#visible .hl-go').first().click({ timeout: 3000 }).catch((e) => console.log(kind, 'no Show me', e.message.slice(0, 60))); await w(1500);
  // 12–18 s: catch the fade: the stage slips into Earth's shadow; tapped as the ring runs out → a shiny
  if (fadeT) {
    await at(new Date(fadeT[0] - 4600)); await p.evaluate((id) => { const s = window.__store.state; s.guidePass = null; s.pinnedId = id; s.drag.on = true; const it = s.items.find((x) => x.obj.id === id); if (it) { s.drag.az = it.look.az; s.drag.el = it.look.el; } window.__ease = 0.5; window.__aim = id; }, fadeT[2]); await w(250);
    await cap('Catch the fade, get a *shiny*', 3800);
    for (let i = 0; i < 90; i++) { const left = await p.evaluate(() => window.__store.sky.fade?.left ?? 99); if (left < 1.3) break; await w(80); }
    console.log(kind, 'fade target', await p.evaluate(() => window.__store.state.targetId), fadeT[2]);
    await p.click('#d-cta', { timeout: 3000 }).catch((e) => console.log(kind, 'no Collect (fade)', e.message.slice(0, 60)));
    await w(3300);
    await p.locator('#reveal .x-close').first().click().catch(() => {}); await w(250);
  }
  // 18–25.5 s: Voyager 1's spot, already almost in the circle: held, it comes sealed in the Golden Record back → Pale Blue Dot
  await at('2026-10-17T20:24:00-04:00'); await p.evaluate(() => { const s = window.__store.state; s.pinnedId = null; window.__aim = null; const q = window.__store.skyAt(258.2, 12.1); s.drag.az = (q.az + 1.2) % 360; s.drag.el = q.el + 0.6; window.__ease = 0.25; window.__aimAt = { ra: 258.2, dec: 12.1 }; });
  await cap('Some lights hide a *secret*', 3200);
  for (let i = 0; i < 30 && !(await p.evaluate(() => !document.getElementById('reveal').hidden)); i++) await w(250);
  await w(900); await p.locator('#rv-holder').click({ timeout: 1500 }).catch(() => {}); // a tap turns the sealed card over at once
  await w(2500);
  await p.locator('#reveal .x-close').first().click().catch(() => {}); await w(250);
  await p.evaluate(() => { window.__aimAt = null; });
  // 25.5–29 s: the Collection, and the name
  await p.click('#nav-collection'); await w(700);
  const f = p.frameLocator('#collection-frame');
  await f.locator('body').evaluate(() => { const sc = document.scrollingElement; let y = 0; const t = setInterval(() => { y += 9; sc.scrollTo(0, y); if (y > 520) clearInterval(t); }, 16); }).catch(() => {});
  await cap('*Space Collector* · free, no ads', 2700); await w(2700);
  await cdp.send('Page.stopScreencast'); await w(300);
  // Frames come when the page changes; give each its real duration, then make a constant 30 fps.
  const list = frames.map((fr, i) => `file '${fr.f}'\nduration ${(((frames[i + 1]?.t ?? fr.t + 1) - fr.t)).toFixed(4)}`).join('\n') + `\nfile '${frames.at(-1).f}'\n`;
  writeFileSync(join(tmp, 'list.txt'), list);
  const out = join(ROOT, 'store/appstore', kind); mkdirSync(out, { recursive: true });
  const [W, H] = OUT[kind];
  // Sound (2026-10-24, Sevaan: "with the music and sound too"): "Permafrost" underneath (fading in and out) and the
  // app's own sound effects where they played in the footage, levelled like the game (js/sfx.js NORM), then loudness-
  // normalised for the store. Notices' ticks and most XP ticks are left out so the mix stays clean.
  const dur = frames.at(-1).t - frames[0].t + 0.5, t0 = frames[0].t;
  const NORM = (() => { try { return JSON.parse(readFileSync(join(ROOT, 'js/sfx.js'), 'utf8').match(/const NORM = (\{[^}]*\})/)[1]); } catch { return {}; } })(); // the game's per-sound levels
  const log = sfxReal.map(([n, t]) => [n, t - t0]).filter(([, t]) => t > 0 && t < dur - 0.3);
  const HIDDEN = new Set(['toast', 'patch', 'coinroll', 'stamp']); // notices and patch coins are hidden in the store footage, so are their sounds
  const last = {}, events = log.filter(([n, t]) => { if (HIDDEN.has(n)) return false; const gap = n === 'xp' ? 0.22 : 0.4; if (t - (last[n] ?? -9) < gap) return false; last[n] = t; return true; });
  const ins = ['-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'), '-stream_loop', '-1', '-i', join(ROOT, 'assets/audio/permafrost.m4a')];
  events.forEach(([n]) => ins.push('-i', join(ROOT, 'assets/audio/sfx', n + '.mp3')));
  let af = `[1:a]atrim=0:${dur.toFixed(2)},asetpts=N/SR/TB,volume=0.30,afade=t=in:st=0:d=1.5,afade=t=out:st=${(dur - 2.5).toFixed(2)}:d=2.5[mus];`; const lab = ['[mus]'];
  events.forEach(([n, t], i) => { const ms = Math.round(t * 1000), g = Math.min(1.4, 0.55 * (NORM[n] ?? 1)); af += `[${i + 2}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${g.toFixed(3)},adelay=${ms}|${ms}[e${i}];`; lab.push(`[e${i}]`); });
  af += `${lab.join('')}amix=inputs=${lab.length}:normalize=0:duration=first,alimiter=limit=0.9,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;
  console.log(kind, 'sounds', events.map(([n, t]) => `${n}@${t.toFixed(1)}`).join(' '));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', af, '-map', '0:v', '-map', '[aout]',
    '-vf', `scale=${W}:${H}:flags=lanczos,fps=30,format=yuv420p`, '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17', '-preset', 'slow', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', join(out, 'preview.mp4')]);
  console.log(kind, frames.length, 'frames →', join(out, 'preview.mp4'), errs.length ? errs : '');
  await b.close();
}
