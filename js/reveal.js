// The capture moment. Chosen from design/reveal-demo.html (2026-09-29):
//  First sighting: the ring snaps shut, the object rushes at you, a flash and thump, a sealed card
//  lands glowing in its rarity colour, you tap it, it flips, light sweeps it, a ticket toast says what you earned.
//  Seen before: the card flies straight in face-up and the ticket shows the count (and any level up).
//  Everything scales with rarity (Legendary dims the sky, shockwave, held breath, slow flip, fanfare).
// Waits use timers, not animation.finished, so a paused tab can never freeze the sequence.

import { TIER_INFO } from './rarity.js?v=0.1.282';
import { levelFor, attachTilt, attachGyro, attachFlip, throwOff } from './card.js?v=0.1.282';
import { applyBack } from './card-backs.js?v=0.1.282';
import { addStarfield } from './starfield.js?v=0.1.282';

const FX = {
  common:    { particles: 14,  flip: 520,  spin: 0,   dim: 0,   shock: false, notes: [880],                            hold: 0 },
  uncommon:  { particles: 24,  flip: 560,  spin: 0,   dim: 0,   shock: false, notes: [784, 1175],                      hold: 0 },
  rare:      { particles: 50,  flip: 650,  spin: 0,   dim: .25, shock: false, notes: [659, 988, 1319],                 hold: 300 },
  epic:      { particles: 90,  flip: 800,  spin: 360, dim: .45, shock: true,  notes: [523, 784, 1047, 1568],           hold: 600 },
  legendary: { particles: 160, flip: 1100, spin: 0,   dim: .7,  shock: true,  notes: [392, 523, 659, 784, 1047, 1319], hold: 1100 },
};
const NIGHT_MILESTONES = [3, 5, 10, 25, 50, 100, 200, 365], STAMP_MILESTONES = [5, 10, 25, 50, 100, 200, 300, 400];
const LEVEL_NAME = { bronze: 'BRONZE', silver: 'SILVER', gold: 'GOLD' };
const LEVEL_COLOR = { bronze: '#c98a4b', silver: '#dfe6ee', gold: '#f2c94c' };

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
addStarfield($('reveal')); // twinkling stars behind the reveal (css/reveal.css)
function play(el, frames, opts) { el.animate(frames, opts); return sleep((opts.duration ?? 0) * (opts.iterations ?? 1)); }
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ---------- sound (iPhones can't vibrate from the web, so sound carries the "thump") ----------
let audio;
// Call from inside the tap handler, before any await, so iOS lets the sound play.
export function primeReveal() {
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch {}
}
function tone(freq, at, dur, gain = .16, type = 'sine') {
  if (!audio) return;
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + .015); g.gain.exponentialRampToValueAtTime(.0001, at + dur);
  o.connect(g).connect(audio.destination); o.start(at); o.stop(at + dur + .05);
}
function whoosh() { if (!audio) return; const t = audio.currentTime; for (let i = 0; i < 6; i++) tone(300 + i * 140, t + i * .03, .12, .05, 'triangle'); }
function thump() { if (!audio) return; const t = audio.currentTime; tone(90, t, .25, .35); tone(180, t, .12, .12, 'triangle'); }
function fanfare(notes) { if (!audio) return; const t = audio.currentTime; notes.forEach((f, i) => { tone(f, t + i * .09, .5, .13); tone(f * 2, t + i * .09, .3, .04); }); }

// ---------- particles ----------
let parts = [], loopOn = false;
function fxLoop() {
  const cv = $('rv-fx'), ctx = cv.getContext('2d');
  const d = devicePixelRatio || 1;
  if (cv.width !== innerWidth * d) { cv.width = innerWidth * d; cv.height = innerHeight * d; }
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += .12; p.vx *= .985; p.life -= .012;
    ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
    if (p.star) {
      const s = p.size * 2.2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
      ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s); ctx.fill();
    } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  if (parts.length) requestAnimationFrame(fxLoop); else loopOn = false;
}
function burst(x, y, n, color) {
  if (reduced()) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 7;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, size: 1.5 + Math.random() * 3, color, star: Math.random() < .35 });
  }
  if (!loopOn) { loopOn = true; requestAnimationFrame(fxLoop); }
}

