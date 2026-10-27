#!/usr/bin/env python3
"""Bring in a batch of drawn pictures of real satellites (2026-10-27): python3 scripts/apply-drawings.py <drawn.json> <folder>

Drawings are generated from a written description of the satellite (made by studying references: Nanosats database,
builder pages, mission reports; the reference pictures themselves are never fed to the image model). drawn.json:
{ art: { ids: [NORAD…], refs: [urls studied], description } } with <folder>/<art>.png framed 4:3. Records each in
scripts/art-drawings.json, maps every NORAD id to its art in js/art-photo-map.js (the per-satellite picture map), then
runs scripts/import-art.py on the folder and scripts/build-art-shared.mjs. Drawings carry no photo credit."""
import json, os, sys, subprocess, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
drawn, folder = json.load(open(sys.argv[1])), sys.argv[2]
rec_p = os.path.join(root, 'scripts/art-drawings.json'); rec = json.load(open(rec_p)) if os.path.exists(rec_p) else {}
map_p = os.path.join(root, 'js/art-photo-map.js')
cur = json.loads(re.search(r'PHOTO_MAP = (\{.*\});', open(map_p).read(), re.S).group(1))
n = 0
for art, e in drawn.items():
    if not os.path.exists(os.path.join(folder, art + '.png')): continue
    rec[art] = {'ids': e['ids'], 'refs': e.get('refs', []), 'description': e.get('description', '')}
    for i in e['ids']: cur[str(i)] = art
    n += 1
json.dump(rec, open(rec_p, 'w'), indent=1, ensure_ascii=False)
open(map_p, 'w').write("// Written by scripts/apply-photos.py and scripts/apply-drawings.py (2026-10-26/27): satellites with a picture of their\n// own (a real photo or official illustration — sources in scripts/art-photos.json — or a drawing made from a written\n// description of references, scripts/art-drawings.json). NORAD id → art file. Checked after NAMED in js/art-keys.js.\nexport const PHOTO_MAP = " + json.dumps(dict(sorted(cur.items(), key=lambda kv: int(kv[0]))), separators=(',', ':')) + ";\n")
subprocess.run([sys.executable, os.path.join(root, 'scripts/import-art.py'), folder], check=True)
subprocess.run(['node', os.path.join(root, 'scripts/build-art-shared.mjs')], check=True)
print(n, 'drawings')
