// Pull a page down to close it (2026-10-21, Sevaan: "let me swipe down aggressively to close it"). Works from anywhere
// on the page, but only once it's scrolled to the very top, so long pages (Settings) still scroll normally. The page
// follows the finger with some resistance; a long pull (120 px) or a quick flick down closes it, anything less springs
// back. close(): the page's own close; while it runs the page keeps its pulled-down position (class .pulled).
export function pullToClose(el, close, scroller = el) {
  let y0 = null, t0 = 0, dy = 0, live = false, scs = [scroller];
  const ok = (e) => !e.target.closest('input[type=range], .sky-jump, .mini-cards, .minis, [data-no-pull]') && !(e.target.closest('.set-sheet') && !el.classList.contains('set-sheet')); // a sheet over the page has its own swipe (code review 2026-10-23)
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || !ok(e)) { y0 = null; return; }
    y0 = e.touches[0].clientY; t0 = performance.now(); dy = 0; live = false; el.classList.remove('pulled');
    // A wide screen's book pages ([data-col], 2026-10-22) scroll on their own: the pull waits for the one you're on.
    const col = e.target.closest?.('[data-col]'); scs = [scroller]; if (col && el.contains(col) && /auto|scroll/.test(getComputedStyle(col).overflowY)) scs.push(col);
    // Every part of the page that scrolls on its own, under the finger, must be at its top too (2026-10-22, Sevaan: on the
    // cloudy-night Tonight page, which scrolls inside an inner panel, a drag back up pulled the whole page down; code
    // review 2026-10-23: checking only the innermost one let a nested scroller at its top close a page scrolled down).
    for (let n = e.target; n && n !== el; n = n.parentElement) {
      if (n.scrollHeight > n.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(n).overflowY)) scs.push(n);
    }
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    const d = e.touches[0].clientY - y0;
    if (!live) { const down = scs.some((s) => s.scrollTop > 0); if (down || d < 6) { if (d < -6 || down) y0 = null; return; } live = true; y0 = e.touches[0].clientY; }
    dy = Math.max(0, e.touches[0].clientY - y0); e.preventDefault();
    el.style.transition = 'none'; el.style.transform = `translateY(${(dy < 200 ? dy : 200 + (dy - 200) * 0.4).toFixed(1)}px)`;
  }, { passive: false });
  const end = () => {
    if (y0 == null || !live) { y0 = null; return; }
    const v = dy / Math.max(1, performance.now() - t0); y0 = null; live = false;
    if (dy > 120 || (dy > 50 && v > 0.6)) {
      el.classList.add('pulled'); el.style.transition = 'transform .22s cubic-bezier(.3,.6,.4,1)'; el.style.transform = 'translateY(100%)';
      setTimeout(() => { close(); setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.classList.remove('pulled'); }, 450); }, 200);
    } else { el.style.transition = 'transform .3s cubic-bezier(.2,.9,.3,1.1)'; el.style.transform = ''; }
  };
  el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
}
