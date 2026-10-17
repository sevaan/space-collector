// The app's loader (index.html, "lock-on"): the sky's target circle, a satellite drifting across, the ring turning
// orange as it locks on. Shared by the website designs as their preloader. Leaves once the page has loaded and at
// least one lock-on has played, then resolves window.scLoaded so a page can hand off from it.
(() => {
  const root = document.createElement('div');
  root.id = 'sc-loader'; root.setAttribute('role', 'status'); root.setAttribute('aria-label', 'Loading the sky');
  root.innerHTML = '<svg aria-hidden="true"></svg><span class="ld-word">SPACE COLLECTOR</span><span class="ld-sub">Loading the sky</span>';
  const css = document.createElement('style');
  css.textContent = `#sc-loader { position: fixed; inset: 0; z-index: 1000; background: #080f1b; transition: opacity .7s ease, visibility .7s; }
#sc-loader.gone { opacity: 0; visibility: hidden; }
#sc-loader svg { position: absolute; left: 0; overflow: visible; }
#sc-loader .ld-word, #sc-loader .ld-sub { position: absolute; left: 0; right: 0; text-align: center; }
#sc-loader .ld-word { font: 400 15px/1 'Russo One', 'Arial Black', sans-serif; letter-spacing: .06em; color: #fff2b3; }
#sc-loader .ld-sub { font: 500 12px/1 'Barlow Condensed', 'Arial Narrow', sans-serif; letter-spacing: .26em; text-transform: uppercase; color: #9fb3c8; animation: ldp 1.8s ease-in-out infinite; }
@keyframes ldp { 50% { opacity: .45; } }
@media (prefers-reduced-motion: reduce) { #sc-loader .ld-sub { animation: none; } }`;
  document.head.append(css);
  const mount = () => document.body.prepend(root);
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount, { once: true });

  const h = innerHeight, w = innerWidth, D = Math.PI / 180;
  const r = Math.max(46, (h / 2) * Math.tan(6 * D) / Math.tan(35 * D)), S = Math.ceil(r + 20);
  let ticks = '';
  for (let a = 0; a < 360; a += 15) { const c = a % 90 === 0, i = r + 5, o = r + (c ? 13 : 9), x = Math.cos(a * D), y = Math.sin(a * D);
    ticks += `<line x1="${x * i}" y1="${y * i}" x2="${x * o}" y2="${y * o}" stroke="${c ? '#fa8127' : 'rgba(255,242,179,.66)'}" stroke-opacity="${c ? .9 : .42}" stroke-width="${c ? 1.5 : .75}"/>`; }
  const svg = root.querySelector('svg');
  svg.setAttribute('viewBox', `${-w / 2} ${-S} ${w} ${2 * S}`); svg.setAttribute('width', w); svg.setAttribute('height', 2 * S);
  svg.style.top = `${h / 2 - S}px`;
  root.querySelector('.ld-word').style.top = `${h / 2 + r + 34}px`; root.querySelector('.ld-sub').style.top = `${h / 2 + r + 58}px`;
  svg.innerHTML = `<circle id="ld-ring" r="${r}" fill="none" stroke="rgba(255,242,179,.66)" stroke-width="1"/><circle r="${r + 5}" fill="none" stroke="rgba(173,188,200,.35)" stroke-width=".75"/>${ticks}<g id="ld-anim"></g>`;
  const k = r / 46, anim = svg.querySelector('#ld-anim'), ring = svg.querySelector('#ld-ring'), x0 = -(w / 2 + 24), y0 = -x0 * 30 / 110, ang = Math.atan2(-60, 220) * 180 / Math.PI, period = 2600 * -x0 / (110 * k);
  const sat = (c) => `<rect x="-3" y="-2.2" width="6" height="4.4" rx=".6" fill="${c}"/><rect x="-10.5" y="-1.6" width="6.4" height="3.2" fill="${c}" opacity=".85"/><rect x="4.1" y="-1.6" width="6.4" height="3.2" fill="${c}" opacity=".85"/><path d="M-4 0H-3M3 0H4" stroke="${c}" stroke-width=".8"/>`;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t0 = null, done = false, locked = 0;
  const tick = (t) => {
    if (done) return;
    t0 ??= t;
    const T = still ? .5 : ((t - t0) / period + 0.5 - 1600 / period + 1) % 1, x = x0 + T * -2 * x0, y = y0 + T * -2 * y0, d = Math.hypot(x, y), inside = d < r - 6, near = Math.max(0, 1 - d / (30 * k));
    if (inside) locked = t;
    ring.setAttribute('stroke', inside ? '#fa8127' : 'rgba(255,242,179,.66)');
    anim.innerHTML = `<path d="M${x0} ${y0} L${-x0} ${-y0}" stroke="#fff2b3" stroke-opacity=".18" stroke-dasharray="2 5"/>`
      + (inside ? `<circle r="${r + 8 + (1 - near) * 18 * k}" fill="none" stroke="#fa8127" stroke-opacity="${(near * .6).toFixed(2)}" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="${13 * Math.min(1.3, k)}" fill="none" stroke="#fa8127" stroke-width="1.4"/>` : '')
      + `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${Math.min(1.4, k)})">${sat(inside ? '#ffd9a6' : '#fff2b3')}</g>`;
    if (!still) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // Leave once everything has loaded, at least 1.8 s in, and just after a lock-on (so it never cuts mid-pass).
  const start = performance.now();
  window.scLoaded = new Promise((resolve) => {
    const leave = () => { done = true; root.classList.add('gone'); setTimeout(() => root.remove(), 800); resolve(); };
    const ready = () => {
      // just after the satellite leaves the circle, so the first thing seen is a full lock-on
      const wait = () => { const now = performance.now(), since = now - locked; if (now - start >= 1800 && (still || (locked && since > 150 && since < 900) || now - start > 1800 + period)) { leave(); return; } setTimeout(wait, 50); };
      wait();
    };
    if (document.readyState === 'complete') ready(); else addEventListener('load', ready, { once: true });
    setTimeout(leave, 9000); // never hold a slow connection hostage
  });
})();
