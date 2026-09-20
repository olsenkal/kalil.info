#!/usr/bin/env bash
# Strip EXIF/GPS and other metadata from images under content/.
#
#   scripts/strip-exif.sh              strip every image under content/
#   scripts/strip-exif.sh FILE...      strip only the given files
#   scripts/strip-exif.sh --check      list files that still carry GPS tags, exit 1 if any
#   scripts/strip-exif.sh --check FILE...
#
# Safe to run repeatedly. Orientation and the ICC colour profile are kept so
# photos still display upright and with correct colour.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v exiftool >/dev/null 2>&1; then
  echo "strip-exif: exiftool is not installed." >&2
  echo "  macOS:         brew install exiftool" >&2
  echo "  Debian/Ubuntu: sudo apt-get install libimage-exiftool-perl" >&2
  exit 127
fi

mode=strip
if [ "${1:-}" = "--check" ]; then
  mode=check
  shift
fi

exts=(-ext jpg -ext jpeg -ext png -ext heic -ext webp)
if [ "$#" -gt 0 ]; then
  targets=("$@")
else
  targets=(content)
fi

if [ "$mode" = check ]; then
  hits=$(exiftool -r "${exts[@]}" -if '$GPSLatitude or $GPSLongitude or $GPSPosition' \
    -p '$Directory/$FileName' "${targets[@]}" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    echo "Images with GPS location tags:" >&2
    echo "$hits" | sed 's/^/  /' >&2
    echo "Run scripts/strip-exif.sh to remove them." >&2
    exit 1
  fi
  echo "No GPS tags found."
else
  exiftool -r "${exts[@]}" -overwrite_original -q -q \
    -all= -tagsfromfile @ -Orientation -ICC_Profile "${targets[@]}" || true
  echo "Stripped metadata from images in: ${targets[*]}"
fi
