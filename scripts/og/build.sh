#!/bin/sh
# Regenerates static/og-default.png from scripts/og/og-default.html.
set -e
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --screenshot="$PWD/static/og-default.png" \
  "file://$PWD/scripts/og/og-default.html" 2>/dev/null
sips -g pixelWidth -g pixelHeight static/og-default.png
