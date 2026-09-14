// CDP 调试：找出 390px 视口下宽度超视口的元素
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const { spawn } = await import('node:child_process');

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--remote-debugging-port=9223',
  '--user-data-dir=' + process.cwd() + '/artifacts/preview/.chrome-profile-fresh',
  '--window-size=390,844', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let targets;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      targets = await (await fetch('http://127.0.0.1:9223/json')).json();
      if (targets.length) break;
    } catch {}
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
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
  await send('Page.enable');
  await send('Page.navigate', { url: process.argv[2] });
  await sleep(14000);
  const result = await send('Runtime.evaluate', {
    expression: `(() => {
      const iw = window.innerWidth;
      const bad = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width > iw + 1) bad.push({ tag: el.tagName, cls: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 60), text: (el.textContent || '').slice(0, 30), w: Math.round(r.width) });
      }
      return JSON.stringify({ iw, docScrollW: document.documentElement.scrollWidth, count: bad.length, bad: bad.slice(0, 12) }, null, 1);
    })()`,
    returnByValue: true,
  });
  console.log(result.result.value);
  ws.close();
} finally {
  chrome.kill('SIGKILL');
}
