#!/usr/bin/env bash
# Build the DS Chat APK from source.
# Usage: ./tools/build-apk.sh [--release]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/android"
[[ -x ./gradlew ]] || chmod +x ./gradlew

if [[ "${1:-}" == "--release" ]]; then
  ./gradlew --no-daemon --console=plain assembleRelease
  OUT="app/build/outputs/apk/release"
else
  ./gradlew --no-daemon --console=plain assembleDebug
  OUT="app/build/outputs/apk/debug"
fi

ls -lh "$OUT"/*.apk
if [[ "${1:-}" == "--release" && ! -f "$ROOT/android/keystore.properties" ]]; then
  echo "Note: release APK is debug-signed (android/keystore.properties not found)." >&2
fi
