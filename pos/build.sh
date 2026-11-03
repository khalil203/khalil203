#!/bin/sh
# Release helper: ./build.sh 4.3.4 "notes" — sets the version everywhere and rebuilds modules.js
set -e
V="$1"; N="${2:-}"
[ -n "$V" ] || { echo "usage: ./build.sh <version> [notes]"; exit 1; }
cd "$(dirname "$0")"
sed -i "s/const APP_VERSION = '[^']*'/const APP_VERSION = '$V'/" src/m6_v4.js
sed -i "s/const VERSION = '[^']*'/const VERSION = '$V'/" app.js
sed -i -E "s/(config|app|modules)\.js\?v=[0-9.]+/\1.js?v=$V/g" index.html
sed -i -E "s/const CACHE = 'shop-pos-v[^']*'/const CACHE = 'shop-pos-$V'/" sw.js
printf '{"version":"%s","notes":"%s"}\n' "$V" "$N" > version.json
cat src/*.js > modules.js
node --check modules.js && echo "built $V"
