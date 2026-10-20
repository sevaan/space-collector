// Larger Text on iPhone (2026-10-20, iOS playtest: Dynamic Type had no effect, every size is px). WebKit sizes the
// system "body" font by the phone's text size setting, so a hidden probe tells us the player's scale (17px = normal),
// and -webkit-text-size-adjust scales the page's text by it on iOS. Capped at 135% so screens hold together (Android's
// WebView does the same through setTextZoom, capped at 115% in MainActivity). Cards keep their printed size: their faces
// are fixed artwork (css/cards.css resets it on .card). Only smaller-than-normal is ignored.
const probe = document.createElement('span');
probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;font:-apple-system-body;left:-9999px;top:0';
probe.textContent = 'A';
export function applyTextSize() {
  if (!/iP(hone|ad|od)/.test(navigator.userAgent)) return;
  if (!probe.isConnected) document.body?.append(probe);
  const px = parseFloat(getComputedStyle(probe).fontSize);
  if (!Number.isFinite(px) || px <= 0) return;
  const pct = Math.round(Math.min(1.35, Math.max(1, px / 17)) * 100);
  document.documentElement.style.webkitTextSizeAdjust = `${pct}%`;
  document.documentElement.dataset.textScale = String(pct);
}
if (document.body) applyTextSize(); else document.addEventListener('DOMContentLoaded', applyTextSize, { once: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden) applyTextSize(); }); // changed in Settings while away
