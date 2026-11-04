// Native Canvas proof of the exact gameplay draw path, not a CSS mockup.
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {CompanionArt} from '../dist/companion-art.js';
const out=resolve(process.argv[2]||'proof/companion');mkdirSync(out,{recursive:true});
const art=new CompanionArt({loadImage:path=>loadImage(resolve('dist',path))});await art.ready;
const canvas=createCanvas(750,520),c=canvas.getContext('2d');c.fillStyle='#17152c';c.fillRect(0,0,750,520);
for(let rank=1;rank<=5;rank++){
 c.fillStyle='#ffe4a4';c.font='12px sans-serif';c.fillText(`Rang ${rank}`,8,rank*100-55);
 for(let p=0;p<4;p++){
  const g={x:140+p*157,y:rank*100-13,faceX:p===3?-1:1,faceY:p===2?-1:0,walkMoving:p!==0,walkDistance:p===3?13:0,supportFlash:.5};
  art.draw(c,g,{upg:{girlfriend:rank}},1.2,false);
 }
 const portrait=await loadImage(resolve(`dist/assets/companion-portrait-${rank}.png`));c.drawImage(portrait,65,rank*100-93,42,42);
}
writeFileSync(resolve(out,'native-canvas-contact.png'),canvas.toBuffer('image/png'));
console.log(resolve(out,'native-canvas-contact.png'));
