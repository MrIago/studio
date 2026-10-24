// Sondagem sem gravar: abre caminhos como uma pessoa e lista menu, títulos e botões da página
// (os nomes reais para os seletores das tomadas).
// Uso: EMAIL=... PW=... node probe.mjs /painel /painel/equipe
import { launch, actor, BASE } from './rec.mjs'

const paths = process.argv.slice(2)
const browser = await launch()
const { page } = await actor(browser, { email: process.env.EMAIL, password: process.env.PW })
for (const p of paths) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(1500)
    const info = await page.evaluate(() => {
        const txt = (el) => el.innerText.replace(/\s+/g, ' ').trim()
        return {
            url: location.pathname,
            menu: [...document.querySelectorAll('[data-sidebar="menu-button"], aside a, nav a')].map((a) => txt(a) + (a.getAttribute('href') ? ` → ${a.getAttribute('href')}` : '')).filter(Boolean).slice(0, 30),
            titles: [...document.querySelectorAll('h1, h2, h3')].map(txt).filter(Boolean).slice(0, 20),
            buttons: [...document.querySelectorAll('main button, main a')].map(txt).filter(Boolean).slice(0, 30),
        }
    })
    console.log(JSON.stringify(info, null, 1))
}
await browser.close()
