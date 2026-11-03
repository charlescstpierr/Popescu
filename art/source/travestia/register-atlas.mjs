/** Mechanical full-pose registration only. No repainting, limb assembly or deformation. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
const here = path.dirname(fileURLToPath(import.meta.url));
const cell = 362;
const sourceFeetY = [322,321,321,318,312,311,311,311,315,318,316,318];
const labels = ['run0','run1','run2','run3','idle','turn','windup','spin0','spin1','spin2','recover','hurt'];
const anchor = [181,332];
const source = await loadImage(path.join(here, 'poses-transparent-source.png'));
if (source.width !== cell * 4 || source.height !== cell * 3) throw new Error('Unexpected source dimensions');
const atlas = createCanvas(cell * 4, cell * 3);
const ctx = atlas.getContext('2d');
const frames = [];
for (let i = 0; i < 12; i++) {
  const x = (i % 4) * cell, y = Math.floor(i / 4) * cell;
  const dy = anchor[1] - sourceFeetY[i];
  ctx.save();
  ctx.beginPath();ctx.rect(x, y, cell, cell);ctx.clip();
  ctx.drawImage(source, x, y, cell, cell, x, y + dy, cell, cell);
  ctx.restore();
  frames.push({index:i,name:labels[i],rect:[x,y,cell,cell],anchor,sourceFoot:[181,sourceFeetY[i]],translation:[0,dy]});
}
const target = path.resolve(here, '../../../dist/assets/travestia-poses.png');
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target, atlas.toBuffer('image/png'));
fs.writeFileSync(path.join(here,'atlas-metadata.json'), JSON.stringify({image:'dist/assets/travestia-poses.png',width:1448,height:1086,columns:4,rows:3,cell:[cell,cell],anchor,renderSize:[144,144],renderAnchor:[72,132],note:'Every cell is a single complete pose. Original art is unchanged except imagegen background extraction and whole-cell vertical translation. Render anchor differs from exact scaled anchor by less than 0.07 px.',frames},null,2)+'\n');
const qa=createCanvas(576,432), q=qa.getContext('2d');
q.fillStyle='#38253f';q.fillRect(0,0,576,432);
q.drawImage(atlas,0,0,576,432);
for(let i=0;i<12;i++){const x=(i%4)*144,y=Math.floor(i/4)*144;q.strokeStyle='#ffffff33';q.beginPath();q.moveTo(x,y+132);q.lineTo(x+144,y+132);q.stroke();q.fillStyle='#fff';q.font='9px sans-serif';q.fillText(labels[i],x+5,y+10);}
fs.writeFileSync(path.join(here,'registered-preview.png'),qa.toBuffer('image/png'));
console.log(JSON.stringify({target,width:atlas.width,height:atlas.height,anchor,frames},null,2));
