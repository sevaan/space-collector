// Sound effects (2026-10-11, Sevaan’s picks from the v2 sound board). All but one are the designed set: glass bells,
// soft mallets, kalimba and airy breaths, all in G major so they sit inside the music ("Permafrost"). The toast is
// "Notification Sound 2" by deadrobotmusic (Freesound, CC0), softened. Files: assets/audio/sfx/<name>.mp3.
// Decoded once into memory after the first tap, played through the shared context (js/audio-ctx.js) so they’re instant.
// Off with Settings → Sounds and vibration (localStorage sound = '0').
import { audioCtx } from './audio-ctx.js?v=0.1.1285';
import { VERSION } from './version.js?v=0.1.1285';
export const SFX = ['lock', 'collect', 'arrive', 'flip', 'r_common', 'r_uncommon', 'r_rare', 'r_epic', 'r_legend', 'shiny', 'seen', 'stamp', 'levelup', 'xp',
  'mission', 'rankup', 'patch', 'coinroll', 'complete', 'secret', 'fossil', 'ufo', 'welcome', 'swipe', 'step', 'toggle', 'toast', 'page', 'rattle', 'plane'];
const BASE = new URL('../assets/audio/sfx/', import.meta.url).href;
const bufs = new Map(), last = new Map();
let loading = null;
// Everything plays at a quarter of the files' level (2026-10-11, Sevaan halved it twice), times the Settings volume (0–1).
const LEVEL = 0.25; // halved again 2026-10-11
export const sfxVolume = () => { try { const v = parseFloat(localStorage.getItem('sfxVol')); return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.75; } catch { return 0.75; } }; // default 75% (2026-10-19, Sevaan)
const soundOff = () => { try { return localStorage.getItem('sound') === '0'; } catch { return false; } };
export function loadSfx() {
  const ctx = audioCtx(); if (!ctx || loading) return loading;
  return (loading = Promise.all(SFX.map((n) => fetch(`${BASE}${n}.mp3?v=${VERSION}`).then((r) => r.arrayBuffer()).then((a) => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))).then((b) => { bufs.set(n, b); audible.set(n, audibleLength(b)); }).catch(() => {}))).then(() => { if (bufs.size < SFX.length) loading = null; })); // some failed (offline): try again on the next tap (bug hunt 2026-10-20)
}
// name: one of SFX. gain: 0–1 on top of the file’s own level. gap: skip if the same sound played less than gap ms ago.
// delay: seconds from now (scheduled on the audio clock, so it stays in time with animations).
// Sounds: Sevaan’s picks from the sound board (design/sound-board.html, 2026-10-18): mostly the original designed set
// ("old", scripts/sfx-synth.py / sfx-round.py), plus a few UI SFX cues (uisfx.com, CC0): lock zen snap, flip zen forward,
// seen zen select, stamp zen check, levelup zen streak, xp mechanical progress-step,
// secret soft wake, rattle zen drag-start. NORM is written by scripts/sfx-levels.py from each file’s measured
// loudness (EBU R128) and a target per event: payoffs loudest, taps and ticks quietest. Rerun it after changing a file.
const NORM = {"arrive": 1.2, "coinroll": 1.66, "collect": 1.14, "complete": 1.4, "flip": 1.24, "fossil": 2.6, "levelup": 1.58, "lock": 0.71, "mission": 1.11, "page": 3.35, "patch": 1.17, "plane": 1.01, "r_common": 0.95, "r_epic": 1.36, "r_legend": 1.32, "r_rare": 1.45, "r_uncommon": 0.95, "rankup": 1.26, "rattle": 1.35, "secret": 1.19, "seen": 1.93, "shiny": 2.4, "stamp": 2.32, "step": 1.74, "swipe": 1.78, "toast": 2.66, "toggle": 7.08, "ufo": 1.58, "welcome": 1.02, "xp": 0.61};
// At most two at once: a third small sound is skipped rather than piling on (a Saturn catch stacked four over 5 s).
const STINGERS = new Set(['r_common', 'r_uncommon', 'r_rare', 'r_epic', 'r_legend', 'shiny', 'rankup', 'levelup', 'mission', 'complete', 'secret', 'welcome']);
let playing = 0;
// How long each file is actually audible (2026-10-17 haptics playtest: the cap counted silent tails, e.g. lock is heard
// for 0.22 s of 1.05 s, so lock + collect filled both slots and the reveal’s whoosh was dropped). Measured once on load:
// the last sample louder than 2% of the file’s peak.
const audible = new Map();
function audibleLength(b) {
  const d = b.getChannelData(0); let peak = 0; for (let i = 0; i < d.length; i += 4) peak = Math.max(peak, Math.abs(d[i]));
  const th = peak * 0.02; let end = d.length - 1; while (end > 0 && Math.abs(d[end]) < th) end -= 8;
  return Math.max(0.05, end / b.sampleRate);
}
const UNCAPPED = new Set(['arrive']); // the reveal’s whoosh always plays
export function sfx(name, { gain = 1, gap = 0, delay = 0 } = {}) {
  if (soundOff() || document.hidden) return; // nothing to hear in the background, and audioCtx() would wake the suspended context (bug hunt 2026-10-22)
  const ctx = audioCtx(); if (!ctx) return;
  const b = bufs.get(name); if (!b) { loadSfx(); return; }
  const now = performance.now(); if (gap && now - (last.get(name) ?? -1e9) < gap) return; last.set(name, now);
  if (playing >= 2 && !STINGERS.has(name) && !UNCAPPED.has(name)) return;
  try { const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; g.gain.value = gain * (NORM[name] ?? 1) * LEVEL * sfxVolume(); src.connect(g).connect(ctx.destination); playing++; let freed = false; const free = () => { if (!freed) { freed = true; playing = Math.max(0, playing - 1); } }; src.onended = free; setTimeout(free, (delay + (audible.get(name) ?? b.duration)) * 1000 + 30); src.start(ctx.currentTime + delay); } catch {}
}
// Load on the first tap (the context can only start from one), so the first real sound is ready.
if (typeof document !== 'undefined') document.addEventListener('pointerdown', () => loadSfx(), { once: true, capture: true });

// A heartbeat thump (2026-10-21, slick idea 05): a low, soft beat drawn on the fly (no file), for the held breath before
// an Epic or Legendary card turns over. Follows the Sounds switch and volume like every other sound.
export function heartbeat(strong = false) {
  if (soundOff() || document.hidden) return; // nothing to hear in the background, and audioCtx() would wake the suspended context (bug hunt 2026-10-22)
  const ctx = audioCtx(); if (!ctx || ctx.state !== 'running') return;
  try {
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sine'; o.frequency.setValueAtTime(strong ? 68 : 60, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.16);
    f.type = 'lowpass'; f.frequency.value = 180;
    const peak = (strong ? 0.9 : 0.6) * LEVEL * 2.4 * sfxVolume();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(f).connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.25);
  } catch {}
}
