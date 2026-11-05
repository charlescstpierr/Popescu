#!/usr/bin/env python3
"""Register complete photo-corrected figures, never detached body parts.

The v5 and v6 images remain historical references. This builds v7 with the
same fourteen bearings, frame counts, native cell size and animation timings.
"""
from pathlib import Path
from PIL import Image
from scipy.ndimage import label, find_objects
import json
import math
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/toma-likeness'
W, H = 144, 128
ANCHOR = [65, 111]
VIEWS = [
    ('E', 0, 'W'), ('SE', 14, 'SW'), ('S', 90, None),
    ('NE', -29, 'NW'), ('N', -90, None),
    ('MSE', 32, 'MSW'), ('SSE', 67, 'SSW'), ('NNE', -65, 'NNW'),
]
# Measured centres of the barrel openings in the two foreshortened sheets.
FRONT_MUZZLES = {
    'S': [(160,198),(515,199),(877,200),(1238,199),
          (163,562),(517,562),(877,562),(1241,562),
          (167,939),(503,948),(864,956),(1236,959)],
    'SSE': [(210,182),(570,183),(933,181),(1296,180),
            (211,545),(574,544),(935,543),(1300,544),
            (188,889),(497,891),(849,910),(1239,939)],
}


def complete_figures(path):
    rgba = np.array(Image.open(path).convert('RGBA'))
    labels, _ = label(rgba[:, :, 3] > 160)
    slices = find_objects(labels)
    counts = np.bincount(labels.ravel())
    figures = []
    for component in np.where(counts > 1500)[0]:
        if component == 0:
            continue
        ys, xs = slices[component - 1]
        figures.append({'component': int(component),
                        'box': (xs.start, ys.start, xs.stop, ys.stop),
                        'cx': (xs.start + xs.stop) / 2,
                        'cy': (ys.start + ys.stop) / 2})
    assert len(figures) == 12, (path, len(figures))
    figures.sort(key=lambda figure: figure['cy'])
    ordered = []
    for row in range(3):
        ordered.extend(sorted(figures[row*4:(row+1)*4], key=lambda f: f['cx']))
    return rgba, labels, ordered


def pixel_runs(image):
    """Lossless full-figure fallback from the current E painting."""
    pixels = np.array(image)
    palette, colors, rows = [], {}, []
    for y in range(H):
        x = 0
        while x < W:
            pixel = tuple(pixels[y, x])
            if pixel[3] == 0:
                x += 1
                continue
            assert pixel[3] == 255
            color = '#%02x%02x%02x' % pixel[:3]
            if color not in colors:
                colors[color] = len(palette)
                palette.append(color)
            end = x + 1
            while end < W and tuple(pixels[y, end]) == pixel:
                end += 1
            rows.append([y, x, end-x, colors[color]])
            x = end
    return {'palette': palette, 'rows': rows, 'anchor': ANCHOR}


