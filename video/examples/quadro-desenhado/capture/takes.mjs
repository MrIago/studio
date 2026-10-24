// Tomadas de um walkthrough, gravadas no app LOCAL. Uso: PW_TEST=... node takes.mjs <tomada>
// Cada tomada roda num navegador próprio, que fecha no fim (pouca memória).
// O que a tomada cria no app (convite, cadastro, conversa, variável) vai para
// takes/<nome>.trace.json: a lista da limpeza do fim.
//
// Tirado do vídeo da arquitetura da AdzHub (24/10/2026) com caminhos, contas e rótulos trocados
// por exemplos. Troque ACCOUNTS, PATHS e os textos de botão pelos do seu app (descubra os nomes
// reais com probe.mjs). Contas sempre de TESTE; senhas só por variável de ambiente.

import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { launch, actor, take, clickOn, pointAt, waitPath, sleep, BASE, ROOT } from './rec.mjs'

const ACCOUNTS = {
    dono: { email: process.env.EMAIL_DONO ?? 'dono@exemplo.com', password: process.env.PW_TEST },
    equipe: { email: process.env.EMAIL_EQUIPE ?? 'equipe@exemplo.com', password: process.env.PW_TEST },
    cliente: { email: process.env.EMAIL_CLIENTE ?? 'cliente@exemplo.com', password: process.env.PW_TEST },
}
const INVITE_EMAIL = process.env.EMAIL_CONVITE ?? 'convidado@exemplo.com'
const PATHS = {
    entrar: '/sign-in',
    cadastro: '/sign-up',
    painel: '/painel',
    equipe: '/painel/equipe',
    cliente: '/painel/clientes/exemplo',
    dashboard: '/painel/clientes/exemplo/dashboard',
}
// texto da cortina de carregamento do app (some depois de hidratar)
const CURTAIN = process.env.CURTAIN_TEXT ?? 'Bem-vindo.'
// pasta onde rodam os scripts do próprio projeto (consulta ao banco, chamada a um worker)
const SCRIPTS = process.env.APP_SCRIPTS

// ---------- ajudantes ----------

// A cortina só monta depois de hidratar: espera ela APARECER e depois sumir (sem isso o
// clique cai na cortina, que ainda cobre a tela).
async function waitOverlay(page) {
    const tagline = page.getByText(CURTAIN, { exact: true }).first()
    await tagline.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {})
    await tagline.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(900)
}

/** Navegador + pessoa + câmera, já na página inicial (carregamento e cortina fora do filme). */
async function boot(name, who, startPath) {
    const browser = await launch()
    const { ctx, page } = await actor(browser, who ? ACCOUNTS[who] : {})
    if (startPath) {
        await page.goto(`${BASE}${startPath}`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
        await waitOverlay(page)
    }
    const t = take(name)
    await t.film(page)
    return { browser, ctx, page, t }
}

async function hold(ms) { await sleep(ms) }

/** Clica num link do menu lateral pelo texto exato. */
async function menu(page, name) {
    await clickOn(page, page.getByRole('link', { name, exact: true }))
    await page.waitForLoadState('networkidle').catch(() => {})
    await sleep(900)
}

async function typeSlow(page, text, delay = 45) {
    await page.keyboard.type(text, { delay })
}

/** Consulta o banco pelo script do próprio projeto (aqui, `bun run query <env> '<sql>'`). */
function query(sql) {
    if (!SCRIPTS) return []
    const out = execFileSync('bun', ['run', 'query', process.env.DB_ENV ?? 'local', sql], { cwd: SCRIPTS, encoding: 'utf8' })
    const i = out.indexOf('[')
    return i >= 0 ? JSON.parse(out.slice(i)) : []
}

function trace(name, data) {
    fs.writeFileSync(`${ROOT}/takes/${name}.trace.json`, JSON.stringify(data, null, 1))
}

/** Desliga o container da conversa (o dev aceita poucos ao mesmo tempo e o ocioso segura memória). */
function destroySandbox(sandboxId) {
    if (!SCRIPTS) return
    try {
        const out = execFileSync('bun', ['run', 'fetch', 'sandbox', 'local', '/api/sandbox/destroy', JSON.stringify({ sandboxId })],
            { cwd: SCRIPTS, encoding: 'utf8' })
        console.log(`  sandbox ${sandboxId.slice(0, 8)} destruída: ${/"success": ?true/.test(out) ? 'ok' : out.slice(-120)}`)
    } catch (e) {
        console.log(`  destroy falhou: ${String(e).slice(0, 200)}`)
    }
}

function latestConversation(email) {
    const rows = query(`SELECT c."agentConversationId" AS id FROM "AgentConversations" c JOIN "Users" u ON u."userId" = c."userId" WHERE u.email = '${email}' ORDER BY c."createdAt" DESC LIMIT 1`)
    return rows[0]?.id ?? null
}

/** Abre o chat (bolha), expande para a coluna, manda a mensagem e espera o turno acabar. */
async function chat(page, t, message, { column = true, readMs = 5000 } = {}) {
    await clickOn(page, page.getByRole('button', { name: 'Abrir o chat' }))
    await sleep(1100)
    if (column) {
        await clickOn(page, page.getByRole('button', { name: 'Expandir para a lateral' }))
        await sleep(1200)
    }
    await ask(page, t, message, { readMs })
}

async function ask(page, t, message, { readMs = 5000 } = {}) {
    const box = page.getByRole('textbox', { name: 'Pergunte ou peça algo...' })
    await clickOn(page, box)
    await sleep(300)
    await typeSlow(page, message, 38)
    await sleep(500)
    await clickOn(page, page.getByRole('button', { name: 'Enviar' }))
    t.mark('enviou')
    await waitTurn(page, t)
    await sleep(readMs)
}

/** O turno começa quando o botão "Parar" aparece e acaba quando ele some. */
async function waitTurn(page, t) {
    const stop = page.getByRole('button', { name: 'Parar' })
    await stop.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {})
    t.mark('rodando')
    await stop.waitFor({ state: 'hidden', timeout: 300000 })
    t.mark('fim')
}

