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
- Card viewer: the card owns touch (touch-action: none) and phone tilt is always on, measured relative to how you hold the phone when the card appears (quaternion, gimbal-free, `attachGyro`; 2026-10-05); the rest pose re-centres fast once you move more than 12° (lowering the phone after an overhead catch), slowly below that (2026-10-08) (iOS permission is
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
  bottom (`#target`) saying what it is, with View: the card rises out of the toast with the same full vertical-axis turn as the collection (back shows mid-turn; 2026-10-06)
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
  ancestor. The back's holo MATCHES THE FRONT's rarity (2026-10-06): none for common, pastel for uncommon, rainbow for rare/legendary, cosmos for epic, gold for gold-foil, prism for shiny — scoped by the tier/gold-foil/shiny class on the .card or on #rv-back (set in playReveal). Double-tap / double-click any full card to flip it to a random poster back and back again
  (`attachFlip` in js/card.js; used in the collection viewer, the reveal and the sky's View card).
  Fleet cards: `card--fleet` (short art window, 36-col dot grid, "N / M stamped" between the years).

## Deliberately out of scope for now
Accounts, secret sets/feats. (Reminders and alerts are IN scope since 2026-10-05.)

- ISS art regenerated 2026-10-05 with the settled pipeline (style-ref.png as the style reference, prompt in the session scratchpad gen-iss/): the first version used a card back as its reference and did not match the set.
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
- Card back (2026-10-05): ONE back now, Sevaan's Space Collector seal (assets/art/backs/back-collector.webp, rebuilt 2026-10-05 from Desktop/cardbacks/space-collector/back-collector-original.png: cropped just outside its cream frame line, blue band corners painted navy #01121c, even 18 px navy margin; shown with background-size: contain so the frame line is never cropped). js/card-backs.js still supports a list; the six posters (back-navy-1..6) are no longer used.

- Fleet cards (2026-10-06): the cream passport block is gone from the viewer; each sighting row names its launch (`.h-launch`: 'Launch 2026-166 · 24 satellites launched 21 Jul 2026 · newest stamp'). The card's dot grid has a 'Newest stamp: the launch of <date>' line (`.fl-latest`) and the level text reads 'N more for Silver/Gold'. renderPassport in js/card.js is unused.
- IRS art (2026-10-06): 'irs' key covers IRS-1/P, Resourcesat, Oceansat, Cartosat-1 — two three-panel wings, stacked camera module, black radiator (refs in scratchpad refs/img/irs). Check generated art against reference photos BEFORE shipping it.
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
  once per pass (natural objects once a night) by `autoLog` in js/main.js, quietly: a toast only for a shiny or a level-up (no "Seen again" toast, 2026-10-07).
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
  renderCard `opts.ownedKeys`): the card joins your collection ONLY when every star is collected, arriving gold (2026-10-05,
  Sevaan); before that it stays in the field guide showing stars found (tile "N of M stars found", progress dots on the card). Art for these
  is drawn from real positions (js/con-art.js `conArt`), the card's star ringed in orange. Toasts on progress/completion.
- Tonight planner (2026-10-05): js/tonight-worker.js scans every bright-enough object minute by minute from now to dawn (same visibility rules incl. sky limit, twilight, Moon) → passes + a visible-count curve (~1.5 s). The visible panel has Now | Tonight tabs (`showVTab`, `renderTonight`: summary windows, chart, passes worth seeing — new, bright, high or rare — and `alsoUpTonight` planets/constellations with stars you still need). `#nextpass` chip under the radar when nothing is lit. Forecast refreshes every 20 min or when place/sky/binoculars change.
- Albums (2026-10-05): collection page tab Albums (js/cards-page.js `renderAlbums`): one cover per set with progress to Bronze/Silver/Gold goals (`albumGoals`: sets <= 30 cards complete them; bigger sets 10/50/100 or 10/50/200); gold cover at gold. Opening an album = Discover filtered to the set with an `#album-head` progress header.
- Shinies (2026-10-05, js/shiny.js `shinyFor`, tests/shiny.test.mjs): decided at the sighting and saved on it (`shiny` key): eclipse (sunlit now, in shadow 45 s later), moon (within 1°, naturals 5°), overhead (el >= 80), fresh (launched < 30 days), fullmoon (Moon >= 98% lit). A card with any shiny sighting renders `.shiny` (rainbow prism holo + `.shiny-tag` ribbon); the reveal stamps SHINY! with an extra burst; autoLog toasts it.
- Progress (2026-10-05, js/progress.js, tests/progress.test.mjs): everything derived from the sighting log. XP (first catch by tier 10/20/40/80/150, repeat night 5, shiny 100, mission 50, constellation complete 200) → RANKS (Stargazer … Mission Control). `missionsFor(nightKey)`: 3 per night from MISSIONS, same for everyone. Weekly streak (Monday weeks). 75 ACHIEVEMENTS in groups (collecting, rarity, type, agency, era, fleets, sky, where/when you looked, coming back, missions; 2026-10-05). Collection page `#logbook` (renderLogbook); captures show +XP in the reveal header and toast missions/achievements/rank-ups (`progressGain`/`announceProgress` in main.js).
- Share (2026-10-05, js/share-card.js): collection viewer 'Share this card' draws a 1080×1350 card image on a canvas (art, name, rarity, stats, fact, collected/seen, rank; gold/shiny treatments), read from the card on screen; navigator.share with a file, else download.
- Events + reminders (2026-10-05, js/events.js, tests/events.test.mjs): annual meteor showers as time-limited events (peak −30 h … +20 h); `#event-banner` in the sky while one is on (hidden once you've earned its badge), Tonight summary names it (or the next one), Logbook EVENTS badges (`eventBadges`), a toast on the first catch of an event. Tonight rows have 'Remind me' → .ics calendar event with a 10-minute alarm (`passIcs`). Real push notifications are NOT built (would need home-screen install + a sender, e.g. a Val Town cron val).
- Bright-star art (2026-10-05): the 21 bright stars are close-up portraits of the star itself matching its fact (companions, colour, squashed fast spinners, Fomalhaut's dust ring), no Earth, no constellation chart; prompts in the session scratchpad gen/star_prompts.py. Stars must glow evenly (no planet-like shadowed side).
- Reveal polish (2026-10-06): twinkling starfield behind #reveal (addStarfield, css/reveal.css), header says NEW CARD (not FIRST DISCOVERY), every close button is a round ✕ (.x-close in css/app.css; #viewer .close in css/collection.css), no "Done" anywhere. Constellation charts (js/con-art.js) twinkle on full cards: ~35% of background specks (.con-tw) and a gentle shimmer on the figure's stars (.con-tw--star).
- Reticle height is fixed (2026-10-06): `uiCenterY` in main.js `measureSkySpace` = the viewport's vertical centre, passed as `centerY` to sky.draw, so the info card or a banner appearing no longer moves the circle (safeBottom still keeps labels clear of the card). `#nextpass` sits in the upper right level with the radar (2026-10-06): one line via `npChip(label, name, detail)`: 'NEXT: COSMOS 2082 · 9:44 PM' (no ›), one size, name bold orange and the first to shorten, drops below #event-banner when one shows.
- Welcome + guided setup (2026-10-06, design/welcome-flows.html D "Studio", replaces the hand-of-cards welcome): #start is a full-bleed card picture (#hero-art: the Sun by day, the ISS by night, slow Ken Burns drift) behind a three-line headline and one pill ("Get started"). Tapping it enters the sky and runs `runOnboarding()` (main.js) ONLY when you own no cards: two bottom sheets over the live sky (#onboard .sheet via `obSheet`: location → `requestLocation`; motion → `enableMotion`, "Use a finger" = drag mode; the HUD dims under a sheet, body.ob-sheet), a hairline (#ob-hair) at 33/66/100%, then `firstTarget()` pins the surest catch (Sun > Moon > brightest planet/star > brightest satellite) with a toast hint; the normal aim + Tap to collect + reveal play; after the reveal is dismissed, `obFinish` shows "Tonight looks good." with real numbers (dark from, satellites at peak, sky) and the best pass with Remind me. "Skip setup" pill at any point. Settings → Testing tools → "Run the setup tour" replays the WHOLE first run from the sealed welcome card, with drag mode on and the location reset to the example so the permission sheets are real steps again (`wcReplay`). Test screenshots go in the scratchpad, never the repo root. Stamps are gone for good: every capture message is a ticket toast.
- Playtest pass (2026-10-06): collection page chrome uses the card fonts (typography block at the end of css/collection.css); toasts drop below #event-banner when it shows (body:has); logbook heads wrap as whole lines; reveal eyebrow never wraps; no ☄ glyph (iOS renders it as emoji). Test harness: scratchpad/pw/playtest*.mjs drive every screen in WebKit with error logging; synthetic pointer swipes on #slot throw a harmless WebKit NotFoundError (pointer capture on a fake pointer), not an app bug.
- Outer planets + Solar System (2026-10-06): Uranus (epic, mag ~5.7) and Neptune (legendary, mag ~7.8) in js/celestial.js (Schlyter elements) and js/natural.js; faint planets (mag > 3) are visible only when el > 5°, Sun < −12° and mag + extinction <= the sky's star limit (binoculars raise it). `SOLAR_SYSTEM` (js/natural.js, key system:solar, `system: true`) is a constellation-style card whose "stars" are the Moon + 7 planets: joins the collection gold when all eight are owned; art file solar-system; progress toasts on planet/Moon catches (main.js showCaptureCard); counted for XP in progress() but not as a constellation. Art: planet-uranus, planet-neptune, solar-system (scratchpad gen/planets_run.py).
- Panel headers (.panel-head, Settings / Visible now) share the page header geometry: 80px from the safe area, centred, same double rule (::after) — keep them identical when touching either.
- missionsFor uses Math.imul mixing (the old float LCG overflowed and dealt the same missions most nights).
- Pleasure pass (2026-10-06): first-night hint in #guidance (`firstNightHint`, until you own a card / 40 s / something lines up); `snapTick` when the circle locks on; Tonight rows open the card (`showTonightCard`, preview if unowned, eyebrow "TONIGHT · time"); collection Sort menu (#sort-by: default / newest / rarest / A–Z); album covers always show the set's best art (dimmed via .album.empty); streak "Remind me Saturday" .ics (`remindStreak`); #version hidden in the sky (still in Technical information); night mode hides card shine/foil/glare/twinkles; #rotate screen on phones in landscape (coarse pointer only) — the app is portrait-only by design.
- Sky slider (2026-10-06, replaces Settings → "Your sky"): `#skybar` / `#sky-range` above the switcher sets `state.skySb` (sky brightness 17.0 city … 21.9 pristine, mag/arcsec², saved as localStorage `skySb`; first run takes the old `sky` preset's sb). `skyLimit({ sb })` in js/sky-limit.js; twilight and the Moon still add on top. While dragging: updateSkyLimit + throttled refreshAbove, so satellites, natural targets AND background stars (sky.js drawStars `starLimit`, with extinction, half-magnitude fade) appear/disappear live. On release: saved, model reset, Tonight recomputed (`T.sb`). Readout "<nearest preset> · stars to N.N". --nav-h is now 112px to clear it.
- Daytime Explore (2026-10-06, design/daytime-options.html, trimmed per review): the sky takes its real tone from the Sun's elevation (sky.js `dayF`: navy → dusk orange → pale blue; Milky Way, constellation lines and stars fade out as it brightens; stars gone above dayF .6); the Sun gets a dashed guard ring by day. `#nextpass` by day is one honest line "Tonight from 7:14 PM: <best new pass> · <sky> ›" (or "Not tonight: Rain all night · next clear Thu ›"), shown even while time-travelling. Dashed "ghost" markers (sky.js `drawGhosts`, main.js `dayGhosts`) show tonight's best passes and the ISS where they are right now with "you'll see it 8:12 PM". Weather: js/weather.js (Open-Meteo, free, no key, cached 30 min per place; `fetchWeather`, `tonightSky` → { ok, line, nextClear }); `requestWeather` runs with the Tonight refresh; `state.weather.now` drives quiet clouds/fog/rain/snow in sky.js `drawWeather`; the Tonight summary gets a "Sky: …" line. `body.day` darkens HUD text on the pale sky. The Sun is a card (js/natural.js `sunCard`, key `sun`, epic, visible el > 2° — you aim the phone, never your eyes; art `sun`) and is part of the Solar System card (now 9 worlds).
- Compass trouble (2026-10-06): js/sensors.js exposes `pointing.compassJumpAt` (a big north correction had to be accepted) and `pointing.compassDoubt` (0..1 while the compass disagrees); main.js `checkCompass` (once a second, iOS motion only) toasts "Compass needs a nudge: wave the phone in a slow figure-8…" when accuracy is -1 or > 35°, north just jumped, or doubt > 0.6; at most every 4 minutes.
- Show me (2026-10-06): Tonight rows have a Show me action (`showMePass`) that pins the object and sets `state.guidePass`; until the pass starts, the tick swaps the target's look for the rise point (riseAz/riseEl from tonight-worker), so turnHint, the guidance line ('You're facing the right way · it appears here at 9:45 PM (in 11 min)') and the edge arrow lead there, with an 'Appears here' ghost ring. The selected target's off-screen arrow is a pulsing orange disc; for targets behind you it points sideways (the way to turn), never over your head.
- Tonight rows (2026-10-06): grid of time (+ 'in N min' / 'up now'), tier diamond + name (wraps to 2 lines) + NEW, a short meta ('Rare · easy to see · SW → 58° W'), and two round icon buttons: target (`ICON_TARGET` → showMePass) and bell (`ICON_BELL` → remindPass; fills orange once set, remembered for the session in `reminded`). Passes under 10 min away get an invisible bell placeholder so the columns line up. Tapping the row itself still opens the card.
- One way to steer (2026-10-06): `guideTo(obj, look, hint)` in main.js pins and toasts '<name> · <hint> Follow the arrow.'; the tour's first catch uses it, and Show me uses the same pattern (`showMePass` adds the rise point). Natural targets (Sun/Moon/planets/stars) now get the same pulsing edge arrow as satellites (sky.js: naturalTarget + `naturalTargetName` push onto the off-screen list).
- Welcome card (2026-10-06, replaces the Studio hero opener; the tour sheets after it are unchanged): #start shows a sealed card (`#wc-holder`, the real back via applyBack, rotated 180°) that rattles every 5 s (`.rattle`, CSS) with 'Tap to reveal' on the card back itself (`.card__back .tap`, like the pre-auto-flip capture reveal); sized exactly like the capture reveal's card (--cf = min(14px, (vw-58)/28, (vh-120)/39.2)); after the flip, Begin replaces the Browse link at the bottom (#start.wc-open) so the card never moves. Tap → `welcomeFlip` (900 ms flip, faces swap edge-on) to a mission card built by renderCard from `welcomeModel()` (Collect the Cosmos, MISSION 01, Solar System art, 'swipe up to begin' footer) with finger tilt. Flick it up (`welcomeGo`, throwOff) or tap Begin (#btn-start) → enterSky + runOnboarding. Taps before the catalogue loads queue the flip (`wcWantFlip`).
- Tour catch + loader (2026-10-06): the tour waits for the capture reveal to OPEN and then close before showing its Tonight close (#onboard hidden meanwhile). `state.tourCatchId` makes the tour's target always render as a new find (Tap to collect, no mini card); if you already own it (a replay), `tourReveal` plays the full sealed reveal with nothing saved, and autoLog skips it. #start starts with class `booting`: an orbit-dial loader (.wc-loader, fades in after 150 ms) shows until boot() decides between the sky and the welcome card.
- Highlight settings (2026-10-06): Settings → Pointing has 'Highlight in the circle' ticks per kind (`data-hl`: satellite, rocket, planet, sun, star; prefs `hl-<kind>`, stars OFF by default; `hlKind`/`isQuiet` in main.js). A quiet target: no inner circle and no snap (sky.js `quietTarget`, drawReticle(…, quiet)), the object itself brightens and grows, the outer circle still turns orange, and there's no Tap to collect button (#d-cta hidden): tap the circle (#d-hit) to collect.
- Tour as cards (2026-10-06, design/tour-cards.html; replaces the bottom sheets): `obCard(steps, k)` lays the top two-thirds of a card over the live sky (#ob-deck, next two stacked under it, card-shaped progress pips #ob-pips); no swiping, the buttons choose and throw the card off sideways. Steps: location (Allow → requestLocation + `obReact('Sky lined up to your spot')`), motion (Allow runs enableMotion INSIDE the tap via `onYes`, then 'Following your phone'), Match your sky (slider explainer, wording for night vs day), Assignment 01 'Catch <target>' (gold; named by `nameTarget()` just before it shows, after location is in). body.ob-tour hides the HUD chrome while cards are up; an orange bloom (.ob-bloom) marks each switch-on. Then guideTo + the normal reveal + the Tonight close.
- Toasts (2026-10-06): always at the bottom, rising in from below: just above the sky slider in Explore (above the mini card when it's up), at the very bottom over a panel or the capture reveal (body:has() rules at the end of css/app.css). Each stays max(5 s, 1.6× its time) and a tap dismisses it early (linked ones still navigate). Tonight bells toggle: tap a lit bell to turn it off (toast reminds you to delete any calendar event).
- Sky labels are sticky (2026-10-06): sky.js drawLabels remembers each label's side (`labelSide`, keyed by text); if that side is briefly blocked the label hides rather than hopping, and only moves after ~20 blocked frames. In a slow sweep test: 1 side change across 3 labels in 120 frames.
- Mini card (#target) matches the toasts (2026-10-06/07): the toast box (52px min, 1px edge + 4px rarity stripe), 36px round art, the meta as the small-caps eyebrow on top (rarity colour, cyan for turn hints) and the name as the 15px line; toasts sit 8px above it. Override blocks at the end of css/app.css.
- Below the horizon (2026-10-06): sky.js drawGround darkens with how far down you look and adds a glow just under the horizon, warmer toward the hidden Sun (this.sunAz/sunEl); drawGroundCompass draws wavy topographic contours + the four cardinal spokes (no 30° spoke grid). See-through Earth: main.js `belowGhosts(d)` (when you look below +8°) lists the Sun, Moon, planets brighter than mag 2 and tonight's next 4 passes that are under the horizon, drawn by sky.js `drawBelow` as dashed rings with one label 'Name · rises 7:30 AM' / 'up 3:57 AM' (rise times by 10-min stepping, `riseTimes`, cached 5 min). The 'Looking at the ground' nudge was removed (2026-10-07). Each below-horizon ring now holds a faint drawing of the object (disc for Sun/Moon/planets, satellite icon for passes).
- Widths (2026-10-07): the slider, switcher, toasts and mini card are all exactly a full card's width (--nav-w = 28 × the reveal's --cf: 335px on an iPhone 15, 262 on an SE), centred; names ellipsize. Toasts land with a slight bounce (.ticket.in overshoot curve).
- Bottom stack spacing (2026-10-07): mini card at safe+144px (20px clear of the slider), toasts at safe+144px alone or safe+204px above the mini card. The mini card no longer shows '1 of 2' (#t-switch hidden).
- Standing messages are toasts (2026-10-07): `showBanner(text, action)` now renders #banner as a ticket (.ticket--standing, gold stripe, › when tappable) at the BOTTOM of the #toasts stack; it doesn't time out and leaves when its state clears (new build, time travel 'tap to go back to now', 'tap anywhere to line the sky up', 'check your heading'). The old compass banner line was dropped: checkCompass's figure-8 toast covers it.
- showBanner(text, action, { icon, sub }) (2026-10-08): optional leading icon (.banner__icon, gold, slow 6 s spin, off with reduced motion) and a second gold line. The new-build message uses a gear and puts 'Tap to update.' on its own line.
- One sky across pages (2026-10-07): sky.js drawBackground records `sky.tone` {a, b, f} (the gradient it painted); main.js saves it to localStorage `skyTone` once a second (not in night mode); cards-page.js `applySkyTone` paints the collection page and viewer with it (body.sky-tone, --page-sky, fixed), with a dark scrim up to 72% as the sky brightens so cream text stays readable. Older than 3 h → the default background.
- Helicopters (2026-10-07): js/planes.js `isHelicopter` = ADS-B category A7 OR an ICAO helicopter type code (HELI_TYPES: EC35, AS50, R44, H145, B06, S76, AW139…); parse() sets `plane.heli`; sky.js draws kind 'heli' (round cabin, tail boom + rotor, crossed main rotor) and the card says 'Just a helicopter'.
- Repeat milestones (2026-10-07): no 'Silver/Gold card unlocked' wording anywhere. A repeat sighting toasts only at a milestone: 'Seen on N different nights' when the night count first reaches 3, 5, 10, 25, 50, 100, 200, 365 (NIGHT_MILESTONES in main.js autoLog and reveal.js finish; the reveal eyebrow reads 'SEEN ON N NIGHTS'), and fleet stamps at 5, 10, 25, 50, 100… ('N launches stamped'). Plain repeats get no toast. Over the reveal or a panel, toasts are forced to the very bottom (!important beats the mini-card rule).
- Over an object (2026-10-07, design/target-states.html A; replaces the mini card): every target uses #discover — rarity + name above the circle, one button below. New: solid orange TAP TO COLLECT (orange circle). Collected (#discover.owned): cream circle (sky.js `ownedTarget` → drawReticle ink = theme.label), cream outline VIEW CARD + 'Seen on N nights' (#d-sub); tapping the circle or the button runs `viewOwned` (logs the sighting if it's a new pass, then showViewCard). Plane: red circle, 'Just a plane/helicopter' + flight name above, the route on a red outline button (#p-route) and details under it (#p-info). #target (the old mini card) is never shown now.

### 2026-10-07: quiet ring, selection, compass toast
- **Compass at your feet = option C "Quiet ring"** (design/compass-feet.html). `sky.drawFeet(below)`: a thin ring centred on the circle (turning with your heading), N/E/S/W inside, and each below-horizon thing sitting on the ring at the direction it will come up (`riseAz`, from `riseTimes` / pass `riseAz`) with its time; labels slide up/down a row to stay clear. Fades in from ~64° down (`sky.feetA`); the see-through ghosts (`drawBelow`) and horizon N/E/S/W fade out as it fades in. The survey contours and bearing labels are gone; the straight grid (rings at 20°/45°/70° down, spokes every 30°) is back and softens to 45% under the ring.
- **Selection is inside the circle only.** Candidates get a 0.4 s grace (was 1.5 s); the target is re-picked every frame by `pickScore` (distance from centre, −1.5° for the current target, −1° satellite over star, −1° new over collected). Planes: in the circle only (+0.75° / 0.4 s keep). Not-locked targets are no longer drawn bigger (only 2.1× when locked).
- **Compass toast** is a normal ticket (`kind: 'compass'`, `id: 'compass'`) and is withdrawn (`dropToast`) the moment the compass reads well. Toasts can carry an `id`.
- Retired: the first-night "Sweep the sky slowly…" hint and the "Looking at the ground" nudge (functions remain, unused).
- **Twinkles everywhere:** constellation charts (js/con-art.js) now carry cross-glints (`.con-spark`, same `art-twinkle` timing as painted cards) on the figure's stars and a few specks, full cards only. Painted pictures with no detected stars get hand-placed glints from `ART_STARS_EXTRA` in js/card.js (survives re-running import-art.py).
- **Reveal:** "View in collection ›" is plain gold text centred just under the card (`#reveal-view`, positioned from `--cf`/`--ch`), no longer a pill in the top bar.
- **Loader = the target circle:** index.html builds `#ld-ret` inline with the exact drawReticle geometry (r = h/2·tan6°/tan35°, centred at innerHeight/2), with an orange dot orbiting the ring; the wordmark sits under it.
- **Clouds are in the sky:** drawWeather places each cloud at a fixed az/el (slow drift) and projects it, so it stays put as you move. Rain/snow/fog remain screen-space.
- **Shared components: css/ui.css** (loaded last on index.html and cards.html). Holds `--nav-w` and the `--ui-*` tokens, the Explore/Collection switcher (`.sc-switch` / `.sc-switch__item`, current page = `[aria-current]`), the round ✕ (`.x-close`) and the round header buttons (`.icon-button`). Page CSS may position a component but should not restyle it; the old `#nav`/`.nav-item`/`.bottom-nav` styling is gone.
- **Component pass 2 (css/ui.css + js/toast.js):** one body font (system) on both pages, and Inter/Plex now load on Explore too so cards render identically; `.ui-eyebrow` section labels (also `.session-title`, `.t-head`, `.lb-head`); `.ui-chip` (Next: chips, event badges); `.ui-btn` / `--primary` / `--accent` (viewer Share/Preview); the viewer's top row sits where the reveal's does; `.starfield` stars shared; toasts are a module (js/toast.js: `ticket`, `toast`, `dropToast`, `toastPending`, optional `art`) used by both pages; fields and focus rings shared; red night mode is a token swap on `--ui-*`.
- **Constellation toast** carries the gold card's art (`conArt(..., { lit })`: found stars lit, the rest as hollow rings, the new one ringed orange).
- **Undiscovered cards** show their real art hidden (js/card.js `lockedArt`: blur + dark + scan lines) instead of the generic outline; the outline remains only where no picture exists.
- **No tap-to-switch:** the "1 of 2" / "N more in the circle" line is gone; with several things in the circle a slight tilt hands the pick over (pickScore stickiness 0.5°, satellite 0.5°, new 0.4°).
- Loader has its cream inner orbit back; the target circle's centre is fixed at innerHeight/2 from the first frame (no slide).
- **Card size slider (Collection):** `#sizebar` (shared `.ui-slider` / `.ui-range` in css/ui.css, same look as Explore's sky slider) sits over the switcher: SMALL ↔ BIG = 4…1 columns on phones (7…1 on wide screens), saved as `localStorage.gridCols`. Grid gets `data-cols`/`--cols` plus `.dense` (<140px tiles: tighter type) / `.tiny` (<92px: name only) / `.single`. A fixed bottom fade sits behind the controls.
- Constellation charts: cross glints on a few background specks only; the figure's stars just shimmer.
- **Quiet ring is on the ground now** (2026-10-07, Sevaan): drawn at el −77° in world space like the grid (cardinals at −81.5°), so it stays put as you move; markers sit on it at their rise azimuth; fades in from ~53° down.
- **Travel paths below the horizon:** each below-horizon thing gets a marching dotted line from where it is now to where it rises, with an arrowhead (`path` on belowGhosts entries: bodies from `riseTimes` 10-min samples, satellites from `satPath`, the last ~12 min before rise).
- Labels near a screen edge slide in instead of disappearing (drawLabels clamped candidates).
- No circles around icon buttons or ✕ anywhere (ui.css "Bare icons").
- Achievements → mission patches design board: design/patches.html (A roundel, B shapes, C enamel, D gold/holo foil, wall, detail, earn moment, card-back rewards). Not built yet.
- **Below-horizon in the circle:** lining up a below-horizon thing shows "BELOW THE HORIZON / NAME / RISES 9:47 AM · IN THE SE" around the circle (cream, no orange, not collectable; only when nothing collectable is targeted). Its path brightens.
- **Below-horizon paths match the sky trail style** (drawTrail): faint solid line for where it came from (`past`: bodies 90/60/30 min back, satellites last 4 min via `satPast`), orange `[4,7]` dashes ahead to where it rises; faint until lined up.
- **Text links under a card:** `.ui-link` (css/ui.css) for "View in collection ›" and "Share this card ›".
- **Card-shaped tiles:** every grid slot is 5:7 (a card's 28 × 39.2) at every slider size (`align-self: start` so the ratio sets height from width); the art window flexes to fill what the words leave, names clamp to 2 lines (3 at one-per-row).
- **Loader on every full refresh** (2026-10-07); `html.quick` (no loader) only when arriving from the standalone cards.html (referrer, not a reload). Was: **Loader once per session:** `sessionStorage.scBooted` (set by both pages) adds `html.quick` on Explore: the loader overlay goes see-through, no orbit dots or wordmark, and the header + switcher show from first paint around the static target circle, so Collection → Explore feels like a switch, not a reload.
- **One page (app shell):** Collection runs inside Explore as `#collection-frame` (cards.html?embed=1), preloaded 2.5 s after the sky starts. The switcher and every `cards.html…` link (incl. toasts via `window.scNavigate`, "View in collection ›" with `#key`) call `openCollection(key)`; the embedded page posts `{sc:'explore'}` (with `more` for its settings button) to come back. The sky loop pauses while it's open; history.pushState makes back/swipe-back close it; a capture reloads the hidden frame in the background (`collectionStale`); closing re-reads sightings. Insets are posted in (`{sc:'insets'}`) since iframes don't get safe-area env(). cards.html still works standalone.
- **Smooth card resizing:** changing the size slider animates the on-screen tiles from their old place and size to the new (FLIP, 340 ms) and scrolls to keep the top visible card where it was (js/cards-page.js `resize`). Off under reduced motion.
- **No white flash:** cards.html paints dark from its first frame (inline background + `color-scheme: dark`), and the shell only fades the Collection layer in once the page posts `{sc:'ready'}` after its first render (or its load event).
- Size slider range is now **2–6 per row on phones, 2–8 wide** (2026-10-07); `.micro` (<66px tiles, six across) shows just the picture in its card frame.
- **Sliding switcher pill:** `.sc-switch::before` is the one orange pill, positioned by `data-side` (left/right); js/switcher.js `setSwitch(nav, side, animate)`. Tapping slides the pill (260 ms, slight overshoot) and the view changes at `SLIDE_MS` (200 ms) as it lands; the hidden switcher is reset without animation.
- **Daylight earth:** in the day the ground is warm soil (darker looking down) with fine grit fixed to the ground; fades with dayF, so at night it's the dark ground as before.
- **Twilight ground:** the soil cools from warm brown to dusky violet-brown between Sun +6° and −6°, and the horizon rim glows warmer and wider on the Sun's side around sunset/sunrise (peaks near −2°).
- **Mission patches (built 2026-10-08, style A + foil, no card backs yet):** js/patches.js draws every achievement as an embroidered roundel (`patchSvg`/`patchHtml`; groups `GROUPS`/`groupOf`, picture icons `GLYPH` else the achievement's text icon; `finishOf` = gold for milestones, holo for the rarest; styles in css/ui.css `.patch`). Collection: a **Patches** tab (`#patch-wall`, group chips, 3 across / 6 wide, unearned = faint stitch outline) replaces the logbook's achievements list (logbook now has a "MISSION PATCHES n / 75 ›" link); tap → `#patch-view` dialog (big patch tilting with finger/phone, foil sheen follows, name, requirement, group/foil chips, earned date on the patch). Earned dates: `localStorage.patchDates` (written on Explore when earned), else replayed from sightings (`earnedDates`). `cards.html#patches` opens the tab. Explore: `earnPatch` replaces the achievement toast — waits for the reveal to close, patch drops in, border stitches on (SVG mask), thud, name; then a `kind:'patch'` toast with the patch as its picture linking to the wall. Tap skips.
- **Playtest pass (2026-10-08):** tour hides the event chip, next-up chip, standing message and toasts, drops the pips (step count is on the card), Skip is a quiet text link top right; time-travel message is one line ("Sky at Thu 10:30 PM · back to now"); meteor-shower banner is a chip ("☄ DRACONIDS · badge tonight") stacked with next-up; compass disc is see-through glass by day; panels use toggle switches, the shared button shape, bare ✕ (no focus ring), condensed copy, shorter labels; standing message hides while a panel is open; Collection tabs are "Mine · Albums · Discover · Patches" on one line; size slider only while the card grid is on screen with cards (`body.grid-off`); locked patches tinted with their group colour, earned patches first; nudged ring labels at your feet get a clearer leader line.
- **Catch flow playtest (2026-10-08, via Settings → Testing tools → Jump to next visible pass):** toasts wait while the reveal or a patch moment is up (js/toast.js); the standing message hides during the reveal, patch moments and while something's in the circle; patches earned together play as one moment (up to 3 side by side, "N PATCHES EARNED") and one toast; the patch moment dims the sky fully.
- Reveal flash: the gold dot swells to 2.6× and pops (5×, fading) instead of scaling 40× into a blurry disc; the white flash is short (300 ms) and centred where you caught it; the shock ring grows by size so its line stays sharp. No toast after a patch moment.
- Bright planets count earlier in twilight (natural.js `brightLimit`: Venus from about sunset, Jupiter ~1.5° down, Mars 3° down). By day toasts sit just above the switcher (no slider). Meteor-shower tap toast shortened.
- Event chip styled exactly like the next-up chip (no orange border); tapping it shows the explanation and marks that shower read (`localStorage.eventRead` = e.g. draconids-2026), so the chip goes away until the next shower.
- Satellite paths below the horizon now run from the satellite's current position to its rise point (`satPath`, adaptive step); passes more than 25 min away get no path, just the marker.
- Drag-to-look goes down to −89° (was −10°), so the ground, ring and paths can be reached with a mouse/finger.
- **Meteor-shower badges count night sightings only** (js/events.js `countsForEvent`/`eventOf`: not the Sun, 6 pm–7 am local); used by the badge list, the "first of event" toast and the chip's earned check.
- **Desktop / no motion sensors:** the first drag turns drag mode on, so the "sensors settling" gate no longer blocks every target on a computer.
- Right-hand chips start level with the top of the compass circle (top +101px; next-up +141px under the event chip).
- **Buried fossil easter egg (built 2026-10-08, daytime only):** js/fossil.js picks one of the ten skeletons in assets/art/fossils (Sevaan's sheet, split per dinosaur) each app open; the spot (`localStorage.fossilSpot`) is chosen the first time you are out in daylight, behind you (heading+180° ±25°, 35–55° down), then fixed. sky.js `drawFossil` lays it along the ground in the soil (soft-light blend, faint) only when dayF ≥ .5; lined up with nothing else targeted it shows full colour with a glow, "BELOW THE HORIZON · N° DOWN / SOMETHING'S BURIED HERE… / HOLD IT IN THE CIRCLE" and a hold ring; 1.2 s held → `fossilFound` saved and the secret **Fossil Hunter** patch moment ("SECRET PATCH", T. rex art = assets/art/fossils/patch.svg, cropped to the bones; group 'secret'). The patch joins the wall only once found. Never mentioned elsewhere.
- **UFO easter egg (built 2026-10-08, night only, tap only, no card):** js/ufo.js gives one 90-second chance per 8-hour block (moment fixed per device via `ufoSeed`), flying only if the Sun is below −6° and 3+ other things are up; it crosses 150° of sky once. sky.js `drawUfo` draws an unlabelled saucer with a green glow; lined up (nothing else targeted) the ring turns green with "✦ UNIDENTIFIED / ???" and a green `#ufo-cta` "Tap to collect · Quick, it won't stay". Tap → `ufoFound` saved → secret **Close Encounter** patch (night-green twill, saucer and beam; patches.js `UFO_ART`), shown on the wall only once caught. Never appears again after it's caught. Testing tools has "Summon the UFO".
- **Tour's last page = design B by weather (built 2026-10-08, design/tonight-weather.html):** `obFinish` builds a timeline from tonight's passes, peak and the forecast. weather.js `tonightSky` now also returns `kase` (clear / clearing / closing / bad), `clearFrom`, `coverFrom`, `worst` and `nights` (next 4). Clear: "You're set · Tonight looks good", dusk → best pass (orange) → busiest → dawn. Clearing: "Worth the wait · Clear by 10 PM", greyed cloud rows, best pass after it clears. Closing: "Go early · Clear until 9 PM", best pass and the last one before cloud. Bad: "Rain all night · Not tonight, but soon", the next nights grid, "Remind me Saturday" (.ics at dusk) and "Explore the sky anyway". Backdrops from js/weather-art.js: noise clouds drifting in two layers, animated rain (css/ui.css .wx-*). Remind button says the time (pass − 10 min). Skip setup hides on this page.
- **Chips, switcher and toasts are dark glass at all times** (2026-10-08: the light day versions were tried and removed; `body.bright-sky` is still set by day but has no styles).
- **Settings rebuilt (2026-10-08, design/settings.html):** grouped rows (Your sky · What shows · Aiming · Sound · About), toggle switches, location as one row opening a sheet (use my location / coordinates), motion status ("On ✓" or Turn on), the sky slider mirrored (`#set-sky-range` drives `#sky-range`), circle highlights as a row opening a chip sheet with a preview, compass nudge steppers, new **Sounds and vibration** pref (`sound`; gates chirps, thuds, reveal sounds and `buzz()`), **Your data** row (count + JSON export), Replay the tour. Testing tools are hidden: tap the version line 5 times. Old ids kept so the wiring is unchanged. No location search or reminder list yet.
- UFO is drawn at rocket-stage size (0.5×), enlarging (1.15×) only when lined up.
- Settings title set like the wordmark ("SETTINGS / CUSTOMIZE YOUR EXPERIENCE"); **Testing tools sit at the bottom of Settings (after the version), always visible** (the 5-tap version trick is gone).
- Landscape by day: hills hazy blue-green (#6f8f86), pines deep green (#2f4a35), blending to the night silhouettes with dayF.
- Pines rebuilt (2026-10-08): trunk + 4–6 drooping ragged tiers narrowing to a spike, slight lean, lit side by day; a smaller hazier far row behind (LANDSCAPE.far).
- Countdown to dark: by day with nothing in the circle, "4 H 2 MIN UNTIL DARK / DARK AT 7:11 PM" under the circle (#until-dark, js/main.js untilDark).
- Daytime soil fidelity: broad lighter/darker earth patches, pebbles with shadow and lit top, grit, dry-grass tufts and twigs, all ground-fixed and distance-scaled. The countdown to dark only shows while you're looking above the horizon.
- Countdown reminder (built 2026-10-08, design/until-dark.html): "🔔 Remind me" pill under the countdown → sheet with 3 times for tonight (before the best pass, at dark, busiest) → .ics calendar alert at that time; pill shows "🔔 7:02 PM · set" (localStorage udRemind), tap again to change/cancel. Native notifications later with the iOS/Android apps.
- Hills in three ranges (far hazy ridge, main hills, near rolling meadow) with sunlit crests by day and grass tufts along the meadow; night unchanged. Reminder option reads "10 min before the best pass · NAME at 7:13".
- Tour's last card art is a live pointer (OB_ART.aim + obAimTick): arrow toward the target and "Turn left 108° · up 20°", gone when you're on it. Steering line under the circle styled like the other under-circle lines. Easter-egg ideas board: design/easter-eggs.html (Santa, Roadster, shooting star, Voyager, straight through, dizzy).
- **More secrets (built 2026-10-08, js/secrets.js, sky.js drawSecrets):** Santa's sleigh (Christmas Eve night, 2-min crossing every 20 min, tap "Tap to wave" → Nice List), Starman's Tesla Roadster (real-ish heliocentric orbit, celestial.js `roadster()`, night, hold in circle → Don't Panic), a shooting star (during an active meteor shower, every 3–8 min while looking up, streak passes near the circle, "Tap now" within ~1 s → Make a Wish), Voyager 1's golden record (RA 258.2°, Dec 12.1°, night, hold → Pale Blue Dot), Dizzy (1,080° of turning within 30 s → compass wobbles → Dizzy). Icons are small like other objects (enlarge only in the circle). Found ones in localStorage 'secrets'; patches shown on the wall only once found. Testing tools: Summon Santa, Shooting star. Logbook's Mission Patches link removed.
- Opening Settings during the tour ends the tour. Settings → About → Reset everything: confirms, clears localStorage/sessionStorage and the IndexedDB, reloads as a new player (browser permissions themselves can't be revoked by the page).
- Loader shows at least 1.4 s from page start on every full load (incl. after Reset everything) before the welcome card or the sky.
- **Polish pass (2026-10-08):** motion tokens in css/ui.css (`--m-fast/norm/slow`, `--ease-out`, `--ease-spring`; Reduce Motion → short fades); press-dip on tappables; panels slide up/down (closePanel adds `.leaving`) and drag-down-to-dismiss on the header; dialogs fade; patch detail grows from / shrinks back to the tapped patch; Collection tabs have a sliding underline (`.tab-ink`) and crossfade; first screenful of tiles cascades in; filters/sort FLIP (`window.flipGrid`); tile images shimmer until loaded then fade in; owned count pops; logbook/album bars animate; NEW tag + glow on earned-but-unopened patches (`patchSeen`); lock pulse ring on the circle + buzz on lock/toggles/switcher (Android); sky labels fade in; under-circle lines rise in; countdown rolls on change; reminder bell wiggles; "+1 night" stamp in the reveal on a repeat night; empty-state satellite drifts.
- Polish extras: "Show me" flies an orange target from the row to the circle (flyToCircle); search results glide (flipGrid); the Mine count ticks up through the numbers; an album that just crossed a goal sparks once (localStorage albumLevels); a patch group with nothing earned shows a small drifting-star note.
- **Performance pass (2026-10-08):** (1) Collection borrows Explore's catalogue (`globalThis.__catalogShare` from orbit.js loadCatalog) instead of downloading/parsing it again. (2) Catalogue slimmed 5.3 → 4.0 MB (gzip 1.11 → 0.93 MB): period/incl/apogee/perigee/year and default `card` are no longer stored but derived on load by js/catalog-facts.js `expandFacts` (used by orbit.js and cards-page.js); elements trimmed in precision; scripts/build-catalog.mjs writes it this way. (3) sw.js service worker: versioned files + art cache-first (older ?v copies pruned), pages and data stale-while-revalidate, version.json and other origins network-only. (4) Daytime soil texture rendered to an offscreen layer and reused until the view turns ~0.03° (`sky.soil`). (5) Idle throttle: when the view hasn't moved, every other frame is skipped (~30 fps). (6) Fossil art loads only when first needed (`Fossil.loadImage`).
- Tree line on the horizon is on by default. Daytime: a thin/new Moon (illum < 25%) isn't drawn (no black disc). Show-me/steer toasts use the standard eyebrow ticket.
- Playtest #2 fixes: Tonight summary as stat chips (Visible / Busiest / Sky) + short notes; steering line on a soft dark pill; "0 UP" white by day; ground compass letters never under the switcher; feet-ring labels clamped on screen; Collection grid has extra bottom room; a new player's patch wall opens with "Start here" (3 easy patches, larger, with what earns them).
- **Up in your sky panel (built 2026-10-08, design/now-tonight.html A + B's card rows at the end):** title "UP IN YOUR SKY / place · time", tabs "Now · N | Tonight". Now: a north-up sky map (rim = horizon, wedge = where you face, new satellites/planets ringed, stars small and quiet, 7 brightest labelled; tap a dot to aim), then New to you / Seen before (satellites and planets before stars; 8 shown, "Show all N ›"), then "New to collect" mini cards (`aimAt`). Tonight: stat chips + chart, then one timeline (`#tonight-list.tl-mode`) with passes and moments (cloud rolls in, clears, busiest, dawn), Also up tonight, then "Worth setting an alarm for" mini cards with bells (rarest new passes 15+ min away).
- **Camera view prototype (2026-10-08):** Settings → Testing tools → Camera view (prototype). Live rear camera (#cam video, getUserMedia environment) behind a transparent sky canvas (`sky.camera`: no background/ground/landscape/weather drawn, faint veil at night; video dimmed at night, red-tinted in red mode). Drawing FOV set to 62° tall (Camera fit −/+ adjusts, saved as camFov). With live sensors, a sideways drag nudges the compass to line the drawing up with the real sky. Stops when the app is hidden. Photo-on-cards not built yet.
- Camera view (revised 2026-10-08): the real sky colour for the time of day is painted see-through (62%) over the picture, the tree line, hills and meadow are drawn as usual, and below the horizon nothing is drawn (the sky tint is cut away with destination-out) so the camera shows the floor or field. Stars follow normal day/night visibility.
- Compass figure-8 toast waits until motion has been live 20 s (no flash on refresh). Settings → Aiming → Compass nudge has a Reset (back to 0°). Camera view's instructions are a short bottom toast ("Drawing off? Drag sideways to line it up.").
- Snap onto targets is off by default.
- Camera view ground: a see-through ground-colour layer below the horizon (70% at the horizon → 30% → 0 by ~45° down), so looking down shows your room or the field clearly.
- Dino bones drawn at 75% of their first size and not shown in camera view; in camera view the landscape (hills, trees, meadow) is see-through (60%) like the sky and ground.
- Jump to next visible pass only moves the clock (no pin/follow/drag). Camera view overlay stronger: sky 78%, ground 85%→45%→0, landscape 80%.
- Compass steadiness (sensors.js): once settled, compass disagreements under 2.5° are ignored and blending is slower (0.02); after a hand correction (camera line-up drag or ±5° nudge) the heading is locked (`lockHeading`) so only a big, persistent change moves it. Reset clears the lock.
- Camera view: ground tint is the header's near-black (#080f1b; red-black in red mode), and the landscape is cream outlines only (ridge lines + near-row pine outlines, no fills, trunks or far row).
- Camera toggle in the Explore header (#cam-toggle, left of the moon; gold when on). Camera view: sky 95%; ground is a radial gradient around the point below you: 95% out to 45° down, 50% at the compass ring at your feet (−77°), 0 at the very bottom; hills as outlines, no trees.
- Logbook (rank, missions, events) is a card: `.lb-card` > `.lb-rot` (tilt via attachTilt with {scroll:true} so the page still scrolls, plus attachGyro), `.lb-glare`, and a double-tap flip to a card back (attachFlip + applyBack). Contents render into `.lb-face`.
- Logbook card is as tall as a standard card (min-height = --nav-w × 1.4); events sit at its foot.
- Rank card front = design/rank-card.html C (2026-10-08; D3's progress bar removed): top bar "OBSERVER RANK / streak", a 160px ladder picture (4 rungs from progress.js RANKS around yours, twinkling stars .lb-tw, you ringed, next dashed with NEXT and an orange line partway), rank + "470 / 600 XP", tonight's missions, then an EVENTS header (with "N badge(s)" when earned) and the event chips at the foot.
- Patches higher fidelity (2026-10-08, patches.js patchSvg): merrowed satin edge (160 slanted two-tone threads), tighter woven twill + fabric noise + edge shading, running-stitch ring inside the border, embroidery filter on icon and lettering (thread texture + raised shadow), a soft top-left sheen.
- Camera view at night (2026-10-08): no sky tint at night (drawBackground alpha = 0.95 × dayF, so 0 at night and in red mode), and the ground tint at half strength (`sky.camDim()`, 0.5 at night → 1 by day).
- Now tab map turns with you (2026-10-08): the way you face is at the top under a fixed wedge; the rings, N/E/S/W and dots sit in `.vm-rot` and rotate, labels (`.vm-up`) counter-rotate to stay upright. `spinVisMap` runs a rAF loop while the panel is open, reading the sensors directly (the sky loop pauses under panels), smoothed, held still when you point straight up.
- Now tab empty state (2026-10-08, `renderVisibleEmpty`): the same map, empty, with a breathing glyph (sun by day, cloud when overcast, moon otherwise), a title ("The Sun has the sky" / "Clouded over" / "A quiet patch of sky"), a why line (when it gets dark, the sky forecast), a "Next up" row for the next pass worth seeing (tap = show me), then "Jump to the next pass" and "See tonight's plan ›".
- New-card reveal, design D (2026-10-08, design/reveal-options.html): "+N XP" rolls in after NEW CARD (.rv-roll); a share icon with no circle (#rv-share) sits left of the close and shares the same image as the collection viewer (`shareCardEl` in js/share-card.js, used by both; main.js sets `revealShare` and hides it for previews); a soft tier-colour glow under the card (#rv-glow); a thin rank bar under the card (#rv-rank: rank name, XP counting from before → after, bar filling; `progressGain().rank` → playReveal({ rank })). With the bar the card rides up 34 px (`#reveal.has-rank { --rv-y }`) so the bar and View in collection fit without scrolling (checked at 393 × 659). The card size is unchanged.
- Compass nudge is remembered (2026-10-08): js/sensors.js saves it to localStorage 'compassNudge' (debounced 400 ms, so camera line-up drags save once) and reads it at start; Reset saves 0. The hand-correction lock (lockHeading) is not remembered. No magnetic declination is applied to iOS webkitCompassHeading yet (≈ −11° at Peterborough), which is part of why a fixed nudge helps.
- True north (2026-10-08): js/declination.js computes magnetic declination from the World Magnetic Model 2025 (coefficients embedded, valid to Nov 2029; matches NOAA's test values within 0.005°). sensors.js `setCompassPlace(lat, lon)` (called from refreshAbove, cached per 0.1°) adds it to the iOS compass in trueBasis (iOS webkitCompassHeading is magnetic). First time only ('declApplied'), a saved nudge is shifted by −declination so the sky doesn't jump (−20° → about −9° in Peterborough). Android 'absolute' is not corrected. Settings → debug info shows the declination.
- Holofoil (2026-10-08, Sevaan: the rainbow was messy): one clean diagonal spectrum band (--holo-band) with a thin white streak (--holo-streak), on a 300 % layer driven by --bgx/--bgy so it sweeps about half a card as you tilt; screen blend, the rest of the card stays clear. Rare: in the picture window; Epic: across the whole card, plus glitter masked to the band; Legendary: the gold treatment plus the white streak. Backs match (rare/epic band, legendary gold glint).
- Shiny toast says why (2026-10-08): "SHINY · INTO THE SHADOW" with the SHINY line ("You watched it slip into Earth's shadow."), 5 s.
- Mega-constellation (fleet) cards are never shiny (2026-10-08, Sevaan: one Starlink sliding into shadow shouldn't make the whole fleet card shiny): shinyFor returns null for objects with a `family`; renderCard / renderCardTile / the reveal ignore shiny on cards with `launches`, so older shiny fleet sightings no longer show.
- Globalstar, Orbcomm and Iridium are fleet cards (2026-10-08, Sevaan): FAMILIES in scripts/build-catalog.mjs, Uncommon (`tier` on the family), and each member keeps its own stdMag (family stdMag null; orbit.js uses o.stdMag ?? fam.stdMag). Levels GLOBALSTAR [1,5,12], ORBCOMM [1,4,8], IRIDIUM [1,5,10]. Old sightings saved as their own cards (cardKey = object id) read as fleet card + launch stamp (card-model.js fleetOf, filled by buildCards). Art reuses the satellite pictures (globalstar / orbcomm / iridium, cropped to the wide fleet window). The album formerly "Mega-constellations" is now "Fleets" (set id still 'mega'), and fleet cards sit in it ahead of the age / dead sets. Fleets can't be shiny (shinyFor checks `family`).
- Now tab always redraws when shown (2026-10-08): showVTab('now') calls renderVisible, so coming back from Tonight no longer shows a stale (sometimes empty) list while the radar says N up.
- design/tonight-list.html: three directions for the Tonight pass list with a rarity filter (A compact timeline + rarity chips, B Up next / Later cards + "rarity and up" ladder, C direction dial + expandable actions + select). Bells only exist for passes > 10 min away (the alert fires 10 min before).
- Tonight pass list is design B (2026-10-08, design/tonight-list.html B, built in renderTonight): rarity chips (tap a rarity = it and rarer, tap again = all; New only) in `tlFilter`; "Up next" (within 10 min: aim now) and "Later tonight" sections; each pass a .b-row card with a rarity bar, time, tier · NEW, name, rise/peak/brightness and a target button. Swipe a row right-to-left (`swipeRow`, 88 px) to reveal .b-alarm: Remind (calendar alert 10 min before; lit "Set" once on, with the alert time shown on the row), or a disabled "Too soon" for Up next rows. Each section shows 10 rows, then "Show all N ›" (tlExpanded). The first Later row peeks open once per device ('tlSwipeHint'). Tap a row for the card. Night moments (cloud, busiest, dawn) sit between Later rows.
- Milky Way, higher fidelity (2026-10-08, Sevaan: it looked low-res): js/celestial.js milkyWayModel now returns star clouds (300 soft patches of many sizes), dust (Great Rift as two lanes, the Pipe / Ophiuchus clouds, the Coalsack, 140 small dark knots) and 9,000 grains clustered around the clouds (two tints: cool, and warm toward the centre; sizes 0.65–1.5 px). sky.js draws the haze, clouds and dust with a gaussian `softSprite` (the star-glow sprite is bright only at its centre, which drew the band as a thin beam), milkyOpacity 0.62. Frame time unchanged in testing.
- Milky Way from a real photograph (2026-10-08, Sevaan: "needs to look accurate"): js/milkyway-gl.js renders ESO's all-sky panorama (eso0932a, ESO/S. Brunier, CC BY 4.0; galactic plate carrée, star-filtered with median filters, background subtracted, planet patched) from assets/sky/milkyway.webp (4096 × 2048, 126 KB) with a WebGL shader: screen pixel → ENU → galactic l, b → texture. sky.js drawMilkyWay draws it with a screen blend; strength theme.milkyPhoto 0.75 × how dark your sky is (none at star limit 3.6, full by 6.0) × night; red mode turns it monochrome red. main.js passes `gal` (galactic axes in ENU, celestial.js galAxes). The hand-drawn model stays as the fallback (no WebGL / before the photo loads); its grain, clouds and dust aren't computed once the photo is in. Credit line at the foot of Settings.
- Steady text in Explore (2026-10-08, Sevaan: "stuff jumping around"; tested by recording every fillText on the sky canvas over ~1,300 frames of panning, tilting, holding still and looking down, then flagging jumps, flicker and side swaps): ground-ring labels (drawFeet: Moon, planets, rising satellites) remember their alignment (with hysteresis) and row (`feetMem`) and glide to a new spot (20 %/frame) instead of snapping (were 15–75 px jumps); sky labels slide when they change sides and fade out over ~1/6 s when briefly blocked instead of vanishing; the two edge pointers keep the same two objects unless one is clearly (1 mag) brighter (`offPrev`). Note for testing: when the view is still the sky redraws every other frame (idle easing), so text "toggling" every frame while still is not real flicker.
- The header eye icon (camera view toggle) is gone (2026-10-08, Sevaan); camera view is only in Settings → Testing tools → Camera view (prototype).
- QA pass 2026-10-08: plan and full results in notes/QA-PLAN.md (unit tests, a Playwright sweep of 30 states × 3 phone sizes × Chromium + WebKit, three code reviews; ~40 fixes). Notable behaviour changes: typed-in coordinates are saved (observer.manual) and GPS isn't asked over them until "Use my location"; the service worker fetches the page network-first (3 s) and refreshes unversioned art in the background (cache 'sc-v2'); the Now empty-state button aims at the next pass ("Show me the next pass") rather than moving the clock; Tonight rows: Enter opens, ← reveals the alarm; "Stars, planets & Moon" is remembered ('showStars').
- Now tab (2026-10-09, Sevaan): "Seen before" is a row of mini cards (the things you've already collected that are up now, tap to aim); the "New to collect" strip is gone (new things are the "New to you" list).
- Now tab rows have no target icon (2026-10-09, Sevaan): the whole row aims, with a light pressed state.
- The sky slider is back on Explore (2026-10-09, Sevaan; briefly hidden), its ends labelled SEE LESS / SEE MORE; a new player starts halfway (19.45; 2026-10-09), anyone who has set it keeps theirs.
- Tour (2026-10-09, Sevaan): the cards are back at the bottom (top two-thirds showing, the original deck; briefly centred, then reverted); the "Match your sky" slider step is gone (2 steps + the assignment; obSkyArt / obWireSky removed); the Assignment card arrives with a gold shine sweeping across it once, then no glint stays on it (.tc.shimmer; .tc.gold .shine hidden otherwise). Toasts wrap to two lines instead of cutting off. The finish page only offers "Remind me" when that time is still ahead.
- Welcome card is truly centred (2026-10-09): the hint, Begin and the note hang below it (absolute, using --cf on .wc-stage) instead of pushing it up.
- Tour: the sky wakes up step by step (2026-10-09, Sevaan): #sky starts `.asleep` (blur, dim) behind the first card; after Allow location `obWake` unblurs it and swings the whole view ~140° into place (`state.viewSpin` → `spinView` in currentBasis, eased) with the orange bloom; after Allow motion `obControl` pulses the circle (with a finger, the sky also sways gently). No words over the sky during the tour (2026-10-09, Sevaan: the "You're in control" text, rocking phone and "Sky lined up" lines were removed). The cards stay on screen throughout (the moments play above them); obFinish always clears `.asleep`.
- Welcome card call to action under the card reads "Swipe away" (2026-10-09; still tappable), with the orange arrow just above the words.
- Motion takes over smoothly (2026-10-09, Sevaan): when the phone's sensors take over from the finger (motion just allowed, or drag mode off), `blendBasis` in main.js slerps the view from where it was to where the phone points over 1.6 s (ease in-out) instead of snapping (tested: 35° up → 85° down evenly).
- Welcome card (2026-10-09, after trying design B): the original "MISSION CONTROL · Collect the Cosmos" card (Your first mission / OBSERVER 001, Solar System art, the stat row = Step 1 Go outside / Step 2 Look up / Step 3 Collect), with the description "No telescope, no tickets. Every light that moves is a card…". Design B's three-panel art is in design/welcome-options.html if wanted again.
- Welcome card's first shake comes 1 s after it appears (2026-10-09, Sevaan; was ~5 s, then 2 s): the shake opens each 5 s cycle and the rattle clock restarts when #start stops booting.
- Welcome page has twinkling stars behind the card (2026-10-09): addStarfield(#start, 90), the same field as the reveal.
- Toasts sit above the sky slider again at night (the slider came back, 2026-10-09); by day (no slider) just above the switcher.
- Tour: the first card and the ones stacked under it are dealt in together (the whole #ob-deck slides up), not the top card rising over the others (2026-10-09).
- Patch moments (2026-10-09, Sevaan): every patch earned together shows in ONE moment (up to 9; four as 2 × 2, more in rows of three; --pw sizes them), and the moment stays 4.6 s (was 3.6 s).
- Radar tip after the tour (2026-10-09): 3 s after you tap Explore the sky on the tour's last page, a bubble beside the radar ("TAP THE RADAR" small in gold over "See what's up tonight", two balanced lines) with a pulse ring on the dial, for 5 s; tapping it opens the Now / Tonight panel on Now (like the radar); once per device ('radarTip'); waits for any panel, reveal or patch moment to clear (`radarTip` in main.js).
- Welcome page and capture reveal backgrounds use the night sky's own blues (#0c1d29 → #080f1b), not the brighter #142650 (2026-10-09, Sevaan).
- Sky slider steps back when idle (2026-10-09, Sevaan): full when Explore first shows, then `.resting` (65%) ~4 s after hud-ready; full again while touched/focused, back to 65% 1.5 s after release (`skybarRest` / `skybarWake`).
- Tour card hand-off is smooth (2026-10-09, Sevaan: it was janky): obCard keeps the cards already in the deck and promotes them (under → top, under2 → under) so their transform/filter transitions carry them up and straight; only the newcomer is built, at the back, fading in; the top card's contents are refreshed in place (the Assignment is named just before it shows); the next card starts rising 120 ms into the old one's exit.
- design/patch-earn-options.html: three ways to show earned patches over the live sky (A coins bottom right with tags → into Collection, B stitched into the sky with orbiting extras, C patch constellation). Not built.
- Steering pill under the circle (2026-10-09, Sevaan: the one long line wrapped): two lines, smaller (13px), the name small and gold on top, the move on one unwrapped line "← Turn left · 64° up W" (`setGuide`; turnHint uses the short 'up W' form).
- Patch coins replace the full-screen patch moment (2026-10-09, Sevaan; design/patch-earn-options.html A2): earned patches pop up on the left over the live sky (`.patch-coins`, flat spin + bounce, always round), each with a "Patch earned · name" tag; ~3.5 s (+0.32 s per coin) later they roll into the Collection tab and a "+N" badge pops there. Up to 5 coins (then "+ N more"); tap to skip; the sky stays usable. Still waits for the reveal / panels / Collection to close. `.patch-moment` styles remain in css/ui.css but are no longer used.
- Deep-space secrets (2026-10-09, Sevaan): Voyager 2 (Grand Tour), Pioneer 10 (The Plaque), Pioneer 11 (Ringside), New Horizons (Heart of Pluto) and the 1977 Wow! signal, at fixed RA/Dec from JPL Horizons (Oct 2026; js/secrets.js `DEEP`). Like Voyager 1, hold ~1.2 s in the circle at night to earn the secret patch (detailed art in patches.js SECRET_ART). They, and Voyager 1, are INVISIBLE until in the circle (sky.js drawSecrets skips them otherwise), so you stumble on them; an unfound secret in the circle takes it over from a background star (`state.secretInCircle`, body.secret-on hides the star's name). Voyager 2 is far south (not visible from Canada). The Patches wall reads every secret from SECRET_PATCHES.
- Patch coins sit just above any toast or standing message (2026-10-09).
- Patch coins line up with the toasts' left edge (2026-10-09). The tour lets go of its target when it finishes (obFinish clears pinnedId), so the first catch isn't left selected.
- Tap to collect (#d-cta for new finds) is a light pill like the highlighted Explore pill (orange tint, thin orange edge, orange text); pressing it flashes solid bright orange with a glow (.tapped, held ~280 ms) (2026-10-09, Sevaan).
- Found secrets leave the sky for good (2026-10-09, Sevaan): drawSecrets skips any with done (Santa, Roadster, the probes, Wow!); the UFO already never returns; the fossil still shows ("DINO BONES", a different skeleton each visit).
- Legendary cards (2026-10-09, Sevaan: the full gold wash looked flat and khaki): the navy card stays navy; a narrow warm-gold band with a bright core sweeps across as you tilt, with gold glitter masked to the band (screen blend); no picture-window foil. Backs keep their gold glint.
- Below-horizon dotted paths are 30% (bright only when lined up) (2026-10-09). Constellation completion verified end to end 2026-10-09: all stars → the gold constellation card joins the collection and a "<NAME> COMPLETE · All N stars" toast follows (it can queue behind a rank-up toast).
- Tonight shows uncollected cards like the collection does (2026-10-09, Sevaan): the full card opens without the preview flag (hidden art + teaser text) and the alarm mini cards use lockedArt for objects you don't own.
- Collection slides up like Settings (2026-10-09, Sevaan): #collection-frame translateY(100%) → 0 over .42 s, back down .32 s (.closing) when returning to Explore; fades under reduced motion.
- The switcher is two-way again, Explore | Collection (2026-10-09, Sevaan; a three-way Up in the sky | Explore | Collection was tried and removed). setSwitch still supports n items (--n/--i).
- Tour's last page lists tonight's three missions under the timeline (2026-10-09, design/tonight-missions.html A; `.od-missions`, from progressNow().missions). Toasts and patch coins wait while that page is open.
- The Tonight page opens once a day (2026-10-09, Sevaan): a returning player's first visit on a new local day shows it (`dailyTonight`, from quickStart, once tonight's plan is ready and nothing else is up); 'tonightDay' records the day; the tour's own finish counts as that day's showing.
- Loader = lock-on (2026-10-09, design/loader-variations.html 2): built inline in index.html; a satellite drifts across the whole screen (edge to edge, same speed), the ring turns orange and locks on with a pulse as it passes the centre, ~2.6 s per pass; "Loading the sky" pulses under the wordmark (.ld-sub). Stops when #start stops booting; static circle only for html.quick and a still frame under reduced motion.
- Card backs (2026-10-09, Sevaan: the rainbow looked bad and vanished at the flip): back-holo / back-glare use plain translucent colour (mix-blend-mode normal; Safari drops blend modes on an element turning in 3D), narrower and subtler bands per rarity (uncommon pastel, rare/epic holo band, legendary gold glint, gold-foil warm band + glitter, shiny gentle prism).
- Rarity rework (2026-10-09, Sevaan): every star you can see from a city is Common (bright stars incl. Polaris; constellation stars mag ≤ 3), fainter constellation stars Uncommon, no star above Uncommon (constellations.js tierFor); planets: Venus, Jupiter, Mars, Saturn Uncommon, Mercury Rare, Uranus Epic, Neptune Legendary; Moon Common, Sun Epic.
- View card (owned) button: a dark glass pill with a soft edge and muted cream text, like the switcher's inactive tab; brightens when pressed (2026-10-09).
- 2026-10-09 · Fleet cards show a "what is this fleet" fact under the launch dots (`FLEET_ABOUT` in js/lore.js, one per family in data/catalog.json). If a big grid plus the fact runs past 42em, renderCard trims the art window after mount so all cards stay the same height.
- 2026-10-09 · Constellations are mission patches, not gold cards (Sevaan). `con:` cards and SOLAR_SYSTEM are no longer in NATURAL (CONSTELLATIONS/CON_BY_ID/SOLAR_SYSTEM still exist for progress toasts and star-card charts). progress() adds one achievement per constellation (`con-<id>`, plus `con-solar`), fed by `conList()` from js/constellations.js. js/patches.js draws each as its stick figure (`conGlyph`, same projection as con-art) on a rotating night-blue twill, with the nickname along the bottom (`a.sub`). The Solar System patch is gold and sits in the Solar system group. The completion toast now reads "All N stars · patch earned"; the patch coin does the rest.
- 2026-10-09 · Collection: the card-size slider (#sizebar) is gone. The grid is fixed at 3 a row (5 at ≥700px). Tile names wrap at whole words, and `fitTileName` shrinks a long word instead of breaking it. Albums tab is now a full-width list (cover left, name + count, bar, level pill + what's next). Fleet cards drop the heading's two-line reserve, so the art is 10.2em tall; the after-mount trim still applies.
- 2026-10-09 · Patch detail (#patch-view) shows the patch on a 5:7 card (`.pv-card`: "MISSION PATCH · group" bar, patch, name, text, finish/secret chips, footer with the earned date). Flick it up to put it away (same gesture and `throwOff` as the card viewer). Twinkling starfield behind it. `.pv-body` is overflow hidden, so there's no scroll bar. The patch itself shows its group or nickname along the bottom; the date lives in the card footer.
- 2026-10-09 · Jank fixes from the playtest (Chromium at 2× CPU throttle, frame probes). Welcome card flip: the AudioContext (~130 ms to construct) is now made suspended 2.5 s after load, and a tap only resumes it. Tour start: js/milkyway-gl.js decodes the 4096×2048 photo with fetch → createImageBitmap (Image.decode fallback) before texImage2D, then does a throwaway 1×1 draw + readPixels so the first real frame doesn't pay for first GPU use. `sky.warmMilky()` builds the renderer 1.8 s into the welcome card. Result: welcome flip 142 ms → no frame over 50 ms; tour start 225 ms → one ~115 ms first sky tick (the tour deal is a composited CSS animation, so it isn't affected).
- 2026-10-10 · Playtest review at design/playtest-2026-10-09.html (live on Pages). Proposals 1–7 are built on branch `playtest-proposals`, one commit each (P1…P7, plus small b/c follow-ups), ready to cherry-pick onto main as Sevaan approves them. Items 8–23 are recommendations, not built yet.
- 2026-10-10 · Sevaan approved every playtest item except photo capture (#18). Merged playtest-proposals (items 1–7): tour target always shows Tap to collect; locked patches drawn unstitched with a progress arc + "n / goal" (`PROG` in js/progress.js, `prog` on each achievement; the detail card has a bar); patch coins go before toasts, no milestone toast at 1/10/25/50/100… cards, radar tip waits, toasts hide during a reveal; radar shows "N passing" (hidden at 0); welcome footer "Swipe away to begin"; same-name tiles get "year · #id"; ~24 picture glyphs replace text-code patch icons.
- 2026-10-10 · Playtest batch 2.
  - #8: a first night gets `STARTER` missions (first card, a satellite, a planet/Moon).
  - #23: `dealMissions` in main.js deals each night's three only from missions with a qualifying pass in the tonight worker's results. It's stored once per night in localStorage `missionDeals`; progress() takes `deals` (main + cards-page pass `readDeals()`). Precedence in `missionsOf`: starter → stored deal → plain draw.
  - #12: Tonight's "Visible" chip is now "Dark · until <dawn>".
  - #13: streak says "Week 1 · come back next week"; the flame starts at week 2.
  - #21: Atlas = all 18 constellations (id cons25 kept); Star Map retired; Zodiac is holo; long-haul patches get a "Legendary goal · years, not weeks" chip.
  - #22a: the owned-target line reads "Seen on 2 nights · 1 more for Silver".
  - #11: guideTo no longer toasts.
  - Daytime toasts sit at 80px (no slider in the day).
- 2026-10-10 · #20: tier XP flattened to 10/15/25/40/60 (was 10/20/40/80/150). `xpCarry()` in js/progress.js runs once per device (localStorage `xpCarry`). It compares old-numbers rank to new XP and stores the gap, so nobody drops a rank. progress() takes `carry` (main progressNow and every cards-page call pass it). Casual pace is now about: Spotter night 1, Tracker 3, Navigator 7, Flight Controller ~19, Mission Control ~48.
- 2026-10-10 · #22b: Tonight's sky challenge. `CHALLENGES` / `challengeFor(night)` in js/progress.js: a bonus fourth goal you can do with cards you already own (see 3 owned again, two satellites in 10 min, level a card up, a bright named star, a planet again). +50 XP, not counted toward mission patches, never on a first night. Shown on the rank card (`.lb-challenge`); main toasts "SKY CHALLENGE COMPLETE".
- 2026-10-10 · #9/#10: main.js `shareTonight` saves tonight's catchable new passes to localStorage `tonightPlan` ({at, passes:[{key,id,start,end,peakEl,dir}]}) and nudges the Collection frame (`sc:tonight`). Collection:
  - Discover's default order leads with those (soonest first).
  - The Collection filter has "Up tonight from here".
  - Mine under 9 cards (including empty) appends "Up tonight" slots (`appendUpNext`, dashed tiles with "Up 7:11 PM · SE"). Tapping one posts `sc:remind` and Explore runs `remindPass` (the .ics reminder).
- 2026-10-10 · #16: "What's this?" pill (#whatsthis, under the Next chip). `whatsThis()` names the nearest thing within 6° of the view centre: a visible satellite, Moon/planet/bright star, a named sky.json star or a plane, with "in your collection" / "line it up to collect it". Otherwise it names the constellation you're facing and the nearest named star's direction. Daylight and ground have their own lines. It shows as a toast.
- 2026-10-10 · #15: weekly recap (#recap; `weeklyRecap()` from quickStart, before dailyTonight, which now waits for it). Once per Monday-based week (localStorage `recapWeek`), only if you observed last week. Shows new cards, sightings, nights, XP gained (progress diff), rarest new find with art, streak, and the next event. "Share my week" uses navigator.share (clipboard fallback). Test with a normal launch (/), not ?resume=1 (that's the return-from-Collection path).
- 2026-10-10 · #19: rarity = difficulty.
  - js/rarity.js `difficulty(o)` scores each object: brightness at perigee 50%, reach (inclination + view radius vs where people live) 30%, night sunlight 10%, age 15%. `retier(objects)` cuts single-object cards 40/30/18/9/3%. data/catalog.json was re-tiered by `node scripts/retier.mjs` (2,855 changed; old tier kept as `tier0`). build-catalog.mjs now calls retier too.
  - ISS, Tiangong and Hubble are Rare with `icon: 1`: gold frame plus an ICON badge (`.is-icon`, `.card__icon-badge`).
  - XP carry is now `xpCarry2`: old weights on `tier0` vs new weights on new tiers, so nobody drops a rank. The info() builders pass `tier0`.
  - Result: naked-eye Legendaries 40, Epic 30; most bright objects are Common or Uncommon.
- 2026-10-10 · FIX: v0.1.431–432 had a comment swallow `a.cards++; firsts.push(...)` in progress(), so card counts and card-count patches read 0. XP was unaffected. Fixed in the next version; tests/progress.test.mjs now checks card counts again. All tests pass (natural/progress tests updated: no Solar System card, flatter XP, con-<id> patches, starter missions, carry).
- 2026-10-10 · #14: pass alerts. Server `relay/push.ts` (Val Town HTTP val + an Interval val importing its `cron`). It keeps each phone's next ≤12 alerts in std/blob, makes its own VAPID keys, and pushes alerts when due (up to 6 min early). Client `js/push.js`: `PUSH` = the val URL (EMPTY until Sevaan deploys; the Settings row #row-push stays hidden until then). It handles enable/disable/schedule. iPhone needs the app on the Home Screen. main `shareTonight` schedules up to 6 bright/new passes in the next day, ≥30 min apart, 5 min ahead. sw.js has push + notificationclick handlers.
- 2026-10-10 · Sevaan: removed the What's this button ("I shouldn't have to tap to learn what something is. Just put the target on it."). The circle labels any named star that isn't a card (`renderIdent`, reusing the #plane label: "A star · Mirfak · Magnitude 1.8 · not a card"), at night, when no target or plane is in the circle. Pantheon is now 15 Legendaries (was 25; id kept).
- 2026-10-10 · Pass alerts deployed. Val `sevaan/space-collector-push` (public, free plan): main.ts = relay/push.ts (HTTP, URL in js/push.js `PUSH`), cron.ts = `import { cron } from "./main.ts"; export default cron;` on a 15-minute cron (the free minimum). Alerts go out up to 14 min early; titles say the pass time ("ISS at 9:41 PM"). VAPID keys live in the account's std/blob "sc-vapid", subscriptions in "sc-subs". The Settings → Pass alerts row is now visible. If relay/push.ts changes, paste it into the val's main.ts.
- 2026-10-10 · Phone stuck on the loader after rapid deploys. Likely cause: the single shared SW cache plus a slow page fetch (3 s fallback to a cached older index.html) let a page meet mismatched module versions. The versioned branch also deleted "older versions" of each file. Fixes:
  - sw.js now has one cache per version (`const CACHE = 'sc-<version>'`, stamped by scripts/bump.mjs). activate deletes the others; no per-file pruning; page timeout 5 s.
  - Loader watchdog (inline script in index.html, #ld-reset): if still booting after 12 s, or a script error/rejection happens while booting, a "Still loading? Tap to reset and reload" button appears. It clears all caches, unregisters the SW and reloads.
- 2026-10-10 · Sevaan: no rescue button on the loader ("this is just a loader… it should just work"); removed. Still stuck after clearing website data, so it's not the cache. TEMP diagnostics: main.js boot() sets `window.__boot` per step, and an inline script in index.html sends errors + step + UA to the push val's `/diag` (logged as "DIAG …" in Val Town) if still booting at 10 s. Remove both once the cause is found.
- 2026-10-10 · FOUND the loader hang. The /diag report from Sevaan's iPhone (iOS 26.6 Safari) said main.js failed to load with boot step "none": an import couldn't be fetched. js/push.js (added v0.1.432) is the kind of URL content blockers and filter lists block ("push.js" notification spam). Renamed to js/pass-alerts.js. Rule: avoid file names like push / ads / track / analytics / beacon in js/.
- 2026-10-10 · Confirmed: the rename fixed Sevaan's phone. Temporary diagnostics removed (index.html inline beacon, window.__boot markers, the val's /diag route, here and on Val Town).
- 2026-10-10 · Pass alerts setup failed on the phone because I broke the val while removing /diag: the editor had reformatted the line, and a partial delete left a syntax error, so /vapid returned 500 from 9:54 to 10:00. Restored by pasting relay/push.ts whole. Lesson: when editing the val, replace the whole file from relay/push.ts, never patch lines. The client now prefetches and validates the VAPID key (localStorage `vapidKey`), and failures toast the step and reason.
- 2026-10-10 · Removed the Sun's dashed orange guard ring by day (Sevaan).
- 2026-10-10 · Accounts and cloud backup.
  - Firebase project `space-collector-91cc7` on Sevaan's PERSONAL Google account (sevaan@gmail.com). Never mix with roundtrip.ai.
    - Web app registered; config is in js/account.js (public by design).
    - Auth: Google + email link (Email/Password is on only because the link needs it; the app never asks for a password). Authorised domains: localhost, sevaan.github.io.
    - Firestore (Standard, nam5, Spark free plan). Rules allow only `users/{uid}/**` for request.auth.uid == uid; unauthenticated reads verified denied.
  - js/account.js loads the Firebase SDK from gstatic (12.4.0) only when signed in or completing a link.
    - Sync merges IndexedDB ↔ `users/{uid}/sightings/{cloudId}`. cloudId = time + FNV hash of time|card|object. Local records get `synced`/`cloudId` (store.js `putSighting`).
    - Deletions propagate via `synced`, plus an offline tombstone list (localStorage `acctDeleted`). `sim` sightings never sync.
    - A few localStorage progress keys (secrets, fossilFound, ufoFound, missionDeals, xpCarry2, patchSeen) are merged into `users/{uid}.state`.
  - UI: Settings → Account row + #set-acct-sheet (Continue with Google, email link, and for iOS Home Screen apps a paste-the-link fallback, since the emailed link opens in Safari).
  - main: `pushSighting` after every save, `initAccount` at boot (not awaited); cards-page `removeSighting` after a delete.
  - Sign in with Apple waits for the Apple Developer account.
- 2026-10-10 · The Firebase web key (GitHub secret-scanning alert, expected: it's public by design) is now restricted in Google Cloud to HTTP referrers sevaan.github.io/*, space-collector-91cc7.firebaseapp.com/* (Firebase's auth handler) and localhost:8765/*, plus Firebase's default 25 APIs. Verified: an allowed referrer works, other sites get 'Requests from referer … are blocked'. Native apps will need their own iOS/Android-restricted keys. Close the GitHub alert as 'Won't fix'.
- 2026-10-10 · Pass alert wording (Sevaan: "who cares about the degrees"). `alertText(p)` in main.js.
  - Title says what it is: "A 1981 Soviet rocket stage at 9:51 PM", "A 1979 American weather satellite…", "A piece of 2000s space junk…", "A new Globalstar launch to stamp…", "The Space Station…". Year + owner adjective (Soviet before 1992, Russian after) + a short purpose word from a name-prefix table (`PURPOSE_WORD`).
  - Body: "<Name> rises in the <direction word> and <climbs halfway up / climbs high / passes almost straight overhead / arcs high into the west / skims low across the south>." Then "New to your collection." / "A Rare card you don't have yet." / "A launch you haven't stamped yet." No degrees, no compass abbreviations.
- 2026-10-10 · Background music: "Permafrost" by Scott Buckley (CC BY 4.0; credit in Settings → About's credit line, as the licence requires). assets/audio/permafrost.m4a: AAC 96k, loudness-normalised to -20 LUFS, 7:29, 5.5 MB; the track fades out at its end, so the loop breathes. js/music.js:
  - Web Audio gain at 0.3, because iOS ignores media-element volume. `navigator.audioSession.type = 'ambient'`, so the silent switch mutes it and the player's own music keeps playing.
  - Starts on the first pointerdown with a 4 s fade-in. Ducks to 35% during card reveals (main: `duckMusic(true)` before playReveal, back on dismiss). Pauses when hidden.
  - Settings → Music switch (localStorage `music`, default on).
- 2026-10-11 · Sound effects shipped: Sevaan's picks from sound board v2 (artifact https://claude.ai/artifact/2x9kXoCwcASZCxK2521JpC). All are the designed set (scripts/sfx-synth.py, G major pentatonic to match "Permafrost") except toast = "Notification Sound 2" by deadrobotmusic (Freesound 750608, CC0), softened.
  - Picks: D1 for most; D2 for collect, r_epic, r_legend, shiny, levelup, xp, mission, rankup, complete. lock = a new short glass tik (Sevaan: you lock on to several things in a row), plus a 260 ms repeat guard.
  - Files: assets/audio/sfx/<event>.mp3 (27 files, 736 KB, 128k, silence trimmed).
  - js/audio-ctx.js: one shared AudioContext with audioSession 'ambient'. js/sfx.js: decoded buffers, `sfx(name, {gain, gap, delay})`, loaded on first tap, off when Settings → Sounds is off. music.js uses the shared context.
  - Where each plays:
    - lock = snapTick; collect = d-hit tap; welcome = welcome flip; swipe = welcome swipe-away, reveal flick, viewer flick.
    - arrive = reveal step 1 (and 0.7 on owned-card view); flip = sealed card flip and every double-tap flip (card.js attachFlip).
    - Stinger by tier (r_common…r_legend) for a new card; seen for a repeat; stamp for a new fleet stamp; levelup and shiny layered on top.
    - xp = rank-bar count-up ticks (gap 75 ms); patch = first coin; coinroll = coins roll out.
    - Toasts via toast.js `onTicketShown`: rank → rankup, mission/sky challenge COMPLETE → mission, other COMPLETE → complete, else toast.
    - secret / fossil / ufo on finding; step = tour cards and the Collection switch; toggle = Settings checkboxes.
  - The old oscillator tones (chirp/thump/whoosh/fanfare/thud) are gone.

2026-10-11 · Daytime planets: by day only Venus can show, and only when it is 30°+ from the Sun (sky.js sunSep), at 60trength; other planets fade with daylight. Sevaan asked why Venus showed by day (it was 20° from the Sun, near inferior conjunction).

2026-10-11 · Motion without the tap: quickStart now listens quietly (trySensorsQuietly in sensors.js) and skips the "Tap anywhere" banner if motion events arrive within ~1.2s. The tap fallback now asks on touchend/click (iOS ignores pointerdown as a gesture) and keeps retrying instead of dropping to drag mode after one failed try. Sevaan saw the tap toast despite having granted motion.

2026-10-11 · Sound pass: every effect plays at half level (sfx.js LEVEL 0.5) times a Settings "Sound volume" slider (localStorage sfxVol); "Music volume" slider (musicVol) scales music.js LEVEL. Collection-switch sound removed. New `page` sound (soft paper slide, sfx-synth.py D[page]) on sideways swipes between cards in the collection viewer. Run one event with `python3 scripts/sfx-synth.py OUT page`.

2026-10-11 · Clouds rebuilt: js/clouds-gl.js is a WebGL cloud deck (view ray → flat deck, domain-warped fbm, threshold by forecast cover, lit toward this.sunEnu, horizon haze), drawn at 0.75 scale in sky.js drawWeather with CLOUD_LIGHT colours for day/dusk/night; the old blobs remain as the no-WebGL fallback. A 2D sprite attempt looked like cut-outs and was dropped. Sevaan: daytime clouds "need higher fidelity".

2026-10-11 · Cloud shimmer near the horizon: LOD now grows with distance (×(1+0.35·dist)), dropped octaves are replaced by their mean, a second half-pixel-lower sample is averaged where the deck is edge-on (dist>2.5), and the horizon haze/fade starts higher (0.02–0.14). Measured shimmer in the horizon band ~40% lower. Gotcha: a // comment inside a one-line GLSL loop swallowed the closing brace, so createCloudGL returned null and the app silently fell back to blobs; test with scratchpad pw/glerr.mjs.

2026-10-11 · Below the horizon is always a dark-site sky: BelowModel/lookBelow in orbit.js sweep the catalogue (1/40 per frame, only while looking down) for sunlit satellites with stdMag ≤ the dark-site limit (skyLimit SB_MAX), judged as if overhead, not at true range (true range gave ~0 at night). sky.js drawBelowSky draws them as small satGlow-coloured dots plus stars to the dark-site star limit; the circle names them via drawBelow (kind dot). Planet mag>2 filter dropped. ~3,800 far-side sats at once; thin with a stdMag cap if it reads too busy.

2026-10-11 · Far-side satellites thinned: only stdMag < 3 (BELOW_SAT_MAG 2.9 in main.js), ~300 under the whole horizon instead of ~3,800. Sevaan: "definitely too many".

2026-10-11 · Far-side satellites are now their icons (iconKind, 13–16px, t.sat) shown only in a halo round the circle: full within 1.4× ring radius, fading out by 3.2× (drawBelowSky), so looking down and sweeping reveals them.

2026-10-11 · Below-horizon satellites made consistent: tonight’s upcoming passes and the halo satellites share one icon size (BELOW_ICON 13 in sky.js) and real icons (iconKind); dashed rings only on Sun, Moon and planets; a pass is never drawn twice (halo list skips pass ids). Sevaan asked why some had dotted circles and were smaller.

2026-10-11 · Below-the-horizon circle info: for a far-side satellite it shows collection status in the kicker, a plain description (describe(o) in main.js, factored out of alertText) and "N km away · over you at TIME" (belowInfo: 1-min scan of the next 12 h for el>10, cached a minute for the one in the circle; sky.belowHitId tells main which one). "Over you" means above the horizon, not necessarily visible.

2026-10-11 · Below-horizon circle adds a place line: "Over the North Pacific · 850 km up · 26,800 km/h" (overEarth in orbit.js: sub-point, height, speed; placeName in js/geo.js: hand-drawn coarse continent/island outlines, then Arctic/Southern Oceans, Mediterranean, Gulf of Mexico, Caribbean, N/S Atlantic, Indian, N/S Pacific by rule; tests/geo.test.mjs).

2026-10-11 · Below-horizon circle trimmed (Sevaan): height, speed and distance removed. Now: kicker with collection status, name, description, and one line "Over the North Pacific · in your sky at 4:14 PM" (or "not in your sky for 12+ hours"). overEarth still supplies the place. Options board: design/below-info.html.

2026-10-11 · Volume halved again (Sevaan): sfx.js LEVEL 0.25, music.js LEVEL 0.15; the Settings sliders still scale on top.

2026-10-11 · Daytime satellites (Sevaan): while the Sun is above −6°, bright sunlit satellites overhead (stdMag ≤ BELOW_SAT_MAG, from state.items) show like the far-side ones: halo icons (dark navy on the pale sky) and, in the circle, "HIDDEN BY DAYLIGHT · NOT COLLECTED YET / name / description / Over X · see it tonight at TIME (or not visible tonight)" in dark ink with a white glow. Not collectable. main.js daySats, sky.js drawDaySats; the shared pieces are sky.js drawHalo and ghostHit (drawBelow uses ghostHit too). The until-dark countdown hides while one is named, and now shows seconds ("6 h 5 min 54 s until dark"; only a new minute rolls).

2026-10-11 · Daytime bad-weather chip shortened to "RAIN TONIGHT · CLEAR THU" (no "Not tonight:" key, no "See the plan"; npChip skips an empty key) and made nearly solid by day (92%, lighter muted text). Sevaan: "Not tonight: Rain all n… · See the …" wasn’t readable.

2026-10-11 · Monetisation decisions (design/plans.html): one plan, Space Collector Plus (~$2.99/mo, $19.99/yr, $39.99 lifetime); the sky, every card, patches and missions stay free; no catch limits, energy, paid XP, loot boxes or ads. Plus = pass alerts, the next 7 nights, binocular mode, cosmetics, and the new ideas (widget/lock-screen countdown, Watch tap, shiny forecast, observer stats + yearly poster, saved places/trip planner, extra music; perks: Founding Observer patch, 7-day trial, family sharing). Cloud backup stays free. When the native apps ship, the public web version comes down (kept as Sevaan’s testing build), so Plus is sold only via Apple/Google (RevenueCat keyed to the Firebase uid). Still open: the BOTH rows, any limit (suggest reminders per night or none), trial length.

2026-10-11 · Plus groundwork: js/plus.js `isPlus()` (today only localStorage plusTest via Settings → Testing tools → "Plus (testing)"; RevenueCat sets it in the native apps), `onPlus`, `PLUS_PERKS`. Settings → Account has a "Space Collector Plus" row (Free / Plus ✓) opening #set-plus-sheet (perks, the tapped perk first, "coming" tags, disabled "Coming in the app" button). Binocular mode and Pass alerts carry a PLUS tag; turning either on without Plus opens the sheet; when Plus ends both are switched off (setBinoculars in main.js). state.binoculars starts off without Plus.

2026-10-11 · Native shell started: native/ (Capacitor 8, iOS via Swift Package Manager, no CocoaPods). `node native/copy-web.mjs` copies the web app into native/www (the web app stays build-free); `npm run ios` in native/ = copy + `npx cap sync ios`. iOS project native/ios/App (appId io.github.sevaan.spacecollector): Info.plist has location, motion and camera strings, portrait only, light status bar; dark #080f1b splash; the 1024 icon is the old red 512 icon upscaled (needs a real icon). Builds for the simulator (xcodebuild … -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO). Known native gaps: the planes relay and the Firebase key only allow sevaan.github.io/localhost (native origin is capacitor://localhost); web push/service worker don’t apply in the app (native notifications later); purchases need RevenueCat + the Apple Developer account. Xcode 27 needed `sudo xcodebuild -runFirstLaunch` (CoreDevice/Mercury mismatch crash).

2026-10-11 · Native location: js/native.js (`isNative`, `plugin(name)` via the bridge’s Capacitor.nativePromise, since core’s registerPlugin isn’t loaded without a bundler; `getPosition`). requestLocation uses it, so the app shows only the iPhone prompt (the web view’s getCurrentPosition stacked a second "localhost would like to use your location"). Plugin: @capacitor/geolocation@8 in native/. Motion and camera web prompts are auto-granted by Capacitor’s WebViewDelegationHandler. Console from the simulator: `xcrun simctl launch --console-pty <device> io.github.sevaan.spacecollector`.

2026-10-11 · Android shell: native/android (Capacitor 8), location/camera permissions, portrait. Build needs Java 21 (the location plugin’s toolchain; Android Studio ships Java 25, too new for Gradle 8.14): Temurin 21 unpacked to ~/.jdks/jdk-21*/ (Homebrew here is an old Intel install and failed). Build: `cd native && npm run android && cd android && JAVA_HOME=$(ls -d ~/.jdks/jdk-21*/Contents/Home) ANDROID_HOME=~/Library/Android/sdk ./gradlew assembleDebug`; emulator AVD Medium_Phone_API_37.0; install with adb. iPhone: Personal Team D6XL5H68G8 (Sevaan’s own, never the Roundtrip team), build with `-destination id=<udid> -allowProvisioningUpdates`, install with `xcrun devicectl device install app`; free-team installs expire after 7 days.

2026-10-11 · Native sign-in (Sevaan asked): Firebase iOS app registered (io.github.sevaan.spacecollector, GoogleService-Info.plist in native/ios/App/App, added to the target by hand in project.pbxproj); @capacitor-firebase/authentication@8 (SPM, trait Google only, skipNativeAuth, providers google.com; capacitor.config.json experimental.ios.spm). account.js: in the app, Google sign-in uses the native sheet (plugin signInWithGoogle → signInWithCredential on the same Firebase web session) and initializeAuth with indexedDB persistence (no popup resolver); email links land on the website (LINK_HOME) and the app takes the pasted link. Browser key now also allows capacitor://localhost/* and https://localhost/* (confirmed by curl; Google asked to type UPDATE because the key showed attempted Maps API traffic, already blocked by the 25-API restriction). Relay allows capacitor://localhost and https://localhost (Val Town updated). Pass alerts row hidden in the app. CFBundleName "Space Collector" (the Google prompt said "App"). Android Google sign-in not set up yet (needs the Android app registered in Firebase + debug/release SHA-1 + google-services.json).

2026-10-11 · Android sign-in: Firebase Android app registered (io.github.sevaan.spacecollector, debug SHA-1 8C:C2:…:E7:68 from ~/.android/debug.keystore); native/android/app/google-services.json; variables.gradle rgcfaIncludeGoogle = true. On the emulator the plugin reaches Google (GetGoogleIdOperation ok) and says "No credentials available" because no Google account is on it; the app now says to add one. The release keystore’s SHA-1 must be added before Play. iOS key restricted to iOS apps → io.github.sevaan.spacecollector. Emulator: start with `-gpu host -no-snapshot` (default boot froze System UI).

2026-10-11 · All three Firebase keys are restricted: Browser key → HTTP referrers (sevaan.github.io, firebaseapp.com, localhost:8765, capacitor://localhost, https://localhost), iOS key → iOS app io.github.sevaan.spacecollector, Android key → io.github.sevaan.spacecollector + debug SHA-1 only. When a release/Play signing key exists, add its SHA-1 to BOTH the Android key and the Firebase Android app, or release builds fail to sign in.

2026-10-11 · Music on open in the native apps (isNative → startMusic + loadSfx 1.2 s after boot; Capacitor allows playback without a gesture); the web still starts on the first tap. Welcome card shake sound `rattle` (sfx-synth.py D[rattle] d1: five soft card taps at the CSS wobble times + felt knock + faint glass glint; d2 plain), played on the holder’s animationstart/animationiteration for wcRattle.

2026-10-11 · Sign-in moments built (design/auth-moments.html): one sheet #auth-sheet (main.js openAuth(mode): restore / first / night / collection; APPLE_SIGNIN=false hides the Apple button until Sign in with Apple exists). Welcome card link #wc-signin ("Already collecting? Sign in to restore your cards", hidden once signed in or after the flip); restore pulls the cloud collection and, if there are cards, skips the tour (quickStart). maybeAskSignIn after a reveal closes and after the tour finish: once after the first card (localStorage authAsked=1), once more after a night with 3+ cards (authAsked=2), never again. Collection #backup-line ("N cards · not backed up · Sign in ›", cards-page renderBackupLine; posts {sc:"signin"}; hides on the acct storage event). TEMP header ⏱ #peak-toggle: jump to the busiest moment tonight / back to now, hides the "Sky at … back to now" message while on; remove before launch. Standalone/native (html.standalone, set by an inline head script): --safe-bottom = max(6px, inset − 20px) so the switcher and toasts sit lower without Safari bars; sendInsets passes the same value to the Collection frame.

2026-10-11 · Switcher taller: .sc-switch height 54px (was 46, Sevaan: bigger target); #skybar bottom 86px and day toasts 88px so they stay clear of it (12px gap verified).

2026-10-11 · FIX: GitHub Pages failed every deploy from v0.1.473 to v0.1.480 (site stuck at 0.1.472): Jekyll crashed on the dangling symlink native/ios/App/CapApp-SPM/symlinks/CapacitorFirebaseAuthentication (made by cap sync for the Firebase auth plugin). Removed it from git (ignored; cap sync recreates it) and added .nojekyll so Pages serves files as-is. After a push, check `curl -s https://sevaan.github.io/space-collector/version.json` matches.

2026-10-11 · Free star limit (decided, design/plans.html): 5 new star cards a night (STAR_NIGHT_LIMIT, main.js newStarsTonight/starLimitHit: counts cards whose first sighting was tonight and key starts star:; none on your first night; owned stars never count; Plus removes it). Over the limit the circle still names the star, d-sub says "5 new stars tonight · it will be here tomorrow", the button reads "Plus: no nightly limit ›" (opens the Plus sheet), tapping the circle only toasts. PLUS_PERKS gained "Unlimited stars".

2026-10-11 · Star limit REMOVED (Sevaan: everything playable and free; Plus only adds extras). No collecting limits of any kind.

2026-10-11 · All 88 IAU constellations (scripts/build-constellations.mjs SET: the original 18 + 70 with English meanings; Ursa Major added as the whole Great Bear beside the Big Dipper). 89 constellation patches, 744 collectable stars (was 199); every constellation keeps at least its two brightest stars even if fainter than 5 (Mensa). Atlas (cons25) = any 18 complete; new Half the Sky (cons44, holo, "Legendary goal") = 44. Southern ones are not visible from Canada, like Voyager 2.

2026-10-11 · Deep sky: 16 cards (natural.js DEEP_SKY, key deep:<id>, type deepsky, set "Deep Sky" in sets.js): Pleiades, Hyades, Alpha Persei, Orion Nebula, Beehive, Double Cluster, Ptolemy, Coathanger, Andromeda, Hercules, Lagoon, Carina, Omega Centauri, LMC, SMC, Triangulum. Visible when el > 12°, Sun < −12° and obj.need (+0.6 × extinction) ≤ tonight’s star limit, so the slider and twilight decide. Positions via state.deepEnu (pushed into the extra targets). Sky: faint glows (sky.js drawDeep; ovals for galaxies, pink haze for nebulae, specks for clusters) only when visible. Card art: its constellation chart with the object as a glow ringed in orange (con-art.js mark). Patches Deep Sky (3) and Island Universes (10, gold). Comets: not built yet.

2026-10-11 · Comets: limited-time Legendary cards. js/comets.js (cometAt: Kepler/Barker/hyperbolic solver from JPL elements q,e,i,om,w,tp + brightness M1 + 5log Δ + K1 log r; checked against C/2023 A3: Δ 0.47 AU at closest approach). data/comets.json from scripts/build-comets.mjs (JPL SBDB, comets with perihelion within a year that peak at mag ≤ 6), refreshed by the daily catalogue workflow. loadComets registers them into NATURAL (static import: a dynamic import with an unstamped ?v made a second module copy). Collectable when mag ≤ 6, el > 4°, the sky dark enough for its brightness (brightLimit − 3) and need ≤ star limit. Set "Comets", card art cometArt (con-art.js). Today no comet qualifies, so the list is empty; the first one will appear automatically.

2026-10-11 · QA fixes, batch 1:
  - Fields ≥ 16px (iOS zoom), no long-press text selection on chrome, sighting row "time · place", iOS launch screen navy.
  - Location asks for approximate only (checkPermissions → requestPermissions coarseLocation; falls back to high accuracy if low accuracy times out). Fixed the Android "change to precise?" loop.
  - Native plugins (native/): @capacitor/app, share, filesystem, local-notifications, haptics, status-bar. js/native.js: onNative, shareFile, saveFile, haptic, notifyAt/cancelNotify, nativeChrome.
  - Share card / Export / every reminder: native share sheet, Save to Files, local notifications in the app (setReminder/reminderToast in main.js; bells light only on success and turn the notification off); web keeps Web Share / downloads / .ics. The false "Added to your calendar" is gone.
  - Android Back (handleBack): sheet → recap → reveal → panel → Collection (frame closes its viewer/patch on sc:back) → time travel → minimize. Verified on the emulator.
  - buzz() → native haptics (tick/thud/success); collect thud; celebration on a first Epic/Legendary.
  - Android: navy splash and window, transparent bars with light icons, fontScale in configChanges, icon background navy (icon art still the template). No service worker in the apps. Audio suspends in the background.

2026-10-11 · QA fixes, batch 2:
  - Accessibility: Settings switches/sliders named after their rows; decorative icons aria-hidden; Collection tab role=button; the circle is announced through a hidden live region (#sr-target, announceTarget in renderTarget): "Name, Rarity. Double-tap to collect."
  - Sheets close with a swipe down (pointer drag on .set-sheet-card; inner lists keep pan-y).
  - Red night mode guaranteed: body.night::after multiplies the whole screen by pure red (both pages). Measured: blue 0, green ≤ 12. 60 fps kept. Native select popups (system UI) are the only thing it cannot reach.
  - Android text size: MainActivity caps the web view text zoom at 115% of normal (follows the setting up to that), live without reload.
  Still open: real app icon + splash art, iOS Dynamic Type (no effect, layout safe), share/notifications untested on a real device.

2026-10-11 · App icon = option A "Lock-on" (design/icon-options.html): iOS 1024 AppIcon, web icons 180/192/512, Android legacy + round mipmaps, adaptive foreground (art in the 66/108 safe zone) on navy, and a monochrome layer for themed icons; iOS splash = navy with the mark. Exports came from the board via Playwright (scratchpad pw/iconexport.mjs).
2026-10-11 · Switcher 62px (Sevaan asked again; was 54); #skybar bottom 94px, day toasts 96px, night toasts/target 156px (216 with the target card). Gaps: slider 12px above the switcher, toasts 18px above the slider.

2026-10-11 · FIX: the high-accuracy retry in getPosition asked Android for precise location (the prompt came back); it now retries only if precise is already granted. Verified on the emulator, which also showed "Just a plane" working in the app (relay accepts https://localhost).

2026-10-11 · Confirmed on Sevaan’s iPhone 14: native share sheet and pass-reminder notifications work.

2026-10-11 · Switcher above the Collection: #nav moved out of #hud to a body-level sibling (a fixed #hud is its own stacking context, so no z-index could lift it); body.col-open keeps it at z 70 while the frame slides in, sits, and slides out; the frame hides its own copy (html.embedded .bottom-nav); Explore on the shared switcher closes the Collection. Week ahead (Plus): Week tab, tonight-worker run for 6 more nights at 2-min steps (requestWeek, nightSummary, renderWeek, best night), weather now 7 days. Shiny forecast (Plus): planner records eclipseAt/moonSep per pass; shinyChances in Tonight (free players get a teaser line). Observer stats (Plus): js/stats.js (totals, nights by month, map from geo.js LAND, rarest finds, longest run, best night, "Your sky in YEAR" poster via share sheet), link under the rank card, #stats-view. Saved places dropped from the plan (Sevaan).

2026-10-11 · v0.1.509–511, one batch:
- **Sign-in:** `setAcct()` in account.js records the user as soon as a sign-in call resolves. A sync that started before onAuthStateChanged ran used to find no account, which showed as "nothing to restore". Restore results now stay in the sheet via `authResult()`: restored / "No cards on this account yet" / "Couldn't reach your backup", with "Use a different account". `signInError()` gives plain-word errors.
- **Sticky toasts:** `ticket({ sticky: true, action, go })` in toast.js stays up until tapped or closed with its ✕. At most two show; normal toasts keep queueing above them.
  - Sticky: the Tonight ticket, rank up, a pass you picked to follow, the next bright pass, the compass nudge, and errors (save, storage, share image, sync, pass search).
  - The radar tip stays up too, with a ✕, and never shows once the radar list has been opened.
  - Patch coins stay 7 s, sit under the radar, and a tap sends them on.
- **Not tonight:** the daily Tonight page no longer opens on its own; it's a sticky TONIGHT ticket. The bad-weather page is design/not-tonight-combined.html, built in `renderNotTonight()`:
  - seven nights with cloud bars, from weather.js `nights` (now with cloud/clearFrom, plus temp and wind);
  - the next good night planned by `planNight()`, a one-off tonight-worker run: bright/rare passes in its first 5 h of dark, new to you, busiest, and the reminder;
  - the 3 best passes above the cloud this evening;
  - Collection / closest patch / preview-that-sky tiles.

  Missions carrying over to the next clear night is NOT built (it would be a scoring change).
- **Switcher:** 72px. Slider, toasts and target moved up 10px. It now sits under overlays (z 19), so the reveal covers it, and it hides while a Collection dialog is open (sc:modal message).
- **Reveal:** the card is centred; the rank bar and "View in collection" are anchored to the bottom of the screen.
- **Plus sheet:** moved to body level, so it opens from the Week tab. Escape closes any sheet. The restore link is hidden for players who already have cards.
- **Sounds:** new `plane` (soft double buzz on "Just a plane"); `coinroll` is now "Swoosh down + tap". Variants are in design/sound-picks/ (scripts/sfx-synth.py).

2026-10-11 · v0.1.512: Collection's Discover tab hidden (Sevaan). The Discover view stays: Albums set taps, the empty state and unowned-card links open it, and the Albums tab stays lit there.

2026-10-11 · v0.1.513 pass alerts (Sevaan):
- **Rules:** `alertPicks()` alerts only for cards new to you, never 11 pm–7 am, at most 3 a night, rarest first (Legendary > Epic > Rare, then famous icons, brightness, height), 30 min apart. Common, Uncommon and fleet stamps are only alerted once fewer than 10 Rare-or-better cards you don't own are left in the catalog.
- **Wording:** no more "New to your collection"; Rare and up put the rarity first: "Epic · A 1990 American space telescope at 9:02 PM".
- **Native:** the app now has the toggle too. It schedules local notifications (ids 7101–7103), replaced whenever tonight's plan is recalculated.
- **"from Space Collector":** iOS adds this line to Home Screen web-app notifications; native notifications don't have it.

2026-10-12 · v0.1.515, Sevaan's decisions on the playtest-room report (design/playtest-room-2026-10-11.html):
1. **Binocular mode is free:** no Plus gate, no PLUS tag, removed from PLUS_PERKS. With binoculars on, faint planets use the star limit + 3 (`naturalTargets` binoLimit), so Neptune and the gold Solar System patch are possible.
2. **Clouds stay honour-system, and the copy now agrees:**
   - the bad-weather page title is "Foggy/Rainy/Cloudy tonight." (not "Not tonight.");
   - a new line under it: "If you spot a gap, anything you can see still counts";
   - the above-the-cloud note and the Tonight tab line say gaps count.
3. **Pricing:** on hold until the end.
4. **Pass alerts are time first:** "9:02 PM: an Epic card flies over" / "Hubble, a 1990 American space telescope. Look south: it climbs high." Fleets: "9:02 PM: a new Starlink batch flies over" / "One more for your Starlink card. …"

2026-10-12 · v0.1.516 bug sweep from the playtest-room report (design/playtest-room-2026-10-11.html).

**Wording and progress fixes:**
- Solar System toasts say "worlds"; the milestone says "Your first card!" and "N cards collected".
- Streak weeks are 7-day blocks from your first night (Sunday then Monday is week 1, not "2-week streak").
- Silver/gold patches now match card levels: 3 and 10 nights, and gold3 counts 10-night cards.
- `lightLeft` gives "~5,473 BC" instead of "-5474 AD".
- Names (`titleCase` / `titleFor`): acronyms stay in capitals (PSLV, DMSP, …), as do letters run together with digits (5D, F18). Square-bracket notes are dropped ("[Tank]"). "Kick Stage R/B" no longer becomes "… Stage Rocket Stage". Fleet members take the card's name ("Amazon Leo 00100").
- Recap: skipped for a one-night week; shows the shower's peak date (events now carry `peak`); "rarest find" ties prefer deep sky and planets, then stars, and the Sun comes last.

**Sky and catalogue fixes:**
- **The Sun:** now Rare, and a sticky "THE SUN · Never look straight at it" ticket shows on the first aim each session.
- **Tour arrow:** uses the target's live position (it contradicted the guidance pill).
- **Station twins:** objects with identical elements to a station are dropped in build-catalog.mjs, and removed from data/catalog.json now. Seven gone: ISS Zvezda/Destiny/Poisk, CSS Wentian/Mengtian, Shenzhou-23, Tianzhou-10.
- **Comets:** drawn in the sky with a tail pointing away from the Sun (sky.js `drawComet`). They now need mag + 1.2.
- **Deep sky:** the Coathanger needs 6.0 (binoculars); bright clusters need 8° altitude, not 12° (M7).
- **Visibility:** named stars use extinction. By day the Moon needs ≥15% lit and ≥30° from the Sun. Planets other than Venus need 6° in twilight.
- **Planes:** a plane nearer the circle's centre beats a star, planet or deep-sky target. Satellites still win.
- **Lore:** 95–100° orbits are called sun-synchronous (not "against Earth's spin"); fleet age counts from the first launch.
- **Sky slider:** the readout is in plain words ("about 3,500 stars"), with daylight and twilight cases.

**App behaviour fixes:**
- Reminders persist (localStorage 'reminders', unique ids), so they no longer overwrite each other and bells stay lit.
- A sticky "EXAMPLE LOCATION · Set yours" ticket appears when the sky is Peterborough's.
- Collection: "Clear filters" is hidden on Patches; cards are deduped by key (Dubhe was counted twice).
- The reveal card sits above the confetti.
- Toasts enter over 380 ms with less bounce and leave with a 180 ms fade.
- Planes don't poll while the app is hidden.

**Not done** (not reproduced or riskier): rank bar lagging a catch, shiny toast one catch late, the solar-noon night key, the radar "passing" vs Now count.

2026-10-12 · v0.1.517 the calm catch (playtest room #1, "everything lands at once"):
- **Chips on the reveal:** what a catch earned (missions +50, patches, event badge, new rank) shows as chips under the reveal header, one every 260 ms after the card lands (`playReveal({ earned })`, `showNews`). They stay on one row: the two biggest, then "+N more". `announceProgress(g, delay, { onReveal: true })` skips those tickets; the plain repeat-view flow still uses tickets.
- **Patch coin:** one coin with "+ N more", sitting over the radar (top: safe-top + 92px), clear of the circle and the target name.
- **Tickets:** a catch drops the waiting stickies (tonight, rank, sun-safety, guide). The rank ticket has id 'rank', so a new one replaces the old.
- **Sign-in ask:** moved from the first card to the third ("N cards so far").

2026-10-12 · v0.1.518 cards that read (playtest room #4/#6/#7/#9):
- **Rarity:** one shape per tier (● Common, ▲ Uncommon, ◆ Rare, ✦ Epic, ★ Legendary), and Epic is now magenta #e46ad6, since violet matched blue for deuteranopes. The card gem and tile tier use the tier colour (`--tier`); red night mode stays red and the shape carries the tier.
- **Levels:** silver cards get a bright double ring, gold a gold frame and glow. The footer says "SILVER · 7 NIGHTS" (`seenLine`). Tiles get `lvl-silver`/`lvl-gold` and a corner badge. (The old "silver on every rarity" rule had hidden all of this.)
- **Collector number:** "129/716" sits above the brand in the footer (from `setNumber`/`setSize`).
- **Rocket stages and debris:** same-name ones get `runNo`/`runOf` in buildCards (oldest first). The identity row says "Carried Cosmos 80 · 1965" (debris: "Debris · year"), and the identifier says "NO. 14 OF 286" instead of NORAD. The art is unchanged: stages are still drawn with a flame (that needs new illustrations).
- **Shiny:**
  - a warm cream-gold-rose foil in soft-light; tiles get a drifting foil border and no colour-dodge overlay (no banding);
  - rarer: the shadow entry must fall within 12 s (was 45 s), and overhead needs 86° (was 80°), in both shinyFor and shinyChances;
  - the shiny stinger plays at gain 2;
  - free players see tonight's single best shiny chance, and Plus has the full list.

2026-10-12 · v0.1.519 evening-first planning (playtest room #3/#5):
- **`eveningEnd(T)`:** planning runs from dusk to 11:30 pm, or two hours after a late dusk, and never past dawn. It covers the busiest time (Tonight tab, ⏱, Tonight ticket, Tonight page), the best pass and the reminders list. A "clearing" that only comes after the evening is now the bad-weather page. Settings → **Night owl** (pref nightOwl) plans to dawn.
- **Tonight tab:**
  - leads with "Best tonight": the rarest new card this evening, then the brightest; tapping it calls `showMePass`;
  - ends with "Early riser? <station> passes at 6:37 AM…" when a station passes after the evening.
- **Missions:** "Collect 3 new cards" and "Log 5 sightings" are retired from the draw (kept in RETIRED so past nights score the same). New ones:
  - again: see a card you own on a new night;
  - conset: 3 stars in one constellation;
  - deep: a cluster or galaxy;
  - rarenew: a new Rare or better;
  - levelup2: turn a card silver or gold.

  dealMissions only deals them when they're doable.
- **Ranks:** 0 / 300 / 1,000 / 3,000 / 8,000 / 20,000, plus prestige ranks Deep Space (40k) and Voyager (75k). `rankFloor` (localStorage rankFloor2) keeps any rank already held on the old curve.

2026-10-12 · v0.1.520 store readiness, the parts that needed nothing from Sevaan:
- **Testing tools:** `devMode()`. The native app hides the testing tools (`#test-tools`: time travel, Plus (testing), summons) and the ⏱ button unless they're unlocked by tapping the version line 7 times (localStorage 'dev'). The website (the private test build) always has them.
- **privacy.html:** the privacy policy, linked from Settings and the location sheet. It covers:
  - approximate location, sent rounded to Open-Meteo (weather.js now sends 2 decimals) and to the plane relay;
  - the collection on the phone, and in Firebase only when signed in;
  - push, purchases via the stores, no ads/tracking/selling, deletion, children;
  - contact through GitHub issues (Sevaan can swap in an email).
- **Location wording:** the tour's location step says "It's only used to work out your sky, never sold or shared" (no more "It stays on this phone"), and its button says "Use my location".
- **Delete account:** Settings → Account → Delete account, then a confirm. `deleteAccount()` in account.js deletes users/{uid}/sightings in batches of 400, then users/{uid}, then the Firebase user (re-signing in with Google if Firebase asks for a recent login). Sightings on the phone are kept and marked not uploaded. NOT tested with a real account yet.
- **iOS:** App/PrivacyInfo.xcprivacy is in the target (ids 5C0FFEE…A003/A004). It declares coarse location, email, name, user ID and other user content, all linked to the user, used for app functionality, no tracking, plus UserDefaults CA92.1. The simulator build bundles it.
- **Android:** the manifest has COARSE location only; FINE_LOCATION and CAMERA are gone. Verified on the emulator: the prompt asks for approximate location only, and the tour gets a position. Note: SCHEDULE_EXACT_ALARM comes in from local-notifications.
- **Plus sheet:** shows live perks only; "Yearly $19.99" and "Once, forever $39.99" buttons (disabled until purchases; "Prices aren't final"); a note from Sevaan; Restore purchases.
- **Native builds:** use `npm run ios` / `npm run android` (copy-web.mjs then cap sync). A bare `npx cap sync` ships stale www/.

2026-10-12 · v0.1.521 Sign in with Apple, plus the paid developer account:
- **The paid account:** it is the same team, "Sevaan Franks" D6XL5H68G8, so the project's DEVELOPMENT_TEAM is unchanged. The portal opens on Roundtrip Systems Inc. by default: switch the team menu to Sevaan Franks first, and never touch Roundtrip.
- **App ID:** io.github.sevaan.spacecollector has Sign In with Apple (primary App ID). Firebase (space-collector-91cc7) has the Apple provider enabled; the native flow needs no Services ID.
- **iOS project:** App/App.entitlements (com.apple.developer.applesignin = Default), set via CODE_SIGN_ENTITLEMENTS in both configs. The capacitor.config providers are google.com and apple.com.
- **Code:** `signInApple()` in account.js uses the plugin's signInWithApple (skipNativeAuth), then `OAuthProvider('apple.com').credential({ idToken, rawNonce: nonce })`. `APPLE_SIGNIN` is true in the native iOS app. There are buttons in the sign-in sheet (`#auth-apple`) and in Settings (`#acct-apple`). acct now stores the provider, so Delete account re-signs-in with the right one.
- **Device build:** blocked on 2026-10-12 with "No Accounts". Xcode had no Apple ID signed in, so it couldn't regenerate the profile with the new capability. Sevaan signs in at Xcode → Settings → Accounts.
- **Privacy contact:** sevaan@gmail.com for now. Change it when Sevaan has a domain (also in memory).

2026-10-12 · Signing fixed on the paid account. Xcode still treated D6XL5H68G8 as a free "Personal Team" (7-day profiles, and "Personal development teams… do not support Sign In with Apple"). The fix was to remove the Apple ID in Xcode → Settings → Accounts, quit, re-add it, and build once from the Xcode GUI. Profiles are now 1-year paid profiles that include applesignin, and command-line device builds (`xcodebuild … -allowProvisioningUpdates`, run outside the sandbox) work again. The old free profile is in scratchpad/old-profiles.

2026-10-12 · v0.1.522 feel and words (the playtest room's last block):
- **Reveal:** the tap answers at once (dot pops 1→1.7 then rushes, 400 ms, was 560 ms ease-in). The dim fades in 260 ms. The auto-flip waits 700 ms for Common/Uncommon (1 s for rarer). Finish waits 250 ms, the rank fill 200 ms, the news chips 900 ms. Closing with ✕ fades and drops it 28px over 240 ms. The Tonight page slides up into place and slides away (`hideDone`).
- **Haptics:**
  - Vibration has its own Settings switch (pref 'haptics'), separate from Sounds.
  - The payoff haptic fires on reveal.js's 'sc:payoff' event: success for Epic/Legendary, heavy for Rare, medium otherwise.
  - iOS "select" haptics now wrap selectionChanged in selectionStart/selectionEnd.
- **Sound:** sfx.js `NORM` holds per-file loudness gains from an ebur128 measurement (stingers about −22 LUFS, ticks −28, shiny −19). At most two sounds play at once: a third non-stinger is skipped.
- **Red night mode:** text at full red (#ff7f70; muted #e8705f; gold #f2654f), and the old dim reds were replaced across the CSS. --ui-muted is .88 at night, and SEE LESS/MORE is at full strength.
- **Text size:** 78 font rules under 12px were raised (8–9.5 → 11px, 10–11.5 → 12px) in app/ui/collection CSS. Checked on both phone sizes. Backups are in scratchpad.
- **Tier shapes:** the Tonight rarity filter chips and the mini cards use the tier's own shape.
- **Wording:**
  - the collect button says "Collect"; a repeat sighting is "SEEN AGAIN";
  - tour: "Your first card" with a "Show me where" button, "Where are you?", no Navigation/Gyroscope subtitles, directions in words (`whereWords`: "High in the west"), and "Skip";
  - "Swipe left to set a reminder"; "Alerts on. We'll ping you…";
  - "Not quite. Put it inside the circle…"; "Couldn't save that card…";
  - stars that aren't cards say "A named star · bright · not a card";
  - "A new version is ready.", "Look up! It's dark enough.", "Collect any card tonight to earn its patch.", "Make it yours";
  - sign-in errors on screen no longer show codes;
  - the challenge reads "Turn a card silver or gold".
- **Collection:** body.has-cards hides the intro banner. The rank card is compact (rank and XP) until "Missions ›" opens it; the choice is remembered in localStorage lbOpen.

2026-10-12 · v0.1.523:
- **Line icons:** css/icons.css (linked from index.html and cards.html) adds 30 line icons (cloud, rain, snow, storm, fog, cloud-part, pin, compass, north, moon, bell, stars, constellation, tree, binoculars, ring, snap, hand, owl, sound, vibrate, music, replay, list, reset, flame, cards, patch, calendar, chart). They're masks, so they take the text colour. They replace the emoji in Settings rows, the weather week (WX_ICON), bells, Plus perks (PLUS_PERKS icon = icon name) and the Not tonight tiles. The streak lost its 🔥. The header ☾ glyph stays.
- **Weekly recap:** now a card. .rc-tilt and .rc-card at 5:7 with the retro double frame; the rarest find fills an art window with a caption; attachTilt and attachGyro with a soft-light glare.
- **Radar tip:** "See what's up tonight" opens the Tonight tab.
- **design/art-rocket-redo.html:** a prompt pack for 35 rocket-stage art files (spent, tumbling, no flame, varied angles). Sevaan generates the PNGs, then run scripts/import-art.py <folder>.

2026-10-12 · TestFlight:
- **App record:** App Store Connect has the app "Space Collector" under Sevaan Franks: English (Canada), bundle io.github.sevaan.spacecollector, SKU space-collector-ios.
- **Info.plist:** ITSAppUsesNonExemptEncryption = false (HTTPS only), so TestFlight skips the export-compliance question.
- **First upload:** 1.0 (1).
- **To ship a new build:**
  1. `npm run ios` in native/.
  2. Bump CURRENT_PROJECT_VERSION in the pbxproj (both configs).
  3. `xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination generic/platform=iOS -archivePath <tmp>/SpaceCollector.xcarchive -allowProvisioningUpdates archive`.
  4. `xcodebuild -exportArchive -archivePath … -exportOptionsPlist <ExportOptions: app-store-connect, destination upload, team D6XL5H68G8, automatic> -allowProvisioningUpdates`.

  Both xcodebuild steps run outside the sandbox (keychain).

2026-10-12 · TestFlight build 1.0 (2): added NSLocationAlwaysAndWhenInUseUsageDescription (ITMS-90683: the geolocation plugin references the Always API even though the app only asks for When-In-Use). The build number lives in CURRENT_PROJECT_VERSION; bump it for every upload.

2026-10-12 · v0.1.525:
- **Welcome:** the first screen is only the sealed card; "Already collecting? Sign in…" appears at the bottom only after the flip (#start.wc-open). The ↑ "Swipe away" sits ABOVE the card. Fixed an orphaned CSS line ("text-align: center; text-shadow…") after #sky.waking that had silently swallowed the .wc-after rule after it.
- **Patch coins:** placed under the radar, each coin centred on the radar canvas's centre line (set inline in pumpPatch), and they slide down out from under it (pc-drop).
- **Reminder buttons** on the Tonight page and the Not tonight page confirm themselves ("✓ Reminder set for 8:50", or an error) via `remindDone`, because toasts are hidden while that page is up. That's why Sevaan saw "nothing happens".
- **Double-tap zoom** is off on controls: `touch-action: manipulation` on buttons, links, labels, inputs, .d-cta and .ticket. Pinch zoom still works.

2026-10-12 · v0.1.526: patch coins roll into the Collection tab again (the pc-drop rule outranked .pc-coin.out's pc-roll; there's now an equally specific .patch-coins .pc-coin.out rule after it).

2026-10-12 · v0.1.527: generated file names are readable and start with the game's name: "Space Collector - Arcturus.png" (card share), "Space Collector - My sky in 2026.png" (poster), "Space Collector - ISS (Zarya) pass.ics", "Space Collector - Clear night.ics", "Space Collector - Look up tonight.ics", "Space Collector - Sightings 2026-10-12.json". Only characters that file systems reject are stripped.

2026-10-12 · v0.1.528: reminders are native notifications only (Sevaan: no calendar reminders). `setReminder({ at, title, body, key })` uses notifyAt in the app and returns 'app-only' on the website ('Reminders work in the Space Collector app'). passIcs is no longer used anywhere: pass, clear-night, until-dark ('until-dark' key, cancellable) and streak reminders all go through it. Pass reminder body: 'Look west at 9:02 PM. High in the south at its highest.'

2026-10-12 · v0.1.529: welcome after the flip. "Swipe away" is centred in the space between the safe top and the card's top edge; the sign-in link is centred between the card's bottom edge and the safe bottom. Uses the card-centre maths (50% + (safe-top − safe-bottom)/2 ± 19.6 × --cf) with translate: 0 -50%.

2026-10-12 · v0.1.530: FIX, swipe-away on the welcome card was broken by the no-double-tap rule. [role=button] matched .wc-holder, and that later, equal-specificity rule overrode its touch-action:none, so iOS took the swipe as a page gesture. The rule is now wrapped in :where() (zero specificity), so anything with its own touch-action keeps it. Verified: wc-holder none, sky-range none, buttons manipulation.

2026-10-12 · v0.1.533:
- **Reveal, no dead space at the bottom:** two zones. The rank bar is pinned at safe-bottom + 52px and "View in collection" at safe-bottom + 6px. The card is centred between the header chips (safe-top + 112px) and that rank zone (`--rv-top`/`--rv-bot`/`--rv-y` at the end of css/reveal.css). sizeCard caps --cf at (innerHeight − 270) / 39.2 so the card fits on an SE.
- **Tonight page (clear case):** the words sit centred in the space above "Explore the sky" instead of hanging from the top with a gap under the missions (auto margins on .od-head and #ob-explore). The bad-weather page scrolls, so it's unchanged. The collection viewer scrolls too, so it has no dead space.
- **Tonight page picks:** the best pass is the rarest card new to you (Common/Uncommon only if that's all there is), with its rarity gem and label. Tapping the name opens a card preview (`showTonightCard`, the reveal sits above #onboard). The Not tonight page's "above the cloud" rows do the same.

2026-10-12 · v0.1.534: daytime satellites are OFF by default (Sevaan didn't like seeing them). Settings → What shows → "Satellites by day" (pref `daySats`, `state.daySats`) turns the halo icons and the "Hidden by daylight" circle info back on; `daySats()` in main.js returns null when it's off.

2026-10-12 · v0.1.537:
- **Observer stats are free** (Sevaan): no Plus check in cards-page `openStats`, removed from PLUS_PERKS. The "Your sky in YEAR" poster is gone (`posterCanvas` deleted from js/stats.js, no share button). Rarest finds use the tier's own shape.
- **Plus sheet fits one screen** (Sevaan: its top slid off the screen): shorter lead and perk lines, the two prices side by side as tiles (`.plus-price`), one short note, a shorter thank-you. The card is capped at the screen height minus the safe top and scrolls inside only if it must (checked: fits at 393×660 and 375×667; scrolls at 375×548).

2026-10-12 · v0.1.538:
- **Deep-sky art:** 12 of the 16 deep-sky cards have painted art, made with Nano Banana Pro (Vertex model `gemini-3-pro-image`, project space-collector-510722). Style references were planet-saturn, star-deneb and solar-system. The 12 are Andromeda, Triangulum, LMC, SMC, Orion, Lagoon, Carina, Omega Centauri, Hercules, Pleiades, Double Cluster and Beehive. Files are deep-<id> (art-keys.js), and card.js uses the picture when one exists, otherwise the constellation chart with the object ringed. Hyades, Alpha Persei, Ptolemy's Cluster and the Coathanger keep the chart, since their pattern in the sky is the point. Contact sheet: design/deep-sky-art.jpg.
  - Fixes in the prompt: the model draws the LMC and M13 as spirals unless told "NOT a spiral". The quota is about 1 image a minute, so generation is sequential with 45 s backoff.
- **The Sun is Common** (Sevaan: everyone sees it every day).
- **Tests:** three stale tests were updated for earlier rule changes: shiny overhead at 86°, the new rank curve, and the daytime Moon needing 30° from the Sun.

2026-10-12 · v0.1.539: **no pass alerts in bad weather** (Sevaan got a "look up" alert in fog).
- **Client:** `alertPicks` drops passes whose forecast hour isn't clear (weather.js `skyClearAt`: current conditions within the hour, else the nearest forecast hour; unknown weather counts as clear). Alerts are rescheduled every time the forecast refreshes (requestWeather).
- **Relay:** the web app also sends a place rounded to 1 decimal. relay/push.ts checks Open-Meteo's current weather there right before sending, and drops the due alerts on fog, rain, snow, storms or more than 40% cloud. Deployed to the val's main.ts 2026-10-12, replacing the whole file in the editor (CodeMirror view via `.cm-content` cmTile → view.dispatch) and checking the hash first. privacy.html mentions the rounded place.
- **Native app:** local notifications can't check the weather at the moment they fire. They're rescheduled whenever the app refreshes the forecast while open.

2026-10-12 · v0.1.540: the lock-on sound plays only for something you can collect (a new find or the tour's catch; Sevaan: not for cards you already have). The ring pulse and buzz still happen. The rarity line above the circle now uses the tier's own shape (`#d-tier[data-gem]`); owned cards had always shown ◆.

2026-10-12 · v0.1.542: fleet cards show more art (Sevaan). The "· N more for Silver" text is gone from the stamp line (just "4 / 19 stamped"), and the heading is "EVERY LAUNCH" (it wrapped as "EVERY GLOBALSTAR LAUNCH"). The after-mount trim gives the freed lines to the picture: on Globalstar at 393 px the art went from about 80 to 115 px tall.

2026-10-12 · v0.1.543: Delta facts are about the rocket the piece came from (Sevaan: "kept flying for more than 60 years" read badly on a 1999 stage). Delta II: 155 flights 1989–2018, GPS, Spirit and Opportunity. Delta 1: built from the Thor missile; a Thor-Delta launched Telstar in 1962. Other Deltas: the family flew 1960 to the last Delta IV Heavy in 2024.

2026-10-12 · Round sound proposals (Sevaan: the Wow! signal's beeps grated; wants rounder, organic, Apple-like sci-fi sounds that nobody turns off). scripts/sfx-round.py builds two options per event from a rounder palette: plucks that settle into pitch, water drops, wooden tocks, harmonic-only glass, soft FM keys, an octave lower, with a darker, smaller room. Board with Now / A / B per event, loudness-matched to in-game levels: https://claude.ai/artifact/3axj4R8UGgL1MmbYomDUtm. Nothing has shipped yet; waiting on Sevaan's picks ("Copy picks" gives e.g. `secret=a`). To ship a pick, render with `python3 scripts/sfx-round.py OUT <event>`, copy OUT/<event>/<a|b>.mp3 to assets/audio/sfx/<event>.mp3, then re-measure NORM in js/sfx.js.

2026-10-12 · v0.1.545: rocket art redo, part 1. 18 of the 35 pictures in design/art-rocket-redo.html were regenerated with Nano Banana Pro (spent stages, no flame, varied angles) and imported: agena, ariane-5, centaur, debris-rocket-1/2/3, delta-2, electron, falcon-9, fregat, indian-stage, kick-motor, rocket-stage(-1/-2), russian-stage, sl-12, titan-transtage. The other 17 prompts asked for "the whole rocket" (boosters, fairing), which is wrong for what's in orbit. They were rewritten to the actual orbiting stage (Vostok Blok E, Soyuz Blok I, Kosmos-3M second stage, Vanguard third stage, PSLV PS4…) and are regenerating. The script and prompts are in the session scratchpad rockgen/. Each request sends the old picture as a shape reference.

2026-10-12 · v0.1.546: rocket art redo is done. All 35 pictures from design/art-rocket-redo.html are replaced. These 17 now show only the stage that's actually in orbit, not the whole rocket: Vostok Blok E, Soyuz Blok I, Molniya Blok L, Kosmos-3M second stage, Zenit second stage, Tsyklon-2/-3 upper stages, Start-1 upper stage, Delta and N-I second stages, PSLV PS4, Scout fourth stage, Mu kick stage, Vanguard third stage, Thor's upper stage, the Ariane 4 H10 and the bare Atlas core. Contact sheet: design/rocket-art.jpg.

2026-10-12 · v0.1.547: round sound set shipped (Sevaan's picks from the board, rendered by scripts/sfx-round.py).
- **Option b:** lock, collect, arrive, flip, stamp, page, r_epic, r_legend, rankup, patch, secret.
- **Option a:** swipe, r_common, r_uncommon, r_rare, shiny, levelup, xp, mission, coinroll, complete, fossil, ufo, welcome, rattle, step, toggle, plane.
- **Kept as before:** toast, seen.
- **Levels:** NORM in js/sfx.js is re-measured so each new file plays at the old in-game loudness (ebur128), capped at 4×. Because of the cap, flip, xp and rattle land slightly quieter.

2026-10-12 · v0.1.548: stars (and any other "quiet" kind) now show the Collect button too (Sevaan). A quiet target only drops the inner ring and the snap. The Settings highlight sheet text was updated to match.

2026-10-13 · v0.1.551: weekly recap card. The double frame lines are an overlay (`#recap .rc-card::before`, z 4) instead of inset shadows, so the art window sits behind them rather than covering them (Sevaan).

2026-10-13 · v0.1.557: daytime pass markers (Sevaan: "circles in the sky showing where to see some cool satellites tonight and when").
- **What shows:** `dayGhosts` replaced the old "where it is right now" ghosts. By day, up to 4 of this evening's passes (until eveningEnd, peak ≥ 15°): cards you don't have first, then rarest, then brightest.
- **How they look:** each is a dashed circle in its tier colour at the highest point, labelled "NAME · 7:54 PM", with a dashed path from rise to set (az/el through rise → peak → set).
- **In the circle:** with nothing else targeted, a marker in the circle is named in full (sky.js drawGhosts → ghostHit with a per-item kicker): "TONIGHT · 7:54 PM / TIROS 3 / ◆ Rare · new to you / tap it to be shown where it rises". The until-dark countdown hides meanwhile (`sky.ghostHitId`).
- **Tapping:** tapSky checks `sky.ghostHits` first and runs showMePass.
- **showMePass:** no longer shows a sticky "Follow the arrow" toast, which covered the steering line under the circle that says the same thing.

2026-10-13 · v0.1.559: daytime pass markers, as Sevaan asked:
- **No tapping:** lining a marker up in the circle shows its info: TONIGHT · time / NAME / tier · new to you.
- **Remind me pill:** under that info, a "Remind me at 7:44 PM" pill (#gh-remind, `ghRemind` called from untilDark each frame) sets the usual 10-minutes-before notification. Tapping it again turns it off. The reminder key `${id}@${start}` is shared with the Tonight rows, so the bells agree.
- **Gone:** the "tap it to be shown where it rises" line and the tap → Show me.
- **Steering line:** reads "Appears here at 7:52 PM · in 4 h 6 min". No "You're facing the right way", and long waits are in hours.

2026-10-13 · v0.1.561: daytime pass markers, round 3 (Sevaan).
- **Paths:** each path is the real propagated track (`passPath`, ~40 steps from rise to set, cached per pass). Straight az/el lines through rise → peak → set had made sharp V shapes.
- **In the circle:** when a marker sits in the circle, the object's icon shows faintly in it (50%, since it isn't there yet). The kicker reads "APPEARING TONIGHT AT 7:54 PM".
- **One per card:** at most one marker per card, so several Iridium passes count as the one fleet card.

2026-10-13 · v0.1.562: every daytime pass marker shows the object's icon inside its dotted circle at 50% opacity (12 px, dark ink), not just the one lined up (Sevaan).

2026-10-13 · v0.1.565: a daytime pass marker lined up in the circle grows like a real target: its dotted ring goes from 11 to 17 px and the icon from 12 to 22 px (uses last frame's `sky.ghostHitId`).

2026-10-13 · v0.1.567: daytime pass tracks are dark ink (rgba(20,34,54,.42)), since the white tracks vanished over clouds and some passes looked like they had none. Chevrons every 7 track points point from rise to set, so you can see which way each one moves (Sevaan).

2026-10-13 · v0.1.570: reminder limits and the monthly price (Sevaan approved).
- **Reminders:** free players get ONE reminder a night (`FREE_REMINDERS_A_NIGHT` in main.js, `reminderLimitHit` in setReminder). Any kind counts (pass, dark, clear night); re-setting the same key doesn't. A second one opens the Plus sheet ("Free includes one reminder a night…") and returns 'limit', so callers stay quiet. Plus: unlimited.
- **Pass alerts:** the automatic ones are still Plus, 3 a night, quiet 11 pm – 7 am.
- **Plus sheet:** new perk "Unlimited reminders". Prices: Yearly $19.99 across the top ("Best value · save 44%"), then Monthly $2.99 and Once, forever $39.99 side by side. Perk lines are one line each, and the sheet fits without scrolling at 393×660 and 375×667.
- **BUG FIX:** `remindIds` and `newRemindId` were accidentally deleted in 020eca4 (v0.1.528). Every reminder in the native apps threw a ReferenceError from then until now (TestFlight builds 3 and 4 included); the website wasn't affected because it returns 'app-only' first. Both are restored. To catch this kind of thing, lint for undefined names: `npx -y eslint@8.57.0 --no-eslintrc --env browser,es2022,worker --parser-options=sourceType:module,ecmaVersion:latest --rule 'no-undef: error' js/*.js` (clean now).

2026-10-13 · v0.1.574: daytime pass markers, round 4 (Sevaan).
- **No arrows.** Tracks look like trails in the sky and below the horizon: a short faint solid line for where it's coming from (30 s before it appears, dark ink by day) and orange [4,7] dashes for where it's going (from when it appears until just after it fades, at least 90 s; `passPath` → { past, ahead }).
- **The circle sits where it appears** (riseAz/riseEl), matching the time on its label, not at the highest point.
- **Why some had no line before:** a "pass" covers only the minutes it's sunlit and visible, and for some (slipping into shadow) that's one moment, so the old rise→set path had no length.

2026-10-13 · v0.1.579, small fixes (Sevaan):
- **Reveal:** "+N XP" is green (#5fd08a; red in night mode) and on the same baseline as NEW CARD. The roll is clipped with clip-path instead of overflow:hidden, which moves an inline-block's baseline to its bottom edge.
- **Tonight page:** Remind me and Explore the sky sit together. The free space goes above the pair (`#ob-remind` margin-top auto when shown, Explore 12px under it).
- **Until-dark sheet:** "Set reminder" says why when it can't set one, on the button itself ("Reminders work in the app" / "Notifications are off in Settings"), because toasts sit behind sheets. In the TestFlight builds it did nothing because of the remindIds bug fixed in v0.1.570.
- **Radar tip:** waits while any sheet, the Tonight page, the recap or the tour is up, and hides if a sheet opens over it.

2026-10-13 · v0.1.580: daytime pass markers have no track lines at all (Sevaan); just the dotted circle where it appears, its faint icon, name and time. passPath was removed. The bell icon in the Remind me pills (#ud-bell, #gh-remind) is nudged 2px up so it sits level with the condensed capitals.

2026-10-13 · v0.1.582: tapping the circle while a daytime pass marker is lined up opens its card preview (hidden art for cards you don't have), eyebrow "APPEARING TONIGHT AT 7:54 PM" (tapSky → showTonightCard). The Plus sheet no longer has the "Buying opens in…" note or the made-by-one-person line (Sevaan).

2026-10-13 · v0.1.583: backup sync is automatic (Sevaan: "Not a manual process"). There is no Sync now button.
- **When it runs:** account.js `autoSync` runs a full sync 4 s after start, when the app comes back to the front, when the connection returns, and 30 s after a failed upload. It runs at most every 2 minutes.
- **On a catch:** `pushSighting` (on every catch) now stamps `syncedAt` and emits. The panel read "synced not yet" because only the full sync set it.
- **Wording:** the status reads "N sightings · backed up 2 min ago" ("Backing up…" before the first).

2026-10-13 · v0.1.587 (Sevaan):
- **Week tab redesign:** a best-night card (day and date, sky in words with the weather icon, dark time, new cards, passes, the rarest new pass, and "Remind me <day> at dark", which counts as that night's reminder). Then a row per night: day and date, weather word and icon, an hourly cloud strip from dark (clear blue, some cloud, cloudy, rain/snow violet; key under the list), new count and the rarest's gem. Tap a row for its passes. `nightSummary` now counts the evening only (eveningEnd; Night owl to dawn), since whole nights gave "451 new cards" and 4:54 AM picks.
- **Uncollected cards show their fact** (card.js), not the "Observe this… to add its story" teaser. The art stays hidden.
- The daytime marker kicker and preview eyebrow read "APPEARING HERE TONIGHT AT …".
- The bell in the Remind me pills is nudged 1px up (2px read high on the phone; measured centred in WebKit).

2026-10-13 · v0.1.588: the Week tab's orange dot (it meant "Plus", but nothing said so) is now a small PLUS tag for free players and hidden for Plus players (`body.is-plus`, set in renderPlus).

2026-10-13 · v0.1.591 (Sevaan):
- **Constellation lines below the horizon:** always on, at 70% of the sky lines, with the big constellations' names (sky.js drawBelowSky). Lines above the horizon still follow the Settings switch.
- **Below-horizon and daytime satellite icons:** 80% of their old size (BELOW_ICON 13 → 10.5). The one lined up in the circle grows to 20 px (BELOW_ICON_HIT, matched by belowHitId / dayHitId).

2026-10-13 · v0.1.594:
- **Constellation lines checked against the data:** 868 of 893 line corners sit on a catalogued star; the other 25 are faint southern stars below the star list's cut. Orion's belt and the Big Dipper are correct, and lines and stars share one transform (celestial.js loadSky). They looked like nothing below the horizon because, from Canada, that's mostly unfamiliar southern constellations with no names, so every constellation below the horizon is now named.
- **FIX:** the lined-up below-horizon icon didn't grow. belowHitId is the object's id, but halo entries have the id only on `obj`; matching now uses `id ?? obj.id`.

2026-10-13 · v0.1.596 (Sevaan):
- **Tonight list rethink.** It uses every pass to dawn; the old first-60 cut stopped in the first hour, so the dawn ISS was missing. Up next stays. Later is split into This evening (until eveningEnd), Late night (until 2.5 h before dawn) and Before dawn. Each part shows its best passes in time order: 8, 4 and 4, ranked new > rarity > stations/icons > brightness > height, and stations always make it. "Show all N" lists the rest. Night moments sit inside their part.
- **"Worth setting an alarm for" cards:** tapping one opens its card. A mouse can drag the strip (`dragScroll`; a drag isn't a tap). The strip lines up with the list (no −20px bleed), with snap per card.
- **Helicopter:** the main rotor spins (four blades over the cabin with a faint rotor disc, ~1.5 turns a second).

2026-10-13 · v0.1.597: Tonight loading state (Sevaan: "needs a better loading state").
- **Worker progress:** the planner worker posts progress every ~20 sky-minutes (`progress: true` on the request): { t, dusk, curve so far, passes found }.
- **Loading screen:** `renderTonightLoading` shows a small orbit dial, "Working out tonight's sky / Checked to 9:41 PM · 365 passes so far", the busyness chart growing as it scans (a blinking line where it's up to), and shimmering placeholder rows. With reduced motion, nothing animates.

2026-10-13 · v0.1.601: Week tab, round 2 (Sevaan: "I don't like the coloured bars. It's not intuitive").
- **Rows:** no bars. Each evening is a weather icon, the day and date, and one phrase made from the hourly forecast between dark and eveningEnd: "Clear all evening", "Clear until 9 PM", "Clear from 10 PM", "Mostly clear, some cloud", "Breaks in the cloud", "Cloudy/Rain/Fog all evening". Clear evenings are gold; poor ones step back. Then the new count and the rarest's gem. Tap a row for its new cards.
- **Best-night card:** picks from the good evenings ("No clear evening yet · the best chance" if none).
- **FIX:** nightSummary rated the sky over the whole night while showing the evening (Sunday read "Cloudy most of the evening" over an all-clear strip). It now uses the evening for both.

2026-10-13 · v0.1.604: Collection tiles are the real card, shrunk (Sevaan).
- **How it's drawn:** cards-page `miniFace` replaces the tile's face with `renderCard(c, { mini: true })` (small art, no sparkles). The card is drawn at its natural 280 px and scaled by `--mini-s` (tile width / 280, set on #grid by `miniScale` on render and resize). Scaling the whole card, not the font, makes fixed-size parts like the fleet launch dots shrink too.
- **What's kept:** the tile's classes (owned, shiny, gold, level), aria label, tilt and open-viewer click.
- **Bottom strip:** a slim strip over the card's footer shows "✓ Oct 17, 2026" (or "4 of 19 launches", "Not yet collected"). The level badge sits just above it.

2026-10-13 · v0.1.608:
- **Wording:** "Busiest: 65 objects up at once" everywhere (Sevaan).
- **Mini-card tiles:** the collected strip now sits inside the card's frame (inset by the frame width, rounded bottom corners, the card's own footer hidden under it).
- **Tile shape:** tiles are the retro card's real 28 × 42, not 5:7, which cut the bottom off, and every mini card is held to exactly 42em so long facts can't push the bottom frame out.

2026-10-13 · v0.1.609: mini-card tiles, round 3 (Sevaan: the overlay still covered the bottom frame on the phone). There's no overlay now. `miniFace` writes the collected line ("✓ Oct 17, 2026", "4 of 19 launches", "Not yet collected") into the card's own footer as `.mini-status`, set at 2.5em so it reads at tile size. The fact block shrinks and clips (flex 0 1 auto), so the footer and frame always fit in the 42em card.

2026-10-13 · v0.1.612 (Sevaan):
- **Daytime pass markers have trails again,** styled for the sky: a faint thin solid line in the rarity colour for the 30 s before it appears, then a line ahead that fades from the rarity colour to nothing, over a soft wider glow. They're capped on screen at 60 px behind and 200 px ahead, so a fast overhead pass doesn't streak across the whole view (`passPath` back in main.js; drawn in sky.js drawGhosts).
- **Uncollected collection tiles:** the hidden art is dimmed much more (brightness .38, saturation .6).

2026-10-13 · v0.1.613: the example location comes from the phone's time zone (Sevaan: it was always Peterborough). js/tz-places.js maps ~150 IANA zones to a well-known city in each (`placeFromTimeZone`), with no permission and no network, so a Vancouver phone gets "Showing the sky over Vancouver". Unknown zones still fall back to Peterborough. IP geolocation was rejected because it would send the IP to a third party (privacy policy).

2026-10-13 · v0.1.615: new debris icon (Sevaan): a torn-off scrap of panel with a jagged edge, panel cell lines cut through it, a bent strut, and a fleck when big enough. It replaces the plain pentagon "pebble" (sky.js drawIcon fallback branch).

2026-10-13 · v0.1.616: the buried dinosaur bones are drawn 50% smaller (Sevaan), so 37.5% of their first size, with the minimum and maximum halved too.

2026-10-13 · v0.1.617: the dinosaur bones grow 1.3× when they're in the circle, easing in and out (`sky.fossilGrow`).

2026-10-13 · v0.1.619: shiny chances section (Sevaan).
- **Layout:** more room under the heading.
- **Target button:** each row has one (showMePass on the chance's pass; shinyChances now carries `p`).
- **Explainer:** a "What's a shiny?" box above the first row, closed for good with its ✕ (localStorage `shinyExplained`).

2026-10-13 · v0.1.622: the Week tab is fast (Sevaan: "loads really slow"). It went from about 30–60 s to about 1.5 s in WebKit.
- **What changed:** each night is worked out for the evening only (15:00 + 10 h; Night owl 18 h) in 3-minute steps, three nights at once in up to three workers.
- **Cache and prefetch:** results are cached per day/place/sky in localStorage `weekCache` (without the curve). Plus players start it in the background 6 s after tonight's plan is ready. Pending nights show shimmer rows.
- **Trade-off:** the 3-minute step can miss the shortest passes, so week counts are a little lower than Tonight's. That's fine for picking a night.
- **Rarity chart:** each row has a tiny bar chart of new cards by rarity, Common → Legendary in tier colours, square-root scaled; an empty rarity is a dash.

2026-10-13 · v0.1.624 (Sevaan):
- **No Commons in suggestions:** `bestUpcoming(T, t0, until)` picks the pass to suggest: new to you, Uncommon or rarer, rarest then soonest. Commons appear only once fewer than 10 Uncommon-or-better cards are left. It's used by the corner chip (day "TONIGHT: …" within the evening, night "NEXT: …") and the Now tab's empty-state "Next up".
- **No more bright-pass toast:** the "Find the next pass" toast ("Shijian-16 / Tonight at 7:02 PM", a sticky toast instead of the corner chip) is gone. With no plan yet, the Now tab's button reads "See tonight's plan" and opens the Tonight tab.

2026-10-13 · v0.1.626 (Sevaan):
- **Real mini cards everywhere** a small card appears. card.js `miniCard(o, { sightings, status, locked })` returns a `.mini-face`: the real card scaled by `--mini-s` (width / 280), with a short status in its footer and dimmed art when not collected. It's used by Collection tiles (cards-page miniFace), the Now tab's "Seen before" ("NE · 40° up") and Tonight's "Worth setting an alarm for" ("7:54 PM · E", bell over the art) via main.js `stripCard`. The strips are 132 px wide (`--mini-s: .4714`).
- **Week day detail:** the rarity is in its tier colour.
- **Compass:** shown from the first frame as a still, dimmed (50%) dial drawn once with a default basis. At hud-ready it goes to full opacity with a small "click in" turn and bounce (`radar-click`; none with reduced motion).

2026-10-13 · v0.1.627: Tonight's run is built (design/sky-pages-combined.html, which Sevaan approved with a target and bell per stop).
- **Haul (`renderRun` writes #tonight-summary):** new cards this evening (Commons left out until fewer than 10 Uncommon+ remain), the top rarity count in its colour, the best window and XP, a rarity mini chart, then dark time and weather.
- **The run:** up to 4 rarest new cards, the best shiny chance, moments (dark, busiest, cloud, clearing) and a dawn station as "Early riser". Each stop has the ICON_TARGET (showMePass) and ICON_BELL (remindPass, toggles) buttons, and tapping the stop opens the card.
- **"Remind me for my run":** sets each stop's reminder in turn and stops at the free limit (Plus sheet).
- **Old list:** the full list, chart, shiny chances, Also up tonight and alarm cards sit behind "Everything tonight · N passes ›" (`tlAll`).
- **Icons:** line icons (moon, cloud, stars, bell) instead of emoji in the run and in the until-dark reminder sheet.

2026-10-13 · v0.1.629: the Now countdown hero is built (design/sky-pages-combined.html).
- **Hero (`nowHero`):** the first thing on the Now tab, and also in the empty state. If a new Uncommon+ card is up right now: "Up now · new to you", a full ring and "Aim at it". Otherwise the next one worth getting (`bestUpcoming`): a ring in its rarity colour that fills over the last hour, a live countdown ("4:32" / "3 h 53 m to go", updated every second), "Show me" and a bell.
- **Direction:** an arrow and words ("Turn left a little · high in the east") follow the phone through their own rAF, since the sky loop pauses under panels.
- **After that:** the next three worth it plus the evening's best shiny chance; tap → showMePass.
- **Empty state:** the old "Next up" row and "Show me the next pass" button are gone; the button is "See tonight's run".

2026-10-13 · v0.1.631: the Week design is built (design/sky-pages-combined.html), and the Now sky map sits in a card like the hero.
- **7-day strip:** each day shows a weather icon (gold when good), the Moon's lit fraction from the planner (`moonIllum`) and up to three dots in the rarity colours of that night's Rare+ new cards. Tap a day to select it (`weekSel`; the best night until you pick).
- **Night card:** "Best night this week" or "This night". Day and date, one sentence (weather, Moon, the rarest new card), new count and dark time, then the 4 rarest Uncommon+ new cards with target (showMePass) and bell (remindPass); tap opens the card. "Remind me <day> at dark".
- **Only this week:** Rare+ new cards up on only one or two of the seven evenings (tap jumps to that night), plus a meteor shower starting within the week.
- **Goal ring:** "N of 5 new cards this week" (first sightings since Monday, `weekStart`).

2026-10-13 · v0.1.634 (Sevaan):
- **Moon at the horizon:** a Moon (or Sun) within ~7° of the horizon is drawn again after the ground and landscape, clipped to above the horizon line, so it peeks over the trees. It used to be collectable but hidden behind them.
- **Tonight's run:** the all-reminders button now says "Set reminders".

2026-10-13 · v0.1.641: section headers in the sky panel (Now, Tonight, Week) all have 24px above and 10px below, and nothing under them adds its own top margin. The Now lists show one row per card (Alioth was listed twice).

2026-10-13 · v0.1.646: the Now tab puts the compass map first (Sevaan). The next-card hero below it is compact: an 80px ring with the countdown ("3h 53m to go" / "Up now"), then "Next · ◆ Rare", the name and the direction words with the turning arrow, and round icon-only target and bell buttons on the right.

2026-10-13 · v0.1.647: one deep-space secret a session (Sevaan: New Horizons and the Wow! signal, with Pioneer 11 nearby, are close together in Sagittarius, so you got them all at once). Once one of Voyager 1 and 2, Pioneer 10 and 11, New Horizons and Wow! is found, the rest aren't drawn or collectable until the app is next opened (`deepThisSession`).

2026-10-13 · v0.1.655: rank card redesign (Sevaan).
- **No tilt, glare or flip.**
- **Layout:** the ladder picture (your rank, the next rank dashed, "NEXT") shows even when compact (96px tall). Under the rank and XP: a progress bar and "14,385 XP to Mission Control · N%".
- **Fix:** progress clamps at 0, since a rank kept from the old curve can sit above your XP; it showed "-20%".

2026-10-13 · v0.1.659: the Find tab (Sevaan: search an object like the ISS, preview its card, set a reminder for its next pass however far ahead). The Collection's old hidden Discover tab is now "Find" (view 'find').
- **The list:** a search-first list. It filters as you type (every word must match name, id, COSPAR, type or set) and shows up to 30 results.
- **Each row:** small art (hidden art if you don't have the card), name, rarity, "in your collection", and the next visible pass ("Thu, Oct 15 6:36 AM · halfway up in the southeast", or "Not visible from here in the next 10 days").
- **Buttons:** a target (closes the Collection and runs showMePass) and a bell (remindPass; only for passes more than 10 minutes away). Tapping a row opens the card viewer.
- **Before you type:** "Rare ones you can see this week" lists the rarest new Uncommon+ cards with a pass in Tonight's and the Week's plans, soonest first.
- **How passes are found:** Explore works them out (js/find-worker.js, 1-minute steps, daylight skipped, 10 days) via postMessage: find-passes, find-suggest, find-remind and find-show from the frame; find-passes, find-suggest and find-reminded replies.

2026-10-13 · v0.1.660 (Sevaan):
- **Observer stats moved:** now in Settings → Account, under your name (#set-stats-open). It opens the Collection with key '#stats', which runs openStats. The link under the rank card is hidden.
- **Rank card:** the ladder picture is full height (160px) even when compact.

2026-10-13 · v0.1.664 (Sevaan):
- **Card viewer:** "Preview artwork" (stories are always shown now). A pill shows the card's next pass from here with target and bell (`#v-next`, same find-passes messaging as Find).
- **Collection empty state:** the box fits its content (no 270px min-height, which left an empty band under "Clear filters").

2026-10-13 · v0.1.666: Collection search and filters on one line (Sevaan). There's a drawn magnifier (the ⌕ glyph rendered badly) and "Search cards…". The "Filters ⌄" button slides the Collection / Rarity / Sort menus open below (max-height and opacity transition) and closed again; it shows an orange dot while a filter is active (`markFilters`).

2026-10-13 · v0.1.668: the Now tab's sky map draws everything except stars as its sky icon (satellite, rocket stage, debris, station, fleet; `mapIcon` renders sky.drawIcon once per kind into a data-URL image, kept upright like the labels), in cream, with the orange ring on new ones. Objects are placed before stars so the 70-item cap never drops them. Stars stay small dots.

2026-10-13 · v0.1.670: the ring at your feet now shows what's UP, not what's below the horizon (Sevaan: look down at rest, see something good, turn to face it, then raise the phone). `feetItems()` gives the Moon, planets, the Sun, up to 4 new satellites in view (rarest first) and the brightest named stars, up to 8 in all, each placed on the ring at its azimuth and labelled with how high it is ("VEGA 59°"). Things below the horizon still show as ghosts when you look just under the horizon.

2026-10-13 · v0.1.672: the Now tab has no sky map (Sevaan), and the big next-card hero is back: a 160px ring with "Next new card" / "Up now · new to you", the rarity, name, turning arrow and "Show me" / "Aim at it" with bell. Coming up and the lists follow. The empty state shows the hero first, then why it's quiet (no map).

2026-10-13 · v0.1.673: the Now next-card hero shimmers once in its rarity colour each time you arrive on Now (a band sweeps across and the border glows; `heroShine`, set by showVTab('now'); off with reduced motion). Ground-compass options board: design/feet-compass.html (A clock face, B heading tape, C sky map; not built).

2026-10-13 · v0.1.674: the ground compass is design/feet-compass.html "A + C" (Sevaan). sky.js drawFeet(items) paints a sky map on the ground inside the ring at −77°: each thing at its real az and height (ring = horizon, centre = straight up, 30°/60° rings faint), new cards ringed orange, stars as plain dots. Everything but stars gets a spoke out past the ring at its direction with NAME / "N° up"; neighbours within 15° share one spoke with a count ("3 NEW SATELLITES"). Crowded labels take a longer spoke (4 lengths, remembered in feetMem); labels that would hit the screen edge stack above/below the tip. An orange wedge shows where the top of the phone points. main.js feetItems gives {name, az, el, kind, icon, isNew}: Moon, planets, Sun, 4 new satellites, 14 brightest stars. Sky labels are skipped once the compass is fully in (feetA > 0.98).

2026-10-13 · v0.1.675, playtest fixes (Sevaan: "work through it all"):
- **One sticky toast at a time** (js/toast.js): a sticky waits while another is up; plain toasts still pass. The Sun warning is a normal ~6 s toast ("Never look straight at it. Keep your eyes on the screen."). Example location reads "Sky over Toronto".
- **Overcast nights:** `cloudAt(t)` (main.js, weather.js skyClearAt). Tonight's haul leads with the weather when the night is bad ("Overcast all night · Next clear night: Saturday · N new cards pass over tonight behind the cloud; if you spot a gap, they still count"), and the run is "Tonight's run · if it clears". The Now hero says "Next new card · cloud forecast"; Find rows say "cloud forecast" (passes carry `cloud` from main).
- **Run variety:** one stop per name first, repeats only to fill (three "SL-8 Rocket Stage" stops read like a bug).
- **Now tab** counts new cards up ("Now · 15 new"), not every star.
- **Collection:** the rank card is hidden until the first catch, so tabs sit under the header.
- **Stars over the circle** name their constellation ("Uncommon · in Capricornus", `inCon`).
- **Albums:** a long name pushes the count onto its own line. **Album patches** show their subject (ALBUM_ICON in js/patches.js).
- **Shiny eclipse line** in words ("low in the east"), no degrees. **Find search** ranks exact names, stations and icons first, debris last.
- The sky panel's place/time line is filled when it opens straight on Tonight or Week.

2026-10-14 · v0.1.676: an owned card in the circle shows only View card; the "Seen on N nights · N more for Silver" line under it is gone (Sevaan: it said "nights" for the Sun by day, and the card footer/frame already show the level). Levels themselves are unchanged.

2026-10-14 · v0.1.677: welcome card steps (Sevaan): Go outside / Look up / Collect are one size (class `fit long wc-step`; Go outside used to shrink as a 10+ letter stat) and are empty when the card turns over, then rise in one after another (250 ms after the flip lands, 420 ms apart; css/cards.css .wc-step).

2026-10-14 · v0.1.678: review.html (+ js/review.js) shows every card on one page for scanning art and layout (Sevaan), drawn as collected with the real renderCard. Filters: search, type, rarity, painted vs drawn, "One per picture" (one card per art file with "used by N"), "Starred only"; card size slider; click a card for the full card. ☆ stars cards (or a whole picture in one-per-picture mode) for redo, saved in localStorage `reviewStars`; "Copy starred" puts a list on the clipboard to paste back. Not linked from the app (noindex).

2026-10-14 · v0.1.679:
- **FIX (serious):** a new find after looking at an owned card opened as "Seen again" (viewOwned) with no new-card reveal. Since c451ac8 (v0.1.548, 2026-10-12) the `disc.classList.remove('owned')` on the new-find path had been swallowed into a comment, so #discover kept `.owned` and the d-hit/d-cta handler took the owned branch. Affects TestFlight builds 4–7. Grep after any long one-line comment edit.
- Art redo (review page scan): 21 launcher pictures that showed whole rockets launching (pegasus, diamant, rokot, chollima-1, dnepr, epsilon, firefly-alpha, jielong-3, kinetica-1, kuaizhou, nuri, qaem, zhuque-2, gravity-1, gslv, h2a, h3, long-march-3, long-march, long-march-6a, lvm3) are now the spent upper stage in orbit, no flame; electron (no lunar surface) and planet-mercury (grey, not orange). Nano Banana Pro, no old-picture reference (they showed launches); prompts in the session scratchpad rockgen2/.
- While something is in the circle, toasts wait/fade and patch coins hide their label (css/ui.css, js/toast.js); coins hide over panels.
- `varied(ps, n)` (main.js): one pass per name first, used by Tonight's run and the Week night card.
- Starlink-size fleets (200+ launches) get ~6 rows of finer dots (card.js dotMap). titleFor puts a space before "(" ("SL-12 Rocket Stage (Aux Motor)").
- review.html opens on painted pictures, sorted "Most used first" (also Rarest, A to Z); "used by N" shows in every mode.

2026-10-14 · v0.1.680: big feature batch (Sevaan, from design/fun-and-learning.html and design/card-redesign.html):
- **Mission card front** (card-redesign style A, chosen by Sevaan). renderCard adds `card--mission`: picture first at a fixed 4:3 (object-fit cover, never shrinks; the old --fact-extra shrink no longer applies), rarity chip (`.m-tier.card__tier`) and set chip (`.m-set.card__setbar`, keeps the selectors share-card.js and the welcome card use) on the picture, name, a "what it is" line, a colour-temperature strip for stars (`tempStrip`: TEMP_K for the bright stars and Sun, else B-V via Ballesteros; constellations.js now stores `bv`), four numbers (satellites: height, speed, laps a day, launched/years up; fleets: height, speed, first, launches; naturals: their own stats), fact, footer. CSS block at the end of css/cards.css. lore.js `roleOf(o)` (hand list by name → UCS purpose/detail → Soviet series → "Satellite") and `ownerWord`: "American weather satellite · 1979".
- **Catch the fade** (the skill): main.js `fadeCountdown` (looked up once a second) → `sky.fade` → sky.js `drawFade`: a gold ring runs down the last 20 s before what's in the circle enters Earth's shadow, "FADES IN 8S" then "NOW!" inside the circle. The eclipse shiny now needs the tap within 3 s of it going dark (recordSighting checks +3 s; was 12 s). Shiny label "Caught the fade". Verified: a CZ-2C stage collected at 2 s left saved shiny 'eclipse'.
- **Last chance cards**: js/last-chance.js `fallAt(o)` from the OMM MEAN_MOTION_DOT (perigee < 300 km, falls within 45 days; straight-line estimate to 16.4 laps/day). buildCards bumps the tier one step and sets `fallAt`. Red "LAST CHANCE · FALLS IN ABOUT N DAYS" bar on the picture; "BURNED UP ~DATE" stamp on archived cards once fallen. "Last chance" pill in Tonight's run and Find, " · last chance" over the circle. Sightings carry `lastChance`; patch **Witness** (3). About 20 qualify on 2026-10-14.
- **Tonight's headliner**: main.js `headliner(T)` (cached on T._head): the best fresh evening pass, icons/stations first, then last chance, rarity, height, brightness. Corner chip "HEADLINER" (day, unless bad weather; at night when within 3 h), gold card at the top of the Tonight tab with Show me + bell, gold day marker "★ Tonight's headliner", one free native alert 10 min before (id 7110, only if notifications are already allowed), +25 XP (sighting `headliner`), patch **Top of the Bill** (10). Verified catching Tiros 3 sets headliner.
- **Orbit view**: js/orbit-view.js `orbitGlobe` (orthographic globe, coarse LAND, ground track before/after now, live position, YOU pin). Collection viewer: one tap on a satellite card toggles it (attachFlip gained `onTap`, fired 330 ms after a lone tap; double tap still flips). `whereLine` → `#v-where` under the card: "Now over the North Pacific · 428 km up · 27,600 km/h", every second. orbit.js exports `satrecFor`.
- **Earth's shadow**: sky.js `drawEarthShadow` (night side, looking up): cells of sky where a satellite 500 km up is in Earth's shadow shaded faintly, the edge dashed gold, labelled "EARTH'S SHADOW · 500 KM UP" away from the circle. Settings → What shows → Earth's shadow (pref `shadow`, default on).
- Story cards (Wow!, Pale Blue Dot …) are designed on design/card-redesign.html but NOT built yet; story art drafts in the session scratchpad storygen/ (Big Ear is drawn as a dish; the real one was a flat reflector, redo before shipping).

2026-10-14 · v0.1.681: **Story cards** (Sevaan: "go ahead"). js/stories.js: 13 natural cards (`natural: 'story'`, key `story:<id>`, teal "❖ STORY" label instead of a rarity, album "Stories", art `story-<id>` made with Nano Banana Pro, prompts in the session scratchpad storygen/). Each is earned by a secret: wow, voyager (Pale Blue Dot), voyager2 (Grand Tour), pioneer10 (Plaque), pioneer11 (Ringside), newhorizons (Heart of Pluto), roadster (Starman), plus new secrets: arecibo (hold on M13 at night), halley (hold in Hydra at night), sputnik (crossing every 20 min on 4 Oct, tap), laika (3 Nov, tap), apollo11 (hold the Moon on 20 July), twohomes (catch the ISS and Tiangong within 10 min). main.js `earnStory` saves a story sighting and plays the normal reveal; secrets found before this get their story cards quietly on load. Unfound stories show as "Secret story · Hidden somewhere in the sky" with hidden art and no stats, even in preview. UFO, Santa, dinosaur bones, Dizzy and the shooting star stay patch-only.

2026-10-14 · v0.1.682: no delete (×) on "When you saw it" rows in the card viewer (Sevaan). The delete code stays but nothing calls it.

2026-10-14 · v0.1.683: the 13 story secrets (secrets.js STORY_SECRETS) give their story card only, no patch (Sevaan). Patches found before STORY_PATCH_CUTOFF stay on the wall (`hasPatch`). Patch-only secrets: UFO, fossil, Santa, Dizzy, shooting star.

2026-10-14 · v0.1.684: patch wall puts the newest earned patches first (earned date, then group; Sevaan).

2026-10-14 · v0.1.685 (Sevaan):
- Rank card ladder: the line through ranks you've passed is solid orange (it was only drawn from your rank to the next), and the rungs are centred (37.5 from each side, was 30 / 45).
- Constellation figures come into focus (design/con-focus.html B): a constellation star card's chart shows the figure (assets/art/con/<id>.webp, CON_FIGURES) faint and blurred, sharpening with the share of that constellation's stars you own, crisp at all of them (con-art.js `focus`, card.js `conFocus`; the reveal now passes ownedKeys). 71 more figures are being generated (scratchpad congen/, guides rendered by design/con-guides.html at the card's framing).

2026-10-14 · v0.1.686 (Sevaan, from the phone):
- **Twinkles:** every background star in a card picture twinkles. scripts/import-art.py finds up to 60 stars (was 9), dimmer ones (>135, was 170), closer together (2.5%, was 6%) and the bigger four-point ones; ~28 a picture. On mission cards the twinkle layer sits above the absolutely-positioned picture (z-index 3).
- **Flip:** attachFlip cancels the previous flip animation (they piled up with fill: forwards), swaps faces on the frame it's edge-on (read from the animation's currentTime, not a timer), 520 ms, and queues a double tap made mid-flip instead of dropping it.
- **Remind me under the steering pill:** after Show me, while "appears here at…" shows and the pass is 10+ min away, #gh-remind ("Remind me at 2:52 AM") sits under the pill (guideRemindPass). Toasts step aside while it shows.
- **Card viewer next-pass pill:** target and bell are centred (the viewer's generic button padding pushed the icons 7 px right; #viewer .fd-acts button.ic.ic.ic). The bell's result now shows inside the Collection (`sc:'say'` → ticket); it used to toast in Explore behind the Collection, so it looked like nothing happened. At the free limit the Collection closes so the Plus sheet is visible.

2026-10-14 · v0.1.687: **Notifications rework** (Sevaan; design/notifications.html). The automatic Plus pass alerts are gone (alertPicks/scheduleAlerts removed; old ids 7101–7103 cancelled; "Pass alerts" removed from PLUS_PERKS; web push retired). The app now sends at most two a day on its own, native only (main.js `scheduleNotes`, rerun when tonight's plan or the forecast changes):
- **Look up** (id 7120, pref nLookUp): at the start of the busiest hour between dusk and min(eveningEnd, 10:30 pm) (`lookUpAt`), only if the forecast is clear then; "Clear skies. Look up! It's dark now and the best of tonight runs until 9:02 PM. N new cards are up." Cancelled if the app is opened that evening (`markOpened`).
- **Catch of the day** (id 7110, pref nCatch): tonight's headliner, 10 min before, if you don't have it and it's clear.
- Everything else only from reminders you set. Settings rows "Look up" / "Catch of the day" (app only; turning one on asks permission).
- **Tour:** in the app, a third card "When to look up" (Turn on / Not now; asks permission inside the tap, OB_ART.notify), before the first catch. Steps read "Step N of 3" in the app, "of 2" on the web.
- No secrets during the tour (the sky behind the cards could land on Pioneer 11's spot and hand out a story card).

2026-10-14 · v0.1.688: tonight's headliner (and so the Catch of the day notification) must be easy to see for the sky slider: its brightest moment beats the slider's satellite limit (binocular limit with binoculars on) by 0.8 mag (Sevaan). Checked: city sky 17.5 → an SL-3 stage at mag 1.3; halfway → mag 2.7; dark site → mag 4.9. Recomputed when the slider changes (T._headSb).

2026-10-14 · v0.1.689: welcome card (Sevaan): the fact now explains the game ("Point your phone at the night sky. Every light up there is a card… Line one up in the circle and tap Collect… level cards up, earn mission patches and find secrets."); the three steps are bigger (1.7em); the opening flip is smoother (the shake eases out instead of snapping, the card gets its own layer a frame before turning, faces swap on the edge-on frame from the animation clock, sound starts after the first frame). Measured in WebKit: 1 frame over 34 ms out of 78.

2026-10-14 · v0.1.690 (Sevaan): the notifications tour step shows on the website too (asks the browser for permission; the website still can't schedule them); location and motion tour art animate like the notifications art (pin drops with a ripple; phone sways, waves pulse; off under reduced motion); the bad-weather page drops "Forecast ends here" and its day row fills the card width whatever the number of days.

2026-10-14 · v0.1.691: all 89 constellations have a figure (71 new, assets/art/con/<id>.webp 900×600, CON_FIGURES), so every constellation star card brings its figure into focus. Made with Nano Banana Pro from two existing figures (style) plus the constellation's own chart rendered by design/con-guides.html at the card's framing (placement); script copied to scripts/con-figures-gen.py (needs gcloud login sevaan@gmail.com). Redone after checking overlays: Andromeda (stars drawn in), Carina (needs Leo+Sco refs, Orion's hunter kept appearing), Corona Borealis, Horologium, Octans, Norma, Scutum, Vela.

2026-10-15 · v0.1.692: review.html shows constellation star cards with their figure in full focus (all its stars treated as owned) and groups them one per figure ("figure-<id>", search "figure-" for all 89).

2026-10-15 · v0.1.693: Hokushin-1 (69648) has its own picture, assets/art/cards/hokushin (3U CubeSat with one 4×5 solar wing), drawn from Sevaan's photo + CAD references (session scratchpad hokushin/); art-keys.js NAMED. It used to share classic-satellite-1.

2026-10-15 · v0.1.694: Hokushin-1 picture redone with the unfolded hinged solar wing beside the upright body, as in the reference photo (copy at design/hokushin-art.png).

2026-10-15 · v0.1.695: Hokushin-1 picture redone from the CAD drawing: flat 3U body with grey end box, green-edged cells, yellow antenna patches, round sensor, tall gold hinged wing standing up (gen2.py in scratchpad hokushin/).

2026-10-15 · v0.1.696: CZ-4 / 4B / 4C stages (70 cards) get their own picture, cz-4: white third stage with seams, rings and one blue band, twin YF-40A ribbed bells with pipework and frames, no gold domes; from Sevaan's reference photos (session scratchpad cz4c/). Other Long March stages keep long-march.

2026-10-15 · v0.1.697: Long March stage art by type (art-keys.js rocket rules): CZ-2C/2D/2F → cz-2 (new: one YF-22 main bell, four YF-23 verniers, lattice interstage ring); CZ-12/12B → cz-12 (new: wide 3.8 m stage, two YF-115); CZ-8/8A/7A/5 → long-march-3 (same twin YF-75 hydrogen stage as the CZ-3); CZ-4/4B/4C → cz-4. Only CZ-6, 6C, 11 and 10B (7 cards) still use the generic long-march.

2026-10-15 · v0.1.698: CZ-6C (cz-6c: 2.9 m stage, one YF-115) and CZ-10B (cz-10b: 5 m methane stage, one bell with dense plumbing, from the CASC slide engine photo) get their own stage art from Sevaan's references (scratchpad cz6c10b/). CZ-6 and CZ-11 stay on the generic long-march picture until there are references for their isolated upper stages.
