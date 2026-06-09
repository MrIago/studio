# Studio — Qual modelo usar (mapa testado, 2026-06-07)

Tudo validado gerando de verdade na OpenRouter + aprovado visualmente pelo mriago.
Base p/ o componente "Qual usar" do Lasy Studio e p/ a skill `studio`.

## 🧭 Filosofia (regra-mãe)

**gpt-5.4-image-2 é o NO-BRAINER padrão em TUDO (gerar e editar).** Os outros são
FALLBACK — só quando o usuário reclama do output OU o gpt recusa (copyright).

Por quê: refazer 3× num modelo barato por output ruim (créditos + tempo + frustração)
sai mais caro que acertar de primeira no gpt. Qualidade/confiabilidade > centavos.
"Meter o fodase pro custo" — a longo prazo compensa.

## 📋 Tabela por caso de uso (TABELA FINAL)

| Caso | 🥇 Padrão | Fallback / nota | Custo | Veloc. |
|---|---|---|---|---|
| **Imagem que importa** (qualidade, precisão, física, texto, detalhe) | **gpt-5.4-image-2** | seedream-4.5 | 4–24cr | 🐌 150s |
| **Imagem realista com PESSOAS** (poses/expressões variadas) | **gpt-5.4-image-2** | — (baratos clonam gente) | ~17cr | 🐌 |
| **Imagem barata** (detalhe NÃO importa — paisagem, cena genérica) | **seedream-4.5** | gemini-2.5 | ~4cr | ⚡ 9s |
| **Rápido + barato — COM estilo artístico específico** (Pixel art, Clay, etc) | **recraft-v3** (`style` da lista + `rgb_colors`) | — | ~4cr | ⚡ 6.5s |
| **Rápido + barato — estilo NÃO está na lista do recraft** | **grok-imagine** (genérico rápido) | — | ~5cr | ⚡⚡ 3.4s |
| **Editar — detalhe IMPORTANTE / identidade** | **gpt-5.4** | — | ~18-24cr | 🐌 |
| **Editar — rosto de PESSOA REAL** | **gpt-5.4 + mandar as FOTOS REAIS da pessoa junto** | — | ~21cr | 🐌 |
| **Editar — rápido/simples** (bokeh, cor, fundo, produto) | gpt-5.4 ou baratos p/ economizar | nano banana 1º, seedream 2º | 4–24cr | varia |
| **Compor cena** (juntar pessoas/objetos fiéis a refs) | **gpt-5.4 + N refs reais** | — | 15–21cr | 🐌 |
| **Personagem/famoso FIEL** ⭐ | **ref real → gpt-5.4 COMPÕE** (recusa gerar do zero, compõe com ref) | — | 15–21cr | 🐌 |
| **Gerar personagem copyright DO ZERO** (gpt recusa: Mickey/Pikachu/Bart) | **seedream-4.5** | recraft-v3 | ~4cr | ⚡ |
| **Transparente / ÍCONE pra asset** (overlay, slide) | **gpt-5-image-mini** (prompt "flat vector style, like SVG icon") | — | ~4cr | 🐌 37s |
| **SVG vetorial REAL** (só se precisa escala favicon→outdoor) | **recraft-v4.1-pro-vector** | ⚠️ bug: branco em espaço negativo (furo) não some | ~30cr | ⚡ 13s |
| **Animação vetorial leve** (logo/loader/data-viz · web/app ou camada de vídeo) | **Lottie** (`lottie`/`svgToLottie`) | Claude ESCREVE o JSON (não é API); valida no render Remotion; `.json` leve | grátis | ⚡ |
| **Fundo c/ paleta da marca + 65 styles + texto posicionado** | **recraft-v3** (`style` + `text_layout` + `rgb_colors`) | — | ~4cr | ⚡ |
| **Paleta de cores forçada** (sem style) | qualquer **recraft** (todos têm `rgb_colors`) | — | 4–30cr | ⚡ |
| ❌ **NUNCA pra editar** | recraft-v4* (ignora ref, troca o personagem) | — | — | — |

**Regra rápido+barato (resolvida):** estilo pedido ESTÁ na lista do recraft → **recraft-v3** (param dedicado + paleta). Estilo NÃO está → **grok-imagine** (mais rápido, genérico). Lista de estilos = `references/recraft-estilos.md`.

**Velocidade é o 3º eixo de decisão**: gpt-5.4 (melhor qualidade) custa 150s (2,5min); rápido = recraft-v3/grok/gemini/seedream (3–9s, ~18× mais rápido). Tabela completa: `references/velocidade.md`.

## ⭐ Padrões de ouro (regras transversais)

