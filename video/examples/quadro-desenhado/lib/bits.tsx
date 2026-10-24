// Peças de quadro feitas com as primitivas: cartão com título, etiqueta, pessoa, ícones à mão,
// página de documento, número grande. Tudo em coordenadas locais da região e com `draw`.

import React from 'react'
import { Box, Draw, Ellipse, Hand, Line, Look, Rough, useT, alive, clamp } from './sketch'
import { HAND, INK, INK_SOFT, MONO, PASTEL } from './theme'

export const textW = (s: string, size: number) => s.length * size * 0.56

const later = (d: Draw | undefined, k: number, dur?: number): Draw | undefined =>
    d ? { ...d, at: d.at + (d.dur ?? 0.8) * k, dur: dur ?? d.dur } : undefined

/** cartão: caixa com título (e subtítulo) centralizados */
export function Card({ x, y, w, h, fill = PASTEL.branco, title, sub, size = 34, subSize, draw, look, color = INK, r = 14 }: {
    x: number; y: number; w: number; h: number; fill?: string; title: string; sub?: string; size?: number; subSize?: number
    draw?: Draw; look?: Look; color?: string; r?: number
}) {
    const ss = subSize ?? Math.round(size * 0.62)
    const lines = title.split('\n').length
    const blockH = lines * size * 1.2 + (sub ? ss * 1.35 * sub.split('\n').length : 0)
    const ty = y + (h - blockH) / 2
    return (
        <>
            <Box x={x} y={y} w={w} h={h} r={r} look={{ fill, ...look }} draw={draw} />
            <Hand x={x + w / 2} y={ty} size={size} align="center" color={color} draw={later(draw, 0.5, undefined)}>{title}</Hand>
            {sub && <Hand x={x + w / 2} y={ty + lines * size * 1.2 + 4} size={ss} align="center" color={INK_SOFT} draw={later(draw, 0.75, undefined)}>{sub}</Hand>}
        </>
    )
}

/** etiqueta (pílula) do tamanho do texto */
export function Chip({ x, y, text, fill = PASTEL.cinza, size = 26, draw, color = INK, align = 'left', mono = false }: {
    x: number; y: number; text: string; fill?: string; size?: number; draw?: Draw; color?: string; align?: 'left' | 'center'; mono?: boolean
}) {
    const w = (mono ? text.length * size * 0.62 : textW(text, size)) + size * 1.2
    const h = size * 1.75
    const left = align === 'center' ? x - w / 2 : x
    return (
        <>
            <Box x={left} y={y} w={w} h={h} r={h / 2} look={{ fill, sw: 1.8, rough: 0.9 }} draw={draw ? { ...draw, dur: draw.dur ?? 0.5 } : undefined} />
            <Hand x={left + w / 2} y={y + (h - size * 1.22) / 2} size={size} align="center" color={color} font={mono ? MONO : HAND}
                draw={later(draw ? { ...draw, dur: draw.dur ?? 0.5 } : undefined, 0.45, undefined)}>{text}</Hand>
        </>
    )
}

/** número grande com legenda embaixo */
export function Count({ x, y, num, label, size = 120, draw, color = INK }: { x: number; y: number; num: string; label: string; size?: number; draw?: Draw; color?: string }) {
    return (
        <>
            <Hand x={x} y={y} size={size} align="center" color={color} draw={draw ? { ...draw, dur: 0.55 } : undefined}>{num}</Hand>
            <Hand x={x} y={y + size * 1.15} size={Math.round(size * 0.3)} align="center" color={INK_SOFT} draw={later(draw, 0.4, 0.6)}>{label}</Hand>
        </>
    )
}

type IconProps = { x: number; y: number; s?: number; draw?: Draw; color?: string; fill?: string }

/** pessoa: cabeça + ombros */
export function Person({ x, y, s = 1, draw, color = INK, fill }: IconProps) {
    const d2 = later(draw, 0.4)
    return (
        <>
            <Rough kind="circle" args={[x, y - 26 * s, 30 * s]} look={{ stroke: color, sw: 2.2, fill, single: false }} draw={draw ? { ...draw, dur: (draw.dur ?? 0.8) * 0.5 } : undefined} />
            <Rough kind="path" args={[`M ${x - 26 * s} ${y + 26 * s} Q ${x - 24 * s} ${y - 4 * s} ${x} ${y - 4 * s} Q ${x + 24 * s} ${y - 4 * s} ${x + 26 * s} ${y + 26 * s} Z`]}
                look={{ stroke: color, sw: 2.2, fill, single: false }} draw={d2 ? { ...d2, dur: (draw?.dur ?? 0.8) * 0.6 } : undefined} />
        </>
    )
}

export function Lock({ x, y, s = 1, draw, color = INK, fill = PASTEL.amarelo }: IconProps) {
    return (
        <>
            <Rough kind="path" args={[`M ${x - 12 * s} ${y - 2 * s} L ${x - 12 * s} ${y - 14 * s} Q ${x - 12 * s} ${y - 28 * s} ${x} ${y - 28 * s} Q ${x + 12 * s} ${y - 28 * s} ${x + 12 * s} ${y - 14 * s} L ${x + 12 * s} ${y - 2 * s}`]}
                look={{ stroke: color, sw: 2.4, single: true }} draw={draw} />
            <Box x={x - 20 * s} y={y - 4 * s} w={40 * s} h={32 * s} r={5} look={{ stroke: color, sw: 2.4, fill }} draw={later(draw, 0.35)} />
        </>
    )
}

