// screen-macro — grava um percurso REAL num web app, nítido (1080×1920) e fluido.
//
// Por quê: screencast do Chrome sai em pixel CSS (432×768, borrado); captureScreenshot
// sai nítido mas a ~10 fps. Solução: CÂMERA LENTA. A página roda N× mais devagar
// (CDP Animation.setPlaybackRate) e o macro digita/rola/toca N× mais devagar; na
// montagem o tempo é dividido por N → ~30 fps nítidos.
//
// Também registra cada ação com a CAIXA do elemento (em px do vídeo final) e o tempo
// já em tempo de vídeo, para o Remotion desenhar dedo, toque, círculo, marca-texto
// no lugar exato. Esconde botões flutuantes e o selo de dev do Next.
//
// Uso (como lib):
//   import { openRecorder } from '.../screen-macro.mjs'
//   const r = await openRecorder({ base, outDir, slow: 3, cookies: [...] })
//   const page = r.page            // playwright page (432×768, DPR 2.5)
//   await r.start('clip-1')        // começa a gravar um clip
//   await r.tap('button:has-text("Copiar")', 'copy')
//   await r.type('input[type=email]', 'joao@x.com', 'email')
//   await r.scrollTo('text=Afiliados', 'card')   // rolagem suave até centralizar
//   await r.mark('text=Link para novos', 'linkCard') // só registra a caixa (sem tocar)
//   await r.hold(1200)             // segura (ms de VÍDEO)
//   await r.stop()                 // → outDir/clip-1.mp4 + clip-1.json
//
// Tempo: hold/type/scroll recebem ms de VÍDEO; o macro multiplica por `slow`.

import { chromium } from '/home/mriago/.claude/skills/surf/scripts/node_modules/playwright-core/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const W = 432, H = 768, DPR = 2.5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HEADLESS = '/home/mriago/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell';

const HIDE_CSS = `nextjs-portal{display:none!important}
[data-nextjs-toast],[data-nextjs-dialog-overlay]{display:none!important}`;

