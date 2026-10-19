// App Store captures, step 3 of 3: the App Preview videos (the clips that autoplay on the store page). Records the real
// app in Chromium with the DevTools screencast while a script plays it (look around the sky, lock on, Collect, the card
// flips, the Collection, the shiny ISS, the patches), then ffmpeg makes an App Store-ready H.264 MP4 at 30 fps with a
// silent stereo track: store/appstore/<device>/preview.mp4 (iPhone 886 × 1920, iPad 1200 × 1600), about 25 s.
// Usage: node scripts/store/preview.mjs [phone|pad|all] [--when=…]   (needs ffmpeg and the local server on 8765)
import { chromium } from 'playwright';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, DEVICES, setup, hideNoise, jumpToHero } from './common.mjs';

const args = process.argv.slice(2), which = args.find((a) => !a.startsWith('--')) ?? 'all', when = args.find((a) => a.startsWith('--when='))?.slice(7);
const OUT = { phone: [886, 1920], pad: [1200, 1600] };
// The phone records at 443 × 960 @2x so the frames are exactly 886 × 1920; the iPad at its own size, scaled to 1200 × 1600.
const REC = { phone: { ...DEVICES.phone, viewport: { width: 443, height: 960 }, deviceScaleFactor: 2 }, pad: DEVICES.pad };

for (const kind of which === 'all' ? Object.keys(OUT) : [which]) {
  DEVICES[kind] = REC[kind];
  const b = await chromium.launch();
  const { p, ctx, errs } = await setup(b, kind, { when, heroIss: true });
  await hideNoise(p);
  const tmp = join(ROOT, 'scripts/.cache/preview-' + kind); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const cdp = await ctx.newCDPSession(p), frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => { const f = join(tmp, `${String(frames.length).padStart(5, '0')}.jpg`); writeFileSync(f, Buffer.from(data, 'base64')); frames.push({ f, t: metadata.timestamp }); await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); });
  const w = (ms) => p.waitForTimeout(ms);
  // The script. Steering goes through the app's own drag view, eased, so it moves like a hand.
  await jumpToHero(p); // the same hero as the screenshots: the ISS (reference-accurate art), not whatever is up
  await p.evaluate(() => { const st = window.__store.state; st.drag.on = true; st.pinnedId = null; window.__pan = 0.06; window.__aim = null;
    const step = () => { const s = window.__store.state;
      if (window.__aim != null) { const it = s.items.find((x) => x.obj.id === window.__aim); if (it) { let da = ((it.look.az - s.drag.az + 540) % 360) - 180; s.drag.az = (s.drag.az + da * 0.06 + 360) % 360; s.drag.el += (Math.max(it.look.el, 15) - s.drag.el) * 0.06; } }
      else s.drag.az = (s.drag.az + window.__pan + 360) % 360;
      requestAnimationFrame(step); };
    st.drag.el = 32; requestAnimationFrame(step); });
  await w(600);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: OUT[kind][0], maxHeight: OUT[kind][1], everyNthFrame: 1 });
  await w(4500);                                                                             // look around
  const target = await p.evaluate(() => { const s = window.__store.state, own = new Set(s.sightings.map((x) => String(x.objectId))), rank = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    const it = s.items.filter((x) => x.look?.visible && x.look.el > 12 && !own.has(String(x.obj.id)) && !x.obj.family).sort((a, b) => (b.obj.type === 'station') - (a.obj.type === 'station') || (rank[a.obj.tier] ?? 5) - (rank[b.obj.tier] ?? 5) || (a.look.mag ?? 9) - (b.look.mag ?? 9))[0];
    window.__aim = it?.obj.id ?? null; return it ? it.obj.name : null; });
  console.log(kind, 'target', target);
  await w(3200);                                                                             // swing round, lock on
  await p.click('#d-cta').catch((e) => console.log(kind, 'no Collect', e.message.slice(0, 60)));
  await w(4800);                                                                             // the card flies out and turns over
  await p.locator('#reveal .x-close').first().click().catch(() => {}); await w(900);
  await p.click('#nav-collection'); await w(2400);                                           // the Collection slides up
  const f = p.frameLocator('#collection-frame');
  await f.locator('body').evaluate(() => { const sc = document.scrollingElement; let y = 0; const t = setInterval(() => { y += 6; sc.scrollTo(0, y); if (y > 360) clearInterval(t); }, 16); }).catch(() => {});
  await w(1600);
  await f.locator('body').evaluate(() => document.scrollingElement.scrollTo({ top: 0, behavior: 'smooth' })).catch(() => {}); await w(700);
  await f.locator('.card-tile', { hasText: /hubble/i }).first().click().catch(() => {}); await w(3200); // the shiny Hubble
  await f.locator('#viewer').evaluate((v) => v.open && v.close()).catch(() => {}); await w(700);
  await f.locator('#tab-patches').click().catch(() => {}); await w(2600);                   // the patches
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
