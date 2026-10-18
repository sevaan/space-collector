// 30-second vertical marketing video (2026-10-18, Sevaan's script): 1080 × 1920, 30 fps, store/promo/space-collector-30s.mp4.
// Real app footage recorded from the running app (the same set-up as preview.mjs), a rendered intro (a light crossing the
// Milky Way, a phone raised into it) and end card, captions for sound-off viewing, the app's own sounds timed from the
// footage, "Permafrost" underneath, night ambience, and an ElevenLabs voiceover ("Brian"; key from ELEVENLABS_API_KEY,
// ~/.elevenlabs_key or the keychain item "elevenlabs-api-key"; without one the lines fall back to macOS `say`).
// Usage: node scripts/store/promo.mjs [record|scenes|voice|build|all]   (default all; steps reuse what's already made)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { ROOT, DEVICES, setup, hideNoise } from './common.mjs';

const step = process.argv[2] ?? 'all', OUT = join(ROOT, 'store/promo'), CLIPS = join(OUT, 'clips'), TMP = join(ROOT, 'scripts/.cache/promo');
for (const d of [OUT, CLIPS, TMP]) mkdirSync(d, { recursive: true });
const W = 1080, H = 1920, FPS = 30;
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a.flat()]);
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const data = (f, type) => `data:${type};base64,${readFileSync(f).toString('base64')}`;
const font = (f) => data(join(ROOT, 'fonts', f), 'font/ttf');

// ---------------- the timeline ----------------
const T = {
  intro: [0, 4], raise: [4, 5.4], sky: [5.4, 14], iss: [14, 16], saturn: [16, 18], thor: [18, 20],
  grid: [20, 22], moon: [22, 23.6], patch: [23.6, 25], outro: [25, 30],
};
const CAPTIONS = [ // [from, to, text]: the script's lines, on screen (no voiceover: Sevaan, 2026-10-18). The intro and
  // end card carry their own words; all of them also go to store/promo/space-collector-30s.srt.
  [4.3, 7.6, 'Point your phone. Find out.'], [7.75, 9.65, 'Track it.'], [9.75, 11.7, 'Collect it.'], [11.8, 13.9, 'Keep its card.'],
  [14.15, 15.9, 'The Space Station.'], [16.15, 17.9, 'Saturn.'], [18.15, 19.9, 'A rocket stage from 1964.'],
  [20.3, 24.85, 'Build a collection from the sky above you.'],
];
const SRT_EXTRA = [[0.4, 3.9, 'What’s that light?'], [25.5, 30, 'Space Collector. Collect the night sky.']];
const VOICE = false; // the ElevenLabs voiceover (the VO table) is kept but off
const VO = [ // [at, file, words]
  [0.45, 'vo1', 'What’s that light?'], [4.25, 'vo2', 'Point your phone. Find out.'], [8.1, 'vo3', 'Track it. Collect it. Keep its card.'],
  [14.2, 'vo4', 'The Space Station.'], [16.15, 'vo5', 'Saturn.'], [18.1, 'vo6', 'A rocket stage from 1964.'],
  [20.65, 'vo7', 'Build a collection from the sky above you.'], [25.5, 'vo8', 'Space Collector. Collect the night sky.'],
];

