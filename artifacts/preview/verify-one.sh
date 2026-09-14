#!/bin/bash
# usage: verify-one.sh <path> <output.png>
set -u
cd "$(git rev-parse --show-toplevel)"
LOG=artifacts/preview/metro-one.log
PROFILE="$PWD/artifacts/preview/.chrome-profile"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CI=1 BROWSER=none npx --yes pnpm@10.33.4 --filter @tripline/mobile web > "$LOG" 2>&1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null; pkill -f "expo start --web" 2>/dev/null; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf -o /dev/null http://localhost:8081 && break
  sleep 2
done
curl -sf -o /dev/null http://localhost:8081 || { echo "SERVER_NOT_READY"; tail -20 "$LOG"; exit 1; }

BUNDLE_URL='http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.routerRoot=app'
curl -sf -o /dev/null --max-time 120 "$BUNDLE_URL" || echo "bundle warmup failed"

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$PROFILE" --window-size=390,844 \
  --virtual-time-budget=12000 --timeout=45000 \
  --screenshot="$PWD/$2" "http://localhost:8081$1" 2>/dev/null
echo "shot $2 -> exit $?"
exit 0
