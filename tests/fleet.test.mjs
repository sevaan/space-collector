import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCards, cardKeyFor, stampKeyFor, sightingKeys, fleetLevel, stampsIn } from '../js/card-model.js';

const cat = {
  families: { STARLINK: { name: 'Starlink', maker: 'SpaceX', owner: 'US', stdMag: 5.8 } },
  objects: [
    { id: 25544, name: 'ISS (ZARYA)', type: 'station', kind: 'PAY', tier: 'legendary', launch: '1998-11-20', card: '25544' },
    { id: 50001, name: 'STARLINK-1', family: 'STARLINK', launch: '2024-02-01', card: 'STARLINK:2024-012', period: 95, incl: 53, apogee: 550, perigee: 540 },
    { id: 50002, name: 'STARLINK-2', family: 'STARLINK', launch: '2024-02-01', card: 'STARLINK:2024-012', period: 95, incl: 53, apogee: 550, perigee: 540 },
    { id: 40001, name: 'STARLINK-3', family: 'STARLINK', launch: '2019-05-24', card: 'STARLINK:2019-029', period: 95, incl: 53, apogee: 550, perigee: 540 },
  ],
};

test('fleet members belong to one fleet card; the launch is the stamp', () => {
  assert.equal(cardKeyFor(cat.objects[1]), 'STARLINK');
  assert.equal(stampKeyFor(cat.objects[1]), 'STARLINK:2024-012');
  assert.equal(cardKeyFor(cat.objects[0]), '25544');
  assert.equal(stampKeyFor(cat.objects[0]), null);
});

test('buildCards makes one Starlink card with its launches oldest first', () => {
  const cards = buildCards(cat);
  assert.equal(cards.length, 2);
  const fleet = cards.find((c) => c.key === 'STARLINK');
  assert.equal(fleet.name, 'Starlink');
  assert.deepEqual(fleet.launches.map((l) => [l.key, l.n]), [['STARLINK:2019-029', 1], ['STARLINK:2024-012', 2]]);
  assert.equal(fleet.members.length, 3);
  assert.equal(fleet.launch, '2019-05-24');
  assert.equal(fleet.set, 'mega');
});

test('old launch-keyed sightings read as fleet card + stamp', () => {
  assert.deepEqual(sightingKeys({ cardKey: 'STARLINK:2024-012', objectId: 50001 }), { cardKey: 'STARLINK', stampKey: 'STARLINK:2024-012' });
  assert.deepEqual(sightingKeys({ cardKey: 'STARLINK', stampKey: 'STARLINK:2024-012' }), { cardKey: 'STARLINK', stampKey: 'STARLINK:2024-012' });
  assert.deepEqual(sightingKeys({ cardKey: '25544', objectId: 25544 }), { cardKey: '25544', stampKey: null });
  assert.deepEqual(sightingKeys({ objectId: 25544 }), { cardKey: '25544', stampKey: null });
});

test('stamps count distinct launches, ignoring legacy practice sightings', () => {
  const s = [
    { cardKey: 'STARLINK:2024-012' }, { cardKey: 'STARLINK', stampKey: 'STARLINK:2024-012' },
    { cardKey: 'STARLINK', stampKey: 'STARLINK:2019-029' }, { cardKey: 'STARLINK', stampKey: 'STARLINK:2020-001', sim: true },
  ];
  assert.deepEqual([...stampsIn(s)].sort(), ['STARLINK:2019-029', 'STARLINK:2024-012']);
});

test('fleet levels: Starlink 1/10/50, smaller fleets 1/5/10', () => {
  assert.equal(fleetLevel('STARLINK', 0), 'none');
  assert.equal(fleetLevel('STARLINK', 1), 'bronze');
  assert.equal(fleetLevel('STARLINK', 9), 'bronze');
  assert.equal(fleetLevel('STARLINK', 10), 'silver');
  assert.equal(fleetLevel('STARLINK', 50), 'gold');
  assert.equal(fleetLevel('KUIPER', 5), 'silver');
  assert.equal(fleetLevel('KUIPER', 10), 'gold');
});
