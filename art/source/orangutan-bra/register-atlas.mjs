/** Register eight complete costume-edited poses. Crop, uniform scale and translation only. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const here=path.dirname(fileURLToPath(import.meta.url));
const sourcePath=path.join(here,'poses-transparent-source.png'),source=await loadImage(sourcePath);
if(source.width!==1774||source.height!==887)throw new Error('Unexpected source size');
// Original atlas bounds (alpha > 32). Preserve each view's original height, center and floor.
const targets=[[11,10,116,120],[10,10,117,120],[11,15,115,120],[7,13,119,120],[10,9,116,120],[9,9,117,120],[12,12,115,120],[7,12,119,120]];
const input=createCanvas(source.width,source.height),ic=input.getContext('2d');ic.drawImage(source,0,0);
const atlas=createCanvas(512,256),ctx=atlas.getContext('2d'),frames=[];
ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
for(let i=0;i<8;i++){
 const col=i%4,row=i>>2,sx=Math.round(col*source.width/4),sy=Math.round(row*source.height/2),sw=Math.round((col+1)*source.width/4)-sx,sh=Math.round((row+1)*source.height/2)-sy;
 const p=ic.getImageData(sx,sy,sw,sh).data;let l=sw,t=sh,r=-1,b=-1;
 for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(p[(y*sw+x)*4+3]>32){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
 const [tl,tt,tr,tb]=targets[i],scale=(tb-tt+1)/(b-t+1),dx=(tl+tr+1)/2-(l+r+1)/2*scale,dy=121-(b+1)*scale;
 ctx.save();ctx.beginPath();ctx.rect(col*128,row*128,128,128);ctx.clip();ctx.drawImage(source,sx,sy,sw,sh,col*128+dx,row*128+dy,sw*scale,sh*scale);ctx.restore();
 frames.push({index:i,view:row?'back':'front',sourceRect:[sx,sy,sw,sh],sourceBounds:[l,t,r,b],targetBounds:targets[i],scale,translation:[dx,dy]});
}
const target=path.resolve(here,'../../../dist/assets/orangutan-walk-v3.png');
fs.writeFileSync(target,atlas.toBuffer('image/png'));
fs.writeFileSync(path.join(here,'atlas-metadata.json'),JSON.stringify({image:'dist/assets/orangutan-walk-v3.png',width:512,height:256,columns:4,rows:2,cell:128,baseline:121,source:'art/source/orangutan-bra/poses-transparent-source.png',sourceSha256:createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex'),generation:'Built-in image_gen costume edit of existing orangutan atlas using the approved pink-bra mockup.',registration:'Whole painted frames only; uniform per-frame scaling and translation preserve original body height and foot baseline. Runtime path, atlas size, renderer and cache unchanged.',frames},null,2)+'\n');
console.log(target);
