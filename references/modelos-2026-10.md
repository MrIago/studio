# Catálogo de mídia da OpenRouter — retrato de 15/10/2026

Retrato com preço, para decidir rápido. **O vivo é `node scripts/catalog.mjs [image|video|speech|audio] [id]`**:
o catálogo muda todo mês. Testado = gerei e conferi. O resto: só ficha e preço.

## Voz (35 modelos) — caixa genérica `speech()` (`scripts/models/or-speech.mjs`)

| Uso | Modelo · voz | Preço | Status |
|---|---|---|---|
| Narração PT-BR nativa | `microsoft/mai-voice-2.1` · `pt-BR-Rafael` / Caio / Pedro / Luana / Harper (`:MAI-Voice-2.1`) | $22/M chars (~0,3cr por 150 chars) | ✅ testado, pronúncia certa |
| PT-BR rápida | `microsoft/mai-voice-2.1-flash` (mesmas vozes `:MAI-Voice-2.1-Flash`) | $15/M | ficha |
| Mais expressiva (tags inline) | `elevenlabs/eleven-v4` · brian, sarah, george, alice… (90+ línguas) | $40/M | ✅ testado PT-BR |
| Expressiva mais barata | `elevenlabs/eleven-v4-turbo` | $20/M | ficha |
| Emoção inline + 30 vozes | `google/gemini-3.8-flash-tts` (só PCM → WAV) | ~centavos | ✅ testado (lê "pra" coloquial) |
| Outras | Fish S2.1 Pro (deu 400 sem voz), MiniMax Speech 2.8 HD/Turbo, Qwen Audio 3.0, Grok Voice, Kokoro (barata, open), Voxtral (clonagem) | — | ficha |

## Vídeo IA (30 modelos) — caixa genérica `orVideo()` (`scripts/models/or-video.mjs`)

Preço por segundo de saída (ficha da OR). Frames = aceita first/last frame (i2v).

| Uso | Modelo | Preço/s | Notas |
|---|---|---|---|
| Barato e rápido, rascunho | `x-ai/grok-imagine-video-1.5-lite` | 3¢ 720p · 14¢ 1080p | first frame, sem áudio, 1-15s |
| Barato com áudio e first+last | `google/veo-3.1-lite` | 5¢ (sem áudio) · 8¢ (com) | 4/6/8s |
| Equilíbrio Google | `google/veo-3.1-fast` | 10¢ · 12¢ com áudio | até 4K |
| Topo Google | `google/veo-3.1` (caixa `veo31`) | 20¢ · 40¢ com áudio | |
| Longo (até 30s) com áudio | `alibaba/wan-3.0` | 10¢ 720p · 20¢ 1080p | first frame |
| Narrativo/multirreferência | `bytedance/seedance-2.5` | por token de vídeo | first+last, áudio, até 30s |
| Seedance barato | `bytedance/seedance-2.0-fast` / `-mini` | por token | first+last, áudio |
| Kling | `kwaivgi/kling-v3.0-std` / `-pro` | 8,4¢ / 11,2¢ (com áudio 12,6 / 16,8¢) | first+last |
| Cinemático | `runway/gen-4.5` | 12¢ | 720p, 2-10s |
| Alta resolução | `black-forest-labs/flux-3-video` | 17¢ 720p … 41¢ 4K | first+last, áudio |
| Avatar falando de 1 foto | `heygen/avatar-iv` | 5¢ | lip-sync de foto |
| Editar vídeo existente | `runway/aleph-2` (28¢, mín 56¢) · `black-forest-labs/flux-video-edit` (3¢) | | add/remover/trocar objeto |
| Upscale | `black-forest-labs/flux-video-upscale` | por MP·s | 1,5-3× |

Nenhum destes foi testado nesta rodada além de `veo31`/`grokImagineVideo` (caixas antigas).
Teste em 480p/720p curto antes de gastar em 1080p.

## Imagem — novidades desde a última tabela (não testadas)

`openai/gpt-image-2.5-flare` e `-sunburst` (set/2026), `black-forest-labs/flux-3-image`
e `flux-3-image-klein` (out/2026), `bytedance-seed/seedream-5-0-pro|lite|flash`,
`google/gemini-nano-banana-2.1`, `microsoft/mai-image-2.6`, `qwen/qwen-image-3-pro`,
`recraft/recraft-v4.1-flash`, `x-ai/grok-imagine-image-2.0`, `krea/krea-2-*`.
O padrão continua `gpt54Image2` até um teste lado a lado provar outro.

## Música

Só `google/lyria-3-pro-preview` e `lyria-3-clip-preview` (caixa `lyria3`).
