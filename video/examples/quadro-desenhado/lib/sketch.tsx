// Desenho à mão (rough.js, o traço do Excalidraw) que se DESENHA no vídeo: cada forma tem o
// instante em que começa (`at`, em segundos do trecho) e quanto leva (`dur`). O contorno é
// traçado com stroke-dashoffset (pathLength=1, sem medir nada) e o preenchimento entra depois.
// Coordenadas do "quadro" (mundo); quem enquadra é a Câmera.

import React, { useMemo } from 'react'
import { Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig, Img } from 'remotion'
// <Video> do @remotion/media: o mais rápido para gravações (o OffthreadVideo era 3× mais lento aqui)
import { Video as OffthreadVideo } from '@remotion/media'
// @ts-expect-error rough.js vem em ESM sem tipos
import rough from './rough.js'
import { HAND, INK, INK_SOFT, MONO, PASTEL } from './theme'

const gen = rough.generator()

type PathInfo = { d: string; stroke: string; strokeWidth: number; fill?: string }

/** quando aparece (`at`), quanto leva para desenhar (`dur`) e, se for o caso, quando some (`out`) */
export type Draw = { at: number; dur?: number; out?: number; outDur?: number }

export type Look = {
    stroke?: string
    sw?: number
    fill?: string
    hachure?: boolean
    gap?: number
    rough?: number
    bowing?: number
    seed?: number
    single?: boolean
    dashed?: boolean
}

export function useT() {
    const f = useCurrentFrame()
    const { fps } = useVideoConfig()
    return f / fps
}

const drawEase = Easing.bezier(0.45, 0.05, 0.25, 1)
const outEase = Easing.bezier(0.55, 0, 0.75, 0.2)

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))

/** progresso 0→1 do desenho */
export function drawP(t: number, d?: Draw, fallback = 0.8) {
    if (!d) return 1
    const dur = d.dur ?? fallback
    return drawEase(clamp((t - d.at) / Math.max(dur, 0.001)))
}

/** visibilidade 0→1 (some no `out`) */
export function alive(t: number, d?: Draw) {
    if (!d || d.out === undefined) return 1
    const od = d.outDur ?? 0.35
    return 1 - outEase(clamp((t - d.out) / od))
}

function seedOf(s: string) {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
    return Math.abs(h) % 2 ** 31 || 1
}

function makePaths(kind: string, args: unknown[], o: Look) {
    const base = {
        seed: o.seed ?? seedOf(kind + JSON.stringify(args)),
        roughness: o.rough ?? 1.1,
        bowing: o.bowing ?? 1,
        strokeWidth: o.sw ?? 2.4,
        stroke: o.stroke ?? INK,
        disableMultiStroke: o.single ?? false,
        preserveVertices: true,
        strokeLineDash: o.dashed ? [10, 9] : undefined,
    }
    const outline: PathInfo[] = o.stroke === 'none' ? [] : gen.toPaths(gen[kind](...args, { ...base }))
    const fill: PathInfo[] = o.fill
        ? gen.toPaths(gen[kind](...args, {
            ...base, stroke: 'none', fill: o.fill,
            fillStyle: o.hachure ? 'hachure' : 'solid', hachureGap: o.gap ?? 8, fillWeight: 1.8,
        }))
        : []
    return { outline, fill }
}

/** Uma forma rough que se desenha: contorno em sequência, depois o preenchimento. */
export function Rough({ kind, args, look = {}, draw, opacity = 1 }: {
    kind: 'rectangle' | 'ellipse' | 'circle' | 'line' | 'linearPath' | 'curve' | 'path' | 'polygon'
    args: unknown[]
    look?: Look
    draw?: Draw
    opacity?: number
}) {
    const t = useT()
    const { outline, fill } = useMemo(() => makePaths(kind, args, look), [kind, JSON.stringify(args), JSON.stringify(look)])
    const p = drawP(t, draw)
    const v = alive(t, draw) * opacity
    if (p <= 0 || v <= 0) return null
    const n = Math.max(outline.length, 1)
    const outP = clamp(p / (fill.length ? 0.7 : 1))
    const fillP = fill.length ? clamp((p - 0.55) / 0.45) : 0
    return (
        <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: v }}>
            {fill.map((f, i) => {
                const hach = f.fill === 'none' || !f.fill
                return hach ? (
                    <path key={`f${i}`} d={f.d} fill="none" stroke={f.stroke} strokeWidth={f.strokeWidth}
                        strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fillP} />
                ) : (
                    <path key={`f${i}`} d={f.d} fill={f.fill} stroke="none" opacity={fillP} />
                )
            })}
            {outline.map((o, i) => {
                const pi = clamp(outP * n - i)
                if (pi <= 0) return null
                return (
                    <path key={`o${i}`} d={o.d} fill="none" stroke={o.stroke} strokeWidth={o.strokeWidth}
                        strokeLinecap="round" strokeLinejoin="round"
                        pathLength={1} strokeDasharray={look.dashed ? undefined : 1} strokeDashoffset={look.dashed ? undefined : 1 - pi}
                        opacity={look.dashed ? pi : 1} />
                )
            })}
        </svg>
    )
}

