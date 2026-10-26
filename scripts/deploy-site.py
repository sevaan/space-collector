# Deploy site/public to Firebase Hosting (spacecollector.app) through the Hosting REST API, using the personal gcloud
# login (sevaan@gmail.com). The firebase CLI on this Mac is signed in to a work account, so it is not used here.
# Usage: python3 scripts/deploy-site.py
import os, sys, json, gzip, hashlib, subprocess, urllib.request
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'public')
SITE = 'sites/space-collector-91cc7'; API = 'https://firebasehosting.googleapis.com/v1beta1'
tok = subprocess.check_output([os.path.expanduser('~/google-cloud-sdk/bin/gcloud'), 'auth', 'print-access-token', '--account', 'sevaan@gmail.com']).decode().strip()
H = {'Authorization': f'Bearer {tok}', 'x-goog-user-project': 'space-collector-91cc7'}
def call(method, url, body=None, raw=None, ctype='application/json'):
  data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
  req = urllib.request.Request(url, data=data, method=method, headers={**H, 'Content-Type': ctype})
  try: return json.load(urllib.request.urlopen(req, timeout=120)) if True else None
  except urllib.error.HTTPError as e: sys.exit(f'{method} {url}: {e.code} {e.read().decode()[:400]}')
config = {'cleanUrls': True, 'trailingSlashBehavior': 'REMOVE',
  'rewrites': [{'glob': '/api/**', 'run': {'serviceId': 'api', 'region': 'us-central1'}}], # our server (functions/index.js), 2026-10-26
  'headers': [{'glob': '**/*.@(png|jpg|webp|mp4)', 'headers': {'Cache-Control': 'public, max-age=604800'}}]}
v = call('POST', f'{API}/{SITE}/versions', {'config': config})['name']
files, blobs = {}, {}
for d, _, fs in os.walk(ROOT):
  for f in fs:
    if f.startswith('.'): continue
    p = os.path.join(d, f); rel = '/' + os.path.relpath(p, ROOT).replace(os.sep, '/')
    gz = gzip.compress(open(p, 'rb').read(), mtime=0); h = hashlib.sha256(gz).hexdigest(); files[rel] = h; blobs[h] = gz
r = call('POST', f'{API}/{v}:populateFiles', {'files': files})
for h in r.get('uploadRequiredHashes', []):
  call('POST', f"{r['uploadUrl']}/{h}", raw=blobs[h], ctype='application/octet-stream') if False else urllib.request.urlopen(urllib.request.Request(f"{r['uploadUrl']}/{h}", data=blobs[h], method='POST', headers={**H, 'Content-Type': 'application/octet-stream'}), timeout=300)
call('PATCH', f'{API}/{v}?update_mask=status', {'status': 'FINALIZED'})
rel = call('POST', f'{API}/{SITE}/releases?versionName={v}', {})
print('released', len(files), 'files', rel.get('name'))
