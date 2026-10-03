"""Per-country share cards (1200x630) for /brief/ISO3/ pages. Run after node build.js; writes brand/og/ISO3.png (committed, copied by build)."""
import json
from PIL import Image, ImageDraw, ImageFont
F=json.load(open('out/facts.json'))
BAND={'Poor':'#AADDD4','Weak':'#80C7BB','Mixed':'#50AEA0','Strong':'#0D9488','Leading':'#0F766E'}
def font(sz,bold=False):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'
    return ImageFont.truetype(p,sz)
N=F['N']
for d in F['ranked']:
    im=Image.new('RGB',(1200,630),'white');g=ImageDraw.Draw(im)
    g.text((64,64),f"HEALTH RECORD RIGHTS INDEX · {N} COUNTRIES",fill='#0F766E',font=font(20,True))
    name=d['name'];sz=72
    while sz>36 and g.textlength(name,font=font(sz,True))>540: sz-=4
    g.text((60,110),name,fill='#111827',font=font(sz,True))
    g.text((64,230),str(d['overall']),fill='#111827',font=font(120,True))
    g.text((64+70*len(str(d['overall']))+20,300),"/100",fill='#6B7280',font=font(34))
    g.rectangle((64,390,96,410),fill=BAND[d['band']]);t=f"{d['band']} · rank {d['rank']} of {N} · keys: {d['model']}";sz=28
    while sz>20 and g.textlength(t,font=font(sz))>500: sz-=1   # stays clear of the bars at x=640
    g.text((108,384+(28-sz)//2),t,fill='#374151',font=font(sz))
    # eight bars
    cats=[('Access','access'),('Control','control'),('Privacy','privacy'),('Journey','journey'),('Commercial','commercial'),('Clinical','clinical'),('Research','research'),('AI','ai')]
    x0,y0=640,110
    for i,(lab,k) in enumerate(cats):
        y=y0+i*52;v=d['cats'][k]
        g.text((x0,y),lab,fill='#374151',font=font(22));g.rectangle((x0+150,y+8,x0+150+300,y+20),fill='#F3F4F6')
        g.rectangle((x0+150,y+8,x0+150+3*v,y+20),fill='#0F766E');g.text((x0+460,y),str(v),fill='#111827',font=font(22,True))
    g.text((64,520),"SuperTruth",fill='#0F766E',font=font(28,True));g.text((64,560),f"healthrecordrights.com/brief/{d['iso3']}/",fill='#6B7280',font=font(22))
    im.save(f"brand/og/{d['iso3']}.png",optimize=True)
print(len(F['ranked']),'cards')