/** retângulo de cantos arredondados (o "card" do Excalidraw) */
function roundedRect(x: number, y: number, w: number, h: number, r: number) {
    const k = Math.min(r, w / 2, h / 2)
    return `M ${x + k} ${y} L ${x + w - k} ${y} Q ${x + w} ${y} ${x + w} ${y + k} L ${x + w} ${y + h - k} Q ${x + w} ${y + h} ${x + w - k} ${y + h} L ${x + k} ${y + h} Q ${x} ${y + h} ${x} ${y + h - k} L ${x} ${y + k} Q ${x} ${y} ${x + k} ${y} Z`
}

export function Box({ x, y, w, h, r = 14, look, draw, opacity }: { x: number; y: number; w: number; h: number; r?: number; look?: Look; draw?: Draw; opacity?: number }) {
    return <Rough kind="path" args={[roundedRect(x, y, w, h, r)]} look={look} draw={draw} opacity={opacity} />
}

export function Ellipse({ cx, cy, w, h, look, draw, opacity }: { cx: number; cy: number; w: number; h: number; look?: Look; draw?: Draw; opacity?: number }) {
    return <Rough kind="ellipse" args={[cx, cy, w, h]} look={{ single: false, ...look }} draw={draw} opacity={opacity} />
}

export function Line({ x1, y1, x2, y2, look, draw, opacity }: { x1: number; y1: number; x2: number; y2: number; look?: Look; draw?: Draw; opacity?: number }) {
    return <Rough kind="line" args={[x1, y1, x2, y2]} look={look} draw={draw} opacity={opacity} />
}

/** seta à mão por pontos (curva se tiver 3+ pontos), ponta em V desenhada depois do corpo */
export function Arrow({ pts, look = {}, draw, head = true, opacity, both = false }: {
    pts: [number, number][]; look?: Look; draw?: Draw; head?: boolean; opacity?: number; both?: boolean
}) {
    const t = useT()
    const dur = draw?.dur ?? 0.7
    const shaftDraw = draw ? { ...draw, dur: dur * 0.78 } : undefined
    const headDraw = draw ? { ...draw, at: draw.at + dur * 0.72, dur: dur * 0.3 } : undefined
    const tip = (a: [number, number], b: [number, number]) => {
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
        const L = 18
        return [
            [b[0] - L * Math.cos(ang - 0.45), b[1] - L * Math.sin(ang - 0.45)],
            b,
            [b[0] - L * Math.cos(ang + 0.45), b[1] - L * Math.sin(ang + 0.45)],
        ] as [number, number][]
    }
    const n = pts.length
    const end = tip(pts[n - 2], pts[n - 1])
    const start = tip(pts[1], pts[0])
    void t
    return (
        <>
            <Rough kind={n > 2 ? 'curve' : 'linearPath'} args={[pts]} look={{ single: true, sw: 2.2, ...look }} draw={shaftDraw} opacity={opacity} />
            {head && <Rough kind="linearPath" args={[end]} look={{ single: true, sw: 2.2, ...look, dashed: false }} draw={headDraw} opacity={opacity} />}
            {both && <Rough kind="linearPath" args={[start]} look={{ single: true, sw: 2.2, ...look, dashed: false }} draw={headDraw} opacity={opacity} />}
        </>
    )
}

