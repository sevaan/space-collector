# What each debris card really is (2026-10-15, Sevaan: "if we know what the object is, it should be in the fact").
# From the catalogue name ([TANK], [SYLDA]…) and the alternative names on satellitemap.space / isstracker.pl
# (scratchpad debris/info.json, looked up 2026-10-15). Writes data/debris.json: { id: { what, art, fact } }.
# Unidentified fragments get an honest generic fact. Facts must stay true: no claims we can't support.
import json, re, sys
info = json.load(open(sys.argv[1]))
cat = {str(o['id']): o for o in json.load(open('data/catalog.json'))['objects'] if o.get('type') == 'debris' and not o.get('family')}
def parent(n):
  p = re.sub(r'\s*(DEB|R/B).*$', '', n).strip()
  p = re.sub(r'^SL-24( PLAT)?$', 'Dnepr', p)
  KEEP = {'NOAA', 'DMSP', 'COBE', 'IRAS', 'OPS', 'ISO', 'AVUM', 'NNS', 'NRL', 'PSLV', 'TIROS', 'ESSA', 'USA'}
  return ' '.join(w if (w in KEEP or not w.isalpha() or len(w) <= 3) else w.capitalize() for w in p.split())
SPECIAL = {
  51: ('Canister half', 'echo-canister', "Half of the **metal canister** that carried NASA's **Echo 1** balloon into orbit in 1960. In space the canister split in two and the folded balloon inflated into a 30-metre silver sphere."),
  53: ('Canister half', 'echo-canister', "Half of the **metal canister** that carried NASA's **Echo 1** balloon into orbit in 1960. In space the canister split in two and the folded balloon inflated into a 30-metre silver sphere."),
  24700: ('Cryostat cover', 'iso-cover', "The **cryostat cover** of ESA's Infrared Space Observatory. It was thrown off after launch in 1995 so the telescope, chilled with liquid helium, could see the infrared sky."),
  13783: ('Dewar cover', 'iso-cover', "The **dewar cover** of IRAS, the 1983 infrared telescope that mapped the whole sky. It was let go in orbit so the cold telescope could see."),
  20328: ('Dewar cap', 'iso-cover', "The **dewar cap** of COBE, the 1989 satellite that mapped the faint afterglow of the Big Bang. It was let go so the cold instruments could see."),
  133: ('Despin weight', 'despin-weight', "A **yo-yo despin weight** from the **Transit 4A** navigation satellite (1961). Weights on cables unwound to slow the satellite's spin, then let go and flew off on their own."),
  5975: ('Yo-yo weight', 'despin-weight', "A **yo-yo despin weight** from a Star solid motor. Weights on cables unwound to slow the spinning stage, then let go and flew off on their own."),
  29054: ('Lens cover', 'lens-cover', "The **telescope cover** of Japan's **AKARI** infrared space telescope, let go after launch in 2006 so the telescope could open its eye."),
}
RULES = [  # (regex on name or alt, what, art, fact template)
  (r'SYLDA', 'SYLDA', 'sylda', "The **SYLDA** from an {p} launch in {y}: a hollow shell that let one rocket carry two satellites, one hidden inside it and one sitting on top."),
  (r'SPELDA', 'SPELDA', 'spelda', "The **SPELDA** from an {p} launch in {y}: a tall shell that carried one satellite inside it and a second on top, so one rocket could launch both."),
  (r'SPELTRA', 'SPELTRA', 'speltra', "The **SPELTRA** from an {p} launch in {y}: a big carbon-fibre shell, as wide as the rocket, that held one satellite inside while another rode on top."),
  (r'DPAF', 'Dual payload fitting', 'dpaf', "The **dual payload attach fitting** from a {p} launch in {y}: a canister that hid one satellite inside while a second sat on top."),
  (r'FREGAT.*TANK', 'Fuel tank', None, "A dropped **fuel tank** from a Russian **Fregat** upper stage ({y}), let go once it was empty."),
  (r'\bTANK\b|\(TANK\)|DTB', 'Fuel tank', 'briz-apt', "The extra **fuel tank** of a Russian **Breeze-M** stage ({y}): a ring-shaped tank wrapped round the stage, dropped once it was empty."),
  (r'ADAPT|DLA|CLAMP RING|PAYLOAD TRUSS|FRAME', 'Adapter', 'avum-adaptor', "A **payload adapter** from the {p} launch in {y}: the structure that held a satellite to the rocket until it was released."),
  (r'COVER|DEWAR|CAP\b', 'Cover', 'lens-cover', "A **cover** from {p} ({y}), let go in orbit once its job of protecting an instrument or motor was done."),
  (r'FAIRING|PLATFORM A', 'Fairing piece', 'fairing-half', "Part of the **nose fairing** from the {p} launch in {y}: the shell that protected the satellites through the air, then split open and fell away."),
  (r'PLUME SHIELD|GAZODINAMICHESKIY', 'Plume shield', 'dnepr-shield', "A **gas-dynamic shield** from a Dnepr launch ({y}): it protected the satellites from the upper stage's engine plume, then was pushed away."),
  (r'INSULATION', 'Insulation blanket', None, "A piece of **insulation blanket** from {p} ({y}): the foil quilt that keeps spacecraft from getting too hot or cold, torn loose in orbit."),
  (r'HEAT SHIELD', 'Heat shield', None, "A **heat shield** from SNAPSHOT (1965), the first nuclear reactor in space. It shielded the satellite and was released in orbit."),
  (r'WEIGHT', 'Despin weight', 'despin-weight', "A **yo-yo despin weight** from {p} ({y}). Weights on cables unwound to slow the spin, then let go."),
]
out = {}
for k, o in cat.items():
  i = info.get(k, {}); alt = ' '.join(x for x in (i.get('alt'), i.get('sm_name'), o['name']) if x).upper()
  y = (o.get('launch') or '')[:4]; p = parent(o['name'])
  if int(k) in SPECIAL: w, a, f = SPECIAL[int(k)]
  else:
    hit = next(((w, a, f.format(p=p, y=y)) for r, w, a, f in RULES if re.search(r, alt)), None)
    if hit: w, a, f = hit
    else: w, a, f = 'Fragment', None, f"A **fragment** of {p}, launched in {y}. Pieces like this break off old rockets and satellites when they crack, explode or collide, and keep circling for years."
  out[k] = {'what': w, **({'art': a} if a else {}), 'fact': f}
json.dump(out, open('data/debris.json', 'w'), indent=0, ensure_ascii=False)
from collections import Counter
print(len(out), Counter(v['what'] for v in out.values()).most_common())
