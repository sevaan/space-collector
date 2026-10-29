// The capture moment. Chosen from design/reveal-demo.html (2026-09-29):
//  First sighting: the ring snaps shut, the object rushes at you, a flash and thump, a sealed card
//  lands glowing in its rarity colour, you tap it, it flips, light sweeps it, a ticket toast says what you earned.
//  Seen before: the card flies straight in face-up and the ticket shows the count (and any level up).
//  Everything scales with rarity (Legendary dims the sky, shockwave, held breath, slow flip, fanfare).
// Waits use timers, not animation.finished, so a paused tab can never freeze the sequence.

import { sfx, loadSfx, heartbeat } from './sfx.js?v=0.1.1331';
import { audioCtx } from './audio-ctx.js?v=0.1.1331';
import { TIER_INFO } from './rarity.js?v=0.1.1331';
import { levelFor, attachTilt, attachGyro, attachFlip, throwOff, retype } from './card.js?v=0.1.1331';
import { applyBack } from './card-backs.js?v=0.1.1331';
import { addStarfield } from './starfield.js?v=0.1.1331';

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

// ---------- sound (iPhones can’t vibrate from the web, so sound carries the "thump") ----------
// Call from inside the tap handler, before any await, so iOS lets the sound play. The sounds themselves are the
// designed set (js/sfx.js, 2026-10-11); the old oscillator tones are gone.
export function primeReveal() { audioCtx(); loadSfx(); }
const STINGER = { common: 'r_common', uncommon: 'r_uncommon', rare: 'r_rare', epic: 'r_epic', legendary: 'r_legend' };

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

// A page left zoomed in (a pinch, or iOS's double-tap zoom) makes every overlay bigger than the screen, with the
// reveal's top row and the card off the top (Duo playtest 2026-10-22). Opening a card snaps the zoom back: briefly
// capping the viewport's scale makes WebKit return to 1.
function unzoom() {
  if (!(window.visualViewport?.scale > 1.01)) return;
  const m = document.querySelector('meta[name="viewport"]'); if (!m) return;
  const was = m.content; m.content = `${was}, maximum-scale=1`; setTimeout(() => { m.content = was; }, 400);
}
// Fold, unfold or rotate with a card up: size it again for the new window (big-screen playtest 2026-10-22: it kept the
// old size, a small card in the middle of an iPad).
let sizedCard = null;
addEventListener('resize', () => { if (sizedCard && !$('reveal').hidden) requestAnimationFrame(() => sizeCard(sizedCard)); });
function sizeCard(cardEl) {
  sizedCard = cardEl;
  unzoom();
  const root = $('reveal');
  root.style.setProperty('--cf', '12px');
  const em = Math.max(39.2, cardEl.getBoundingClientRect().height / 12);
  // Room for the header and chips above, the rank bar and link below (2026-10-12: the card sat high over dead space).
  let cf = Math.max(7, Math.min(Math.min(innerWidth, innerHeight) >= 600 ? 18 : 14, (innerWidth - 58) / 28, (innerHeight - 270) / em)); /* big screens (iPad, unfolded Duo) may go to 18, like the docked card (iPad/Duo playtest 2026-10-24: 100pt empty bands) */ // 270: both zones plus the notch and home bar
  root.style.removeProperty('--rv-y');
  root.style.setProperty('--cf', `${cf}px`);
  root.style.setProperty('--ch', em);
  // Then check it really sits between the top row and the rank bar (or View in collection) as laid out, and if not
  // shrink it and centre it in the room there is (iPhone Duo playtest 2026-10-22: on the unfolded Duo the card ran off
  // the top of the screen with the ✕; the rows around it grow with Larger Text). Phones that fit are left as they were.
  const h = $('rv-holder'), H = root.clientHeight;
  if (!H || !h.offsetHeight) return;
  const news = $('rv-news'), top = Math.max($('rv-top').offsetTop + $('rv-top').offsetHeight, news ? news.offsetTop + 26 : 0) + 8; /* clear the chips row too */
  const teach = root.classList.contains('teaching') ? $('rv-teach') : null; /* the lesson panel under the card (2026-10-25) */
  const under = teach ?? (root.classList.contains('has-rank') ? $('rv-rank') : $('reveal-view')), bot = (under.offsetHeight ? under.offsetTop : H) - 8;
  // Grow (or shrink) it to the room there really is: the 270 above is a guess, and on phones it left the card small with
  // dead space above and below (Sevaan 2026-10-22: "has room to be bigger"). 20px a side, 14 at most (big screens).
  cf = Math.max(5, Math.min(Math.min(innerWidth, innerHeight) >= 600 ? 18 : 14, 0.95 * (bot - top) / em, 0.95 * (root.clientWidth - 40) / 28)); /* 5% smaller for air above and below (Sevaan 2026-10-25: "just a tiny bit") */ /* same cap as the first pass (iPad playtest 2026-10-24: this clamped it back to 14) */
  root.style.setProperty('--cf', `${cf}px`);
  if (h.offsetTop >= top && h.offsetTop + h.offsetHeight <= bot) return;
  root.style.setProperty('--rv-y', `${((top + bot) / 2 - H / 2).toFixed(1)}px`);
}

