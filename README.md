# studio

An AI media studio inside Claude Code: images, voice, music, and code-built video from natural language.

## What it does

You ask in plain language; studio picks the model, writes the prompt, generates, and saves to `~/studio/<project>/`:

- **Images**: generation and editing across seven models (gpt-5.4-image-2, Seedream 4.5, Recraft v3 and v4.1 vector, Grok Imagine, Gemini 2.5 Flash, gpt-5-image-mini), routed per case by quality, cost, and speed. Transparent icons, brand palettes, 65 art styles, image-to-SVG vectorization.
- **Faithful scenes with real people**: supply reference photos and gpt-5.4 composes a new image that keeps the likeness.
- **Voice**: Gemini TTS with 30 voices, inline emotion tags mid-sentence (`[excited]`, `[whispers]`), and multi-speaker dialogue for stories.
- **Music**: Lyria 3, from a 31-second loop to a 2.6-minute track.
- **Animated logos**: SVG reveals via Lottie (stroke) or GSAP (filled), exported for web or rendered to MP4.
- **Video**: prompt-to-video via Veo 3.1 or Grok Imagine, and custom-coded video via Remotion, where the generated images, narration, and music get assembled into an MP4.

## How it works

- Sealed-box wrappers. Each model is one `.mjs` file in `scripts/models/` exposing that model's full option surface; the shared plumbing (`lib/or.mjs`) knows nothing about any model and handles the OpenRouter call, byte extraction, and cost accounting. Adding a model means adding one file.
- A decision table, exported as code (`QUAL_USAR` in `index.mjs`) and mirrored in the docs, encodes tested routing: gpt-5.4-image-2 when detail, text, or faces matter (about 150 s per image), Seedream/Recraft/Grok when 3 to 9 seconds and a lower price win.
- Two distinct video paths. *Generating*: async submit, poll, download against video models, with first/last-frame control. *Creating*: Remotion, where Claude writes the React component for each video from scratch. One permanent workspace at `~/.studio-engine/` serves every video with a single `npm install` and survives plugin updates; each video gets an isolated folder and its MP4 lands back in `~/studio/<project>/`.
- A character-fidelity recipe learned from model behavior: gpt-5.4 refuses to generate a known character or celebrity from scratch, and it accepts composing from reference photos you supply. More angles of the same subject raise consistency. Batch jobs collect every reference first, then fire all images through one `Promise.all` round, so N images take about the time of the slowest one.
- `bg-remove` ships its own PNG codec on node's zlib (zero dependencies) and strips solid backgrounds by flood fill from the image edges, so enclosed regions of the same color survive: the black wheels inside a white logo stay black.
- SVG animation splits on a tested finding: Lottie trim paths draw strokes well and fail on filled shapes, so filled logo reveals use GSAP clip-path wipes, with a frame-driven shim when the animation renders inside Remotion.

## Usage

### Install

```
/plugin marketplace add MrIago/studio
/plugin install studio
/reload-plugins
```

### Configure (first run)

One key gets you started (OpenRouter). Ask Claude:

> "set up the studio skill, my OpenRouter key is sk-or-..."

Or from the terminal:

```bash
# required (images, music):
node ~/.claude/plugins/cache/studio/studio/*/scripts/setup.mjs OPENROUTER_KEY=sk-or-...

# check status / see what else can be enabled:
node ~/.claude/plugins/cache/studio/studio/*/scripts/setup.mjs
```

Optional keys unlock more: **`GEMINI_API_KEY`** (voice, narration, multi-speaker dialogue) and **`GROQ_API_KEY`** (transcription for video sync, free tier). Keys live in `~/.config/studio/.env`, private and never committed.

### Use

Ask in natural language and Claude routes to the right model:

- *"generate a transparent rocket icon"*
- *"make a carousel about the history of Vasco, brutalist style"*
- *"compose Rayan lifting the trophy"* (send the reference photos)
- *"narrate this text with an excited voice"* / *"tell a story with two characters"*
- *"create a lofi track, beach mood"*
- *"make an intro video for this product"*

Everything lands in `~/studio/<project>/`, organized by project. The Remotion engine stays hidden in `~/.studio-engine/` and copies each final MP4 into the project folder.

## Scope and honest limits

- Bring your own keys and budget. `OPENROUTER_KEY` is required; a gpt-5.4 image costs around 4 cents, and Veo 3.1 runs about $0.40 per second of video. Every response carries its cost, and the skill reports it.
- The highest-quality image model is also the slowest (about 150 s). The speed ranking in `references/velocidade.md` exists because that trade-off bites; cheap models answer in 3 to 9 seconds when the case allows.
- `bg-remove` needs a near-uniform background that touches the image edges. Photos, gradients, and textured backgrounds belong to the AI editors.
- Video generation blocks for minutes while the model renders. Remotion rendering needs node plus a one-time engine setup.
- SKILL.md and the references are written in Portuguese, the author's working language. The scripts, options, and CLI are language-neutral, and Claude operates the skill in any language.

MIT © mriago
