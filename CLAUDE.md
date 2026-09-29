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
  scripts/.cache). `.github/workflows/catalog.yml` reruns it daily at 09:17 UTC and commits if changed.
  Starlink/OneWeb/Qianfan/Kuiper satellites share one card per launch (`card` = `FAMILY:YYYY-NNN`).
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
  `webkitCompassHeading` to fix alpha's arbitrary zero via a smoothed heading offset.
- `js/celestial.js` – stars/constellations (from `data/sky.json`, built by `scripts/build-sky.mjs`
  from d3-celestial), plus Sun, Moon (with phase) and planets via Schlyter's low-precision formulas.
- `js/sky.js` – canvas renderer, gnomonic projection centred on the reticle. Two themes: `glass`
  (default, navy/gold/cyan, based on Sevaan's mockup: Milky Way glow, tree line, beaded paths,
  sparkle reticle) and `night` (all red). UI chrome in `index.html` + `css/app.css` (body.night).
- `js/main.js` – app state, render loop, candidates/capture, sim panel, sighting log.
- `js/store.js` – IndexedDB sighting log.
- Cards (NASA data-sheet style, chosen 2026-09-29; no paper texture): `cards.html` + `js/cards-page.js`
  (gallery), `js/card.js` (render + tilt), `css/cards.css` (layout + rarity shine), `js/art.js` (flat
  navy art per object type). `js/rarity.js` = tier rules (run at catalogue build). `js/sets.js` = set
  rules, primary set sets the colour bar + card number. `js/lore.js` = titles/facts: `data/lore.json`
  hand-written first, then rocket-family facts, then computed facts. Every fact must be true.
- `design/` – style boards used to pick the card look. Not part of the app.

## Deliberately out of scope for now
Alerts, service worker, accounts, capture reveal animation, secret sets/feats.
