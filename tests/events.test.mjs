import test from 'node:test';
import assert from 'node:assert/strict';
import { activeEvent, nextEvent, eventBadges, passIcs } from '../js/events.js';

test('the Orionids are on around their peak, not a week before', () => {
  assert.equal(activeEvent(new Date(2026, 9, 21, 22).getTime())?.id, 'orionids-2026');
  assert.equal(activeEvent(new Date(2026, 9, 14, 22).getTime()), null);
  assert.equal(nextEvent(new Date(2026, 9, 14, 22).getTime())?.id, 'orionids-2026');
});
test('a sighting during a shower earns its badge once', () => {
  const t = new Date(2026, 11, 13, 23).getTime();
  assert.deepEqual(eventBadges([{ time: t }, { time: t + 3600e3 }]).map((b) => b.id), ['geminids-2026']);
});
test('pass reminders are calendar events with an alarm', () => {
  const ics = passIcs({ title: 'ISS passes over', start: Date.UTC(2026, 9, 6, 0, 41), end: Date.UTC(2026, 9, 6, 0, 46), description: 'Look W' });
  assert.match(ics, /BEGIN:VEVENT/); assert.match(ics, /TRIGGER:-PT10M/); assert.match(ics, /DTSTART:20261006T004100Z/);
});
