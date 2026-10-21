# Kept from 2026-10-20 (Sevaan: geodetic was left-heavy). Writes <key>-new.png in the current folder; import it with scripts/import-art.py.
# Re-centre a card picture: shrink it, place the subject in the middle, and have Nano Banana Pro paint only the empty
# margin to match. Usage: reframe.py <art key> <scale> <dx> <dy>   (dx, dy = where the shrunk picture's top-left goes)
import base64, json, subprocess, sys, urllib.request, os, time
from PIL import Image
URL = 'https://aiplatform.googleapis.com/v1/projects/space-collector-510722/locations/global/publishers/google/models/gemini-3-pro-image:generateContent'
key, sc, dx, dy = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
src = Image.open(f'/Users/sevaan/Documents/Space Collector/assets/art/cards/{key}.webp').convert('RGB'); W, H = src.size
small = src.resize((round(W * sc), round(H * sc)), Image.LANCZOS)
canvas = Image.new('RGB', (W, H), (255, 0, 255)); canvas.paste(small, (dx, dy)); canvas.save(f'{key}-guide.png')
tok = subprocess.check_output([os.path.expanduser('~/google-cloud-sdk/bin/gcloud'), 'auth', 'print-access-token']).decode().strip()
text = ("This illustration has a bright magenta (#FF00FF) border area around it. Repaint ONLY the magenta area so the picture continues seamlessly into it: "
  "continue the dark starry navy sky, the planet's curve and the spacecraft (complete any part of the satellite that was cut off at the picture's edge, in the same style). "
  "Keep everything that is not magenta exactly as it is: same style, same colours, same line work, same position. No magenta may remain. No text, no border. Landscape 4:3.")
body = {'contents': [{'role': 'user', 'parts': [{'inlineData': {'mimeType': 'image/png', 'data': base64.b64encode(open(f'{key}-guide.png', 'rb').read()).decode()}}, {'text': text}]}],
        'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '4:3'}}}
for t in range(6):
  try:
    res = json.load(urllib.request.urlopen(urllib.request.Request(URL, data=json.dumps(body).encode(), headers={'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json'}), timeout=300))
    for part in res['candidates'][0]['content']['parts']:
      if 'inlineData' in part:
        out = Image.open(__import__('io').BytesIO(base64.b64decode(part['inlineData']['data']))).convert('RGB').resize((W, H), Image.LANCZOS)
        # keep the original pixels inside, feathered into the painted margin
        out.save(f'{key}-model.png'); mask = Image.new('L', (W, H), 0); inner = Image.new('L', (small.width - 60, small.height - 60), 255); mask.paste(inner, (dx + 30, dy + 30))
        from PIL import ImageFilter; mask = mask.filter(ImageFilter.GaussianBlur(14))
        Image.composite(canvas, out, mask).save(f'{key}-new.png'); print('ok'); sys.exit()
    print('no image'); break
  except urllib.error.HTTPError as e:
    print('http', e.code); time.sleep(45)
