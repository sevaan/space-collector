// v5 hero (2026-10-18, Sevaan: "that doesn't feel like the game… duplicate the actual game's code"): the first screen is
// the real game sky (/play, the app's own renderer, built by scripts/build-site-game.mjs) in a frame. When you collect
// something there, the welcome card comes out of the circle, shakes and turns over; later catches show a one-line note.
const $ = (id) => document.getElementById(id);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = $('hero'), game = $('game'), count = $('count'), caught = $('caught');
const over = $('wc-over'), card = $('wc-card'), img = $('wc-img'), cap = $('wc-cap');
let open = false, onScreen = true, noteT = 0;

const pause = () => game.contentWindow?.postMessage({ type: 'sc-pause', on: open || !onScreen }, '*');
new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; pause(); }, { threshold: 0.05 }).observe(hero);

addEventListener('message', (e) => {
  if (e.source !== game.contentWindow || e.data?.type !== 'sc-collect') return;
  const c = e.data;
  count.textContent = `${c.n} / 4,850`; count.classList.add('bump'); setTimeout(() => count.classList.remove('bump'), 500);
  if (c.n === 1) return welcome(c);
  caught.innerHTML = `<span style="color:${c.color}">${c.gem}</span> ${c.name} · ${c.n} of 4,850`; caught.hidden = false;
  clearTimeout(noteT); noteT = setTimeout(() => { caught.hidden = true; }, 3200);
});

function welcome(c) {
  open = true; pause();
  img.src = '/assets/wc-back.webp'; img.alt = 'A sealed card'; new Image().src = '/assets/wc-front.webp';
  card.style.setProperty('--tier', c.color); card.classList.remove('turned');
  cap.innerHTML = `You caught <b style="color:${c.color}">${c.gem} ${c.name}</b>. That's the game. Here's how it works for real.`;
  over.hidden = false; requestAnimationFrame(() => over.classList.add('in'));
  const r = card.getBoundingClientRect(), hr = hero.getBoundingClientRect();
  const dx = hr.left + hr.width / 2 - (r.left + r.width / 2), dy = hr.top + hr.height * 0.52 - (r.top + r.height / 2); // out of the game's circle
  const turn = () => {
    if (card.classList.contains('turned')) return; card.classList.add('turned');
    const swap = () => { img.src = '/assets/wc-front.webp'; img.alt = 'Your first mission: point your phone at the sky, line up an object in the circle, tap Collect to claim its card.'; };
    if (still) return swap();
    card.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 180, easing: 'ease-in' }).finished.then(() => { swap(); card.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.3,1.2)' }); });
  };
  card.onclick = turn;
  if (still) return turn();
  card.animate([{ transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished
    .then(() => card.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg) translateY(-2px)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(0)' }], { duration: 650, easing: 'ease-in-out' }).finished)
    .then(() => setTimeout(turn, 120));
}
function close() { over.classList.remove('in'); setTimeout(() => { over.hidden = true; open = false; pause(); game.focus(); }, 250); }
$('wc-close').addEventListener('click', close); $('wc-close2')?.addEventListener('click', close);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) close(); });
