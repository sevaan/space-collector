# App Store screenshots and previews

Everything here is made from the real app by three scripts, so after any change you can regenerate it all.

## Regenerate

```bash
cd ~/Documents/Space\ Collector
python3 -m http.server 8765 &          # the app, if it isn't already running
export PATH=~/.nvm/versions/node/v22.23.1/bin:$PATH
npm i                                  # once: Playwright (a dev dependency)
node scripts/store/capture.mjs         # raw app screens → store/raw/
node scripts/store/compose.mjs         # captioned screenshots → store/appstore/<phone|pad>/1…6-*.png
node scripts/store/preview.mjs         # App Preview videos → store/appstore/<phone|pad>/preview.mp4
```

Each script takes `phone`, `pad` or nothing (both). `capture.mjs` and `preview.mjs` also take `--when=2026-10-19T20:30:00-04:00`; by default they use tonight at 8:30 PM, Toronto, and move on a few minutes if nothing good is up.

### iPhone Duo (inner display, landscape)
```bash
node scripts/store/capture.mjs duo --when=2026-10-28T20:30:00-04:00   # pick an evening with a high ISS pass before dawn
node scripts/store/compose.mjs duo                                     # store/appstore/duo/1…6-*.png, 2853 × 2007
cp store/appstore/duo/[1-6]-*.png ~/Desktop/"Space Collector App Store/iPhone Duo/"
```
The Duo set uses the Duo's own layouts: 951 × 669 @3x with its 84pt status strip on the right faked as `--safe-r`
(common.mjs `DEVICES.duo`), Tonight as a book (the Tonight tab, captured first, in the evening), the shiny Hubble and
Saturn open beside the grid in the Collection. The weather is blocked (`clear`, all three sets since 2026-10-22) so a far-off date never reads "Overcast".
compose.mjs puts the caption in a band across the top and the screen under it, with the time and icons drawn in the
status strip. `--when` matters: the hero is the ISS only if it has a high pass that night (check with any pass
predictor, or try a date and read the `aim:` line). Same captions and order as the phone set.

## What they make
| | iPhone (6.3", Dynamic Island) | iPad (13") |
|---|---|---|
| Screenshots | 1206 × 2622 PNG, 6 | 2064 × 2752 PNG, 6 |
| App Preview | 886 × 1920 MP4, ~27 s, 30 fps, silent stereo track | 1200 × 1600 MP4, same |

Order on the store page (set by `ORDER` in compose.mjs; 2026-10-19 marketing pass): 1 sky (lock-on, hero), 2 reveal, 3 shiny ISS card, 4 Tonight, 5 Collection, 6 patches.
The hero shot jumps the clock to the peak of tonight's best Rare-or-better pass (common.mjs `aimBest`), so the first screenshot never shows a Common.
Captions follow one rule: the orange eyebrow is a fact, the big headline is a feeling; "Free to play · no ads" closes the set.

## Changing things
- **Captions and order:** `CAPTIONS` and `ORDER` at the top of `scripts/store/compose.mjs` (then re-run compose only; no need to re-capture).
- **The seeded collection, place, sizes, safe areas:** `scripts/store/common.mjs`.
- **Scenes and the video's script (timing, what it taps):** `capture.mjs` and `preview.mjs`.
- **The store text** (description, keywords, review notes): `store/listing.md`.

## Uploading
App Store Connect → Space Collector → the 1.0 version → App Previews and Screenshots. Drag the PNGs and `preview.mp4`
from `store/appstore/phone` onto "iPhone with Dynamic Island (medium display)" and from `store/appstore/pad` onto
"iPad 13" display". The six PNGs in `store/appstore/duo` go on "iPhone Duo" (inner display, 2853 × 2007 landscape;
the outer display uses 1398 × 2034 and has no set yet). Duo screenshots are required from April 2027.

## The 30-second marketing video
```bash
node scripts/store/promo.mjs          # record → scenes → voice → build: store/promo/space-collector-30s.mp4 (1080 × 1920, 30 fps)
node scripts/store/promo.mjs build    # just re-assemble (e.g. after editing captions or voice timings)
```
Steps can run alone: `record` (real app footage into store/promo/clips), `scenes` (the rendered intro, the phone raised,
the end card, the caption cards), `voice` (ElevenLabs "Brian"; key from ELEVENLABS_API_KEY, ~/.elevenlabs_key or the
keychain item `elevenlabs-api-key`; macOS `say` as a stand-in without one), `build` (picture + captions + sound).
The timeline, captions and voice lines are the `T`, `CAPTIONS` and `VO` tables at the top of `scripts/store/promo.mjs`.
The app's own sounds are logged while recording and placed where they happened; "Permafrost" plays underneath.

## Product page header (optional)

`node scripts/store/header.mjs` makes the wide banner for App Store Connect → version → Header and Search Results → Header: `store/appstore/header/header-5244x2950.png` and `header-3840x1646.png`. It captures the real sky (locked on the ISS) and three cards, then lays out the words and cards. Change the words in `WORDS` and the cards in `CARDS` at the top of the script.
