#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
version=$(cd "$root" && node -p "require('./manifest.json').version")
archive="$root/dist/copy-current-url-$version.zip"

mkdir -p "$root/dist"
cd "$root"

zip -FS "$archive" \
  LICENSE \
  background.js \
  icons/icon-16.png \
  icons/icon-32.png \
  icons/icon-48.png \
  icons/icon-128.png \
  manifest.json \
  offscreen.html \
  offscreen.js \
  toast.js \
  welcome.css \
  welcome.html \
  welcome.js

printf '%s\n' "$archive"
