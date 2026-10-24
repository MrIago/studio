# EDITAR vídeo gravado (talking head, tutorial, reel, entrevista)

O usuário grava falando para a câmera (ou tela + câmera) e quer o vídeo editado:
cortes de respiro e erro, legenda, zoom, câmera em miniatura sobre animação,
B-roll, motion graphics, música e efeitos. Este é o caminho **EDITAR**; *criar*
do zero (sem filmagem) é `criar-video.md`; *gerar* vídeo por IA é `orVideo`.

Estudo-base (15/10/2026): 20 vídeos de quem edita com Claude (Nate Herk, Jason
Cooperson, Christian Peverelli, MoSidd, Joseph, Matt Loui, Chase AI, Grow with
Alex…) + os repositórios `browser-use/video-use`, `heygen-com/hyperframes`,
`nateherkai/herk-edit-kit`. Notas completas:
`~/Documentos/Notas/Arquivo/Estudos/Feito/edicao-video-motion-claude-2026-10.md`.

## A verdade que todos chegaram

Claude edita tão bem quanto é instruído. Sem regra de estilo, sai "AI slop":
texto genérico no centro, efeito em todo corte, whoosh em tudo. O que separa os
bons é **(1)** transcrição palavra a palavra como base de tudo, **(2)** plano
aprovado antes de construir, **(3)** checagem em quadros do render, e **(4)** cada
nota do usuário vira regra escrita (aqui na skill) para nunca repetir o erro.

## Ferramentas (não reinvente)

| Peça | Use | Por quê |
|---|---|---|
| Transcrição palavra a palavra | `transcribeWords()` (Groq, grátis) · ElevenLabs Scribe se tiver chave | corte e sincronia exigem o tempo de cada palavra; segmento não serve |
| Corte + montagem + legenda + grade | repo **`browser-use/video-use`** (clonar e seguir o `SKILL.md` dele) | regras de produção já resolvidas (fade 30ms, legenda por último, EDL) |
| Motion graphics por cima | **HyperFrames** (`npx hyperframes`, HTML+GSAP) ou **Remotion** (engine da studio) | HyperFrames tem lint, checagem de contraste e timeline editor; Remotion é o que a studio já domina |
| Kit completo de reels/YouTube | repo **`nateherkai/herk-edit-kit`** (15 skills, playbook medido) | estilo medido em 27 reels + quality gates |
| B-roll em movimento | `orVideo` (Seedance, Kling, Veo…) a partir de still da studio | vídeo vence imagem parada |
| Conferência | `video/scripts/qa.mjs` (prancha, tiras contíguas, loudness) | você não assiste: lê quadros e mede o som |

Clonar quando precisar: `git clone --depth 1 https://github.com/browser-use/video-use`
(e `nateherkai/herk-edit-kit`). Leia o SKILL.md deles antes de usar; não copie
para dentro da studio.

## O processo

1. **Inventário.** `ffprobe` de cada arquivo (duração, fps, resolução, áudio).
   Transcreva palavra a palavra **uma vez** e guarde o JSON (nunca re-transcreva o
   mesmo arquivo). Monte a visão de leitura: frases quebradas em silêncio ≥0,5s com
   `[início-fim]` (é o que você lê para decidir cortes; 1/10 dos tokens do JSON).
2. **Converse antes de tocar no corte.** Diga o que viu e pergunte o que o
   material pede: formato (9:16 / 16:9), duração alvo, público, estilo/marca,
   momentos que devem ficar, legenda sim/não. **Proponha a estratégia em 4-8 frases
   e espere o OK.** Brief que funciona: formato + duração + referência de
   MOVIMENTO (não de estilo) + marca (cores/fontes/logo) + assets + regras +
   "planeje primeiro, me mostre stills, espere aprovação". Termine pedindo
   "me pergunte o que precisar para acertar" — com as respostas, acerta de primeira.
3. **Corte (trave antes de qualquer gráfico).** Gráfico depois do corte travado;
   mudar o corte depois desalinha tudo.
4. **Plano dos gráficos (beat table).** Para cada momento: tempo, palavra-âncora,
   tipo de cena, o que aparece, o movimento, o som. Depois uma **prancha com 1 still
   por beat** antes de renderizar o vídeo todo — economiza horas e tokens.
5. **Construa por seção**, uma aprovada antes da próxima. Animações independentes
   em **subagentes paralelos** (um arquivo por agente, prompt autossuficiente:
   objetivo, caminho de saída, spec técnica, paleta em hex, fonte, linha do tempo
   quadro a quadro, lista do que NÃO pôr, "não pergunte, decida o óbvio").
