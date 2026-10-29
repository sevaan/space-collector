// Sky events: the main annual meteor showers, each a time-limited event. Catch anything during a shower’s
// peak nights to earn that year’s badge (Logbook). Peak dates are the usual annual ones (International
// Meteor Organization calendar); the window runs from the evening before the peak to the morning after.
// No DOM.
import { SKY_EVENTS } from './sky-events-data.js?v=0.1.1309';
const SHOWERS = [
  { id: 'quadrantids', name: 'Quadrantids', month: 1, day: 3, rate: 'up to 80 an hour, in a short peak' },
  { id: 'lyrids', name: 'Lyrids', month: 4, day: 22, rate: 'up to 18 an hour' },
  { id: 'etaaquariids', name: 'Eta Aquariids', month: 5, day: 6, rate: 'up to 50 an hour, best before dawn' },
  { id: 'perseids', name: 'Perseids', month: 8, day: 12, rate: 'up to 100 an hour' },
  { id: 'draconids', name: 'Draconids', month: 10, day: 8, rate: 'usually a few an hour, best in the evening' },
  { id: 'orionids', name: 'Orionids', month: 10, day: 21, rate: 'up to 20 an hour, from Halley’s Comet' },
  { id: 'leonids', name: 'Leonids', month: 11, day: 17, rate: 'up to 15 an hour' },
  { id: 'geminids', name: 'Geminids', month: 12, day: 14, rate: 'up to 150 an hour, the best of the year' },
];
// Events around a time: [{ id: 'orionids-2026', kind: 'shower', name, start, end, rate }] for this year and next, plus
// the one-night sky events (2026-10-25, Sevaan: fill the gaps between showers; js/sky-events-data.js, written by
// scripts/build-sky-events.mjs): a planet at its brightest, the Moon meeting a planet, supermoons, solstices and
// equinoxes, lunar eclipses. A sky event runs noon to noon over the night of its date, in the player's own time zone.
let cache = { y: null, list: null };
export function eventsAround(time = Date.now()) {
  const y = new Date(time).getFullYear(); if (cache.y === y) return cache.list;
  const out = [];
  for (const yr of [y - 1, y, y + 1]) for (const s of SHOWERS) {
    const peak = new Date(yr, s.month - 1, s.day, 12);
    out.push({ id: `${s.id}-${yr}`, kind: 'shower', name: `${s.name} ${yr}`, shower: s.name, rate: s.rate, peak: peak.getTime(), day: peak.getTime(), start: peak.getTime() - 30 * 3600e3, end: peak.getTime() + 20 * 3600e3 });
  }
  for (const e of SKY_EVENTS) { const [yy, mm, dd] = e.date.split('-').map(Number); if (Math.abs(yy - y) > 1) continue;
    const start = new Date(yy, mm - 1, dd, 12).getTime();
    out.push({ id: `${e.id}-${e.date}`, kind: e.kind, name: e.name, text: e.text, body: e.body ?? null, peak: start + 12 * 3600e3, day: start, start, end: start + 24 * 3600e3 }); }
  // A shower and a sky event on the same night: the shower wins (it has the better story and the shooting star).
  const list = out.sort((a, b) => a.start - b.start).filter((e, i, all) => e.kind === 'shower' || !all.some((o) => o.kind === 'shower' && o.start < e.end && e.start < o.end));
  cache = { y, list }; return list;
}
export const activeEvent = (time = Date.now()) => eventsAround(time).find((e) => time >= e.start && time <= e.end) ?? null;
export const nextEvent = (time = Date.now()) => eventsAround(time).find((e) => e.start > time) ?? null;
export const activeShower = (time = Date.now()) => eventsAround(time).find((e) => e.kind === 'shower' && time >= e.start && time <= e.end) ?? null;
export const nextShower = (time = Date.now()) => eventsAround(time).find((e) => e.kind === 'shower' && e.start > time) ?? null;
// One line for any event: a shower's rate, or the sky event's own words.
export const eventLine = (e) => (e?.kind === 'shower' ? `${e.rate[0].toUpperCase()}${e.rate.slice(1)}. Collect any card to earn its badge.` : e?.text ?? '');
// A meteor-shower badge is for a night sighting (2026-10-08, Sevaan earned the Draconids badge with the Sun at noon):
// not the Sun, and between 6 pm and 7 am local time.
export const countsForEvent = (s) => !s.sim && s.cardKey !== 'sun' && s.objectId !== 'sun' && ((h) => h >= 18 || h < 7)(new Date(s.time).getHours());
// A sky event about one body (a planet at its brightest, a supermoon, an eclipse) needs that body caught; the rest any card.
const bodyOk = (e, s) => !e.body || (Array.isArray(e.body) ? e.body : [e.body]).includes(s.cardKey);
export const eventOf = (s) => { if (!countsForEvent(s)) return null; const e = activeEvent(s.time); return e && bodyOk(e, s) ? e : null; };
// Event badges earned by sightings: [{ id, name }].
export function eventBadges(sightings) {
  const got = new Map();
  for (const s of sightings) { const e = eventOf(s); if (e) got.set(e.id, e.name); }
  return [...got].map(([id, name]) => ({ id, name }));
}

// A calendar reminder (.ics) for a pass: an event at the pass with an alarm 10 minutes before.
export function passIcs({ title, start, end, description }) {
  const fmt = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (t) => String(t).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Space Collector//EN', 'BEGIN:VEVENT', `UID:${start}-${Math.random().toString(36).slice(2)}@space-collector`,
    `DTSTAMP:${fmt(Date.now())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(Math.max(end, start + 120000))}`, `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(description)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT10M', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
