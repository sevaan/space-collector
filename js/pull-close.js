// Pull a page down to close it (2026-10-21, Sevaan: "let me swipe down aggressively to close it"). Works from anywhere
// on the page, but only once it's scrolled to the very top, so long pages (Settings) still scroll normally. The page
// follows the finger with some resistance; a long pull (120 px) or a quick flick down closes it, anything less springs
// back. close(): the page's own close; while it runs the page keeps its pulled-down position (class .pulled).
export function pullToClose(el, close, scroller = el) {
  let y0 = null, t0 = 0, dy = 0, live = false;
  const ok = (e) => !e.target.closest('input[type=range], .sky-jump, .mini-cards, .minis, [data-no-pull]');
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || !ok(e)) { y0 = null; return; }
    y0 = e.touches[0].clientY; t0 = performance.now(); dy = 0; live = false; el.classList.remove('pulled');
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    const d = e.touches[0].clientY - y0;
    if (!live) { if (scroller.scrollTop > 0 || d < 6) { if (d < -6 || scroller.scrollTop > 0) y0 = null; return; } live = true; y0 = e.touches[0].clientY; }
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
