#!/usr/bin/env python3
"""Bring in a batch of per-satellite pictures (2026-10-26): python3 scripts/apply-photos.py <picked.json> <folder of framed PNGs>

picked.json: { art: { ids: [NORAD…], credit, licence, source, shows?, sibling? } } with <folder>/<art>.png framed 4:3.
Records each in scripts/art-photos.json (credit/licence/source), maps every NORAD id to its art in js/art-photo-map.js,
rewrites js/art-credits.js, then runs scripts/import-art.py on the folder and scripts/build-art-shared.mjs."""
import json, os, sys, subprocess, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
picked, folder = json.load(open(sys.argv[1])), sys.argv[2]
photos_p = os.path.join(root, 'scripts/art-photos.json'); photos = json.load(open(photos_p))
map_p = os.path.join(root, 'js/art-photo-map.js')
cur = json.loads(re.search(r'PHOTO_MAP = (\{.*\});', open(map_p).read(), re.S).group(1)) if os.path.exists(map_p) else {}
n = 0
for art, e in picked.items():
    if not os.path.exists(os.path.join(folder, art + '.png')): continue
    photos[art] = {'credit': e['credit'], 'licence': e['licence'], 'source': e['source']} | ({'shows': e['shows']} if e.get('shows') else {}) | ({'sibling': e['sibling']} if e.get('sibling') else {})
    for i in e['ids']: cur[str(i)] = art
    n += 1
json.dump(photos, open(photos_p, 'w'), indent=1, ensure_ascii=False)
open(map_p, 'w').write("// Written by scripts/apply-photos.py (2026-10-26): satellites with a picture of their own (a real photo or official\n// illustration; sources in scripts/art-photos.json). NORAD id → art file. Checked after NAMED in js/art-keys.js.\nexport const PHOTO_MAP = " + json.dumps(dict(sorted(cur.items(), key=lambda kv: int(kv[0]))), separators=(',', ':')) + ";\n")
open(os.path.join(root, 'js/art-credits.js'), 'w').write("// Written from scripts/art-photos.json (2026-10-26): card pictures that are real photos or official illustrations, with\n// the credit each carries on the card (required for CC BY / BY-SA; public domain ones credited anyway).\nexport const ART_CREDITS = " + json.dumps({a: v['credit'] for a, v in photos.items()}, ensure_ascii=False) + ";\n")
subprocess.run([sys.executable, os.path.join(root, 'scripts/import-art.py'), folder], check=True)
subprocess.run(['node', os.path.join(root, 'scripts/build-art-shared.mjs')], check=True)
print(n, 'pictures,', sum(1 for a in cur.values() if a in picked), 'cards mapped in this batch')