6. **Legendas** (se pedidas), **som**, **mix**.
7. **Confira o render** (seção "Checagem") — no máximo 3 passes; o que sobrar,
   diga ao usuário.
8. **Itere em cópias** ("mude só X, mantenha o resto") e **grave a lição**: ao
   receber uma nota, corrija E escreva a regra aqui (ou no preset do projeto).

## Sincronia fina: alinhamento forçado (WhisperX) no áudio FINAL

O tempo por palavra do Whisper (Groq, faster-whisper) é aproximado: no vídeo do Lucas
(24/10/2026) as palavras vinham, em média, **0,15 s adiantadas**, e palavras depois de
pausa vinham até 2 s antes (o Whisper "estica" a palavra por cima do silêncio). Legenda e
destaques ancorados nisso chegam antes da fala — o Iago notou na hora.

Depois de travar o corte, rode o alinhamento forçado no áudio FINAL e use esses tempos:

```bash
# uma vez: venv usando o torch do sistema (sem baixar outro; o pip cheio de deps lotou o disco)
python3 -m venv --system-site-packages ~/.venvs/whisperx
~/.venvs/whisperx/bin/pip install --no-cache-dir --no-deps whisperx torchaudio==<versão do torch>
~/.venvs/whisperx/bin/pip install --no-cache-dir transformers nltk pandas omegaconf
# por vídeo: transcrição aproximada → tempos exatos
ffmpeg -i master.mp4 -vn -ac 1 -ar 16000 final.wav
~/.venvs/whisperx/bin/python video/scripts/align-words.py final.wav words.json words-alinhado.json
```

Usa o wav2vec2 de português do WhisperX (GPU de 4 GB dá conta), guarda o texto que você já
tem e só troca os tempos; garante que nenhuma palavra começa antes da anterior. Como tudo
está ancorado em palavras, o vídeo inteiro se ressincroniza sozinho.

Depois de realinhar, **revise as janelas `FROM/TO` de todo cortinho** tirado do master: a
última palavra pode ter andado para depois do `TO`, e aí ela sai do recorte e a âncora
`at("…")` daquela frase quebra o bundle inteiro do Studio ("frase não achada"). `TO` = fim
da última palavra + 0,05 s, medido nos tempos novos.

## Dois modos de trabalho — pergunte ANTES de começar (Iago, 24/10/2026)

| Modo | Quando | Como |
|---|---|---|
| **Conferência manual** (padrão quando o usuário está junto) | ele quer ver logo e ajustar pelo chat | escreva tudo pelo CÓDIGO + transcrição palavra a palavra (o tempo de cada fala já está nela) e abra no Remotion Studio; NÃO gere pranchas de quadros a cada passo — ele assiste e manda os ajustes |
| **Autônomo** | ele vai sair / pediu "faz sozinho" | gere stills/pranchas, confira e corrija antes de mostrar |

> "acho que você perde muito tempo vendo quadros… foca em criar os códigos, eu confiro manualmente"

No modo manual a revisão é **no próprio vídeo**, no Studio: ele assiste e fala "no segundo X
do vídeo Y, faz tal coisa". Página de storyboard (cenas com manter/talvez/tirar) foi
testada e descartada — "melhor eu ver o vídeo e falar".

## Corte de fala

- **Corte entre frases, nunca dentro.** Frase = o que se diz num fôlego. Tire o ar
  morto entre frases; mantenha os beats naturais (depois de vírgula, de "Primeiro,").
- Filler ("é…", "tipo") só sai se tiver silêncio dos dois lados. Cortar filler no
  meio da frase corta a palavra vizinha e soa como gagueira. Menos cortes, entre
  frases, vence mais cortes.
- Silêncio ≥400ms: corte limpo. 150-400ms: usável, confira. <150ms: não corte.
- **Pad em toda borda: 30-200ms** (o tempo da transcrição desvia 50-100ms). Ex.:
  50ms antes da 1ª palavra mantida, 80ms depois da última. Mais justo = mais
  energia; mais solto = documentário. Corte só depois que a palavra decai (as
  transcrições terminam a palavra 40-80ms antes da consoante morrer).
- Fique com a **última tomada limpa** de cada fala repetida. Preserve risada e
  punchline (a reação É o beat). Troca de falante pede 400-600ms de ar.
