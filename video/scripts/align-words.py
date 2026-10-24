# Alinhamento forçado (WhisperX) das palavras de uma transcrição contra o áudio FINAL.
# uso: ~/.venvs/whisperx/bin/python align-words.py <audio> <words.json> <saida.json>
# Entrada: [{text,start,end}] com tempos aproximados (Whisper/Groq). Agrupa em frases,
# roda o wav2vec2 de português e devolve os tempos exatos de cada palavra. Palavra que o
# alinhador não acha (número, sigla) fica com o tempo antigo.
import json, sys, whisperx

audio_path, words_path, out_path = sys.argv[1:4]
words = json.load(open(words_path))
device = "cuda"
audio = whisperx.load_audio(audio_path)

# frases: quebra em pontuação final ou pausa > 0,6 s (no máx. ~25 palavras)
segs, cur = [], []
for i, w in enumerate(words):
    cur.append(i)
    nx = words[i + 1] if i + 1 < len(words) else None
    if w["text"].endswith((".", "?", "!")) or nx is None or nx["start"] - w["end"] > 0.6 or len(cur) >= 25:
        segs.append(cur); cur = []
segments = [{"start": max(0, words[s[0]]["start"] - 0.25), "end": words[s[-1]]["end"] + 0.25, "text": " ".join(words[i]["text"] for i in s)} for s in segs]

model, meta = whisperx.load_align_model(language_code="pt", device=device)
res = whisperx.align(segments, model, meta, audio, device, return_char_alignments=False)

out, k, moved, kept = [], 0, 0, 0
for seg_idx, s in enumerate(segs):
    aligned = res["segments"][seg_idx]["words"] if seg_idx < len(res["segments"]) else []
    for j, wi in enumerate(s):
        w = dict(words[wi])
        a = aligned[j] if j < len(aligned) else None
        if a and "start" in a and "end" in a:
            moved += abs(a["start"] - w["start"]) > 0.08
            w["start"], w["end"] = round(a["start"], 3), round(a["end"], 3)
        else:
            kept += 1
        out.append(w)
for p, c in zip(out, out[1:]):  # nunca começa antes da anterior
    if c["start"] < p["start"]: c["start"] = round(p["start"] + 0.01, 3)
    if c["end"] < c["start"]: c["end"] = round(c["start"] + 0.05, 3)
json.dump(out, open(out_path, "w"), ensure_ascii=False)
print(f"{len(out)} palavras · {moved} mudaram > 80 ms · {kept} ficaram com o tempo antigo")
