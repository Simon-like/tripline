// 先开首页种演示数据，再依次截手账/返程/详情头部（同一 Chrome 实例共享 localStorage）
// usage: node cdp-shot-seeded.mjs
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEMO = '426ca609-e737-4b7c-94d1-31d8e7d20c15';
const shots = [
  [`http://localhost:8081/journey/${DEMO}/journal`, 'artifacts/preview/m05-journal.png'],
  [`http://localhost:8081/journey/${DEMO}/return`, 'artifacts/preview/m06-return.png'],
  [`http://localhost:8081/journey/${DEMO}/checklist`, 'artifacts/preview/m01-header.png'],
];

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9224',
  '--user-data-dir=' + process.cwd() + '/artifacts/preview/.chrome-profile-seeded',
  '--window-size=420,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let targets;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      targets = await (await fetch('http://127.0.0.1:9224/json')).json();
      if (targets?.length) break;
    } catch {}
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let seq = 0;
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++seq;
    const onMessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) { ws.removeEventListener('message', onMessage); resolve(msg.result); }
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.enable');
  // 第一步：首页，触发 ensureDemoJourney 种入演示旅程
  await send('Page.navigate', { url: 'http://localhost:8081' });
  await sleep(15000);
  const seeded = await send('Runtime.evaluate', { expression: 'localStorage.getItem("tripline.preview.v1")?.length ?? 0', returnByValue: true });
  console.log('seeded store bytes =', seeded.result.value);
  for (const [url, outfile] of shots) {
    await send('Page.navigate', { url });
    await sleep(13000);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(outfile, Buffer.from(shot.data, 'base64'));
    console.log('saved', outfile);
  }
  ws.close();
} finally {
  chrome.kill('SIGKILL');
}
