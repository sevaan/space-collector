#!/usr/bin/env python3
"""Satellite purposes from the UCS Satellite Database (Union of Concerned Scientists, current through
2023-05-01, https://www.ucs.org/resources/satellite-database), tab-delimited text export.
  python3 scripts/import-ucs.py <UCS .txt file>
Writes data/purpose.json: { NORAD id: [users, purpose, detailed purpose, operator] } for satellites in
data/catalog.json. js/lore.js turns these into the card's purpose fact."""
import csv, io, json, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.reader(io.StringIO(open(sys.argv[1], 'rb').read().decode('latin-1')), delimiter='\t'))
idx = {h.strip(): i for i, h in enumerate(rows[0])}
cat = json.load(open(os.path.join(root, 'data/catalog.json')))
ours = {o['id'] for o in cat['objects'] if not o.get('family')}
out = {}
for r in rows[1:]:
    try: i = int(r[idx['NORAD Number']])
    except Exception: continue
    if i not in ours: continue
    g = lambda k: r[idx[k]].strip() if k in idx and idx[k] < len(r) else ''
    out[str(i)] = [g('Users'), g('Purpose'), g('Detailed Purpose'), g('Operator/Owner')]
doc = {'_about': 'What each satellite is for, from the UCS Satellite Database (current through 2023-05-01, https://www.ucs.org/resources/satellite-database). [users, purpose, detailed purpose, operator].', 'sats': out}
json.dump(doc, open(os.path.join(root, 'data/purpose.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
print(len(out), 'satellites')
