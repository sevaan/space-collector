// Card backs: Sevaan's six retro space posters (Desktop/cardbacks, EPS) retitled SPACE COLLECTOR in
// Jockey One and saved as 900 px WebP. A random one shows each time a card back appears (the sealed
// card in the capture reveal, and mid-spin in the collection), never the same one twice in a row.
// The next one is loaded ahead of time so it never pops in.

const BACKS = [
  { url: 'assets/art/backs/back-1.webp', title: 'top' },     // Stardust (ringed planet)
  { url: 'assets/art/backs/back-2.webp', title: 'top' },     // Discover (lander)
  { url: 'assets/art/backs/back-3.webp', title: 'top' },     // Discover (rocket)
  { url: 'assets/art/backs/back-4.webp', title: 'top' },     // Explore (rocket and red planet)
  { url: 'assets/art/backs/back-5.webp', title: 'bottom' },  // Infinite (space station)
  { url: 'assets/art/backs/back-6.webp', title: 'bottom' },  // Journey (rocket over a gas giant)
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
