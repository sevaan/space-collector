// A fossil under your feet (2026-10-08, design/fossil.html): a daytime easter egg. One of Sevaan's ten skeletons
// (assets/art/fossils) lies in the soil, a different one each time the app opens, always at the same buried spot for
// this player. Hold it in the circle for a moment to earn the secret Fossil Hunter patch. Never mentioned anywhere.
export const FOSSILS = [
  ['0.svg', 'Tyrannosaurus'], ['1.svg', 'Plesiosaurus'], ['2.svg', 'Triceratops'], ['3.svg', 'Brachiosaurus'], ['4.svg', 'Velociraptor'],
  ['5.svg', 'Stegosaurus'], ['6.svg', 'Gallimimus'], ['7.svg', 'Dilophosaurus'], ['8.svg', 'Pachycephalosaurus'], ['9.svg', 'Pteranodon'],
].map(([file, name]) => ({ file, name }));

// Today's skeleton: picked once per app open.
export const fossil = FOSSILS[Math.floor(Math.random() * FOSSILS.length)];

// The buried spot: a random direction and depth chosen once and kept on this device.
// Chosen the first time you're in daylight (2026-10-08, Sevaan): behind you, so it's a surprise when you turn round.
export let spot = (() => { try { const s = JSON.parse(localStorage.getItem('fossilSpot')); return s && typeof s.az === 'number' ? s : null; } catch { return null; } })();
export function placeBehind(heading) {
  if (spot) return spot;
  spot = { az: Math.round((heading + 180 + (Math.random() - 0.5) * 50 + 360) % 360), el: -(35 + Math.round(Math.random() * 20)) };
  try { localStorage.setItem('fossilSpot', JSON.stringify(spot)); } catch {}
  return spot;
}

// Loaded only when it's first needed (daylight), not on every open (2026-10-08 performance).
export const image = new Image();
image.decoding = 'async';
export function loadImage() { if (!image.src) image.src = `assets/art/fossils/${fossil.file}`; return image; }

export function found() { try { return JSON.parse(localStorage.getItem('fossilFound')); } catch { return null; } }
export function markFound() { const f = { at: Date.now(), name: fossil.name }; try { localStorage.setItem('fossilFound', JSON.stringify(f)); } catch {} return f; }

// The secret patch, shaped like an achievement (js/patches.js draws it with the T. rex art, design option A).
export const FOSSIL_PATCH = { id: 'fossil', name: 'Fossil Hunter', text: 'Find what is buried under your feet', icon: '', secret: true };