export async function openRecorder({ base, outDir, slow = 3, cookies = [], browser: shared }) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = shared ?? await chromium.launch({ executablePath: HEADLESS });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true, locale: 'pt-BR', colorScheme: 'light', permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addCookies([{ name: 'theme', value: 'light', url: base }, ...cookies]);
  await ctx.addInitScript((css) => {
    const add = () => { const s = document.createElement('style'); s.textContent = css; document.documentElement.appendChild(s);
      // esconde botões flutuantes (posição fixa no canto inferior direito)
      const hide = () => document.querySelectorAll('body *').forEach((e) => { const cs = getComputedStyle(e); if (cs.position === 'fixed') { const r = e.getBoundingClientRect(); if (r.bottom > innerHeight - 140 && r.right > innerWidth - 160 && r.width < 160 && r.height < 160) e.style.visibility = 'hidden'; } });
      setInterval(hide, 300); };
    if (document.documentElement) add(); else addEventListener('DOMContentLoaded', add);
  }, HIDE_CSS);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Animation.enable');
  const setRate = () => cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / slow }).catch(() => {});
  page.on('framenavigated', () => setRate());
  await setRate();

  // Capturar tela DURANTE uma navegação derruba o alvo ("Target crashed"). Pausa a
  // captura do início do carregamento até a página carregar (+ folga); o vídeo segura
  // o último quadro nesse intervalo.
  let navPause = false, navTimer = null;
  await cdp.send('Page.enable');
  cdp.on('Page.frameStartedNavigating', () => { navPause = true; clearTimeout(navTimer); });
  cdp.on('Page.frameRequestedNavigation', () => { navPause = true; clearTimeout(navTimer); });
  cdp.on('Page.loadEventFired', () => { clearTimeout(navTimer); navTimer = setTimeout(() => { navPause = false; setRate(); }, 600); });

  let clip = null; // { name, frames:[{file,t}], events:[], t0, run, loop }
  const vt = () => (Date.now() - clip.t0) / 1000 / slow; // tempo de VÍDEO (s)

  async function box(sel) {
    const l = typeof sel === 'string' ? page.locator(sel).first() : sel;
    const b = await l.boundingBox();
    return b ? { x: b.x * DPR, y: b.y * DPR, w: b.width * DPR, h: b.height * DPR } : null;
  }
  const log = async (type, sel, name, extra = {}) => clip?.events.push({ t: +vt().toFixed(3), type, name, box: sel ? await box(sel) : null, ...extra });

  const api = {
    page, ctx, cdp, browser,
    async start(name) {
      await setRate();
      const dir = path.join(outDir, `${name}-frames`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
      clip = { name, dir, frames: [], events: [], t0: Date.now(), run: true };
      clip.loop = (async () => {
        let n = 0;
        while (clip.run) {
          if (navPause) { await sleep(40); continue; }
          try {
            const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 86, optimizeForSpeed: true, clip: { x: 0, y: 0, width: W, height: H, scale: DPR } });
            const file = path.join(dir, `${String(n++).padStart(5, '0')}.jpg`);
            fs.writeFileSync(file, Buffer.from(data, 'base64'));
            clip.frames.push({ file, t: vt() });
          } catch { await sleep(20); }
        }
      })();
    },
    hold: (ms) => sleep(ms * slow),
    async mark(sel, name) { await log('mark', sel, name); },
    async tap(sel, name, { pre = 450 } = {}) {
      const l = page.locator(sel).first();
      await log('approach', l, name);            // dedo começa a ir para o alvo
      await sleep(pre * slow);
      await log('tap', l, name);
      await l.click();
      await sleep(250 * slow);
    },
    async type(sel, text, name, { cps = 14 } = {}) {
      const l = page.locator(sel).first();
      await log('approach', l, name); await sleep(350 * slow);
      await log('tap', l, name); await l.click();
      await log('typeStart', l, name, { text });
      await l.pressSequentially(text, { delay: (1000 / cps) * slow });
      await log('typeEnd', l, name);
    },
    async scrollTo(sel, name, { ms = 900, block = 0.42 } = {}) {
      const l = page.locator(sel).first();
      await l.waitFor();
      // rolagem suave nossa (em câmera lenta) no contêiner rolável do elemento
      await l.evaluate(async (el, [ms, block]) => {
        const sc = (() => { let p = el.parentElement; while (p) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 4) return p; p = p.parentElement; } return document.scrollingElement; })();
        const r = el.getBoundingClientRect(), from = sc.scrollTop;
        const to = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, from + r.top - innerHeight * block + r.height / 2));
        const t0 = performance.now();
        await new Promise((res) => { const step = () => { const p = Math.min(1, (performance.now() - t0) / ms); const e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2; sc.scrollTop = from + (to - from) * e; p < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
      }, [ms * slow, block]);
      await log('scrolled', l, name);
    },
    async goto(url) { await page.goto(url.startsWith('http') ? url : base + url, { waitUntil: 'networkidle' }); await setRate(); },
    async waitUrl(frag, ms = 90000) { const t = Date.now(); while (!page.url().includes(frag)) { if (Date.now() - t > ms) throw new Error('não chegou em ' + frag); await sleep(100); } await page.waitForLoadState('networkidle').catch(() => {}); },
    async stop() {
      clip.run = false; await clip.loop;
      const { name, dir, frames, events } = clip;
      // monta o MP4 pelo tempo de vídeo de cada quadro → 30 fps constantes
      const list = frames.map((f, i) => `file '${f.file}'\nduration ${((frames[i + 1]?.t ?? f.t + 1 / 30) - f.t).toFixed(4)}`).join('\n') + `\nfile '${frames.at(-1).file}'`;
      fs.writeFileSync(path.join(dir, 'list.txt'), list);
      const mp4 = path.join(outDir, `${name}.mp4`);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', mp4]);
      const dur = frames.at(-1).t;
      fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify({ name, duration: +dur.toFixed(3), fps: 30, width: 1080, height: 1920, captureFps: +(frames.length / dur).toFixed(1), events }, null, 1));
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`  ✓ ${name}: ${dur.toFixed(1)}s de vídeo, ${(frames.length / dur).toFixed(0)} fps capturados, ${events.length} eventos`);
      clip = null;
      return mp4;
    },
    close: () => (shared ? ctx.close() : browser.close()),
  };
  return api;
}
