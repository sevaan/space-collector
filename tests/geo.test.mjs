import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeName } from '../js/geo.js';

test('placeName names land and sea', () => {
  for (const [lat, lon, want] of [[44.3, -78.3, 'North America'], [-1.3, 36.8, 'Africa'], [-23.5, -46.6, 'South America'], [48.9, 2.3, 'Europe'],
    [28.6, 77.2, 'Asia'], [-33.9, 151, 'Australia'], [35.7, 139.7, 'Japan'], [35, -40, 'the North Atlantic'], [20, -157, 'the North Pacific'],
    [-20, 80, 'the Indian Ocean'], [-30, -120, 'the South Pacific'], [-77.8, 166.7, 'Antarctica'], [89, 0, 'the Arctic Ocean'], [35, 18, 'the Mediterranean']])
    assert.equal(placeName(lat, lon), want, `${lat},${lon}`);
});
