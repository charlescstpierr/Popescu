#!/usr/bin/env python3
"""Pack the user-approved illustrations without regenerating or repainting them."""
import argparse
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--master',type=Path,default=Path('/workspace/scratch/774596b9731f/generated_images/exec-b2f726dc-91d7-4d4e-8482-b992ffb0727c.png'))
parser.add_argument('--directions',type=Path,default=Path('/workspace/scratch/774596b9731f/generated_images/exec-96b21933-efa7-48a6-bb08-6bea4aa6abeb.png'))
args=parser.parse_args()
master=Image.open(args.master).convert('RGBA')
directions=Image.open(args.directions).convert('RGBA')
assets=ROOT/'dist/assets';assets.mkdir(exist_ok=True)

def masked(image,points):
    mask=Image.new('L',image.size);ImageDraw.Draw(mask).polygon(points,fill=255)
    layer=image.copy();layer.putalpha(Image.composite(image.getchannel('A'),Image.new('L',image.size),mask));return layer

def xy(p):return {'x':p[0],'y':p[1]}

# Every head, torso, arm, hand and rifle remains a single original illustration.
specs=[
 dict(id='E',image=masked(master,[(70,90),(620,90),(620,544),(70,544)]),hip=(290,535),muzzle=(602,306),angle=0,scale=.122,head=(293,193),chest=(288,386),neck=(303,291),hands={'main':(381,364),'support':(505,344)},arms={'main':[(180,330),(252,404),(381,364)],'support':[(357,457),(435,406),(505,344)]}),
 dict(id='SE',image=directions.crop((0,0,656,599)),hip=(329,523),muzzle=(544,465),angle=34,scale=53.5/453,head=(323,171),chest=(314,373),neck=(339,287),hands={'main':(330,386),'support':(430,429)},arms={'main':[(193,307),(240,379),(330,386)],'support':[(404,449),(455,462),(430,429)]}),
 dict(id='S',image=directions.crop((656,0,1312,599)),hip=(310,531),muzzle=(303,516),angle=90,scale=53.5/461,head=(315,174),chest=(306,363),neck=(312,285),hands={'main':(245,381),'support':(312,456)},arms={'main':[(180,315),(206,391),(245,381)],'support':[(421,332),(397,447),(312,456)]}),
 dict(id='NE',image=directions.crop((0,599,656,1199)),hip=(337,530),muzzle=(565,158),angle=-30,scale=53.5/440,head=(300,183),chest=(329,360),neck=(332,283),hands={'main':(434,285),'support':(493,248)},arms={'main':[(233,348),(325,378),(434,285)],'support':[(433,390),(495,330),(493,248)]}),
 dict(id='N',image=directions.crop((656,599,1312,1199)),hip=(329,533),muzzle=(369,67),angle=-90,scale=53.5/472,head=(314,211),chest=(328,383),neck=(324,300),hands={'main':(405,247),'support':(380,195)},arms={'main':[(434,354),(450,283),(405,247)],'support':[(240,357),(303,284),(380,195)]})
]
upper=Image.new('RGBA',(480,320));views=[]
for i,s in enumerate(specs):
    scale=s['scale']*2;hx,hy=s['hip'];ax,ay=64,128
    frame=s['image'].transform((160,160),Image.Transform.AFFINE,(1/scale,0,hx-ax/scale,0,1/scale,hy-ay/scale),Image.Resampling.NEAREST)
    upper.alpha_composite(frame,(i%3*160,i//3*160))
    local=lambda p:xy((ax+(p[0]-hx)*scale,ay+(p[1]-hy)*scale))
    views.append(dict(id=s['id'],frame=dict(x=i%3*160,y=i//3*160,w=160,h=160),hip=xy((ax,ay)),muzzle=local(s['muzzle']),angle=s['angle']*math.pi/180,head=local(s['head']),chest=local(s['chest']),neck=local(s['neck']),hands={k:local(p)for k,p in s['hands'].items()},arms={k:[local(p)for p in ps]for k,ps in s['arms'].items()},sourceScale=s['scale']))
upper.save(assets/'toma-approved-upper-v4.png',optimize=True)
# A decoded pixel copy of the same complete upper illustration also gives the
# renderer a faithful two-handed fallback when image loading is unavailable.
fallback=upper.resize((240,160),Image.Resampling.NEAREST).quantize(colors=96,method=Image.Quantize.FASTOCTREE).convert('RGBA')
palette=[]
for i,view in enumerate(views):
    tile=fallback.crop((i%3*80,i//3*80,i%3*80+80,i//3*80+80));rows=[]
    for y in range(80):
        x=0
        while x<80:
            pixel=tile.getpixel((x,y))
            if pixel[3]<128:x+=1;continue
            color='#%02x%02x%02x'%pixel[:3]
            if color not in palette:palette.append(color)
            end=x+1
            while end<80 and tile.getpixel((end,y))==pixel:end+=1
            rows.append([y,x,end-x,palette.index(color)]);x=end
    view['fallback']={'hip':xy((32,64)),'rows':rows}

# The pants, creases and boots are extracted from the approved stance. These
# illustrated pieces articulate at their recorded joints, with no painted limbs.
legs=Image.new('RGBA',(384,256));pieces=[]
legspec=[
 ('leftThigh',(246,550),(179,659),[(178,526),(290,531),(306,568),(228,673),(146,678),(148,613)]),
 ('leftShin',(179,659),(133,764),[(144,622),(228,652),(184,716),(172,771),(91,780),(109,706)]),
 ('leftBoot',(135,763),(136,804),[(86,744),(176,741),(184,817),(82,819)]),
 ('rightThigh',(334,550),(395,651),[(290,529),(386,527),(441,627),(441,670),(354,685),(286,575)]),
 ('rightShin',(395,651),(388,764),[(352,630),(444,627),(435,711),(429,779),(344,780),(333,709)]),
 ('rightBoot',(388,764),(430,803),[(332,741),(430,741),(489,785),(488,822),(326,822)])
]
for i,(name,a,b,polygon)in enumerate(legspec):
    layer=masked(master,polygon);scale=.22;ax,ay=64,32
    # Keep the native illustrated angle. The renderer maps this recorded bone
    # onto the animated leg, preserving the width and the original texture.
    frame=layer.transform((128,128),Image.Transform.AFFINE,(1/scale,0,a[0]-ax/scale,0,1/scale,a[1]-ay/scale),Image.Resampling.NEAREST)
    legs.alpha_composite(frame,(i%3*128,i//3*128))
    pieces.append(dict(id=name,frame=dict(x=i%3*128,y=i//3*128,w=128,h=128),start=xy((ax,ay)),end=xy((ax+(b[0]-a[0])*scale,ay+(b[1]-a[1])*scale)),scale=.5))
legs.save(assets/'toma-approved-legs-v4.png',optimize=True)

# At full extension use the complete approved lower-body painting, including
# the boots and every fold, instead of stretching the torso or rifle.
split_poly=[(624,648),(699,648),(738,712),(890,701),(960,692),(1015,701),(1070,731),(1125,746),(1197,731),(1260,704),(1355,703),(1480,724),(1510,648),(1618,648),(1618,825),(624,825)]
split_source=masked(master,split_poly);split_scale=.112;split_hip=(1125,746);ax,ay=128,35
split=split_source.transform((256,64),Image.Transform.AFFINE,(1/(2*split_scale),0,split_hip[0]-ax/(2*split_scale),0,1/(2*split_scale),split_hip[1]-ay/(2*split_scale)),Image.Resampling.NEAREST)
split.save(assets/'toma-approved-split-v4.png',optimize=True)
model={'pixelScale':.5,'views':views,'fallbackPalette':palette,'legPieces':pieces,'split':{'hip':xy((128,35)),'scale':.5,'width':256,'height':64}}
(ROOT/'dist/hero-model.js').write_text('/* Registered source pixels from the user-approved Toma illustrations. */\nexport const HERO_MODEL = '+json.dumps(model,separators=(',',':'))+';\nexport const HERO_VIEWS = HERO_MODEL.views;\n')
print('Packed five approved upper views, six textured leg parts and the approved full split.')