// A lesson panel under the card (2026-10-25, Sevaan; design/first-night.html 04): the card shrinks to make room above
// it, eased over a third of a second (instant under Reduce Motion), and grows back when it goes.
export function teachRoom(on) {
  const root = $('reveal'); if (!sizedCard || root.hidden) return;
  const read = (k, d) => { const v = parseFloat(getComputedStyle(root).getPropertyValue(k)); return Number.isFinite(v) ? v : d; };
  const from = read('--cf', 12), fromY = read('--rv-y', 22);
  root.classList.toggle('teaching', on); sizeCard(sizedCard);
  const to = read('--cf', from), toY = read('--rv-y', 22);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || (Math.abs(to - from) < 0.05 && Math.abs(toY - fromY) < 0.5)) return;
  const t0 = performance.now(), ms = 320;
  const step = (t) => { const u = Math.min(1, (t - t0) / ms), e = 1 - (1 - u) ** 3;
    root.style.setProperty('--cf', `${(from + (to - from) * e).toFixed(3)}px`); root.style.setProperty('--rv-y', `${(fromY + (toY - fromY) * e).toFixed(2)}px`);
    if (u < 1) requestAnimationFrame(step); };
  root.style.setProperty('--cf', `${from}px`); root.style.setProperty('--rv-y', `${fromY}px`); requestAnimationFrame(step);
}

