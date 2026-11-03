/** Mechanical registration of eight complete painted poses. No body rotation, warping, limb assembly or repainting. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const here=path.dirname(fileURLToPath(import.meta.url));
const src=path.join(here,'poses-transparent-source.png');
const source=await loadImage(src);
if(source.width!==1774||source.height!==887)throw new Error('Unexpected source size');
const labels=['E','SE','S','SW','W','NW','N','NE'];
const rects=[[0,0,444,444],[444,0,443,444],[887,0,444,444],[1331,0,443,444],[0,444,444,443],[444,444,443,443],[887,444,444,443],[1331,444,443,443]];
// Visual measurements relative to each source rectangle. Foot anchor is the horizontal
// midpoint between boot contacts and the lower boot's baseline. N head excludes tail.
const feet=[[194,389],[182,386],[226,377],[252,391],[244,392],[247,391],[224,400],[202,389]];
const headY=[63,62,57,58,62,71,118,83];
const roots=[[250,247],[210,247],[226,251],[221,247],[200,241],[211,239],[222,250],[215,251]];
const tips=[[425,250],[366,371],[226,409],[72,376],[33,240],[53,106],[221,20],[367,72]];
const cell=[200,200],anchor=[100,174],bodyHeight=110;
const atlas=createCanvas(800,400),ctx=atlas.getContext('2d');
ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
const frames=[];
const r=n=>Number(n.toFixed(3));
for(let i=0;i<8;i++){
 const [sx,sy,sw,sh]=rects[i],scale=bodyHeight/(feet[i][1]-headY[i]);
 const col=i%4,row=i>>2,tx=anchor[0]-feet[i][0]*scale,ty=anchor[1]-feet[i][1]*scale;
 ctx.save();ctx.beginPath();ctx.rect(col*200,row*200,200,200);ctx.clip();
 ctx.drawImage(source,sx,sy,sw,sh,col*200+tx,row*200+ty,sw*scale,sh*scale);ctx.restore();
 const point=p=>[r(p[0]*scale+tx),r(p[1]*scale+ty)];
 const offset=p=>[r((p[0]-feet[i][0])*scale),r((p[1]-feet[i][1])*scale)];
 frames.push({index:i,name:labels[i],rect:[col*200,row*200,200,200],anchor,bodyHeight,headY:64,sourceRect:rects[i],sourceFoot:feet[i],sourceHeadY:headY[i],scale:r(scale),translation:[r(tx),r(ty)],tailRoot:point(roots[i]),tailTip:point(tips[i]),tailRootOffset:offset(roots[i]),tailTipOffset:offset(tips[i]),tailRootOccluded:i>=5,paintedTailAngleRadians:r(Math.atan2(tips[i][1]-roots[i][1],tips[i][0]-roots[i][0]))});
}
// Validate every alpha component stays within its cell with no occupied edge pixels.
for(let i=0;i<8;i++){
 const data=ctx.getImageData((i%4)*200,(i>>2)*200,200,200).data;
 let l=200,t=200,rr=-1,b=-1,n=0,edge=0;
 for(let y=0;y<200;y++)for(let x=0;x<200;x++)if(data[(y*200+x)*4+3]>8){l=Math.min(l,x);t=Math.min(t,y);rr=Math.max(rr,x);b=Math.max(b,y);n++;if(x===0||x===199||y===0||y===199)edge++;}
 if(edge||!n)throw new Error(`Clipped or empty frame ${labels[i]}`);
 frames[i].alphaBounds=[l,t,rr-l+1,b-t+1];frames[i].occupiedPixelCount=n;
}
const target=path.resolve(here,'../../../dist/assets/travestia-dash.png');
fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,atlas.toBuffer('image/png'));
const metadata={image:'dist/assets/travestia-dash.png',width:800,height:400,columns:4,rows:2,cell,anchor,renderSize:cell,renderAnchor:anchor,bodyHeight,source:'art/source/travestia-dash/poses-transparent-source.png',sourceSha256:createHash('sha256').update(fs.readFileSync(src)).digest('hex'),generation:'Built-in image_gen, transparent background, approved identity and mockup references.',note:'All eight entries are independently painted complete characters. Mechanical source-cell crop, uniform whole-pose scaling and translation only. No runtime body rotation. Direction labels describe tail/travel direction; body faces the opposite direction. Tail offsets are screen-space from floor anchor. North root is occluded by body; its tail tip rises above the head. Root points on NW/N/NE are inferred behind the body, not detached rendered parts.',frames};
fs.writeFileSync(path.join(here,'atlas-metadata.json'),JSON.stringify(metadata,null,2)+'\n');
const qa=createCanvas(800,400),q=qa.getContext('2d');q.fillStyle='#38253f';q.fillRect(0,0,800,400);q.drawImage(atlas,0,0);
q.font='12px sans-serif';
for(let i=0;i<8;i++){
 const x=i%4*200,y=(i>>2)*200;
 q.strokeStyle='#ffffff40';q.strokeRect(x+.5,y+.5,199,199);q.beginPath();q.moveTo(x,y+174.5);q.lineTo(x+200,y+174.5);q.stroke();
 q.fillStyle='#fff';q.fillText(`${labels[i]} • 110 px body`,x+7,y+16);
 q.strokeStyle='#65ffee';q.beginPath();q.moveTo(x+97,y+174);q.lineTo(x+103,y+174);q.moveTo(x+100,y+171);q.lineTo(x+100,y+177);q.stroke();
}
fs.writeFileSync(path.join(here,'registered-preview.png'),qa.toBuffer('image/png'));
console.log(JSON.stringify({target,cell,anchor,bodyHeight,frames:frames.map(({name,tailRootOffset,tailTipOffset,alphaBounds,scale})=>({name,tailRootOffset,tailTipOffset,alphaBounds,scale}))},null,2));