1. **Personagem copyright / pessoa real FIEL** → baixar/pedir as fotos reais →
   mandar como ref pro **gpt-5.4 compor**. O gpt RECUSA "gere o Mickey" mas ACEITA
   "componha estes que te dei" — e é o mais fiel. (validado: Rayan erguendo a taça,
   Phineas+Ferb+Bart no bar do Moe.)

2. **Editar identidade de pessoa real** → SEMPRE mandar as fotos reais dela junto
   (a imagem a editar + N refs do rosto). NUNCA editar só a imagem já gerada — o
   rosto gerado é "inventado". Sem as refs reais o seedream troca a pessoa; com elas
   o gpt mantém fiel.

3. **Pedir o link/foto ao usuário** antes de pescar referência ruim da web. Só buscar
   automático se ele pedir. (API Fandom/Wikipedia funciona, mas pega foto ruim às vezes.)

4. **Mandar TODAS as refs** (não escolher uma) — o modelo usa o melhor de cada ângulo.

## 🔬 Gotchas técnicos (por que, não só o quê)

- **Sem param de fidelidade i2i** exceto Recraft (`strength` 0.0-1.0, default 0.2,
  baixo=mantém input). seedream/gemini/gpt NÃO têm strength (OR ignora se mandar).
  Por isso seedream "viaja" em edição com identidade; gpt tem aderência NATIVA.
- **Copyright por modelo (GERAR do zero)**: seedream ✅ confiável · recraft-v3 ✅ ·
  gemini-2.5 ⚠️ (recusa por nome, gera por descrição genérica) · gemini-3-pro ❌
  (o + rígido) · gpt-5.4/flux/grok ❌. MAS compor com ref → gpt-5.4 ✅.
- **Texto na roupa/placa**: seedream erra ("BRASLI"). gpt acerta.
- **Realismo de pessoas**: só gpt faz poses/expressões variadas; baratos clonam todos
  com a mesma cara, ou erram lógica (flux pôs TV virada pra parede).
- **gemini-3-pro (Nano Banana Pro, ~14cr)**: NÃO supera seedream/gemini-2.5 no retoque
  e é o + rígido em copyright. Não vale o custo extra como fallback.

## 🎨 Configs do Recraft (testado param a param pelo Lasy — 11 modelos)

| Família | Modelos | `style` (65) | `text_layout` | `rgb_colors` (paleta) | `background` | `strength` (i2i) | Saída |
|---|---|---|---|---|---|---|---|
| **v3** | recraft-v3 | ✅ | ✅ | ✅ | ✅ | ✅ | WEBP |
| **raster v4/v4.1** (6) | v4, v4-pro, v4.1, v4.1-pro, v4.1-utility, v4.1-utility-pro | ❌ | ❌ | ✅ | ✅ | ✅ | WEBP |
| **vector** (4) | v4-vector, v4-pro-vector, v4.1-vector, v4.1-pro-vector | ❌ | ❌ | ✅ | ✅ | ❌ | SVG |

- **`rgb_colors` (paleta) funciona em TODOS os recraft** — não é exclusivo do v3.
- **Só o v3 tem `style`** (65 estilos raster: Photorealism, Illustration, Pixel art, Clay, Pop art...) **+ `text_layout`** (posicionar texto na imagem).
- `strength` (força i2i, 0.0-1.0, default 0.2, baixo=mantém input): v3 + raster v4. Vector não.
- Formato OR: `rgb_colors` = `[{rgb:[r,g,b]}]` (objeto wrapper, máx 5) · `background_rgb_color` = `{rgb:[r,g,b]}` · `text_layout` = `[{text, bbox:[[x,y]×4]}]`.
- `style` vector NÃO existe no v3 (OR rejeita "Vector styles not supported") — vetor é o modelId `-vector`.

## Formato de chamada (resumo)

- Endpoint: `POST /api/v1/chat/completions`. Imagem em `choices[0].message.images[0].image_url.url` (data URI).
- `modalities`: `[image,text]` (gpt, gemini) · `[image]` (seedream, recraft, flux).
- i2i: `content` = array, sempre texto 1º depois as imagens (gpt, seedream, gemini — todas text-first).
- `image_config`: `{aspect_ratio, image_size}`. recraft-v3 tb: `style`, `rgb_colors`.
- Custo: `usage.cost × 100` = créditos (1cr = 1¢).
- ⚠️ Key do Lasy é PROVISIONING (só gerencia) — criar sub-key de inferência via
  `POST /api/v1/keys` (Bearer=provisioning, body `{name,limit}`) → `.key` na resposta.
