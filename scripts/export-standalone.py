#!/usr/bin/env python3
"""Package the buildless game into one offline-capable HTML deliverable."""
from pathlib import Path
import re, base64, sys
root=Path(__file__).resolve().parents[1]
dist=root/'dist'
parts=['(()=>{\nconst modules=Object.create(null);']
for name in ['content','discoveries','biomes','prop-geometry','world','hero-frames','hero-pose','travestia-dash','travestia','engine','actor-art','hero-art','city-art','combat-art','discovery-art','renderer','audio','run-save','opening','app']:
    code=(dist/f'{name}.js').read_text()
    code=re.sub(r"new URL\(['\"]\./assets/([^'\"]+)['\"],\s*import\.meta\.url\)\.href",lambda m:repr('assets/'+m[1]),code)
    exports=re.findall(r'export\s+(?:const|let|class|function)\s+(\w+)',code)
    code=re.sub(r"import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"];?",lambda m:'const {'+m[1]+'}=modules['+repr(m[2])+'];',code)
    code=re.sub(r'\bexport\s+(?=const|let|class|function)','',code)
    parts.append('(()=>{\n'+code+'\nmodules["./'+name+'.js"]={'+','.join(exports)+'};\n})();')
parts.append('})();')
js='\n'.join(parts)
html=(dist/'index.html').read_text().replace('<link rel="stylesheet" href="styles.css">','<style>\n'+(dist/'styles.css').read_text()+'\n</style>')
html=html.replace('<script type="module" src="app.js"></script>','<script>\n'+js.replace('</script','<\\/script')+'\n</script>')
for p in (dist/'assets').glob('*'):
    mime={'.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'}.get(p.suffix,'application/octet-stream')
    html=html.replace('assets/'+p.name,'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode())
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'Toma_Popescu_JOUER.html'
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html)
print(f'{out} ({out.stat().st_size:,} bytes)')