// ---------- tomadas ----------

const TAKES = {
    // Painel do dono → equipe → convidar alguém sem conta → "convite enviado".
    async convite() {
        const { browser, page, t } = await boot('convite', 'dono', PATHS.painel)
        t.start()
        t.mark('painel')
        await hold(1800)
        await menu(page, 'Equipe')
        t.mark('equipe')
        await hold(2000)
        await clickOn(page, page.getByRole('button', { name: 'Convidar' }).first())
        await sleep(900)
        t.mark('dialogo')
        await clickOn(page, page.locator('#invite-email'))
        await typeSlow(page, INVITE_EMAIL, 50)
        await sleep(600)
        await clickOn(page, page.getByRole('dialog').getByRole('combobox'))
        await sleep(1100)
        await clickOn(page, page.getByRole('option').first())
        await sleep(700)
        await clickOn(page, page.getByRole('dialog').locator('button[type="submit"]'))
        t.mark('enviado')
        await page.waitForLoadState('networkidle').catch(() => {})
        await hold(1500)
        await pointAt(page, page.getByText(INVITE_EMAIL).first())
        await hold(2800)
        await t.stop()
        trace('convite', { invite: { email: INVITE_EMAIL } })
        await browser.close()
    },

    // Cadastro de quem foi convidado: e-mail + senha descartável → tela do código (não completa).
    async cadastro() {
        const browser = await launch()
        const { page } = await actor(browser)
        await page.goto(`${BASE}${PATHS.cadastro}`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
        await waitOverlay(page)
        const t = take('cadastro')
        await t.film(page)
        t.start()
        await hold(1000)
        await clickOn(page, page.locator('input[type="email"]'))
        await typeSlow(page, INVITE_EMAIL, 50)
        const pass = `Video${Date.now().toString(36)}x9`   // senha descartável, criada na hora
        await clickOn(page, page.locator('input[autocomplete="new-password"]').first())
        await typeSlow(page, pass, 60)
        await clickOn(page, page.locator('input[autocomplete="new-password"]').nth(1))
        await typeSlow(page, pass, 60)
        await sleep(500)
        await clickOn(page, page.locator('button[type="submit"]'))
        // espere o texto FINAL: a primeira versão parou antes de a tela do código aparecer
        await page.getByText('Confirme seu e-mail').first().waitFor({ state: 'visible', timeout: 60000 })
        t.mark('codigo')
        await hold(1500)
        await pointAt(page, page.getByText('Código de confirmação').first())
        await hold(4000)
        await t.stop()
        trace('cadastro', { pendingSignUp: { email: INVITE_EMAIL } })
        await browser.close()
    },

    // Navegação: cliente → pessoas → unidade → pessoas da unidade, apontando o que a voz cita.
    async cliente() {
        const { browser, page, t } = await boot('cliente', 'dono', PATHS.painel)
        t.start()
        t.mark('clientes')
        await hold(1500)
        await clickOn(page, page.getByRole('link', { name: /Abrir/ }).first())
        await waitPath(page, /\/clientes\//, 30000)
        await page.waitForLoadState('networkidle').catch(() => {})
        t.mark('unidades')
        await hold(2000)
        await menu(page, 'Pessoas')
        t.mark('pessoas-cliente')
        await hold(3200)
        await menu(page, 'Unidades')
        await hold(1000)
        await clickOn(page, page.getByRole('link', { name: /Abrir/ }).first())
        await page.waitForLoadState('networkidle').catch(() => {})
        t.mark('unidade')
        await hold(1800)
        await menu(page, 'Pessoas')
        t.mark('pessoas-unidade')
        await hold(1500)
        await pointAt(page, page.getByText('Acesso a tudo').first())
        await hold(2200)
        await t.stop()
        await browser.close()
    },

    // Dashboard num iframe: rolar dentro dele, abas, rascunho.
    async dashboard() {
        const { browser, page, t } = await boot('dashboard', 'dono', PATHS.dashboard)
        await page.locator('iframe').first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {})
        await sleep(4000)
        t.start()
        t.mark('visao-geral')
        await hold(2500)
        const frame = page.locator('iframe').first()
        const box = await frame.boundingBox()
        // o mouse em cima do iframe: a roda rola o conteúdo dele
        await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.45, { steps: 20 })
        for (let i = 0; i < 9; i++) { await page.mouse.wheel(0, 260); await sleep(700) }
        t.mark('rolou')
        await hold(1500)
        for (let i = 0; i < 9; i++) { await page.mouse.wheel(0, -260); await sleep(120) }
        await sleep(800)
        const inner = page.frameLocator('iframe').first()
        for (const tab of ['Dados', 'Visão geral']) {
            await clickOn(page, inner.getByText(tab, { exact: true }).first())
            t.mark(`aba-${tab}`)
            await hold(2600)
        }
        await t.stop()
        await browser.close()
    },

    // Um quadro (canvas infinito) percorrido arrastando a folha devagar, como uma mão.
    async quadro() {
        const browser = await launch()
        const { page } = await actor(browser)
        await page.goto(process.env.QUADRO_URL ?? 'http://localhost:4860/q/exemplo', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
        await sleep(1500)
        const t = take('quadro')
        await t.film(page)
        t.start()
        await hold(2500)
        const drag = async (from, to, steps = 60) => {
            await page.mouse.move(from[0], from[1], { steps: 10 })
            await page.mouse.down()
            await page.mouse.move(to[0], to[1], { steps })
            await page.mouse.up()
            await sleep(1600)
        }
        await drag([1100, 600], [700, 420])
        await drag([1100, 600], [600, 600])
        await drag([600, 650], [900, 300])
        await hold(1500)
        await t.stop()
        await browser.close()
    },
}

// Agente: uma conversa por papel, perguntas no mesmo estilo. Cada uma anota a conversa criada e
// desliga o container no fim.
const AGENT = {
    'agente-dono': { who: 'dono', path: PATHS.painel, message: 'Quais clientes temos e quantas unidades cada um tem?' },
    'agente-equipe': { who: 'equipe', path: PATHS.cliente, message: 'Quais clientes e unidades eu atendo?' },
    'agente-cliente': { who: 'cliente', path: PATHS.cliente, message: 'Guarda no cofre a senha do Wi-Fi da recepção: exemplo123', confirm: true },
}

for (const [name, cfg] of Object.entries(AGENT)) {
    TAKES[name] = async () => {
        const { browser, page, t } = await boot(name, cfg.who, cfg.path)
        t.start()
        t.mark('painel')
        await hold(1500)
        await chat(page, t, cfg.message)
        if (cfg.confirm) {
            // pedido que grava: o agente pergunta antes, com botões
            const yes = page.getByRole('button', { name: /^Confirmar/ }).last()
            await yes.waitFor({ state: 'visible', timeout: 15000 })
            await hold(1500)
            await clickOn(page, yes)
            t.mark('confirmou')
            await waitTurn(page, t)
            await sleep(5500)
        }
        await t.stop()
        await browser.close()
        const id = latestConversation(ACCOUNTS[cfg.who].email)
        trace(name, { conversation: id, who: cfg.who })
        if (id) destroySandbox(id)
    }
}

const name = process.argv[2]
if (!TAKES[name]) {
    console.log(`tomadas: ${Object.keys(TAKES).join(', ')}`)
    process.exit(1)
}
console.log(`▶ ${name}`)
await TAKES[name]()
