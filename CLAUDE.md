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
  Fleet cards (2026-09-30, design/fleet-options.html "mix"): Starlink/OneWeb/Qianfan/Amazon Leo (family id KUIPER; renamed from Project Kuiper) are ONE card
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
- Card feel (2026-10-02, after poke-holo.simey.me, written from scratch since that repo is GPL): tilt/glare/
  foil run on a spring in `attachTilt` (js/card.js) feeding --rx/--ry/--mx/--my/--bgx/--bgy/--hyp/--o;
  foils per rarity in css/cards.css (glitter = SVG noise data URIs). Collection "closer look": tile →
  card spins a full turn into view, `.card__back` shows mid-spin; Done spins it back (js/cards-page.js).

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
  (default, retro ink/cream/orange with steel-blue chart lines, quieter Milky Way,
  tree line, dashed orbital paths and an indexed double-ring reticle) and `night` (all red). UI chrome in `index.html` + `css/app.css` (body.night).
- Target UI (chosen 2026-09-29): never-collected object lined up → no card, the reticle turns orange,
  name above, "TAP TO COLLECT" below, tap the circle or the orange collect button (`#discover`). Already collected → a toast at the
  bottom (`#target`) saying what it is, with View: the card spins out of the toast in place
  (`playView` in js/reveal.js). If it's in the circle and not logged this pass (natural objects: tonight),
  View also records a sighting (SEEN n× stamp, levels). No Collect button for owned objects (2026-10-02).
  The whole mini card is the button (no View button); × closes it (unpins a selection, or hides it until
  you point at something else).
- Selecting: tap an object in the sky (`tapSky`, hit test from `sky.hits` + natural targets) or a row in
  Visible now (radar) to pin it; guidance shows which way to turn. Tap empty sky to let go. Off target both just show a turn hint. No "line up" button.
- Top-left radar (`#radar`, drawn in `updateCompass`): the "heat radar" (2026-10-02, design/radar-compact-
  options.html #1): 96 px heading-up all-sky map where each visible object is a soft glow (one sprite
  stamped per object), only Epic/Legendary get dots, steel-blue ring on the target; "N up · N new" chip to the
  right. Tap opens the visible list. Planes are no longer drawn on it.
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
  lore.json (hand, with `source`) → series.json → lore.js FAMILY → purpose (lore.js PURPOSE by name family, then
  data/purpose.json from the UCS Satellite Database, built by `python3 scripts/import-ucs.py <UCS txt>`) → computed.
  Long facts shrink the art window by one fact line per line past three (`--fact-extra`), keeping cards one height.
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
  The plane in the circle shows its path like a satellite (`planePath` in js/planes.js: straight along track
  and climb, last 60 s faint, next 120 s red dashes; `drawPlaneTrail` in js/sky.js). Plane icon is a swept-wing
  silhouette rotated to its on-screen direction of travel.

- Card backs (2026-10-05): six retro posters from Desktop/cardbacks (EPS, Illustrator, font Jockey One) with
  their titles replaced by SPACE COLLECTOR (same font, colour, stretch; lorem line removed), as 900 px WebP in
  assets/art/backs/. `js/card-backs.js` picks a random one each time (never twice in a row) for the reveal's
  sealed card and the collection spin; posters with a bottom title move TAP TO REVEAL to the top.
  The sealed card tilts and shimmers (glare + rainbow/glitter holo, .rv-holo/.rv-glare) via attachTilt on
  #rv-holder (not the rotating back itself, or the pointer 'leaves' as it tilts); stops when it flips.
  Full-size PNGs: Desktop/cardbacks/space-collector/.

