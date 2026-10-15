# Constellation figures (2026-10-14) with Nano Banana Pro, matching the 18 existing assets/art/con pictures. Each request
# gets two existing figures for style and the constellation's own star chart (rendered by design/con-guides.html at the
# card's framing) so the figure lands on its stars.
import base64, json, subprocess, sys, urllib.request, os, time
D = os.path.dirname(os.path.abspath(__file__))
URL = 'https://aiplatform.googleapis.com/v1/projects/space-collector-510722/locations/global/publishers/google/models/gemini-3-pro-image:generateContent'
tok = [None, 0]
def token():
  if time.time() - tok[1] > 1800: tok[0] = subprocess.check_output([os.path.expanduser('~/google-cloud-sdk/bin/gcloud'), 'auth', 'print-access-token']).decode().strip(); tok[1] = time.time()
  return tok[0]
png = lambda p: {'inlineData': {'mimeType': 'image/png', 'data': base64.b64encode(open(p, 'rb').read()).decode()}}
def gen(c, n, tries=0):
  text = (f"The first two images are constellation figure illustrations from a set: a single figure in flat muted steel-blue with soft halftone shading and small burnt-orange accents, on a plain dark navy background, no stars, no lines, no text. "
    f"The third image is the star chart of the constellation {c['name']} ({c['nick']}): its stars and stick-figure lines. "
    f"Draw {c['nick']} as ONE figure in exactly the same style as the first two images, posed and placed so that the stars of the third image fall on the figure's body: same framing, same size and same position as the chart, filling the same area as the stick lines. "
    f"The third image is ONLY a placement guide: do NOT copy its stars or lines. Output only the figure, painted as a solid flat steel-blue shape, on the plain dark navy background (#080f1b). Absolutely NO stars, NO star shapes, NO dots, NO lines, NO text, NO border anywhere in the picture. Landscape 3:2.")
  body = {'contents': [{'role': 'user', 'parts': [png(f'{D}/ref/Ori.png'), png(f'{D}/ref/Leo.png'), png(f"{D}/guides/{c['id']}.png"), {'text': text}]}], 'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '3:2'}}}
  req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={'Authorization': f'Bearer {token()}', 'Content-Type': 'application/json'})
  try:
    res = json.load(urllib.request.urlopen(req, timeout=300))
    for part in res['candidates'][0]['content']['parts']:
      if 'inlineData' in part:
        p = f"{D}/out/{c['id']}-{n}.png"; open(p, 'wb').write(base64.b64decode(part['inlineData']['data'])); return p
    return f"{c['id']}: no image"
  except urllib.error.HTTPError as e:
    if e.code == 401 and tries < 3: tok[1] = 0; return gen(c, n, tries + 1)  # token expired: get a new one
    if e.code in (429, 500, 503) and tries < 10: time.sleep(45); return gen(c, n, tries + 1)
    return f"{c['id']}: HTTP {e.code}"
  except Exception as e:
    if tries < 3: time.sleep(20); return gen(c, n, tries + 1)
    return f"{c['id']}: {e}"
items = json.load(open(f'{D}/list.json')); want = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] != 'all' else None
for c in items:
  if want and c['id'] not in want: continue
  if os.path.exists(f"{D}/out/{c['id']}-1.png"): continue
  print(gen(c, 1), flush=True)
