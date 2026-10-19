// One Web Audio context for the page, shared by the music (js/music.js) and sound effects (js/sfx.js): iPhones
// allow only a few contexts, and one context means one volume world. The page's audio session is "ambient", so
// the ring/silent switch mutes everything and the player's own music keeps playing.
let ctx = null;
try { if (typeof navigator !== 'undefined' && navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch {}
export function audioCtx() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') ctx.resume().catch(() => {}); // iPhone reports 'interrupted' after the app was in the background
  return ctx;
}
