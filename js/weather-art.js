// Weather backdrops for full-screen pages (2026-10-08, design/tonight-weather.html): soft drifting cloud made from
// fractal noise (no visible shapes), and animated rain. Styles in css/ui.css (.wx-clouds, .wx-rain).
let cid = 0;
function layer(amount, dark, scale, seed, op) {
  const id = `wxc${cid++}`, slope = 2.4, intercept = -1.3 + amount * 0.95;
  const [r, g, b] = dark ? [0.17, 0.2, 0.25] : [0.25, 0.3, 0.38];
  return `<svg viewBox="0 0 600 320" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;opacity:${op}">
    <defs><filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${0.006 * scale} ${0.014 * scale}" numOctaves="5" seed="${seed}"/>
      <feColorMatrix type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  1 0 0 0 0"/><feComponentTransfer><feFuncA type="linear" slope="${slope}" intercept="${intercept}"/></feComponentTransfer><feGaussianBlur stdDeviation="1.2"/></filter>
      <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="${id}k"><rect width="600" height="320" fill="url(#${id}m)"/></mask></defs>
    <g mask="url(#${id}k)"><rect width="600" height="320" filter="url(#${id})"/></g></svg>`;
}
// amount 0..1 cloud cover; side: 'right' to have it creep in from one side (clouding over).
export function cloudsHtml(amount, { dark = false, side = null } = {}) {
  const inner = `<div class="wx-clouds"><div class="wx-layer" style="--d:34s">${layer(amount, dark, 1, 4, 0.75)}</div><div class="wx-layer" style="--d:22s;animation-direction:alternate-reverse">${layer(amount * 0.8, dark, 1.8, 11, 0.6)}</div></div>`;
  return side ? `<div class="wx-side">${inner}</div>` : inner;
}
export function rainHtml(n = 90) {
  let s = ''; for (let i = 0; i < n; i++) s += `<i style="left:${(Math.random() * 120).toFixed(1)}%;--t:${(0.55 + Math.random() * 0.35).toFixed(2)}s;--dl:${(-Math.random()).toFixed(2)}s;--h:${(12 + Math.random() * 10).toFixed(0)}px"></i>`;
  return `<div class="wx-rain">${s}</div>`;
}
