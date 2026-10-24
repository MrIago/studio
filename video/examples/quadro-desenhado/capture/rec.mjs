// Bancada de gravação: Chrome headless 1280×720 @1,5 (= quadros de 1920×1080) num app web LOCAL.
// Uma sessão por pessoa (actor); a "câmera" filma a página num laço de capturas JPEG por CDP.
// Cada tomada vira takes/<nome>.mp4 (30 qps, no tempo real de cada quadro) + takes/<nome>.json
// com as marcas; os quadros soltos são apagados no fim (disco).
// Senhas chegam por variável de ambiente, nunca escritas aqui.
//
// Configuração por ambiente:
//   APP_URL          endereço do app (padrão http://localhost:3000)
//   LOGIN_PATH       rota de login por API do app (recebe { email, password } e grava o cookie)
//   TAKES_ROOT       pasta do projeto, onde nasce takes/ (padrão: a pasta acima desta)
//   PLAYWRIGHT_CORE  caminho do index.mjs do playwright-core (padrão: o da skill surf)
// O chrome-headless-shell vem do Playwright: `npx playwright install chromium-headless-shell`.
// Tirado do vídeo da arquitetura da AdzHub (24/10/2026); ver references/gravar-telas.md.

import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const PW = process.env.PLAYWRIGHT_CORE ?? `${process.env.HOME}/.claude/skills/surf/scripts/node_modules/playwright-core/index.mjs`
const { chromium } = await import(PW)

export const ROOT = process.env.TAKES_ROOT ?? new URL('..', import.meta.url).pathname.replace(/\/$/, '')
export const BASE = process.env.APP_URL ?? 'http://localhost:3000'
const LOGIN_PATH = process.env.LOGIN_PATH ?? '/api/auth/sign-in'
const W = 1280
const H = 720
const DPR = 1.5

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function launch() {
    const dir = fs.readdirSync(`${process.env.HOME}/.cache/ms-playwright`).find((d) => d.startsWith('chromium_headless_shell'))
    return chromium.launch({
        executablePath: `${process.env.HOME}/.cache/ms-playwright/${dir}/chrome-headless-shell-linux64/chrome-headless-shell`,
        args: [`--force-device-scale-factor=${DPR}`, '--hide-scrollbars'],
    })
}

