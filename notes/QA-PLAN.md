# Space Collector QA plan (2026-10-08)

A fine-tooth pass over every part of the app. Each item is checked by an automated browser run (iPhone-sized
viewports, real catalogue, real clock and a few set times of day), by reading the code, or both. Results are logged
at the bottom: what was found, what was fixed, what's left.

## How it's tested
- **Unit tests:** `node --test tests/` (49 tests: orbits, facts, fleets, progress, sensors, shiny, sky limits, events).
- **Browser runs (Playwright):** Chromium and WebKit at 375 × 667 (iPhone SE), 393 × 852 (iPhone 15), 430 × 932 (Pro Max).
  Every run collects console errors, failed network requests and page exceptions.
- **Layout checks:** horizontal overflow, text clipped by its box, elements off-screen, overlapping fixed UI.
- **Code review:** each area read end to end for logic errors, missing guards, stale state and leaks.
- **Times of day:** day, dusk, night with satellites up, late night with none lit.

## Sections and checks

### 1. Loading and first run
- Loader shows on a full refresh only, no white flash, version check banner.
- Welcome card, Begin, location permission (granted, denied, saved, example location).
- Onboarding tour: every step, Skip, Replay from Settings.
- Service worker: offline reload works, new versions replace old files.

### 2. Explore (sky view)
- Sky renders day, dusk and night; Milky Way photo; stars, planets, Moon, Sun; landscape and ground.
- Target circle: lock-on, discover card, tap to collect, auto-log of owned cards.
- Labels: no jumping or overlapping (see the 2026-10-08 text test).
- Chips: Tonight / countdown / event chip / next pass; banners and toasts stack correctly.
- Radar compass and "N up" count match the Now list.
- Sky slider (City lights ↔ Dark site), drag-to-look, compass nudge, night mode, camera view.
- Secrets: fossil, UFO, Santa, Roadster, shooting star, Voyager, Dizzy; patches earned once.

### 3. Capture and reveal
- First catch (sealed card, flip), repeat sighting, fleet stamp, constellation star, shiny, milestone toasts.
- New-card screen D: rolling +XP, rank bar, share, glow; fits without scrolling on small phones.
- Flick to dismiss, View in collection, close button.

### 4. Up in your sky panel
- Now tab: map turns with the phone, list, empty state, tab switching redraws.
- Tonight tab: summary chips, chart, rarity filter, Up next / Later, Show all, swipe-to-remind, marks, Also up tonight, alarm cards.

### 5. Collection (cards.html in the iframe)
- Grid, albums/sets, sort, card-size slider, tiles for owned / unowned / gold / shiny / fleet.
- Card viewer: tilt, flip, share, passport for fleets, history, next/previous, close.
- Rank card (logbook), missions, events, Patches tab and patch detail.
- Switcher between Explore and Collection, deep links (cards.html#key).

### 6. Settings
- Every row, toggle and sheet; location; sound; export data; reset everything; testing tools.

### 7. Cross-cutting
- Red night mode on every screen.
- Reduced motion.
- Small and large phones; landscape not broken.
- Accessibility basics: buttons have names, dialogs labelled, focus not lost.
- Performance: frame time in Explore, memory growth over a few minutes.

## Results log

### Run 1 — 2026-10-08

**How:** unit tests; a Playwright sweep of 30 states (welcome → tour → Explore day/night → Now → Tonight + filter → every Settings
sheet → night mode → capture + reveal → Collection tabs, viewer, flip, size slider, search, rank card) at 375, 393 and 430 px
in Chromium and WebKit; targeted regression checks; three independent code reviews (Explore + capture; Collection;
panels, Settings, offline).

**Clean:** no page errors, console errors or failed requests at any size in either engine; no clipped text; every `$('id')`
exists; the iframe message protocol matches on both sides; fleet migration and shiny rules hold. (Items reported "off-screen"
are inside sideways-scrolling strips, as intended.)

**Fixed (high / medium):**
1. Compass: a real, lasting heading change took minutes to be accepted (blended 2 %, then waited another 1.5 s). Now taken at once. (Unit test was failing.)
2. Reopening a panel within 300 ms of closing it left it hidden with the sky paused and the HUD frozen (reload needed). Same race in Settings sheets.
3. Opening Settings during the tour's catch step carried on to the "Tonight looks good" page; a replay could count any owned object as the tour catch.
4. Tonight plans were stamped with the settings current when they *arrived* (a location fix mid-run kept Peterborough's plan as yours); forced refreshes were dropped while one ran.
5. After jumping the clock forward and back, Tonight, rise times and below-horizon paths kept the future results (signed time checks).
6. Blocked storage (cookies off) threw in the reveal's sound check and stopped captures.
7. A pinned Moon/planet/star that set left an invisible pin dimming everything.
8. Typed-in coordinates weren't saved, and every launch asked GPS over them; "rising soon" wasn't reset.
9. "Tap to update" needed two taps (the service worker served the cached old page); redrawn art never reached phones that had the old file.
10. Pass search by day used the daytime brightness limit for the whole 48 h; Tonight worked out by day could stop before dawn in winter.
11. Collection: tapping "Collection" inside the Collection loaded a second copy of the app in the frame on the next Explore tap.
12. Collection: deleting a constellation's sighting came straight back; deleting a card's last sighting put the viewer out of step (and `% 0`).
13. Collection: "View in collection" could open nothing under a leftover filter or on the Albums / Patches tab; old links to Globalstar / Orbcomm / Iridium satellites failed.
14. Red night mode: the Now map, Tonight chart, chips, rarity bars, mini cards, countdown, Settings icons, below-horizon labels, UFO, Collection headings, albums, patch wall and viewer lines all kept their colours; the Collection's sky background stayed on.

**Fixed (low):** weather replies out of order and no retry; Milky Way lost after iOS drops WebGL; "View card" sightings got no XP / patch toasts;
the empty-state button said "Jump" but only reported (now aims you at the next pass); en-CA "p.m." overflowed Tonight times; Escape left sheets open;
"Show all" capped at 80; Reset everything waited on the database; "Stars, planets & Moon" wasn't remembered; screen-reader live region rewritten 4×/s;
collect button's label when it opens an owned card; Tonight rows not reachable by keyboard (Enter opens, ← reveals the alarm); tabs lacked aria-selected;
reduced motion ignored in parts of the reveal; long names overflowing canvas headings on narrow phones; progress slowing with many observing places;
share image rank / fleet fact / night colour / leaked URL; constellation "collected" date; two unguarded lookups.

**Left / to check on a phone:**
- The logbook's "Remind me Saturday" streak reminder has code but no button (feature gap, not wired).
- Reminders and Export use a download link; in a home-screen (installed) iPhone app this may save to Files instead of offering Add to Calendar.
- Real-device checks: compass, gyro tilt, camera view, WebGL context loss, the new service-worker update path.