- Reels medidos (Nate, 27 reels): fala começa em <0,1s, pausas <0,2s, 4,0-4,7
  palavras/s, 1º corte em 0,6-1,0s na primeira palavra forte. Para quem não é
  nativo de câmera, deixe um pouco mais de ar.
- Ar artificial = fatia do **ruído de sala real** do próprio áudio com fade de
  10ms, nunca silêncio digital (soa como buraco).

### Regras de produção (ffmpeg — quebram calado se violadas)

1. Legenda queimada **por último**, depois de todos os overlays.
2. Extraia cada segmento e concatene com `-c copy` (não um filtergraph único, que
   re-encoda duas vezes). *Exceção*: em fala com lip-sync crítico, selecione os
   quadros exatos numa passada só (concat por segmento pode atrasar ~1 quadro em
   metade das junções).
3. **Fade de 30ms no áudio em toda borda de segmento** (senão estala).
4. Overlay com `setpts=PTS-STARTPTS+T/TB` para o quadro 0 cair no início da janela.
5. SRT no tempo de **saída**: `saída = palavra.início − seg.início + seg.offset`.
6. Nunca corte dentro de uma palavra; alinhe à fronteira da transcrição.

## Layouts (9:16)

- **Split**: B-roll/gráfico em cima (y 0-880), rosto embaixo. **Full**: B-roll
  ocupa tudo. **Punch-in**: rosto apertado para virada, ênfase e CTA.
  Medido: split 30-42%, full 50-55%, punch-in 5-15%; rosto na tela ~45% do tempo e
  nunca ausente por mais de ~3,5s. Primeiro quadro: split com o tema em cima.
- **Câmera em miniatura (PiP)** sobre a animação: cantos arredondados + sombra,
  fora do caminho do conteúdo; a transição para o PiP é UM gesto (recortar e
  deslizar juntos, `power2.inOut`), nunca dois movimentos seguidos.
- **Zoom / punch-in**: zoom lento (Ken Burns) para atenção; zoom seco para ênfase
  e reação. Escale um wrapper, nunca o elemento de vídeo. Corte de rosto sempre do
  arquivo em resolução nativa, não do proxy.
- **Seguir o rosto**: detecte o rosto por amostragem de quadros (ex.: a cada
  0,5s), suavize a trajetória e recorte 9:16 em volta; nunca trema.
- **Zona segura 1080×1920**: texto em x 90-930, y 200-1600 (a UI do Reels/TikTok
  cobre bordas e base). Nada a menos de 60px da borda.

## Legendas

- 1-3 palavras por bloco, quebrando em frase/pausa; aparecem **2 quadros antes**
  da palavra; troca seca (sem pop a cada bloco).
- Uma aparência só no vídeo todo: caixa escura com borda clara fina (lê sobre
  preto, branco e vídeo). **Nunca branco sobre claro** — meça o contraste.
- Destaque de cor em 25-45% dos blocos, bloco inteiro, cor com significado
  (vermelho = erro/perda; teal = conceito; verde = ação/resultado). Fonte forte em
  caixa alta (~62-64px em 1080 de largura); uma serifada pesada em 5-20% dos blocos
  para palavras "macias", nunca duas seguidas.
- **Nunca sobre boca ou queixo**, principalmente no 1º segundo (é quando o
  espectador decide se a pessoa é real). Bloco que atravessa um corte muda de lugar
  no quadro do corte. Em tela com texto para ler, a legenda vai para uma zona livre
  (não some).

## B-roll

Vídeo vence imagem, sempre. Ordem de preferência:
1. Filmagem real da coisa citada (demo do produto, a palestra, o próprio vídeo).
2. Gravação de tela real, com zoom na parte falada e cursor visível.
3. UI animada recriada (digitando, linhas entrando, contador subindo) — marcada como exemplo.
4. Vídeo de IA com **metáfora concreta** ("queimar dinheiro" = nota queimando).
   Genérico "pessoa no computador" parece banco de imagem.
5. Recorte de página real <1s, com destaque na palavra falada.

Nunca invente número, resultado ou depoimento para enfeitar. Logo de marca:
use o arquivo oficial (site/media kit), nunca desenhe de memória. Página inteira
encolhida no celular é ilegível: recorte a frase e destaque. UI pequena flutuando
no vazio é o tell mais rápido de "edição de IA" — dê zoom até preencher. Cada cena
de B-roll uma vez só por vídeo.

## Som

