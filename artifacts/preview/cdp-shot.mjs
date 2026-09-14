// CDP 截图：Emulation.setDeviceMetricsOverride 强制 390×844 视口后抓图
// usage: node cdp-shot.mjs <url> <outfile>
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [url, outfile] = process.argv.slice(2);

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9223',
  '--user-data-dir=' + process.cwd() + '/artifacts/preview/.chrome-profile-fresh',
  '--window-size=420,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let targets;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      targets = await (await fetch('http://127.0.0.1:9223/json')).json();
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
  await send('Page.navigate', { url });
  await sleep(13000);
  const check = await send('Runtime.evaluate', { expression: 'window.innerWidth', returnByValue: true });
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(outfile, Buffer.from(shot.data, 'base64'));
  console.log('saved', outfile, 'innerWidth=', check.result.value);
  ws.close();
} finally {
  chrome.kill('SIGKILL');
}
