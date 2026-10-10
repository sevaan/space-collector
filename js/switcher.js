// The Up in the sky | Explore | Collection switcher (css/ui.css .sc-switch; three-way since 2026-10-09): slide the pill
// to 'left', 'mid' or 'right' and mark that button current. animate=false jumps it there (e.g. a hidden switcher).
export function setSwitch(nav, side, animate = true) {
  if (!nav) return;
  if (!animate) nav.classList.add('no-anim');
  nav.dataset.side = side;
  const items = [...nav.querySelectorAll('.sc-switch__item')], n = items.length;
  const idx = side === 'left' ? 0 : side === 'right' ? n - 1 : Math.min(1, n - 1);
  nav.style.setProperty('--n', n); nav.style.setProperty('--i', idx); nav.classList.toggle('three', n === 3);
  items.forEach((el, i) => { if (i === idx) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
  if (!animate) { void nav.offsetWidth; nav.classList.remove('no-anim'); }
}
export const SLIDE_MS = 200; // switch views as the pill lands
