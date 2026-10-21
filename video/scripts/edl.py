# uso: python3 edl.py <silencios.txt> <saida.json> a:b [a:b ...]  — pausas >0,5s viram ~0,3s
import sys,json
sil=[tuple(map(float,l.split()[:2])) for l in open(sys.argv[1])]
keep=[tuple(map(float,k.split(':'))) for k in sys.argv[3:]]
PAD=0.15;segs=[]
for a,b in keep:
    cur=a
    for s,e in sil:
        if e<=a or s>=b: continue
        s2,e2=max(s,a),min(e,b)
        if e2-s2<0.5: continue
        if s2+PAD>cur: segs.append((cur,s2+PAD))
        cur=max(cur,e2-PAD)
    if b>cur: segs.append((cur,b))
segs=[(round(a,3),round(b,3)) for a,b in segs if b-a>0.05]
json.dump(segs,open(sys.argv[2],'w'))
t=sum(b-a for a,b in segs); print(len(segs),'trechos',f'{t//60:.0f}:{t%60:04.1f}')