- Card face RETRO (2026-10-05, Sevaan's space-collector-template-v2(1).zip): `card--retro` / `card-tile--retro`,
  navy stock, cream ink, burnt-orange accents, silver double frame, fonts in fonts/ (Russo One display,
  Barlow Condensed labels, OFL). Ported onto the V2 code below (kept: temp art, flip, holo backs, fleet
  compaction, stat fit/units). Superseded V2 notes:
- Card face V2 (2026-10-05, from Sevaan's space-collector-template-v2.zip): `card--v2` layout in js/card.js +
  css/cards.css. Rarity in the coloured header, title + type + NORAD, EMPTY art window (`[data-art-slot]`,
  for artwork to come; art.js is no longer used by cards, only by the sky toast thumbnail), three stats
  (launch stat shows "N years ago"), fact, footer with collected date. No set numbers, night counts or
  natural-object distance line. Frame: gold for Legendary, silver otherwise (our override at the end of
  cards.css, since old level colours won on specificity). Gallery tiles also have empty art.

- Card backs everywhere share `.back-holo`/`.back-glare` (cards.css), driven by the tilt vars of an
  ancestor. Double-tap / double-click any full card to flip it to a random poster back and back again
  (`attachFlip` in js/card.js; used in the collection viewer, the reveal and the sky's View card).
  Fleet cards: `card--fleet` (short art window, 36-col dot grid, "N / M stamped" between the years).

## Deliberately out of scope for now
Alerts, service worker, accounts, secret sets/feats.

- Card illustrations (2026-10-05): one image per kind of object, not per card. js/art-keys.js maps every card
  to an art file (`artFileFor`; catch-all kinds have numbered variations picked by NORAD id). Images live in
  assets/art/cards/<file>.webp (+ sm/ for gallery tiles) and are listed in js/art-files.js; both are written by
  `python3 scripts/import-art.py <folder of PNGs>`. Cards show the image once revealed (`artImage` in
  js/card.js); without one, or before collecting, the drawn art from js/art.js is used. Art is generated with
  Nano Banana 2 (gemini-3.1-flash-image) on Vertex AI, project space-collector-510722 (post-paid, gcloud login
  sevaan@gmail.com), poster style + a card back + curated references (~/Documents/Space Collector art references).
- Reveal: once the card has landed, dragging only tilts it (Sevaan disliked drag-to-throw); a quick upward flick throws it off the top and returns to the sky (`onRevealDismiss`, velocity check in js/reveal.js).
- Capture stamps (2026-10-05): a NEW card only gets a stamp at collection milestones (`MILESTONES` in js/reveal.js: 1 = "FIRST ITEM COLLECTED", then 10, 25, 50, 75, 100, 200 … 1000 "N ITEMS COLLECTED"); repeat sightings keep SEEN n× / NEW STAMP / level-up stamps. Front holo was toned down about a third (backs unchanged).
- What you can see (2026-10-05): js/sky-limit.js turns your sky (Settings → "Your sky": city / suburbs (default) /
  countryside / dark site, saved as localStorage `sky`; state field `lightSky`, NOT `state.sky`, which is the star
  catalogue) plus twilight and the Moon into a limiting magnitude (sky brightness → NELM; satellites 0.5 mag harder,
  binoculars +3). `updateSkyLimit` in main.js recomputes it each tick and calls `setSkyLimit` (js/orbit.js); `look()`
  adds atmospheric extinction by elevation to `mag`. Starlink stdMag is per object: 5.0 if launched < 60 days ago or
  perigee < 420 km (bright trains), else 6.8 (darkened/visored, Mallama et al.). An automatic light-pollution lookup by
  location is not built yet (needs a dataset whose licence fits).
- Card back (2026-10-05): ONE back now, Sevaan's Space Collector seal (assets/art/backs/back-collector.webp, trimmed of its light-blue outer band so the rarity-coloured frame shows; original kept in the session scratchpad). js/card-backs.js still supports a list; the six posters (back-navy-1..6) are no longer used.

- Explorer RETRO (2026-10-05): UI reuses the card fonts (Russo One + Barlow Condensed), cream ink,
  orange actions and steel/cream fine rules. Inset two-part Explore/Collection navigation; radar and
  reticle echo the card-back orbital dial. `#hud` has explicit viewport bounds, with pointer events
  only on interactive controls so the sky remains draggable. Discovery labels center in the viewport;
  `d-actions` groups Collect and candidate switching side by side for small phones. Sky label collision
  reserves this area. Nav insets are measured from the rendered nav. Night mode keeps radar rarity dots
  and discovery labels red. Welcome and owned-object previews use the new card art with SVG fallback.
  Card faces, tilt, foil, flip/reveal sequencing and the six-degree capture rule are unchanged.
- Card art stars twinkle (2026-10-05): scripts/import-art.py finds small bright stars in each picture's sky and
  writes them to js/art-files.js `ART_STARS` ({r: width/height, s: [[x,y] fractions]}); `artStars` in js/card.js
  adds sparkles on them in a layer that mimics object-fit: cover (container query units). Full cards only.
- Repeat sightings log themselves (2026-10-05): an owned object held in the circle for 1.2 s while visible is logged
  once per pass (natural objects once a night) by `autoLog` in js/main.js, with a toast (level-ups called out).
  Tapping the mini card no longer needs to be what logs it.
- Collection viewer: no "Collected <date>" line under the card (the card shows it); flick the card up to close.
- Card footer shows "SEEN N TIME(S)" after the collected date (`card__seen-count`; NOT `.card__seen`, an old boxed style). Settings → Pointing → "Snap the circle onto what you're aiming at" (pref `snap`, default on; `sky.snap` in `updateRing`).
- Switcher (2026-10-05, design/switcher-options.html C): small dark pill, text only, centred at the bottom of both pages (#nav in css/app.css, .bottom-nav in css/collection.css); active tab glows faintly orange. --nav-h is 70px.
- Sky HUD (2026-10-05, design/count-options.html C): new-object count is an orange badge on the radar's rim (#radar-new, hidden at 0), "N up" sits under the dial (#radar-up). "2 of 2" (#d-switch) is small and centred under Tap to collect. Card glare is a faint finger highlight only (no dark falloff).
- Capture reveal: the sealed card flips by itself after 1 s (tap flips sooner); no TAP TO REVEAL pill. Collection viewer has a twinkling starfield behind it and grid tiles tilt slightly under the finger (js/starfield.js: `addStarfield`, `attachTileTilt`; transform only).
- Constellations (2026-10-05): 12 zodiac + Orion, Big Dipper, Little Dipper, Cassiopeia, Cygnus, Southern Cross.
  data/constellations.json (scripts/build-constellations.mjs, d3-celestial): stick-figure stars with mag <= 5 (203).
  js/constellations.js registers every star as its own natural card (`star:hip<HIP>`; existing bright-star cards like
  Regulus are reused) plus a `con:<id>` card per constellation; `loadConstellations()` must run before buildCards (both
  pages). Stars are targets via `naturalTargets(..., state.conEnu, state.limit.stars)` (only when bright enough for your
  sky, after extinction). Constellation cards are earned through their stars (cards-page `linkConstellations`,
  renderCard `opts.ownedKeys`): bronze 1 star, silver half, gold (gold frame, `.con-complete`) when all. Art for these
  is drawn from real positions (js/con-art.js `conArt`), the card's star ringed in orange. Toasts on progress/completion.
- Tonight planner (2026-10-05): js/tonight-worker.js scans every bright-enough object minute by minute from now to dawn (same visibility rules incl. sky limit, twilight, Moon) → passes + a visible-count curve (~1.5 s). The visible panel has Now | Tonight tabs (`showVTab`, `renderTonight`: summary windows, chart, passes worth seeing — new, bright, high or rare — and `alsoUpTonight` planets/constellations with stars you still need). `#nextpass` chip under the radar when nothing is lit. Forecast refreshes every 20 min or when place/sky/binoculars change.
- Albums (2026-10-05): collection page tab Albums (js/cards-page.js `renderAlbums`): one cover per set with progress to Bronze/Silver/Gold goals (`albumGoals`: sets <= 30 cards complete them; bigger sets 10/50/100 or 10/50/200); gold cover at gold. Opening an album = Discover filtered to the set with an `#album-head` progress header.
