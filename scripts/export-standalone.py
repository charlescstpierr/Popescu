#!/usr/bin/env python3
"""Generate the optional large single-file export, separate from the offline folder."""
from pathlib import Path
import sys
from offline_bundle import root, bundle_html

out = Path(sys.argv[1]) if len(sys.argv) > 1 else root/'generated/standalone/Toma_Popescu_JOUER.html'
if out.resolve() == (root/'release/Toma_Popescu_JOUER.html').resolve():
    sys.exit('This path belongs to the small-file offline folder. Run scripts/export-offline.py instead; use generated/standalone/Toma_Popescu_JOUER.html for a single-file export.')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(bundle_html(embed_assets=True), encoding='utf-8')
print(f'{out} ({out.stat().st_size:,} bytes; single-file export)')
