#!/opt/homebrew/bin/python3.12
"""Colour check for the paper's figures (stand-in for the house dataviz validator, which is not installed on this machine).
For every pair of colours that must be told apart, prints the CIELAB lightness step (what survives a grey photocopy) and
CIEDE2000 under normal vision and under Machado, Oliveira and Fernandes (2009) simulations, severity 1.0, of protanopia,
deuteranopia and tritanopia. Exit code 1 if a pair falls under its floor. Floors: ordered ramps need an L* step of at least
8 between neighbours (so order survives greyscale); labelled pairs need dE2000 of at least 10 under every vision type; background zones that are also
labelled directly need an L* step of at least 5; a fill drawn with an outline is reported, not gated; text needs
WCAG 2 contrast of at least 4.5:1 on its background. Colours are read from scripts/fig_lib.js (PAL), never typed here."""
import math, sys
M = {'protan': [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
     'deutan': [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
     'tritan': [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]}
def lin(c): c /= 255; return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def hexrgb(h): h = h.lstrip('#'); return [int(h[i:i + 2], 16) for i in (0, 2, 4)]
def sim(rgb, kind):
    if kind == 'normal': return [lin(c) for c in rgb]
    l = [lin(c) for c in rgb]; return [max(0, min(1, sum(M[kind][i][j] * l[j] for j in range(3)))) for i in range(3)]
def lab(l):
    X = 0.4124 * l[0] + 0.3576 * l[1] + 0.1805 * l[2]; Y = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; Z = 0.0193 * l[0] + 0.1192 * l[1] + 0.9505 * l[2]
    f = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    fx, fy, fz = f(X / 0.95047), f(Y), f(Z / 1.08883); return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)
def de2000(a, b):
    L1, a1, b1 = a; L2, a2, b2 = b
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2); Cb = (C1 + C2) / 2; G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2; C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1 = math.degrees(math.atan2(b1, a1p)) % 360; h2 = math.degrees(math.atan2(b2, a2p)) % 360
    dL, dC = L2 - L1, C2p - C1p; dh = h2 - h1
    if C1p * C2p == 0: dh = 0
    elif dh > 180: dh -= 360
    elif dh < -180: dh += 360
    dH = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dh / 2)); Lb = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2
    hb = (h1 + h2) / 2 if abs(h1 - h2) <= 180 else (h1 + h2 + 360) / 2
    if C1p * C2p == 0: hb = h1 + h2
    T = 1 - 0.17 * math.cos(math.radians(hb - 30)) + 0.24 * math.cos(math.radians(2 * hb)) + 0.32 * math.cos(math.radians(3 * hb + 6)) - 0.20 * math.cos(math.radians(4 * hb - 63))
    SL = 1 + 0.015 * (Lb - 50) ** 2 / math.sqrt(20 + (Lb - 50) ** 2); SC = 1 + 0.045 * Cbp; SH = 1 + 0.015 * Cbp * T
    RT = -2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7)) * math.sin(math.radians(60 * math.exp(-((hb - 275) / 25) ** 2)))
    return math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH))
import json, subprocess, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'scripts', 'fig_lib.js'), '--json']))['PAL']   # the figures' own colours
T = P['tier']; TR = P['trip']
CHECKS = [  # (figure, what, kind, [colours in order]); kinds: ramp (ordered), label (told apart), zone (labelled background)
    ('fig_ranked', 'band zones, alternating, labelled directly', 'zone', [P['zoneA'], P['zoneB']]),
    ('fig_ranked', 'lead group vs other countries', 'label', [P['lead'], P['other']]),
    ('fig_ranked', 'lead interval vs other interval', 'label', [P['lead'], P['otherInterval']]),
    ('fig_ranked', 'other interval vs page', 'zone', [P['page'], P['otherInterval']]),
    ('fig_dti', 'tiers Bronze to Platinum (ordered)', 'ramp', [T['Bronze'], T['Silver'], T['Gold'], T['Platinum']]),
    ('fig_dti', 'lightest tier vs page (outlined 0.4 grey)', 'outline', [P['page'], T['Bronze']]),
    ('fig_seeds', 'in lead group vs not', 'label', [P['lead'], P['textBody']]),
    ('fig_keys_region', 'regions vs all countries', 'label', [P['barRegion'], P['barAll']]),
    ('fig_keys_region', 'region bar vs empty track', 'label', [P['barRegion'], P['track']]),
    ('fig_categories', 'bars vs page', 'label', [P['bar'], P['page']]),
    ('fig_trips', 'arrives, not known, copy only (ordered by lightness)', 'ramp', [TR['arrive'], TR['unknown'], TR['copy']]),
    ('fig_trips', 'lightest state vs page', 'zone', [P['page'], TR['copy']]),
    ('fig_keys_models', 'key vs page', 'label', [P['key'], P['page']]),
]
TEXT = [  # (figure, what, text colour, background) for WCAG 2 contrast; floor 4.5:1 (small text)
    ('all', 'ink text on page', P['text'], P['page']), ('all', 'body text on page', P['textBody'], P['page']),
    ('all', 'muted text on page', P['textMuted'], P['page']), ('fig_ranked', 'median label on band zone', P['textBody'], P['zoneB']),
    ('fig_ranked', 'lead label on page', P['lead'], P['page']), ('fig_ranked', 'lead label on band zone', P['lead'], P['zoneB']),
    ('fig_dti', 'white count on Platinum', '#FFFFFF', T['Platinum']), ('fig_dti', 'ink count on Gold', P['text'], T['Gold']),
    ('fig_dti', 'ink count on Silver', P['text'], T['Silver']),
]
def wcag(a, b):
    lum = lambda h: 0.2126 * lin(hexrgb(h)[0]) + 0.7152 * lin(hexrgb(h)[1]) + 0.0722 * lin(hexrgb(h)[2])
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + 0.05) / (lb + 0.05)
VIS = ['normal', 'protan', 'deutan', 'tritan']; fail = 0
print(f"{'figure':16} {'pair':46} {'L* step':>8} " + ' '.join(f'{v:>7}' for v in VIS) + '  verdict')
for fig, what, kind, cols in CHECKS:
    for a, b in zip(cols, cols[1:]):
        la = {v: lab(sim(hexrgb(a), v)) for v in VIS}; lb = {v: lab(sim(hexrgb(b), v)) for v in VIS}
        dl = abs(la['normal'][0] - lb['normal'][0]); des = [de2000(la[v], lb[v]) for v in VIS]
        ok = dl >= 8 if kind == 'ramp' else dl >= 5 if kind == 'zone' else True if kind == 'outline' else min(des) >= 10
        if kind == 'ramp': ok = ok and min(abs(la[v][0] - lb[v][0]) for v in VIS) >= 8
        fail += not ok
        print(f"{fig:16} {what[:30] + ' ' + a + '/' + b:46} {dl:8.1f} " + ' '.join(f'{d:7.1f}' for d in des) + ('  ok' if ok else '  BELOW FLOOR'))
print()
for fig, what, fg, bg in TEXT:
    r = wcag(fg, bg); ok = r >= 4.5; fail += not ok
    print(f"{fig:16} {what[:30] + ' ' + fg + '/' + bg:46} contrast {r:5.2f}:1" + ('  ok' if ok else '  BELOW 4.5'))
sys.exit(1 if fail else 0)
