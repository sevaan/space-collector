// The game's sounds on the homepage: the same files and levels as the app (js/sfx.js LEVEL × NORM, js/music.js
// "Permafrost" at LEVEL × the 75% default, faded in over 4 s). Browsers only allow sound after a click or key, so
// everything waits for the first one. The speaker button turns it all off (remembered in localStorage 'siteSound').
const LEVEL = 0.25 * 0.75, NORM = { lock: 4.84, rattle: 1.35, ufo: 1.58, welcome: 1.02 }, MUSIC = 0.15 * 0.5;
let ctx = null, music = null, musicGain = null, unlocked = false, justUnlocked = false;
const bufs = {};
let on = (() => { try { return localStorage.getItem('siteSound') !== 'off'; } catch { return true; } })();

function load(name) {
  if (bufs[name] !== undefined) return;
  bufs[name] = null;
  fetch(`/home/audio/${name}.mp3`).then((r) => r.arrayBuffer()).then((a) => ctx.decodeAudioData(a)).then((b) => { bufs[name] = b; }).catch(() => {});
}

export function unlockAudio() {
  if (unlocked) return; unlocked = true; justUnlocked = true; setTimeout(() => { justUnlocked = false; }, 600);
  try { navigator.audioSession && (navigator.audioSession.type = 'ambient'); } catch {}
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  for (const n of Object.keys(NORM)) load(n);
  music = new Audio('/home/audio/permafrost.m4a'); music.loop = true; music.preload = 'auto'; music.crossOrigin = 'anonymous';
  musicGain = ctx.createGain(); musicGain.gain.value = 0;
  ctx.createMediaElementSource(music).connect(musicGain).connect(ctx.destination);
  if (on) startMusic();
  renderButton();
}

function startMusic() {
  if (!ctx) return;
  ctx.resume?.().catch?.(() => {}); music.play().catch(() => {});
  const t = ctx.currentTime; musicGain.gain.cancelScheduledValues(t); musicGain.gain.setValueAtTime(musicGain.gain.value, t); musicGain.gain.linearRampToValueAtTime(MUSIC, t + 4);
}
function stopMusic() {
  if (!ctx) return;
  const t = ctx.currentTime; musicGain.gain.cancelScheduledValues(t); musicGain.gain.setValueAtTime(musicGain.gain.value, t); musicGain.gain.linearRampToValueAtTime(0, t + 0.6);
  setTimeout(() => { if (!on) music.pause(); }, 700);
}

export function sfx(name, gain = 1) {
  if (!on || !ctx || !bufs[name] || document.hidden) return;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = bufs[name]; g.gain.value = LEVEL * (NORM[name] ?? 1) * gain;
  src.connect(g).connect(ctx.destination); src.start();
}

// Phones only count some touches as permission to play (iPhone: not a pointerdown; Android: not a scroll). Until the
// sound is really running, every later tap, click or key tries again.
export function wakeAudio() {
  if (!unlocked) return unlockAudio();
  if (!on || !ctx) return;
  if (ctx.state !== 'running' || (music && music.paused)) startMusic();
}
const btn = document.getElementById('sound');
function renderButton() {
  if (!btn) return;
  const live = on && unlocked;
  btn.setAttribute('aria-pressed', String(live));
  btn.querySelector('span').textContent = !unlocked ? 'Play sound' : on ? 'Sound on' : 'Sound off';
}
btn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (justUnlocked) { on = true; startMusic(); } else { on = !on; on ? startMusic() : stopMusic(); } // the first click just woke the sound: it means "on"
  try { localStorage.setItem('siteSound', on ? 'on' : 'off'); } catch {}
  renderButton();
});
document.addEventListener('visibilitychange', () => { if (!music || !on) return; if (document.hidden) music.pause(); else startMusic(); });
renderButton();