/** texto à mão que se escreve da esquerda para a direita, linha por linha */
export function Hand({ x, y, size = 36, color = INK, align = 'left', draw, children, w, lh = 1.22, weight = 400, opacity = 1, font = HAND }: {
    x: number; y: number; size?: number; color?: string; align?: 'left' | 'center' | 'right'
    draw?: Draw; children: string; w?: number; lh?: number; weight?: number; opacity?: number; font?: string
}) {
    const t = useT()
    const lines = children.split('\n')
    const total = lines.reduce((s, l) => s + Math.max(l.length, 1), 0)
    const dur = draw?.dur ?? Math.min(2.2, 0.25 + total * 0.035)
    const p = draw ? clamp((t - draw.at) / dur) : 1
    const v = alive(t, draw) * opacity
    if (p <= 0 || v <= 0) return null
    let acc = 0
    const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'
    return (
        <div style={{
            position: 'absolute', left: x, top: y, transform: `translateX(${tx})`, width: w,
            fontFamily: font, fontSize: size, lineHeight: lh, color, fontWeight: weight, opacity: v,
            whiteSpace: w ? 'normal' : 'pre', textAlign: align,
        }}>
            {lines.map((ln, i) => {
                const share = Math.max(ln.length, 1) / total
                const lp = clamp((p - acc) / share)
                acc += share
                return (
                    <div key={i} style={{
                        clipPath: `inset(-30% ${(1 - lp) * 100}% -30% -2%)`,
                        width: 'fit-content', marginLeft: align !== 'left' ? 'auto' : undefined, marginRight: align === 'center' ? 'auto' : undefined,
                    }}>{ln || ' '}</div>
                )
            })}
        </div>
    )
}

/** post-it (bilhete) levemente torto, com texto dentro */
export function Note({ x, y, w, h, fill = PASTEL.amarelo, text, size = 30, rot = -1.5, draw, color = INK, opacity }: {
    x: number; y: number; w: number; h: number; fill?: string; text: string; size?: number; rot?: number; draw?: Draw; color?: string; opacity?: number
}) {
    const t = useT()
    const textDraw = draw ? { ...draw, at: draw.at + (draw.dur ?? 0.8) * 0.55, dur: undefined } : undefined
    return (
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `rotate(${rot}deg)`, transformOrigin: `${x + w / 2}px ${y + h / 2}px`, opacity: opacity ?? 1 }}>
            <Box x={x} y={y} w={w} h={h} r={6} look={{ fill, sw: 1.8, rough: 1.3 }} draw={draw} />
            <Hand x={x + w / 2} y={y + h / 2 - (text.split('\n').length * size * 1.22) / 2} size={size} align="center" color={color} draw={textDraw ? { ...textDraw, out: draw?.out } : undefined}>{text}</Hand>
            {void t}
        </div>
    )
}

/** marca-texto atrás de um trecho (chame antes do texto): passa da esquerda para a direita */
export function Marker({ x, y, w, h, color = PASTEL.amarelo, draw, opacity = 0.9 }: { x: number; y: number; w: number; h: number; color?: string; draw?: Draw; opacity?: number }) {
    const t = useT()
    const p = drawP(t, draw, 0.45)
    const v = alive(t, draw)
    if (p <= 0 || v <= 0) return null
    return (
        <div style={{ position: 'absolute', left: x - 8, top: y - 8, width: w + 16, height: h + 16, clipPath: `inset(-10% ${(1 - p) * 100}% -10% -2%)`, opacity: opacity * v }}>
            <Rough kind="rectangle" args={[8, 8, w, h]} look={{ stroke: 'none', fill: color, rough: 1.6 }} />
        </div>
    )
}

/** ✓ e ✗ desenhados */
export function Check({ x, y, s = 1, color = '#2F9E44', draw }: { x: number; y: number; s?: number; color?: string; draw?: Draw }) {
    return <Rough kind="linearPath" args={[[[x, y + 12 * s], [x + 10 * s, y + 24 * s], [x + 30 * s, y - 4 * s]]]} look={{ stroke: color, sw: 4, single: true }} draw={draw} />
}

