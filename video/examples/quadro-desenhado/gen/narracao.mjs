// Narração: um áudio por trecho do ROTEIRO.md (voz escolhida pelo usuário entre 2-3 amostras),
// sem o silêncio do começo, nivelado em -18 LUFS, e a transcrição palavra por palavra de cada um
// (as âncoras dos desenhos, lidas por lib/timeline.ts).
// Uso: VIDEO=<nome> node narracao.mjs [s01 s02 ...]   (sem lista = todos; os que já existem são pulados)
//
// O roteiro tem um trecho por bloco:
//   **s01**
//   Texto falado do trecho, num parágrafo só.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const SKILL = process.env.STUDIO_SKILL ?? `${process.env.HOME}/.claude/skills/studio`
const ENGINE = process.env.STUDIO_ENGINE ?? `${process.env.HOME}/.studio-engine`
const VIDEO = process.env.VIDEO ?? 'meu-video'
const PROJ = process.env.STUDIO_ROOT ?? `${process.env.HOME}/studio/${VIDEO}`
const { speech } = await import(`${SKILL}/scripts/models/or-speech.mjs`)
const { saveAudio } = await import(`${SKILL}/scripts/lib/audio.mjs`)
const { transcribeWords } = await import(`${SKILL}/scripts/lib/transcribe.mjs`)

const ROTEIRO = `${PROJ}/notes/ROTEIRO.md`
const OUT = `${ENGINE}/public/${VIDEO}/audio`
const DATA = `${ENGINE}/src/videos/${VIDEO}/data`
const RAW = `${PROJ}/vozes/raw`
// a instrução usada nas amostras: a mesma em todos os trechos, senão a voz muda de humor no meio
const NARRADOR = 'Narrador de um vídeo explicativo sobre um produto de tecnologia, falando com um colega de trabalho: tom claro, confiante e próximo, ritmo médio, sem exagero, em português do Brasil.'

fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(DATA, { recursive: true })
fs.mkdirSync(RAW, { recursive: true })

const md = fs.readFileSync(ROTEIRO, 'utf8')
const trechos = {}
for (const m of md.matchAll(/\*\*(s\d\d)\*\*\n([\s\S]*?)(?=\n\n|\n##|$)/g)) trechos[m[1]] = m[2].trim()

const pedidos = process.argv.slice(2)
const ids = (pedidos.length ? pedidos : Object.keys(trechos)).filter((id) => trechos[id])
const dataFile = `${DATA}/narracao.json`
const data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : {}

async function um(id) {
    const wav = `${OUT}/${id}.wav`
    if (!pedidos.length && fs.existsSync(wav) && data[id]) { console.log(`${id} já existe`); return }
    const audio = await speech({ input: trechos[id], pick: 'locutor', instructions: NARRADOR })
    const raw = saveAudio(audio, `${RAW}/${id}`)
    // nivela a voz (-18 LUFS) e tira o silêncio do começo, que o TTS às vezes deixa
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af',
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,loudnorm=I=-18:TP=-2:LRA=11',
        '-ar', '48000', '-ac', '1', wav])
    const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], { encoding: 'utf8' }).trim())
    const { words } = await transcribeWords(wav, { language: 'pt' })
    data[id] = { dur: +dur.toFixed(3), text: trechos[id], words: words.map((w) => ({ w: w.text ?? w.word, s: +w.start.toFixed(3), e: +w.end.toFixed(3) })) }
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 1))
    console.log(`${id}: ${dur.toFixed(1)}s, ${words.length} palavras`)
}

// UM por vez: com 4 em paralelo a Groq grátis devolveu 429 e o lote travou
for (const id of ids) {
    try { await um(id) } catch (e) { console.log(`${id} FALHOU: ${String(e).slice(0, 200)}`) }
}
const total = Object.values(data).reduce((s, d) => s + d.dur, 0)
console.log(`total: ${(total / 60).toFixed(1)} min em ${Object.keys(data).length} trechos`)
