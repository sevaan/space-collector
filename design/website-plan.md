# spacecollector.app: the one-page plan (v2)

**v1** came from a planning room on 2026-10-16: a copywriter, a marketer, an interaction designer, and three players (Maya 38, Dev 24, Ruth 61).

**v2** adds a second room's critique: a creative director and a product skeptic, a mobile and accessibility specialist, three new players (Jordan 16, Priya 45 a science teacher, Tom 70 rural with big text), and a front-end engineer who benchmarked the real code.

All four panels said **go with changes**, and the idea itself held up. The changes below fix the problems they found.

## The one idea
**The moving lights over your house tonight are real things with names, and you can collect them.**

## What changed from v1, and why
| Problem the second room found | Fix in v2 |
|---|---|
| The time zone guesses the city badly. America/New_York runs from Maine to Miami. A confident "9:42" would be wrong for many people, and that loses the skeptics. | Times read "about 9:40" with a direction, around a tappable city ("Around **Toronto** ▾"). After the catch, one optional tap, **"Exact for my spot"**, takes a town search or location and only then shows the minute. |
| A "best pass" can be a faint stage nobody sees from a city, or it can be cloudy. | The page uses the app's headliner rule: bright enough for a city sky, and a high pass beats a low one. It checks the weather (Open-Meteo). When it's cloudy, or nothing bright is up, it says so and gives the next good night. |
| Working out the night in the browser takes 5–10 s on a phone plus a 1 MB download (benchmarked). | **The nightly build works it out.** The daily GitHub Action runs the app's own planner for the ~130 cities in our time-zone table and writes a small `tonight/<city>.json`. The page paints from that almost at once. A 300–600-object slim file covers "exact for my spot" and places outside the list. |
| On a phone, dragging a full-screen sky traps the page scroll, especially inside TikTok's and Instagram's in-app browsers. | **Sideways drag only.** Up and down always scrolls the page. The pass is lined up so it crosses at the circle's height, so aiming means "slide it under the circle and wait for orange". The sky takes at most about 60% of the screen, and the next section peeks in below. |
| "Sped up 30×" works against "this is real". | **A small clock ticks through the real pass** (9:41:30 → 9:44:10), so the speed explains itself and the real time stays on screen. |
| Nine sections and five toys, with the email ask last. Visitors from a clip read about three screens. | **Five screens.** The ask and the share sit **directly under the card**. |
| The sticky "1 / 4,850" tray is clutter and contradicts the "preview" stamp. | **No tray.** One line under the card says it instead. |
| "Preview: catch it to keep it" reads as a tease before launch. | The stamp becomes the call to action: **"Keep this one. We'll tell you the night you can catch it for real."** |
| The app's code is too heavy to reuse (`renderCard` pulls in 21 modules, `sky.js` is full-window WebGL). | The site gets its own **light 2D sky**: the app's projection maths, colours and fonts, and one satellite. **Cards are resolved at build time** (title, fact and stats in the JSON, the same art and card CSS). That keeps the page at about 150 KB of code before the first interaction. |
| Tom needs big text, the night needs dark screens, and it needs to work without dragging. | Text is in rem and survives zoom, body text is ≥16 px, and Barlow capitals are only for labels. The background is painted inline, with no white flash, including the reveal. There's an optional Red toggle, a **"Catch it for me"** button, and a screen-reader mode. |

## The five screens

### 1. Catch tonight's sky (the hero, plus the ask)
**On a 375×667 phone, top to bottom:**
- Headline: *"Hold your phone up. Collect the sky."*
- **"Around Toronto ▾ · ISS about 9:40 PM, rising in the southwest"**
- The sky, about 340 px tall: the app's fixed circle, stars, and the satellite with its dashed path. A small clock and a ghost-finger hint, "Slide the sky →".
- *"Free. No ads. No loot boxes."* with **App Store and Google Play buttons**. A phone sees its own store first; a desktop sees both. Until the listings are live, the buttons read "Coming soon"; on launch day they switch to the real links (a one-line config change).

