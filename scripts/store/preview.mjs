// App Store captures, step 3 of 3: the App Preview video (the clip that autoplays, muted, on the store page).
// The 2026-10-24 cut (writers' room script A, then an ad director + editor's EDL; Sevaan: "it has to convince people to
// download this app"). The real app is recorded in Chromium as separate takes (DevTools screencast; the page clock is
// moved between them), each trimmed to its payoff, joined in ffmpeg with whips, dissolves and a dip to black. Captions and
// the end card are rendered separately (a transparent caption track drawn by the browser frame by frame) and laid over.
// Music: "Permafrost" from 109.6 s, so its swells land on the ISS card, the shiny, Pale Blue Dot and the title; the
// app's own sound effects are placed where they played. Output: store/appstore/<device>/preview.mp4 (~28.6 s).
// Rules (the editor's): never hard-cut between sky times; never show a dismiss; chrome hidden per beat; captions in a band
// at 80–92% of the height, only once their subject is on screen; no still hold over ~1.2 s.
// Usage: node scripts/store/preview.mjs [phone|pad|all] [--when=2026-10-17T19:30:00-04:00]   (ffmpeg + the local server)
import { chromium } from 'playwright';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, DEVICES, setup, hideNoise, jumpToHero, storeExtras, storeStorage, captureNight } from './common.mjs';

const args = process.argv.slice(2), which = args.find((a) => !a.startsWith('--')) ?? 'all';
const when = args.find((a) => a.startsWith('--when='))?.slice(7) ?? '2026-10-17T19:30:00-04:00';
const OUT = { phone: [886, 1920], pad: [1200, 1600] };
// The phone records at 443 × 960 @2x so the frames are exactly 886 × 1920; the iPad at its own size, scaled to 1200 × 1600.
const REC = { phone: { ...DEVICES.phone, viewport: { width: 443, height: 960 }, deviceScaleFactor: 2 }, pad: DEVICES.pad };
const FPS = 30;

// The edit: where each clip starts in the cut (S), the transition into it (ffmpeg xfade), and the cut's length.
const S = [0, 5.0, 8.4, 14.0, 21.0, 24.4, 26.4], END = 28.6;
const TR = [null, ['fade', 0.33], ['fade', 0.5], ['fadeblack', 0.5], ['fade', 0.3], ['fade', 0.2], ['fade', 0.4]];
const DUR = S.map((s, k) => (k < S.length - 1 ? S[k + 1] + TR[k + 1][1] - s : END - s));
// Captions on the cut's timeline (*word* in orange). The end card is drawn by the caption track too.
const CAPS = [
  [0.0, 1.25, 'That light is the *Space Station*', { settled: true }],
  [2.1, 4.8, 'Catch it. Keep its *card*.'],
  [5.1, 8.3, 'Know when to *look up*'],
  [8.6, 13.6, 'Catch the fade, get a *shiny*'],
  [14.6, 17.6, 'Some lights hide a *secret*'],
  [18.4, 20.8, 'Every card is a *true story*'],
  [21.2, 24.1, '*Thousands* of real cards'],
  [24.6, 26.3, '180+ mission *patches*'],
];
const KEEP = new Set(['collect', 'flip', 'shiny', 'secret', 'r_common', 'r_uncommon', 'r_rare', 'r_epic', 'r_legend', 'arrive']);

