// Transcreve de novo, um por vez, os áudios já gerados da narração e grava as âncoras
// (palavra → tempo). Pula o trecho cujo texto não mudou. Use depois de trocar a voz ou quando a
// transcrição de algum trecho falhou.
// Uso: VIDEO=<nome> node palavras.mjs
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const SKILL = process.env.STUDIO_SKILL ?? `${process.env.HOME}/.claude/skills/studio`
const ENGINE = process.env.STUDIO_ENGINE ?? `${process.env.HOME}/.studio-engine`
const VIDEO = process.env.VIDEO ?? 'meu-video'
const PROJ = process.env.STUDIO_ROOT ?? `${process.env.HOME}/studio/${VIDEO}`
const { transcribeWords } = await import(`${SKILL}/scripts/lib/transcribe.mjs`)

const ROTEIRO = `${PROJ}/notes/ROTEIRO.md`
const OUT = `${ENGINE}/public/${VIDEO}/audio`
const dataFile = `${ENGINE}/src/videos/${VIDEO}/data/narracao.json`

const md = fs.readFileSync(ROTEIRO, 'utf8')
const trechos = {}
for (const m of md.matchAll(/\*\*(s\d\d)\*\*\n([\s\S]*?)(?=\n\n|\n##|$)/g)) trechos[m[1]] = m[2].trim()
const data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : {}

for (const id of Object.keys(trechos)) {
    const wav = `${OUT}/${id}.wav`
    if (!fs.existsSync(wav)) { console.log(`${id}: sem áudio`); continue }
    if (data[id] && data[id].text === trechos[id] && data[id].words?.length) { console.log(`${id}: já tem`); continue }
    const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], { encoding: 'utf8' }).trim())
    const { words } = await transcribeWords(wav, { language: 'pt' })
    data[id] = { dur: +dur.toFixed(3), text: trechos[id], words: words.map((w) => ({ w: w.text ?? w.word, s: +w.start.toFixed(3), e: +w.end.toFixed(3) })) }
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 1))
    console.log(`${id}: ${dur.toFixed(1)}s, ${words.length} palavras`)
}
const total = Object.values(data).reduce((s, d) => s + d.dur, 0)
console.log(`total: ${(total / 60).toFixed(1)} min em ${Object.keys(data).length} trechos`)