**The catch:**
- The satellite drifts in, the circle turns orange, it locks on with a pulse and a soft sound (iPhones can't vibrate from a web page), and **Collect** rises.
- The sealed card glows in its rarity colour and shakes, then flips to the real card, inside the sky area (about 220 px wide).
- It takes 8–12 seconds. If you miss, it comes round again; the page never says "fail".
- **"Catch it for me"** lines it up automatically, for anyone who can't or won't drag. Screen readers get this mode with announcements ("Entering the circle… Locked") and a real Collect button that takes focus.

**Directly under the card:**
- *"No app needed. Go look at about 9:40, southwest, high and bright."*
- *"Shiny chance tonight: it slips into Earth's shadow at about 9:46."* (only when it applies)
- *"1 of 4,850. Keep this one: we'll tell you the night you can catch it for real."* plus a **one-field email form**. "One email at launch. Nothing else."
- **Share:** first the phone's share sheet, then Copy link if that fails, then the card shown as an image with "Press and hold to save". Inside the TikTok or Instagram in-app browser, a quiet "Open in Safari/Chrome" line.
- **Exact for my spot:** an optional town search, or location only if they tap it.

**Cases with their own copy:**
- **Daytime:** "It's daytime in Toronto. Dark at 6:31 PM. 4 h 12 min to go." You catch the Sun or the Moon, and tonight's pass appears as a dotted marker. A countdown leads the screen.
- **Cloudy:** "Cloudy over Toronto tonight. Next clear night: Thursday." The catch still works, labelled as tonight's sky behind the cloud.
- **Nothing bright tonight:** say so, and give the next good night.
- **Summer nights that never get fully dark (far north):** "Bright summer nights here. Satellites shine all night."

**After signing up:** *"You're on the list. The ISS passes over you at about 9:40 tonight. Go look."*

### 2. That was real
- **"What you're seeing", in plain words:** satellites shine because sunlight still reaches them after dark, they fade when they enter Earth's shadow, and some can't be seen from everywhere. Sources named: CelesTrak orbit data, the Yale/Hipparcos star catalogue, Open-Meteo weather.
- The 30-second film, filmed from the app with no mockups, plays only on a tap.
- A line Priya can put on the board: "Tonight's pass for your town" (a copyable line).

### 3. The cards
- A hand of six real cards: one per rarity plus a Shiny. Tap one to turn it over to its numbers and its fact.
- *"Rarity is how hard it is to see, never what you pay."*
- One line about depth: 89 constellations to complete, 180+ patches, ranks from Stargazer to Voyager.
- **The shiny fade, compact:** one small playable countdown ("FADES IN 3S… NOW!"). Tap anywhere on it; there's a 2-second window, an "Again" button and a "Slow it down" option. Under reduced motion it waits at NOW! for your tap. (Jordan would stop for this; the skeptic would have cut it, so it's kept small.)

### 4. Some things are hidden
- Three teasers, clearly marked as game secrets: "Aim where the Wow! signal came from. Look down in daylight. Try Christmas Eve."
- **The UFO crosses this section once per visit.** Catching it shows the *Close Encounter* patch on the spot. Nothing explains it.

### 5. Free, made by one person
- *"Free. No ads. No energy. No loot boxes."* One line on Plus: "Plus adds pass reminders, Rare alerts, the shiny forecast and card backs."
- The store buttons again. No personal "about me" (Sevaan, 2026-10-16).
- **Press kit link:** the film, card images, icon and one paragraph.
- The privacy link and credits.

## Removed from v1
- The separate "How a catch works" section (the film shows it).
- The full dusk-to-dawn scrubber and the city-to-dark-site sliders (needs the whole night planner and repeats the hero; maybe one still picture of the Tonight screen).
- The separate "Keep going" section (now one line in the cards section).
- The Plus table (now one line).
- The sticky tray.
- "Sped up 30×".

## Sharing
- **Now:** a good static link preview image (the card fan, the circle and the name), so shared links never look bare.
- **Phase 2:** `/c/<city>` pages built each night, with a preview image that is that city's card tonight. No cloud functions are needed, and old links still work. The visitor lands on the friend's card first, then their own sky.

## Build
**Data:**
- The daily Action adds the per-city build (about 5 minutes) and runs twice a day so Asia and Oceania aren't stale.
- `tonight/*.json` is cached for 1 hour; everything else is versioned.
- Deploy with `scripts/deploy-site.py`.

**Order:**
1. The per-city nightly data and the deploy.
2. A static hero that's already useful: city, "about 9:40", the daytime, cloudy and nothing-bright cases, and the email form.
3. The light sky, the replayed pass with its clock, aiming, lock-on and the card reveal.
4. Share chain, link preview image, "Exact for my spot".
5. Cards hand, shiny demo, "What you're seeing", press kit.
6. UFO, `/c/<city>` pages.

**Constraints:**
- No permission prompts on load.
- About 150 KB of code before the first interaction.
- Reduced motion respected.
- No reliance on vibration or local storage.
- Tested inside the TikTok and Instagram in-app browsers, not just Safari.

## Measures
Privacy-light analytics, tracking:
- **The main pair:** share rate and email sign-ups per catch.
- How often people correct the city or use "Exact for my spot", which shows whether the guess is good enough.
- Friend landings that go on to catch their own card.
- Return visits within 7 days.

## Decisions (2026-10-16, Sevaan)
1. Launching very soon: **App Store and Google Play buttons**, not a launch season. Each store's button shows "Coming soon" until its link is live.
2. **No follow links.**
3. Email list: still open.
4. Analytics: still open.
5. **No about-me section.**
