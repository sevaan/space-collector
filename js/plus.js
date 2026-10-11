// Space Collector Plus (2026-10-11, design/plans.html). One switch, isPlus(), that every paid perk checks. The sky,
// every card, patches and missions are never behind it. Today it's only a testing toggle (Settings → Testing tools →
// "Plus (testing)", localStorage 'plusTest'); in the native apps RevenueCat will set it from the store purchase,
// keyed to the Firebase account. The web version is Sevaan's testing build only, so it never sells Plus.
const listeners = new Set();
export function isPlus() { try { return localStorage.getItem('plusTest') === '1'; } catch { return false; } }
export function setPlusForTesting(on) {
  try { localStorage.setItem('plusTest', on ? '1' : '0'); } catch {}
  for (const f of listeners) try { f(!!on); } catch {}
}
export function onPlus(f) { listeners.add(f); return () => listeners.delete(f); }
// What Plus adds, in the order the sheet lists them. `live` = built today (the rest say "coming").
export const PLUS_PERKS = [
  { icon: '🔔', name: 'Pass alerts', text: 'A heads-up on your phone before a bright or new pass.', live: true },
  { icon: '🔭', name: 'Binocular mode', text: 'Hundreds of fainter satellites to find and collect.', live: true },
  { icon: '📅', name: 'The week ahead', text: 'The next 7 nights of passes and weather, and the best night to go out.' },
  { icon: '📍', name: 'Saved places', text: 'Plan a trip: what\'s up over the cottage or a dark-sky site.' },
  { icon: '⏱', name: 'Widget and lock-screen countdown', text: '"ISS in 12 min · NW" without opening the app.' },
  { icon: '⌚', name: 'Apple Watch tap', text: 'A tap on the wrist as a pass rises.' },
  { icon: '✨', name: 'Shiny forecast', text: 'When the next eclipse or Moon shiny is possible.' },
  { icon: '📈', name: 'Observer stats', text: 'Your nights, places and rarest finds, and a yearly poster.' },
  { icon: '🎨', name: 'Card backs, foils and themes', text: 'New looks for your cards, patch wall and shares.' },
  { icon: '🎵', name: 'More music', text: 'Extra tracks for the night sky.' },
];
