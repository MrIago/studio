# quadro-desenhado: o vídeo da arquitetura da AdzHub (24/10/2026)

Explicativo de 11,6 min em que um quadro no traço do Excalidraw se desenha junto com a narração, a
câmera passeia por um mundo único e as telas reais do app aparecem dentro de janelas desenhadas. O
método inteiro está em `references/quadro-desenhado.md` (o estilo) e `references/gravar-telas.md` (a
captura). Inspiração, não template: o próximo vídeo desenha o quadro dele.

## O que tem aqui

| Arquivo | O que é |
|---|---|
| `lib/sketch.tsx` | o traço: `Rough` (rough.js que se desenha), `Box`, `Ellipse`, `Line`, `Arrow`, `Hand`, `Note`, `Marker`, `Check`, `Cross`, `Strike`, `Fade`, e as telas gravadas (`Footage`, `Screen`, `Picture`) |
| `lib/bits.tsx` | peças montadas com o traço: `Card`, `Chip`, `Count`, ícones, `Pop` |
| `lib/camera.tsx` | o mundo único, a câmera por chaves, a grade de pontos na tela e o corte (`At`) |
| `lib/timeline.ts` | a linha do tempo nas palavras: `SECTIONS` com pausas, `A`/`E`/`S`/`Z`/`NEXT`, `AUDIO` |
| `lib/theme.ts` | papel, tinta, pastéis com significado, fontes |
| `Video.tsx` | a composição: fonte Virgil, chaves da câmera do vídeo inteiro, áudio por partes |
| `scenes/Base.tsx` | três regiões: hierarquia desenhada, tela gravada com trechos e anéis (`onShot`), escada |
| `scenes/Fecho.tsx` | o afastamento final com as áreas, a barra de capítulos e o cartão final |
| `data/narracao.exemplo.json` | um trecho de `narracao.json` (formato `{ dur, text, words: [{ w, s, e }] }`) |
| `data/takes/conversa.exemplo.json` | as marcas de uma tomada (`enviou`, `rodando`, `fim`, `confirmou`) |
| `capture/rec.mjs`, `capture/takes.mjs`, `capture/probe.mjs` | a bancada de gravação, tomadas de exemplo e a sondagem |
| `gen/narracao.mjs`, `gen/palavras.mjs` | voz por trecho + transcrição palavra por palavra |

As cenas Intro, Convite, Módulos, Agente e Dashboards ficaram de fora: seguem o mesmo molde de
`Base.tsx`. Por isso o `Video.tsx` importa arquivos que não estão aqui.

## Para montar um vídeo novo a partir disto

1. Crie `~/.studio-engine/src/videos/<nome>/` (o `Root.tsx` descobre o `Video.tsx` sozinho) e copie
   a `lib/`. Troque `ID`, as regiões, as cenas e as chaves da câmera pelas suas.
2. Baixe as duas peças de terceiros (não vêm no repositório):

```bash
curl -sL https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.esm.js -o src/videos/<nome>/lib/rough.js            # MIT
curl -sL https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw-assets/Virgil.woff2 -o public/<nome>/fonts/Virgil.woff2   # OFL
```

3. Roteiro em `~/studio/<nome>/notes/ROTEIRO.md`, narração com `VIDEO=<nome> node gen/narracao.mjs`.
4. Gravações com `capture/` (variáveis de ambiente no topo de `rec.mjs`) para
   `~/.studio-engine/public/<nome>/takes/`.
5. Render sempre com `--gl=angle-egl`. Com `--gl=angle` o render inteiro sai com o diagrama em dobro
   em quase todo quadro (`references/remotion-gotchas.md`).

Os caminhos dos `staticFile(...)` nas cenas apontam para `adzhub-arquitetura/...`: troque pelo nome
do seu vídeo.
