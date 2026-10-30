// A quiet twinkling starfield for backgrounds (the collection’s card viewer). Plain spans with CSS
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
  /* Twinkle only while on screen (perf audit 2026-10-29: 120 infinite animations kept style recalcs running while idle) */
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { for (const e of es) field.classList.toggle('sf-off', !e.isIntersecting); }).observe(field);
}

// Collection tiles lean a little towards your finger while you touch them, and settle back when you let
// go. Transform only: no glare, no foil.
export function attachTileTilt(root) {
  const MAX = 11; // degrees — raised from 6 on 2026-10-05: a finger on a tile should visibly tip it
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
  for (const t of ['pointerup', 'pointercancel', 'pointerleave', 'pointerout', 'click']) root.addEventListener(t, reset);
  /* a tap that opens a card can leave its tile tipped (the viewer takes the pointer), which cut off its top edge: every
     tile goes flat again whenever a dialog closes (2026-10-28, Sevaan) */
  document.addEventListener('close', () => { for (const t of root.querySelectorAll('.card-tile[style*="transform"]')) set(t, 0, 0); }, true);
}
