#!/usr/bin/env python3
"""Append registered complete paintings. The original v5 atlas pixels are untouched."""
from pathlib import Path
from PIL import Image
from scipy.ndimage import label,find_objects
import numpy as np,json,math
ROOT=Path(__file__).resolve().parents[1]
W,H=144,128
metadata=ROOT/'dist/hero-frames.js'
data=json.loads(metadata.read_text().split('export const HERO_FRAMES = ',1)[1].rstrip().rstrip(';'))
for id in ['MSE','SSE','NNE']:data['views'].pop(id,None)
atlas=Image.new('RGBA',(1152,2048));original=Image.open(ROOT/'dist/assets/toma-whole-v5.png').convert('RGBA');atlas.paste(original,(0,0))
# Source-pixel barrel opening centres, inspected on the foreshortened front sheet.
front_muzzles=[(209,185),(573,185),(935,185),(1299,185),(212,546),(575,547),(936,547),(1300,547),(189,895),(500,895),(839,914),(1229,943)]
summary=[]
for view_index,(id,file,degrees,mirror,height)in enumerate([
 ('MSE','southeast-mid.png',32,'MSW',82),('SSE','south-southeast.png',67,'SSW',82),('NNE','north-northeast.png',-65,'NNW',82)]):
 rgba=np.array(Image.open(ROOT/'art/source/toma-turns'/file).convert('RGBA'));labels,n=label(rgba[:,:,3]>160);slices=find_objects(labels);counts=np.bincount(labels.ravel());objects=[]
 for k in np.where(counts>1500)[0]:
  if not k:continue
  ys,xs=slices[k-1];objects.append(dict(k=int(k),box=(xs.start,ys.start,xs.stop,ys.stop),cy=(ys.start+ys.stop)/2,cx=(xs.start+xs.stop)/2))
 assert len(objects)==12,(id,len(objects));objects.sort(key=lambda o:o['cy']);ordered=[]
 for row in range(3):ordered+=sorted(objects[row*4:row*4+4],key=lambda o:o['cx'])
 scale=height/float(np.median([o['box'][3]-o['box'][1]for o in ordered[:8]]))
 grounds=[max(o['box'][3]for o in ordered[row*4:row*4+4])for row in range(3)]
 frames=[]
 for i,o in enumerate(ordered):
  l,t,r,b=o['box'];mask=labels==o['k'];a=rgba.copy();a[:,:,3]=np.where(mask,255,0).astype('uint8');crop=Image.fromarray(a).crop((l,t,r,b));hh=b-t
  # Locate the bald head rather than the gun above it or a protruding stride.
  skin=mask&(rgba[:,:,0]>110)&(rgba[:,:,1]>60)&(rgba[:,:,0]>rgba[:,:,1]*1.22)&(rgba[:,:,1]>rgba[:,:,2]*1.1)
  skin[:t]=False;skin[t+int(hh*.35):]=False
  sl,sn=label(skin);sc=np.bincount(sl.ravel());sc[0]=0;sy,sx=np.where(sl==np.argmax(sc));head=float(np.median(sx))if len(sx)else(l+r)/2
  sized=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.NEAREST)
  ground=grounds[i//4]if i<8 else b
  x=round(65+(l-head)*scale);y=round(111+(t-ground)*scale);cell=Image.new('RGBA',(W,H));cell.alpha_composite(sized,(x,y));bounds=cell.getbbox();assert bounds and bounds[0]>0 and bounds[2]<W and bounds[1]>0 and bounds[3]<H,(id,i,bounds)
  yy,xx=np.where(mask);upper=yy<t+hh*.6;xx=xx[upper];yy=yy[upper]
  if id=='SSE':muzzle=front_muzzles[i]
  elif id=='MSE':near=xx>=max(xx)-2;muzzle=(float(np.mean(xx[near])),float(np.median(yy[near])))
  else:
   a=math.radians(degrees);proj=xx*math.cos(a)+yy*math.sin(a);near=proj>=max(proj)-2;muzzle=(float(np.mean(xx[near])),float(np.mean(yy[near])))
  def local(p):return[x+(p[0]-l)*sized.width/crop.width,y+(p[1]-t)*sized.height/crop.height]
  stage=0 if i<8 else [0,2,3,4][i-8]
  marks=dict(muzzle=local(muzzle),rearHand=local((head,t+hh*.38)),frontHand=local((head+(muzzle[0]-head)*.6,t+hh*.42)),hip=local((head,t+hh*([.61,.64,.68,.76,.84][stage]))))
  row=10+view_index*2+(i>=8);column=i if i<8 else [0,2,3,4][i-8];ax=column*W;ay=row*H;atlas.alpha_composite(cell,(ax,ay));record=dict(x=ax,y=ay,w=W,h=H,**marks);frames.append(record)
  summary.append(dict(view=id,index=i,bounds=bounds,muzzle=marks['muzzle'],scale=scale))
 view=dict(angle=math.radians(degrees),mirrorId=mirror,run=frames[:8],split=[frames[8],frames[8],frames[9],frames[10],frames[11]])
 data['views'][id]=view
atlas.save(ROOT/'dist/assets/toma-whole-v6.png',optimize=True);data['image']='toma-whole-v6.png'
metadata.write_text('/* Complete connected illustrated figures. No body parts are assembled. */\nexport const HERO_FRAMES = '+json.dumps(data,separators=(',',':'))+';\n')
(ROOT/'art/source/toma-turns/registration.json').write_text(json.dumps(summary,indent=2)+'\n')
assert atlas.crop((0,0,*original.size)).tobytes()==original.tobytes()
print('14 directions, 104 full-frame entries; v5 source pixels preserved; RGBA atlas',atlas.size)
