// Sky events: the main annual meteor showers, each a time-limited event. Catch anything during a shower's
// peak nights to earn that year's badge (Logbook). Peak dates are the usual annual ones (International
// Meteor Organization calendar); the window runs from the evening before the peak to the morning after.
// No DOM.
const SHOWERS = [
  { id: 'quadrantids', name: 'Quadrantids', month: 1, day: 3, rate: 'up to 120 an hour, briefly' },
  { id: 'lyrids', name: 'Lyrids', month: 4, day: 22, rate: 'up to 18 an hour' },
  { id: 'etaaquariids', name: 'Eta Aquariids', month: 5, day: 6, rate: 'up to 50 an hour, best before dawn' },
  { id: 'perseids', name: 'Perseids', month: 8, day: 12, rate: 'up to 100 an hour' },
  { id: 'draconids', name: 'Draconids', month: 10, day: 8, rate: 'usually a few an hour, best in the evening' },
  { id: 'orionids', name: 'Orionids', month: 10, day: 21, rate: 'up to 20 an hour, from Halley\'s Comet' },
  { id: 'leonids', name: 'Leonids', month: 11, day: 17, rate: 'up to 15 an hour' },
  { id: 'geminids', name: 'Geminids', month: 12, day: 14, rate: 'up to 150 an hour, the best of the year' },
];
// Events around a time: [{ id: 'orionids-2026', name, start, end, rate }] for this year and next.
export function eventsAround(time = Date.now()) {
  const y = new Date(time).getFullYear(), out = [];
  for (const yr of [y - 1, y, y + 1]) for (const s of SHOWERS) {
    const peak = new Date(yr, s.month - 1, s.day, 12);
    out.push({ id: `${s.id}-${yr}`, name: `${s.name} ${yr}`, shower: s.name, rate: s.rate, start: peak.getTime() - 30 * 3600e3, end: peak.getTime() + 20 * 3600e3 });
  }
  return out.sort((a, b) => a.start - b.start);
}
export const activeEvent = (time = Date.now()) => eventsAround(time).find((e) => time >= e.start && time <= e.end) ?? null;
export const nextEvent = (time = Date.now()) => eventsAround(time).find((e) => e.start > time) ?? null;
// Event badges earned by sightings: [{ id, name }].
export function eventBadges(sightings) {
  const got = new Map();
  for (const s of sightings) { if (s.sim) continue; const e = activeEvent(s.time); if (e) got.set(e.id, e.name); }
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
