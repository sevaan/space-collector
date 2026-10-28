# Google Play listing (English) — the words and answers for Play Console

Written 2026-10-27, adapted from `store/listing.md` (App Store). Screenshots: `store/appstore/android/` (1080 × 2160,
made by `node scripts/store/capture.mjs android` then `node scripts/store/compose.mjs android`). Feature graphic:
`store/appstore/header/header-1024x500.png`. App icon 512 × 512: `store/play-icon-512.png`.

## Main store listing
- **App name (30):** Space Collector
- **Short description (80):** Spot real satellites, planets and stars overhead. Collect every one as a card.
- **Category:** Games → Adventure (tags: Astronomy, Education). **Contact email:** hello@spacecollector.app.
  **Website:** https://spacecollector.app · **Privacy policy:** https://spacecollector.app/privacy

**Full description (4,000):**
Every light in the night sky has a name. Space Collector turns each one into a card. Hold your phone up, line one up in the circle, tap Collect: the Space Station, Hubble, rocket stages, the planets, the Moon and the stars.

Everything shows up right where it really is, worked out from real orbits for where you’re standing.

HOW TO PLAY
• Point your phone at the sky.
• Line up an object in the circle.
• Tap Collect to claim its card.

THOUSANDS OF REAL CARDS
Space stations and telescopes, weather satellites, Cold War relics, rocket stages from the 1960s, the planets, the Moon and the stars. Every card says what the object does, with real numbers and one true, sourced fact. Rarity is how hard something is to see, never what you pay.

PLAN YOUR NIGHT
Tonight’s plan shows when it gets dark, the best pass to catch with a countdown, everything passing tonight and what each one earns, and the weather, so you know when to step outside.

SOMETHING NEW EVERY NIGHT
Nightly missions, a new themed week every Monday, sky events like the Moon meeting a planet, supermoons, eclipses and meteor showers, Starlink trains, and the Moon’s eight phases to stamp.

WORKS BY DAY TOO
Catch the Sun and the Moon, and see when tonight gets dark and what’s coming over.

SHINY CARDS
Catch something at a lucky moment, like slipping into Earth’s shadow, passing right beside the Moon, straight overhead or just launched, and its card comes out shiny.

MISSIONS, PATCHES AND SECRETS
More than 180 mission patches, constellations to finish star by star, ranks from Stargazer to Voyager, and a few secrets hidden in the sky. Some are even under your feet.

FREE. NO ADS. NO LOOT BOXES.
The sky, every card, every patch and every mission are free.

SPACE COLLECTOR PLUS (optional)
Reminders for any pass you choose (Space Station reminders are always free), Rare alerts when a new Rare or better card passes, the shiny forecast, six card back designs and a members-only patch. Monthly, yearly (with a 7-day free trial) or once, forever. Subscriptions renew automatically until cancelled in Google Play.

## Store settings
- **App or game:** Game. **Free.** **Ads:** No, the app has no ads.
- **Countries:** start with the same list as the App Store (everywhere except the EU until a trader address is decided), or all.

## App content (Policy → App content)
- **Privacy policy:** https://spacecollector.app/privacy
- **App access:** All functionality is available without special access (no login).
- **Ads:** No.
- **Content rating (IARC questionnaire):** Category "Game" (or Reference/Education). Answer No to violence, fear, sexuality, language, controlled substances, gambling, user interaction/sharing of user content (Share card uses the system share sheet only), and location sharing with other users (location is never shown to anyone). Expected rating: Everyone / PEGI 3.
- **Target audience:** 13 and over (avoids the Families programme rules; the game suits younger players but nothing is designed for children). Appeal to children: not designed for them.
- **News app:** No. **Government app:** No. **Financial features:** None. **Health:** None.
- **Data safety:**
  - Does the app collect or share user data? **Yes, collects; does not share.**
  - Encrypted in transit: **Yes.** Users can request deletion: **Yes** (all data is on the phone; Settings → Reset everything; usage reports are anonymous with no account).
  - **Location → Approximate location:** collected, not shared, processed ephemerally (rounded place sent to our server to fetch the weather and planes; not stored). Purpose: App functionality. Required (the sky depends on it; a time-zone city is used if declined, so mark Optional).
  - **App activity → App interactions:** collected (anonymous usage reports: random install id, screens/events, no place or name), not shared, optional (Settings → Help → Share anonymous usage). Purpose: Analytics.
  - **App info and performance → Crash logs / Diagnostics:** collected (error messages in the same anonymous reports), not shared, optional. Purpose: Analytics / App functionality.
  - **Financial info → Purchase history:** only if Plus is sold: processed by Google Play and RevenueCat to unlock Plus; not shared for other purposes. Purpose: App functionality.
  - No personal info, contacts, photos, files, messages, health or device ids for advertising.
- **Permissions declared in the manifest:** approximate location (ACCESS_COARSE_LOCATION), notifications (POST_NOTIFICATIONS), internet, vibrate. No precise location, no camera, no exact alarms.

## Before Plus can be sold on Android
1. In Play Console → Monetise → Products: subscriptions `plus_monthly` (US $1.99), `plus_yearly` (US $14.99, 1-week free trial for new subscribers) and the one-time product `plus_forever` (US $29.99, managed product). Same ids as the App Store.
2. In RevenueCat: add the Play app (package io.github.sevaan.spacecollector), give it the Play service-account JSON, import the three products, attach them to the `space_collector_plus` entitlement and the default offering, and copy the `goog_…` public key into js/plus.js RC_KEYS.android. Until then the Android app gives every reminder free and the Plus page says "Coming soon to Google Play".

## Release
- New personal developer accounts must run a **closed test with at least 12 testers opted in for 14 days** before applying for production. Upload the .aab to a Closed testing track, add testers by email (a Google Group or list), share the opt-in link.
- Each upload needs a higher versionCode: `native/build-android.sh <n>` (the first build was 1).
- Play App Signing on (Google keeps the app signing key; our upload key is ~/.space-collector/upload.jks, password in the login keychain).
- After Play App Signing is set up, add Google's **app signing** SHA-1 (Play Console → Test and release → App integrity) wherever a SHA-1 is needed. (Firebase sign-in is no longer used, so nothing needs it today.)