export function Cross({ x, y, s = 1, color = '#E03131', draw }: { x: number; y: number; s?: number; color?: string; draw?: Draw }) {
    const d2 = draw ? { ...draw, at: draw.at + (draw.dur ?? 0.5) * 0.5 } : undefined
    return (
        <>
            <Line x1={x} y1={y} x2={x + 26 * s} y2={y + 26 * s} look={{ stroke: color, sw: 4, single: true }} draw={draw ? { ...draw, dur: (draw.dur ?? 0.5) * 0.5 } : undefined} />
            <Line x1={x + 26 * s} y1={y} x2={x} y2={y + 26 * s} look={{ stroke: color, sw: 4, single: true }} draw={d2 ? { ...d2, dur: (draw?.dur ?? 0.5) * 0.5 } : undefined} />
        </>
    )
}

/** risca uma caixa inteira (alternativa recusada) */
export function Strike({ x, y, w, h, draw, color = '#E03131' }: { x: number; y: number; w: number; h: number; draw?: Draw; color?: string }) {
    const half = draw ? { ...draw, dur: (draw.dur ?? 0.6) * 0.5 } : undefined
    const second = draw ? { ...draw, at: draw.at + (draw.dur ?? 0.6) * 0.5, dur: (draw.dur ?? 0.6) * 0.5 } : undefined
    return (
        <>
            <Line x1={x} y1={y} x2={x + w} y2={y + h} look={{ stroke: color, sw: 3.5, single: true, rough: 1.6 }} draw={half} />
            <Line x1={x + w} y1={y} x2={x} y2={y + h} look={{ stroke: color, sw: 3.5, single: true, rough: 1.6 }} draw={second} />
        </>
    )
}

/**
 * Trecho de uma gravação: começa a tocar em `at` (segundos globais), a partir de `from` (segundos
 * da gravação). Com `to`, a velocidade se ajusta para chegar em `to` quando o próximo trecho
 * começa (entre 0,4× e 4×); o que sobrar segura o último quadro.
 */
export type Clip = { at: number; from: number; to?: number; rate?: number }

const TAKE_W = 1920
const TAKE_H = 1080

function Still({ src, frame, w, h, ox, oy }: { src: string; frame: number; w: number; h: number; ox: number; oy: number }) {
    return <OffthreadVideo src={staticFile(src)} trimBefore={Math.max(0, frame)} playbackRate={0.0001} muted
        style={{ position: 'absolute', left: ox, top: oy, width: w, height: h }} />
}

/** a gravação tocando os trechos em sequência, dentro de uma caixa (com recorte opcional) */
export function Footage({ src, clips, until, boxW, boxH, crop }: {
    src: string; clips: Clip[]; until: number; boxW: number; boxH: number; crop?: { x: number; y: number; w: number; h: number }
}) {
    const { fps } = useVideoConfig()
    const c = crop ?? { x: 0, y: 0, w: TAKE_W, h: TAKE_H }
    const k = boxW / c.w
    const vw = TAKE_W * k
    const vh = TAKE_H * k
    const ox = -c.x * k
    const oy = -c.y * k
    const out: React.ReactNode[] = []
    const f = (s: number) => Math.round(s * fps)
    // antes do primeiro trecho: o primeiro quadro parado
    out.push(
        <Sequence key="pre" from={0} durationInFrames={Math.max(1, f(clips[0].at))} layout="none">
            <Still src={src} frame={f(clips[0].from)} w={vw} h={vh} ox={ox} oy={oy} />
        </Sequence>,
    )
    clips.forEach((cl, i) => {
        const end = i + 1 < clips.length ? clips[i + 1].at : until
        const span = Math.max(0.05, end - cl.at)
        let rate = cl.rate ?? 1
        // com `to` e um próximo trecho, a velocidade se ajusta; o último trecho toca na velocidade dele e segura
        if (cl.to !== undefined && cl.rate === undefined && end < 1e5) rate = clamp((cl.to - cl.from) / span, 0.4, 4)
        const playLen = cl.to !== undefined ? Math.min(span, (cl.to - cl.from) / rate) : span
        out.push(
            <Sequence key={`c${i}`} from={f(cl.at)} durationInFrames={Math.max(1, f(playLen))} layout="none">
                <OffthreadVideo src={staticFile(src)} trimBefore={f(cl.from)} playbackRate={rate} muted
                    style={{ position: 'absolute', left: ox, top: oy, width: vw, height: vh }} />
            </Sequence>,
        )
        if (playLen < span - 0.04) {
            const stop = cl.from + playLen * rate
            out.push(
                <Sequence key={`h${i}`} from={f(cl.at + playLen)} durationInFrames={Math.max(1, f(span - playLen))} layout="none">
                    <Still src={src} frame={f(stop) - 1} w={vw} h={vh} ox={ox} oy={oy} />
                </Sequence>,
            )
        }
    })
    return <div style={{ position: 'absolute', left: 0, top: 0, width: boxW, height: boxH, overflow: 'hidden' }}>{out}</div>
}

