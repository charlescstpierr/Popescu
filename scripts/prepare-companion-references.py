#!/usr/bin/env python3
"""Register generated whole-body reference sheets; preserve all other ranks.

Only crop and uniformly resize existing RGBA paintings. No body part assembly,
pixel redrawing, background extraction, or procedural animation.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
atlas_path = ROOT / 'dist/assets/companion-levels-whole.png'
atlas = Image.open(atlas_path).convert('RGBA')
for rank in (2, 3, 4, 5):
    source_path = ROOT / f'art/source/companion/rank-{rank}-reference-source.png'
    if not source_path.exists():
        continue
    source = Image.open(source_path).convert('RGBA')
    width, height = source.size
    for pose in range(6):
        col, row = pose % 3, pose // 3
        cell = source.crop((col*width//3, row*height//2,
                            (col+1)*width//3, (row+1)*height//2))
        bounds = cell.getchannel('A').point(lambda a: 255 if a >= 32 else 0).getbbox()
        assert bounds, (rank, pose)
        figure = cell.crop(bounds)
        scale = min(114/figure.height, 114/figure.width)
        sprite = figure.resize((round(figure.width*scale), round(figure.height*scale)), Image.Resampling.LANCZOS)
        atlas.paste((0, 0, 0, 0), (pose*128, (rank-1)*128, (pose+1)*128, rank*128))
        atlas.alpha_composite(sprite, (pose*128+(128-sprite.width)//2, (rank-1)*128+121-sprite.height))
        if pose == 0:
            # Square head-and-shoulders crop from the same figure as gameplay.
            size = round(figure.height*.45)
            left = (figure.width-size)//2
            portrait = figure.crop((left, 0, left+size, size)).resize((80,80), Image.Resampling.LANCZOS)
            portrait.save(ROOT / f'dist/assets/companion-portrait-{rank}.png', optimize=True)
atlas.save(atlas_path, optimize=True)
