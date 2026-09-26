#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
version=$(awk -F'"' '/"version"/ { print $4; exit }' "$root/manifest.json")
archive="$root/dist/instant-copy-url-$version.zip"

mkdir -p "$root/dist"
cd "$root"

zip -q -FS "$archive" \
  LICENSE \
  background.js \
  profile-menu.js \
  group-receiver.html \
  group-receiver.js \
  integration-status.html \
  integration-status.js \
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