// ---------------- 1 · record the app ----------------
async function record() {
  const PHONE_UA = DEVICES.phone.userAgent;
  DEVICES.promo = { viewport: { width: 405, height: 720 }, deviceScaleFactor: 8 / 3, isMobile: true, hasTouch: true, userAgent: PHONE_UA, safeTop: 30, safeBottom: 22 };
  const b = await chromium.launch();
  const at = new Date(); at.setHours(20, 30, 0, 0); const now = at.getTime(), D = 864e5, here = { lat: 44.3, lon: -78.3 };
  const extra = [ // the 1964 Thor Agena D stage, and the Moon at several phases so the phase row has progress
    { time: now - 4 * D, cardKey: '733', objectId: 733, name: 'THOR AGENA D R/B', type: 'rocket-body', ...here },
    ...[0, 4, 7, 11, 15].map((k) => ({ time: now - (k + 1) * D, cardKey: 'moon', objectId: 'moon', name: 'Moon', type: 'moon', ...here })),
  ];
  const { p, ctx, errs } = await setup(b, 'promo', { extra });
  await hideNoise(p);
  // Log the app's own sounds (to put them in the soundtrack at the same moments) and give taps a visible ring.
  await p.evaluate(() => { const st = document.createElement('style'); st.textContent = '.promo-tap{position:fixed;z-index:9999;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:3px solid #fff2b3;background:rgba(255,242,179,.25);pointer-events:none;animation:ptap .6s ease-out forwards}@keyframes ptap{0%{transform:scale(.5);opacity:1}100%{transform:scale(1.6);opacity:0}}'; document.head.append(st);
    window.__tap = (x, y) => { const d = document.createElement('div'); d.className = 'promo-tap'; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.append(d); setTimeout(() => d.remove(), 700); }; });
  const cdp = await ctx.newCDPSession(p);
  const rec = async (name, ms, act) => {
    const dir = join(TMP, name); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const frames = [], on = async ({ data: d, metadata, sessionId }) => { const f = join(dir, `${String(frames.length).padStart(5, '0')}.jpg`); writeFileSync(f, Buffer.from(d, 'base64')); frames.push({ f, t: metadata.timestamp }); await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); };
    cdp.on('Page.screencastFrame', on);
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 94, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
    const t0 = Date.now() / 1000; await Promise.all([act?.(), p.waitForTimeout(ms)]);
    await cdp.send('Page.stopScreencast'); cdp.off('Page.screencastFrame', on);
    const list = frames.map((fr, i) => `file '${fr.f}'\nduration ${Math.max(0.001, (frames[i + 1]?.t ?? t0 + ms / 1000) - fr.t).toFixed(4)}`).join('\n') + `\nfile '${frames.at(-1).f}'\n`;
    writeFileSync(join(dir, 'list.txt'), list);
    // pad the start with the first frame so the clip starts exactly at t0
    const lead = Math.max(0, frames[0].t - t0);
    ff('-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'), '-vf', `tpad=start_duration=${lead.toFixed(3)}:start_mode=clone,scale=${W}:${H}:flags=lanczos,fps=${FPS},format=yuv420p`, '-t', (ms / 1000).toFixed(3), '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', join(CLIPS, name + '.mp4'));
    console.log('clip', name, frames.length, 'frames');
    return t0;
  };
  const w = (ms) => p.waitForTimeout(ms);

  // The sky: swing toward the best new thing up, lock on, track it, tap Collect, the reveal.
  const tgt = await p.evaluate(() => { const s = window.__store.state, own = new Set(s.sightings.map((x) => String(x.objectId))), rank = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    const it = s.items.filter((x) => x.look?.visible && x.look.el > 15 && !own.has(String(x.obj.id)) && !x.obj.family).sort((a, b) => (b.obj.type === 'station') - (a.obj.type === 'station') || (rank[a.obj.tier] ?? 5) - (rank[b.obj.tier] ?? 5) || (a.look.mag ?? 9) - (b.look.mag ?? 9))[0];
    if (!it) return null; s.drag.on = true; s.pinnedId = null; window.__aim = it.obj.id;
    // start from a patch of empty sky beside it, so the circle comes to it from nothing (not locked on something else)
    const vis = [...s.items, ...(s.naturals ?? [])].filter((x) => x.look?.visible && x.obj.id !== it.obj.id), sep = (a1, e1, a2, e2) => { const r = Math.PI / 180; return Math.acos(Math.min(1, Math.sin(e1 * r) * Math.sin(e2 * r) + Math.cos(e1 * r) * Math.cos(e2 * r) * Math.cos((a1 - a2) * r))) / r; };
    const starts = [[-28, -8], [28, -8], [-36, 6], [36, 6], [-24, 14], [24, 14], [-40, -4], [40, -4]].map(([da, de]) => [(it.look.az + da + 360) % 360, Math.max(10, it.look.el + de)]);
    const [az0, el0] = starts.find(([a1, e1]) => vis.every((v) => sep(a1, e1, v.look.az, v.look.el) > 11)) ?? starts[0];
    s.drag.az = az0; s.drag.el = el0;
    const ease = () => { const st = window.__store.state, i = st.items.find((x) => x.obj.id === window.__aim); if (i && window.__follow) { const da = ((i.look.az - st.drag.az + 540) % 360) - 180; st.drag.az = (st.drag.az + da * window.__follow + 360) % 360; st.drag.el += (Math.max(i.look.el, 12) - st.drag.el) * window.__follow; } requestAnimationFrame(ease); };
    window.__follow = 0; requestAnimationFrame(ease); return it.obj.name; });
  console.log('target', tgt);
  await w(400);
  const clockOff = (await p.evaluate(() => Date.now())) - Date.now(); // the page runs on a faked clock: page ms − real ms
  const skyT0 = await rec('sky', (T.sky[1] - T.sky[0]) * 1000, async () => {
    await w(300); await p.evaluate(() => { window.__follow = 0.012; });           // a slow swing toward it: the circle approaches
    await w(2300); await p.evaluate(() => { window.__follow = 0.12; });           // locked: track it
    await w(1900);
    const r = await p.locator('#d-cta').boundingBox().catch(() => null);
    if (r) { await p.evaluate(([x, y]) => window.__tap(x, y), [r.x + r.width / 2, r.y + r.height / 2]); await w(120); await p.click('#d-cta').catch(() => {}); }
  });
  const sfxLog = await p.evaluate(() => window.__sfxLog ?? []);
  await p.locator('#reveal .x-close').first().click().catch(() => {}); await w(1600);

  // The cards, tilted so the foil and glare move.
  await p.click('#nav-collection'); await w(3200);
  const f = p.frameLocator('#collection-frame'), fr = p.frame({ url: /cards\.html/ });
  const tilt = async (ms) => { const box = await f.locator('#viewer .card').first().boundingBox(); if (!box) return; const n = Math.round(ms / 40);
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 1.3 - 0.4; await p.mouse.move(box.x + box.width * (0.5 + 0.38 * Math.cos(a)), box.y + box.height * (0.5 + 0.3 * Math.sin(a * 0.8))); await w(36); } };
  // The grid first (the card just caught is the newest)
  await rec('grid', (T.grid[1] - T.grid[0]) * 1000, async () => { await w(500); await fr.evaluate(() => { const sc = document.scrollingElement; let y = 0; const t = setInterval(() => { y += 2.2; sc.scrollTo(0, y); if (y > 120) clearInterval(t); }, 16); }); });
  await fr.evaluate(() => document.scrollingElement.scrollTo(0, 0));
  for (const [name, re] of [['iss', /space station/i], ['saturn', /saturn/i], ['thor', /thor agena/i], ['moon', /\bmoon\b/i]]) {
    await f.locator('.card-tile', { hasText: re }).first().click().catch((e) => console.log(name, 'tile', e.message.slice(0, 80))); await w(1300);
    await rec(name, ((T[name][1] - T[name][0]) * 1000), () => tilt((T[name][1] - T[name][0]) * 1000 - 100));
    await p.mouse.move(5, 5); await fr.evaluate(() => document.getElementById('viewer')?.close()); await w(700);
  }
  // First Light, on the patch wall
  await f.locator('#tab-patches').click().catch(() => {}); await w(1500);
  await f.locator('.pw-item', { hasText: /first light/i }).first().click().catch((e) => console.log('patch', e.message.slice(0, 80))); await w(900);
  await rec('patch', (T.patch[1] - T.patch[0]) * 1000);
  writeFileSync(join(OUT, 'sfx.json'), JSON.stringify({ skyT0, clockOff, sfxLog }, null, 1));
  console.log('errors', errs.length ? errs : 'none');
  await b.close();
}

