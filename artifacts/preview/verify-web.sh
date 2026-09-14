#!/bin/bash
set -u
cd "$(git rev-parse --show-toplevel)"
LOG=artifacts/preview/metro.log
PROFILE="$PWD/artifacts/preview/.chrome-profile"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CI=1 BROWSER=none npx --yes pnpm@10.33.4 --filter @tripline/mobile web > "$LOG" 2>&1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null; pkill -f "expo start --web" 2>/dev/null; pkill -f "react-native-svg" 2>/dev/null; }
trap cleanup EXIT

# 等 Metro 就绪
for i in $(seq 1 60); do
  curl -sf -o /dev/null http://localhost:8081 && break
  sleep 2
done
curl -sf -o /dev/null http://localhost:8081 || { echo "SERVER_NOT_READY"; tail -20 "$LOG"; exit 1; }
echo "metro ready after ${i} polls"

# 预热 web bundle（触发首次编译）
BUNDLE_URL='http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.routerRoot=app'
curl -sf -o /dev/null --max-time 240 "$BUNDLE_URL" && echo "bundle compiled" || echo "bundle warmup failed"

shot() {
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --user-data-dir="$PROFILE" --window-size=390,844 \
    --virtual-time-budget=25000 --timeout=90000 \
    --screenshot="$PWD/$2" "$1" 2>/dev/null
  echo "shot $2 -> exit $?"
}

shot "http://localhost:8081" "artifacts/preview/icon-fix-home.png"
shot "http://localhost:8081/journey/426ca609-e737-4b7c-94d1-31d8e7d20c15/checklist" "artifacts/preview/icon-fix-checklist.png"
exit 0