- **Poucos efeitos, cada um preso a algo visível** (~8 em 18s soa desenhado; ~20
  soa genérico). Paleta que funciona: ar macio em movimento espacial real, tap
  amortecido quando logo pousa, click seco em UI, papel em documento, um tom quente
  em check. **Proibido**: laser, zap, plop com queda de pitch, whoosh em todo corte.
- **Bata no quadro**: meça o ataque do arquivo (silêncio antes do transiente) e
  comece o som esse tanto antes do contato visual. Varie os arquivos em listas.
- **Música**: escolha por clima (beat escuro e confiante para notícia; lo-fi para
  método). Cama 11-20 dB abaixo da voz, com ducking sob a fala; saia antes do CTA,
  não deixe o rabo da música por baixo. Ofereça 2 camas contrastantes: gosto
  musical é do usuário.
- **Master** uma vez, no mix final: −14 a −16 LUFS integrado, true peak ≤ −1 dBTP
  (loudnorm em 2 passes). **Meça o arquivo final**, em estéreo (mono lê 3 dB menos).
  Nunca faça fade na última palavra.

## Checagem (antes de mostrar)

`node video/scripts/qa.mjs …` e **Read** nos PNGs:
- `sheet` — visão geral (composição, cores, nada vazio).
- `strip <t>` em **toda** transição, corte e movimento de câmera: pulo seguido de
  quadros iguais = ease que para no meio; movimento que para e outro que começa =
  dois gestos que deviam ser um; um quadro diferente dos vizinhos = pisca.
- `at` nos 2,5s iniciais quadro a quadro (nada na boca) e no hero de cada beat.
- `loud` — números, não opinião ("não consigo ouvir; integrado −15,2 LUFS, pico −1,4").
- Lip-sync: compare quadros do corte com o bruto. Re-transcreva o áudio final e
  compare com o esperado nas junções (palavra cortada aparece aí).
- Peça publicável: um subagente **crítico** com o render e as referências, com
  ordem de "esculachar, não elogiar": veredito, problemas com timecode, 5 correções.

## Vídeo longo (10+ min) sem travar o computador

Aprendido em 21/10/2026, editando aulas de 13 min do Lucas: o PC do Iago travou e
desligou duas vezes. A causa e o jeito certo:

- **Nunca um filtergraph com dezenas de `trim`.** Cada ramo `[0:v]trim=…` decodifica
  o vídeo INTEIRO; 76 trechos = 76 leituras simultâneas de 1080p → memória estoura.
  Funciona com 6 trechos, mata a máquina com 70. Use `video/scripts/cut-edl.sh`:
  corta trecho por trecho (`-ss` antes do `-i`, `-t`, fade de 30 ms), 2 threads,
  `nice 15`, e só no fim concatena e trata a voz numa passada.
- **Pausas → EDL:** `silencedetect` (com `LC_ALL=C`, senão o awk do sistema pt-BR
  arredonda pela vírgula) → `video/scripts/edl.py silencios.txt edl.json a:b …`
  (trechos a manter; pausa >0,5 s vira ~0,3 s). Os erros/tomadas ruins saem
  escolhendo os `a:b` a manter, lendo a transcrição.
- **Não transcreva de novo depois do corte:** `video/scripts/mapwords.py` leva as
  palavras do tempo original pro tempo do corte pela EDL. Zero chamada de API.
- **Pasta de trabalho fora do `/tmp`.** O scratchpad da sessão vive em `/tmp` e
  some quando o PC reinicia (perdi transcrição e EDL assim). Trabalho de edição
  vai em `~/.studio-engine/work/<projeto>/`; os assets do render em `public/<id>/`.
- **Render Remotion de vídeo longo com `OffthreadVideo`** (pior quando o mesmo
  arquivo aparece 2× no quadro, ex. tela + câmera recortadas do mesmo master):
  `--concurrency=2 --offthreadvideo-cache-size-in-bytes=536870912`, `nice 15`, e um
  vigia que mata o render se `MemAvailable` < 1,5 GB. Com concurrency 3 sem limite
  de cache a memória livre caiu de 9 GB pra 2,7 GB em 1 min.
- **Uma coisa pesada por vez.** Nada de cortar um vídeo enquanto renderiza outro,
  nem typecheck/build de projeto junto com render.
- Acompanhe ao vivo (`Monitor`): progresso a cada N quadros + memória disponível.

## Aula gravada (tela + câmera) — molde pronto

