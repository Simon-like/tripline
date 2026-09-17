// P0b 重拍：先回首页触发演示数据补种，再逐页截图；点击用 CDP 真实鼠标事件
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEMO = '426ca609-e737-4b7c-94d1-31d8e7d20c15';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9228',
  '--user-data-dir=' + process.cwd() + '/artifacts/preview/.chrome-profile-p0b3',
  '--window-size=420,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let targets;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      targets = await (await fetch('http://127.0.0.1:9228/json')).json();
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
  // 用真实鼠标事件点击包含指定文字的元素中心（RN-web Pressable 依赖 pointer 事件）
  const tapByText = async (text) => {
    const expr = `(() => {
      const nodes = [...document.querySelectorAll('div')];
      const el = nodes.find((n) => n.textContent && n.textContent.trim() === ${JSON.stringify(text)} && n.children.length < 8);
      if (!el) return null;
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

  // 1) 首页：触发 Metro 打包 + 演示数据补种
  await send('Page.navigate', { url: 'http://localhost:8081' });
  await sleep(60000);
  const seeded = await send('Runtime.evaluate', { expression: 'localStorage.getItem("tripline.preview.v1")?.length ?? 0', returnByValue: true });
  console.log('seeded store bytes =', seeded.result.value);

  // 2) 账本：主页面 → 打开「记一笔」看分类 BouncyChip
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/ledger` });
  await sleep(15000);
  await shot('artifacts/preview/p0b-ledger.png');
  console.log('tap 记一笔 →', await tapByText('记一笔'));
  await sleep(3000);
  await shot('artifacts/preview/p0b-ledger-add.png');

  // 3) 手账：打开「记一条见闻」看标签 BouncyChip
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/journal` });
  await sleep(15000);
  await shot('artifacts/preview/p0b-journal.png');
  console.log('tap 记一条见闻 →', await tapByText('记一条见闻'));
  await sleep(3000);
  await shot('artifacts/preview/p0b-journal-add.png');

  // 4) 行前清单：主页面 → 打开添加弹层看分类 BouncyChip
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/checklist` });
  await sleep(15000);
  await shot('artifacts/preview/p0b-checklist.png');
  console.log('tap 添加要准备的事 →', await tapByText('添加要准备的事'));
  await sleep(3000);
  await shot('artifacts/preview/p0b-checklist-add.png');

  // 5) 返程清单：有补种条目，看新勾选框；再勾一项看完成态
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/return` });
  await sleep(15000);
  await shot('artifacts/preview/p0b-return.png');
  const unchecked = await send('Runtime.evaluate', { expression: `(() => {
    const boxes = [...document.querySelectorAll('div[role="checkbox"][aria-checked="false"], div[aria-checked="false"]')];
    if (!boxes.length) return null;
    const r = boxes[0].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: boxes[0].getAttribute('aria-label') };
  })()`, returnByValue: true });
  if (unchecked.result.value) {
    const { x, y, label } = unchecked.result.value;
    console.log('tap 勾选 →', label, '@', Math.round(x), Math.round(y));
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await sleep(1500);
    await shot('artifacts/preview/p0b-return-checked.png');
  } else {
    console.log('返程清单没有未勾条目');
  }

  // 6) 行程：Day 胶囊
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/itinerary` });
  await sleep(15000);
  await shot('artifacts/preview/p0b-itinerary.png');
  ws.close();
} finally {
  chrome.kill('SIGKILL');
}
