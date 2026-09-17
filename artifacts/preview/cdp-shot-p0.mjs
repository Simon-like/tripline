// P0 体验优化冒烟截图：首页（编辑/删除图标行、chevron）→ 账本（分类图标+三段式流水）→ 手账
// usage: node artifacts/preview/cdp-shot-p0.mjs  （需先启动 expo web 于 8081）
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEMO = '426ca609-e737-4b7c-94d1-31d8e7d20c15';
const shots = [
  [`http://localhost:8081/journey/${DEMO}/ledger`, 'artifacts/preview/p0-ledger.png'],
  [`http://localhost:8081/journey/${DEMO}/journal`, 'artifacts/preview/p0-journal.png'],
  [`http://localhost:8081/journey/${DEMO}/checklist`, 'artifacts/preview/p0-checklist.png'],
];

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9225',
  '--user-data-dir=' + process.cwd() + '/artifacts/preview/.chrome-profile-p0',
  '--window-size=420,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let targets;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      targets = await (await fetch('http://127.0.0.1:9225/json')).json();
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
  // 首页（首次导航同时触发 Metro 打 web bundle，等待拉长）
  await send('Page.navigate', { url: 'http://localhost:8081' });
  await sleep(60000);
  const shotHome = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('artifacts/preview/p0-home.png', Buffer.from(shotHome.data, 'base64'));
  console.log('saved artifacts/preview/p0-home.png');
  const seeded = await send('Runtime.evaluate', { expression: 'localStorage.getItem("tripline.preview.v1")?.length ?? 0', returnByValue: true });
  console.log('seeded store bytes =', seeded.result.value);
  for (const [url, outfile] of shots) {
    await send('Page.navigate', { url });
    await sleep(15000);
    const errors = await send('Runtime.evaluate', { expression: 'document.body.innerText.slice(0, 200)', returnByValue: true });
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(outfile, Buffer.from(shot.data, 'base64'));
    console.log('saved', outfile, '| body head:', JSON.stringify(errors.result.value).slice(0, 120));
  }
  ws.close();
} finally {
  chrome.kill('SIGKILL');
}