`~/.studio-engine/src/videos/aula-kit/kit.tsx` (`AulaVideo`): a tela do app ocupa
o quadro com zoom suave na caixa que a pessoa explica; a câmera recortada do
mesmo master vira miniatura que cresce na abertura/fecho; capítulo no canto a cada
assunto; motions de conta (`formula`), número (`stat`) e frase de efeito
(`quote`, esconde a legenda enquanto aparece); legenda com correção de grafia.
Tudo ancorado em FRASES (`at('a segunda métrica')`), nunca em segundos chutados.
Uma aula nova = um `Video.tsx` de ~80 linhas (ex.: `aula-financeiro/`). Zooms:
caixas medidas numa prancha de quadros a cada 30 s do master (`crop` da tela).
Se a gravação tem a câmera invadindo o canto da tela, o kit tampa esse retângulo.

## Vídeo que mostra um app: regras de cena (série do Lucas, 24/10/2026)

Aprovadas pelo Iago depois de 3 versões. Molde: `~/.studio-engine/src/videos/oficina-kit/`
(`Phone`, `Camera`, `Face`, `ReelShell`) e as composições `msp-*`.

- **Zoom: o `<Camera>` do kit oficina foi REPROVADO** (Iago, 24/10/2026: "ficou muita coisa
  errada"). Zoom dentro do mock também foi reprovado. O jeito aprovado é o do quadro da
  AdzHub (`~/.studio-engine/src/videos/adzhub-*`, `quadro-desenhado.md`): estude esse código
  antes de fazer qualquer zoom. Na dúvida, sem zoom: contorno + escurecer o resto.
- **Mostre a coisa exata que a fala cita.** "Marcar como recebido" pede o BOTÃO na tela onde
  ele existe (Pedidos), não o card de resumo de outra tela. Antes de ancorar um foco, leia
  a frase e pergunte: o que aparece nessa tela é o que ele está dizendo?
- **Documento do app = o documento REAL.** Contrato, PDF, orçamento: gere com o gerador do
  próprio app (importar o módulo com Bun e trocar só o que depende de navegador, como
  carregar a logo) usando os dados da conta teste, rasterize (`pdftoppm -r 200`) e mostre as
  páginas. Folha redesenhada em código parece maquete. Bônus: gerar o real achou um bug de
  verdade no app (duas "Cláusula 1ª").
- **Telas reais numa conta teste** com dados parecidos com os do cliente; capturar em @3 e
  medir as caixas (`shots.json`) para foco/dedo/digitação.
- **Rosto**: grande quando não há nada para mostrar; pequeno no canto inferior direito
  enquanto o celular/papel está na tela (o canto fica livre); some só quando algo cobre o
  canto (o quadro de giz).
- **Estilo do mundo, não de componente**: material do nicho feito em código (madeira, aço
  escovado, fita crepe, carimbo, faísca, giz) — nada de imagem gerada.
- **Cortinho nasce de trecho da aula**: escolha frases de 25-40 s que se sustentam sozinhas,
  gancho na fita do topo, mesmo kit. Uma aula de 12 min rendeu 10 cortinhos.

## Pegadinhas de montagem (24/10/2026)

- **Uma âncora que falha derruba o Studio inteiro** ("frase não achada" quebra o bundle
  de TODAS as composições). Antes de abrir, rode um checador em Node que reproduz o
  `anchors()` sobre cada `at("…")` do arquivo novo e lista FALTA/tempo.
- **Camadas**: rosto e legenda ficam FORA da `<Camera>`; chapas/fitas das cenas de rosto
  ficam DEPOIS do rosto (senão o card do CTA some atrás dele). Ordem: fundo+cena (câmera)
  → rosto → enfeites das cenas de rosto → legenda → card final.
- **Studio às vezes não pega a mudança** (bug "ainda está igual"): antes de caçar bug, gere
  um still do frame (`remotion still … --frame=N`) e peça F5 no Studio.
- **Render em fila, um por vez, solto do terminal** (`setsid nohup`), concurrency 2 e vigia
  de memória; o acompanhamento só lê o log.

## Erros que custaram tempo a quem já fez

- Cortar a tela de alguém falando e narrar com voz de IA por cima: parece que a
  pessoa fala com voz de robô. Nunca.
- Modelo de vídeo IA troca de câmera em ~2,5-3s: use só os segundos contínuos.
- Gravar navegador com screencast sai pequeno (pixel CSS): capture quadro a quadro.
- Baixe o vídeo inteiro e corte local; buscar trecho por HTTP leva minutos.
- Clip bruto sem gancho e sem CTA limita o resultado: roteirize o gancho antes de gravar.