// Cursor desenhado: o headless não pinta o mouse. Segue os eventos de mouse e afunda no clique.
// O mesmo CSS esconde o selo do modo dev do Next (nextjs-portal).
function cursorScript() {
    const css = `
        nextjs-portal { display: none !important; }
        #rec-cursor { position: fixed; left: 0; top: 0; width: 26px; height: 26px; z-index: 2147483647;
            pointer-events: none; transform: translate(-3px, -2px); transition: transform 90ms ease-out; }
        #rec-cursor.down { transform: translate(-3px, -2px) scale(0.86); }
    `
    const svg = `<svg viewBox="0 0 24 24" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2.5 L4 19.5 L8.6 15.4 L11.6 21.6 L14.4 20.3 L11.4 14.2 L17.6 14.2 Z"
              fill="#1e1e1e" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/></svg>`
    const mount = () => {
        if (document.getElementById('rec-cursor')) return
        const style = document.createElement('style')
        style.textContent = css
        document.head.appendChild(style)
        const el = document.createElement('div')
        el.id = 'rec-cursor'
        el.innerHTML = svg
        el.style.left = (window.__recX ?? -60) + 'px'
        el.style.top = (window.__recY ?? -60) + 'px'
        document.body.appendChild(el)
        const move = (e) => {
            window.__recX = e.clientX
            window.__recY = e.clientY
            el.style.left = e.clientX + 'px'
            el.style.top = e.clientY + 'px'
        }
        window.addEventListener('mousemove', move, true)
        window.addEventListener('mousedown', () => el.classList.add('down'), true)
        window.addEventListener('mouseup', () => el.classList.remove('down'), true)
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
    else mount()
}

// O vídeo não mostra quando cada coisa foi feita: some com o "em 22/10/2026, 23:17" dos carimbos
// de trabalho (integração configurada, versão publicada). Período de DADO (filtro de datas) fica.
function hideWorkDatesScript() {
    const re = /\s+(em|desde)\s+\d{2}\/\d{2}\/\d{4}(,?\s*(às\s*)?\d{2}:\d{2})?/g
    const clean = (root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (re.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(re, '')
            re.lastIndex = 0
        }
    }
    const start = () => {
        clean(document.body)
        new MutationObserver((list) => {
            for (const m of list) {
                if (m.type === 'characterData') clean(m.target.parentNode ?? document.body)
                for (const node of m.addedNodes) clean(node.nodeType === 3 ? node.parentNode ?? document.body : node)
            }
        }).observe(document.body, { childList: true, subtree: true, characterData: true })
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
    else start()
}

/** Uma pessoa: contexto próprio, tema claro, cursor desenhado, já logada pela API (sem filmar o login). */
export async function actor(browser, { email, password } = {}) {
    const ctx = await browser.newContext({
        viewport: { width: W, height: H },
        deviceScaleFactor: DPR,
        locale: 'pt-BR',
        colorScheme: 'light',
        timezoneId: 'America/Sao_Paulo',
    })
    // cookie de tema do app, se ele tiver um (senão o tema segue o colorScheme)
    await ctx.addCookies([{ name: 'theme', value: 'light', url: BASE }])
    await ctx.addInitScript(cursorScript)
    await ctx.addInitScript(hideWorkDatesScript)
    if (email) {
        const r = await ctx.request.post(`${BASE}${LOGIN_PATH}`, { data: { email, password } })
        const j = await r.json().catch(() => ({}))
        if (!r.ok()) throw new Error(`login ${email}: HTTP ${r.status()} ${JSON.stringify(j).slice(0, 200)}`)
    }
    const page = await ctx.newPage()
    page.setDefaultTimeout(30000)
    return { ctx, page }
}

/** Uma tomada: a câmera filma a página do palco; pause() em toda navegação de página inteira. */
export function take(name) {
    const dir = `${ROOT}/takes/${name}`
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(`${dir}/f`, { recursive: true })
    const frames = []
    const marks = []
    let cdp = null
    let running = false
    let paused = false
    let loading = false   // documento novo carregando (pausa sozinha: capturar no meio derruba a aba)
    let n = 0
    let t0 = 0
    let loopDone = null

    async function loop() {
        while (running) {
            if (paused || loading || !cdp) {
                await sleep(25)
                continue
            }
            try {
                const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, optimizeForSpeed: true })
                const file = `${String(n++).padStart(6, '0')}.jpg`
                fs.writeFileSync(`${dir}/f/${file}`, Buffer.from(data, 'base64'))
                frames.push({ file, t: Date.now() - t0 })
            } catch {
                await sleep(60)
            }
        }
    }

    return {
        /** Troca o que a câmera filma (corte para outra pessoa = outra página). */
        async film(page) {
            paused = true
            await sleep(60)
            cdp = await page.context().newCDPSession(page)
            await cdp.send('Page.enable')
            const { frameTree } = await cdp.send('Page.getFrameTree')
            const main = frameTree.frame.id
            // Só documento NOVO no frame principal pausa; navegação do Next (pushState) segue filmando.
            cdp.on('Page.frameStartedLoading', (e) => { if (e.frameId === main) loading = true })
            cdp.on('Page.frameStoppedLoading', (e) => { if (e.frameId === main) setTimeout(() => { loading = false }, 250) })
            paused = false
        },
        start() {
            running = true
            t0 = Date.now()
            loopDone = loop()
        },
        pause() { paused = true },
        resume() { paused = false },
        mark(label) {
            marks.push({ label, t: (Date.now() - t0) / 1000 })
            console.log(`  · ${label} @ ${((Date.now() - t0) / 1000).toFixed(1)}s`)
        },
        /** Fecha a tomada: MP4 pelo tempo real de cada quadro, marcas em JSON, quadros apagados. */
        async stop({ hold = 1.0 } = {}) {
            running = false
            await loopDone
            if (frames.length === 0) throw new Error(`${name}: nenhum quadro`)
            const lines = []
            for (let i = 0; i < frames.length; i++) {
                const next = frames[i + 1]
                const dur = next ? Math.max(0.001, (next.t - frames[i].t) / 1000) : hold
                lines.push(`file 'f/${frames[i].file}'`, `duration ${dur.toFixed(3)}`)
            }
            lines.push(`file 'f/${frames[frames.length - 1].file}'`)
            fs.writeFileSync(`${dir}/list.txt`, lines.join('\n'))
            const out = `${ROOT}/takes/${name}.mp4`
            execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`,
                '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out])
            const seconds = (frames[frames.length - 1].t / 1000) + hold
            const fps = frames.length / (frames[frames.length - 1].t / 1000 || 1)
            fs.writeFileSync(`${ROOT}/takes/${name}.json`, JSON.stringify({ name, seconds: +seconds.toFixed(2), capturedFps: +fps.toFixed(1), marks }, null, 1))
            fs.rmSync(dir, { recursive: true, force: true })
            console.log(`${name}: ${frames.length} quadros (${fps.toFixed(1)} qps capturados), ${seconds.toFixed(1)}s → ${out}`)
            return out
        },
    }
}

/** Navegação de página inteira com a câmera pausada (captura no meio da navegação derruba a aba). */
export async function go(t, page, path, { settle = 1200 } = {}) {
    t.pause()
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(settle)
    t.resume()
}

/** Leva o cursor até o centro do elemento, num movimento visível, e clica. */
export async function clickOn(page, locator, { steps = 22, pauseBefore = 250 } = {}) {
    const el = locator.first()
    await el.scrollIntoViewIfNeeded().catch(() => {})
    // trial = espera o elemento receber o clique (nada por cima, como a cortina) sem clicar
    await el.click({ trial: true, timeout: 20000 }).catch(() => {})
    const b = await el.boundingBox()
    if (!b) throw new Error('elemento sem caixa')
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps })
    await page.waitForTimeout(pauseBefore)
    await page.mouse.down()
    await page.waitForTimeout(70)
    await page.mouse.up()
}

/** Só leva o cursor (apontar sem clicar). */
export async function pointAt(page, locator, { steps = 22 } = {}) {
    const b = await locator.first().boundingBox()
    if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps })
}

/** Espera a URL chegar no caminho (polling, mais seguro que waitForURL durante a captura). */
export async function waitPath(page, re, timeout = 30000) {
    const end = Date.now() + timeout
    while (Date.now() < end) {
        if (re.test(new URL(page.url()).pathname)) return true
        await sleep(150)
    }
    throw new Error(`não chegou em ${re} (está em ${page.url()})`)
}
