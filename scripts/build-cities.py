# The offline city list for Settings → Location search (2026-10-25: Open-Meteo's geocoding isn't free for an app that sells
# a subscription). From GeoNames (CC BY 4.0, "Data from GeoNames"): every place with 15,000+ people, ~34k.
#   python3 scripts/build-cities.py <folder with cities15000.txt, admin1CodesASCII.txt, countryInfo.txt>
# Writes data/cities.json: [[name, ascii name or "", region, country, lat, lon, population], …] sorted biggest first.
import json, sys, os
d = sys.argv[1]
country = {}
for line in open(os.path.join(d, 'countryInfo.txt'), encoding='utf-8'):
    if line.startswith('#'): continue
    f = line.rstrip('\n').split('\t')
    if len(f) > 4: country[f[0]] = f[4]
admin1 = {}
for line in open(os.path.join(d, 'admin1CodesASCII.txt'), encoding='utf-8'):
    f = line.rstrip('\n').split('\t')
    admin1[f[0]] = f[1]
rows = []
for line in open(os.path.join(d, 'cities15000.txt'), encoding='utf-8'):
    f = line.rstrip('\n').split('\t')
    name, ascii_, lat, lon, cc, a1, pop = f[1], f[2], float(f[4]), float(f[5]), f[8], f[10], int(f[14] or 0)
    rows.append([name, ascii_ if ascii_ != name else '', admin1.get(f'{cc}.{a1}', ''), country.get(cc, cc), round(lat, 3), round(lon, 3), pop])
rows.sort(key=lambda r: -r[6])
json.dump({'source': 'GeoNames (CC BY 4.0), cities15000', 'cities': rows}, open('data/cities.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(rows), os.path.getsize('data/cities.json'))
