// 交互式 CDP 截图：打开新建旅程表单 → 截表单态 → 打开日期选择器并选一段范围 → 截选择器
// usage: node cdp-shot-datepicker.mjs  （需 Metro web 已在 8081 就绪）
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9225;

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + process.cwd() + '/artifacts/preview/.chrome-profile-datepicker',
  '--window-size=420,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let targets;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
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
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.value;
  const clickAt = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  };
  // 按文本找元素中心点
  const centerOfText = (text) => `(() => {
    const all = [...document.querySelectorAll('div')];
    const el = all.find((d) => d.textContent === ${JSON.stringify(text)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`;
  const centerOfAria = (label) => `(() => {
    const el = document.querySelector('[aria-label="${label}"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`;

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:8081' });
  await sleep(14000);

  // 1. 打开新建旅程表单
  const createBtn = await evaluate(centerOfText('＋ 开启新旅程'));
  if (!createBtn) throw new Error('找不到「＋ 开启新旅程」按钮');
  await clickAt(createBtn.x, createBtn.y);
  await sleep(1500);
  let shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('artifacts/preview/datepicker-form.png', Buffer.from(shot.data, 'base64'));
  console.log('saved artifacts/preview/datepicker-form.png');

  // 2. 点「出发日期」字段打开选择器
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const startField = await evaluate(`(() => {
    const el = [...document.querySelectorAll('[aria-label]')].find((d) => d.getAttribute('aria-label')?.startsWith('出发日期'));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (!startField) throw new Error('找不到「出发日期」字段');
  await clickAt(startField.x, startField.y);
  await sleep(1200);

  // 3. 选一段范围：当月 10 日 → 16 日
  const dayA = await evaluate(centerOfAria(`${y}-${m}-10`));
  if (!dayA) throw new Error('找不到起点日期格');
  await clickAt(dayA.x, dayA.y);
  await sleep(400);
  const dayB = await evaluate(centerOfAria(`${y}-${m}-16`));
  if (!dayB) throw new Error('找不到终点日期格');
  await clickAt(dayB.x, dayB.y);
  await sleep(600);

  shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('artifacts/preview/datepicker-sheet.png', Buffer.from(shot.data, 'base64'));
  console.log('saved artifacts/preview/datepicker-sheet.png');
  ws.close();
} finally {
  chrome.kill('SIGKILL');
}