export function Key({ x, y, s = 1, draw, color = INK, fill = PASTEL.amarelo }: IconProps) {
    return (
        <>
            <Rough kind="circle" args={[x - 18 * s, y, 26 * s]} look={{ stroke: color, sw: 2.4, fill }} draw={draw} />
            <Rough kind="linearPath" args={[[[x - 5 * s, y], [x + 30 * s, y], [x + 30 * s, y + 10 * s]]]} look={{ stroke: color, sw: 2.4, single: true }} draw={later(draw, 0.4)} />
            <Line x1={x + 20 * s} y1={y} x2={x + 20 * s} y2={y + 8 * s} look={{ stroke: color, sw: 2.4, single: true }} draw={later(draw, 0.6)} />
        </>
    )
}

export function Folder({ x, y, s = 1, draw, color = INK, fill = PASTEL.amarelo }: IconProps) {
    return (
        <Rough kind="path" args={[`M ${x - 34 * s} ${y + 24 * s} L ${x - 34 * s} ${y - 22 * s} L ${x - 10 * s} ${y - 22 * s} L ${x - 4 * s} ${y - 14 * s} L ${x + 34 * s} ${y - 14 * s} L ${x + 34 * s} ${y + 24 * s} Z`]}
            look={{ stroke: color, sw: 2.2, fill }} draw={draw} />
    )
}

export function Chat({ x, y, s = 1, draw, color = INK, fill = PASTEL.branco }: IconProps) {
    return (
        <Rough kind="path" args={[`M ${x - 34 * s} ${y - 22 * s} Q ${x - 34 * s} ${y - 30 * s} ${x - 26 * s} ${y - 30 * s} L ${x + 26 * s} ${y - 30 * s} Q ${x + 34 * s} ${y - 30 * s} ${x + 34 * s} ${y - 22 * s} L ${x + 34 * s} ${y + 8 * s} Q ${x + 34 * s} ${y + 16 * s} ${x + 26 * s} ${y + 16 * s} L ${x - 8 * s} ${y + 16 * s} L ${x - 22 * s} ${y + 30 * s} L ${x - 20 * s} ${y + 16 * s} L ${x - 26 * s} ${y + 16 * s} Q ${x - 34 * s} ${y + 16 * s} ${x - 34 * s} ${y + 8 * s} Z`]}
            look={{ stroke: color, sw: 2.2, fill }} draw={draw} />
    )
}

export function Db({ x, y, s = 1, draw, color = INK, fill = PASTEL.azulClaro }: IconProps) {
    return (
        <>
            <Rough kind="path" args={[`M ${x - 30 * s} ${y - 22 * s} L ${x - 30 * s} ${y + 22 * s} Q ${x} ${y + 36 * s} ${x + 30 * s} ${y + 22 * s} L ${x + 30 * s} ${y - 22 * s}`]}
                look={{ stroke: color, sw: 2.2, fill }} draw={draw} />
            <Ellipse cx={x} cy={y - 22 * s} w={60 * s} h={22 * s} look={{ stroke: color, sw: 2.2, fill: PASTEL.branco }} draw={later(draw, 0.45)} />
            <Rough kind="path" args={[`M ${x - 30 * s} ${y} Q ${x} ${y + 14 * s} ${x + 30 * s} ${y}`]} look={{ stroke: color, sw: 1.8, single: true }} draw={later(draw, 0.7)} />
        </>
    )
}

export function Browser({ x, y, s = 1, draw, color = INK, fill = PASTEL.branco }: IconProps) {
    return (
        <>
            <Box x={x - 40 * s} y={y - 30 * s} w={80 * s} h={60 * s} r={6} look={{ stroke: color, sw: 2.2, fill }} draw={draw} />
            <Line x1={x - 40 * s} y1={y - 16 * s} x2={x + 40 * s} y2={y - 16 * s} look={{ stroke: color, sw: 1.8, single: true }} draw={later(draw, 0.5)} />
        </>
    )
}

export function Doc({ x, y, w, h, title, lines = [], draw, fill = PASTEL.branco, size = 26 }: {
    x: number; y: number; w: number; h: number; title: string; lines?: string[]; draw?: Draw; fill?: string; size?: number
}) {
    const f = 26
    return (
        <>
            <Rough kind="path" args={[`M ${x} ${y} L ${x + w - f} ${y} L ${x + w} ${y + f} L ${x + w} ${y + h} L ${x} ${y + h} Z`]} look={{ fill, sw: 2.2 }} draw={draw} />
            <Rough kind="linearPath" args={[[[x + w - f, y], [x + w - f, y + f], [x + w, y + f]]]} look={{ sw: 1.8, single: true }} draw={later(draw, 0.6)} />
            <Hand x={x + 22} y={y + 22} size={size * 0.78} font={MONO} color={INK_SOFT} draw={later(draw, 0.55)}>{title}</Hand>
            {lines.map((l, i) => (
                <Hand key={i} x={x + 22} y={y + 70 + i * size * 1.45} size={size} draw={later(draw, 0.8 + i * 0.35)}>{l}</Hand>
            ))}
        </>
    )
}

