// Linha do tempo: os trechos da narração em sequência, com pausas inseridas no meio de um
// trecho (depois de uma frase) para as telas gravadas terem tempo. Tudo que aparece no vídeo
// se ancora numa PALAVRA da narração: A('s05', 'dois clientes') = segundo (global) em que a voz
// diz "dois clientes". Trocar a voz = transcrever de novo; os desenhos ressincronizam sozinhos.

import narr from '../data/narracao.json'

type Word = { w: string; s: number; e: number }
type Narr = Record<string, { dur: number; text: string; words: Word[] }>
const N = narr as unknown as Narr

export type Brk = { after: string; n?: number; pause: number }
export type Sec = { id: string; lead?: number; pad?: number; breaks?: Brk[] }

export const SECTIONS: Sec[] = [
    { id: 's01', lead: 1.6, pad: 0.7 },
    { id: 's02', pad: 0.7 },
    { id: 's03', pad: 0.9 },
    { id: 's04', lead: 0.4, pad: 0.7 },
    { id: 's05', pad: 1.4, breaks: [{ after: 'vê as agências', pause: 1.4 }, { after: 'dois clientes', pause: 0.6 }] },
    { id: 's06', pad: 0.7 },
    { id: 's07', pad: 1.6, breaks: [{ after: 'aparece na hora', pause: 0.6 }, { after: 'recebe um e-mail', pause: 1.6 }] },
    { id: 's08', pad: 0.7 },
    { id: 's09', pad: 1.4 },
    { id: 's10', lead: 0.3, pad: 0.8 },
    { id: 's11', pad: 1.0, breaks: [{ after: 'chega ao navegador', pause: 0.8 }] },
    { id: 's12', lead: 0.6, pad: 3.2 },
    { id: 's13', pad: 0.7 },
    { id: 's14', pad: 0.7 },
    { id: 's15', pad: 1.0 },
    { id: 's16', pad: 1.0 },
    {
        id: 's17', pad: 1.2, breaks: [
            { after: 'quais agências existem', pause: 2.6 },
            { after: 'quem está na equipe', pause: 2.6 },
            { after: 'vê só a Clínica Sorriso', pause: 2.2 },
            { after: 'quem trabalha na clínica', pause: 2.6 },
            { after: 'confirma antes de gravar', pause: 3.0 },
            { after: 'não tem acesso', pause: 2.2 },
        ],
    },
    { id: 's18', lead: 0.6, pad: 0.8 },
    { id: 's19', pad: 1.0 },
    { id: 's20', pad: 3.2, breaks: [{ after: 'cruzados', pause: 7.0 }] },
    { id: 's21', lead: 0.6, pad: 6.0 },
]

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
const toks = (p: string) => p.split(/\s+/).map(norm).filter(Boolean)

function findPhrase(id: string, phrase: string, n = 1): [number, number] {
    const sec = N[id]
    if (!sec) throw new Error(`trecho ${id} não existe na narração`)
    const ws = sec.words.map((w) => norm(w.w))
    const tk = toks(phrase)
    let found = 0
    for (let i = 0; i + tk.length <= ws.length; i++) {
        let ok = true
        for (let j = 0; j < tk.length; j++) if (ws[i + j] !== tk[j]) { ok = false; break }
        if (ok && ++found === n) return [i, i + tk.length - 1]
    }
    throw new Error(`âncora "${phrase}" (#${n}) não achada em ${id}: ${sec.words.map((w) => w.w).join(' ')}`)
}

type Part = { id: string; from: number; to: number; at: number }
type Placed = { start: number; end: number; parts: Part[] }

const placed: Record<string, Placed> = {}
const audioParts: Part[] = []
let cursor = 0
for (const s of SECTIONS) {
    const sec = N[s.id]
    if (!sec) throw new Error(`trecho ${s.id} sem narração`)
    const start = cursor + (s.lead ?? 0)
    const cuts = (s.breaks ?? []).map((b) => {
        const [, last] = findPhrase(s.id, b.after, b.n)
        const w = sec.words[last]
        const next = sec.words[last + 1]
        const cut = next ? (w.e + next.s) / 2 : w.e + 0.05
        return { cut, pause: b.pause }
    }).sort((a, b) => a.cut - b.cut)
    const parts: Part[] = []
    let from = 0
    let at = start
    for (const c of cuts) {
        parts.push({ id: s.id, from, to: c.cut, at })
        at += c.cut - from + c.pause
        from = c.cut
    }
    parts.push({ id: s.id, from, to: sec.dur, at })
    const end = at + (sec.dur - from)
    placed[s.id] = { start, end, parts }
    audioParts.push(...parts)
    cursor = end + (s.pad ?? 0.5)
}

export const TOTAL = cursor
export const AUDIO = audioParts

function mapLocal(id: string, local: number) {
    const p = placed[id]
    let best = p.parts[0]
    for (const part of p.parts) if (local >= part.from - 1e-6) best = part
    return best.at + (local - best.from)
}

/** segundo (global) em que a frase começa a ser dita */
export function A(id: string, phrase: string, n = 1) {
    const [i] = findPhrase(id, phrase, n)
    return mapLocal(id, N[id].words[i].s)
}

/** segundo (global) em que a frase termina */
export function E(id: string, phrase: string, n = 1) {
    const [, j] = findPhrase(id, phrase, n)
    return mapLocal(id, N[id].words[j].e)
}

/** início e fim (global) de um trecho, com as pausas */
export const S = (id: string) => placed[id].start
export const Z = (id: string) => placed[id].end
/** fim do trecho incluindo a folga até o próximo */
export function NEXT(id: string) {
    const i = SECTIONS.findIndex((s) => s.id === id)
    const nx = SECTIONS[i + 1]
    return nx ? placed[nx.id].start - (nx.lead ?? 0) : TOTAL
}
