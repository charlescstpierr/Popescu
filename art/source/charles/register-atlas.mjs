/** Pack intact generated paintings. No detached limbs, rotation or distortion. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const here=path.dirname(fileURLToPath(import.meta.url));
const sourcePath=path.join(here,'poses-transparent-source.png');
const source=await loadImage(sourcePath);
if(source.width!==1254||source.height!==1254)throw new Error('Unexpected Charles source size');
const size=176,scale=.26,baseline=160,anchorX=88;
const definitions=[
 {name:'float',cell:[0,0],anchor:[229,561],eyes:[[223,121.5],[241,121.5]]},
 {name:'planted',cell:[1,0],anchor:[640,557],eyes:[[633,134.5]]},
 {name:'bend',cell:[2,0],anchor:[1022,544],eyes:[[1090,251],[1111,252]]},
 {name:'scream',cell:[0,1],anchor:[251,1149],eyes:[[258,777]]},
 {name:'empowered',cell:[1,1],anchor:[633,1159],eyes:[[638,723]]},
];
const atlas=createCanvas(size*5,size),ctx=atlas.getContext('2d');
ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
const frames=[];
for(let i=0;i<definitions.length;i++){
 const f=definitions[i],sx=f.cell[0]*418,sy=f.cell[1]*627,sw=418,sh=627;
 const dx=anchorX-(f.anchor[0]-sx)*scale,dy=baseline-(f.anchor[1]-sy)*scale;
 ctx.save();ctx.beginPath();ctx.rect(i*size,0,size,size);ctx.clip();
 ctx.drawImage(source,sx,sy,sw,sh,i*size+dx,dy,sw*scale,sh*scale);ctx.restore();
 frames.push({index:i,name:f.name,sourceRect:[sx,sy,sw,sh],sourceAnchor:f.anchor,scale,translation:[dx,dy],eyes:f.eyes.map(([x,y])=>[+(anchorX+(x-f.anchor[0])*scale).toFixed(2),+(baseline+(y-f.anchor[1])*scale).toFixed(2)])});
}
const target=path.resolve(here,'../../../dist/assets/charles-whole-v1.png');
fs.writeFileSync(target,atlas.toBuffer('image/png'));
fs.writeFileSync(path.join(here,'atlas-metadata.json'),JSON.stringify({image:'dist/assets/charles-whole-v1.png',width:size*5,height:size,columns:5,rows:1,cell:size,anchor:[anchorX,baseline],source:'art/source/charles/poses-transparent-source.png',sourceSha256:createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex'),generation:'Built-in image_gen, approved Charles identity and transformation storyboard references. Layout edit only for transparent gutters.',registration:'Five intact whole-body paintings with one uniform 0.26 scale. Runtime only translates each whole frame, without body rotation, limbs or warping.',frames},null,2)+'\n');
console.log(target);
