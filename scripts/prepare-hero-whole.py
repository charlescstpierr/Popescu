#!/usr/bin/env python3
"""Register complete approved drawings. No limbs or upper-body pieces are cut."""
from pathlib import Path
from PIL import Image
from scipy.ndimage import label,find_objects
import numpy as np
import argparse,json,math

ROOT=Path(__file__).resolve().parents[1]
SOURCE_ART=ROOT/'art/source/toma'
parser=argparse.ArgumentParser()
parser.add_argument('--run',type=Path,default=SOURCE_ART/'run-east.png')
parser.add_argument('--split',type=Path,default=SOURCE_ART/'split-east.png')
SOURCES={
    'SE':'southeast.png',
    'S':'south.png',
    'NE':'northeast.png',
    'N':'north.png',
}
for direction,filename in SOURCES.items():parser.add_argument('--'+direction.lower(),type=Path,default=SOURCE_ART/filename)
args=parser.parse_args()
W,H=144,128;ANCHOR=(65,111)

def components(path,cols,rows):
    image=Image.open(path).convert('RGBA');rgba=np.asarray(image)
    labels,n=label(rgba[:,:,3]>160);slices=find_objects(labels);counts=np.bincount(labels.ravel());objects=[]
    for index in np.where(counts>3000)[0]:
        if not index:continue
        ys,xs=slices[index-1];objects.append(dict(index=int(index),box=(xs.start,ys.start,xs.stop,ys.stop),x=(xs.start+xs.stop)/2,y=(ys.start+ys.stop)/2))
    assert len(objects)==cols*rows,(str(path),len(objects),cols*rows)
    objects.sort(key=lambda item:item['y']);ordered=[]
    for row in range(rows):ordered.extend(sorted(objects[row*cols:(row+1)*cols],key=lambda item:item['x']))
    result=[]
    for item in ordered:
        l,t,r,b=item['box'];mask=labels==item['index'];cut=rgba.copy();cut[:,:,3]=np.where(mask,255,0).astype('uint8')
        result.append(dict(image=Image.fromarray(cut).crop((l,t,r,b)),mask=mask,rgba=rgba,box=(l,t,r,b)))
    return result

def skull_x(item):
    l,t,r,b=item['box'];mask=item['mask'];centres=[]
    for y in range(t+25,min(t+65,b)):
        xx=np.where(mask[y])[0]
        if len(xx):centres.append((int(xx[0])+int(xx[-1]))/2)
    return float(np.median(centres)) if centres else (l+r)/2

def skin_hands(item):
    l,t,r,b=item['box'];rgba=item['rgba'].astype(float);mask=item['mask'];hh=b-t
    skin=mask&(rgba[:,:,0]>100)&(rgba[:,:,1]>50)&(rgba[:,:,0]>rgba[:,:,1]*1.25)&(rgba[:,:,1]>rgba[:,:,2]*1.1)
    skin[:round(t+hh*.3),:]=False;skin[round(t+hh*.61):,:]=False
    labels,n=label(skin);counts=np.bincount(labels.ravel());found=[]
    for index in np.where(counts>16)[0]:
        if not index:continue
        yy,xx=np.where(labels==index);found.append((len(xx),float(np.mean(xx)),float(np.mean(yy))))
    found.sort(reverse=True)
    return [(v[1],v[2])for v in found[:2]]

def source_marks(item,direction):
    l,t,r,b=item['box'];hh=b-t;head=skull_x(item);mask=item['mask']
    yy,xx=np.where(mask);upper=yy<t+hh*.66;xx=xx[upper];yy=yy[upper]
    if direction in ['E','SE']:
        near=xx>=max(xx)-3;muzzle=(float(max(xx)),float(np.median(yy[near])))
    elif direction=='S':
        # Front barrel is foreshortened at the centre, in front of the waist.
        muzzle=(head,t+hh*.59)
    else:
        a={'SE':math.pi/4,'NE':-math.pi/4,'N':-math.pi/2}[direction]
        projection=xx*math.cos(a)+yy*math.sin(a);near=projection>=max(projection)-3
        muzzle=(float(np.mean(xx[near])),float(np.mean(yy[near])))
    hands=skin_hands(item)
    if len(hands)<2:hands=[(head+hh*.08,t+hh*.38),(head+hh*.24,t+hh*.37)]
    if direction=='N':hands.sort(key=lambda p:p[1],reverse=True)
    else:hands.sort(key=lambda p:p[0])
    hip=(head,t+hh*.61)
    return dict(muzzle=muzzle,rearHand=hands[0],frontHand=hands[1],hip=hip)

