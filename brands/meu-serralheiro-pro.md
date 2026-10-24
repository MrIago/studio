# Brand sheet — Meu Serralheiro Pro (vídeos)

Aprovada pelo Iago em 24/10/2026 depois de 3 versões das aulas e cortinhos do Lucas.
Código: `~/.studio-engine/src/videos/oficina-kit/kit.tsx` (todas as peças) e as
composições `msp-*` (2 aulas 16:9 + cortinhos 9:16). Comece um vídeo novo copiando um
`msp-*` parecido; não redesenhe peça que já existe.

## Quem fala e para quem

- **Lucas Santos**, serralheiro há 16 anos, dono do app. Só entra o ROSTO e a VOZ dele
  (master cortado); tela, quadro e animação são nossos.
- Público: serralheiro 25-55 anos, faz orçamento no caderno, assiste no celular.
  Linguagem de oficina, sem jargão de SaaS.

## Mundo visual: OFICINA (tudo em código, nenhuma imagem gerada)

| Peça | O que é | Uso |
|---|---|---|
| `Bench` | bancada de tábuas de madeira com veio | fundo de toda cena |
| `Plate` / `PlateText` | chapa de aço escovado com rebites; `dark` = aço escuro, `glow` = destaque | números, rótulos, CTA ("7 DIAS") |
| `Tape` | fita crepe escrita a pincel | gancho no topo, legendas de contexto |
| `Stamp` | carimbo que bate inclinado | o veredito da frase ("não é isso", "sem achismo") |
| `Sparks` / `SparkFlash` | faísca de solda | quando um número/ideia "acende"; flash na troca de cena |
| `Phone` | celular de aço com as telas REAIS do app (conta teste) | demonstração; foco = contorno laranja + escurece o resto; dedo toca |
| `Camera` | zoom do QUADRO INTEIRO no ponto que a fala aponta | nunca ampliar a tela dentro do mock |
| `Board` + `Chalk*` | chapa preta riscada a giz (rough.js, fonte Virgil) | contas e conceitos (DRE, conversão) |
| `Face` | rosto do Lucas em moldura parafusada, punch-in nos cortes | ver "Rosto" abaixo |
| papel | as páginas REAIS do PDF gerado pelo app | contrato/orçamento — nunca folha redesenhada |

## Cores (`K` no kit)

| Token | Hex | Uso |
|---|---|---|
| `orange` | `#E8691E` | laranja-forja da marca: contorno do foco, carimbo, faixa |
| `orange2` | `#F08A3E` | número em destaque em chapa escura, palavra-chave na legenda |
| `spark` | `#FFD27A` | faísca |
| `wood` | `#3A2416` | fundo |
| `steel` / `steelDk` | `#C9CCD1` / `#5E636B` | chapas, celular |
| `tape` | `#E7D8AE` | fita crepe |
| `chalk` / `chalkY` / `chalkO` | `#F1EEE6` / `#F7D774` / `#F5A35C` | giz branco / amarelo / laranja |

Sem verde de "sucesso" (exceção: carimbo "assinado"), sem gradiente colorido, sem vidro.

## Tipografia

- **Archivo 900** caixa alta: legenda e texto de chapa.
- **Saira Stencil**: números grandes nas chapas (estêncil = chapa cortada).
- **Permanent Marker**: fita crepe, assinatura à mão.
- **IBM Plex Mono**: valores/linhas técnicas.
- **Virgil**: giz no quadro.

## Legenda

Caixa alta, Archivo 900, branco com contorno grosso escuro (`stroke` ~16% do tamanho),
**no máximo 3 palavras por vez**, centralizada. Palavras-chave do trecho em `orange2`
(lista `emph` por vídeo). Corrige grafia do Whisper (`FIXES`: cerraleiro → serralheiro,
vigaú → viga U...). Tempos: WhisperX no áudio final.

- Aula 16:9: embaixo (y≈985), tamanho 50.
- Cortinho 9:16: no meio (y≈720) quando é o rosto; embaixo (y≈1690) quando o celular toma a tela.

## Rosto

- **Grande** quando não há nada para mostrar.
- **Pequeno no canto inferior direito** enquanto celular/papel ocupa a tela.
- **Some** só quando algo cobre o canto (quadro de giz na aula; celular grande no cortinho).
- Fica FORA da `Camera` (não entra no zoom). Chapas e fitas das cenas de rosto ficam POR
  CIMA dele.

## Ritmo e cena

- Cada cena segue a frase: âncoras `at("frase")` na transcrição, nunca segundo chutado.
- Mostre exatamente o que a fala cita (o botão, não o card de outra tela).
- Troca de cena: whoosh + flash de faísca. Toque: clique. Carimbo: switch. Número: ding.
- Música baixa (≈0,035-0,04), sobe no card final.
- Cortinho: 25-40 s tirados da aula, gancho na fita do topo nos primeiros segundos,
  `EndCard` vertical no fim. `ReelShell` monta rosto/legenda/áudio/música sozinho.

## Telas do app

Conta teste `video.teste@meuserralheiropro.test` (ver `.claude/rules/project/credenciais.md`
do repo): serralheria "Metalúrgica Santos", Premium, dados no perfil da do Lucas.
Capturas mobile 390 @3, tema escuro, em `~/.studio-engine/public/msp/shots/` com as caixas
medidas em `shots.json` (script `~/.studio-engine/work/msp/capture/cap.mjs`).

## Não fazer

- Zoom dentro do celular · folha/tela redesenhada imitando o app · imagem gerada por IA
  para textura · voz de IA no lugar do Lucas · legenda deslocada ou com mais de 3 palavras ·
  storyboard para revisão (o Iago revisa assistindo no Studio).
