// A quiet twinkling starfield for backgrounds (the collection's card viewer). Plain spans with CSS
// animation (css/collection.css .starfield), placed at random; nothing runs in JS after setup.
export function addStarfield(host, count = 70) {
  if (host.querySelector(':scope > .starfield')) return;
  const field = document.createElement('div');
  field.className = 'starfield'; field.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i');
    const big = Math.random() < 0.15;
    s.style.cssText = `left:${(Math.random() * 100).toFixed(2)}%;top:${(Math.random() * 100).toFixed(2)}%;--s:${big ? 2.2 : 1 + Math.random()}px;--d:${(Math.random() * 6).toFixed(2)}s;--t:${(3 + Math.random() * 4).toFixed(2)}s;--o:${(0.35 + Math.random() * 0.5).toFixed(2)}`;
    field.append(s);
  }
  host.prepend(field);
}

// Collection tiles lean a little towards your finger while you touch them, and settle back when you let
// go. Transform only: no glare, no foil.
export function attachTileTilt(root) {
  const MAX = 6; // degrees
  const set = (tile, rx, ry) => { tile.style.transform = rx || ry ? `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)` : ''; };
  const move = (e) => {
    const tile = e.target.closest?.('.card-tile'); if (!tile) return;
    const r = tile.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    tile.style.transition = 'transform .12s ease-out';
    set(tile, (-y * 2 * MAX).toFixed(2), (x * 2 * MAX).toFixed(2));
  };
  const reset = (e) => { const tile = e.target.closest?.('.card-tile'); if (!tile) return; tile.style.transition = 'transform .45s cubic-bezier(.2,.9,.3,1.2)'; set(tile, 0, 0); };
  root.addEventListener('pointerdown', move);
  root.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') move(e); });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave', 'pointerout']) root.addEventListener(t, reset);
}
