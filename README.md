# 🎨 studio — estúdio de mídia por IA no Claude Code

Gera e edita **imagens**, **voz** (com emoção e personagens), **música**, e **cria
vídeos** programáticos com Remotion — tudo por linguagem natural, dentro do Claude Code.
Cada modelo é uma caixa selada, com um guia "qual usar" testado na prática.

## Instalar

```
/plugin marketplace add MrIago/studio
/plugin install studio
/reload-plugins
```

## Configurar (1ª vez)

Você só precisa de **1 chave** pra começar (OpenRouter). Peça pro Claude:

> "configura a skill studio, minha key OpenRouter é sk-or-..."

Ou direto no terminal:

```bash
# obrigatória (imagem, música):
node ~/.claude/plugins/cache/studio/studio/*/scripts/setup.mjs OPENROUTER_KEY=sk-or-...

# ver o status / o que mais dá pra ativar:
node ~/.claude/plugins/cache/studio/studio/*/scripts/setup.mjs
```

Chaves opcionais (habilitam mais): **`GEMINI_API_KEY`** (voz/narração + diálogo
multi-personagem) e **`GROQ_API_KEY`** (transcrição p/ vídeo, grátis). Ficam em
`~/.config/studio/.env` (privado, nunca commitado).

## Usar

É só pedir em linguagem natural — o Claude escolhe o modelo certo:

- *"gera um ícone de foguete transparente"*
- *"faz um carrossel sobre a história do Vasco no estilo brutalista"*
- *"compõe o Rayan erguendo a taça"* (manda as fotos de referência)
- *"narra esse texto com a voz animada"* / *"conta uma história com 2 personagens"*
- *"cria uma música lofi tema praia"*
- *"faz um vídeo de intro pra esse produto"*

Tudo é salvo em **`~/studio/<projeto>/`** (organizado por projeto). Vídeos: a engine
Remotion fica em `~/.studio-engine/` (técnica) e o MP4 final vai pro projeto.

## O que tem dentro

- **Imagem**: gpt-5.4 (qualidade) · seedream (barato) · recraft (estilos/SVG/paleta) ·
  grok (rápido) · gemini · ícones transparentes · composição com fotos reais
- **Voz**: gemini-tts — 30 vozes, tags de emoção inline (`[excited]`/`[whispers]`),
  diálogo multi-personagem
- **Música**: lyria-3 (clip ou trilha completa)
- **Vídeo**: Remotion sob medida, blocos de motion design reutilizáveis, 3D, preview ao vivo
- **Transcrição**: Groq (timestamps, sem GPU)

Licença MIT.
