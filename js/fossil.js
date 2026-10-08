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
export const spot = (() => {
  let s = null;
  try { s = JSON.parse(localStorage.getItem('fossilSpot')); } catch {}
  if (!s || typeof s.az !== 'number') { s = { az: Math.round(Math.random() * 360), el: -(35 + Math.round(Math.random() * 25)) }; try { localStorage.setItem('fossilSpot', JSON.stringify(s)); } catch {} }
  return s;
})();

export const image = new Image();
image.decoding = 'async';
image.src = `assets/art/fossils/${fossil.file}`;

export function found() { try { return JSON.parse(localStorage.getItem('fossilFound')); } catch { return null; } }
export function markFound() { const f = { at: Date.now(), name: fossil.name }; try { localStorage.setItem('fossilFound', JSON.stringify(f)); } catch {} return f; }

// The secret patch, shaped like an achievement (js/patches.js draws it with the T. rex art, design option A).
export const FOSSIL_PATCH = { id: 'fossil', name: 'Fossil Hunter', text: 'Find what is buried under your feet', icon: '', secret: true };