def register(item,scale,ground,direction,head=None,muzzle_override=None,stage=None):
    l,t,r,b=item['box'];head=skull_x(item)if head is None else head
    image=Image.new('RGBA',(W,H));sprite=item['image'];sized=sprite.resize((round(sprite.width*scale),round(sprite.height*scale)),Image.Resampling.NEAREST)
    x=round(65+(l-head)*scale);y=round(111+(t-ground)*scale);image.alpha_composite(sized,(x,y))
    bounds=image.getbbox();assert bounds and bounds[0]>0 and bounds[2]<144 and bounds[1]>0 and bounds[3]<128,(direction,bounds)
    marks=source_marks(item,direction)
    if muzzle_override is not None:marks['muzzle']=muzzle_override
    if stage is not None:
        # The groin, not a fixed percentage of total character height, descends
        # during these complete painted poses. This metadata never moves art.
        marks['hip']=(head,t+(b-t)*[.61,.64,.68,.76,.84][stage])
    # Actual scaled crop coordinates, identical to the approved E preparation.
    sx=sized.width/sprite.width;sy=sized.height/sprite.height
    local={name:[x+(point[0]-l)*sx,y+(point[1]-t)*sy]for name,point in marks.items()}
    return image,local

views={};images={}
run=components(args.run,4,2);split=components(args.split,3,2)[:5]
e_run=[];e_split=[]
for index,item in enumerate(run):e_run.append(register(item,.2,410+(index//4)*444,'E'))
for index,item in enumerate(split):e_split.append(register(item,.2,490 if index<3 else 976,'E',stage=index))
images['E']={'run':e_run,'split':e_split};angles={'E':0,'SE':math.radians(14),'S':math.pi/2,'NE':math.radians(-29),'N':-math.pi/2}
# Visually inspected opening centres in the foreshortened front rifle. They are
# deliberately not inferred from the silhouette's feet or a percentage height.
south_muzzles=[(189,205),(542,205),(893,204),(1246,206),(190,566),(541,568),(893,568),(1246,567),(157,926),(471,944),(809,954),(1199,961)]
for direction in ['SE','S','NE','N']:
    path=getattr(args,direction.lower())
    if not path:continue
    figures=components(path,4,3);scale=78.5/float(np.median([item['box'][3]-item['box'][1]for item in figures[:8]]))
    # A common row ground preserves the painted gait bob without resizing parts.
    row_ground=[max(item['box'][3]for item in figures[row*4:(row+1)*4])for row in range(3)]
    registered=[]
    for index,item in enumerate(figures):
        stage=None if index<8 else {8:0,9:2,10:3,11:4}[index]
        ground=row_ground[index//4]if index<8 else item['box'][3]
        override=south_muzzles[index]if direction=='S'else None
        registered.append(register(item,scale,ground,direction,muzzle_override=override,stage=stage))
    images[direction]={'run':registered[:8],'split':[registered[8],registered[8],registered[9],registered[10],registered[11]]}

atlas=Image.new('RGBA',(W*8,H*10))
for view_index,direction in enumerate(['E','SE','S','NE','N']):
    if direction not in images:continue
    view={'angle':angles[direction]}
    for kind,row in [('run',view_index*2),('split',view_index*2+1)]:
        records=[]
        for index,(image,marks)in enumerate(images[direction][kind]):
            x=index*W;y=row*H;atlas.alpha_composite(image,(x,y));records.append(dict(x=x,y=y,w=W,h=H,**marks))
        view[kind]=records
    views[direction]=view

def fallback(image):
    image=image.quantize(colors=96,method=Image.Quantize.FASTOCTREE).convert('RGBA');palette=[];rows=[]
    for y in range(H):
        x=0
        while x<W:
            pixel=image.getpixel((x,y))
            if pixel[3]<128:x+=1;continue
            color='#%02x%02x%02x'%pixel[:3]
            if color not in palette:palette.append(color)
            end=x+1
            while end<W and image.getpixel((end,y))==pixel:end+=1
            rows.append([y,x,end-x,palette.index(color)]);x=end
    return dict(palette=palette,rows=rows,anchor=list(ANCHOR))

data=dict(width=W,height=H,anchor=list(ANCHOR),image='toma-whole-v5.png',views=views,fallback={'run':fallback(e_run[0][0]),'split':fallback(e_split[4][0])})
atlas.save(ROOT/'dist/assets/toma-whole-v5.png',optimize=True)
(ROOT/'dist/hero-frames.js').write_text('/* Complete connected illustrated figures. No body parts are assembled. */\nexport const HERO_FRAMES = '+json.dumps(data,separators=(',',':'))+';\n')
print('Packed complete views:',','.join(views),'atlas',atlas.size)
