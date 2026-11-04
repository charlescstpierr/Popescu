/** Contact sheet from the actual runtime artist, at native size and 2×. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {CharlesArt} from '../../../dist/charles-art.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const art=new CharlesArt({loadImage:src=>loadImage(fileURLToPath(src))});
if(!await art.ready)throw new Error('Charles atlas did not load');
const canvas=createCanvas(1070,680),ctx=canvas.getContext('2d');
ctx.fillStyle='#21132f';ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.fillStyle='#dfc5ef';ctx.font='14px sans-serif';ctx.fillText('Native game size',20,25);ctx.fillText('2× inspection of the same renderer',20,300);
const phases=['hover','descend','bend','scream','empowered'];
for(let i=0;i<phases.length;i++){
 const x=105+i*210;
 ctx.strokeStyle='#614369';ctx.beginPath();ctx.moveTo(x-90,237);ctx.lineTo(x+90,237);ctx.stroke();
 const actor={x,y:237,phase:phases[i],phaseTime:phases[i]==='descend'?0:1,phaseDuration:1,elapsed:0,powered:false,hits:0};
 art.draw(ctx,actor,0,true);
 ctx.fillStyle='#ffdd8a';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(phases[i],x,268);
 ctx.save();ctx.translate(x-140,420);ctx.scale(2,2);art.draw(ctx,{...actor,x:70,y:110},0,true);ctx.restore();
}
const target=path.join(here,'native-pose-review.png');fs.writeFileSync(target,canvas.toBuffer('image/png'));console.log(target);
