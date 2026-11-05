"""Register twelve whole paintings with uniform scale and translation only."""
from pathlib import Path
from PIL import Image, ImageDraw
import json,hashlib
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
source=Image.open(HERE/'poses-transparent-source.png').convert('RGBA')
assert source.size==(1448,1086)
names=['flight0','flight1','flight2','brake0','brake1','settle','hover0','hover1','raise','prepare','snap','recoil']
anchors=[(154,330),(510,330),(860,330),(1245,340),(190,691),(548,690),(902,690),(1257,691),(198,1054),(549,1054),(902,1054),(1255,1054)]
eyes=[[(245,65),(256,66)],[(600,65),(611,66)],[(953,65),(965,65)],[(1306,65),(1318,65)],[(205,414),(215,414)],[(554,414),(565,414)],[(905,414),(916,414)],[(1258,414),(1269,414)],[(202,778),(212,778)],[(553,778),(563,778)],[(906,779),(916,779)],[(1258,778),(1268,778)]]
hands={8:(158,842),9:(499,802),10:(834,800),11:(1182,812)}
cell=176; scale=.42; atlas=Image.new('RGBA',(704,528)); frames=[];checks=[]
for i,name in enumerate(names):
 sx=(i%4)*362; sy=(i//4)*362
 anchor=anchors[i]
 # Entire source square is sampled together. No body-part separation or deformation.
 crop=source.crop((sx,sy,sx+362,sy+362))
 resized=crop.resize((152,152),Image.Resampling.LANCZOS)
 effective=152/362
 dx=round(88-(anchor[0]-sx)*effective);dy=round(160-(anchor[1]-sy)*effective)
 native=Image.new('RGBA',(cell,cell));native.alpha_composite(resized,(dx,dy))
 # Quantize sub-visible interpolation dust (alpha 1/255) to transparent.
 native.putalpha(native.getchannel('A').point(lambda a: 0 if a<=1 else a))
 def local(p):return [round(dx+(p[0]-sx)*effective,3),round(dy+(p[1]-sy)*effective,3)]
 frame={'name':name,'x':(i%4)*cell,'y':(i//4)*cell,'w':cell,'h':cell,'anchor':[88,160],'eyes':[local(p) for p in eyes[i]],'hand':local(hands[i]) if i in hands else None}
 frames.append(frame);atlas.alpha_composite(native,(frame['x'],frame['y']))
 alpha=native.getchannel('A'); edge=list(alpha.crop((0,0,176,1)).getdata())+list(alpha.crop((0,175,176,176)).getdata())+list(alpha.crop((0,0,1,176)).getdata())+list(alpha.crop((175,0,176,176)).getdata())
 checks.append({'name':name,'bounds':alpha.getbbox(),'transparentCellBorders':max(edge)==0,'sourceRect':[sx,sy,362,362],'sourceAnchor':anchor,'sourceEyes':eyes[i],'sourceHand':hands.get(i),'scale':effective,'translation':[dx,dy]})
atlas_path=ROOT/'dist/assets/charles-motion-v1.png';atlas.save(atlas_path)
data={'cell':176,'columns':4,'rows':3,'anchor':[88,160],'frames':frames}
(ROOT/'dist/charles-motion-frames.js').write_text('// Twelve complete paintings; no assembled or transformed anatomy. Generated metadata.\nexport const CHARLES_MOTION_FRAMES=Object.freeze('+json.dumps(data,separators=(',',':'))+');\n')
metadata={**data,'image':'dist/assets/charles-motion-v1.png','source':'art/source/charles-motion/poses-transparent-source.png','sourceSha256':hashlib.sha256((HERE/'poses-transparent-source.png').read_bytes()).hexdigest(),'atlasSha256':hashlib.sha256(atlas_path.read_bytes()).hexdigest(),'registration':'Uniform resize 152/362 and integer translation only. Whole square contains full intact painting. No rotations, limb edits or recoloring.','checks':checks}
(HERE/'atlas-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
proof=Image.new('RGB',(1056,1000),'#241b31');d=ImageDraw.Draw(proof)
for i,f in enumerate(frames):
 x=(i%4)*264+20;y=(i//4)*310+25
 p=atlas.crop((f['x'],f['y'],f['x']+176,f['y']+176)).resize((246,246),Image.Resampling.NEAREST)
 proof.paste(p,(x,y),p);d.text((x+10,y+255),f['name'],fill='#ead8aa')
d.text((20,966),'Whole-body pose registration proof (not gameplay). Uniform source scale, common foot anchor.',fill='#ead8aa');proof.save(HERE/'native-pose-review.png')
print(json.dumps({'frames':frames,'checks':checks},indent=2))