def main():
    atlas = Image.new('RGBA', (1152, 2048))
    data = {'width': W, 'height': H, 'anchor': ANCHOR,
            'image': 'toma-whole-v7.png',
            'identityRevision': 'photo-2026-11-05', 'views': {}}
    summary, fallback = [], {}
    for view_index, (view_id, degrees, mirror_id) in enumerate(VIEWS):
        rgba, labels, figures = complete_figures(SOURCE / (view_id + '.png'))
        scale = 80 / float(np.median([f['box'][3]-f['box'][1] for f in figures[:8]]))
        grounds = [max(f['box'][3] for f in figures[row*4:(row+1)*4]) for row in range(3)]
        frames = []
        for index, figure in enumerate(figures):
            left, top, right, bottom = figure['box']
            mask = labels == figure['component']
            painting = rgba.copy()
            painting[:, :, 3] = np.where(mask, 255, 0).astype('uint8')
            crop = Image.fromarray(painting).crop((left, top, right, bottom))
            height = bottom-top
            rgb = rgba[:, :, :3].astype(float)
            skin = mask & (rgb[:, :, 0] > 110) & (rgb[:, :, 1] > 60)
            skin &= (rgb[:, :, 0] > rgb[:, :, 1]*1.22) & (rgb[:, :, 1] > rgb[:, :, 2]*1.1)
            skin[:top] = False
            skin[top+int(height*.35):] = False
            skin_labels, _ = label(skin)
            counts = np.bincount(skin_labels.ravel())
            counts[0] = 0
            _, head_x = np.where(skin_labels == np.argmax(counts))
            head = float(np.median(head_x)) if len(head_x) else (left+right)/2
            resized = crop.resize((round(crop.width*scale), round(crop.height*scale)), Image.Resampling.NEAREST)
            ground = grounds[index//4] if index < 8 else bottom
            x = round(ANCHOR[0]+(left-head)*scale)
            y = round(ANCHOR[1]+(top-ground)*scale)
            cell = Image.new('RGBA', (W, H))
            cell.alpha_composite(resized, (x, y))
            bounds = cell.getbbox()
            assert bounds and bounds[0] > 0 and bounds[2] < W and bounds[1] > 0 and bounds[3] < H, (view_id, index, bounds)
            yy, xx = np.where(mask)
            upper = yy < top+height*.6
            xx, yy = xx[upper], yy[upper]
            if view_id in FRONT_MUZZLES:
                muzzle = FRONT_MUZZLES[view_id][index]
            elif view_id in ['E', 'SE', 'MSE']:
                near = xx >= max(xx)-2
                muzzle = (float(np.mean(xx[near])), float(np.median(yy[near])))
            else:
                angle = math.radians(degrees)
                projection = xx*math.cos(angle)+yy*math.sin(angle)
                near = projection >= max(projection)-2
                muzzle = (float(np.mean(xx[near])), float(np.mean(yy[near])))

            def local(point):
                return [x+(point[0]-left)*resized.width/crop.width,
                        y+(point[1]-top)*resized.height/crop.height]

            stage = 0 if index < 8 else [0, 2, 3, 4][index-8]
            marks = {'muzzle': local(muzzle),
                     'rearHand': local((head, top+height*.38)),
                     'frontHand': local((head+(muzzle[0]-head)*.6, top+height*.42)),
                     'hip': local((head, top+height*[.61,.64,.68,.76,.84][stage]))}
            row = view_index*2+(index >= 8)
            column = index if index < 8 else [0, 2, 3, 4][index-8]
            ax, ay = column*W, row*H
            atlas.alpha_composite(cell, (ax, ay))
            frames.append({'x': ax, 'y': ay, 'w': W, 'h': H, **marks})
            summary.append({'view': view_id, 'index': index, 'bounds': bounds,
                            'muzzle': marks['muzzle'], 'sourceMuzzle': muzzle,
                            'scale': scale, 'headX': head, 'sourceBox': figure['box']})
            if view_id == 'E' and index in [0, 11]:
                fallback['run' if index == 0 else 'split'] = pixel_runs(cell)
        view = {'angle': math.radians(degrees), 'run': frames[:8],
                'split': [frames[8], frames[8], frames[9], frames[10], frames[11]]}
        if mirror_id:
            view['mirrorId'] = mirror_id
        data['views'][view_id] = view
    data['fallback'] = fallback
    atlas.save(ROOT / 'dist/assets/toma-whole-v7.png', optimize=True)
    (ROOT / 'dist/hero-frames.js').write_text(
        '/* Complete photo-corrected figures; no body parts are assembled. */\n'
        'export const HERO_FRAMES = '+json.dumps(data,separators=(',',':'))+';\n')
    (SOURCE / 'registration.json').write_text(json.dumps(summary,indent=2)+'\n')
    print('Registered 96 complete paintings as 104 entries, 14 directions; historical v5/v6 unchanged.')


if __name__ == '__main__':
    main()
