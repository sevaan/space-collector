# Improvements plan (2026-10-25)

24 ideas from the rubric follow-up. Mockups first (design/first-night.html, real-sky.html, catch-feel.html, come-back.html); nothing is built until Sevaan picks.

## How each one gets built (to avoid bugs)
1. One feature per commit, with a CLAUDE.md note.
2. Before: read every place the feature touches; list them in the commit message.
3. After: lint (no-undef), `node --test tests/*.test.mjs`, then a scripted WebKit playtest of the screens it touches at 402×874 and 375×667 (and a Duo/iPad size if layout changed), with a before/after check that nothing else on screen moved.
4. New rules with logic (chains, peak bonus, quick Commons, birthday lookup, Starlink trains, window mode) get unit tests.
5. Anything shown to every player on first run ships behind a pref or the testing tools first, tried on SC Tester, then switched on.
6. Usage reports (/stats) watch each change after it ships: tour done/skip, first-night catch rate, errors.

## Batches, safest first
**Batch 1 · new screens, no change to existing rules (low risk)**
- Daytime home (clarity) · Empty-sky nudge · Teach the fade · Moon check · Live satellite count on the welcome card · Teach levels after the first catch · Location feels optional · Notice audit (cuts only).

**Batch 2 · new reasons to come back (medium: notifications + scheduling)**
- "Almost there" nudges · Seasonal returns · Day-one ISS appointment · Halloween ghost satellite (must ship and reach phones before Oct 31, or wait a year).
- Risk: notification count. Keep the existing rule of at most two automatic notifications a day; these replace, not add.

**Batch 3 · changes to the catch itself (higher: touches capture, reveal, XP)**
- Quick Commons (reveal flow, missions, patches and progress chips must still fire) · Chains · Peak bonus · Worth-aiming glow.
- Risk: XP/rank changes. Rank floors already protect players; chains/peak are additive bonuses only.

**Batch 4 · bigger systems (data + new modes)**
- Starlink trains (detect fresh launches from the catalogue) · Birthday satellite · Themed weeks · "Which looks like your sky?" · Window mode · Tour picks a passing ISS/Rare · Night ambience (needs new sound beds).

## Watch-outs
- Tour changes interact with tourCatchId, obFinish, the first-catch quiet period and notices held during the tour.
- Quick Commons must not apply to the tour catch, the first card ever, shinies, level-ups, new stamps or anything earning a patch/rank (those keep the full reveal).
- Halloween secret has a hard date: decide first.
