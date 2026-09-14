#!/bin/bash
# CDP 版截图：真实 390×844 视口（绕过 headless Chrome 500px 最小窗口宽度）
set -u
cd "$(git rev-parse --show-toplevel)"
LOG=artifacts/preview/metro-m0304.log
PROFILE="$PWD/artifacts/preview/.chrome-profile-fresh"
DEMO_JOURNEY=426ca609-e737-4b7c-94d1-31d8e7d20c15

rm -rf "$PROFILE"
CI=1 BROWSER=none npx --yes pnpm@10.33.4 --filter @tripline/mobile web > "$LOG" 2>&1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null; pkill -f "expo start --web" 2>/dev/null; pkill -f "remote-debugging-port=9223" 2>/dev/null; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf -o /dev/null http://localhost:8081 && break
  sleep 2
done
curl -sf -o /dev/null http://localhost:8081 || { echo "SERVER_NOT_READY"; tail -20 "$LOG"; exit 1; }
curl -sf -o /dev/null --max-time 120 'http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.routerRoot=app' && echo "bundle compiled"

node artifacts/preview/cdp-shot.mjs "http://localhost:8081" artifacts/preview/home-bento-fix.png
node artifacts/preview/cdp-shot.mjs "http://localhost:8081/journey/$DEMO_JOURNEY/itinerary" artifacts/preview/m03-itinerary.png
node artifacts/preview/cdp-shot.mjs "http://localhost:8081/journey/$DEMO_JOURNEY/ledger" artifacts/preview/m04-ledger.png
exit 0
