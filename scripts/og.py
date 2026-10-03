"""Writes out/og.html from out/facts.json; globe from scripts/og_globe.js (run it first); render to brand/og.png with headless Chrome (see README)."""
import json
F=json.load(open('out/facts.json'))
band={'Poor':'#AADDD4','Weak':'#80C7BB','Mixed':'#50AEA0','Strong':'#0D9488','Leading':'#0F766E'}
n=F['N'];step=min(9,380/n)
rows=''.join(f'<circle cx="{40+d["overall"]*5.2:.0f}" cy="{12+i*step:.1f}" r="{3.5 if n>50 else 4}" fill="{band[d["band"]] if d["confidence"]!="low" else "#fff"}" stroke="#111827" stroke-width="{1 if d["confidence"]!="low" else 1.5}"/>' for i,d in enumerate(F['ranked']))
ticks=''.join(f'<line x1="{40+v*5.2}" x2="{40+v*5.2}" y1="0" y2="400" stroke="#E5E7EB"/><text x="{40+v*5.2}" y="412" font-size="12" text-anchor="middle" fill="#6B7280" font-family="JetBrains Mono">{v}</text>' for v in (0,25,45,65,85,100))
html=f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(assets/fonts/inter-latin.woff2)}}@font-face{{font-family:"JetBrains Mono";src:url(assets/fonts/jetbrains-mono-latin.woff2)}}
body{{margin:0;width:1200px;height:630px;font-family:Inter;background:#fff;color:#111827;display:grid;grid-template-columns:560px 1fr;overflow:hidden}}
.l{{padding:56px 0 0 64px}} .o{{font-size:16px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#0F766E}}
h1{{font-size:64px;line-height:1.05;margin:16px 0 0;letter-spacing:-.02em}} p{{font-size:26px;line-height:1.35;font-weight:600;margin:28px 0 0}}
.f{{position:absolute;left:64px;bottom:48px;display:flex;align-items:center;gap:16px;font-size:18px;color:#6B7280}} .f img{{height:30px}}
.r{{padding:15px 0 0 20px}}</style></head><body>
<div class="l"><div class="o">Health record rights · {n} countries</div><h1>Health Record Rights Index</h1><p>In 2026, none of the {n} countries we rated puts a person fully in charge of their own health record.</p></div>
<div class="r">{open("out/og_globe.svg").read()}</div>
<div class="f"><img src="assets/supertruth-logo-dark.svg"><span>healthrecordrights.com</span></div></body></html>'''
open('out/og.html','w').write(html)