// ---------------- 2 · the rendered scenes: intro, the phone raised, the end card ----------------
const sceneHtml = (firstSky) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: D; src: url('${font('RussoOne-Regular.ttf')}'); } @font-face { font-family: L; src: url('${font('BarlowCondensed-Medium.ttf')}'); }
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#05090f}
#c{position:absolute;inset:0}
.cap{position:absolute;left:0;right:0;text-align:center;color:#fff2b3;font:400 92px/1.05 D;letter-spacing:-.01em;text-shadow:0 4px 30px rgba(0,0,0,.6)}
</style></head><body><canvas id="c" width="${W}" height="${H}"></canvas><div class="cap" id="cap"></div>
<img id="mw" src="${data(join(ROOT, 'assets/sky/milkyway.webp'), 'image/webp')}" style="display:none"><img id="sky1" src="${firstSky}" style="display:none"><img id="icon" src="${data(join(ROOT, 'icons/icon-512.png'), 'image/png')}" style="display:none">
<script>
const c = document.getElementById('c'), x = c.getContext('2d'), Wd = ${W}, Hd = ${H};
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const stars = Array.from({ length: 260 }, () => ({ x: rnd() * Wd, y: rnd() * Hd * 0.86, r: rnd() < .1 ? 2.4 : .8 + rnd() * 1.2, a: .35 + rnd() * .6, p: rnd() * 6.28 }));
const trees = []; for (let i = 0, s = 11; i < 140; i++) { s = (s * 16807) % 2147483647; trees.push([i * 8.2 + (s % 7), 40 + (s % 70)]); }
const ease = (k) => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
function night(t, drift = 1) {
  const g = x.createLinearGradient(0, 0, 0, Hd); g.addColorStop(0, '#04070e'); g.addColorStop(.65, '#0a1426'); g.addColorStop(1, '#13253a'); x.fillStyle = g; x.fillRect(0, 0, Wd, Hd);
  const mw = document.getElementById('mw'); x.save(); x.globalAlpha = .55; x.globalCompositeOperation = 'screen'; x.translate(Wd * .55, Hd * .38); x.rotate(-1.05 + t * 0.004 * drift); x.drawImage(mw, -1300, -260, 2600, 520); x.restore();
  for (const s of stars) { x.globalAlpha = s.a * (.75 + .25 * Math.sin(t * 1.7 + s.p)); x.fillStyle = '#fff8e2'; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.283); x.fill(); } x.globalAlpha = 1;
  x.fillStyle = '#020407'; x.beginPath(); x.moveTo(0, Hd); for (const [tx, th] of trees) { x.lineTo(tx - th * .3, Hd - 70); x.lineTo(tx, Hd - 70 - th); x.lineTo(tx + th * .3, Hd - 70); } x.lineTo(Wd, Hd); x.fill(); x.fillRect(0, Hd - 72, Wd, 72);
}
function light(t) { // a satellite: steady, unblinking, crossing slowly
  const k = t / 5.4, px = -60 + k * (Wd + 120) * .82, py = Hd * .62 - k * Hd * .34;
  const gl = x.createRadialGradient(px, py, 0, px, py, 22); gl.addColorStop(0, 'rgba(255,255,255,1)'); gl.addColorStop(.25, 'rgba(255,242,179,.7)'); gl.addColorStop(1, 'rgba(255,242,179,0)');
  x.fillStyle = gl; x.beginPath(); x.arc(px, py, 22, 0, 6.283); x.fill(); return [px, py];
}
function phone(t) { // 4.0–5.4: a phone comes up from the bottom, then its screen fills the frame
  const up = ease((t - 4) / .8), zoom = ease((t - 4.85) / .55);
  const pw = 520 + (Wd - 520) * zoom, ph = pw * 2.06, cx = Wd / 2, cy = Hd + ph / 2 - (Hd / 2 + ph / 2 - 40) * up + (Hd / 2 - (Hd / 2 - 40)) * 0 ;
  const y = (Hd + ph * .6) - ((Hd + ph * .6) - Hd / 2) * up, yy = y + (Hd / 2 - y) * zoom, r = 70 * (1 - zoom);
  x.save(); x.translate(cx, yy); x.rotate(-.06 * (1 - up) * (1 - zoom));
  x.fillStyle = '#111823'; x.beginPath(); x.roundRect(-pw / 2 - 14 * (1 - zoom), -ph / 2 - 14 * (1 - zoom), pw + 28 * (1 - zoom), ph + 28 * (1 - zoom), r + 12); x.fill();
  x.save(); x.beginPath(); x.roundRect(-pw / 2, -ph / 2, pw, ph, r); x.clip(); const s = document.getElementById('sky1'); x.drawImage(s, -pw / 2, -ph / 2, pw, ph); x.restore();
  x.restore();
}
function outro(t) { // 25–30: the logo on navy, an orbit drawn round it, a satellite on it
  const k = t - 25; const g = x.createRadialGradient(Wd / 2, Hd * .42, 0, Wd / 2, Hd * .42, Hd * .8); g.addColorStop(0, '#13253a'); g.addColorStop(.55, '#0a1426'); g.addColorStop(1, '#05090f'); x.fillStyle = g; x.fillRect(0, 0, Wd, Hd);
  for (const s of stars) { x.globalAlpha = s.a * .6 * (.75 + .25 * Math.sin(t * 1.7 + s.p)); x.fillStyle = '#fff8e2'; x.beginPath(); x.arc(s.x, s.y, s.r * .8, 0, 6.283); x.fill(); } x.globalAlpha = 1;
  const cx = Wd / 2, cy = Hd * .40, draw = ease(k / 1.4);
  x.save(); x.translate(cx, cy); x.rotate(-.42);
  for (const [rx, ry, a] of [[420, 150, .55], [330, 300, .22]]) { x.strokeStyle = 'rgba(255,242,179,' + a + ')'; x.lineWidth = 3; x.setLineDash([]); x.beginPath(); x.ellipse(0, 0, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + draw * 6.283); x.stroke(); }
  const ang = -Math.PI / 2 + k * 1.1, sx = 420 * Math.cos(ang), sy = 150 * Math.sin(ang);
  if (k > .6) { x.fillStyle = '#fa8127'; x.beginPath(); x.arc(sx, sy, 11, 0, 6.283); x.fill(); x.strokeStyle = 'rgba(250,129,39,.5)'; x.lineWidth = 3; x.beginPath(); x.arc(sx, sy, 26, 0, 6.283); x.stroke(); }
  x.restore();
  const ic = document.getElementById('icon'), a1 = ease((k - .2) / .6); x.globalAlpha = a1; x.save(); x.beginPath(); x.roundRect(cx - 120, cy - 120, 240, 240, 54); x.clip(); x.drawImage(ic, cx - 120, cy - 120, 240, 240); x.restore();
  x.textAlign = 'center'; x.fillStyle = '#fff2b3'; x.globalAlpha = ease((k - .5) / .6); x.font = '400 104px D'; x.fillText('SPACE COLLECTOR', cx, Hd * .62);
  x.globalAlpha = ease((k - .9) / .6); x.font = '500 58px L'; x.letterSpacing = '10px'; x.fillStyle = '#fa8127'; x.fillText('COLLECT THE NIGHT SKY', cx, Hd * .62 + 92); x.letterSpacing = '0px';
  const a3 = ease((k - 1.5) / .6); x.globalAlpha = a3; const bw = 560, bh = 120, by = Hd * .62 + 190;
  x.fillStyle = '#fa8127'; x.beginPath(); x.roundRect(cx - bw / 2, by, bw, bh, 60); x.fill(); x.fillStyle = '#080f1b'; x.font = '500 54px L'; x.letterSpacing = '8px'; x.fillText('START COLLECTING', cx, by + 78); x.letterSpacing = '0px';
  x.globalAlpha = ease((k - 1.9) / .6); x.fillStyle = '#c3c9d1'; x.font = '500 50px L'; x.letterSpacing = '4px'; x.fillText('spacecollector.app', cx, by + bh + 92); x.letterSpacing = '0px'; x.globalAlpha = 1;
}
window.render = (t) => {
  x.clearRect(0, 0, Wd, Hd); const cap = document.getElementById('cap');
  if (t < 5.4) { night(t); const [px, py] = light(t); if (t >= 4) phone(t);
    const a = t < 4 ? ease((t - .35) / .5) * (1 - ease((t - 3.55) / .4)) : 0; cap.style.opacity = a; cap.style.top = '${Math.round(H * 0.2)}px'; cap.textContent = 'What’s that light?'; }
  else { outro(t); cap.style.opacity = 0; }
};
</script></body></html>`;

async function scenes() {
  const first = join(TMP, 'sky-first.jpg'); ff('-i', join(CLIPS, 'sky.mp4'), '-frames:v', '1', '-q:v', '2', first);
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(sceneHtml(data(first, 'image/jpeg')), { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  for (const [name, [a, z]] of [['intro', [0, 5.4]], ['outro', T.outro]]) {
    const dir = join(TMP, 'scene-' + name); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const n = Math.round((z - a) * FPS);
    for (let i = 0; i < n; i++) { await p.evaluate((t) => window.render(t), a + i / FPS); await p.screenshot({ path: join(dir, `${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 95 }); }
    ff('-framerate', String(FPS), '-i', join(dir, '%04d.jpg'), '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p', join(CLIPS, name + '.mp4')); console.log('scene', name, n, 'frames');
  }
  // caption cards (transparent PNGs)
  for (const [i, [, , text]] of CAPTIONS.entries()) {
    await p.setContent(`<html><body style="margin:0;background:transparent"><style>@font-face{font-family:D;src:url('${font('RussoOne-Regular.ttf')}')}</style>
      <div style="width:${W}px;height:${H}px;position:relative"><div style="position:absolute;left:50%;top:${Math.round(H * 0.735)}px;transform:translateX(-50%);width:max-content;max-width:${W - 220}px;padding:22px 42px 26px;border-radius:28px;background:rgba(5,9,15,.82);border-top:5px solid #fa8127;color:#fff2b3;font:400 ${text.length > 20 ? 58 : 72}px/1.08 D;box-shadow:0 12px 40px rgba(0,0,0,.45);text-align:center;letter-spacing:-.01em">${text}</div></div></body></html>`);
    await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: join(TMP, `cap${i}.png`), omitBackground: true });
  }
  await b.close();
}

