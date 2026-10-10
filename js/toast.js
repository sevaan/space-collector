// Toasts ("tickets", 2026-10-05 design canvas "Toast C"), shared by Explore and Collection (css/ui.css .ticket).
// Kinds colour the left edge: mission (orange), xp (steel blue), event / achievement / rank (gold), info.
// They queue rather than stack: one at a time, oldest first; a tap sends one away sooner. An `id` lets a toast
// be withdrawn the moment it stops being true (dropToast).
const queue = [];
const live = new Map();
let busy = false;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function stack() {
  let el = document.getElementById('toasts');
  if (!el) { el = document.createElement('div'); el.id = 'toasts'; el.setAttribute('aria-live', 'polite'); document.body.append(el); }
  return el;
}
export function toast(html, ms = 2200, href = null) { ticket({ kind: 'info', line: html, html: true, ms, href }); }
export function ticket({ kind = 'info', eyebrow = '', line = '', xp = 0, ms = 3000, href = null, html = false, delay = 0, id = null, art = '', celebrate = false }) {
  queue.push({ kind, eyebrow, line, xp, ms, href, html, id, art, celebrate, at: Date.now() + delay });
  pump();
}
export function toastPending(id) { return live.has(id) || queue.some((q) => q.id === id); }
export function dropToast(id) {
  for (let i = queue.length - 1; i >= 0; i--) if (queue[i].id === id) queue.splice(i, 1);
  live.get(id)?.();
}
// A small burst belongs to the achievement ticket, so it follows the queue and survives a closed reveal.
function confetti(el) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};
  const burst = document.createElement('span');
  burst.className = 'ticket__confetti';
  burst.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('i');
    piece.style.setProperty('--dx', `${(i / 23 - .5) * 260}px`);
    piece.style.setProperty('--dy', `${-55 - Math.random() * 90}px`);
    piece.style.setProperty('--turn', `${(Math.random() - .5) * 540}deg`);
    piece.style.setProperty('--delay', `${420 + Math.random() * 120}ms`);
    burst.append(piece);
  }
  el.classList.add('ticket--celebrate');
  el.append(burst);
  const timer = setTimeout(() => burst.remove(), 2000);
  return () => { clearTimeout(timer); burst.remove(); };
}
function pump() {
  if (busy || !queue.length) return;
  const t = queue[0], wait = t.at - Date.now();
  if (wait > 0) { busy = true; setTimeout(() => { busy = false; pump(); }, wait); return; }
  // Never over a card reveal or a patch moment (2026-10-08 playtest: toasts covered the new card); they wait their turn.
  if (document.querySelector('#reveal:not([hidden]), .patch-moment, #ob-done:not([hidden])')) { busy = true; setTimeout(() => { busy = false; pump(); }, 500); return; }
  queue.shift();
  busy = true;
  const el = document.createElement('div');
  el.className = `ticket ticket--${t.kind}${t.href ? ' linked' : ''}${t.art ? ' ticket--art' : ''}`;
  el.innerHTML = `${t.art ? `<span class="ticket__art" aria-hidden="true">${t.art}</span>` : '<i class="ticket__mark" aria-hidden="true"></i>'}<span class="ticket__body">${t.eyebrow ? `<span class="ticket__eyebrow">${esc(t.eyebrow)}</span>` : ''}<span class="ticket__line">${t.html ? t.line : esc(t.line)}</span></span>${t.xp ? `<span class="ticket__xp">+${t.xp}<small>XP</small></span>` : t.href ? '<span class="ticket__go">OPEN ›</span>' : ''}`;
  // Up long enough to read (2026-10-06: at least 5 s, about 1.6× the old times); a tap sends it away sooner.
  let gone = false, stopConfetti = () => {};
  const dismiss = () => { if (gone) return; gone = true; clearTimeout(timer); stopConfetti(); if (t.id) live.delete(t.id); el.classList.remove('in'); setTimeout(() => { el.remove(); busy = false; pump(); }, 320); };
  el.addEventListener('click', () => { if (t.href) { if (!window.scNavigate?.(t.href)) location.href = t.href; dismiss(); } else dismiss(); });
  stack().append(el);
  requestAnimationFrame(() => {
    if (gone) return;
    el.classList.add('in');
    if (t.celebrate) stopConfetti = confetti(el);
  });
  const timer = setTimeout(dismiss, Math.max(5000, t.ms * 1.6));
  if (t.id) live.set(t.id, dismiss);
}
