// Toasts ("tickets", 2026-10-05 design canvas "Toast C"), shared by Explore and Collection (css/ui.css .ticket).
// Kinds colour the left edge: mission (orange), xp (steel blue), event / achievement / rank (gold), info.
// They queue rather than stack: one at a time, oldest first; a tap sends one away sooner. An `id` lets a toast
// be withdrawn the moment it stops being true (dropToast).
// Sticky tickets (2026-10-11, Sevaan: "that kind of toast shouldn’t auto-disappear… a close x… they have to be
// dismissed") stay until tapped or closed with their ✕. They don’t hold up the queue: ordinary toasts keep coming above
// them. At most two stay up; a third sends the oldest away. `action` runs on a tap (like `href`, without a page).
const queue = [];
const live = new Map();
let busy = false;
const stickies = new Set(), shelf = []; // shelf: sticky elements, oldest first; only the newest shows
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function stack() {
  let el = document.getElementById('toasts');
  if (!el) { el = document.createElement('div'); el.id = 'toasts'; el.setAttribute('aria-live', 'polite'); document.body.append(el); }
  watchPush(el);
  return el;
}
// Notices come out from under the header (2026-10-21, Sevaan picked design/notices-under-header.html A): the radar, chips
// and tucked notices step down by however tall the showing notices are (--toast-push), and back up when they go.
function watchPush(el) {
  if (el._push || typeof ResizeObserver === 'undefined') return; el._push = true;
  const set = () => { const shown = [...el.querySelectorAll('.ticket.in')].filter((t) => t.offsetParent !== null || getComputedStyle(t).position === 'fixed');
    const h = shown.length ? el.getBoundingClientRect().height + 8 : 0; document.documentElement.style.setProperty('--toast-push', `${Math.round(h)}px`); };
  new ResizeObserver(set).observe(el); new MutationObserver(set).observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] });
}
export function toast(html, ms = 2200, href = null, opts = {}) { ticket({ kind: 'info', line: html, html: true, ms, href, ...opts }); }
// Called with each ticket as it appears (main.js plays its sound: mission, rank up, or the quiet toast).
let onShown = null;
export function onTicketShown(fn) { onShown = fn; }
// Notices, design/notifications-all.html (2026-10-18, Sevaan approved): an icon tile, a short kind line, a title (line),
// an optional detail (sub), and one thing on the right (XP, ›, or a light ✕). `icon` names one of ICONS (or `art` fills the
// tile); `tone` sets the colour (orange rewards, gold the night’s news, steel progress, cream info, red failures);
// `go` is the words for a tap ("See the plan"), shown in the detail line.
export const ICONS = {
  diamond: '<path d="M12 3l7 9-7 9-7-9z"/>', star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  stamp: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/>', chevrons: '<path d="M6 14l6-6 6 6M6 19l6-6 6 6"/>',
  card: '<rect x="6" y="3.5" width="12" height="17" rx="2"/><path d="M9 8h6M9 11h6"/>', bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  belloff: '<path d="M6 16.5V11a6 6 0 0 1 9.5-4.9M18 11v5.5l1.5 2H8"/><path d="M4 4l16 16"/>', moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
  pin: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>', compass: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2l-1.9 4.7-4.7 1.9 1.9-4.7z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  ff: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/><path d="M19.5 4.5l1 3-3 .5"/>', sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/><path d="M19 15.5c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2z"/>',
  target: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.4"/><path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3"/>', alert: '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4.5M12 17.3v.2"/>',
  meteor: '<path d="M20 4l-9.5 9.5M17 3.5l-8 8M20.5 7l-8 8"/><circle cx="8" cy="16" r="3.2"/>', update: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4.5v4h-4"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/><path d="M8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 16.8h.01M12 16.8h.01"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>', check: '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.6 2.5 4.9-5.3"/>',
};
const KIND_ICON = { mission: 'diamond', rank: 'chevrons', event: 'star', xp: 'stamp', patch: 'card', compass: 'compass', info: 'info', error: 'alert', shiny: 'sparkle' };
const KIND_TONE = { mission: 'orange', rank: 'orange', patch: 'orange', compass: 'orange', event: 'gold', xp: 'steel', info: 'info', error: 'red', shiny: 'shiny' };
export const iconSvg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ICONS.info}</svg>`;
export function ticket({ kind = 'info', eyebrow = '', line = '', sub = '', icon = '', tone = '', xp = 0, ms = 3000, href = null, html = false, delay = 0, id = null, art = '', celebrate = false, sticky = false, action = null, go = null }) {
  if (id && toastPending(id)) dropToast(id); // the same message again replaces the old one
  // Only a direct answer to something done on an open page (a reminder set there, an error) may show over it. Progress from a
  // catch (worlds, stars, patches, missions) waits for the page to close, even if it was queued before it opened (iOS playtest 2026-10-19).
  const inPanel = !delay && !['xp', 'rank', 'mission', 'event', 'patch', 'shiny', 'milestone', 'complete'].includes(kind) && !!document.querySelector('.overlay.panel:not([hidden])');
  queue.push({ kind, eyebrow, line, sub, icon, tone, xp, ms, href, html, id, art, celebrate, sticky, action, go, inPanel, at: Date.now() + delay });
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
  // Notices at the top of the screen burst downward, over the sky, instead of off the top edge (2026-10-18).
  const down = el.getBoundingClientRect().top < innerHeight / 2;
  if (down) burst.classList.add('down');
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('i');
    piece.style.setProperty('--dx', `${(i / 23 - .5) * 260}px`);
    piece.style.setProperty('--dy', `${(down ? 1 : -1) * (55 + Math.random() * 90)}px`);
    piece.style.setProperty('--turn', `${(Math.random() - .5) * 540}deg`);
    piece.style.setProperty('--delay', `${420 + Math.random() * 120}ms`);
    burst.append(piece);
  }
  el.classList.add('ticket--celebrate');
  el.append(burst);
  const timer = setTimeout(() => burst.remove(), 2000);
  return () => { clearTimeout(timer); burst.remove(); };
}
function tray() {
  let el = document.getElementById('toast-tray');
  if (!el) { el = document.createElement('div'); el.id = 'toast-tray'; document.body.append(el); }
  return el;
}
function stackSeen() {
  if (document.querySelector('.patch-coins, #start:not([hidden])') || document.body.classList.contains('col-open')) return false;
  const cs = getComputedStyle(stack()); return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.3;
}
// Up top, the stack never reaches down over the circle (2026-10-18 playtest: on an SE two notices covered half of it).
// main.js sets --toast-limit (the circle’s top); the newest tickets that fit show, older ones wait out of sight.
function fitStack() {
  const el = document.getElementById('toasts'); if (!el || document.hidden || !el.querySelector('.ticket.in')) return; // no tickets, or in the background: no layout read (bug hunt 2026-10-22)
  const lim = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toast-limit'));
  const top = el.getBoundingClientRect().top, items = [...el.querySelectorAll('.ticket.in:not(.shelved)')].reverse(); // newest first (column-reverse)
  let room = lim && top < innerHeight / 2 ? lim - top : Infinity;
  items.forEach((t, i) => { const h = (t.classList.contains('over') ? Number(t.dataset.h || 60) : Number(t.dataset.h = t.offsetHeight)) + 8, /* hidden ones keep their last height */ fits = i === 0 || h <= room; t.classList.toggle('over', !fits); if (fits) room -= h; else room = -1; });
}
setInterval(fitStack, 300);
function pump() {
  if (busy || !queue.length) return;
  // With a page open, a notice made on that page goes ahead of older ones waiting for the page to close (code review
  // 2026-10-23: "Welcome to Plus" sat behind a notice from Explore).
  let qi = 0; if (!queue[0].inPanel && document.querySelector('.overlay.panel:not([hidden])')) { const j = queue.findIndex((q) => q.inPanel); if (j > 0) qi = j; }
  const t = queue[qi], wait = t.at - Date.now();
  if (wait > 0) { busy = true; setTimeout(() => { busy = false; pump(); }, wait); return; }
  // Never over a card reveal or a patch moment (2026-10-08 playtest: toasts covered the new card); they wait their turn.
  // A sheet covers all of that, so its own messages go straight up (2026-10-16 playtest: "Try Plus free" said nothing,
  // its toast waiting behind the Plus sheet for whatever sat in the circle to leave).
  if (!document.querySelector('.set-sheet.in') && document.querySelector('#start:not([hidden]), #reveal:not([hidden]), .patch-moment, .patch-coins, body.patch-waiting, #ob-done:not([hidden]), body.first-catch')) { /* body.first-catch: the first catch after the tour (main.js) */ busy = true; setTimeout(() => { busy = false; pump(); }, 500); return; }
  // One sticky on screen at a time (2026-10-13 playtest: two stacked stickies covered 40% of an SE). A new one shows
  // straight away and the older one is shelved until it goes (2026-10-18 playtest: NEW RANK waited forever behind TONIGHT).
  const [cur] = queue.splice(qi, 1); return show(cur);
}
function show(t) {
  busy = true;
  const el = document.createElement('div');
  el.className = `ticket ticket--${t.kind} tone-${t.tone || KIND_TONE[t.kind] || 'info'}${t.href || t.action ? ' linked' : ''}${t.art ? ' ticket--art' : ''}${t.sticky ? ' ticket--sticky' : ''}`;
  el.dataset.eyebrow = (t.eyebrow ?? '').toUpperCase(); if (t.id) el.dataset.id = t.id;
  if (t.inPanel) el.dataset.panel = '1'; // made on an open page (Now, Settings): it answers something done there, so it may show over it (css/app.css)
  const go = t.href || t.action ? `<span class="tn-go">${esc(t.go ?? 'Open')} ›</span>` : '', sub = t.sub ? (t.html ? t.sub : esc(t.sub)) : '';
  el.innerHTML = `<span class="tn-ic${t.art ? ' art' : ''}" aria-hidden="true">${t.art || iconSvg(t.icon || KIND_ICON[t.kind])}</span>`
    + `<span class="ticket__body">${t.eyebrow ? `<span class="ticket__eyebrow">${esc(t.eyebrow)}</span>` : ''}<span class="ticket__line">${t.html ? t.line : esc(t.line)}</span>${sub || go ? `<span class="ticket__sub">${sub}${sub && go ? ' · ' : ''}${go}</span>` : ''}</span>`
    + (t.xp ? `<span class="ticket__xp">+${t.xp}<small>XP</small></span>` : t.sticky ? '<button type="button" class="ticket__x" aria-label="Dismiss">✕</button>' : '<span></span>');
  // Up long enough to read (2026-10-06: at least 5 s, about 1.6× the old times); a tap sends it away sooner.
  let gone = false, stopConfetti = () => {};
  const dismiss = () => { if (gone) return; gone = true; clearInterval(timer); stopConfetti(); if (t.id) live.delete(t.id); stickies.delete(dismiss); if (t.sticky) { clearInterval(tuckT); const i = shelf.indexOf(el); if (i >= 0) shelf.splice(i, 1); } el.classList.add('out'); el.classList.remove('in'); setTimeout(() => { el.remove(); if (!t.sticky && holding) { holding = false; busy = false; } pump(); }, 200); };
  // Swipe up to send it away, like the phone’s own notifications (2026-10-18).
  let y0 = null, dy = 0, swiped = false;
  el.addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; try { el.setPointerCapture(e.pointerId); } catch {} });
  el.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.min(0, e.clientY - y0); if (dy < -4) { el.classList.add('dragging'); el.style.transform = `translateY(${dy}px)`; } });
  const up = () => { if (y0 == null) return; y0 = null; el.classList.remove('dragging'); el.style.transform = ''; if (dy < -28) { swiped = true; dismiss(); } };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('click', (e) => {
    if (swiped) { swiped = false; return; }
    if (el.classList.contains('tucked')) { untuck(); return; } // the chip opens back into the banner
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
  // Same whenever the stack can’t be seen (2026-10-18 playtest: they ran out unseen behind the Collection and the reveal).
  // A notice hidden by a page that opened after it (it doesn't belong there) lets the queue go on, so one made on that
  // page (e.g. "Welcome to Plus" after buying from the Tonight page) isn't stuck behind it (2026-10-23 Plus test); it
  // keeps the rest of its time for when the page closes.
  let holding = !t.sticky;
  const timer = t.sticky ? 0 : setInterval(() => { const hid = getComputedStyle(el).display === 'none'; if (hid && holding && !el.dataset.panel && queue.some((q) => q.inPanel) && document.querySelector('.overlay.panel:not([hidden])')) { /* only for one that may show over the page; the rest keep waiting in order (code review 2026-10-23) */ holding = false; busy = false; pump(); } if (!stackSeen() || hid) return; left -= 250; if (left <= 0) dismiss(); }, 250); // hidden (a page open, shelved, no room): the clock waits
  if (t.id) live.set(t.id, dismiss);
  // A notice that stays (Tonight, Example location, a new rank…) comes down as a banner like the rest, then after 6 s
  // tucks into a small chip under the header (#toast-tray) so it never sits over the header’s buttons; tap the chip to
  // open it again, ✕ or a swipe up to send it away. A newer one tucks the older ones straight away (2026-10-18).
  // The 6 s count only while the banner can actually be seen (2026-10-18 playtest: one made behind the Collection came
  // back already tucked, never shown as a banner).
  let tuckT = 0;
  const tuckLater = () => { clearInterval(tuckT); let seen = 0; tuckT = setInterval(() => { if (!stackSeen() || getComputedStyle(el).display === 'none' || !el.classList.contains('in')) return; if ((seen += 250) >= 6000) tuck(); }, 250); };
  function tuck() { clearInterval(tuckT); if (gone || el.classList.contains('tucked')) return; el.classList.remove('in'); el.classList.add('tucked'); tray().append(el); requestAnimationFrame(() => el.classList.add('in')); }
  function untuck() { el.classList.remove('tucked', 'in'); stack().append(el); requestAnimationFrame(() => { el.classList.add('in'); fitStack(); }); tuckLater(); shelf.forEach((o) => { if (o !== el) o.tuck?.(); }); }
  el.tuck = tuck;
  if (t.sticky) {
    shelf.forEach((o) => o.tuck?.()); shelf.push(el);
    tuckLater();
    stickies.add(dismiss);
    setTimeout(() => { busy = false; pump(); }, 700); // the next toast can come in above it
  }
}
