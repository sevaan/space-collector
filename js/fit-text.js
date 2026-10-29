// Shrink text until it fits its box (2026-10-29, Sevaan: "make sure the text always fits"). Each element steps down
// half a pixel at a time from its styled size, never below `min`, until nothing is clipped or hidden by its line clamp.
export function fitText(els, min = 9) {
  for (const el of els) {
    el.style.fontSize = '';
    let px = parseFloat(getComputedStyle(el).fontSize);
    while (px > min && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) { px -= 0.5; el.style.fontSize = `${px}px`; }
  }
}
// The same for whole cards: shrink the given parts together until each fits and the card itself overflows nothing.
export function fitCards(cards, parts = ['b', 'small'], min = 8, { uniform = false } = {}) {
  for (const c of cards) {
    const els = parts.map((p) => c.querySelector(p)).filter(Boolean); els.forEach((e) => { e.style.fontSize = ''; });
    const size = els.map((e) => parseFloat(getComputedStyle(e).fontSize)), over = () => c.scrollHeight > c.clientHeight + 1 || els.some((e) => e.scrollHeight > e.clientHeight + 1);
    for (let k = 0; k < 40 && over(); k++) { let moved = false; els.forEach((e, i) => { if (size[i] > min) { size[i] -= 0.5; e.style.fontSize = `${size[i]}px`; moved = true; } }); if (!moved) break; }
  }
  // One size per part across the row (playtest 2026-10-29: one title shrank to 8 px beside 10.5 px neighbours): every
  // card takes the smallest size any card needed.
  if (uniform && cards.length > 1) parts.forEach((p) => {
    const els = [...cards].map((c) => c.querySelector(p)).filter(Boolean), px = Math.min(...els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
    els.forEach((e) => { e.style.fontSize = `${px}px`; });
  });
}
