import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
let createCanvas,loadImage;
try { ({createCanvas,loadImage}=await import('@napi-rs/canvas')); } catch {}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('reference redesign preserves rank 1 pixel for pixel and six whole frames per changed rank',{skip:!createCanvas?'optional @napi-rs/canvas is unavailable':false},async()=>{
 const image=await loadImage(new URL('../dist/assets/companion-levels-whole.png',import.meta.url).pathname);
 const canvas=createCanvas(768,640),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
 // Compare original immutable RGBA pixels through the same Canvas decoder.
 const expected=['701db54f55c6ac11cf1ef8538747172d5ec1fff8bcd891d90305f5dfcf8030b7'];
 for(let row=0;row<1;row++) assert.equal(sha(ctx.getImageData(0,row*128,768,128).data),expected[row]);
 for(let rank=2;rank<=5;rank++){
  const poses=[];
  for(let pose=0;pose<6;pose++){
   const pixels=ctx.getImageData(pose*128,(rank-1)*128,128,128).data;poses.push(sha(pixels));
   let count=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(pixels[(y*128+x)*4+3]>=32){count++;assert(x>0&&x<127&&y>0&&y<127,'figure stays inside its cell');}
   assert(count>1500,'a complete visible figure occupies each cell');
  }
  assert.equal(new Set(poses).size,6,'all six frames differ');
 }

});
test('copy explicitly describes different women rather than one transforming woman',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const content=readFileSync(new URL('../dist/content.js',import.meta.url),'utf8');
 assert(!app.includes('La même Blonde IA'));assert(content.includes('Cinq femmes différentes'));
});
