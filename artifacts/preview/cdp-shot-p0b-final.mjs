// P0b 终拍：复用 p0b3 已补种 profile；scrollIntoView 后再 tap
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEMO = '426ca609-e737-4b7c-94d1-31d8e7d20c15';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9229',
  '--user-data-dir=' + process.cwd() + '/artifacts/preview/.chrome-profile-p0b3',
  '--window-size=420,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let targets;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      targets = await (await fetch('http://127.0.0.1:9229/json')).json();
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
  const shot = async (outfile) => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(outfile, Buffer.from(result.data, 'base64'));
    console.log('saved', outfile);
  };
  const tapByText = async (text) => {
    const expr = `(() => {
      const nodes = [...document.querySelectorAll('div')];
      const el = nodes.find((n) => n.textContent && n.textContent.trim() === ${JSON.stringify(text)} && n.children.length < 8);
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`;
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (!r.result.value) return 'not-found';
    const { x, y } = r.result.value;
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    return 'tapped@' + Math.round(x) + ',' + Math.round(y);
  };

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.enable');

  // 账本：打开「记一笔」看分类 BouncyChip（选中态 = 餐饮）
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/ledger` });
  await sleep(60000);
  console.log('tap 记一笔 →', await tapByText('记一笔'));
  await sleep(3000);
  await shot('artifacts/preview/p0b-ledger-add.png');

  // 行前清单：打开添加弹层看分类 BouncyChip
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/checklist` });
  await sleep(15000);
  console.log('tap 添加要准备的事 →', await tapByText('添加要准备的事'));
  await sleep(3000);
  await shot('artifacts/preview/p0b-checklist-add.png');

  // 返程清单：勾选「充电器」→ 打勾描绘后的完成态 + ProgressRing 过渡后定格
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/return` });
  await sleep(15000);
  console.log('tap 充电器 →', await tapByText('充电器'));
  await sleep(1800);
  await shot('artifacts/preview/p0b-return-checked.png');
  ws.close();
} finally {
  chrome.kill('SIGKILL');
}