/** container (caixa listrada) */
export function Container({ x, y, s = 1, draw, color = INK, fill = PASTEL.lilas }: IconProps) {
    return (
        <>
            <Box x={x - 46 * s} y={y - 30 * s} w={92 * s} h={60 * s} r={4} look={{ stroke: color, sw: 2.2, fill }} draw={draw} />
            {[-24, -8, 8, 24].map((dx, i) => (
                <Line key={i} x1={x + dx * s} y1={y - 22 * s} x2={x + dx * s} y2={y + 22 * s} look={{ stroke: color, sw: 1.6, single: true }} draw={later(draw, 0.5 + i * 0.08, 0.25)} />
            ))}
        </>
    )
}

export function Moon({ x, y, s = 1, draw, color = INK, fill = PASTEL.amarelo }: IconProps) {
    return <Rough kind="path" args={[`M ${x + 10 * s} ${y - 26 * s} A ${26 * s} ${26 * s} 0 1 0 ${x + 18 * s} ${y + 18 * s} A ${20 * s} ${20 * s} 0 1 1 ${x + 10 * s} ${y - 26 * s} Z`]} look={{ stroke: color, sw: 2.2, fill }} draw={draw} />
}

export function Clock({ x, y, s = 1, draw, color = INK, fill = PASTEL.branco }: IconProps) {
    return (
        <>
            <Rough kind="circle" args={[x, y, 56 * s]} look={{ stroke: color, sw: 2.2, fill }} draw={draw} />
            <Rough kind="linearPath" args={[[[x, y - 16 * s], [x, y], [x + 12 * s, y + 6 * s]]]} look={{ stroke: color, sw: 2.4, single: true }} draw={later(draw, 0.6)} />
        </>
    )
}

export function Eye({ x, y, s = 1, draw, color = INK, fill = PASTEL.branco, off = false }: IconProps & { off?: boolean }) {
    return (
        <>
            <Rough kind="path" args={[`M ${x - 32 * s} ${y} Q ${x} ${y - 28 * s} ${x + 32 * s} ${y} Q ${x} ${y + 28 * s} ${x - 32 * s} ${y} Z`]} look={{ stroke: color, sw: 2.2, fill }} draw={draw} />
            <Rough kind="circle" args={[x, y, 16 * s]} look={{ stroke: color, sw: 2.2, fill: color }} draw={later(draw, 0.5)} />
            {off && <Line x1={x - 30 * s} y1={y - 24 * s} x2={x + 30 * s} y2={y + 24 * s} look={{ stroke: color, sw: 2.6, single: true }} draw={later(draw, 0.8)} />}
        </>
    )
}

export function Envelope({ x, y, s = 1, draw, color = INK, fill = PASTEL.branco }: IconProps) {
    return (
        <>
            <Box x={x - 38 * s} y={y - 26 * s} w={76 * s} h={52 * s} r={4} look={{ stroke: color, sw: 2.2, fill }} draw={draw} />
            <Rough kind="linearPath" args={[[[x - 38 * s, y - 24 * s], [x, y + 4 * s], [x + 38 * s, y - 24 * s]]]} look={{ stroke: color, sw: 2, single: true }} draw={later(draw, 0.5)} />
        </>
    )
}

export function Terminal({ x, y, s = 1, draw, color = INK, fill = '#2B2B2B' }: IconProps) {
    return (
        <>
            <Box x={x - 44 * s} y={y - 30 * s} w={88 * s} h={60 * s} r={6} look={{ stroke: color, sw: 2.2, fill }} draw={draw} />
            <Rough kind="linearPath" args={[[[x - 30 * s, y - 12 * s], [x - 18 * s, y], [x - 30 * s, y + 12 * s]]]} look={{ stroke: '#FBFAF6', sw: 2.4, single: true }} draw={later(draw, 0.5)} />
            <Line x1={x - 12 * s} y1={y + 12 * s} x2={x + 10 * s} y2={y + 12 * s} look={{ stroke: '#FBFAF6', sw: 2.4, single: true }} draw={later(draw, 0.7)} />
        </>
    )
}

/** pop de entrada (para imagens e coisas que não se desenham) */
export function Pop({ at, children, out, from = 0.85, ox = 0, oy = 0 }: { at: number; children: React.ReactNode; out?: number; from?: number; ox?: number; oy?: number }) {
    const t = useT()
    const p = clamp((t - at) / 0.45)
    const e = 1 - Math.pow(1 - p, 3)
    const v = alive(t, { at, out })
    if (p <= 0 || v <= 0) return null
    return <div style={{ position: 'absolute', left: 0, top: 0, opacity: e * v, transform: `scale(${from + (1 - from) * e})`, transformOrigin: `${ox}px ${oy}px` }}>{children}</div>
}
