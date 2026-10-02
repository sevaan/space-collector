# Space Collector

Point your phone at a moving light in the night sky, see what it is, tap to capture it.
Long-term it's a Pokémon-style collecting game; right now it's ONLY the point-and-capture loop.

Live: https://sevaan.github.io/space-collector/ (GitHub Pages, deploys from `main`, ~1 min)

## Workflow (Sevaan often edits from his phone and tests under the real sky)
- Plain HTML/CSS/ES modules. No build step, no bundler, no npm install. Keep it that way.
- **Before every commit:** `node scripts/bump.mjs` — bumps `js/version.js` and `version.json`, and
  stamps `?v=VERSION` onto every relative import in `js/*.js` and every js/css reference in `*.html`
  (cache-busting; GitHub Pages caches files for 10 min). New imports get stamped on the next bump.
- Satellite data: `node scripts/build-catalog.mjs` writes `data/catalog.json` (~16k objects, ~4.7k cards):
  every tracked object with perigee < 2000 km whose best-case magnitude is ≤ 8 (≤ 5 naked eye, 5–8
  flagged `bino`). Pulls CelesTrak SATCAT + elements per launch year (~72 requests, cached 12 h in
  scripts/.cache). Elements are JSON/OMM (`el` array, rebuilt with `json2satrec` in js/orbit.js), never TLE:
  catalogue numbers passed 69999 in July 2026 and TLE silently dropped every newer object. `.github/workflows/catalog.yml` reruns it daily at 09:17 UTC and commits if changed.
  Fleet cards (2026-09-30, design/fleet-options.html "mix"): Starlink/OneWeb/Qianfan/Kuiper are ONE card
  each (key = family id); each launch (`o.card` = `FAMILY:YYYY-NNN` in the catalogue) is a stamp on it.
  js/card-model.js owns the mapping: `cardKeyFor`, `stampKeyFor`, `sightingKeys` (old sightings saved with
  cardKey = launch key are read as card + stamp, never rewritten). Fleet levels count stamps: Starlink
  1/10/50, others 1/5/10. An unstamped launch counts as "new" in the sky (label "New stamp").
- Sky view uses `SkyModel` (js/orbit.js): sweeps the catalogue in slices, interpolates 1 s samples.
  Don't loop the full catalogue per frame.
- Local preview: `python3 -m http.server 8765`, then open http://localhost:8765 and use More → Testing
  tools → "Jump to next visible pass" + drag mode to test during the day.
- No practice mode (Sevaan removed it 2026-09-29): every capture counts. Legacy `sim: true` records stay
  hidden. Time travel lives only in More → Testing tools. "Find a visible pass" reports when/where, no jump.
- Card viewer: the card owns touch (touch-action: none) and phone tilt is always on (iOS permission is
  asked from the tap that opens a card). A finger on the card overrides tilt.

## Layout
- `js/orbit.js` – SGP4 propagation (vendored satellite.js 6.0.2 in `js/lib/`), visibility (sunlit +
  dark sky + brightness), magnitude estimate, pass search. No DOM, keep it portable (Capacitor later).
- `js/sensors.js` – DeviceOrientation → camera basis (right/up/back in East-North-Up). iOS uses
  `webkitCompassHeading` to fix alpha's arbitrary zero via a smoothed heading offset, calibrated ONLY
  while the phone is upright (iOS flips the reading ~180° when tipped overhead, which spun the sky).
  Sudden big disagreements are ignored unless they persist ~1.5 s. Tests: `node --test tests/`.
- `js/celestial.js` – stars/constellations (from `data/sky.json`, built by `scripts/build-sky.mjs`
  from d3-celestial), plus Sun, Moon (with phase) and planets via Schlyter's low-precision formulas.
- `js/sky.js` – canvas renderer, gnomonic projection centred on the reticle. Two themes: `glass`
  (default, navy/gold/cyan, based on Sevaan's mockup: Milky Way glow, tree line, beaded paths,
  sparkle reticle) and `night` (all red). UI chrome in `index.html` + `css/app.css` (body.night).
