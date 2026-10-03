#!/opt/homebrew/bin/python3.12
"""Post-process pandoc's standalone HTML for the working paper's PDF (called by paper/build.sh).

Every string on the title page and in the running footer is read from the HTML pandoc made from paper.md; nothing
here restates a fact from the paper. Fails loudly if the front matter it expects is not there.
  1. drop pandoc's title block and default stylesheet; link paper/paper.css; lang en-GB for hyphenation
  2. title page from the H1 and the paragraphs before the first <hr> (split the H1 at the colon: title, question)
  3. running footer (title, version, page number) as @page margin boxes, none on the title page
  4. tables: class narrow/wide (as before), long, number cells in mono, caption moved above in a .tablewrap
  5. figures: pandoc's alt-text figcaption dropped, the italic "Figure N." paragraph becomes the caption;
     an <img> pointing at an .svg (or a .png with an .svg beside it) is inlined so it stays vector and uses the page fonts
  6. abstract, keywords and references get classes; section numbers in headings get a span
"""
import re, sys, html, os

p = sys.argv[1] if len(sys.argv) > 1 else 'paper.html'
base = os.path.dirname(os.path.abspath(p))
s = open(p, encoding='utf-8').read()
strip = lambda x: re.sub(r'\s+', ' ', re.sub(r'<!--.*?-->|<[^>]+>', '', x, flags=re.S)).strip()

def need(m, what):
    if not m: sys.exit(f'paper_html.py: cannot find {what} in {p}')
    return m

# 1. head
s = re.sub(r'<header id="title-block-header">.*?</header>\n?', '', s, flags=re.S)
s = re.sub(r'<style>.*?</style>\n?', '', s, flags=re.S)
s = re.sub(r'<html[^>]*>', '<html lang="en-GB" xml:lang="en-GB">', s, count=1)

# 2. title page
body = need(re.search(r'<body>(.*)</body>', s, flags=re.S), '<body>')
front = need(re.search(r'<body>\s*(<h1.*?)<hr\s*/?>', s, flags=re.S), 'front matter before the first <hr>')
h1 = need(re.search(r'<h1[^>]*>(.*?)</h1>', front.group(1), flags=re.S), 'the H1').group(1)
h1t = strip(h1)
title, _, question = h1t.partition(':')
need(question.strip(), 'a colon in the H1 (title: question)')
paras = re.findall(r'<p>(.*?)</p>', front.group(1), flags=re.S)
need(len(paras) >= 3, 'author, affiliation and metadata paragraphs')
authors, affil, meta = paras[0], paras[1], paras[2:]
# metadata paragraphs carry "<strong>Label:</strong> value" pairs, sometimes several per paragraph
rows = []
for para in meta:
    for lab, val in re.findall(r'<strong>([^<]+?):</strong>(.*?)(?=<strong>[^<]+?:</strong>|$)', para, flags=re.S):
        val = re.sub(r'\s*·\s*$', '', re.sub(r'\s+', ' ', val).strip())
        val = re.sub(r'(https?://[^\s<]+?)([.,;]?)(?=\s|$)', lambda m: f'<a href="{m.group(1)}">{m.group(1)}</a>{m.group(2)}', val)
        rows.append((re.sub(r'\s+', ' ', lab).strip(), val))   # pandoc may wrap a label across lines
need(rows, 'labelled metadata (Status:, Version:, DOI: ...)')
labels = [r[0] for r in rows]
for want in ('Version', 'DOI', 'Interactive index'):
    need(want in labels, f'a "{want}:" line in the front matter')
lic = need(re.search(r'([A-Z][^.]*?released under (?:the )?CC BY.*?\.)(?=\s+[A-Z]|\s*$)', strip(body.group(1))), 'the licence sentence (CC BY)').group(1).strip()
rows.append(('Licence', html.escape(lic)))
version = strip(dict(rows)['Version'])
logo_path = os.path.join(base, '..', 'brand', 'supertruth-logo-dark.svg')
logo = re.sub(r'<\?xml.*?\?>', '', open(logo_path, encoding='utf-8').read())
status = dict(rows).get('Status', '')
label = 'Working paper' + (f' · Version {version}' if version else '')
tp = ('<section class="titlepage">'
      f'<div class="tp-logo" aria-label="SuperTruth">{logo}</div>'
      f'<p class="tp-label">{html.escape(label)}</p>'
      f'<h1 class="tp-title">{html.escape(title.strip())}</h1>'
      f'<p class="tp-sub">{html.escape(question.strip())}</p>'
      f'<div class="tp-authors"><p>{authors}</p><p>{affil}</p></div>'
      '<dl class="tp-meta">' + ''.join(f'<dt>{l}</dt><dd>{v}</dd>' for l, v in rows) + '</dl></section>\n')
