# uso: python3 mapwords.py <transcricao.json> <edl.json> <saida.json>
# leva cada palavra do tempo ORIGINAL pro tempo do vídeo cortado
import sys,json
w=json.load(open(sys.argv[1]))['words']; segs=json.load(open(sys.argv[2]))
out=[];off=0
for a,b in segs:
    for x in w:
        mid=(x['start']+x['end'])/2
        if a<=mid<b:
            out.append({'text':x['word'],'start':round(max(0,x['start']-a)+off,3),'end':round(min(b,x['end'])-a+off,3)})
    off+=b-a
json.dump(out,open(sys.argv[3],'w'),ensure_ascii=False)
print(len(out),'palavras, fim',round(off,1))
