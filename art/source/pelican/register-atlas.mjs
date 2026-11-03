/** Register intact whole-body paintings. No repainting, limb assembly or deformation. */
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const source=await loadImage(resolve(here,'poses-transparent-source.png'));
const cell=362,anchor=[181,332];
if(source.width!==cell*4||source.height!==cell*3)throw new Error('Unexpected pelican atlas dimensions');
const feet=[323,324,323,323,323,320,305,320,306,307,309,307];
const torsoX=[195,177,180,174,186,181,185,183,184,173,182,184];
const names=['walk0','walk1','walk2','walk3','idle','hug-warning','hug','zodiac','tarot-warning','tarot','recover','hurt'];
const atlas=createCanvas(cell*4,cell*3),ctx=atlas.getContext('2d'),frames=[];
for(let i=0;i<12;i++){
 const x=i%4*cell,y=Math.floor(i/4)*cell,dx=anchor[0]-torsoX[i],dy=anchor[1]-feet[i];
 ctx.save();ctx.beginPath();ctx.rect(x,y,cell,cell);ctx.clip();ctx.drawImage(source,x,y,cell,cell,x+dx,y+dy,cell,cell);ctx.restore();
 frames.push({index:i,name:names[i],rect:[x,y,cell,cell],anchor,sourceAnchor:[torsoX[i],feet[i]],translation:[dx,dy]});
}
writeFileSync(resolve(here,'../../../dist/assets/pelican-poses.png'),atlas.toBuffer('image/png'));
writeFileSync(resolve(here,'atlas-metadata.json'),JSON.stringify({image:'dist/assets/pelican-poses.png',columns:4,rows:3,cell:[cell,cell],anchor,renderSize:[160,160],frames,note:'Each frame is one intact whole-body painting. Registration applies whole-cell translation only.'},null,2)+'\n');
const preview=createCanvas(640,480),p=preview.getContext('2d');p.fillStyle='#292237';p.fillRect(0,0,640,480);p.drawImage(atlas,0,0,640,480);
for(let i=0;i<12;i++){const x=i%4*160,y=Math.floor(i/4)*160;p.fillStyle='#ffdf8f';p.font='11px sans-serif';p.fillText(names[i],x+6,y+14);p.strokeStyle='#fff3';p.beginPath();p.moveTo(x,y+anchor[1]*160/cell);p.lineTo(x+160,y+anchor[1]*160/cell);p.stroke();}
writeFileSync(resolve(here,'registered-preview.png'),preview.toBuffer('image/png'));
console.log(JSON.stringify({frames:12,cell,anchor,output:'dist/assets/pelican-poses.png'}));
