#!/bin/bash
# M05 手账 / M06 返程 / 详情页头部 Web 预览验证（390×844 CDP 真视口截图）
set -u
cd "$(git rev-parse --show-toplevel)"
LOG=artifacts/preview/metro-m0506.log

CI=1 BROWSER=none npx --yes pnpm@10.33.4 --filter @tripline/mobile web > "$LOG" 2>&1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null; pkill -f "expo start --web" 2>/dev/null; }
trap cleanup EXIT

for i in $(seq 1 60); do
  curl -sf -o /dev/null http://localhost:8081 && break
  sleep 2
done
curl -sf -o /dev/null http://localhost:8081 || { echo "SERVER_NOT_READY"; tail -20 "$LOG"; exit 1; }
echo "metro ready after ${i} polls"

BUNDLE_URL='http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.routerRoot=app'
curl -sf -o /dev/null --max-time 150 "$BUNDLE_URL" && echo "bundle compiled" || echo "bundle warmup failed"

DEMO=426ca609-e737-4b7c-94d1-31d8e7d20c15
node artifacts/preview/cdp-shot.mjs "http://localhost:8081/journey/$DEMO/journal" "artifacts/preview/m05-journal.png"
node artifacts/preview/cdp-shot.mjs "http://localhost:8081/journey/$DEMO/return" "artifacts/preview/m06-return.png"
node artifacts/preview/cdp-shot.mjs "http://localhost:8081/journey/$DEMO/checklist" "artifacts/preview/m01-header.png"
echo "done"