// ---------- the sequence ----------
let run = 0, tilt = null, stopGyro = null, onFlipTap = null;
let backTilt = null, backGyro = null; // the sealed card tilts too, until it flips
function stopBack() { backGyro?.(); backTilt?.destroy(); backGyro = backTilt = null; }
function showFace(which) {
  $('rv-back').style.visibility = which === 'back' ? 'visible' : 'hidden';
  $('reveal-card').style.visibility = which === 'front' ? 'visible' : 'hidden';
}
export function stopReveal() {
  run++;
  flick = null; holderTo(0, 0, 0); $('rv-holder').style.opacity = '';
  stopGyro?.(); tilt?.destroy(); stopGyro = tilt = null;
  stopBack();
  parts = [];
  if (onFlipTap) { $('rv-holder').removeEventListener('click', onFlipTap); onFlipTap = null; }
}

function sizeCard(cardEl) {
  const root = $('reveal');
  root.style.setProperty('--cf', '12px');
  const em = Math.max(39.2, cardEl.getBoundingClientRect().height / 12);
  const cf = Math.max(7, Math.min(14, (innerWidth - 58) / 28, (innerHeight - 120) / em));
  root.style.setProperty('--cf', `${cf}px`);
  root.style.setProperty('--ch', em);
}

// card: rendered card element. o: catalogue card (for tier). seen: sightings of this card incl. this one.
// origin: {x, y} screen point the object was at (the reticle centre).
// fleet (fleet cards only): { newStamp, stamps, total, cospar, level, before }. A launch seen for the
// first time lands a NEW STAMP on the card, and the card's level counts stamps, not sightings.
// collected: how many different cards you own now, counting this one. A new card only gets a stamp when
// that number is a milestone (MILESTONES); repeat sightings keep their SEEN / NEW STAMP / level stamps.
export const MILESTONES = [1, 10, 25, 50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
// What the stamp used to say now goes out as a ticket toast (2026-10-05): main.js registers the renderer.
let announce = null;
export function onRevealNews(fn) { announce = fn; }
export async function playReveal({ card, o, seen, origin, fleet = null, progress = null, collected = 0, con = null, shiny = null, xp = 0 }) {
  stopReveal();
  const my = run;
  const fresh = seen <= 1;
  const tierKey = FX[o.tier] ? o.tier : 'common';
  const fx = FX[tierKey], color = (TIER_INFO[tierKey] ?? TIER_INFO.common).color;
  // progress (other cards): { level, before, nights }. Levels count observing nights.
  const level = fleet ? fleet.level : progress?.level ?? levelFor(seen);
  const levelUp = !fresh && (fleet ? fleet.level !== fleet.before : progress ? progress.level !== progress.before : level !== levelFor(seen - 1));
  const nights = progress?.nights ?? 0;
  const newStamp = !fresh && !!fleet?.newStamp;
  const root = $('reveal');
  root.style.setProperty('--fx', color);
  root.classList.remove('rv-done');
  $('reveal-eyebrow').textContent = (fresh ? 'NEW CARD' : newStamp ? 'NEW LAUNCH STAMP' : NIGHT_MILESTONES.includes(nights) ? `SEEN ON ${nights} NIGHTS` : 'SIGHTING RECORDED') + (xp > 0 ? `  ·  +${xp} XP` : '');
  $('reveal-card').replaceChildren(card);
  for (const id of ['rv-holder', 'rv-flipper', 'rv-dot', 'rv-dim', 'rv-flash', 'rv-shock']) $(id).getAnimations().forEach((a) => a.cancel());
  $('rv-holder').style.opacity = 0; $('rv-holder').classList.remove('live');
  $('rv-flipper').style.transform = '';
  $('rv-back').classList.remove('glow');
  $('rv-dim').style.opacity = 0;
  // Safari doesn't reliably hide the reverse face of a 3D card, so show one face at a time ourselves.
  { const rb = $('rv-back'); rb.className = rb.className.replace(/\btier-\w+|\bshiny\b|\bgold-foil\b/g, '').replace(/\s+/g, ' ').trim(); rb.classList.add(`tier-${tierKey}`); if (shiny) rb.classList.add('shiny'); if (card.classList.contains('gold-foil')) rb.classList.add('gold-foil'); }
  if (fresh) applyBack($('rv-back'));
  showFace(fresh ? 'back' : 'front');
  sizeCard(card);
  const x = origin?.x ?? innerWidth / 2, y = origin?.y ?? innerHeight * .4;
  $('rv-dot').style.left = `${x}px`; $('rv-dot').style.top = `${y}px`;
  $('rv-shock').style.left = `${x}px`; $('rv-shock').style.top = `${y}px`;
  const alive = () => my === run;

  // 1. Pulled from orbit: the object swells and rushes at you. Flash, thump, sparks.
  whoosh();
  if (fx.dim) $('rv-dim').animate([{ opacity: 0 }, { opacity: fx.dim }], { duration: 500, fill: 'forwards' });
  await play($('rv-dot'), [
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
    { transform: 'translate(-50%,-50%) scale(2.6)', opacity: 1, offset: .75 },
    { transform: 'translate(-50%,-50%) scale(5)', opacity: 0 }, // a quick pop into the flash, not a 40× blur (2026-10-08)
  ], { duration: reduced() ? 1 : 560, easing: 'cubic-bezier(.5,0,.8,.3)', fill: 'forwards' });
  if (!alive()) return;
  $('rv-flash').style.setProperty('--fx-x', `${x}px`); $('rv-flash').style.setProperty('--fx-y', `${y}px`);
  $('rv-flash').animate([{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: 0 }], { duration: 300, easing: 'ease-out' }); // short and bright, from where you caught it
  thump();
  burst(x, y + 20, Math.round(fx.particles / 2), color);
  // A crisp ring that grows (size, not scale, so its line stays thin and sharp: 2026-10-08, the scaled one smeared into a muddy disc).
  if (fx.shock) $('rv-shock').animate([{ width: '20px', height: '20px', opacity: 1, borderWidth: '3px' }, { width: '140vmax', height: '140vmax', opacity: 0, borderWidth: '1.5px' }], { duration: 760, easing: 'cubic-bezier(.15,.7,.3,1)' });

  if (!fresh) {
    // Seen before: straight to the card.
    $('rv-flipper').style.transform = 'rotateY(180deg)';
    await play($('rv-holder'), [{ opacity: 0, transform: 'scale(.5) translateY(40px)' }, { opacity: 1, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'forwards' });
    if (!alive()) return;
    return finish({ fx, color, fresh, seen, level, levelUp, card, alive, fleet, newStamp, nights, collected, con, shiny });
  }

  // 2. A sealed card lands, glowing in its rarity colour, and waits for your tap.
  await play($('rv-holder'), [{ opacity: 0, transform: 'scale(.4) translateY(60px) rotate(-8deg)' }, { opacity: 1, transform: 'scale(1.05) rotate(2deg)' }, { opacity: 1, transform: 'scale(1) rotate(0)' }], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'forwards' });
  if (!alive()) return;
  $('rv-back').classList.add('glow');
  // Listen on the holder, which doesn't rotate: the back inherits the tilt values, and the finger never
  // "leaves" the card just because its tilted edge moved out from under it.
  backTilt = attachTilt($('rv-holder'));
  if (!reduced()) backGyro = attachGyro($('rv-holder'), backTilt);
  $('rv-holder').classList.add('live');
  await new Promise((resolve) => {
    // It flips by itself after a second (2026-10-05: no more "tap to reveal"); a tap flips it sooner.
    let timer = 0;
    onFlipTap = () => { clearTimeout(timer); $('rv-holder').removeEventListener('click', onFlipTap); onFlipTap = null; primeReveal(); resolve(); };
    $('rv-holder').addEventListener('click', onFlipTap);
    timer = setTimeout(() => onFlipTap?.(), reduced() ? 400 : 1000);
  });
  if (!alive()) return;
  $('rv-holder').classList.remove('live');
  $('rv-back').classList.remove('glow');
  stopBack();

  // 3. Legendary holds its breath; then the flip (Epic spins on the way).
  if (fx.hold) await play($('rv-flipper'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-1.5deg)' }, { transform: 'rotate(1.5deg)' }, { transform: 'rotate(0)' }], { duration: fx.hold, easing: 'ease-in-out' });
  const flipMs = reduced() ? 1 : fx.flip;
  const flipped = play($('rv-flipper'), [
    { transform: 'rotateY(0) scale(1)', easing: 'cubic-bezier(.5,0,1,1)' },
    { transform: `rotateY(${90 + fx.spin / 2}deg) scale(1.12)`, offset: .5, easing: 'cubic-bezier(0,0,.4,1)' },
    { transform: `rotateY(${180 + fx.spin}deg) scale(1)` },
  ], { duration: flipMs, easing: 'linear', fill: 'forwards' }); // per-keyframe easing: edge-on exactly at flipMs / 2
  setTimeout(() => { if (alive()) showFace('front'); }, flipMs / 2); // edge-on: swap faces
  await flipped;
  if (!alive()) return;
  return finish({ fx, color, fresh, seen, level, levelUp, card, alive, fleet, newStamp, nights, collected, con, shiny });
}

// Already in your collection: the card spins out of the toast's thumbnail and settles, ready to tilt.
// from: the thumbnail's screen rect. sighting: { seen, nights, level, levelUp } when tapping View also
// counted as seeing it again tonight (then a stamp lands), or null when you're only looking.
export async function playView({ card, o, from, sighting = null, eyebrow = null }) {
  stopReveal();
  const my = run, alive = () => my === run;
  const tierKey = FX[o.tier] ? o.tier : 'common';
  const fx = FX[tierKey], color = (TIER_INFO[tierKey] ?? TIER_INFO.common).color;
  const root = $('reveal');
  root.style.setProperty('--fx', color);
  root.classList.remove('rv-done');
  $('reveal-eyebrow').textContent = eyebrow ?? (!sighting ? 'IN YOUR COLLECTION' : NIGHT_MILESTONES.includes(sighting.nights) ? `SEEN ON ${sighting.nights} NIGHTS` : 'SEEN AGAIN');
  $('reveal-card').replaceChildren(card);
  for (const id of ['rv-holder', 'rv-flipper', 'rv-dot', 'rv-dim', 'rv-flash', 'rv-shock']) $(id).getAnimations().forEach((a) => a.cancel());
  $('rv-holder').classList.remove('live');
  $('rv-back').classList.remove('glow');
  $('rv-dim').style.opacity = 0;
  $('rv-dot').style.opacity = 0;
  $('rv-flipper').style.transform = 'rotateY(180deg)';
  showFace('front');
  sizeCard(card);
  // Rise out of the thumbnail with a full turn about the vertical axis, the back showing while it faces
  // away: the same "closer look" as tapping a tile in the collection (js/cards-page.js spin).
  const h = $('rv-holder').getBoundingClientRect();
  const dx = from ? from.left + from.width / 2 - (h.left + h.width / 2) : 0;
  const dy = from ? from.top + from.height / 2 - (h.top + h.height / 2) : innerHeight * .35;
  const s = from ? Math.max(0.15, from.width / h.width) : 0.3;
  const opts = { duration: reduced() ? 1 : 760, easing: 'cubic-bezier(.25,.8,.25,1)' };
  const backEl = card.querySelector('.card__back');
  if (backEl && !reduced()) {
    applyBack(backEl);
    // Offsets are in eased progress, so the back shows exactly while rotateY is 90°–270°.
    backEl.animate([{ opacity: 0 }, { opacity: 0, offset: .25 }, { opacity: 1, offset: .25 }, { opacity: 1, offset: .75 }, { opacity: 0, offset: .75 }, { opacity: 0 }], opts);
    backEl.querySelector('.back-holo')?.animate([{ opacity: .55, backgroundPosition: '20% 20%, 80% 80%, 15% 25%' }, { opacity: .55, backgroundPosition: '80% 80%, 20% 20%, 85% 75%' }], opts);
    backEl.querySelector('.back-glare')?.animate([{ opacity: .5 }, { opacity: .5 }], opts);
  }
  whoosh();
  await play($('rv-holder'), [
    { opacity: 1, transform: `perspective(1600px) translate(${dx}px, ${dy}px) scale(${s}) rotateY(0deg)` },
    { opacity: 1, transform: 'perspective(1600px) translate(0, 0) scale(1) rotateY(360deg)' },
  ], { ...opts, fill: 'forwards' });
  if (!alive()) return;
  if (sighting) return finish({ fx, color, fresh: false, seen: sighting.seen, level: sighting.level, levelUp: sighting.levelUp, card, alive, nights: sighting.nights });
  $('rv-sweep').classList.remove('go'); void $('rv-sweep').offsetWidth; $('rv-sweep').classList.add('go');
  tilt = attachTilt(card);
  stopGyro = attachGyro(card, tilt);
  attachFlip(card, { onBack: applyBack });
  root.classList.add('rv-done');
}

// 4. Light sweeps the card, sparks fly, the stamp lands, and the card is yours to tilt.
const STAMP_INK = '#8fb8ff';
async function finish({ fx, color, fresh, seen, level, levelUp, card, alive, fleet = null, newStamp = false, nights = 0, collected = 0, con = null, shiny = null }) {
  const r = $('rv-holder').getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  fanfare(levelUp ? [...fx.notes, 1568, 2093] : fx.notes);
  burst(cx, cy, fx.particles + (levelUp ? 60 : 0) + (shiny ? 90 : 0), shiny ? '#ff8fd8' : color);
  if (shiny) setTimeout(() => { burst(cx, cy - 40, 70, '#8ff0ff'); burst(cx, cy + 40, 70, '#fff2b3'); }, 220);
  if (fx.particles > 60 || levelUp) setTimeout(() => burst(cx, cy - 60, fx.particles / 2 + 20, levelUp ? LEVEL_COLOR[level] : '#ffffff'), 180);
  $('rv-sweep').classList.remove('go'); void $('rv-sweep').offsetWidth; $('rv-sweep').classList.add('go');
  await sleep(500);
  if (!alive()) return;
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  const stampLine = fleet ? `LAUNCH ${fleet.cospar} · ${fleet.stamps} OF ${fleet.total}` : '';
  const conDone = !!con && con.level === 'gold';
  const milestone = (fresh && (!!con || MILESTONES.includes(collected))) || !!shiny;
  // The stamp that used to land on the card is now a ticket toast with the same words.
  const news = shiny && !conDone ? { kind: 'event', eyebrow: 'SHINY!', line: shiny.label }
    : fresh && con ? (conDone ? { kind: 'event', eyebrow: `${con.name.toUpperCase()} COMPLETE`, line: `All ${con.total} stars`, art: con.art } : { kind: 'xp', eyebrow: con.name.toUpperCase(), line: `${con.have} of ${con.total} stars`, art: con.art })
    : fresh ? (milestone ? { kind: 'event', eyebrow: 'MILESTONE', line: collected === 1 ? 'First item collected' : `${collected.toLocaleString('en-US')} items collected` } : null)
    : newStamp ? (STAMP_MILESTONES.includes(fleet?.stamps) ? { kind: 'event', eyebrow: 'NEW STAMP', line: `${fleet.stamps} launches stamped` } : { kind: 'xp', eyebrow: 'NEW STAMP', line: stampLine })
    : NIGHT_MILESTONES.includes(nights) ? { kind: 'event', eyebrow: 'MILESTONE', line: `Seen on ${nights} different nights` }
    : null; // a plain repeat: no toast (2026-10-07)
  if (news) { announce?.({ ...news, ms: 3200, delay: 900 }); thump(); }
  if (!reduced()) $('reveal').animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(3px,-2px)' }, { transform: 'translate(0,0)' }], { duration: 180 });
  if (levelUp) card.querySelector('.card__face')?.animate([{ boxShadow: '0 0 0 transparent' }, { boxShadow: `0 0 34px ${LEVEL_COLOR[level]}` }, { boxShadow: '0 0 0 transparent' }], { duration: 1300 });
  tilt = attachTilt(card);
  stopGyro = attachGyro(card, tilt);
  attachFlip(card, { onBack: applyBack });
  $('reveal').classList.add('rv-done');
}

// Flick the finished card up and away to go back to the sky. Dragging still just tilts the card (the card
// never follows your finger); only a quick, mostly upward flick throws it off the top of the screen.
let onDismiss = null, flick = null;
export function onRevealDismiss(fn) { onDismiss = fn; }
function holderTo(x, y, ms) {
  const h = $('rv-holder');
  h.style.transition = ms ? `transform ${ms}ms cubic-bezier(.3,.6,.4,1), opacity ${ms}ms` : 'none';
  h.style.transform = x || y ? `translate(${x}px, ${y}px)` : '';
}
{
  const h = $('rv-holder');
  h.addEventListener('pointerdown', (e) => {
    if (!$('reveal').classList.contains('rv-done') || (e.pointerType === 'mouse' && e.button !== 0)) return;
    flick = { id: e.pointerId, pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }] };
  });
  h.addEventListener('pointermove', (e) => {
    if (!flick || e.pointerId !== flick.id) return;
    flick.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (flick.pts.length > 12) flick.pts.shift();
  });
  const end = (e) => {
    if (!flick || e.pointerId !== flick.id) return;
    const pts = flick.pts; flick = null;
    const last = pts[pts.length - 1], now = performance.now();
    const from = pts.find((p) => now - p.t < 140) ?? pts[0];   // the last ~0.15 s of the gesture
    const dx = last.x - from.x, dy = last.y - from.y, dt = Math.max(16, now - from.t);
    const total = last.y - pts[0].y;
    if (!(dy < -45 && total < -60 && Math.abs(dx) < -dy * 0.9 && -dy / dt > 0.6)) return;
    // Fly off the top at the speed of the flick (no fade: you should see it go), keeping some of the
    // sideways throw and a little spin that way.
    h.getAnimations().forEach((a) => a.cancel()); h.style.opacity = '1';
    tilt?.reset();
    const ms = throwOff(h, dx, dy, dt);
    setTimeout(() => { h.getAnimations().forEach((a) => a.cancel()); h.style.opacity = ''; onDismiss?.(); }, ms + 20);
  };
  h.addEventListener('pointerup', end);
  h.addEventListener('pointercancel', () => { flick = null; });
}