s = s.replace(front.group(0), '<body>\n' + tp, 1)

# 3. running footer (CSS content strings; quotes escaped)
q = lambda t: '"' + t.replace('\\', '\\\\').replace('"', '\\"') + '"'
foot = (f'@page{{@bottom-left{{content:{q(title.strip() + "  ·  Working paper v" + version)};font:7.4pt Inter,sans-serif;color:#6B7280;vertical-align:top;padding-top:9mm}}'
        '@bottom-right{content:counter(page);font:7.4pt "JetBrains Mono",monospace;color:#6B7280;vertical-align:top;padding-top:9mm}}'
        '@page:first{@bottom-left{content:none}@bottom-right{content:none}}')
s = s.replace('</head>', '<link rel="stylesheet" href="paper.css" />\n<style>' + foot + '</style>\n<title>' + html.escape(h1t) + '</title>\n</head>', 1)
s = re.sub(r'<title>[^<]*</title>\n(?=.*<title>)', '', s, count=1, flags=re.S)

# 4. tables
def classify(m):
    t = m.group(0)
    head = re.search(r'<tr[^>]*>(.*?)</tr>', t, flags=re.S)
    n = len(re.findall(r'<th\b', head.group(1))) if head else 0
    rowsn = len(re.findall(r'<tr\b', t)) - 1
    cls = ('narrow' if n <= 8 else 'wide') + (' long' if rowsn > 20 else '')
    t = re.sub(r'^<table[^>]*>', f'<table class="{cls}" data-rows="{rowsn}">', t, count=1)
    if n <= 8:
        t = re.sub(r'<colgroup>.*?</colgroup>', '', t, flags=re.S)
        # a cell without letters (a number, a rank, a range of numbers) keeps to one line and is set in mono
        # a numeric range ("1 to 6", "-0.16 to +0.88") counts as a number; a short label ("Middle East") does not break
        isnum = lambda x: x.strip() and (not re.search(r'[A-Za-z]', x) or re.fullmatch(r'\s*[−+\-]?[\d.,%]+=?\s+to\s+[−+\-]?[\d.,%]+\s*', x))
        t = re.sub(r'<td([^>]*)>([^<]*)</td>', lambda c: '<td class="nw"%s>%s</td>' % (c.group(1), c.group(2)) if isnum(c.group(2))
                   else '<td class="nb"%s>%s</td>' % (c.group(1), c.group(2)) if 0 < len(c.group(2).strip()) <= 13 else c.group(0), t)
    return t
s = re.sub(r'<table[^>]*>.*?</table>', classify, s, flags=re.S)

BAD_IN_CAPTION = re.compile(r'<figure|<h[1-6]\b|<table|<p\b|</p>', re.I)
def guard_caption(inner, kind):
    if BAD_IN_CAPTION.search(inner):
        sys.exit(f'paper_html.py: a {kind} caption swallowed other content (a figure, heading, table or paragraph). '
                 f'Usually a missing blank line after an italic caption in paper.md. Caption starts: {strip(inner)[:90]!r}')
def caption(inner, kind):
    lab = re.match(r'\s*((?:Table|Figure)\s+\d+[a-z]?\.)\s*', inner)
    rest = inner[lab.end():] if lab else inner
    return f'<p class="caption"><span class="lbl">{lab.group(1) if lab else ""}</span>{rest}</p>'

