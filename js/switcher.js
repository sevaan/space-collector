// The Explore | Collection switcher (css/ui.css .sc-switch): slide the pill to a side and mark that button current.
// animate=false jumps it there (e.g. resetting a hidden switcher).
export function setSwitch(nav, side, animate = true) {
  if (!nav) return;
  if (!animate) nav.classList.add('no-anim');
  nav.dataset.side = side;
  const items = nav.querySelectorAll('.sc-switch__item');
  items.forEach((el, i) => { if ((i === 0) === (side === 'left')) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
  if (!animate) { void nav.offsetWidth; nav.classList.remove('no-anim'); }
}
export const SLIDE_MS = 200; // switch views as the pill lands
