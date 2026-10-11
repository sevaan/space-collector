// Sound effects (2026-10-11, Sevaan's picks from the v2 sound board). All but one are the designed set: glass bells,
// soft mallets, kalimba and airy breaths, all in G major so they sit inside the music ("Permafrost"). The toast is
// "Notification Sound 2" by deadrobotmusic (Freesound, CC0), softened. Files: assets/audio/sfx/<name>.mp3.
// Decoded once into memory after the first tap, played through the shared context (js/audio-ctx.js) so they're instant.
// Off with Settings → Sounds and vibration (localStorage sound = '0').
import { audioCtx } from './audio-ctx.js?v=0.1.454';
export const SFX = ['lock', 'collect', 'arrive', 'flip', 'r_common', 'r_uncommon', 'r_rare', 'r_epic', 'r_legend', 'shiny', 'seen', 'stamp', 'levelup', 'xp',
  'mission', 'rankup', 'patch', 'coinroll', 'complete', 'secret', 'fossil', 'ufo', 'welcome', 'swipe', 'step', 'toggle', 'toast'];
const BASE = new URL('../assets/audio/sfx/', import.meta.url).href;
const bufs = new Map(), last = new Map();
let loading = null;
const soundOff = () => { try { return localStorage.getItem('sound') === '0'; } catch { return false; } };
export function loadSfx() {
  const ctx = audioCtx(); if (!ctx || loading) return loading;
  return (loading = Promise.all(SFX.map((n) => fetch(`${BASE}${n}.mp3`).then((r) => r.arrayBuffer()).then((a) => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))).then((b) => bufs.set(n, b)).catch(() => {}))));
}
// name: one of SFX. gain: 0–1 on top of the file's own level. gap: skip if the same sound played less than gap ms ago.
// delay: seconds from now (scheduled on the audio clock, so it stays in time with animations).
export function sfx(name, { gain = 1, gap = 0, delay = 0 } = {}) {
  if (soundOff()) return;
  const ctx = audioCtx(); if (!ctx) return;
  const b = bufs.get(name); if (!b) { loadSfx(); return; }
  const now = performance.now(); if (gap && now - (last.get(name) ?? -1e9) < gap) return; last.set(name, now);
  try { const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; g.gain.value = gain; src.connect(g).connect(ctx.destination); src.start(ctx.currentTime + delay); } catch {}
}
// Load on the first tap (the context can only start from one), so the first real sound is ready.
if (typeof document !== 'undefined') document.addEventListener('pointerdown', () => loadSfx(), { once: true, capture: true });