# a table with a "Weight" column of percentages (Table 1) gets a thin bar to scale beside each weight, one colour, so the
# relative weights read at a glance; the number stays the data and the bar adds no other encoding
def weightbars(m):
    t = m.group(0)
    hdr = re.findall(r'<th[^>]*>(.*?)</th>', t, flags=re.S)
    names = [strip(h) for h in hdr]
    if 'Weight' not in names: return t
    wi = names.index('Weight')
    vals = []
    for row in re.findall(r'<tr[^>]*>(.*?)</tr>', t, flags=re.S)[1:]:
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, flags=re.S)
        if len(cells) > wi and re.fullmatch(r'\d+%', strip(cells[wi])): vals.append(int(strip(cells[wi])[:-1]))
    if not vals: return t
    mx = max(vals)
    def addbar(rm):
        row = rm.group(0); cells = list(re.finditer(r'<td([^>]*)>(.*?)</td>', row, flags=re.S))
        if len(cells) <= wi: return row
        c = cells[wi]; v = strip(c.group(2))
        if not re.fullmatch(r'\d+%', v): return row
        bar = f'<td class="wbar"><span style="width:{int(v[:-1]) / mx * 100:.1f}%"></span></td>'
        return row[:c.end()] + bar + row[c.end():]
    t = re.sub(r'<tr[^>]*>(?:(?!</tr>).)*<td.*?</tr>', addbar, t, flags=re.S)
    th = list(re.finditer(r'<th[^>]*>.*?</th>', t, flags=re.S))[wi]
    return t[:th.end()] + '<th class="wbar" aria-hidden="true"></th>' + t[th.end():]
s = re.sub(r'<table\b.*?</table>', weightbars, s, flags=re.S)

RANGE = re.compile(r'\s*([−+\-]?[\d.,]+%?=?)\s+to\s+([−+\-]?[\d.,]+%?)\s*')
def splitranges(m):
    t = m.group(0)
    rows = re.findall(r'<tr[^>]*>.*?</tr>', t, flags=re.S)
    if len(rows) < 2: return t
    body = [list(re.finditer(r'<td([^>]*)>(.*?)</td>', r, flags=re.S)) for r in rows[1:]]
    ncol = max((len(b) for b in body), default=0)
    cols = [j for j in range(ncol) if all(len(b) > j for b in body) and sum(1 for b in body if strip(b[j].group(2))) > 0
            and all(not strip(b[j].group(2)) or RANGE.fullmatch(strip(b[j].group(2))) for b in body)]
    if not cols: return t
    def fixrow(r, cells):
        for j in sorted(cols, reverse=True):
            c = cells[j]; mm = RANGE.fullmatch(strip(c.group(2)))
            new = (f'<td class="nw rlo">{mm.group(1)}</td><td class="rto">to</td><td class="nw rhi">{mm.group(2)}</td>' if mm
                   else '<td class="nw rlo"></td><td class="rto"></td><td class="nw rhi"></td>')
            r = r[:c.start()] + new + r[c.end():]
        return r
    out = t
    for r, cells in zip(rows[1:], body): out = out.replace(r, fixrow(r, cells), 1)
    head = rows[0]; ths = list(re.finditer(r'<th([^>]*)>(.*?)</th>', head, flags=re.S)); nh = head
    for j in sorted(cols, reverse=True):
        if j < len(ths): th = ths[j]; nh = nh[:th.start()] + f'<th class="rrange" colspan="3"{th.group(1)}>{th.group(2)}</th>' + nh[th.end():]
    return out.replace(head, nh, 1)
s = re.sub(r'<table\b(?:(?!</table>).)*</table>', splitranges, s, flags=re.S)

# table followed (across comments and whitespace) by an italic "Table N." paragraph: caption moves above, both wrapped
gap = r'((?:\s|<!--.*?-->)*)'
def tablecap(m):
    t, sep, inner = m.group(1), m.group(2), m.group(3)
    guard_caption(inner, 'table')
    rowsn = int(re.search(r'data-rows="(\d+)"', t).group(1))
    keep = ' keep' if rowsn <= 24 else ''
    cap = caption(inner, 'table').replace('<p class="caption">', '<caption class="caption">').replace('</p>', '</caption>')
    t = re.sub(r'^(<table[^>]*>)', lambda m: m.group(1) + cap, t, count=1)
    return f'<div class="tablewrap{keep}">{t}</div>{sep}'
