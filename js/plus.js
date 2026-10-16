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
// What Plus adds, in the order the Plus card lists them (2026-10-16, design/plus-sheet-card.html). `why` = the openPlus
// reason that leads with it (its label turns orange on the card).
export const PLUS_PERKS = [
  { why: 'reminders', name: 'Pass reminders', text: 'Alerts for any pass you choose.' },
  { why: 'rare', name: 'Rare alerts', text: 'A ping when a new Rare card passes.' },
  { why: 'shiny', name: 'Shiny forecast', text: 'When and where a Shiny can happen.' },
  { why: 'backs', name: 'Card backs', text: '6 designs, or a random one each flip.' },
  { why: 'patch', name: 'Member patch', text: 'Only Plus members wear this one.' },
];
// Prices (2026-10-16, Sevaan). The yearly plan has the 7-day free trial; all three are shared with Family Sharing.
export const PLUS_PRICES = [
  { id: 'month', label: 'Month', price: '$1.99', note: '' },
  { id: 'year', label: 'Year', price: '$9.99', note: 'Best value', trial: 7 },
  { id: 'once', label: 'Forever', price: '$24.99', note: 'One time' },
];
