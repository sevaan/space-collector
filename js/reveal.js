// The capture moment. Chosen from design/reveal-demo.html (2026-09-29):
//  First sighting: the ring snaps shut, the object rushes at you, a flash and thump, a sealed card
//  lands glowing in its rarity colour, you tap it, it flips, light sweeps it, a stamp lands.
//  Seen before: the card flies straight in face-up and the stamp shows the count (and any level up).
//  Everything scales with rarity (Legendary dims the sky, shockwave, held breath, slow flip, fanfare).
// Waits use timers, not animation.finished, so a paused tab can never freeze the sequence.

import { TIER_INFO } from './rarity.js?v=0.1.59';
import { levelFor, attachTilt, attachGyro } from './card.js?v=0.1.59';

const FX = {
  common:    { particles: 14,  flip: 520,  spin: 0,   dim: 0,   shock: false, notes: [880],                            hold: 0 },
  uncommon:  { particles: 24,  flip: 560,  spin: 0,   dim: 0,   shock: false, notes: [784, 1175],                      hold: 0 },
  rare:      { particles: 50,  flip: 650,  spin: 0,   dim: .25, shock: false, notes: [659, 988, 1319],                 hold: 300 },
  epic:      { particles: 90,  flip: 800,  spin: 360, dim: .45, shock: true,  notes: [523, 784, 1047, 1568],           hold: 600 },
  legendary: { particles: 160, flip: 1100, spin: 0,   dim: .7,  shock: true,  notes: [392, 523, 659, 784, 1047, 1319], hold: 1100 },
};
const LEVEL_NAME = { bronze: 'BRONZE', silver: 'SILVER', gold: 'GOLD' };
const LEVEL_COLOR = { bronze: '#c98a4b', silver: '#dfe6ee', gold: '#f2c94c' };

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
function showFace(which) {
  $('rv-back').style.visibility = which === 'back' ? 'visible' : 'hidden';
  $('reveal-card').style.visibility = which === 'front' ? 'visible' : 'hidden';
}
export function stopReveal() {
  run++;
  stopGyro?.(); tilt?.destroy(); stopGyro = tilt = null;
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
export async function playReveal({ card, o, seen, origin, fleet = null, progress = null }) {
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
  $('reveal-eyebrow').textContent = fresh ? 'FIRST DISCOVERY' : levelUp ? `${LEVEL_NAME[level]} CARD UNLOCKED` : newStamp ? 'NEW LAUNCH STAMP' : 'SIGHTING RECORDED';
  $('reveal-card').replaceChildren(card);
  for (const id of ['rv-holder', 'rv-flipper', 'rv-stamp', 'rv-dot', 'rv-dim', 'rv-flash', 'rv-shock']) $(id).getAnimations().forEach((a) => a.cancel());
  $('rv-holder').style.opacity = 0; $('rv-holder').classList.remove('live');
  $('rv-flipper').style.transform = '';
  $('rv-stamp').style.opacity = 0;
  $('rv-back').classList.remove('glow');
  $('rv-dim').style.opacity = 0;
  // Safari doesn't reliably hide the reverse face of a 3D card, so show one face at a time ourselves.
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
    { transform: 'translate(-50%,-50%) scale(2.2)', opacity: 1, offset: .45 },
    { transform: 'translate(-50%,-50%) scale(40)', opacity: 0 },
  ], { duration: reduced() ? 1 : 620, easing: 'cubic-bezier(.5,0,.8,.3)', fill: 'forwards' });
  if (!alive()) return;
  $('rv-flash').animate([{ opacity: 0 }, { opacity: .9 }, { opacity: 0 }], { duration: 420 });
  thump();
  burst(x, y + 20, Math.round(fx.particles / 2), color);
  if (fx.shock) $('rv-shock').animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(22)', opacity: 0 }], { duration: 900, easing: 'ease-out' });

  if (!fresh) {
    // Seen before: straight to the card.
    $('rv-flipper').style.transform = 'rotateY(180deg)';
    await play($('rv-holder'), [{ opacity: 0, transform: 'scale(.5) translateY(40px)' }, { opacity: 1, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'forwards' });
    if (!alive()) return;
    return finish({ fx, color, fresh, seen, level, levelUp, card, alive, fleet, newStamp, nights });
  }

  // 2. A sealed card lands, glowing in its rarity colour, and waits for your tap.
  await play($('rv-holder'), [{ opacity: 0, transform: 'scale(.4) translateY(60px) rotate(-8deg)' }, { opacity: 1, transform: 'scale(1.05) rotate(2deg)' }, { opacity: 1, transform: 'scale(1) rotate(0)' }], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'forwards' });
  if (!alive()) return;
  $('rv-back').classList.add('glow');
  $('rv-holder').classList.add('live');
  await new Promise((resolve) => {
    onFlipTap = () => { $('rv-holder').removeEventListener('click', onFlipTap); onFlipTap = null; primeReveal(); resolve(); };
    $('rv-holder').addEventListener('click', onFlipTap);
  });
  if (!alive()) return;
  $('rv-holder').classList.remove('live');
  $('rv-back').classList.remove('glow');

  // 3. Legendary holds its breath; then the flip (Epic spins on the way).
  if (fx.hold) await play($('rv-flipper'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-1.5deg)' }, { transform: 'rotate(1.5deg)' }, { transform: 'rotate(0)' }], { duration: fx.hold, easing: 'ease-in-out' });
  const flipMs = reduced() ? 1 : fx.flip;
  const flipped = play($('rv-flipper'), [
    { transform: 'rotateY(0) scale(1)' },
    { transform: `rotateY(${90 + fx.spin / 2}deg) scale(1.12)`, offset: .5 },
    { transform: `rotateY(${180 + fx.spin}deg) scale(1)` },
  ], { duration: flipMs, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  setTimeout(() => { if (alive()) showFace('front'); }, flipMs / 2); // edge-on: swap faces
  await flipped;
  if (!alive()) return;
  return finish({ fx, color, fresh, seen, level, levelUp, card, alive, fleet, newStamp, nights });
}

// 4. Light sweeps the card, sparks fly, the stamp lands, and the card is yours to tilt.
const STAMP_INK = '#8fb8ff';
async function finish({ fx, color, fresh, seen, level, levelUp, card, alive, fleet = null, newStamp = false, nights = 0 }) {
  const r = $('rv-holder').getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  fanfare(levelUp ? [...fx.notes, 1568, 2093] : fx.notes);
  burst(cx, cy, fx.particles + (levelUp ? 60 : 0), color);
  if (fx.particles > 60 || levelUp) setTimeout(() => burst(cx, cy - 60, fx.particles / 2 + 20, levelUp ? LEVEL_COLOR[level] : '#ffffff'), 180);
  $('rv-sweep').classList.remove('go'); void $('rv-sweep').offsetWidth; $('rv-sweep').classList.add('go');
  await sleep(500);
  if (!alive()) return;
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  const stampLine = fleet ? `LAUNCH ${fleet.cospar} · ${fleet.stamps} OF ${fleet.total}` : '';
  $('rv-stamp').innerHTML = fresh ? `FIRST SIGHTING<small>${fleet ? stampLine : date}</small>`
    : newStamp ? `NEW STAMP<small>${levelUp ? `${LEVEL_NAME[level]} CARD UNLOCKED` : stampLine}</small>`
    : levelUp ? `SEEN ${seen}×<small>${LEVEL_NAME[level]} CARD UNLOCKED</small>` : `SEEN ${seen}×<small>${nights > 1 ? `${nights} NIGHTS · ` : ''}${date}</small>`;
  $('rv-stamp').style.setProperty('--stamp', levelUp ? LEVEL_COLOR[level] : newStamp ? STAMP_INK : color);
  await play($('rv-stamp'), [
    { opacity: 0, transform: 'translate(-50%,-50%) rotate(-9deg) scale(2.6)' },
    { opacity: 1, transform: 'translate(-50%,-50%) rotate(-9deg) scale(.95)', offset: .7 },
    { opacity: 1, transform: 'translate(-50%,-50%) rotate(-9deg) scale(1)' },
  ], { duration: 360, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
  if (!alive()) return;
  thump();
  if (!reduced()) $('reveal').animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(3px,-2px)' }, { transform: 'translate(0,0)' }], { duration: 180 });
  if (levelUp) card.querySelector('.card__face')?.animate([{ boxShadow: '0 0 0 transparent' }, { boxShadow: `0 0 34px ${LEVEL_COLOR[level]}` }, { boxShadow: '0 0 0 transparent' }], { duration: 1300 });
  tilt = attachTilt(card);
  stopGyro = attachGyro(card, tilt);
  $('reveal').classList.add('rv-done');
  setTimeout(() => { if (alive()) $('rv-stamp').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: 'forwards' }); }, 2200);
}
