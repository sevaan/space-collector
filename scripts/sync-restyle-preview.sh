#!/bin/bash
# Copies finished restyled pictures into design/restyle-preview (webp) and its manifest, and publishes every 10 new
# ones so review.html shows them (2026-10-15). Usage: scripts/sync-restyle-preview.sh <restyle out dir> [force]
OUT="$1"; cd "$(dirname "$0")/.." || exit 1
mkdir -p design/restyle-preview
n=0
for f in "$OUT"/*.png; do b=$(basename "$f" .png); t=design/restyle-preview/$b.webp
  if [ ! -f "$t" ] || [ "$f" -nt "$t" ]; then python3 -c "from PIL import Image; Image.open('$f').convert('RGB').resize((1200,900)).save('$t', quality=82)"; n=$((n+1)); fi; done
python3 -c "import os,json; json.dump(sorted(f[:-5] for f in os.listdir('design/restyle-preview') if f.endswith('.webp')), open('design/restyle-preview/manifest.json','w'))"
echo "$n new"
