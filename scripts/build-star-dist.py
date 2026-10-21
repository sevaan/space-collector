# Star distances for the card stats (2026-10-17, Sevaan: "Can we add a distance section here too?"). One query to
# VizieR for the Hipparcos new reduction parallaxes (van Leeuwen 2007, I/311/hip2) of every collectable star in
# data/constellations.json. Writes data/star-dist.json: { hip: [light-years, relative error] }.
import json, urllib.request, urllib.parse
cons = json.load(open('data/constellations.json'))['constellations']
hips = sorted({s['hip'] for c in cons for s in c['stars']})
txt = ''
for i in range(0, len(hips), 60):  # VizieR answers nothing for one very long list: ask 60 at a time
  q = urllib.parse.urlencode({'-source': 'I/311/hip2', '-out': 'HIP,Plx,e_Plx', '-out.max': 'unlimited', 'HIP': ','.join(map(str, hips[i:i + 60]))})
  txt += urllib.request.urlopen('https://vizier.cds.unistra.fr/viz-bin/asu-tsv?' + q, timeout=120).read().decode() + '\n'
out = {}
for line in txt.splitlines():
  p = line.split('\t')
  if len(p) < 3 or not p[0].strip().isdigit(): continue
  try: hip, plx, e = int(p[0]), float(p[1]), float(p[2])
  except ValueError: continue
  # A positive value alone is insufficient: do not invert a measurement whose
  # uncertainty exceeds the parallax itself (e.g. HIP 89341 / Mu Sagittarii).
  if plx <= 0 or e < 0 or e >= plx: continue
  out[hip] = [round(3261.56 / plx, 1), round(e / plx, 3)]  # 1 parsec = 3.26156 ly; parallax in milliarcseconds
json.dump(out, open('data/star-dist.json', 'w'), separators=(',', ':'))
print(len(hips), 'stars,', len(out), 'with distances')