/** janela desenhada com uma gravação de tela dentro */
export function Screen({ x, y, w, src, clips, draw, label, opacity = 1, crop }: {
    x: number; y: number; w: number; src: string; clips: Clip[]; draw: Draw; label?: string; opacity?: number
    crop?: { x: number; y: number; w: number; h: number }
}) {
    const t = useT()
    const bar = Math.round(Math.max(22, Math.min(w * 0.028, 40)))
    const h = Math.round(crop ? (w * crop.h) / crop.w : (w * 9) / 16)
    const frameDur = draw.dur ?? 0.9
    const show = clamp((t - (draw.at + frameDur * 0.55)) / 0.35)
    const v = alive(t, draw) * opacity
    if (t < draw.at || v <= 0) return null
    const until = draw.out ?? 1e6
    return (
        <div style={{ position: 'absolute', left: 0, top: 0, opacity: v }}>
            <Box x={x - 10} y={y - bar - 12} w={w + 20} h={h + bar + 22} r={16} look={{ fill: '#FFFFFF', sw: 2.6, rough: 0.9 }} draw={draw} />
            {[0, 1, 2].map((i) => (
                <Rough key={i} kind="circle" args={[x + 12 + i * (bar * 0.7), y - bar / 2 - 5, bar * 0.36]} look={{ stroke: INK_SOFT, sw: 1.6, single: true }} draw={{ at: draw.at + frameDur * 0.6, dur: 0.2 }} />
            ))}
            {label && <Hand x={x + bar * 2.6} y={y - bar - 7} size={bar * 0.62} color={INK_SOFT} font={MONO} draw={{ at: draw.at + frameDur * 0.6, dur: 0.5 }}>{label}</Hand>}
            <div style={{
                position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', borderRadius: 6,
                opacity: show, transform: `scale(${0.985 + 0.015 * show})`, transformOrigin: 'center', background: '#F4EFE6',
            }}>
                <Footage src={src} clips={clips} until={until} boxW={w} boxH={h} crop={crop} />
            </div>
        </div>
    )
}

/** imagem parada dentro de um papel desenhado */
export function Picture({ x, y, w, h, src, draw, frame = true, opacity = 1 }: { x: number; y: number; w: number; h: number; src: string; draw: Draw; frame?: boolean; opacity?: number }) {
    const t = useT()
    const dur = draw.dur ?? 0.8
    const show = clamp((t - (draw.at + dur * 0.5)) / 0.35)
    const v = alive(t, draw) * opacity
    if (t < draw.at || v <= 0) return null
    return (
        <div style={{ position: 'absolute', left: 0, top: 0, opacity: v }}>
            {frame && <Box x={x - 10} y={y - 10} w={w + 20} h={h + 20} r={14} look={{ fill: '#FFFFFF', sw: 2.4 }} draw={draw} />}
            <Img src={staticFile(src)} style={{ position: 'absolute', left: x, top: y, width: w, height: h, objectFit: 'cover', objectPosition: 'top', opacity: show, borderRadius: 4 }} />
        </div>
    )
}

/** fade de um grupo por chaves [t, opacidade] (holofote: ativo 1, contexto ~0,5, usado ~0,3) */
export function Fade({ keys, children }: { keys: [number, number][]; children: React.ReactNode }) {
    const t = useT()
    const ts = keys.map((k) => k[0])
    const vs = keys.map((k) => k[1])
    const o = keys.length === 1 ? vs[0] : interpolate(t, ts, vs, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) })
    if (o <= 0.001) return null
    return <div style={{ position: 'absolute', left: 0, top: 0, opacity: o }}>{children}</div>
}
