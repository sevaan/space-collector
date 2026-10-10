// Share a card as an image (1080 × 1350, Instagram portrait): drawn on a canvas in the card style (art,
// name, rarity, stats, fact, when you saw it, your observer rank), then handed to the share sheet
// (navigator.share with a file) or downloaded. Drawing it ourselves avoids DOM-screenshot libraries,
// which mangle Safari's fonts and blend modes.
import { conArt } from './con-art.js?v=0.1.372';
import { CON_BY_ID } from './constellations.js?v=0.1.372';
import { TIER_INFO } from './rarity.js?v=0.1.372';
const W = 1080, H = 1350, INK = '#fff2b3', MUTED = '#bdbea9', ORANGE = '#fa8127', NAVY = '#080f1b';
const loadImg = (src) => new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = src; });
const svgImg = async (svg) => { const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); try { return await loadImg(u); } finally { URL.revokeObjectURL(u); } };
const plain = (t) => String(t ?? '').replace(/\*\*/g, '');

function wrap(ctx, text, x, y, maxW, lh, maxLines = 4) {
  const words = plain(text).split(/\s+/); let line = '', n = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y + n * lh); line = w; if (++n >= maxLines) return; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, y + n * lh);
}
function cover(ctx, img, x, y, w, h) {
  const r = Math.max(w / img.width, h / img.height), iw = img.width * r, ih = img.height * r;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); ctx.restore();
}

// card: catalogue card. art: { src } (image URL) or { svg } (SVG string). info: { title, setName, tierLabel, tierColor,
// stats: [[label, value, unit]], fact, collected, seen, rank, gold, shiny }.
export async function drawShareCard(card, art, info) {
  await Promise.all(['400 60px "SC Display"', '500 30px "SC Label"'].map((f) => document.fonts?.load(f).catch(() => {})));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const gold = info.gold, edge = gold ? '#e2b53c' : '#adbcc8', ink = gold ? '#f4d27a' : INK;
  // Background and a scatter of stars.
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, gold ? '#2b2110' : '#0e1830'); bg.addColorStop(1, '#05080f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 160; i++) { ctx.globalAlpha = 0.2 + rnd() * 0.6; ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, rnd() * 1.6 + 0.3, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  // The card.
  const X = 70, Y = 60, CW = W - 140, CH = H - 120, R = 36;
  ctx.fillStyle = gold ? '#1d170b' : NAVY;
  ctx.beginPath(); ctx.roundRect(X, Y, CW, CH, R); ctx.fill();
  ctx.lineWidth = 10; ctx.strokeStyle = edge; ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = gold ? '#f7d77a' : '#d4e0e7'; ctx.beginPath(); ctx.roundRect(X + 12, Y + 12, CW - 24, CH - 24, R - 10); ctx.stroke();
  const L = X + 44, Rr = X + CW - 44;
  // Set bar and rarity.
  ctx.font = '500 26px "SC Label", "Arial Narrow", sans-serif'; ctx.fillStyle = ink; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = '4px';
  ctx.fillText(info.setName.toUpperCase(), L, Y + 74);
  ctx.textAlign = 'right'; ctx.fillStyle = info.tierColor; ctx.fillText('◆ ', Rr - ctx.measureText(info.tierLabel.toUpperCase()).width - 6, Y + 74);
  ctx.fillStyle = ink; ctx.fillText(info.tierLabel.toUpperCase(), Rr, Y + 74); ctx.textAlign = 'left';
  ctx.fillStyle = gold ? '#b98f2e' : '#bcb585'; ctx.fillRect(L, Y + 96, Rr - L, 2);
  // Name (shrinks to fit two lines).
  ctx.letterSpacing = '0px';
  let size = 78; ctx.font = `400 ${size}px "SC Display", Impact, sans-serif`;
  const title = info.title.toUpperCase();
  while (ctx.measureText(title).width > (Rr - L) * 1.9 && size > 44) { size -= 4; ctx.font = `400 ${size}px "SC Display", Impact, sans-serif`; }
  ctx.fillStyle = ink; wrap(ctx, title, L, Y + 96 + size + 14, Rr - L, size * 1.02, 2);
  // Art.
  const artY = Y + 300, artH = 520;
  try { const img = art.src ? await loadImg(art.src) : await svgImg(art.svg); cover(ctx, img, X + 12, artY, CW - 24, artH); } catch {}
  if (info.shiny) {
    const g = ctx.createLinearGradient(X, artY, X + CW, artY + artH);
    ['#ff8fd8', '#ffe08a', '#8ff0ff', '#b58cff'].forEach((col, i) => g.addColorStop(i / 3, col));
    ctx.globalAlpha = 0.22; ctx.fillStyle = g; ctx.fillRect(X + 12, artY, CW - 24, artH); ctx.globalAlpha = 1;
    ctx.font = '500 26px "SC Label", sans-serif'; ctx.letterSpacing = '4px';
    const tag = `✦ SHINY · ${info.shiny.toUpperCase()}`, tw = ctx.measureText(tag).width + 36;
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(L, artY + 24, tw, 48, 24); ctx.fill();
    ctx.fillStyle = '#0b1120'; ctx.fillText(tag, L + 18, artY + 57);
  }
  // Stats.
  const sy = artY + artH + 40, colW = (Rr - L) / 3;
  info.stats.slice(0, 3).forEach(([label, value, unit], i) => {
    const x = L + i * colW;
    ctx.letterSpacing = '3px'; ctx.font = '500 24px "SC Label", sans-serif'; ctx.fillStyle = ink; ctx.fillText(String(label).toUpperCase(), x, sy);
    ctx.fillStyle = gold ? '#b98f2e' : '#bcb585'; ctx.fillRect(x, sy + 12, colW - 24, 2);
    ctx.letterSpacing = '0px'; let vs = 50; ctx.font = `400 ${vs}px "SC Display", Impact, sans-serif`;
    const v = `${value}${unit ? ` ${unit}` : ''}`;
    while (ctx.measureText(v).width > colW - 28 && vs > 26) { vs -= 3; ctx.font = `400 ${vs}px "SC Display", Impact, sans-serif`; }
    ctx.fillStyle = ink; ctx.fillText(v, x, sy + 72);
  });
  // Fact.
  const fy = sy + 130;
  ctx.fillStyle = ORANGE; ctx.fillRect(L, fy - 30, 6, 120);
  ctx.font = '400 32px Georgia, "Times New Roman", serif'; ctx.fillStyle = ink; wrap(ctx, info.fact, L + 28, fy, Rr - L - 28, 42, 3);
  // Footer.
  const fyy = Y + CH - 60;
  ctx.fillStyle = gold ? '#b98f2e' : '#bcb585'; ctx.fillRect(X + 12, fyy - 54, CW - 24, 2);
  ctx.letterSpacing = '3px'; ctx.font = '500 25px "SC Label", sans-serif'; ctx.fillStyle = ink;
  ctx.fillText(`✓ ${info.collected}  |  ${info.seen}`, L, fyy);
  ctx.textAlign = 'right'; ctx.letterSpacing = '0px'; ctx.font = '400 28px "SC Display", Impact, sans-serif'; ctx.fillText('SPACE COLLECTOR', Rr, fyy); ctx.textAlign = 'left';
  // Under the card: the observer's rank.
  ctx.letterSpacing = '4px'; ctx.font = '500 26px "SC Label", sans-serif'; ctx.fillStyle = MUTED; ctx.textAlign = 'center';
  ctx.fillText(`OBSERVER RANK · ${info.rank.toUpperCase()}`, W / 2, H - 22); ctx.textAlign = 'left';
  return c;
}

