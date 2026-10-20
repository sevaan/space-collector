# App Store listing (English) — the words that go into App Store Connect

Kept here so they can be edited and pasted again. Screenshots and previews: `store/appstore/` (see `store/README.md`).

## App Information page
- **Name:** Space Collector
- **Subtitle (30):** Collect the night sky
- **Primary category:** Games → Adventure; secondary: Education
- **Privacy Policy URL:** https://spacecollector.app/privacy

## Version page
**Promotional text (170):**
Point your phone at the night sky and collect what’s really passing over you: the Space Station, Hubble, old rocket stages, the planets and the stars.

**Description (4,000):**
Every moving light in the night sky has a name. Space Collector turns each one into a card.

Hold your phone up to the sky. Satellites, rocket stages, the International Space Station, the planets, the Moon and the brightest stars show up right where they really are, worked out from real orbits for where you’re standing. Line one up in the circle, tap Collect, and its card is yours.

HOW TO PLAY
• Point your phone at the sky.
• Line up an object in the circle.
• Tap Collect to claim its card.

THOUSANDS OF REAL CARDS
Space stations and telescopes, weather satellites, Cold War relics, rocket stages from the 1960s, the planets, the Moon and the stars. Every card has real numbers and one true fact. Rarity is how hard something is to see, never what you pay.

PLAN YOUR NIGHT
Tonight’s plan shows when it gets dark, the best pass to catch, the busiest moment and the weather, so you know when to step outside.

SHINY CARDS
Catch something at a lucky moment, like slipping into Earth’s shadow, passing right beside the Moon, straight overhead or just launched, and its card comes out shiny. Catch a full Moon for a shiny Moon.

MISSIONS, PATCHES AND SECRETS
Nightly missions, more than 180 mission patches, constellations to finish star by star, ranks from Stargazer to Voyager, and a few secrets hidden in the sky. Some are even under your feet.

FREE. NO ADS. NO LOOT BOXES.
The sky, every card, every patch and every mission are free.

SPACE COLLECTOR PLUS (optional)
Pass reminders for any pass you choose, Rare alerts when a new Rare or better card passes, the shiny forecast, six card back designs and a members-only patch. Monthly, yearly (with a 7-day free trial) or once, forever. Shared with Family Sharing.

Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period, and are charged to your Apple Account. Manage or cancel them in your Apple Account settings.
Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy: https://spacecollector.app/privacy

**Keywords (100):**
satellite,astronomy,stargazing,night sky,ISS,planets,stars,constellation,moon,telescope,cards,game

**Support URL:** https://spacecollector.app
**Marketing URL:** https://spacecollector.app
**Copyright:** 2026 Sevaan Franks

## App Review notes
(Updated 2026-10-20. Paste the block between the lines into App Store Connect → the version → App Review Information → Notes. Fill the contact fields there yourself.)

---
Thank you for reviewing Space Collector. No account or sign-in is needed, and there is no server account to create.

WHAT IT IS
Point the phone at the sky: the app shows the real satellites, rocket stages, planets and stars overhead, where they actually are. Line one up in the circle and tap Collect to keep its card.

DURING THE DAY (most reviews happen in daylight)
- On first launch, follow the short tour. The first catch it guides you to by day is the Sun: follow the arrow, put it in the circle, tap Collect. (The app tells players never to look at the Sun directly; they aim the phone, not their eyes.)
- Satellites are only visible from Earth after dusk, so by day the sky shows where tonight's passes will appear.
- To see the night sky at any time: open Settings (sliders icon, top right), scroll to the bottom and tap the version line 7 times. A "Testing tools" section appears. Tap "Jump to next visible pass" (or +1h), then close Settings. Turn on "Allow capturing anything" there to collect without precise aiming.
- If the device has no motion sensors or you prefer, drag the sky with a finger to look around.

IN-APP PURCHASE (Space Collector Plus)
Settings → Space Collector Plus, or any bell icon marked PLUS. Options: Monthly ($1.99), Yearly ($14.99 with a 7-day free trial for new subscribers), Forever ($29.99, one-time, non-consumable). Restore purchases is on the same sheet, with links to the Terms of Use (Apple standard EULA) and our Privacy Policy. Every card, patch and mission is free; Plus adds extras (unlimited pass reminders, card backs, the full shiny forecast). Purchases use RevenueCat with StoreKit.

PERMISSIONS
- Location (While Using): to work out the sky above the player. An approximate position is all it needs. NSLocationAlwaysAndWhenInUseUsageDescription is present only because the location plugin references that API (ITMS-90683); the app never requests Always.
- Motion: to know where the phone is pointing.
- Notifications (optional): reminders the player sets for a pass, plus a few alerts on clear evenings (a "look up" alert and tonight's best pass; Plus adds rare-pass alerts). Each can be turned off in Settings.
- Camera: NSCameraUsageDescription belongs to an experimental camera view in the hidden Testing tools only; it is not part of the normal app and is never requested otherwise.

DATA
No ads, no tracking, no analytics in the app. The collection stays on the device and in the player's own iCloud key-value storage. Weather (Open-Meteo) and aircraft lookups (to say "Just a plane") use a rounded location. Privacy Policy: https://spacecollector.app/privacy

CONTACT
hello@spacecollector.app
---
