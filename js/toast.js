// Toasts ("tickets", 2026-10-05 design canvas "Toast C"), shared by Explore and Collection (css/ui.css .ticket).
// Kinds colour the left edge: mission (orange), xp (steel blue), event / achievement / rank (gold), info.
// They queue rather than stack: one at a time, oldest first; a tap sends one away sooner. An `id` lets a toast
// be withdrawn the moment it stops being true (dropToast).
// Sticky tickets (2026-10-11, Sevaan: "that kind of toast shouldn't auto-disappear… a close x… they have to be
// dismissed") stay until tapped or closed with their ✕. They don't hold up the queue: ordinary toasts keep coming above
// them. At most two stay up; a third sends the oldest away. `action` runs on a tap (like `href`, without a page).
const queue = [];
const live = new Map();
let busy = false;
const stickies = new Set(), shelf = []; // shelf: sticky elements, oldest first; only the newest shows
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function stack() {
  let el = document.getElementById('toasts');
  if (!el) { el = document.createElement('div'); el.id = 'toasts'; el.setAttribute('aria-live', 'polite'); document.body.append(el); }
  return el;
}
export function toast(html, ms = 2200, href = null, opts = {}) { ticket({ kind: 'info', line: html, html: true, ms, href, ...opts }); }
// Called with each ticket as it appears (main.js plays its sound: mission, rank up, or the quiet toast).
let onShown = null;
export function onTicketShown(fn) { onShown = fn; }
export function ticket({ kind = 'info', eyebrow = '', line = '', xp = 0, ms = 3000, href = null, html = false, delay = 0, id = null, art = '', celebrate = false, sticky = false, action = null, go = null }) {
  if (id && toastPending(id)) dropToast(id); // the same message again replaces the old one
  queue.push({ kind, eyebrow, line, xp, ms, href, html, id, art, celebrate, sticky, action, go, at: Date.now() + delay });
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
function stackSeen() {
  if (document.querySelector('.patch-coins') || document.body.classList.contains('col-open')) return false;
  const cs = getComputedStyle(stack()); return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.3;
}
// Up top, the stack never reaches down over the circle (2026-10-18 playtest: on an SE two notices covered half of it).
// main.js sets --toast-limit (the circle's top); the newest tickets that fit show, older ones wait out of sight.
function fitStack() {
  const el = document.getElementById('toasts'); if (!el) return;
  const lim = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toast-limit'));
  const top = el.getBoundingClientRect().top, items = [...el.querySelectorAll('.ticket.in:not(.shelved)')].reverse(); // newest first (column-reverse)
  let room = lim && top < innerHeight / 2 ? lim - top : Infinity;
  items.forEach((t, i) => { const h = (t.classList.contains('over') ? Number(t.dataset.h || 60) : Number(t.dataset.h = t.offsetHeight)) + 8, /* hidden ones keep their last height */ fits = i === 0 || h <= room; t.classList.toggle('over', !fits); if (fits) room -= h; else room = -1; });
}
setInterval(fitStack, 300);
function pump() {
  if (busy || !queue.length) return;
  const t = queue[0], wait = t.at - Date.now();
  if (wait > 0) { busy = true; setTimeout(() => { busy = false; pump(); }, wait); return; }
  // Never over a card reveal or a patch moment (2026-10-08 playtest: toasts covered the new card); they wait their turn.
  // A sheet covers all of that, so its own messages go straight up (2026-10-16 playtest: "Try Plus free" said nothing,
  // its toast waiting behind the Plus sheet for whatever sat in the circle to leave).
  if (!document.querySelector('.set-sheet.in') && document.querySelector('#reveal:not([hidden]), .patch-moment, .patch-coins, body.patch-waiting, #ob-done:not([hidden]), body.first-catch')) { /* body.first-catch: the first catch after the tour (main.js) */ busy = true; setTimeout(() => { busy = false; pump(); }, 500); return; }
  // One sticky on screen at a time (2026-10-13 playtest: two stacked stickies covered 40% of an SE). A new one shows
  // straight away and the older one is shelved until it goes (2026-10-18 playtest: NEW RANK waited forever behind TONIGHT).
  const [cur] = queue.splice(0, 1); return show(cur);
}
function show(t) {
  busy = true;
  const el = document.createElement('div');
  el.className = `ticket ticket--${t.kind}${t.href || t.action ? ' linked' : ''}${t.art ? ' ticket--art' : ''}${t.sticky ? ' ticket--sticky' : ''}`;
  el.dataset.eyebrow = (t.eyebrow ?? '').toUpperCase(); if (t.id) el.dataset.id = t.id; // the colour of its top edge (css/ui.css, 2026-10-17 design A)
  el.innerHTML = `${t.art ? `<span class="ticket__art" aria-hidden="true">${t.art}</span>` : '<i class="ticket__mark" aria-hidden="true"></i>'}<span class="ticket__body">${t.eyebrow ? `<span class="ticket__eyebrow">${esc(t.eyebrow)}</span>` : ''}<span class="ticket__line">${t.html ? t.line : esc(t.line)}</span></span>${t.xp ? `<span class="ticket__xp">+${t.xp}<small>XP</small></span>` : t.href || t.action ? `<span class="ticket__go">${esc(t.go ?? 'OPEN')} ›</span>` : ''}${t.sticky ? '<button type="button" class="ticket__x" aria-label="Dismiss">✕</button>' : ''}`;
  // Up long enough to read (2026-10-06: at least 5 s, about 1.6× the old times); a tap sends it away sooner.
  let gone = false, stopConfetti = () => {};
  const dismiss = () => { if (gone) return; gone = true; clearInterval(timer); stopConfetti(); if (t.id) live.delete(t.id); stickies.delete(dismiss); if (t.sticky) { shelf.splice(shelf.indexOf(el), 1); shelf.at(-1)?.classList.remove('shelved'); } el.classList.add('out'); el.classList.remove('in'); setTimeout(() => { el.remove(); if (!t.sticky) { busy = false; } pump(); }, 200); };
  el.addEventListener('click', (e) => {
    if (e.target.closest('.ticket__x')) { dismiss(); return; }
    if (t.action) { dismiss(); try { t.action(); } catch {} return; }
    if (t.href) { if (!window.scNavigate?.(t.href)) location.href = t.href; dismiss(); } else dismiss();
  });
  stack().append(el);
  requestAnimationFrame(() => {
    if (gone) return;
    el.classList.add('in'); fitStack(); try { onShown?.(t); } catch {}
    if (t.celebrate) stopConfetti = confetti(el);
  });
  // A patch badge takes the stage (2026-10-18, Sevaan): while one shows, toasts already up fade away (css/app.css) and
  // their clock stops, so they come back afterwards with the rest of their time.
  let left = Math.max(5000, t.ms * 1.6);
  // Same whenever the stack can't be seen (2026-10-18 playtest: they ran out unseen behind the Collection and the reveal).
  const timer = t.sticky ? 0 : setInterval(() => { if (!stackSeen()) return; left -= 250; if (left <= 0) dismiss(); }, 250);
  if (t.id) live.set(t.id, dismiss);
  if (t.sticky) {
    shelf.forEach((o) => o.classList.add('shelved')); shelf.push(el);
    stickies.add(dismiss);
    setTimeout(() => { busy = false; pump(); }, 700); // the next toast can come in above it
  }
}
