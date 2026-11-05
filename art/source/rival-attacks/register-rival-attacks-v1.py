"""Register whole generated paintings. No segmentation of limbs, warping or per-frame scaling.
Only whole-cell crop, common uniform downsampling, and translation onto a fixed foot anchor.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json, hashlib
ROOT=Path(__file__).resolve().parent
CELL=128; ANCHOR=(60,121)
for kind,size,target in [('goat',88,109),('rooster',78,112)]:
    ANCHOR=(60 if kind=='goat' else 68,121)
    path=ROOT/f'rival-{kind}-attack-source-v1.png'
    source=Image.open(path).convert('RGBA'); w,h=source.size
    poses=['brace','lower','chargeA','chargeB','recover'] if kind=='goat' else ['stepA','stepB','inhale','crow','recover']
    parts=[]
    for row in range(2):
      for col in range(5):
        box=(round(col*w/5),round(row*h/2),round((col+1)*w/5),round((row+1)*h/2))
        tile=source.crop(box); a=np.array(tile.getchannel('A')); ys,xs=np.where(a>32)
        bbox=(int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1))
        # Locate actual shoe/hoof support: bottom 12% of figure, ignore alpha fringe.
        footmask=(a>128); footmask[:int(bbox[3]-(bbox[3]-bbox[1])*.12)]=False
        fy,fx=np.where(footmask)
        foot=(float((fx.min()+fx.max()+1)/2),float(fy.max()+1))
        parts.append((row,col,box,bbox,foot,tile))
    # One scale for the entire species sheet; preserve real lowered-body height.
    recovery_heights=[p[3][3]-p[3][1] for p in parts if p[1]==4]
    scale=target/(sum(recovery_heights)/len(recovery_heights))
    atlas=Image.new('RGBA',(CELL*5,CELL*2)); frames=[]
    for row,col,box,bbox,foot,tile in parts:
        cut=tile.crop(bbox)
        resized=cut.resize((round(cut.width*scale),round(cut.height*scale)),Image.Resampling.LANCZOS)
        left=round(ANCHOR[0]-(foot[0]-bbox[0])*scale); top=round(ANCHOR[1]-(foot[1]-bbox[1])*scale)
        assert left>=0 and top>=0 and left+resized.width<=CELL and top+resized.height<=CELL,(kind,row,col,left,top,resized.size)
        atlas.alpha_composite(resized,(col*CELL+left,row*CELL+top))
        frames.append(dict(name=('back_' if row else 'front_')+poses[col],index=row*5+col,rect=[col*CELL,row*CELL,CELL,CELL],anchor=list(ANCHOR),sourceCell=list(box),sourceBBox=list(bbox),sourceFoot=list(foot),registeredBBox=[left,top,left+resized.width,top+resized.height]))
    atlas.save(ROOT.parents[2]/'dist/assets'/f'rival_{kind}-attack-v1.png')
    metadata=dict(version=1,kind=kind,source=path.name,sourceSHA256=hashlib.sha256(path.read_bytes()).hexdigest(),atlas=f'rival_{kind}-attack-v1.png',cellSize=[128,128],columns=5,rows=2,anchor=list(ANCHOR),drawSize=size,sourceUniformScale=scale,registration='Whole painting crop + one common uniform scale per species + translation. Feet bottom edge at y121. Horizontal mirror allowed.',phases=poses,frames=frames,timing={'windup':.8,'charge':.55} if kind=='goat' else {'windup':.85,'crow':.7})
    (ROOT/f'rival_{kind}-attack-v1.json').write_text(json.dumps(metadata,indent=2)+'\n')
    preview=Image.new('RGB',(5*(size+24),2*(size+36)), '#282238'); d=ImageDraw.Draw(preview)
    for f in frames:
        index=f['index']; x=(index%5)*(size+24)+12; y=(index//5)*(size+36)+12
        c=atlas.crop(tuple([f['rect'][0],f['rect'][1],f['rect'][0]+128,f['rect'][1]+128])).resize((size,size),Image.Resampling.NEAREST)
        preview.paste(c,(x,y),c); d.line((x,y+121*size/128,x+size,y+121*size/128),fill='#665774'); d.text((x,y+size+3),f['name'],fill='white')
    preview.save(ROOT/f'rival-{kind}-preview-{size}px-v1.png')
    # Playback preview contains only actual registered paintings, no synthetic tweens.
    sequence=[0,1,2,3,2,3,4] if kind=='goat' else [0,1,2,3,3,4]
    durations=[400,400,137,138,137,138,160] if kind=='goat' else [280,280,290,350,350,160]
    playback=[]
    for col in sequence:
      canvas=Image.new('RGB',(size*2+48,size+32),'#282238')
      for row in range(2):
        im=atlas.crop((col*128,row*128,(col+1)*128,(row+1)*128)).resize((size,size),Image.Resampling.NEAREST)
        canvas.paste(im,(16+row*(size+16),8),im)
      playback.append(canvas)
    playback[0].save(ROOT/f'rival-{kind}-attack-preview-v1.gif',save_all=True,append_images=playback[1:],duration=durations,loop=0)
    print(kind,'scale',scale,'frames',len(frames),'atlas',atlas.size)
