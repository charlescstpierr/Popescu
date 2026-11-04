#!/usr/bin/env python3
"""Register complete paintings, without limb assembly or body deformation.
Run from the repository root. Source: built-in image generation, approved five-rank
reference. Cropping/resizing only; RGBA transparency is preserved.
"""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / 'art/source/companion/levels-whole-source.png').convert('RGBA')
rows = [0, 274, 550, 826, 1107, 1402]
columns = [0, 280, 561, 841, 1122]
atlas = Image.new('RGBA', (768, 640))
for rank in range(5):
    for pose in range(4):
        cell = source.crop((columns[pose], rows[rank], columns[pose+1], rows[rank+1]))
        # Use visible alpha to ignore near-transparent antialiasing outside a figure.
        bbox = cell.getchannel('A').point(lambda a: 255 if a >= 32 else 0).getbbox()
        cell = cell.crop(bbox)
        scale = min(114 / cell.height, 114 / cell.width)
        cell = cell.resize((round(cell.width*scale), round(cell.height*scale)), Image.Resampling.LANCZOS)
        atlas.alpha_composite(cell, (pose*128+(128-cell.width)//2, rank*128+121-cell.height))
rear=Image.open(ROOT/'art/source/companion/levels-rear-run-source.png').convert('RGBA')
rear_rows=[0,309,615,909,1215,1536]
for rank in range(5):
    for pose in range(2):
        cell=rear.crop((pose*512,rear_rows[rank],(pose+1)*512,rear_rows[rank+1]))
        bbox=cell.getchannel('A').point(lambda a:255 if a>=32 else 0).getbbox()
        cell=cell.crop(bbox);scale=min(114/cell.height,114/cell.width)
        cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
        atlas.alpha_composite(cell,((pose+4)*128+(128-cell.width)//2,rank*128+121-cell.height))
atlas.save(ROOT / 'dist/assets/companion-levels-whole.png', optimize=True)
# Same original paintings supply HUD portraits; no new identities are generated.
for rank in range(5):
    top=rows[rank]
    portrait=source.crop((72,top+2,223,top+153)).resize((80,80),Image.Resampling.LANCZOS)
    portrait.save(ROOT / f'dist/assets/companion-portrait-{rank+1}.png',optimize=True)
# Contact sheet at actual game size plus 2x enlargement, on the game's dark palette.
preview = Image.new('RGB', (1090, 520), '#17152c')
draw = ImageDraw.Draw(preview)
for rank in range(5):
    draw.text((10,rank*104+10), f'RANG {rank+1}', fill='#ffe9ad')
    for pose in range(6):
        cell=atlas.crop((pose*128,rank*128,pose*128+128,rank*128+128))
        small=cell.resize((82,82),Image.Resampling.NEAREST)
        preview.paste(small,(88+pose*165,rank*104+15),small)
        draw.text((88+pose*165,rank*104+1),['idle','run A','run B','rear','rear run A','rear run B'][pose],fill='#a5a3bd')
out=ROOT/'proof/companion';out.mkdir(parents=True,exist_ok=True)
preview.save(out/'contact-sheet.png')
