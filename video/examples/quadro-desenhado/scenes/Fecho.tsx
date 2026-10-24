// Fechamento (s21): a câmera se afasta e mostra o quadro inteiro; as três partes ganham contorno
// e nome, o próximo módulo entra no mesmo caminho, e o cartão final fecha o vídeo.
// Também a barra de capítulos (fixa na tela).
import React from 'react'
import { Img, interpolate, staticFile } from 'remotion'
import { A, S, TOTAL, Z } from '../lib/timeline'
import { Arrow, Box, Hand, clamp, useT } from '../lib/sketch'
import { Card } from '../lib/bits'
import { INK, INK_SOFT, PAPER, PASTEL, TINTA } from '../lib/theme'

export const WORLD = { x: -80, y: -80, w: 13600, h: 7160 }

const AREA = {
    base: { x: -60, y: 2560, w: 6380, h: 4520, color: TINTA.azul, fill: PASTEL.azul, title: 'a base' },
    agente: { x: 6500, y: -60, w: 4900, h: 5560, color: '#7048E8', fill: PASTEL.lilas, title: 'o agente' },
    dash: { x: 11440, y: -60, w: 2080, h: 4020, color: TINTA.verde, fill: PASTEL.verde, title: 'os dashboards' },
}
const LABEL = { base: { w: 2200, size: 300 }, agente: { w: 2200, size: 300 }, dash: { w: 1840, size: 210 } }

export function FechoWorld() {
    const a = (p: string, n = 1) => A('s21', p, n)
    const when = { base: a('a base foi desenhada'), agente: a('O agente'), dash: a('os dashboards') }
    return (
        <>
            {(Object.keys(AREA) as (keyof typeof AREA)[]).map((k) => {
                const r = AREA[k]
                const at = when[k]
                return (
                    <React.Fragment key={k}>
                        <Box x={r.x} y={r.y} w={r.w} h={r.h} r={60} look={{ stroke: r.color, sw: 26, rough: 1.4, single: true }} draw={{ at, dur: 1.2 }} />
                        <Card x={r.x + r.w / 2 - LABEL[k].w / 2} y={r.y + r.h / 2 - 300} w={LABEL[k].w} h={600} fill={r.fill} title={r.title} size={LABEL[k].size} r={60}
                            look={{ stroke: r.color, sw: 20 }} draw={{ at: at + 0.3, dur: 1.0 }} />
                    </React.Fragment>
                )
            })}
            <Arrow pts={[[8950, 3000], [7600, 4200], [6200, 4700]]} look={{ stroke: '#7048E8', sw: 26 }} draw={{ at: a('encaixaram') - 0.2, dur: 1.0 }} />
            <Arrow pts={[[12480, 3500], [11000, 5800], [6200, 6200]]} look={{ stroke: TINTA.verde, sw: 26 }} draw={{ at: a('sem mexer nela') - 0.3, dur: 1.2 }} />
            <Card x={11560} y={4500} w={1900} h={760} fill={PASTEL.branco} title={'próximo\nmódulo'} size={230} r={60}
                look={{ dashed: true, sw: 18 }} draw={{ at: a('todo módulo novo') - 0.3, dur: 1.0 }} />
            <Arrow pts={[[12500, 5300], [11000, 6500], [6200, 6700]]} look={{ stroke: INK_SOFT, sw: 22, dashed: true }} draw={{ at: a('segue esse mesmo caminho') - 0.3, dur: 1.2 }} />
        </>
    )
}

/** cartão final, fixo na tela */
export function EndCard() {
    const t = useT()
    const at = Z('s21') + 0.6
    const p = clamp((t - at) / 0.8)
    if (p <= 0) return null
    const e = 1 - Math.pow(1 - p, 3)
    return (
        <div style={{ position: 'absolute', inset: 0, background: `rgba(251,250,246,${0.94 * e})` }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: e, transform: `translateY(${(1 - e) * 20}px)` }}>
                <Img src={staticFile('adzhub-arquitetura/img/mark.svg')} style={{ position: 'absolute', left: 960 - 85, top: 300, width: 170 }} />
                <Hand x={960} y={470} size={86} align="center" draw={{ at: at + 0.2, dur: 1.4 }}>primeiro o desenho,</Hand>
                <Hand x={960} y={580} size={86} align="center" draw={{ at: at + 1.4, dur: 1.2 }}>depois o código</Hand>
                <Hand x={960} y={740} size={36} align="center" color={INK_SOFT} draw={{ at: at + 2.4, dur: 0.8 }}>AdzHub, a nova versão</Hand>
            </div>
        </div>
    )
}

const CHAPTERS = [
    { n: '1', t: 'a base', from: 's04', to: 's11' },
    { n: '2', t: 'o agente', from: 's12', to: 's17' },
    { n: '3', t: 'os dashboards', from: 's18', to: 's20' },
]

/** barra de capítulos no canto: qual parte está em cena */
export function ChapterBar() {
    const t = useT()
    const on = S('s04') - 0.6
    const off = Z('s20') + 1.0
    const v = interpolate(t, [on, on + 0.6, off, off + 0.6], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    if (v <= 0 || t > TOTAL) return null
    // canto superior DIREITO: à esquerda moram os títulos de cada região
    const widths = CHAPTERS.map((c) => c.t.length * 26 * 0.56 + 70)
    let x = 1880 - widths.reduce((s, w) => s + w + 14, -14)
    return (
        <div style={{ position: 'absolute', left: 0, top: 0, opacity: v }}>
            {CHAPTERS.map((c) => {
                const active = t >= S(c.from) - 1.2 && t < Z(c.to) + 1.0
                const w = c.t.length * 26 * 0.56 + 70
                const el = (
                    <div key={c.n} style={{ position: 'absolute', left: 0, top: 0 }}>
                        <Box x={x} y={26} w={w} h={46} r={23} look={{ fill: active ? PASTEL.amarelo : 'rgba(255,255,255,0.75)', sw: active ? 2 : 1.4, stroke: active ? INK : INK_SOFT, rough: 0.8 }} />
                        <Hand x={x + w / 2} y={33} size={26} align="center" color={active ? INK : INK_SOFT}>{`${c.n} · ${c.t}`}</Hand>
                    </div>
                )
                x += w + 14
                return el
            })}
        </div>
    )
}