// card: rendered card element. o: catalogue card (for tier). seen: sightings of this card incl. this one.
// origin: {x, y} screen point the object was at (the reticle centre).
// fleet (fleet cards only): { newStamp, stamps, total, cospar, level, before }. A launch seen for the
// first time lands a NEW STAMP on the card, and the card’s level counts stamps, not sightings.
// collected: how many different cards you own now, counting this one. A new card only gets a stamp when
// that number is a milestone (MILESTONES); repeat sightings keep their SEEN / NEW STAMP / level stamps.
export const MILESTONES = [1, 10, 25, 50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
// What the stamp used to say now goes out as a ticket toast (2026-10-05): main.js registers the renderer.
let announce = null;
export function onRevealNews(fn) { announce = fn; }
export async function playReveal({ card, o, seen, origin, fleet = null, progress = null, collected = 0, con = null, shiny = null, xp = 0, rank = null, earned = [] }) {
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
  $('reveal-eyebrow').textContent = fresh ? 'NEW CARD' : newStamp ? (fleet?.line ? 'NEW PHASE STAMP' : 'NEW LAUNCH STAMP') : NIGHT_MILESTONES.includes(nights) ? `SEEN ON ${nights} NIGHTS` : 'SEEN AGAIN';
  if (xp > 0) $('reveal-eyebrow').insertAdjacentHTML('beforeend', `<span class="rv-xp"><span class="rv-roll"><span><i class="rv-dot">·</i>+${xp} XP</span></span></span>`); // rolls in when the card lands
  setRank(xp > 0 ? rank : null);
  $('rv-news').replaceChildren(); earnedNow = earned;
  $('reveal-card').replaceChildren(card);
  for (const id of ['rv-holder', 'rv-flipper', 'rv-dot', 'rv-dim', 'rv-flash', 'rv-shock']) $(id).getAnimations().forEach((a) => a.cancel());
  $('rv-holder').style.opacity = 0; $('rv-holder').classList.remove('live');
  $('rv-flipper').style.transform = '';
  $('rv-back').classList.remove('glow');
  $('rv-dim').style.opacity = 0;
  // Safari doesn’t reliably hide the reverse face of a 3D card, so show one face at a time ourselves.
  { const rb = $('rv-back'); rb.className = rb.className.replace(/\btier-\w+|\bshiny\b|\bgold-foil\b/g, '').replace(/\s+/g, ' ').trim(); rb.classList.add(`tier-${tierKey}`); if (shiny) rb.classList.add('shiny'); if (card.classList.contains('gold-foil')) rb.classList.add('gold-foil'); }
  if (fresh) applyBack($('rv-back'), o);
  showFace(fresh ? 'back' : 'front');
  sizeCard(card);
  const x = origin?.x ?? innerWidth / 2, y = origin?.y ?? innerHeight * .4;
  $('rv-dot').style.left = `${x}px`; $('rv-dot').style.top = `${y}px`;
  $('rv-shock').style.left = `${x}px`; $('rv-shock').style.top = `${y}px`;
  const alive = () => my === run;

  // 1. Pulled from orbit: the object swells and rushes at you. Flash, sparks.
  sfx('arrive');
  if (fx.dim) $('rv-dim').animate([{ opacity: 0 }, { opacity: fx.dim }], { duration: 260, fill: 'forwards' });
  await play($('rv-dot'), [
    // It answers the tap at once (UX room 2026-10-12: 500 ms of nearly nothing): a pop out, then the rush into the flash.
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, easing: 'cubic-bezier(.2,.9,.3,1)' },
    { transform: 'translate(-50%,-50%) scale(1.7)', opacity: 1, offset: .35, easing: 'cubic-bezier(.5,0,.8,.4)' },
    { transform: 'translate(-50%,-50%) scale(5)', opacity: 0 }, // a quick pop into the flash, not a 40× blur (2026-10-08)
  ], { duration: reduced() ? 1 : 400, fill: 'forwards' });
  if (!alive()) return;
  $('rv-flash').style.setProperty('--fx-x', `${x}px`); $('rv-flash').style.setProperty('--fx-y', `${y}px`);
  $('rv-flash').animate([{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: 0 }], { duration: 300, easing: 'ease-out' }); // short and bright, from where you caught it
  burst(x, y + 20, Math.round(fx.particles / 2), color);
  // A crisp ring that grows (size, not scale, so its line stays thin and sharp: 2026-10-08, the scaled one smeared into a muddy disc).
  if (fx.shock && !reduced()) $('rv-shock').animate([{ width: '20px', height: '20px', opacity: 1, borderWidth: '3px' }, { width: '140vmax', height: '140vmax', opacity: 0, borderWidth: '1.5px' }], { duration: 760, easing: 'cubic-bezier(.15,.7,.3,1)' });

  if (!fresh) {
    // Seen before: straight to the card.
    $('rv-flipper').style.transform = 'rotateY(180deg)';
    await play($('rv-holder'), [{ opacity: 0, transform: 'scale(.5) translateY(40px)' }, { opacity: 1, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: reduced() ? 1 : 480, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'forwards' });
    if (!alive()) return;
    return finish({ fx, color, fresh, seen, level, levelUp, card, alive, fleet, newStamp, nights, collected, con, shiny });
  }

  // 2. A sealed card lands, glowing in its rarity colour, and waits for your tap.
  await play($('rv-holder'), [{ opacity: 0, transform: 'scale(.4) translateY(60px) rotate(-8deg)' }, { opacity: 1, transform: 'scale(1.05) rotate(2deg)' }, { opacity: 1, transform: 'scale(1) rotate(0)' }], { duration: reduced() ? 1 : 520, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'forwards' });
  if (!alive()) return;
  $('rv-back').classList.add('glow');
  // Listen on the holder, which doesn’t rotate: the back inherits the tilt values, and the finger never
  // "leaves" the card just because its tilted edge moved out from under it.
  backTilt = attachTilt($('rv-holder'));
  if (!reduced()) backGyro = attachGyro($('rv-holder'), backTilt);
  $('rv-holder').classList.add('live');
  await new Promise((resolve) => {
    // It flips by itself after a second (2026-10-05: no more "tap to reveal"); a tap flips it sooner.
    let timer = 0;
    const beats = [];
    onFlipTap = () => { clearTimeout(timer); beats.forEach(clearTimeout); $('rv-holder').removeEventListener('click', onFlipTap); onFlipTap = null; primeReveal(); resolve(); };
    $('rv-holder').addEventListener('click', onFlipTap);
    // A heartbeat before the big ones (2026-10-21, slick idea 05, Sevaan): for Epic and Legendary the wait is two slow
    // double beats (thump-thump, thump-thump): the sky dims a little more and the card's glow swells on each, and the
    // phone thumps in time; then it turns over. A tap still turns it at once.
    const big = !reduced() && ['epic', 'legendary'].includes(tierKey);
    if (big) for (const [ms, strong] of [[120, false], [330, true], [980, false], [1190, true]]) beats.push(setTimeout(() => { if (!alive() || !onFlipTap) return; heartbeat(strong); dispatchEvent(new CustomEvent('sc:heartbeat', { detail: { strong } }));
      $('rv-dim').animate([{ opacity: getComputedStyle($('rv-dim')).opacity }, { opacity: strong ? .9 : .8, offset: .25 }, { opacity: getComputedStyle($('rv-dim')).opacity }], { duration: 420, easing: 'ease-out' });
      $('rv-holder').animate([{ transform: 'scale(1)', filter: 'none' }, { transform: `scale(${strong ? 1.05 : 1.03})`, filter: strong ? 'brightness(1.25)' : 'brightness(1.12)', offset: .2 }, { transform: 'scale(1)', filter: 'none' }], { duration: 360, easing: 'ease-out', composite: 'add' }); }, ms));
    timer = setTimeout(() => onFlipTap?.(), reduced() ? 400 : big ? 1700 : ['common', 'uncommon'].includes(tierKey) ? 700 : 1000); // the rare ones keep their second of suspense
  });
  if (!alive()) return;
  $('rv-holder').classList.remove('live');
  $('rv-back').classList.remove('glow');
  stopBack();

  // 3. Legendary holds its breath; then the flip (Epic spins on the way).
  if (fx.hold && !reduced()) await play($('rv-flipper'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-1.5deg)' }, { transform: 'rotate(1.5deg)' }, { transform: 'rotate(0)' }], { duration: fx.hold, easing: 'ease-in-out' });
  const flipMs = reduced() ? 1 : fx.flip;
  sfx('flip');
  const flipped = play($('rv-flipper'), [
    { transform: 'rotateY(0) scale(1)', easing: 'cubic-bezier(.5,0,1,1)' },
    { transform: `rotateY(${90 + fx.spin / 2}deg) scale(1.12)`, offset: .5, easing: 'cubic-bezier(0,0,.4,1)' },
    { transform: `rotateY(${180 + fx.spin}deg) scale(1)` },
  ], { duration: flipMs, easing: 'linear', fill: 'forwards' }); // per-keyframe easing: edge-on exactly at flipMs / 2
  // Swap faces on the edge-on frame, read from the turn’s own clock (2026-10-17). Safari ignores backface-visibility
  // here (the card’s children have their own transforms), so relying on it showed the front mirrored mid-turn; a
  // plain half-time timer could drift a frame and flash.
  // Epic and Legendary spin a whole extra turn on the way (540°), so one swap at half-time left the back showing from
  // behind for a quarter turn (2026-10-24, Sevaan: the Golden Record flip was janky). Each frame shows whichever face
  // is toward you, read from the card's actual angle (cos θ < 0: the front, which sits turned 180° inside the flipper).
  { const a = $('rv-flipper').getAnimations().at(-1), fl = $('rv-flipper');
    const tick = () => { if (!alive()) return; const done = !a || a.playState === 'finished';
      if (done) { showFace('front'); return; }
      const m = new DOMMatrix(getComputedStyle(fl).transform); showFace(m.m11 < 0 ? 'front' : 'back'); requestAnimationFrame(tick); };
    requestAnimationFrame(tick); }
  await flipped;
  if (!alive()) return;
  showFace('front');
  retype(card);
  return finish({ fx, color, fresh, seen, level, levelUp, card, alive, fleet, newStamp, nights, collected, con, shiny });
}

// Already in your collection: the card spins out of the toast’s thumbnail and settles, ready to tilt.
// from: the thumbnail’s screen rect. sighting: { seen, nights, level, levelUp } when tapping View also
// counted as seeing it again tonight (then a stamp lands), or null when you’re only looking.
export async function playView({ card, o, from, sighting = null, eyebrow = null }) {
  stopReveal();
  const my = run, alive = () => my === run;
  const tierKey = FX[o.tier] ? o.tier : 'common';
  const fx = FX[tierKey], color = (TIER_INFO[tierKey] ?? TIER_INFO.common).color;
  $('rv-news').replaceChildren(); // a plain view shows no earned chips (playtest 2026-10-16: the last catch’s chips came back)
  const root = $('reveal');
  root.style.setProperty('--fx', color);
  root.classList.remove('rv-done');
  setRank(null);
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
  setTimeout(() => { if (alive()) retype(card); }, opts.duration * .6); // the launch line types in once the face is round
  const backEl = card.querySelector('.card__back');
  if (backEl && !reduced()) {
    applyBack(backEl, o);
    // Offsets are in eased progress, so the back shows exactly while rotateY is 90°–270°.
    backEl.animate([{ opacity: 0 }, { opacity: 0, offset: .25 }, { opacity: 1, offset: .25 }, { opacity: 1, offset: .75 }, { opacity: 0, offset: .75 }, { opacity: 0 }], opts);
    backEl.querySelector('.back-holo')?.animate([{ opacity: .55, backgroundPosition: '20% 20%, 80% 80%, 15% 25%' }, { opacity: .55, backgroundPosition: '80% 80%, 20% 20%, 85% 75%' }], opts);
    backEl.querySelector('.back-glare')?.animate([{ opacity: .5 }, { opacity: .5 }], opts);
  }
  sfx('arrive', { gain: 0.7 });
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
  // The haptic lands with the payoff, not when the sealed card arrives (UX room 2026-10-12): main.js listens.
  dispatchEvent(new CustomEvent('sc:payoff', { detail: { tier: Object.keys(FX).find((k) => FX[k] === fx) ?? 'common', fresh, levelUp, newStamp: !!newStamp } }));
  // The payoff: the rarity stinger for a new card, a soft tap for one you have; layers for level-up, stamp and shiny.
  const tk = Object.keys(STINGER).find((k) => FX[k] === fx) ?? 'common';
  sfx(fresh ? STINGER[tk] : newStamp ? 'stamp' : 'seen');
  if (levelUp) sfx('levelup', { delay: 0.35 });
  if (shiny) sfx('shiny', { delay: 0.25 }); // the loudest stinger (sfx.js NORM; it was quieter than a Common)
  burst(cx, cy, fx.particles + (levelUp ? 60 : 0) + (shiny ? 90 : 0), shiny ? '#ff8fd8' : color);
  if (shiny) setTimeout(() => { burst(cx, cy - 40, 70, '#8ff0ff'); burst(cx, cy + 40, 70, '#fff2b3'); }, 220);
  if (fx.particles > 60 || levelUp) setTimeout(() => burst(cx, cy - 60, fx.particles / 2 + 20, levelUp ? LEVEL_COLOR[level] : '#ffffff'), 180);
  $('rv-sweep').classList.remove('go'); void $('rv-sweep').offsetWidth; $('rv-sweep').classList.add('go');
  await sleep(250);
  if (!alive()) return;
  const date = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  const stampLine = fleet ? (fleet.line ?? `LAUNCH ${fleet.cospar} · ${fleet.stamps} OF ${fleet.total}`) : ''; // fleet.line: the Moon’s phase
  const conDone = !!con && con.level === 'gold';
  // 1, 10, 25, 50, 100… cards each earn a patch, and the patch coin says so; no second "milestone" toast for them (playtest 2026-10-09).
  const PATCHED = [1, 10, 25, 50, 100, 250, 500, 1000];
  const milestone = (fresh && (!!con || (MILESTONES.includes(collected) && !PATCHED.includes(collected)))) || !!shiny;
  // The stamp that used to land on the card is now a ticket toast with the same words.
  // In the notice layout (design/notifications-all.html, 2026-10-18): kind line, title, detail.
  const left = con ? con.total - con.have : 0, label = card.querySelector('.card__title, .card__name, h2, h3')?.textContent?.trim() || '';
  const news = shiny && !conDone ? { kind: 'shiny', eyebrow: `SHINY · ${shiny.label.toUpperCase()}`, line: label, sub: shiny.line, ms: 5000 } // say why it’s shiny (2026-10-08)
    : fresh && con ? (conDone ? { kind: 'event', eyebrow: con.unit === 'worlds' ? 'SET COMPLETE' : 'CONSTELLATION COMPLETE', line: con.name, sub: `All ${con.total} ${con.unit ?? 'stars'} · patch earned`, art: con.art } : (con.have === Math.ceil(con.total / 2) && con.total >= 4 ? { kind: 'xp', id: 'con-progress', eyebrow: con.name.toUpperCase(), line: `Halfway · ${con.have} of ${con.total} ${con.unit ?? 'stars'}`, sub: left === 1 ? 'One to go' : `${left} to go`, art: con.art } : milestone && MILESTONES.includes(collected) && !PATCHED.includes(collected) ? { kind: 'event', icon: 'calendar', eyebrow: 'MILESTONE', line: `${collected.toLocaleString('en-US')} cards collected` } : null)) /* a card-count milestone that happens to be a star still says so */ /* only at halfway and complete (2026-10-25, design/catch-feel.html 06 rule 4) */
    : fresh ? (milestone ? { kind: 'event', icon: 'calendar', eyebrow: 'MILESTONE', line: collected === 1 ? 'Your first card' : `${collected.toLocaleString('en-US')} cards collected` } : null)
    : newStamp ? (fleet?.milestone ? { kind: 'event', eyebrow: 'NEW STAMP', line: fleet.milestone } : !fleet?.line && STAMP_MILESTONES.includes(fleet?.stamps) ? { kind: 'event', icon: 'stamp', eyebrow: 'NEW STAMP', line: `${fleet.stamps} launches stamped` } : { kind: 'xp', eyebrow: 'NEW STAMP', line: stampLine })
    : NIGHT_MILESTONES.includes(nights) ? { kind: 'event', icon: 'calendar', eyebrow: 'MILESTONE', line: `Seen on ${nights} different nights`, sub: label }
    : null; // a plain repeat: no toast (2026-10-07)
  if (news) announce?.({ ms: 3200, ...news, delay: 900 }); // its sound plays as it appears (main.js onTicketShown)
  // A second (third…) night on an old friend: a little "+1 NIGHT" stamp drops onto the card (2026-10-08 polish).
  // (The "+1 night · N nights" stamp is gone: 2026-10-19, Sevaan found it confusing, gone too fast, and on fleet cards
  // it counted different launches as the same card’s nights.)
  if (!reduced()) $('reveal').animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(3px,-2px)' }, { transform: 'translate(0,0)' }], { duration: 180 });
  if (levelUp) card.querySelector('.card__face')?.animate([{ boxShadow: '0 0 0 transparent' }, { boxShadow: `0 0 34px ${LEVEL_COLOR[level]}` }, { boxShadow: '0 0 0 transparent' }], { duration: 1300 });
  tilt = attachTilt(card);
  stopGyro = attachGyro(card, tilt);
  attachFlip(card, { onBack: applyBack });
  $('reveal').classList.add('rv-done');
  fillRank(alive);
  showNews(earnedNow, alive);
}

// What this catch earned, as chips under the header (2026-10-12, playtest room: missions, patches and rank-ups used to
// arrive afterwards as a pile of toasts over the circle). news: [{ kind: 'mission'|'patch'|'rank'|'event', text, xp }].
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let earnedNow = []; // playReveal’s earned list, for the finish step
const NEWS_ICON = { mission: '◆', patch: '◎', rank: '▲', event: '✦', reunion: '⇄', back: '▭', backs: '✦', peak: '⌃', train: '⋯', birthday: '✦' };
// A chip with an action (`act`) is a button: tap, Enter or Space fire sc:news-act for main.js.
function wireAct(c, n) {
  if (!n.act) return; c.setAttribute('role', 'button'); c.tabIndex = 0; c.style.pointerEvents = 'auto'; c.style.cursor = 'pointer';
  const go = (e) => { e.stopPropagation(); dispatchEvent(new CustomEvent('sc:news-act', { detail: n.act })); };
  c.addEventListener('click', go); c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } });
}
function showNews(news, alive) {
  const box = $('rv-news'); box.style.flexWrap = ''; if (!news?.length) return;
  // One row: the two biggest pieces of news, then "+N" (a second row covered the card on small phones).
  const ORDER = { rank: 0, back: 1, backs: 1.5, reunion: 2, peak: 2.5, train: 2.6, birthday: 0.5, event: 3, patch: 4, mission: 5 }; // a new card back is rare news: up front (2026-10-24)
  const sorted = news.slice().sort((a, b) => (ORDER[a.kind] ?? 9) - (ORDER[b.kind] ?? 9));
  const rest = sorted.length > 3 ? sorted.slice(2) : [];
  news = rest.length ? [...sorted.slice(0, 2), { kind: 'more', text: `+${rest.length} more` }] : sorted;
  news.forEach((n, i) => setTimeout(() => {
    if (!alive()) return;
    const c = document.createElement('span'); c.className = `rv-chip rv-chip--${n.kind}`;
    c.innerHTML = `${n.kind === 'more' ? '' : `<i aria-hidden="true">${NEWS_ICON[n.kind] ?? '◆'}</i>`}${esc(n.text)}${n.xp ? `<b>+${n.xp}</b>` : ''}`;
    if (n.kind === 'more') { // tap to see the rest (iOS playtest 2026-10-20: it was a dead tap)
      c.setAttribute('role', 'button'); c.tabIndex = 0; c.style.pointerEvents = 'auto'; c.style.cursor = 'pointer';
      c.addEventListener('click', () => { c.remove(); Object.assign(box.style, { overflowX: 'auto', pointerEvents: 'auto', touchAction: 'pan-x', scrollbarWidth: 'none' }); /* one row you can swipe along: wrapped rows ran onto the card (iPhone playtest 2026-10-26) */ for (const m of rest) { const x = document.createElement('span'); x.className = `rv-chip rv-chip--${m.kind} in`; x.innerHTML = `<i aria-hidden="true">${NEWS_ICON[m.kind] ?? '◆'}</i>${esc(m.text)}${m.xp ? `<b>+${m.xp}</b>` : ''}`; wireAct(x, m); box.append(x); } }, { once: true });
    }
    wireAct(c, n); /* e.g. "see them all" card backs → Plus (2026-10-24) */
    box.append(c); requestAnimationFrame(() => c.classList.add('in'));
    // Each chip sounds and feels like what it is (2026-10-17 haptics playtest: a rank-up got the generic XP tick).
    if (n.kind === 'rank') sfx('rankup'); else if (n.kind === 'reunion') { sfx('complete', { gain: 0.8 }); dispatchEvent(new CustomEvent('sc:feel', { detail: 'success' })); } else if (n.kind === 'mission') { sfx('mission', { gain: 0.8 }); dispatchEvent(new CustomEvent('sc:feel', { detail: 'light' })); } else if (n.kind === 'patch') sfx('patch', { gain: 0.7 }); else sfx('xp', { gain: 0.7 });
  }, (reduced() ? 0 : 900) + i * (reduced() ? 0 : 260)));
}
// The rank bar under a new card (design D): XP counts up from before to after while the bar fills.
// rank: { from, to, name, at, next } (next null at the top rank).
const fmtXp = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : n); // 1,145 / 3,000 like everywhere else (UX playtest 2026-10-21)
let rankInfo = null;
function setRank(r) {
  rankInfo = r; $('reveal').classList.toggle('has-rank', !!r); $('rv-rank').hidden = !r;
  if (!r) return;
  const pct = (v) => (r.next ? Math.max(0, Math.min(1, (v - r.at) / (r.next - r.at))) : 1) * 100;
  // A rank-up starts on the old rank, part-filled (2026-10-17 haptics playtest: it began at the new rank’s floor, so
  // the old rank never filled); fillRank runs it to the end, flashes, and carries on into the new one.
  const p = r.prev, startPct = p ? Math.max(0, Math.min(1, (r.from - p.at) / Math.max(1, (p.next ?? r.at) - p.at))) * 100 : pct(Math.max(r.at, r.from));
  $('rv-rank-name').textContent = p ? p.name : r.name; $('rv-rank-next').textContent = fmtXp(p ? (p.next ?? r.at) : (r.next ?? r.to));
  $('rv-rank-xp').textContent = fmtXp(p ? r.from : Math.max(r.at, r.from));
  $('rv-rank-fill').style.transition = 'none'; $('rv-rank-fill').style.width = `${startPct}%`;
  r.pct = pct;
}
function fillRank(alive) {
  const r = rankInfo; if (!r) return;
  if (r.prev && !r.wrapped) { // fill the old rank, flash, swap the name, then fill the new rank from its floor
    r.wrapped = true; const f = $('rv-rank-fill'), ms = reduced() ? 1 : 500;
    setTimeout(() => { if (!alive()) return; f.style.transition = `width ${ms}ms cubic-bezier(.4,0,.6,1)`; f.style.width = '100%'; $('rv-rank-xp').textContent = fmtXp(r.prev.next ?? r.at); }, reduced() ? 0 : 200);
    setTimeout(() => { if (!alive()) return; $('rv-rank').classList.remove('wrap'); void $('rv-rank').offsetWidth; $('rv-rank').classList.add('wrap'); sfx('rankup'); dispatchEvent(new CustomEvent('sc:feel', { detail: 'success' }));
      $('rv-rank-name').textContent = r.name; $('rv-rank-next').textContent = fmtXp(r.next ?? r.to); f.style.transition = 'none'; f.style.width = '0%'; void f.offsetWidth; r.from = r.at; fillRank(alive); }, reduced() ? 0 : 200 + ms + 160);
    return;
  }
  const from = Math.max(r.at, r.from), ms = reduced() ? 1 : 900, t0 = performance.now() + (reduced() ? 0 : 200);
  setTimeout(() => { if (!alive()) return; const f = $('rv-rank-fill'); f.style.transition = `width ${ms}ms cubic-bezier(.3,.8,.3,1)`; f.style.width = `${r.pct(r.to)}%`; }, reduced() ? 0 : 200);
  const step = (t) => { if (!alive()) return; const k = Math.max(0, Math.min(1, (t - t0) / ms)), e = 1 - (1 - k) ** 3; { const v = Math.round(from + (r.to - from) * e); if ($('rv-rank-xp').textContent !== String(v)) { $('rv-rank-xp').textContent = fmtXp(v); sfx('xp', { gain: 0.6, gap: 75 }); } } if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// Flick the finished card up and away to go back to the sky. Dragging still just tilts the card (the card
// never follows your finger); only a quick, mostly upward flick throws it off the top of the screen.
let onDismiss = null, flick = null;
export function onRevealDismiss(fn) { onDismiss = fn; }
// A swipe-away of a brand-new card goes into the binder instead of off the top (2026-10-21, Sevaan): main says yes or no.
let intoBinderOk = null;
export function onRevealSwipeIntoBinder(fn) { intoBinderOk = fn; }
function holderTo(x, y, ms) {
  const h = $('rv-holder');
  h.style.transition = ms ? `transform ${ms}ms cubic-bezier(.3,.6,.4,1), opacity ${ms}ms` : 'none';
  h.style.transform = x || y ? `translate(${x}px, ${y}px)` : '';
}
{
  // The flick is read on the whole reveal, not just the card (Duo playtest 2026-10-22: a flick that began where
  // another layer sat over the card did nothing, and the player was stuck); buttons and links keep their taps.
  const h = $('rv-holder'), area = $('reveal');
  area.addEventListener('dragstart', (e) => e.preventDefault()); // nothing in the reveal is draggable
  area.addEventListener('pointerdown', (e) => {
    if (!$('reveal').classList.contains('rv-done') || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest?.('button, a, input, .pill')) return;
    flick = { id: e.pointerId, pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }] };
  });
  area.addEventListener('pointermove', (e) => {
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
    if (intoBinderOk?.()) { tilt?.reset(); sfx('swipe'); onDismiss?.(); return; } // it flies from here into the Collection tab
    const cur = getComputedStyle(h).transform; // where it’s drawn now, before its landing animation is dropped
    h.getAnimations().forEach((a) => a.cancel()); h.style.opacity = '1';
    tilt?.reset();
    sfx('swipe');
    const ms = throwOff(h, dx, dy, dt, cur);
    // Close first and tidy up after the reveal has gone: cancelling the throw before closing put the card back in the
    // middle for a moment as the reveal faded (2026-10-19, Sevaan: janky). The next reveal resets the holder anyway.
    setTimeout(() => { onDismiss?.(); setTimeout(() => { if (!document.getElementById('reveal').hidden) return; /* a new reveal owns it now */ h.getAnimations().forEach((a) => a.cancel()); h.style.opacity = ''; }, 500); }, ms + 20);
  };
  area.addEventListener('pointerup', end);
  area.addEventListener('pointercancel', () => { flick = null; });
}
