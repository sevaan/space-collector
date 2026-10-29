// Background music (2026-10-10, Sevaan): "Permafrost" by Scott Buckley, released under CC BY 4.0 (credited in
// Settings; scottbuckley.com.au). A quiet bed under the night sky: it fades in after the first tap (browsers won’t
// play sound before one), loops, dips under card reveals, and pauses when the app is hidden.
// iPhone Safari ignores an audio element’s volume, so the level goes through Web Audio (a gain node). The page’s
// audio session is "ambient", so the ring/silent switch mutes it and it never stops the player’s own music.
import { audioCtx } from './audio-ctx.js?v=0.1.1321';
const SRC = 'assets/audio/permafrost.m4a', LEVEL = 0.15; // halved 2026-10-11 (Sevaan)
let ctx = null, el = null, gain = null, node = null, playing = false;

export const musicVolume = () => { try { const v = parseFloat(localStorage.getItem('musicVol')); return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.25; } catch { return 0.25; } } /* 25% by default (2026-10-28, Sevaan) */; // default 50% (2026-10-19, Sevaan; was 75%)
const level = () => LEVEL * musicVolume();
// Settings slider: save and glide to the new level.
export function setMusicVolume(v) { try { localStorage.setItem('musicVol', String(v)); } catch {} if (playing) fadeTo(level(), 0.15); }
export const musicOn = () => { try { return localStorage.getItem('music') !== '0'; } catch { return true; } };

function fadeTo(v, s) {
  if (!gain) return;
  const t = ctx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(v, t + s);
}
// Call from a user gesture (a tap): makes and unlocks the audio on first use.
export function startMusic() {
  if (!musicOn() || playing) return;
  try {
    if (!el) {
      ctx = audioCtx(); if (!ctx) return;
      gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
      fresh();
    }
    playing = true;
    // The element only plays once the context is really running (2026-10-20, Sevaan: back in the app the music was
    // "stuck on a loop": iPhone's media-element source repeats its last chunk while the context is still interrupted).
    // play() stays inside the tap (Safari needs that); the level stays at 0 until the context is running.
    gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setValueAtTime(0, ctx.currentTime);
    el.play().then(() => running()).then((ok) => { if (!playing) return; if (ok) fadeTo(level(), 4); else { playing = false; el.pause(); retryOnTouch(); } })
      .catch(() => { playing = false; retryOnTouch(); });
  } catch { playing = false; }
}
// The element and its source node (once; a second element for the same file never loaded in testing).
function fresh() {
  const at = el ? el.currentTime : 0;
  try { el?.pause(); node?.disconnect(); } catch {}
  el = new Audio(SRC); el.loop = true; el.preload = 'auto';
  if (at) el.addEventListener('loadedmetadata', () => { try { el.currentTime = at; } catch {} }, { once: true });
  node = ctx.createMediaElementSource(el); node.connect(gain);
}
// Resume the shared context and say whether it's running (up to 1.2 s).
function running() {
  if (!ctx) return Promise.resolve(false);
  if (ctx.state === 'running') return Promise.resolve(true);
  return Promise.race([ctx.resume().then(() => ctx.state === 'running', () => false), new Promise((r) => setTimeout(() => r(ctx.state === 'running'), 1200))]);
}
export function stopMusic(fade = 0.8) {
  if (!el || !playing) return;
  playing = false; fadeTo(0, fade);
  setTimeout(() => { if (!playing) el.pause(); }, fade * 1000 + 60);
}
export function setMusic(on) {
  try { localStorage.setItem('music', on ? '1' : '0'); } catch {}
  if (on) startMusic(); else stopMusic();
}
// Dip under a card reveal so its sounds land, then come back.
export function duckMusic(down) { if (playing) fadeTo(down ? level() * 0.35 : level(), down ? 0.4 : 1.5); }

let wasPlaying = false;
// Coming back to the app: iPhone often refuses to restart audio until the next touch (the context comes back
// "interrupted"/suspended, and play() can be rejected), so the music stayed silent (2026-10-19, Sevaan). Try at once,
// and if it isn’t really running half a second later, try again on the first touch. Sound effects share this context,
// so they come back too.
function wakeAudio() {
  if (!musicOn()) return;
  try { ctx?.resume().catch(() => {}); } catch {}
  if (el && el.paused) { playing = false; startMusic(); }
}
let retrying = false;
function retryOnTouch() {
  if (retrying) return; retrying = true;
  const go = () => { retrying = false; ['touchend', 'pointerdown', 'click'].forEach((t) => removeEventListener(t, go, true)); wakeAudio(); };
  ['touchend', 'pointerdown', 'click'].forEach((t) => addEventListener(t, go, { capture: true, passive: true }));
}
// Leaving and coming back. Pause at once (2026-10-20, iOS playtest: the fade's pause timer never ran once the app was
// hidden, so the music kept playing from a locked phone). Both the page's visibility and the native app's active state
// (Control Center, a notification, the app switcher) come here, so the element is never left playing into a suspended
// context, which is what replayed the same chunk on return (2026-10-20, Sevaan: "stuck on a loop").
let away = false;
export function musicAway(hidden) {
  // A quick fade, never a hard cut (2026-10-21, Sevaan: a beep/click on swiping out of the app was the gain jumping to 0
  // mid-wave); the element pauses once it's silent.
  if (hidden) { if (away) return; away = true; wasPlaying = wasPlaying || playing; playing = false;
    try { if (gain && ctx) { const t = ctx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0, t + 0.03); } } catch {}
    // Then stop the audio ourselves, while the page still runs (2026-10-21, Sevaan: the beep came back on the website).
    // If iPhone cuts a playing context when the page is frozen, its last few milliseconds of sound repeat as a short
    // tone; a context we've already suspended has nothing left to repeat. Coming back resumes it (startMusic/audioCtx).
    setTimeout(() => { if (!away) return; try { el?.pause(); } catch {} try { if (ctx?.state === 'running') ctx.suspend().catch(() => {}); } catch {} }, 40); return; }
  if (!away) return; away = false;
  if (!wasPlaying || !musicOn()) return;
  wasPlaying = false; startMusic();
}
document.addEventListener('visibilitychange', () => musicAway(document.hidden));
