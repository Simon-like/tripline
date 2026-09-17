// P0 冒烟补充：账本流水区滚动截图 + 手账条目
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEMO = '426ca609-e737-4b7c-94d1-31d8e7d20c15';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9226',
  '--user-data-dir=' + process.cwd() + '/artifacts/preview/.chrome-profile-p0',
  '--window-size=420,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let targets;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      targets = await (await fetch('http://127.0.0.1:9226/json')).json();
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
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/ledger` });
  await sleep(15000);
  await send('Runtime.evaluate', { expression: 'document.querySelectorAll("div").forEach(()=>{}); window.scrollTo(0, 1400);', returnByValue: true });
  // RN web 用内部滚动容器：找到可滚动元素滚到底
  await send('Runtime.evaluate', { expression: `(() => { const els=[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+50); els.forEach(e=>e.scrollTop=e.scrollHeight); return els.length; })()`, returnByValue: true });
  await sleep(1500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('artifacts/preview/p0-ledger-list.png', Buffer.from(shot.data, 'base64'));
  console.log('saved artifacts/preview/p0-ledger-list.png');
  ws.close();
} finally {
  chrome.kill('SIGKILL');
}