for (const kind of which === 'all' ? Object.keys(OUT) : [which]) {
  DEVICES[kind] = REC[kind];
  const [W, H] = OUT[kind], vw = REC[kind].viewport.width, vh = REC[kind].viewport.height;
  const tmp = join(ROOT, 'scripts/.cache/preview-' + kind); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const b = await chromium.launch();
  const night = captureNight(when), { p, ctx, errs } = await setup(b, kind, { when, heroIss: true, clear: true, extra: storeExtras(night), storage: storeStorage(night) });
  await hideNoise(p);
  const w = (ms) => p.waitForTimeout(ms), now = () => Date.now() / 1000;
  const at = (t) => p.clock.setSystemTime(new Date(t));
  // Chrome per beat (the editor's rule 3): CSS switched on and off between takes.
  await p.addStyleTag({ content: `
    html body.rec-sky #sky-header, html body.rec-sky #nav, html body.rec-sky .sc-switch, html body.rec-sky #skybar, html body.rec-sky #tab-fade { visibility: hidden !important; opacity: 0 !important; }
    body.rec-sky #reveal #rv-rank, body.rec-sky #reveal #reveal-view, body.rec-sky #rv-top .rv-roll, body.rec-sky #rv-news { visibility: hidden !important; }
    body.rec-sky #sky-plus-line, body.rec-sky #until-dark { display: none !important; }
    body.rec-end #radar, body.rec-end #discover, body.rec-end #plane, body.rec-end #tk, body.rec-end #guidance, body.rec-end #wake { visibility: hidden !important; }` });
  const chrome = (cls) => p.evaluate((c) => { document.body.classList.remove('rec-sky', 'rec-end'); for (const x of c) document.body.classList.add(x); }, cls);
  // Steering through the app's own drag view, eased like a hand: __aim = an object id, or __aimAt = {ra, dec}.
  await p.evaluate(() => { const st = window.__store.state; st.drag.on = true; st.pinnedId = null; window.__pan = 0; window.__aim = null; window.__aimAt = null;
    const step = () => { const s = window.__store.state, e = window.__ease ?? 0.06; let az = null, el = null;
      if (window.__aim != null) { const it = s.items.find((x) => x.obj.id === window.__aim); if (it) { az = it.look.az; el = it.look.el; } }
      else if (window.__aimAt) { const q = window.__store.skyAt(window.__aimAt.ra, window.__aimAt.dec); az = q.az; el = q.el; }
      if (az != null) { const da = ((az - s.drag.az + 540) % 360) - 180; s.drag.az = (s.drag.az + da * e + 360) % 360; s.drag.el += (Math.max(el, 12) - s.drag.el) * e; }
      else s.drag.az = (s.drag.az + window.__pan + 360) % 360;
      requestAnimationFrame(step); };
    st.drag.el = 38; requestAnimationFrame(step); });
  // Takes: screencast on, the beat, off. Frames and the app's sounds keep real (epoch) times.
  const cdp = await ctx.newCDPSession(p); let frames = null, nf = 0;
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => { if (frames) { const f = join(tmp, `f${String(nf++).padStart(5, '0')}.jpg`); writeFileSync(f, Buffer.from(data, 'base64')); frames.push({ f, t: metadata.timestamp }); } await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); });
  const sfx = []; await p.exposeFunction('__sfxReal', (n, delay = 0) => { sfx.push([n, now() + delay]); });
  const take = async (fn) => { frames = []; await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 }); const marks = {}; const t0 = now();
    await fn((k) => { marks[k] = now(); }); await cdp.send('Page.stopScreencast'); await w(150); const tk = { frames, marks, t0 }; frames = null; return tk; };
  // Turn the sealed card over now: tap it (again, if it hadn't landed yet) until its face shows.
  const flipNow = async () => { for (let i = 0; i < 16; i++) { if (await p.evaluate(() => document.getElementById('rv-back')?.style.visibility === 'hidden')) return; await p.locator('#rv-holder').click({ timeout: 600 }).catch(() => {}); await w(200); } };
  // Hand-tilt a card under the mouse, so the foil and glare move.
  const tilt = async (ms) => { const r = await p.locator('#rv-holder').boundingBox().catch(() => null); if (!r) return w(ms); const pts = [[0.5, 0.45], [0.25, 0.3], [0.75, 0.35], [0.7, 0.7], [0.3, 0.62], [0.5, 0.45]]; const step = ms / pts.length;
    for (const [x, y] of pts) { await p.mouse.move(r.x + r.width * x, r.y + r.height * y, { steps: 6 }); await w(Math.max(0, step - 90)); } };
  for (let i = 0; i < 30 && !(await p.evaluate(() => !!window.__store.state.tonight)); i++) await w(1000);

  await chrome(['rec-sky']);
  // Take 2 (recorded first, at 7:30 PM, so the clock only ever moves forward: jumping it back left the sky's samples stale) · Tonight, scrolled to the headliner, settled → Show me swings the sky to where it will rise.
  await p.evaluate(() => document.getElementById('nav-sky').click());
  for (let i = 0; i < 40 && !(await p.evaluate(() => !!document.querySelector('#visible .hl-go') && !/\b0 new cards/.test(document.getElementById('visible').innerText))); i++) await w(500); // the plan, worked out again for this time
  console.log(kind, 'tonight ready', await p.evaluate(() => !!document.querySelector('#visible .hl-go')));
  await p.evaluate(() => { document.getElementById('visible').scrollTop = 0; }); // the hero: tonight's headliner, counting down
  await w(2200);
  const t2 = await take(async (mark) => { await w(250); mark('in'); await w(1400); await p.locator('#visible .nh-go').first().click({ timeout: 3000, force: true }).catch((e) => console.log(kind, 'no Show me', e.message.slice(0, 60))); await w(2800); });
  await p.evaluate(() => { if (!document.getElementById('visible').hidden) document.getElementById('nav-explore').click(); }); await w(900); // back on the sky, whatever happened

  // Before recording: a rocket stage that slips into Earth's shadow with nothing else in the circle, to the second.
  const cands = await p.evaluate(() => { const st = window.__store.state, T = st.tonight, own = new Set(st.sightings.map((s) => String(s.cardKey)));
    return T.passes.filter((x) => x.eclipseAt && x.peakEl > 30 && (x.eclipseEl ?? 0) > 25 && x.mag < 4 && x.eclipseAt > Date.parse('2026-10-17T19:52:00-04:00') && x.eclipseAt < Date.parse('2026-10-17T21:00:00-04:00')).map((x) => ({ x, o: st.byId.get(x.id) }))
      .filter(({ o }) => o && !o.family && !own.has(String(o.id)) && /R\/B/.test(o.name)).map(({ x, o }) => [x.eclipseAt, o.name, o.id]); });
  let fadeT = null;
  for (const [t, name, id] of cands) {
    await at(t - 50e3); await p.evaluate((id) => { window.__ease = 0.6; window.__aim = id; window.__store.state.pinnedId = id; }, id);
    let exact = null; for (let i = 0; i < 45 && !exact; i++) { await p.clock.fastForward(2000); await w(220); exact = await p.evaluate((id) => (window.__store.sky.fade && window.__store.state.targetId === id && !document.getElementById('discover').hidden && !document.getElementById('d-cta').hidden ? Date.now() + window.__store.sky.fade.left * 1000 : null), id); }
    if (exact) { fadeT = [exact, name, id]; break; }
  }
  await p.evaluate(() => { window.__aim = null; window.__store.state.pinnedId = null; });
  console.log(kind, 'fade', fadeT && new Date(fadeT[0]).toTimeString().slice(0, 8), fadeT?.[1]);

  // Take 3 · catch the fade: the stage already in the circle, its ring running down; Collect at the last second → shiny.
  let t3 = null;
  if (fadeT) {
    await at(fadeT[0] - 3300); await p.evaluate((id) => { const s = window.__store.state; s.guidePass = null; s.pinnedId = id; s.drag.on = true; const it = s.items.find((x) => x.obj.id === id); if (it) { s.drag.az = it.look.az; s.drag.el = it.look.el; } window.__ease = 0.5; window.__aim = id; }, fadeT[2]); await w(350);
    t3 = await take(async (mark) => { mark('in');
      for (let i = 0; i < 90; i++) { const left = await p.evaluate(() => window.__store.sky.fade?.left ?? 99); if (left < 1.3) break; await w(60); }
      mark('collect'); await p.click('#d-cta', { timeout: 3000 }).catch((e) => console.log(kind, 'no Collect (fade)', e.message.slice(0, 60)));
      await w(250); await flipNow(); await w(300); await tilt(3600); await w(400); });
    await p.mouse.move(vw / 2, vh * 0.42); await w(500); await p.locator('#rv-holder').screenshot({ path: join(tmp, 'fade-card.png'), omitBackground: true }).catch(() => {});
    await p.evaluate(() => { document.getElementById('reveal').querySelector('.x-close')?.click(); const s = window.__store.state; s.pinnedId = null; window.__aim = null; }); await w(800);
  }

  // Take 4 · Voyager 1's spot, held (the ring fills), its card sealed in the Golden Record back for a second → Pale Blue Dot.
  await at(Date.parse('2026-10-17T20:24:00-04:00'));
  await p.evaluate(() => { const s = window.__store.state; s.pinnedId = null; const q = window.__store.skyAt(258.2, 12.1); s.drag.az = q.az; s.drag.el = q.el; window.__ease = 0.4; window.__aimAt = { ra: 258.2, dec: 12.1 }; });
  const t4 = await take(async (mark) => { mark('hold');
    for (let i = 0; i < 40 && !(await p.evaluate(() => !document.getElementById('reveal').hidden)); i++) await w(200);
    mark('reveal'); await w(1000); await flipNow(); await w(300); await tilt(3600); await w(400); });
  await p.mouse.move(vw / 2, vh * 0.42); await w(500); await p.locator('#rv-holder').screenshot({ path: join(tmp, 'story-card.png'), omitBackground: true }).catch(() => {});
  await p.evaluate(() => { document.getElementById('reveal').querySelector('.x-close')?.click(); window.__aimAt = null; }); await w(800);
  await p.evaluate(() => localStorage.setItem('cardBack', 'mission-control')); // the ISS keeps the everyday back (finding Voyager adopts the Golden Record one)

  // Take 1 · the ISS already in the circle → Collect → its card, turned over at once and tilted.
  await jumpToHero(p);
  await chrome(['rec-sky']);
  await p.evaluate(() => { const s = window.__store.state, it = s.items.find((x) => x.obj.type === 'station' && x.look?.visible && !s.sightings.some((y) => String(y.objectId) === String(x.obj.id)));
    if (it) { s.drag.az = it.look.az; s.drag.el = it.look.el; window.__aim = it.obj.id; window.__ease = 0.3; } });
  await w(1800);
  const t1 = await take(async (mark) => {
    await w(1600); mark('collect'); await p.click('#d-cta', { timeout: 3000 }).catch((e) => console.log(kind, 'no Collect (ISS)', e.message.slice(0, 60)));
    await w(700); await flipNow();
    await w(500); await tilt(3300); await w(500);
  });
  await p.mouse.move(vw / 2, vh * 0.42); await w(500);
  const issCard = join(tmp, 'iss-card.png'); await p.locator('#rv-holder').screenshot({ path: issCard, omitBackground: true }).catch(() => {});
  await p.evaluate(() => { document.getElementById('reveal').querySelector('.x-close')?.click(); window.__aim = null; }); await w(800);

  // Take 5 · the Collection, scrolling steadily (~350 px/s) · Take 6 · the patch wall, slowly.
  await p.evaluate(() => document.getElementById('nav-collection').click()); await w(3200);
  const f = p.frameLocator('#collection-frame');
  const scrollTake = (pxs, ms) => take(async (mark) => { mark('in'); await f.locator('body').evaluate((el, [pxs, ms]) => new Promise((done) => { const sc = document.scrollingElement, y0 = sc.scrollTop, t0 = performance.now();
    const go = (t) => { sc.scrollTo(0, y0 + (t - t0) / 1000 * pxs); if (t - t0 < ms) requestAnimationFrame(go); else done(); }; requestAnimationFrame(go); }), [pxs, ms]).catch((e) => console.log(kind, 'scroll', e.message.slice(0, 60))); });
  await f.locator('#grid').evaluate((el) => { const tools = document.querySelector('.collection-tools'); scrollTo(0, scrollY + el.getBoundingClientRect().top - (parseFloat(getComputedStyle(tools).top) || 0) - tools.offsetHeight - 10); }).catch(() => {}); await w(700); // past the rank card
  const t5 = await scrollTake(350 * vw / 443, 3900);
  await f.locator('#tab-patches').click().catch(() => {}); await w(1600);
  await f.locator('#patch-wall').evaluate((el) => { const tabs = document.querySelector('.collection-tabs'); scrollTo(0, scrollY + el.getBoundingClientRect().top - (parseFloat(getComputedStyle(tabs).top) || 0) - tabs.offsetHeight - 6); }).catch(() => {}); await w(600);
  const t6 = await scrollTake(120 * vw / 443, 2600);

  // Take 7 · the end card's sky: back to Explore, everything but the sky hidden, drifting.
  await p.evaluate(() => document.getElementById('nav-explore').click()); await w(2500);
  await chrome(['rec-sky', 'rec-end']);
  await p.evaluate(() => { const s = window.__store.state; s.pinnedId = null; s.drag.el = 34; window.__aim = null; window.__aimAt = null; window.__pan = 0.06; }); await w(600);
  await p.evaluate(() => { window.__store.sky.drawReticle = () => {}; }); // the end card's sky: no circle behind the title
  const t7 = await take(async (mark) => { mark('in'); await w(2600); });
  await b.close();

  // The clips: each take trimmed from its in-point for its length in the edit, at a constant 30 fps.
  const tk = [t1, t2, t3, t4, t5, t6, t7];
  if (!t3) throw new Error('no fade take');
  const ins = [t1.marks.collect - 1.0, t2.marks.in, t3.marks.collect - 1.8, t4.marks.hold + 3.0, t5.marks.in, t6.marks.in, t7.marks.in];
  const clips = tk.map((t, k) => {
    const a = ins[k], d = DUR[k], fr = t.frames;
    let first = fr.findIndex((x, i) => (fr[i + 1]?.t ?? Infinity) > a); if (first < 0) first = fr.length - 1;
    const use = fr.slice(first);
    const lines = use.map((x, i) => { const s0 = Math.max(x.t, a), s1 = use[i + 1] ? use[i + 1].t : a + d + 1; return `file '${x.f}'\nduration ${Math.max(0.001, s1 - s0).toFixed(4)}`; }).join('\n') + `\nfile '${use.at(-1).f}'\n`;
    writeFileSync(join(tmp, `c${k}.txt`), lines);
    const out = join(tmp, `c${k}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(tmp, `c${k}.txt`), '-vf', `scale=${W}:${H}:flags=lanczos,fps=${FPS},format=yuv420p,tpad=stop_mode=clone:stop_duration=2`, '-t', d.toFixed(3), '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', out]);
    return out;
  });
  // Joined with the transitions.
  const vjoin = join(tmp, 'joined.mp4');
  { const inputs = clips.flatMap((c) => ['-i', c]); let fc = '', prev = '[0:v]';
    for (let k = 1; k < clips.length; k++) { const [tr, td] = TR[k], lab = k === clips.length - 1 ? '[vj]' : `[v${k}]`; fc += `${prev}[${k}:v]xfade=transition=${tr}:duration=${td}:offset=${S[k].toFixed(3)}${lab};`; prev = lab; }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', fc.slice(0, -1), '-map', '[vj]', '-t', END.toFixed(3), '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', vjoin]); }

  // The caption track and the end card, drawn by the browser frame by frame on a transparent page.
  const capDir = join(tmp, 'caps'); mkdirSync(capDir, { recursive: true });
  { const cb = await chromium.launch(), cp = await cb.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: W / vw });
    const u = Math.min(vw, vh * 0.4615); // the end card is laid out for a phone-shaped area, so a wide screen doesn't blow it up
    const png = (f) => 'data:image/png;base64,' + readFileSync(join(tmp, f)).toString('base64'), card = png('iss-card.png'), cardL = png('fade-card.png'), cardR = png('story-card.png');
    await cp.setContent(`<!doctype html><html><head><style>
      @font-face { font-family: 'SC Display'; src: url('data:font/ttf;base64,${readFileSync(join(ROOT, 'fonts/RussoOne-Regular.ttf')).toString('base64')}'); }
      @font-face { font-family: 'SC Label'; src: url('data:font/ttf;base64,${readFileSync(join(ROOT, 'fonts/BarlowCondensed-Medium.ttf')).toString('base64')}'); font-weight: 500; }
      html, body { margin: 0; background: transparent; width: ${vw}px; height: ${vh}px; overflow: hidden; }
      #band { position: absolute; left: 0; right: 0; top: 77%; height: 18%; background: linear-gradient(transparent, rgba(4,7,13,.55) 30%, rgba(4,7,13,.55) 75%, transparent); opacity: 0; }
      #cap { position: absolute; left: 6%; right: 6%; top: 80%; height: 12%; display: grid; place-items: center; text-align: center; text-wrap: balance; color: #fff2b3;
        font: 400 ${Math.round(vw * 0.076)}px/1 'SC Display', Impact, sans-serif; text-shadow: 0 0 ${Math.round(vw * 0.045)}px rgba(250,129,39,.5), 0 ${Math.max(2, Math.round(vw * 0.006))}px 0 #000, 0 0 ${Math.round(vw * 0.06)}px rgba(0,0,0,.95), 0 0 4px #000; opacity: 0; }
      #cap b { color: #fa8127; font-weight: 400; }
      #end { position: absolute; inset: 0; opacity: 0; }
      #end .shade { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 40%, rgba(4,7,13,.25), rgba(4,7,13,.88) 72%); }
      #end img { position: absolute; filter: drop-shadow(0 ${Math.round(u * 0.04)}px ${Math.round(u * 0.08)}px rgba(0,0,0,.75)); transform-origin: 50% 85%; }
      #end .cl, #end .cr { width: ${(u * 0.43).toFixed(0)}px; top: ${(vh * 0.21).toFixed(0)}px; left: 50%; margin-left: ${(-u * 0.215).toFixed(0)}px; }
      #end .cc { width: ${(u * 0.5).toFixed(0)}px; top: ${(vh * 0.165).toFixed(0)}px; left: 50%; margin-left: ${(-u * 0.25).toFixed(0)}px; }
      #end .t { position: absolute; left: 0; right: 0; top: 67%; text-align: center; white-space: nowrap; font: 400 ${Math.round(u * 0.1)}px/1 'SC Display', Impact, sans-serif; color: #fff2b3; text-shadow: 0 0 ${Math.round(u * 0.05)}px rgba(250,129,39,.5), 0 3px 0 #000; }
      #end .rule { position: absolute; left: 50%; top: 73.3%; width: 27%; height: 1px; transform: translateX(-50%); background: linear-gradient(90deg, transparent, #fff2b366, transparent); }
      #end .s { position: absolute; left: 0; right: 0; top: 75.5%; text-align: center; font: 500 ${Math.round(u * 0.047)}px/1 'SC Label', sans-serif; letter-spacing: .26em; text-transform: uppercase; color: #fff2b3; }
      #end .s b { display: block; margin-top: .85em; font-size: .9em; letter-spacing: .2em; color: #fa8127; font-weight: 500; }
    </style></head><body><div id="band"></div><div id="cap"></div><div id="end"><div class="shade"></div><img class="cl" src="${cardL}"><img class="cr" src="${cardR}"><img class="cc" src="${card}"><div class="t">SPACE COLLECTOR</div><div class="rule"></div><div class="s">Collect the night sky<b>Free · No ads</b></div></div></body></html>`);
    await cp.evaluate(async () => { await document.fonts.load('40px "SC Display"'); await document.fonts.load('500 20px "SC Label"'); await document.fonts.ready; });
    const N = Math.round(END * FPS), ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    for (let i = 0; i < N; i++) {
      const t = i / FPS, c = CAPS.find(([a, z]) => t >= a && t < z);
      const st = { capOp: 0, scale: 1, blur: 0, html: '', endOp: 0, titleOp: 0, titleScale: 1, subOp: 0, fan: 0 };
      if (c) { const [a, z, text, o = {}] = c, k = o.settled ? 1 : (t - a) / 0.42, out = Math.min(1, Math.max(0, (z - t) / 0.3));
        st.html = '<span>' + text.replace(/\*(.+?)\*/g, '<b>$1</b>') + '</span>'; /* one item: the grid stacked bare words and the orange word as separate rows (Sevaan: too much space between the lines) */ st.capOp = Math.min(1, k * 3) * out; st.scale = 1 + 0.7 * (1 - ease(k)); st.blur = 4 * (1 - ease(k)); }
      if (t >= 26.4) { st.endOp = Math.min(1, (t - 26.4) / 0.4); const k = (t - 27.0) / 0.42; st.titleOp = t >= 27.0 ? Math.min(1, k * 3) : 0; st.titleScale = 1 + 0.7 * (1 - ease(k)); st.subOp = Math.min(1, Math.max(0, (t - 27.45) / 0.35)); st.fan = ease((t - 26.45) / 0.6); }
      await cp.evaluate((st) => { const cap = document.getElementById('cap'); if (cap.dataset.h !== st.html) { cap.innerHTML = st.html; cap.dataset.h = st.html; }
        cap.style.opacity = st.capOp; cap.style.transform = `scale(${st.scale})`; cap.style.filter = st.blur > 0.05 ? `blur(${st.blur}px)` : 'none'; document.getElementById('band').style.opacity = st.capOp;
        const e = document.getElementById('end'); e.style.opacity = st.endOp; const tt = e.querySelector('.t'); tt.style.opacity = st.titleOp; tt.style.transform = `scale(${st.titleScale})`; e.querySelector('.s').style.opacity = st.subOp; e.querySelector('.rule').style.opacity = st.subOp;
        const f = st.fan, sx = Math.min(innerWidth, innerHeight * 0.4615) * 0.22 * f; e.querySelector('.cl').style.transform = `translateX(${-sx}px) rotate(${-14 * f}deg)`; e.querySelector('.cr').style.transform = `translateX(${sx}px) rotate(${14 * f}deg)`; e.querySelector('.cc').style.transform = `translateY(${(1 - f) * innerHeight * 0.04}px)`; }, st);
      await cp.screenshot({ path: join(capDir, `${String(i).padStart(4, '0')}.png`), omitBackground: true });
    }
    await cb.close(); }

  // Sound: "Permafrost" from 109.6 s (its swells on the payoffs), the app's kept sounds where they played, a shiny sting on the title.
  const mapT = (t) => { for (let k = tk.length - 1; k >= 0; k--) { const x = t - ins[k]; if (x >= 0 && x <= DUR[k] && t >= tk[k].t0 - 0.2) return S[k] + x; } return null; };
  const last = {}, events = sfx.map(([n, t]) => [n, mapT(t)]).filter(([n, t]) => t != null && t > 0 && t < END - 0.4 && KEEP.has(n)).sort((a, b) => a[1] - b[1])
    .filter(([n, t]) => { if (t - (last[n] ?? -9) < 0.4) return false; last[n] = t; return true; });
  events.push(['shiny', 27.0]);
  const NORM = (() => { try { return JSON.parse(readFileSync(join(ROOT, 'js/sfx.js'), 'utf8').match(/const NORM = (\{[^}]*\})/)[1]); } catch { return {}; } })();
  const ain = ['-ss', '109.6', '-i', join(ROOT, 'assets/audio/permafrost.m4a')]; events.forEach(([n]) => ain.push('-i', join(ROOT, 'assets/audio/sfx', n + '.mp3')));
  let af = `[2:a]atrim=0:${END},asetpts=N/SR/TB,volume=0.38,afade=t=in:st=0:d=0.15,afade=t=out:st=${(END - 1.0).toFixed(2)}:d=1.0[mus];`; const lab = ['[mus]'];
  events.forEach(([n, t], i) => { const ms = Math.round(t * 1000), g = Math.min(1.4, 0.55 * (NORM[n] ?? 1)); af += `[${i + 3}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${g.toFixed(3)},adelay=${ms}|${ms}[e${i}];`; lab.push(`[e${i}]`); });
  af += `${lab.join('')}amix=inputs=${lab.length}:normalize=0:duration=first,alimiter=limit=0.9,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;
  console.log(kind, 'sounds', events.map(([n, t]) => `${n}@${t.toFixed(1)}`).join(' '));
  const out = join(ROOT, 'store/appstore', kind); mkdirSync(out, { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', vjoin, '-framerate', String(FPS), '-i', join(capDir, '%04d.png'), ...ain, '-filter_complex', `[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v];${af}`,
    '-map', '[v]', '-map', '[aout]', '-t', END.toFixed(3), '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17', '-preset', 'slow', '-r', String(FPS), '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', join(out, 'preview.mp4')]);
  console.log(kind, '→', join(out, 'preview.mp4'), errs.length ? errs : '');
}
