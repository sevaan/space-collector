// Background music (2026-10-10, Sevaan): "Permafrost" by Scott Buckley, released under CC BY 4.0 (credited in
// Settings; scottbuckley.com.au). A quiet bed under the night sky: it fades in after the first tap (browsers won't
// play sound before one), loops, dips under card reveals, and pauses when the app is hidden.
// iPhone Safari ignores an audio element's volume, so the level goes through Web Audio (a gain node). The page's
// audio session is "ambient", so the ring/silent switch mutes it and it never stops the player's own music.
import { audioCtx } from './audio-ctx.js?v=0.1.847';
const SRC = 'assets/audio/permafrost.m4a', LEVEL = 0.15; // halved 2026-10-11 (Sevaan)
let ctx = null, el = null, gain = null, playing = false;

export const musicVolume = () => { try { const v = parseFloat(localStorage.getItem('musicVol')); return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1; } catch { return 1; } };
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
      el = new Audio(SRC); el.loop = true; el.preload = 'auto';
      ctx = audioCtx(); if (!ctx) return;
      gain = ctx.createGain(); gain.gain.value = 0;
      ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
    }
    ctx.resume().catch(() => {});
    playing = true;
    el.play().then(() => fadeTo(level(), 4)).catch(() => { playing = false; });
  } catch { playing = false; }
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
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { wasPlaying = playing; stopMusic(0.3); }
  else if (wasPlaying && musicOn()) { wasPlaying = false; startMusic(); }
});