- Target UI (chosen 2026-09-29): never-collected object lined up → no card, the reticle glows gold,
  name above, "TAP TO COLLECT" below, tap the circle (`#discover`). Already collected → a toast at the
  bottom (`#target`) saying what it is, with View: the card spins out of the toast in place
  (`playView` in js/reveal.js). If it's in the circle and not logged this pass (natural objects: tonight),
  View also records a sighting (SEEN n× stamp, levels). No Collect button for owned objects (2026-10-02). Off target both just show a turn hint. No "line up" button.
- Top-left radar (`#radar`, drawn in `updateCompass`): heading-up all-sky map + compass + "N up · N new"
  tab; tap opens the visible list. Replaced the compass, the visible-now pill and the status text.
- `js/main.js` – app state, render loop, candidates/capture, settings panel. No journal (removed
  2026-09-29): the collection is the record. Cards show when you collected them; the card viewer
  lists each sighting (when, where) with delete.
- `js/store.js` – IndexedDB sighting log.
- Cards (NASA data-sheet style, chosen 2026-09-29; no paper texture): `cards.html` + `js/cards-page.js`
  (gallery), `js/card.js` (render + tilt), `css/cards.css` (layout + rarity shine), `js/art.js` (flat
  navy art per object type). `js/rarity.js` = tier rules (run at catalogue build). `js/sets.js` = set
  rules, primary set sets the colour bar + card number. `js/lore.js` = titles/facts: `data/lore.json`
  hand-written first, then rocket-family facts, then computed facts. Every fact must be TRUE: computed facts
  only state today's catalogue data (orbit, launch date/site) or date comparisons, never lifetime laps or
  distance; speed only for near-circular orbits; family facts can be limited by object kind.
  tests/facts.test.mjs checks every card in the real catalogue.
  `data/series.json` = researched programme facts (mostly Kosmos: Strela, Parus, US-A, Tselina…) with the
  NORAD ids in each, from Gunter's Space Page series pages (source URL per series). Order of facts:
  lore.json (hand, with `source`) → series.json → lore.js FAMILY → computed.
- `design/` – style boards used to pick the card look. Not part of the app.

- Capture reveal (`js/reveal.js` + `css/reveal.css`, from `design/reveal-demo.html`): first sighting =
  object rushes in, sealed card glowing in rarity colour, tap to flip, sweep, FIRST SIGHTING stamp;
  repeat = card flies in face-up with SEEN n× stamp (+ level-up at 5/25). Scales with rarity. Faces
  are swapped by JS at the flip midpoint (Safari ignores backface-visibility here). Waits use timers,
  never animation.finished. Test Safari with Playwright WebKit (see scratchpad scripts), not just Chrome.

- Natural cards (2026-09-30): `js/natural.js` = Moon, 5 naked-eye planets, 21 brightest stars (facts must
  stay true; approximate values marked ~). Sets "The Wanderers" and "Bright Stars". They join the reticle
  candidates in `tick` (behind satellites), drawn by the sky view itself (`naturalTarget` marks them).
  Visible: Moon above horizon and not new (daylight OK); planets el > 2° with Sun < −3°; stars el > 3°
  with Sun < −6°. Collectable once per observing night.
- Levels count observing nights (local noon→noon by the sighting's longitude, `nightKey` in
  js/observation.js): bronze 1, silver 3, gold 10. Silver/gold earned under the old sightings rule
  (5/25, before 2026-10-01) are kept (`cardLevel` in js/card.js). Fleet cards count stamps instead.

- "Just a plane" (js/planes.js): live aircraft from adsb.lol via the relay `relay/handler.ts`, deployed as a
  Val Town HTTP val (URL in `RELAY`; Deno Deploy signups were closed). The relay only answers
  sevaan.github.io and localhost. Routes from adsbdb.com (CORS-open). If the relay changes, paste
  relay/handler.ts into a new val and update `RELAY`.

## Deliberately out of scope for now
Alerts, service worker, accounts, secret sets/feats.
