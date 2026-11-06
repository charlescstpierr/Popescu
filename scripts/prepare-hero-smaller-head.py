#!/usr/bin/env python3
"""Register newly painted complete figures at their original body scale.

Head correction is present in the eight source paintings, never performed by
assembling or deforming parts at runtime. Historical v8 assets stay intact.
"""
from pathlib import Path
from PIL import Image
import importlib.util
import json
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/toma-smaller-head'
BASE_SOURCE = ROOT / 'art/source/toma-consistent'
spec = importlib.util.spec_from_file_location('consistent', ROOT / 'scripts/prepare-hero-consistent.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
W, H = 144, 128
ANCHOR = [65, 111]


def main():
    data = json.loads((SOURCE / 'baseline-frames-v8.json').read_text())
    data['image'] = 'toma-whole-v9.png'
    data['identityRevision'] = 'smaller-head-2026-11-06'
    atlas = Image.new('RGBA', (1152, 2048))
    registration = json.loads((BASE_SOURCE / 'registration.json').read_text())
    references = {(r['view'], r['index']): r for r in registration}
    summary, fallback = [], {}
    for view_id, _, _ in base.VIEWS:
        rgba, labels, figures = base.complete_figures(SOURCE / (view_id + '.png'))
        original_rgba, original_labels, original_figures = base.complete_figures(BASE_SOURCE / (view_id + '.png'))
        original_size = (original_rgba.shape[1], original_rgba.shape[0])
        ratio_x, ratio_y = rgba.shape[1] / original_size[0], rgba.shape[0] / original_size[1]
        assert abs(ratio_x-ratio_y) < .002, (view_id, 'source sheet aspect ratio changed')
        ratio = (ratio_x+ratio_y)/2
        originals = [references[(view_id, i)] for i in range(12)]
        grounds = [max(r['sourceBox'][3] for r in originals[row*4:(row+1)*4]) for row in range(3)]
        for index, figure in enumerate(figures):
            reference = originals[index]
            left, top, right, bottom = figure['box']
            mask = labels == figure['component']
            painting = rgba.copy()
            painting[:, :, 3] = np.where(mask, 255, 0).astype('uint8')
            crop = Image.fromarray(painting).crop((left, top, right, bottom))
            scale = reference['scale'] / ratio
            resized = crop.resize((round(crop.width*scale), round(crop.height*scale)), Image.Resampling.NEAREST)
            ground = grounds[index//4] if index < 8 else reference['sourceBox'][3]
            # Register legs and boots after possible whole-figure source drift.
            # The smaller head is not an anchor. No body part is transformed.
            original_figure = original_figures[index]
            original_mask = original_labels == original_figure['component']
            old_y, old_x = np.where(original_mask)
            new_y, new_x = np.where(mask)
            leg_height = (reference['sourceBox'][3]-reference['sourceBox'][1])*.45
            original_leg_x = old_x[old_y >= reference['sourceBox'][3]-leg_height]
            candidate_leg_x = new_x[new_y >= bottom-leg_height*ratio]/ratio
            dx = float(np.mean(original_leg_x)-np.mean(candidate_leg_x))
            dy = reference['sourceBox'][3]-bottom/ratio
            # Original head centre is a registration datum, not the newly smaller
            # head's bounds. This prevents a new silhouette from shifting the body.
            x = round(ANCHOR[0] + (left/ratio+dx-reference['headX'])*reference['scale'])
            y = round(ANCHOR[1] + (top/ratio+dy-ground)*reference['scale'])
            cell = Image.new('RGBA', (W, H))
            cell.alpha_composite(resized, (x, y))
            bounds = cell.getbbox()
            assert bounds and 0 < bounds[0] < bounds[2] < W and 0 < bounds[1] < bounds[3] < H, (view_id,index,bounds)
            stage = [0, 2, 3, 4][index-8] if index >= 8 else index
            frame = data['views'][view_id]['split' if index >= 8 else 'run'][stage]
            atlas.alpha_composite(cell, (frame['x'], frame['y']))
            summary.append({'view': view_id, 'index': index, 'bounds': bounds,
                'sourceBox': figure['box'], 'scale': scale, 'originalBodyScale': reference['scale'],
                'sheetRatio': ratio, 'originalHeadX': reference['headX'], 'originalGround': ground,
                'wholeBodyTranslation': [dx,dy], 'muzzle': frame['muzzle'], 'placement': [x,y], 'resized': list(resized.size)})
            if view_id == 'E' and index in [0,11]:
                fallback['run' if index == 0 else 'split'] = base.pixel_runs(cell)
    data['fallback'] = fallback
    atlas.save(ROOT / 'dist/assets/toma-whole-v9.png', optimize=True)
    (ROOT / 'dist/hero-frames.js').write_text('/* Complete smaller-head paintings; body registration and gameplay anchors preserved. */\nexport const HERO_FRAMES = '+json.dumps(data,separators=(',',':'))+';\n')
    (SOURCE / 'registration.json').write_text(json.dumps(summary,indent=2)+'\n')
    print('Registered 96 smaller-head whole paintings, 104 entries, 14 directions; original body scale and gameplay anchors preserved.')


if __name__ == '__main__':
    main()
