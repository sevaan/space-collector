import test from 'node:test';
import assert from 'node:assert/strict';
// localize.js reads Settings and the phone's language: stub both.
const store = new Map(); globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
Object.defineProperty(globalThis, 'navigator', { value: { language: 'en-US' }, configurable: true });
const { localText } = await import('../js/localize.js');

test('imperial units in card text (2026-10-25)', () => {
  store.set('units', 'imperial'); store.set('clock', '12');
  assert.equal(localText('It flies at 28,000 km/h.'), 'It flies at 17,000 mph.');
  assert.equal(localText('about 800 km up'), 'about 500 mi up');
  assert.equal(localText('between 650 and 3,800 km'), 'between 400 and 2,400 mi');
  assert.equal(localText('It drifts about 3.8 cm farther away each year.'), 'It drifts about 1.5 inches farther away each year.');
  assert.equal(localText('an 8-tonne satellite'), 'an 8.8-ton satellite'); assert.equal(localText('about 8 tonnes'), 'about 8.8 tons');
  assert.equal(localText('~9,900 °C'), '~18,000 °F');
});
test('metric stays as written; US spelling; 24-hour hours', () => {
  store.set('units', 'metric'); store.set('clock', '24');
  assert.equal(localText('about 800 km up'), 'about 800 km up');
  assert.equal(localText('Its COLOUR is grey, near the centre.'), 'Its COLOR is gray, near the center.');
  assert.equal(localText('between 1 and 4 AM'), 'between 01:00 and 04:00');
  assert.equal(localText('between 5 and 9 PM'), 'between 17:00 and 21:00');
});
test('UK English keeps British spelling', () => {
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'en-GB' }, configurable: true });
  store.set('clock', '12');
  assert.equal(localText('Its colour, near the centre.'), 'Its colour, near the centre.');
  assert.equal(localText('between 1 and 4 AM'), 'between 1 and 4 AM');
});
