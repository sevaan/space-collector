// Wires a design's markup (shared ids) to the engine. Each design option is only layout and look.
import { loadTonight, createSky, reveal, passNow, time, about, weatherAt, TIER, brightWord, highWord, cardImg } from './engine.js';
const $ = (id) => document.getElementById(id);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const set = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const plain = (s) => String(s ?? '').replace(/\*\*/g, '');
const say = (t) => { const a = $('announce'); if (a) a.textContent = t; };

let skyCtl = null, state = null;
async function show(file = null) {
  state = await loadTonight(file);
  const { data, cities } = state, tz = data.tz, now = Date.now();
  const sel = $('city');
  if (sel && !sel.options.length) { sel.innerHTML = cities.map(([f, c]) => `<option value="${f}">${c}</option>`).join(''); sel.onchange = () => show(sel.value); }
  if (sel) sel.value = state.file;
  set('city-name', data.city);
  const pass = passNow(data, now);
  skyCtl?.destroy(); $('after')?.setAttribute('hidden', ''); $('collect')?.setAttribute('hidden', '');
  document.querySelectorAll('#sky .rv').forEach((n) => n.remove());
  const dark = data.dusk && now >= data.dusk && (!data.dawn || now < data.dawn);
  if (!pass) {
    set('when', `Nothing bright enough over ${data.city} tonight.`);
    set('status', data.dusk ? `Dark at ${time(data.dusk, tz)}. Check back tomorrow: the sky changes every night.` : 'Bright summer nights here. Satellites shine all night, but stars are faint.');
    return;
  }
  const [gem, label, color] = TIER[pass.tier] ?? TIER.common;
  set('when', pass.over ? `Tonight's best was <b>${plain(pass.name)}</b> at about ${about(pass.start, tz)}.` : `<b>${plain(pass.name)}</b> · about ${about(pass.start, tz)}, rising in the ${pass.rise}`);
  set('status', pass.over ? `Replayed fast; the clock shows when it really crossed ${data.city}.` : !dark && data.dusk && now < data.dusk ? `It's still light in ${data.city}. Dark at ${time(data.dusk, tz)}. Here's tonight's best pass, replayed.` : `Tonight over ${data.city}, replayed fast. The clock shows the real time.`);
  weatherAt(data, pass.start).then((w) => { if (w?.cloudy) set('status', `Cloud is forecast over ${data.city} tonight (${w.cover}%). If you spot a gap, it still counts. Here's what's up there behind it.`); });
  set('go-look', pass.over ? `It's been and gone for tonight. Tomorrow's sky arrives here in the morning.` : `<b>No app needed.</b> Go look at about ${about(pass.start, tz)}: it rises in the ${pass.rise} and climbs ${highWord(pass.peakEl)}. It's ${brightWord(pass.mag)}.`);
  const sh = pass.eclipseAt ? pass : data.shiny?.key === pass.key ? data.shiny : null;
  set('shiny-line', sh?.eclipseAt ? `<b>Shiny chance:</b> it slips into Earth's shadow at about ${about(sh.eclipseAt, tz)}. Catch it just before it fades.` : '');
  set('card-line', `<span style="color:${color}">${gem} ${label}</span> · 1 of 4,850. Keep this one: it counts when you catch it for real, in the app.`);
  skyCtl = await createSky($('sky'), { data, pass,
    onClock: (t) => set('clock', time(t, tz, { second: '2-digit' })),
    onLock: (on) => { const c = $('collect'); if (!c) return; c.hidden = !on; if (on) { say(`${plain(pass.name)} is in the circle. Collect.`); c.focus({ preventScroll: true }); } },
  });
  $('collect').onclick = async () => {
    $('collect').hidden = true; skyCtl.collected();
    await reveal($('sky'), pass); say(`Collected: ${plain(pass.name)}, ${label}.`);
    $('after')?.removeAttribute('hidden');
  };
  $('catch-for-me') && ($('catch-for-me').onclick = () => skyCtl.catchForMe());
  const share = $('share');
  if (share) share.onclick = async () => {
    const text = `${plain(pass.name)} passes over ${data.city} tonight at about ${about(pass.start, tz)}. Look ${pass.rise}.`;
    try { if (navigator.share) { await navigator.share({ title: 'Space Collector', text, url: 'https://spacecollector.app' }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(`${text} https://spacecollector.app`); share.textContent = 'Copied'; } catch { share.textContent = 'Press and hold the card to save it'; }
  };
  const board = $('board-line'); if (board) board.textContent = `${plain(pass.name)} · ${data.city} · ${new Date(pass.start).toLocaleDateString([], { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' })} · about ${about(pass.start, tz)} · rises ${pass.rise}, peaks ${pass.peakEl}° up`;
}

// The hand of cards: tap to turn one over.
document.querySelectorAll('[data-flip]').forEach((b) => b.addEventListener('click', () => { const on = b.classList.toggle('over'); b.setAttribute('aria-pressed', on); }));

// Catch the fade: a ring counts down; tap in the last 2 s (or after NOW! with reduced motion).
function fadeGame(el) {
  if (!el) return; const ring = el.querySelector('.fd-ring'), msg = el.querySelector('.fd-msg'), btn = el.querySelector('.fd-again'), slow = el.querySelector('.fd-slow');
  let t0 = 0, raf = 0, done = false, speed = 1; const LEN = 6;
  const tick = () => { const left = Math.max(0, LEN - ((performance.now() - t0) / 1000) * speed); el.style.setProperty('--p', (left / LEN).toFixed(3));
    msg.textContent = left > 2 ? `Fades in ${Math.ceil(left)}s` : left > 0 ? 'NOW!' : 'Gone into the shadow'; el.classList.toggle('now', left <= 2 && left > 0);
    if (left <= 0) { done = true; el.classList.add('missed'); return; } raf = requestAnimationFrame(tick); };
  const start = () => { cancelAnimationFrame(raf); done = false; el.classList.remove('missed', 'won'); t0 = performance.now(); if (still) { el.style.setProperty('--p', '0.2'); el.classList.add('now'); msg.textContent = 'NOW! Tap'; } else raf = requestAnimationFrame(tick); };
  ring.addEventListener('pointerdown', () => { if (done) return; if (el.classList.contains('now')) { cancelAnimationFrame(raf); done = true; el.classList.add('won'); msg.textContent = 'Shiny!'; } else msg.textContent = 'Too early. Wait for NOW'; });
  btn.addEventListener('click', start); slow?.addEventListener('click', () => { speed = speed === 1 ? 0.5 : 1; slow.textContent = speed === 1 ? 'Slow it down' : 'Normal speed'; start(); });
  new IntersectionObserver(([e], ob) => { if (e.isIntersecting) { ob.disconnect(); start(); } }, { threshold: 0.6 }).observe(el);
}
fadeGame($('fade'));

// The UFO crosses the hidden section once per visit; tap it for the patch.
function ufo() {
  const host = $('hidden'), u = $('ufo'); if (!host || !u || still) return;
  let gone = false;
  new IntersectionObserver(([e], ob) => { if (!e.isIntersecting || gone) return; ob.disconnect(); setTimeout(() => { u.classList.add('fly'); setTimeout(() => { if (!u.classList.contains('caught')) u.classList.remove('fly'); }, 5200); }, 1600 + Math.random() * 2500); }, { threshold: 0.5 }).observe(host);
  u.addEventListener('click', () => { gone = true; u.classList.add('caught'); $('ufo-patch')?.removeAttribute('hidden'); say('Close Encounter patch found.'); });
}
ufo();

show().catch((e) => { console.error(e); set('status', 'Tonight’s sky couldn’t load. Check your connection and reload.'); });
