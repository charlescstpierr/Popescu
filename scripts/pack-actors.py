#!/usr/bin/env python3
"""Normalize generated transparent 4x2 walk sheets into runtime sprite atlases."""
from PIL import Image
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
import argparse
parser=argparse.ArgumentParser(description=__doc__)
for actor in ['toma','girl','gorilla']:
 parser.add_argument('--'+actor,type=Path,help='Generated transparent 4x2 source sheet')
parser.add_argument('--orangutan',type=Path,help='Generated female orangutan 4x2 source sheet')
parser.add_argument('--rival-rooster',dest='rival_rooster',type=Path,help='Male rooster rival source sheet')
parser.add_argument('--rival-goat',dest='rival_goat',type=Path,help='Male goat rival source sheet')
parser.add_argument('--version',choices=['v2','v3'],default='v2')
args=parser.parse_args()
sources={actor:getattr(args,actor) for actor in ['toma','girl','gorilla','orangutan','rival_rooster','rival_goat'] if getattr(args,actor,None)}
if not sources: parser.error('provide at least one source sheet')
meta_path=root/'dist'/'assets'/'actors-v2.json'
meta=json.loads(meta_path.read_text()) if meta_path.exists() else {}
for name,path in sources.items():
 im=Image.open(path).convert('RGBA');w,h=im.size;regions=[]
 for row in range(2):
  for col in range(4):
   tile=im.crop((round(col*w/4),round(row*h/2),round((col+1)*w/4),round((row+1)*h/2)))
   # Ignore invisible alpha noise when deciding the common actor scale.
   alpha=tile.getchannel('A');bbox=alpha.point(lambda a:255 if a>64 else 0).getbbox()
   assert bbox and bbox[0]>=0 and bbox[2]<=tile.width
   regions.append(tile.crop(bbox))
 maxw=max(p.width for p in regions);maxh=max(p.height for p in regions)
 scale=min(116/maxw,112/maxh);atlas=Image.new('RGBA',(512,256))
 for i,tile in enumerate(regions):
  size=(round(tile.width*scale),round(tile.height*scale));tile=tile.resize(size,Image.Resampling.NEAREST)
  # Foot positions stay registered; whitespace does not change animation scale.
  x=(i%4)*128+(128-tile.width)//2;y=(i//4)*128+121-tile.height
  atlas.alpha_composite(tile,(x,y))
 out=root/'dist'/'assets'/f'{name}-walk-{args.version}.png';atlas.save(out,optimize=True)
 meta[name]={'file':out.name,'columns':4,'rows':2,'cell':128,'baseline':121,'height':round(maxh*scale),'width':round(maxw*scale)}
 print(name,out.stat().st_size,meta[name])
(root/'dist'/'assets'/'actors-v2.json').write_text(json.dumps(meta,indent=2))
