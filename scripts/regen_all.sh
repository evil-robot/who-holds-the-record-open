#!/bin/zsh
# Regenerate every computed output on the current data/, in dependency order (DECISION_RULES.md rule 1).
# Usage: scripts/regen_all.sh [--skip-links]   (the link check takes the longest; skip it only if data/ URLs did not change)
set -euo pipefail
cd "$(dirname "$0")/.."
py() { uv run --project "$HOME/Projects/ds-lab" python "$@"; }
py scripts/confidence.py --write          # labels are computed from the data (DECISION_RULES.md rule 4)
py scripts/test_confidence.py
node build.js
if [[ "${1:-}" != "--skip-links" ]]; then py analysis/url_check.py; py analysis/url_recheck.py; fi
py analysis/sources.py
py scripts/dti_evidence.py
py analysis/external_corr.py
py analysis/variance/variance.py
py analysis/strain/build_strain.py
py analysis/reliability/current_compare.py
node build.js                      # facts.json before robustness reconciles against it
py analysis/robustness/robustness.py
py analysis/robustness/seed_sweep.py           # seed spread of the lead group; the published seed decides
node build.js                      # site picks up the fresh rank ranges and lead group
node scripts/fig_method.js
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --allow-file-access-from-files --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1710,"$(grep -o 'height="[0-9]*" font-family' paper/figures/fig1_method.svg | grep -o '[0-9]*')" \
  --screenshot=paper/figures/fig1_method.png "file://$PWD/paper/figures/fig1_method.html" 2>/dev/null
node scripts/paper_gen.js
node scripts/test_paper_gen_gate.js
zsh paper/build.sh
