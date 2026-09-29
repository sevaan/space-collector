# Space Collector

Point your phone at a moving light in the night sky, see what it is, tap to capture it.
Long-term it's a Pokémon-style collecting game; right now it's ONLY the point-and-capture loop.

Live: https://sevaan.github.io/space-collector/ (GitHub Pages, deploys from `main`, ~1 min)

## Workflow (Sevaan often edits from his phone and tests under the real sky)
- Plain HTML/CSS/ES modules. No build step, no bundler, no npm install. Keep it that way.
- **Before every commit:** `node scripts/bump.mjs` — bumps `js/version.js` and `version.json`.
  The version shows bottom-right in the app, and the app banners when a newer build is deployed.
- Refresh satellite data: `node scripts/build-catalog.mjs` (writes `data/catalog.json`). Orbital
  elements go stale after about a week; positions drift. Don't hit CelesTrak more than a few times a day.
- Local preview: `python3 -m http.server 8765`, then open http://localhost:8765 and use ⚙ → "Jump to
  next visible pass" + drag mode to test during the day.

## Layout
- `js/orbit.js` – SGP4 propagation (vendored satellite.js 6.0.2 in `js/lib/`), visibility (sunlit +
  dark sky + brightness), magnitude estimate, pass search. No DOM, keep it portable (Capacitor later).
- `js/sensors.js` – DeviceOrientation → camera basis (right/up/back in East-North-Up). iOS uses
  `webkitCompassHeading` to fix alpha's arbitrary zero via a smoothed heading offset.
- `js/celestial.js` – stars/constellations (from `data/sky.json`, built by `scripts/build-sky.mjs`
  from d3-celestial), plus Sun, Moon (with phase) and planets via Schlyter's low-precision formulas.
- `js/sky.js` – canvas renderer, gnomonic projection centred on the reticle.
- `js/main.js` – app state, render loop, candidates/capture, sim panel, sighting log.
- `js/store.js` – IndexedDB sighting log.

## Deliberately out of scope for now
Collections, rarity, sets, cards/lore, alerts, service worker, accounts, daily data cron.
