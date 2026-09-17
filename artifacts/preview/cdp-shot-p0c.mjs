// P0c 终拍：首页倒计时 RollingNumber / 总结弹层胶囊动效+文案收紧 / 记账表单千分位+焦点边框 / 清单页 ProgressRing 中心数字
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
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    return r.result?.value;
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
    const point = await evaluate(expr);
    if (!point) return 'not-found';
    const { x, y } = point;
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    return 'tapped@' + Math.round(x) + ',' + Math.round(y);
  };
  // 向 RNW TextInput 写入值（触发 React onChangeText）
  const typeInto = async (placeholder, value) => evaluate(`(() => {
    const el = [...document.querySelectorAll('input,textarea')].find((n) => n.placeholder === ${JSON.stringify(placeholder)});
    if (!el) return 'not-found';
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()`);
  const focusByPlaceholder = async (placeholder) => evaluate(`(() => {
    const el = [...document.querySelectorAll('input,textarea')].find((n) => n.placeholder === ${JSON.stringify(placeholder)});
    if (!el) return 'not-found';
    el.focus();
    return 'ok';
  })()`);

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.enable');

  // 1) 首页：倒计时黄卡 RollingNumber + 行前清单 ProgressRing（中心 % 引用共用组件）
  await send('Page.navigate', { url: 'http://localhost:8081/' });
  await sleep(60000);
  await shot('artifacts/preview/p0c-home.png');

  // 2) 记账表单：金额失焦千分位（4,500）+ 备注聚焦边框 + returnKey 串联
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/ledger` });
  await sleep(15000);
  console.log('tap 记一笔 →', await tapByText('记一笔'));
  await sleep(3000);
  console.log('type 金额 →', await typeInto('比如：86', '4500'));
  await sleep(400);
  console.log('focus 备注（金额失焦触发千分位）→', await focusByPlaceholder('比如：古城北门那家牦牛火锅'));
  await sleep(1200);
  await shot('artifacts/preview/p0c-ledger-add.png');

  // 3) 总结弹层：三胶囊 RollingNumber + CascadeIn 入场定格、白卡文案收紧（无工程向说明/无重复数字行）
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/return` });
  await sleep(15000);
  console.log('tap 总结入口 →', await tapByText('这一程，值得回味'));
  await sleep(3500);
  await shot('artifacts/preview/p0c-summary.png');

  // 4) 清单页：ProgressRing 104 中心 RollingNumber
  await send('Page.navigate', { url: `http://localhost:8081/journey/${DEMO}/checklist` });
  await sleep(15000);
  await shot('artifacts/preview/p0c-checklist.png');
  ws.close();
} finally {
  chrome.kill('SIGKILL');
}