// ---------------- 3 · the voice ----------------
async function voice() {
  // The key: ELEVENLABS_API_KEY, ~/.elevenlabs_key, or the macOS keychain item "elevenlabs-api-key" (where Sevaan's is).
  const keyFile = join(homedir(), '.elevenlabs_key');
  let key = process.env.ELEVENLABS_API_KEY?.trim() || (existsSync(keyFile) ? readFileSync(keyFile, 'utf8').trim() : null);
  if (!key) try { key = execFileSync('security', ['find-generic-password', '-s', 'elevenlabs-api-key', '-w'], { encoding: 'utf8' }).trim() || null; } catch {}
  for (const [, name, words] of VO) {
    const out = join(TMP, name + '.wav');
    if (key) {
      const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/nPczCjzI2devNBz1zQrb?output_format=mp3_44100_128', { method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' },
        body: JSON.stringify({ text: words, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.15 } }) });
      if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}`);
      writeFileSync(join(TMP, name + '.mp3'), Buffer.from(await r.arrayBuffer())); ff('-i', join(TMP, name + '.mp3'), '-ar', '48000', '-ac', '2', out);
    } else { execFileSync('say', ['-v', 'Daniel', '-r', '168', '-o', join(TMP, name + '.aiff'), words]); ff('-i', join(TMP, name + '.aiff'), '-ar', '48000', '-ac', '2', out); }
    console.log('voice', name, dur(out).toFixed(2), 's', key ? '(ElevenLabs)' : '(macOS say stand-in)');
  }
}

// ---------------- 4 · build ----------------
function build() {
  // picture: the clips in order, then captions over them
  const order = ['intro', 'sky', 'iss', 'saturn', 'thor', 'grid', 'moon', 'patch', 'outro'];
  writeFileSync(join(TMP, 'concat.txt'), order.map((n) => `file '${join(CLIPS, n + '.mp4')}'`).join('\n'));
  ff('-f', 'concat', '-safe', '0', '-i', join(TMP, 'concat.txt'), '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), join(TMP, 'base.mp4'));
  const capIn = CAPTIONS.flatMap((_, i) => ['-loop', '1', '-t', '30', '-i', join(TMP, `cap${i}.png`)]);
  let fc = '', last = '0:v';
  CAPTIONS.forEach(([a, z], i) => { fc += `[${i + 1}:v]format=rgba,fade=in:st=${a}:d=0.18:alpha=1,fade=out:st=${(z - .2).toFixed(2)}:d=0.2:alpha=1[c${i}];[${last}][c${i}]overlay=0:0:enable='between(t,${a},${z})'[v${i}];`; last = `v${i}`; });
  ff('-i', join(TMP, 'base.mp4'), ...capIn, '-filter_complex', fc.slice(0, -1), '-map', `[${last}]`, '-t', '30', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', join(TMP, 'picture.mp4'));

  // sound: music bed, night ambience, the app's sounds where they happened, the voice
  const SFX = (n) => join(ROOT, 'assets/audio/sfx', n + '.mp3');
  const { skyT0, clockOff = 0, sfxLog } = JSON.parse(readFileSync(join(OUT, 'sfx.json'), 'utf8'));
  const events = [['secret', 0.5, 0.5], ['swipe', 4.45, 0.5]]; // the curious note; the phone coming up
  let xps = 0;
  for (const [name, ms] of sfxLog) { const t = T.sky[0] + ((ms - clockOff) / 1000 - skyT0); if (!(t > T.sky[0] && t < T.sky[1]) || name === 'toast' || (name === 'xp' && xps++ % 3)) continue; events.push([name, t, name === 'flip' ? 0.6 : name === 'xp' ? 0.3 : 0.9]); }
  // the lock-on tick where the circle settles on the target (if the app's own lock fell outside the clip)
  if (!events.some(([n, t]) => n === 'lock' && t > T.sky[0])) events.push(['lock', 7.75, 0.9]);
  events.push(['page', 14.05, 0.55], ['page', 16.05, 0.55], ['page', 18.05, 0.55], ['stamp', 20.2, 0.5], ['seen', 22.05, 0.5], ['patch', 23.7, 0.7], ['complete', 25.6, 0.7]);
  const ins = [['-stream_loop', '-1', '-i', join(ROOT, 'assets/audio/permafrost.m4a')], ['-f', 'lavfi', '-t', '30', '-i', 'anoisesrc=color=brown:amplitude=0.5:sample_rate=48000']];
  events.forEach(([n]) => ins.push(['-i', SFX(n)]));
  if (VOICE) VO.forEach(([, n]) => ins.push(['-i', join(TMP, n + '.wav')]));
  let af = `[0:a]atrim=0:30,asetpts=N/SR/TB,volume=${VOICE ? 0.16 : 0.26},afade=t=in:st=0:d=2.5,afade=t=out:st=27.5:d=2.5[mus];`
    + `[1:a]lowpass=f=700,highpass=f=60,volume=0.10,afade=t=in:st=0:d=1,afade=t=out:st=8:d=3,apad,atrim=0:30[amb];`;
  const lab = ['[mus]', '[amb]'];
  events.forEach(([, t, g], i) => { af += `[${i + 2}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${g},adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[e${i}];`; lab.push(`[e${i}]`); });
  if (VOICE) VO.forEach(([t], i) => { const k = events.length + 2 + i; af += `[${k}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.6,adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[vo${i}];`; lab.push(`[vo${i}]`); });
  // the voice ducks the music a little
  af += `${lab.join('')}amix=inputs=${lab.length}:normalize=0:duration=longest,atrim=0:30,alimiter=limit=0.9,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;
  ff(...ins.flat(), '-filter_complex', af, '-map', '[aout]', '-ar', '48000', '-c:a', 'pcm_s16le', join(TMP, 'sound.wav'));
  const out = join(OUT, 'space-collector-30s.mp4');
  ff('-i', join(TMP, 'picture.mp4'), '-i', join(TMP, 'sound.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out);
  const ts = (t) => { const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
  const srt = [...SRT_EXTRA, ...CAPTIONS].sort((a, b) => a[0] - b[0]).map(([a, z, text], i) => `${i + 1}\n${ts(a)} --> ${ts(z)}\n${text}\n`).join('\n');
  writeFileSync(out.replace(/\.mp4$/, '.srt'), srt);
  console.log('→', out, dur(out).toFixed(2), 's');
}

if (step === 'record' || step === 'all') await record();
if (step === 'scenes' || step === 'all') await scenes();
if ((step === 'voice' || step === 'all') && VOICE) await voice();
if (step === 'build' || step === 'all') build();
