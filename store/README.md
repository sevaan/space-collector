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

## What they make
| | iPhone (6.3", Dynamic Island) | iPad (13") |
|---|---|---|
| Screenshots | 1206 × 2622 PNG, 6 | 2064 × 2752 PNG, 6 |
| App Preview | 886 × 1920 MP4, ~27 s, 30 fps, silent stereo track | 1200 × 1600 MP4, same |

Order on the store page: 1 sky (lock-on), 2 reveal, 3 Tonight, 4 shiny ISS card, 5 Collection, 6 patches.

## Changing things
- **Captions:** `CAPTIONS` at the top of `scripts/store/compose.mjs`.
- **The seeded collection, place, sizes, safe areas:** `scripts/store/common.mjs`.
- **Scenes and the video's script (timing, what it taps):** `capture.mjs` and `preview.mjs`.
- **The store text** (description, keywords, review notes): `store/listing.md`.

## Uploading
App Store Connect → Space Collector → the 1.0 version → App Previews and Screenshots. Drag the PNGs and `preview.mp4`
from `store/appstore/phone` onto "iPhone with Dynamic Island (medium display)" and from `store/appstore/pad` onto
"iPad 13" display". iPhone Duo is optional (it scales from the iPhone set).

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
