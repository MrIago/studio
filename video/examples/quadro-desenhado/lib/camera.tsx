// Câmera do quadro: um mundo só (o quadro inteiro) e a câmera passeando por ele.
// Cada chave diz para onde olhar (centro x,y no mundo), com que zoom, a partir de quando
// (`t`, segundos globais) e em quanto tempo chega (`d`). Entre chaves, a câmera fica parada,
// só com uma respiração bem leve.
// Corte do que está fora da câmera: cada região (`At`) só monta quando a caixa dela encosta no
// enquadramento. Sem isso, cada quadro redesenha o quadro inteiro (milhares de traços e todas as
// gravações paradas), e o render fica várias vezes mais lento.

import React, { createContext, useContext } from 'react'
import { Easing } from 'remotion'
import { clamp, useT } from './sketch'
import { PAPER } from './theme'

export type Key = { t: number; x: number; y: number; z: number; d?: number }

const move = Easing.bezier(0.65, 0, 0.35, 1)

export function camAt(keys: Key[], t: number) {
    let cur = { x: keys[0].x, y: keys[0].y, z: keys[0].z }
    for (let i = 1; i < keys.length; i++) {
        const k = keys[i]
        const d = k.d ?? 1.6
        if (t <= k.t) break
        const p = move(clamp((t - k.t) / d))
        // zoom interpola em escala logarítmica (fica natural ao afastar muito)
        const z = Math.exp(Math.log(cur.z) + (Math.log(k.z) - Math.log(cur.z)) * p)
        cur = { x: cur.x + (k.x - cur.x) * p, y: cur.y + (k.y - cur.y) * p, z }
    }
    return cur
}

type View = { x: number; y: number; w: number; h: number }
const ViewCtx = createContext<View | null>(null)

export function Camera({ keys, children, width = 1920, height = 1080, gap = 48 }: { keys: Key[]; children: React.ReactNode; width?: number; height?: number; gap?: number }) {
    const t = useT()
    const c = camAt(keys, t)
    // respiração: 0,4% de zoom num ciclo lento
    const breathe = 1 + 0.004 * Math.sin(t * 0.55)
    const z = c.z * breathe
    // grade de pontos no espaço da TELA, deslocada com a câmera (um elemento gigante no mundo
    // quebra a pintura do Chrome em ladrilhos de estados diferentes)
    const g = gap * z
    const ox = (((width / 2 - c.x * z) % g) + g) % g
    const oy = (((height / 2 - c.y * z) % g) + g) % g
    // medido no render em tamanho real: o gradiente de 1-2 px sai bem mais escuro que o alfa pedido
    const dot = Math.max(0.6, 1.3 * Math.min(1, z * 1.4))
    const alpha = 0.028 * clamp(z * 2.5)
    // o que a câmera enxerga no mundo, com folga de 15% de cada lado
    const vw = (width / z) * 1.3
    const vh = (height / z) * 1.3
    const view: View = { x: c.x - vw / 2, y: c.y - vh / 2, w: vw, h: vh }
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: PAPER }}>
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `radial-gradient(rgba(0,0,0,${alpha.toFixed(3)}) ${dot}px, transparent ${dot + 0.3}px)`,
                backgroundSize: `${g}px ${g}px`, backgroundPosition: `${ox - g / 2}px ${oy - g / 2}px`,
            }} />
            <div style={{
                position: 'absolute', left: 0, top: 0, width: 1, height: 1,
                transformOrigin: '0 0',
                transform: `translate(${width / 2}px, ${height / 2}px) scale(${z}) translate(${-c.x}px, ${-c.y}px)`,
            }}>
                <ViewCtx.Provider value={view}>{children}</ViewCtx.Provider>
            </div>
        </div>
    )
}

/**
 * Origem local de uma região do quadro. `w`/`h` = a caixa do que a região desenha (a partir da
 * origem); fora do enquadramento, a região não monta.
 */
export function At({ x, y, w = 2000, h = 1150, children }: { x: number; y: number; w?: number; h?: number; children: React.ReactNode }) {
    const v = useContext(ViewCtx)
    if (v && (x + w < v.x || x > v.x + v.w || y + h < v.y || y > v.y + v.h)) return null
    return <div style={{ position: 'absolute', left: x, top: y, width: 1, height: 1 }}>{children}</div>
}