s = re.sub(r'(<table\b(?:(?!</table>).)*</table>)' + gap + r'<p><em>(Table\s+\d+[a-z]?\.(?:(?!</em></p>).)*)</em></p>', tablecap, s, flags=re.S)
# a table with no caption still gets the wrapper (spacing), kept whole if short
def wrap_bare(src):
    out, i = [], 0
    for m in re.finditer(r'<table\b[^>]*data-rows="(\d+)".*?</table>', src, flags=re.S):
        pre = src[max(0, m.start() - 400):m.start()]
        wrapped = re.search(r'<div class="tablewrap[^"]*">(?:(?!</div>).)*$', pre, flags=re.S)
        out.append(src[i:m.start()])
        out.append(m.group(0) if wrapped else f'<div class="tablewrap{" keep" if int(m.group(1)) <= 24 else ""}">{m.group(0)}</div>')
        i = m.end()
    out.append(src[i:]); return ''.join(out)
s = wrap_bare(s)

# 5. figures
def inline_svg(src):
    path = os.path.join(base, src)
    svgp = path if path.endswith('.svg') else re.sub(r'\.png$', '.svg', path)
    if not os.path.exists(svgp): return None
    svg = open(svgp, encoding='utf-8').read()
    svg = re.sub(r'<\?xml.*?\?>', '', svg)
    svg = re.sub(r'(<svg\b[^>]*?)\s(width|height)="[^"]*"', r'\1', svg, count=1)
    svg = re.sub(r'(<svg\b[^>]*?)\s(width|height)="[^"]*"', r'\1', svg, count=1)
    return svg.replace('<svg', '<svg role="img" preserveAspectRatio="xMidYMid meet"', 1)
def figure(m):
    fig, sep, inner = m.group(1), m.group(2), m.group(3)
    guard_caption(inner, 'figure')
    img = need(re.search(r'<img\s+src="([^"]+)"\s+alt="([^"]*)"', fig, flags=re.S), 'an <img> in a figure')
    svg = inline_svg(img.group(1))
    alt = re.sub(r'\s+', ' ', img.group(2))
    art = svg.replace('<svg', f'<svg aria-label="{alt}"', 1) if svg else f'<img src="{img.group(1)}" alt="{alt}" />'
    return f'<figure>{art}{caption(inner, "figure")}</figure>{sep}'
s = re.sub(r'(<figure>(?:(?!</figure>).)*</figure>)' + gap + r'<p><em>(Figure\s+\d+[a-z]?\.(?:(?!</em></p>).)*)</em></p>', figure, s, flags=re.S)
s = re.sub(r'<figcaption aria-hidden="true">.*?</figcaption>', '', s, flags=re.S)

# every figure block must close its emphasis, and emphasis must balance across the document
for fb in re.findall(r'<figure>.*?</figure>', s, flags=re.S):
    for tag in ('em', 'i', 'strong', 'b'):
        if len(re.findall(rf'<{tag}\b', fb)) != len(re.findall(rf'</{tag}>', fb)):
            sys.exit(f'paper_html.py: <{tag}> left unclosed in a figure block: {strip(fb)[:90]!r}')
for tag in ('em', 'i'):
    o, c = len(re.findall(rf'<{tag}\b', s)), len(re.findall(rf'</{tag}>', s))
    if o != c: sys.exit(f'paper_html.py: {o} <{tag}> but {c} </{tag}> in the document; an italic run is left open')
# every italic "Figure N." / "Table N." paragraph must have become a caption
left = re.findall(r'<p><em>((?:Figure|Table)\s+\d+[a-z]?\.)', s)
if left: sys.exit(f'paper_html.py: caption paragraphs not attached to a figure or table: {left}')

# 6. abstract, keywords, references, heading numbers
s = re.sub(r'(<h2 id="abstract">.*?</h2>)(.*?)(?=<hr\s*/?>)', lambda m: m.group(1) + re.sub(r'<p>(?!<strong>Keywords)', '<p class="abstract">', m.group(2)).replace('<p><strong>Keywords', '<p class="keywords"><strong>Keywords'), s, count=1, flags=re.S)
s = re.sub(r'(<h2 id="references">.*?</h2>)(.*?)(?=</body>)', lambda m: m.group(1) + '<div class="refs">' + m.group(2) + '</div>\n', s, count=1, flags=re.S)
s = re.sub(r'(<h[23][^>]*>)\s*(\d+(?:\.\d+)*\.?)\s+', r'\1<span class="num">\2</span>', s)

open(p, 'w', encoding='utf-8').write(s)
print(f'paper_html.py: title page "{title.strip()}" / "{question.strip()}", {len(rows)} metadata rows, '
      f'{len(re.findall(r"<table", s))} tables, {len(re.findall(r"<figure>", s))} figures')
