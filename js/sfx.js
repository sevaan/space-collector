// Sound effects (2026-10-11, Sevaan's picks from the v2 sound board). All but one are the designed set: glass bells,
// soft mallets, kalimba and airy breaths, all in G major so they sit inside the music ("Permafrost"). The toast is
// "Notification Sound 2" by deadrobotmusic (Freesound, CC0), softened. Files: assets/audio/sfx/<name>.mp3.
// Decoded once into memory after the first tap, played through the shared context (js/audio-ctx.js) so they're instant.
// Off with Settings → Sounds and vibration (localStorage sound = '0').
import { audioCtx } from './audio-ctx.js?v=0.1.687';
export const SFX = ['lock', 'collect', 'arrive', 'flip', 'r_common', 'r_uncommon', 'r_rare', 'r_epic', 'r_legend', 'shiny', 'seen', 'stamp', 'levelup', 'xp',
  'mission', 'rankup', 'patch', 'coinroll', 'complete', 'secret', 'fossil', 'ufo', 'welcome', 'swipe', 'step', 'toggle', 'toast', 'page', 'rattle', 'plane'];
const BASE = new URL('../assets/audio/sfx/', import.meta.url).href;
const bufs = new Map(), last = new Map();
let loading = null;
// Everything plays at a quarter of the files' level (2026-10-11, Sevaan halved it twice), times the Settings volume (0–1).
const LEVEL = 0.25; // halved again 2026-10-11
export const sfxVolume = () => { try { const v = parseFloat(localStorage.getItem('sfxVol')); return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1; } catch { return 1; } };
const soundOff = () => { try { return localStorage.getItem('sound') === '0'; } catch { return false; } };
export function loadSfx() {
  const ctx = audioCtx(); if (!ctx || loading) return loading;
  return (loading = Promise.all(SFX.map((n) => fetch(`${BASE}${n}.mp3`).then((r) => r.arrayBuffer()).then((a) => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))).then((b) => bufs.set(n, b)).catch(() => {}))));
}
// name: one of SFX. gain: 0–1 on top of the file's own level. gap: skip if the same sound played less than gap ms ago.
// delay: seconds from now (scheduled on the audio clock, so it stays in time with animations).
// Loudness matched per file (2026-10-12, craft room: the files were balanced by peak, so measured loudness ran from −22
// to −39 LUFS and the small sounds vanished under the music). Measured with ffmpeg ebur128; stingers sit at about −22,
// ticks and swishes at −28, the shiny at −19 (the loudest). Lock, toast and toggle are too short to measure: unchanged.
const NORM = { arrive: 1.4, coinroll: 1.38, collect: 0.59, complete: 1.39, flip: 4.0, fossil: 2.43, levelup: 1.23, lock: 2.75, mission: 1.02, page: 3.97, patch: 0.91, plane: 0.94, r_common: 1.24, r_epic: 1.17, r_legend: 0.88, r_rare: 1.44, r_uncommon: 1.03, rankup: 1.04, rattle: 4.0, secret: 1.64, seen: 1.58, shiny: 3.02, stamp: 0.86, step: 2.14, swipe: 1.3, toggle: 1.74, ufo: 1.38, welcome: 1.27, xp: 4.0 };
// At most two at once: a third small sound is skipped rather than piling on (a Saturn catch stacked four over 5 s).
const STINGERS = new Set(['r_common', 'r_uncommon', 'r_rare', 'r_epic', 'r_legend', 'shiny', 'rankup', 'levelup', 'mission', 'complete', 'secret', 'welcome']);
let playing = 0;
export function sfx(name, { gain = 1, gap = 0, delay = 0 } = {}) {
  if (soundOff()) return;
  const ctx = audioCtx(); if (!ctx) return;
  const b = bufs.get(name); if (!b) { loadSfx(); return; }
  const now = performance.now(); if (gap && now - (last.get(name) ?? -1e9) < gap) return; last.set(name, now);
  if (playing >= 2 && !STINGERS.has(name)) return;
  try { const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; g.gain.value = gain * (NORM[name] ?? 1) * LEVEL * sfxVolume(); src.connect(g).connect(ctx.destination); playing++; src.onended = () => { playing = Math.max(0, playing - 1); }; src.start(ctx.currentTime + delay); } catch {}
}
// Load on the first tap (the context can only start from one), so the first real sound is ready.
if (typeof document !== 'undefined') document.addEventListener('pointerdown', () => loadSfx(), { once: true, capture: true });
