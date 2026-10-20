// The welcome card (2026-10-19): the app's sealed card, shaking every 5 s with the app's rattle (css/app.css wcRattle)
// and its sound; a tap turns it over to the welcome card the way the app does (the faces swap on the edge-on frame),
// with the app's flip sound. Tap again to turn it back. It tilts a little under the mouse, like a card in the app.
import { sfx, wakeAudio } from './audio.js';
const holder = document.getElementById('wc'), card = holder.querySelector('.wc-card'), img = card.querySelector('img'), pics = card.querySelector('.wa-pics');
const FRONT = '/home/wc-front.webp', BACK = '/home/wc-back.webp', still = matchMedia('(prefers-reduced-motion: reduce)').matches;
new Image().src = FRONT;
let open = false, busy = false;

// The shake (and its sound) only while the card is on screen.
let inView = true;
new IntersectionObserver(([e]) => { inView = e.isIntersecting; holder.style.animationPlayState = inView ? '' : 'paused'; }).observe(holder);
holder.addEventListener('animationstart', () => { if (!open && inView) sfx('rattle'); });
holder.addEventListener('animationiteration', () => { if (!open && inView) sfx('rattle'); });

async function turn() {
  if (busy) return; busy = true; wakeAudio();
  open = !open; holder.classList.toggle('rattle', !open); holder.classList.toggle('open', open); holder.setAttribute('aria-pressed', String(open)); holder.setAttribute('aria-label', open ? 'Turn the card back over' : 'Turn the card over');
  if (open) sfx('welcome');
  const ms = still ? 1 : 900, half = ms / 2;
  const a = card.animate([{ transform: 'rotateY(0deg) scale(1)' }, { transform: 'rotateY(90deg) scale(1.06)' }], { duration: half, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' });
  await a.finished; img.src = open ? FRONT : BACK; pics.hidden = !open; /* the front's pictures move, as in the app */ img.alt = open ? 'The welcome card: the night sky is yours to collect. Point your phone at the sky, line up an object in the circle, tap Collect to claim its card.' : 'A sealed Space Collector card. Tap to reveal.';
  const b = card.animate([{ transform: 'rotateY(-90deg) scale(1.06)' }, { transform: 'rotateY(0deg) scale(1)' }], { duration: half, easing: 'cubic-bezier(.1,.4,.5,1)', fill: 'forwards' });
  a.cancel(); await b.finished; b.cancel(); busy = false;
}
holder.addEventListener('click', turn);
holder.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(); } });

// A little tilt under the mouse.
if (!still) {
  holder.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = holder.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    holder.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`); holder.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`); holder.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`); holder.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`); holder.classList.add('tilt'); });
  holder.addEventListener('pointerleave', () => { holder.style.setProperty('--rx', '0deg'); holder.style.setProperty('--ry', '0deg'); holder.classList.remove('tilt'); });
}
