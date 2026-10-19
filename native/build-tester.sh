#!/bin/bash
# Builds and installs the separate "SC Tester" app on Sevaan's iPhone (2026-10-19): bundle id
# io.github.sevaan.spacecollector.tester, so it sits beside the real app with its own data and iCloud backup;
# Testing tools always on in Settings, no ⏱ in Explore (js/build-flavor.js TESTER = true in this copy only).
# Purchases use the RevenueCat Test Store toggle (the real App Store key is tied to the real bundle id).
# Usage: native/build-tester.sh [device-udid]   (default: the first connected iPhone)
set -e
cd "$(dirname "$0")"
export PATH=~/.nvm/versions/node/v22.23.1/bin:$PATH
DEV=${1:-$(xcrun devicectl list devices 2>/dev/null | awk '/available \(paired\)/ && /physical/ {for(i=1;i<=NF;i++) if ($i ~ /^[0-9A-F]{8}-/) {print $i; exit}}')}
[ -n "$DEV" ] || { echo "No iPhone connected"; exit 1; }
OUT=${TMPDIR:-/tmp}/sc-tester-build
# Whatever happens, put the normal web copy back so a regular build never ships the tester flag.
trap 'node copy-web.mjs >/dev/null && npx cap sync ios >/dev/null 2>&1' EXIT
SC_TESTER=1 node copy-web.mjs && npx cap sync ios >/dev/null
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination "id=$DEV" -derivedDataPath "$OUT" \
  PRODUCT_BUNDLE_IDENTIFIER=io.github.sevaan.spacecollector.tester SC_DISPLAY_NAME="SC Tester" -allowProvisioningUpdates build | tail -3
xcrun devicectl device install app --device "$DEV" "$OUT/Build/Products/Release-iphoneos/App.app"
echo "SC Tester installed."
