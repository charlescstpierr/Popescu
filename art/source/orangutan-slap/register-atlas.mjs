/** Register whole painted poses only: crop, one global uniform scale, translation. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const file=path.join(here,'poses-transparent-source-v2.png');
const source=await loadImage(file);
assert.equal(source.width,1774);assert.equal(source.height,887);
const input=createCanvas(source.width,source.height),ic=input.getContext('2d');ic.drawImage(source,0,0);
const atlas=createCanvas(640,256),ctx=atlas.getContext('2d');
const cuts=[0,443,920,1331,1774];
// Foot-pair midpoints measured on the complete source painting, not silhouette centers.
const footX=[200,581,1051,1487,194,630,1056,1477];
const scale=111/400,frames=[];
for(let i=0;i<8;i++){
 const col=i%4,row=i>>2,sx=cuts[col],sy=row?444:0,sw=cuts[col+1]-sx,sh=row?443:444;
 const rgba=ic.getImageData(sx,sy,sw,sh).data;let l=sw,t=sh,r=-1,b=-1;
 for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(rgba[(y*sw+x)*4+3]>32){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
 assert.ok(r>=l&&b>=t);
 const dx=64-(footX[i]-sx)*scale,dy=121-(b+1)*scale;
 assert.ok(l*scale+dx>=0 && (r+1)*scale+dx<160 && t*scale+dy>0);
 ctx.save();ctx.beginPath();ctx.rect(col*160,row*128,160,128);ctx.clip();ctx.drawImage(source,sx,sy,sw,sh,col*160+dx,row*128+dy,sw*scale,sh*scale);ctx.restore();
 frames.push({index:i,view:row?'back':'front',pose:['windup','impact','followThrough','recovery'][col],sourceRect:[sx,sy,sw,sh],sourceBounds:[l,t,r,b],footMidpointX:footX[i],scale,translation:[dx,dy],anchor:[64,121]});
}
const out=path.join(root,'dist/assets');fs.mkdirSync(out,{recursive:true});
const atlasPath=path.join(out,'orangutan-slap-v1.png');fs.writeFileSync(atlasPath,atlas.toBuffer('image/png'));
const previewDir=path.join(root,'qa');fs.mkdirSync(previewDir,{recursive:true});
const preview=createCanvas(4*120,2*104),pc=preview.getContext('2d');pc.fillStyle='#262234';pc.fillRect(0,0,preview.width,preview.height);
for(let i=0;i<8;i++){
 const c=i%4,r=i>>2,x=c*120+8,y=r*104+14;
 pc.strokeStyle='#766b85';pc.beginPath();pc.moveTo(c*120,r*104+14+121*83/128);pc.lineTo((c+1)*120,r*104+14+121*83/128);pc.stroke();
 pc.drawImage(atlas,c*160,r*128,160,128,x,y,160*83/128,83);
 pc.fillStyle='#eee';pc.font='10px sans-serif';pc.fillText(`${r?'back':'front'} ${frames[i].pose}`,c*120+5,r*104+10);
}
fs.writeFileSync(path.join(previewDir,'orangutan-slap-83px-1x.png'),preview.toBuffer('image/png'));
const double=createCanvas(preview.width*2,preview.height*2),dc=double.getContext('2d');dc.imageSmoothingEnabled=false;dc.drawImage(preview,0,0,double.width,double.height);fs.writeFileSync(path.join(previewDir,'orangutan-slap-83px-2x.png'),double.toBuffer('image/png'));
const data=ctx.getImageData(0,0,640,256).data;let transparent=0;for(let p=3;p<data.length;p+=4)if(data[p]===0)transparent++;
assert.ok(transparent>640*256*.5);
for(let i=0;i<8;i++){
 const c=i%4,r=i>>2,a=ctx.getImageData(c*160,r*128,160,128).data;let bottom=-1;
 for(let y=0;y<128;y++)for(let x=0;x<160;x++)if(a[(y*160+x)*4+3]>32){bottom=Math.max(bottom,y);assert.ok(x>0&&x<159&&y>0&&y<127);}
 assert.ok(bottom>=119&&bottom<=121);frames[i].registeredAlphaBottom=bottom;
}
fs.writeFileSync(path.join(here,'atlas-metadata.json'),JSON.stringify({image:'dist/assets/orangutan-slap-v1.png',width:640,height:256,columns:4,rows:2,cellWidth:160,cellHeight:128,anchor:[64,121],runtimeSize:83,runtimeScale:83/128,source:'art/source/orangutan-slap/poses-transparent-source-v2.png',sourceSha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex'),atlasSha256:createHash('sha256').update(fs.readFileSync(atlasPath)).digest('hex'),registration:'Whole poses; constant global uniform scale; foot-pair registration; no limb segmentation or deformation.',transparentPixelFraction:transparent/(640*256),frames},null,2)+'\n');
console.log(JSON.stringify({atlas:atlasPath,frames:frames.length,transparentPixelFraction:transparent/(640*256),floorChecks:'8/8 passed',previews:previewDir}));
