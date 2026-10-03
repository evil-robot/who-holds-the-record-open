#!/bin/zsh
# Builds the working paper's PDF: pandoc standalone HTML -> scripts/paper_html.py (title page, running footer, table and
# figure styling, inlined SVG figures; styles in paper/paper.css) -> headless Chrome PDF (A4; content box also fits Letter).
# Chrome 131+ is needed for the @page margin boxes that carry the running footer.
set -euo pipefail
cd "$(dirname "$0")"
pandoc paper.md -s --metadata title="" -o paper.html
/opt/homebrew/bin/python3.12 ../scripts/paper_html.py paper.html
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-pdf-header-footer \
  --allow-file-access-from-files --print-to-pdf="$PWD/paper.pdf" "file://$PWD/paper.html" 2>/dev/null
pdfinfo paper.pdf | awk '/^Pages|^Page size/'
