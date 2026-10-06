// Card backs. Since 2026-10-05 there is one: Sevaan's "Space Collector" seal (orbits, compass rings and
// four satellites), with its light-blue outer band trimmed so the card's own frame colour shows instead.
// The list still supports several (the six retro posters, back-navy-1..6.webp, were used before): a
// random one shows each time a back appears, never the same twice in a row, loaded ahead of time.

const BACKS = [
  { url: 'assets/art/backs/back-collector.webp', title: 'middle' }, // Space Collector seal (2026-10-05)
];

const pick = (not) => {
  let b;
  do b = BACKS[Math.floor(Math.random() * BACKS.length)]; while (b === not && BACKS.length > 1);
  return b;
};
const preload = (b) => { const i = new Image(); i.decoding = 'async'; i.src = b.url; };

let next = pick();
preload(next);

// The back to show now ({ url, title: 'top' | 'bottom' }); queues and preloads a different one for next time.
export function nextBack() {
  const b = next;
  next = pick(b);
  preload(next);
  return b;
}

// Put a random back on an element (its background), marking where the poster's title sits.
export function applyBack(el) {
  if (!el) return null;
  const b = nextBack();
  el.style.backgroundImage = `url('${b.url}')`;
  el.dataset.title = b.title;
  return b;
}