export async function shareCard(canvas, filename, title) {
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return 'shared'; } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}

// Share the card element on screen (collection viewer, capture reveal): read what it shows so the image matches.
// c: catalogue card. Returns 'shared' | 'cancelled' | 'downloaded'.
export async function shareCardEl(el, c, { title, rank = '', fact = '' }) {
  const txt = (sel) => el.querySelector(sel)?.textContent.trim() ?? '';
  const img = el.querySelector('.card__art img.card-art-image'), svg = el.querySelector('.card__art svg');
  const art = img ? { src: img.src } : c.natural === 'constellation' ? { svg: conArt(c.data) } : c.con && !c.skyName && CON_BY_ID.get(c.con) ? { svg: conArt(CON_BY_ID.get(c.con).data, c.hip) } : { svg: svg ? new XMLSerializer().serializeToString(svg) : '' };
  const stats = [...el.querySelectorAll('.card__stats > div')].map((d) => [d.querySelector('.card__label')?.textContent ?? '', d.querySelector('b')?.childNodes[0]?.textContent.trim() ?? '', d.querySelector('b small')?.textContent ?? '']);
  const tier = TIER_INFO[c.tier]?.color ?? '#fa8127'; // not the card's CSS colour, which red night mode overrides (QA 2026-10-08)
  const canvas = await drawShareCard(c, art, {
    title, setName: txt('.card__setbar > span:first-child'), tierLabel: txt('.card__tier').replace(/^\W+/, ''), tierColor: tier, stats,
    fact: txt('.card__fact p') || fact, // fleet cards have no fact line on the card collected: txt('.card__status > span:nth-child(2)'), seen: txt('.card__seen-count'), rank,
    gold: el.classList.contains('gold-foil'), shiny: el.querySelector('.shiny-tag')?.textContent.split('·')[1]?.trim() ?? null,
  });
  return shareCard(canvas, `${title.replace(/[^\w-]+/g, '-').toLowerCase()}.png`, `${title} · Space Collector`);
}
