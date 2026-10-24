// AdzHub, a nova versão: um quadro desenhado à mão (estilo Excalidraw) que se constrói junto com a
// narração, com as telas reais gravadas no app. Um mundo só; a câmera passeia e, no fim, se afasta
// para mostrar o quadro inteiro. Tudo se ancora em palavras da narração (lib/timeline.ts).
// (Exemplo da skill: só as cenas Base e Fecho vieram junto; as outras seguem o mesmo molde.
// Este arquivo fica inteiro porque mostra a câmera do vídeo todo. Ver o README.)

import React, { useState } from 'react'
import { AbsoluteFill, Audio, continueRender, delayRender, Sequence, staticFile } from 'remotion'
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono'
import { A, AUDIO, S, TOTAL } from './lib/timeline'
import { Camera, Key } from './lib/camera'
import { PAPER } from './lib/theme'
import { Intro, R_METHOD, R_OLD } from './scenes/Intro'
import { Base, R_LADDER, R_S05, R_TREE } from './scenes/Base'
import { Convite, R_INVITE, R_SEC, R_VER } from './scenes/Convite'
import { Modulos, R_MOD, R_VAULT } from './scenes/Modulos'
import { Agente, DEMO, R_AG1, R_AG2, R_AG3, R_AG4, R_AG5, R_AG6, demoAt, demoX } from './scenes/Agente'
import { Dashboards, R_D1, R_D2, R_D3 } from './scenes/Dashboards'
import { ChapterBar, EndCard, FechoWorld, WORLD } from './scenes/Fecho'

export const ID = 'AdzhubArquitetura'
export const FPS = 30
export const WIDTH = 1920
export const HEIGHT = 1080
export const DURATION = Math.ceil(TOTAL * FPS)

loadMono('normal', { weights: ['400', '500'], subsets: ['latin'] })

let fontsLoaded = false
function useHandFont() {
    useState(() => {
        if (fontsLoaded || typeof document === 'undefined') return null
        fontsLoaded = true
        const handle = delayRender('Virgil')
        const face = new FontFace('Virgil', `url(${staticFile('adzhub-arquitetura/fonts/Virgil.woff2')}) format('woff2')`)
        face.load()
            .then((f) => { document.fonts.add(f); return document.fonts.ready })
            .then(() => continueRender(handle))
            .catch(() => continueRender(handle))
        return null
    })
}

const at = (r: { x: number; y: number }, dx = 960, dy = 540) => ({ x: r.x + dx, y: r.y + dy })

function keys(): Key[] {
    const k: Key[] = [{ t: 0, x: 960, y: 540, z: 1 }]
    const go = (t: number, p: { x: number; y: number }, z = 1, d = 1.8) => k.push({ t, d, ...p, z })
    go(S('s02') - 0.7, at(R_OLD), 1, 1.5)
    go(S('s03') - 0.7, at(R_METHOD), 1, 1.5)
    // a base
    go(S('s04') - 1.0, at(R_TREE))
    go(A('s04', 'A mesma pessoa') - 0.4, at(R_TREE, 1120, 620), 1.18, 1.4)
    go(S('s05') - 1.0, at(R_S05))
    go(A('s05', 'Na matriz') - 0.1, at(R_S05, 1300, 470), 1.3, 1.3)
    go(S('s06') - 1.0, at(R_LADDER))
    go(S('s07') - 1.0, at(R_INVITE))
    go(S('s08') - 1.0, at(R_SEC))
    go(S('s09') - 1.0, at(R_VER))
    go(A('s09', 'A recepção') - 0.6, at(R_VER, 560, 470), 1.3, 1.2)
    go(A('s09', 'modo de leitura') - 0.3, at(R_VER, 1060, 430), 1.2, 1.2)
    go(S('s10') - 1.0, at(R_MOD))
    go(S('s11') - 1.0, at(R_VAULT))
    go(A('s11', 'O cofre') - 0.7, at(R_VAULT, 2900, 540), 1, 1.6)
    // o agente
    go(S('s12') - 1.2, at(R_AG1), 1, 2.4)
    go(S('s13') - 1.0, at(R_AG2))
    go(S('s14') - 1.0, at(R_AG3, 1000, 540))
    go(S('s15') - 1.0, at(R_AG4, 1110, 540), 0.88)
    go(S('s16') - 1.0, at(R_AG5, 1050, 500), 0.92)
    for (let i = 0; i < 6; i++) go(demoAt(i) - 0.9, at(R_AG6, demoX(i) + DEMO.w / 2, 590), 0.92, 1.2)
    go(A('s17', 'Ninguém programou') - 0.4, at(R_AG6, 80 + (5 * DEMO.gap + DEMO.w) / 2, 660), 0.43, 1.6)
    // os dashboards
    go(S('s18') - 1.2, at(R_D1), 1, 2.4)
    go(S('s19') - 1.0, at(R_D2, 1040, 560), 0.92)
    go(S('s20') - 1.0, at(R_D3, 965, 500))
    go(A('s20', 'o chat') + 1.2, at(R_D3, 1520, 520), 1.3, 1.2)
    // o quadro inteiro
    go(S('s21') - 0.3, { x: WORLD.x + WORLD.w / 2, y: WORLD.y + WORLD.h / 2 }, Math.min(1920 / (WORLD.w + 300), 1080 / (WORLD.h + 240)), 3.6)
    return k
}

const KEYS = keys()

export const Video: React.FC = () => {
    useHandFont()
    return (
        <AbsoluteFill style={{ background: PAPER }}>
            <Camera keys={KEYS}>
                <Intro />
                <Base />
                <Convite />
                <Modulos />
                <Agente />
                <Dashboards />
                <FechoWorld />
            </Camera>
            <ChapterBar />
            <EndCard />
            {AUDIO.map((p, i) => (
                <Sequence key={i} from={Math.round(p.at * FPS)} durationInFrames={Math.max(1, Math.round((p.to - p.from) * FPS))}>
                    <Audio src={staticFile(`adzhub-arquitetura/audio/${p.id}.wav`)} trimBefore={Math.round(p.from * FPS)} />
                </Sequence>
            ))}
        </AbsoluteFill>
    )
}
