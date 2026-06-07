# Recraft V3 — estilos completos + paleta (referência)

`recraft-v3` é o modelo rápido (~6.5s) + barato (~4cr) com **controle de estilo**
e **paleta forçada**. Útil quando o usuário quer um estilo artístico específico
ou cores da marca. (Fonte: recraft.ai/docs/api-reference/styles)

## Como chamar

```json
{
  "model": "recraft/recraft-v3",
  "messages": [{"role": "user", "content": "<prompt>"}],
  "modalities": ["image"],
  "image_config": {
    "aspect_ratio": "1:1",
    "style": "Pixel art",                          // nome EXATO (Capitalizado c/ espaço)
    "rgb_colors": [{"rgb": [255, 0, 0]}, {"rgb": [10, 15, 40]}],  // paleta, máx 5
    "background_rgb_color": {"rgb": [255, 255, 255]},             // cor de fundo
    "strength": 0.2                                // i2i (0=mantém input, 1=livre), default 0.2
  }
}
```

⚠️ Nome do style é **Capitalizado com espaço** (`Pixel art`, `Clay`, `Black & white`) —
NÃO snake_case. Style errado → "Provider returned error".
⚠️ Style de RASTER (Photorealism/Illustration) gera WEBP. Style de VECTOR/ICON
no v3 → a OR REJEITA ("Vector styles not supported"). Pra SVG use o modelId
`-vector` (sem param style).

## Capacidades de paleta (todos os recraft têm `rgb_colors`)

| | `style` | `rgb_colors` (paleta) | `background_rgb_color` | `text_layout` | `strength` (i2i) |
|---|---|---|---|---|---|
| recraft-v3 | ✅ (raster) | ✅ máx 5 | ✅ | ✅ | ✅ |
| recraft-v4/v4.1 raster | ❌ | ✅ | ✅ | ❌ | ✅ |
| recraft vector (-vector) | ❌ | ✅ | ✅ | ❌ | ❌ |

`rgb_colors` = array de `{rgb:[r,g,b]}` (0-255), máx 5 cores → força a paleta.
`text_layout` = `[{text:"...", bbox:[[x,y],[x,y],[x,y],[x,y]]}]` → posiciona texto (só v3).

## Lista completa de estilos (V3)

### 📷 Photorealism (raster, WEBP)
`Photorealism` · `Enterprise` · `Natural light` · `Studio photo` · `HDR` ·
`Hard flash` · `Motion blur` · `Black & white` · `Evening light` ·
`Faded Nostalgia` · `Forest life` · `Mystic Naturalism` · `Natural Tones` ·
`Organic Calm` · `Real-Life Glow` · `Retro Realism` · `Retro Snapshot` ·
`Urban Drama` · `Village Realism` · `Warm Folk` · `Product photo` · `Recraft V3 Raw`

### 🎨 Illustration (raster, WEBP)
`Illustration` · `Hand-drawn` · `Grain` · `Bold Sketch` · `Pencil sketch` ·
`Retro Pop` · `Clay` · `Risograph` · `Color engraving` · `Pixel art` ·
`Antiquarian` · `Bold fantasy` · `Child book` · `Cover` · `Crosshatch` ·
`Digital engraving` · `Expressionism` · `Freehand details` · `Grain 2.0` ·
`Graphic intensity` · `Hard Comics` · `Long shadow` · `Modern Folk` ·
`Multicolor` · `Neon Calm` · `Noir` · `Nostalgic pastel` · `Outline details` ·
`Pastel gradient` · `Pastel sketch` · `Pop art` · `Pop renaissance` ·
`Street art` · `Tablet sketch` · `Urban Glow` · `Urban sketching` ·
`Young adult book` · `Young adult book 2` · `Seamless Digital`

### ✏️ Vector (SVG — usar via modelId `-vector`, sem param style)
`Vector art` · `Line art` · `Linocut` · `Color blobs` · `Engraving` ·
`Bold stroke` · `Chemistry` · `Colored stencil` · `Cosmics` · `Cutout` ·
`Depressive` · `Editorial` · `Emotional flat` · `Marker outline` · `Mosaic` ·
`Naivector` · `Roundish flat` · `Segmented Colors` · `Sharp contrast` ·
`Thin` · `Vector Photo` · `Vivid shapes` · `Seamless Vector`

### 🔲 Icon (SVG)
`Icon` · `Outline` · `Pictogram` · `Colored outline` · `Doodle` ·
`Colored shape` · `Gradient outline` · `Offset doodle` · `Gradient shape` ·
`Broken line` · `Offset fill`

## Decisão de produto (mriago)

A lista de estilos NÃO entra no guia "qual usar" — fica como **seletor na UI da Lasy**
(o user escolhe o estilo específico que quer). O guia só aponta "quer estilo
artístico ou paleta forçada rápido/barato? → recraft-v3".
