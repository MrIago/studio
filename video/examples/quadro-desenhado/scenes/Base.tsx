// A base: hierarquia (s04), a tela real (s05) e a escada de quem passa direto (s06).
import React from 'react'
import { A, S } from '../lib/timeline'
import { Arrow, Box, Ellipse, Fade, Hand, Line, Marker, Note, Screen } from '../lib/sketch'
import { At } from '../lib/camera'
import { Card, Chip, Person } from '../lib/bits'
import { INK_SOFT, PASTEL, TINTA } from '../lib/theme'

export const R_TREE = { x: 0, y: 2700 }
export const R_S05 = { x: 2150, y: 2700 }
export const R_LADDER = { x: 4300, y: 2700 }

/** onde fica, no quadro, um ponto da gravação (1920×1080) mostrada numa janela */
export const onShot = (sx: number, sy: number, w: number) => (x: number, y: number) => [sx + (x * w) / 1920, sy + (y * w) / 1920] as const

export const SHOT5 = { x: 110, y: 120, w: 1700 }

export function Base() {
    const p5 = onShot(SHOT5.x, SHOT5.y, SHOT5.w)
    const ring = (x1: number, y1: number, x2: number, y2: number, at: number, color: string = TINTA.laranja) => {
        const [a, b] = p5(x1, y1)
        const [c, d] = p5(x2, y2)
        return <Ellipse cx={(a + c) / 2} cy={(b + d) / 2} w={c - a + 46} h={d - b + 30} look={{ stroke: color, sw: 3.4, rough: 1.4 }} draw={{ at, dur: 0.6 }} />
    }
    return (
        <>
            <At x={R_TREE.x} y={R_TREE.y}>
                <Hand x={80} y={46} size={64} draw={{ at: S('s04') - 0.2, dur: 0.8 }}>a base</Hand>
                <Line x1={80} y1={126} x2={300} y2={130} look={{ sw: 2.2, single: true }} draw={{ at: S('s04') + 0.5, dur: 0.3 }} />

                <Card x={760} y={110} w={400} h={110} fill={PASTEL.azulClaro} title="admin da plataforma" size={36} look={{ dashed: true }}
                    draw={{ at: A('s04', 'admin da plataforma') - 0.2, dur: 0.8 }} />
                <Hand x={1190} y={128} size={27} color={INK_SOFT} draw={{ at: A('s04', 'vê tudo'), dur: 1.0 }}>{'vê tudo, sem aparecer\ncomo membro'}</Hand>

                <Arrow pts={[[960, 226], [960, 300]]} look={{ stroke: INK_SOFT }} draw={{ at: A('s04', 'vem a agência') - 0.3, dur: 0.4 }} />
                <Card x={700} y={310} w={520} h={130} fill={PASTEL.azul} title="agência" sub="sem dono no registro" size={44}
                    draw={{ at: A('s04', 'vem a agência') - 0.1, dur: 0.8 }} />
                {[0, 1, 2].map((i) => (
                    <Fade key={i} keys={i === 2 ? [[A('s04', 'se um sai'), 1], [A('s04', 'se um sai') + 0.6, 0.2]] : [[0, 1]]}>
                        <Person x={330 + i * 110} y={378} s={1.15} fill={PASTEL.azul} draw={{ at: A('s04', 'tem sócios') + i * 0.18, dur: 0.6 }} />
                    </Fade>
                ))}
                <Hand x={440} y={430} size={30} align="center" draw={{ at: A('s04', 'tem sócios') + 0.5, dur: 0.5 }}>sócios, iguais</Hand>
                <Hand x={440} y={475} size={26} align="center" color={TINTA.verde} draw={{ at: A('s04', 'nada quebra') - 0.1, dur: 0.6 }}>um sai, nada quebra</Hand>
                <Arrow pts={[[560, 380], [640, 380], [690, 376]]} draw={{ at: A('s04', 'tem sócios') + 0.6, dur: 0.4 }} />

                <Arrow pts={[[860, 446], [700, 520], [640, 560]]} look={{ stroke: INK_SOFT }} draw={{ at: A('s04', 'cria os clientes') - 0.2, dur: 0.5 }} />
                <Arrow pts={[[1060, 446], [1220, 520], [1280, 560]]} look={{ stroke: INK_SOFT }} draw={{ at: A('s04', 'cria os clientes'), dur: 0.5 }} />
                <Card x={420} y={570} w={430} h={110} fill={PASTEL.pessego} title="Clínica Sorriso" sub="cliente" size={38} draw={{ at: A('s04', 'cria os clientes') + 0.1, dur: 0.7 }} />
                <Card x={1070} y={570} w={430} h={110} fill={PASTEL.pessego} title="Imobiliária" sub="cliente" size={38} draw={{ at: A('s04', 'cria os clientes') + 0.4, dur: 0.7 }} />

                <Line x1={560} y1={686} x2={520} y2={770} look={{ stroke: INK_SOFT, sw: 2 }} draw={{ at: A('s04', 'uma ou mais') - 0.2, dur: 0.3 }} />
                <Line x1={720} y1={686} x2={770} y2={770} look={{ stroke: INK_SOFT, sw: 2, dashed: true }} draw={{ at: A('s04', 'ou mais'), dur: 0.3 }} />
                <Line x1={1285} y1={686} x2={1285} y2={770} look={{ stroke: INK_SOFT, sw: 2 }} draw={{ at: A('s04', 'uma ou mais') - 0.2, dur: 0.3 }} />
                <Card x={400} y={776} w={240} h={92} fill={PASTEL.turquesa} title="Matriz" sub="unidade" size={34} draw={{ at: A('s04', 'uma ou mais'), dur: 0.6 }} />
                <Card x={680} y={776} w={240} h={92} fill={PASTEL.branco} title="outra" sub="unidade" size={34} look={{ dashed: true }} draw={{ at: A('s04', 'ou mais'), dur: 0.6 }} />
                <Card x={1165} y={776} w={240} h={92} fill={PASTEL.turquesa} title="Matriz" sub="unidade" size={34} draw={{ at: A('s04', 'uma ou mais') + 0.2, dur: 0.6 }} />
                <Marker x={420} y={880} w={200} h={30} color={PASTEL.amarelo} draw={{ at: A('s04', 'a matriz') }} />
                <Hand x={520} y={878} size={28} align="center" draw={{ at: A('s04', 'a matriz'), dur: 0.6 }}>nasce com o cliente</Hand>

                {/* a regra: o acesso é sempre por unidade */}
                <Note x={1430} y={300} w={420} h={120} text={'o acesso é sempre\npor unidade'} size={36} rot={2} fill={PASTEL.amarelo}
                    draw={{ at: A('s04', 'acesso é sempre') - 0.2, dur: 0.7 }} />
                <Person x={1640} y={720} s={1.4} fill={PASTEL.lilas} draw={{ at: A('s04', 'A mesma pessoa'), dur: 0.6 }} />
                <Arrow pts={[[1590, 720], [1000, 640], [550, 770]]} look={{ stroke: TINTA.azul }} draw={{ at: A('s04', 'ser gerente') - 0.1, dur: 0.8 }} />
                <Chip x={884} y={636} text="gerente" fill={PASTEL.branco} size={28} draw={{ at: A('s04', 'gerente') + 0.3 }} />
                <Arrow pts={[[1600, 770], [1200, 910], [870, 868]]} look={{ stroke: TINTA.azul }} draw={{ at: A('s04', 'cuidar só') - 0.1, dur: 0.8 }} />
                <Chip x={1150} y={900} text="só o social" fill={PASTEL.branco} size={28} draw={{ at: A('s04', 'do social') }} />
                <Chip x={1510} y={800} text="equipe da agência" fill={PASTEL.azul} size={26} draw={{ at: A('s04', 'equipe da agência') }} />
                <Chip x={1510} y={862} text="pessoas do cliente" fill={PASTEL.pessego} size={26} draw={{ at: A('s04', 'pessoas do cliente') }} />
            </At>

            <At x={R_S05.x} y={R_S05.y}>
                <Screen x={SHOT5.x} y={SHOT5.y} w={SHOT5.w} src="adzhub-arquitetura/takes/login.mp4" label="AdzHub, no navegador"
                    draw={{ at: S('s05') - 0.6, dur: 0.8 }} clips={[
                        { at: A('s05', 'Na tela') - 0.2, from: 6.7, to: 13.0 },
                        { at: A('s05', 'O admin entra'), from: 23.2, to: 27.0 },
                        { at: A('s05', 'A Spot tem'), from: 28.9, to: 31.4 },
                    ]} />
                <Fade keys={[[A('s05', 'A Clínica Sorriso') - 0.05, 0], [A('s05', 'A Clínica Sorriso'), 1]]}>
                    <Screen x={SHOT5.x} y={SHOT5.y} w={SHOT5.w} src="adzhub-arquitetura/takes/cliente.mp4" label="AdzHub, no navegador"
                        draw={{ at: A('s05', 'A Clínica Sorriso') - 0.3, dur: 0.01 }} clips={[
                            { at: A('s05', 'A Clínica Sorriso') - 0.3, from: 7.2, to: 11.5 },
                            { at: A('s05', 'Na matriz') - 0.2, from: 18.0, to: 20.6 },
                        ]} />
                </Fade>
                {ring(1258, 189, 1353, 216, A('s05', 'rótulo escrito'))}
                {ring(1427, 280, 1537, 307, A('s05', 'ou recepção'))}
                {ring(1391, 370, 1525, 398, A('s05', 'ou recepção') + 0.4)}
                <Note x={700} y={540} w={400} h={110} text={'rótulo escrito à mão:\no sistema não lê'} size={30} rot={-2} fill={PASTEL.amarelo}
                    draw={{ at: A('s05', 'o sistema não lê') - 0.6, dur: 0.6 }} />
                {ring(1363, 189, 1537, 216, A('s05', 'outra marca'), TINTA.vermelho)}
                <Note x={1150} y={545} w={480} h={110} text={'acesso a tudo: a unidade\ninteira, até módulo futuro'} size={30} rot={1.5} fill={PASTEL.pessego}
                    draw={{ at: A('s05', 'acesso a tudo') - 0.2, dur: 0.6 }} />
                {ring(1548, 189, 1714, 216, A('s05', 'de um lado só'), TINTA.azul)}
                {ring(1535, 370, 1715, 398, A('s05', 'de um lado só') + 0.3, TINTA.azul)}
                <Note x={1330} y={700} w={400} h={100} text={'em cada cliente,\num lado só'} size={32} rot={-1} fill={PASTEL.azul}
                    draw={{ at: A('s05', 'de um lado só') + 0.2, dur: 0.6 }} />
            </At>

            <At x={R_LADDER.x} y={R_LADDER.y}>
                <Hand x={80} y={46} size={56} draw={{ at: S('s06') - 0.2, dur: 0.8 }}>quem passa direto</Hand>
                {[
                    { k: 'O admin na plataforma', a: 'plataforma', b: 'admin', fill: PASTEL.azulClaro },
                    { k: 'o sócio na agência', a: 'agência', b: 'sócio da agência', fill: PASTEL.azul },
                    { k: 'o sócio do cliente', a: 'cliente', b: 'sócio do cliente', fill: PASTEL.pessego },
                    { k: 'quem tem acesso', a: 'unidade', b: 'acesso a tudo', fill: PASTEL.turquesa },
                ].map((s, i) => {
                    const x = 120 + i * 300
                    const y = 760 - i * 150
                    const at = A('s06', s.k) - 0.2
                    return (
                        <React.Fragment key={s.a}>
                            <Box x={x} y={y} w={300} h={150 + i * 150} r={6} look={{ fill: s.fill, sw: 2.2 }} draw={{ at, dur: 0.6 }} />
                            <Hand x={x + 150} y={y + 18} size={34} align="center" draw={{ at: at + 0.35, dur: 0.5 }}>{s.a}</Hand>
                            <Hand x={x + 150} y={y + 64} size={28} align="center" color={INK_SOFT} draw={{ at: at + 0.55, dur: 0.6 }}>{s.b}</Hand>
                        </React.Fragment>
                    )
                })}
                <Hand x={120} y={940} size={28} color={INK_SOFT} draw={{ at: A('s06', 'escada') }}>a base só decide isto: quatro degraus</Hand>
                <Arrow pts={[[1340, 420], [1430, 420], [1500, 430]]} draw={{ at: A('s06', 'Todo o resto') - 0.3, dur: 0.5 }} />
                <Card x={1510} y={330} w={340} h={220} fill={PASTEL.lilas} title={'o resto:\ncada módulo'} sub="painel de permissões dele" size={40}
                    draw={{ at: A('s06', 'Todo o resto'), dur: 0.8 }} />
            </At>
        </>
    )
}
