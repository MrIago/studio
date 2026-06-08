---
name: gotchas
description: Armadilhas reais que custaram tempo ao criar vídeos com Remotion + OpenRouter + publicar no GitHub
---

# Gotchas (aprendidos na marra)

## GitHub README: player de vídeo

**O player de vídeo inline no README só funciona com URL `user-attachments`** — `https://github.com/user-attachments/assets/<uuid>`.

- ❌ `.mp4` **commitado no repo** (`raw/main/demo/demo.mp4`) → só baixa, não toca.
- ❌ `.mp4` como **release asset** (`releases/download/...`) → também só baixa numa linha solta.
- ✅ URL `user-attachments/assets/...` → **vira player**.

Essa URL **só é gerada arrastando o arquivo na interface web** do GitHub (editar README na web → arrastar o vídeo). **NÃO dá pra gerar via token de API** (o endpoint `github.com/upload/policies/assets` exige sessão web/cookie, retorna login com token). 

Fluxo: o agente prepara tudo, pede pro usuário arrastar o vídeo no editor web do README, o usuário cola a URL `user-attachments` gerada, o agente coloca no README (numa linha sozinha, sem markdown de imagem) e dá push.

Fallback 100% por código: **GIF clicável** (`<img>` dentro de `<a href=mp4>`). GIF aparece (é imagem), mas perde áudio. Gere GIF leve: `ffmpeg -i v.mp4 -vf "fps=10,scale=360:-1:flags=lanczos,palettegen=max_colors=128" pal.png && ffmpeg -i v.mp4 -i pal.png -lavfi "fps=10,scale=360:-1[x];[x][1:v]paletteuse" demo.gif` (~1.3MB).

## Remotion

- **CSS transition/animation e `animate-*`/`transition-*` do Tailwind NÃO renderizam.** Tudo por `useCurrentFrame()`. Erro silencioso: parece animar no preview do navegador mas sai parado/quebrado no render.
- **`useCurrentFrame()` dentro de `<Sequence>` retorna frame LOCAL** (começa em 0), não o absoluto. Cuidado ao calcular animações.
- **`<TransitionSeries.Transition>` encurta o total** pela duração da transição. `TOTAL = soma(durações) - soma(transições)`. Se o vídeo cortar cedo ou áudios dessincronizarem, é isso.
- Renderizar o vídeo todo é lento; **valide com `remotion still` (1 frame)** antes. O agente pode `Read` o PNG.
- Fontes Google: importe com pesos/subsets específicos (`loadFont('normal',{weights:['400','700'],subsets:['latin']})`) — senão gera warning de "21 network requests".
- `import cairo` etc.: ao desenhar formas, use `<div>`/SVG/CSS — não há canvas API direto a menos que use `<HtmlInCanvas>` (Chrome 149+ com flag).

## OpenRouter áudio

- Modelos de áudio **não aparecem por busca de keyword** em `/v1/models`. Filtre por `output_modalities`.
- **TTS (`gemini-tts`)**: PADRÃO da skill. Tags de emoção inline (`[excited]`/`[whispers]`) num request; multi-voz (`geminiDialog`) só com `GEMINI_API_KEY` (a OR não roteia multi-speaker → 404). Texto com travessão/reticência/frase curta à toa cria SILÊNCIO (picota). Saída PCM → WAV.
- **Música (`lyria-3`)**: `stream:true` é OBRIGATÓRIO (senão 400). Áudio nos chunks SSE como `delta.audio.data` base64. **O stream tem linhas keep-alive `: OPENROUTER PROCESSING`** antes do áudio — ignore (não começam com `data:`). **Às vezes a 1ª tentativa volta vazia (0KB)** → SEMPRE valide `buf.length` e dê retry (até 3×). O `generate-audio.mjs` já faz isso.
- **SFX (whoosh/ding) precisam existir em `public/`** antes do render, senão `<Audio src="whoosh.wav">` quebra. O `generate-audio.mjs` baixa-os de `remotion.media`. Se gerar áudio à parte, baixe os SFX também.
- Chave: nunca commitar em repo público; passar via env / `~/.config/studio/.env`.

## Áudio faltante quebra o render

`<Audio src={staticFile('x.mp3')} />` **lança erro no render se o arquivo não existir** em `public/`. Defesas:
1. Garanta que `generate-audio.mjs` rodou e produziu TODOS os assets (vo-*, music, whoosh, ding) antes de `render.mjs`.
2. Pra tolerar ausência, condicione o `<Audio>` a uma flag de props (`defaultProps={{hasMusic:true}}` + `{props.hasMusic && <Audio .../>}`).

## Publicação / git

- Mantenha o projeto Remotion (node_modules, áudios, stills) numa pasta **gitignored**; versione só o MP4/GIF final.
- Pra `git push` com token sem salvá-lo: `git push "https://USER:TOKEN@github.com/..." main` e configure o remote SEM o token (`git remote set-url origin https://github.com/...`).
- Tokens colados no chat devem ser **revogados** depois (GitHub: settings/tokens; OpenRouter: /keys).

## Debug criativo

Pra checar o que um TTS realmente falou (pausas, repetições), transcreva o MP3 com faster-whisper local — útil quando um áudio sai mais longo que o esperado.
- **Áudio NÃO respeita Sequence?** Use `<Audio>` do core `remotion`, NÃO do `@remotion/media`. O do @remotion/media IGNORA o `from` do `<Sequence>` pai e toca desde o frame 0 (causa narrações/áudios todos empilhados no início). O core respeita o Sequence e desloca certo.
