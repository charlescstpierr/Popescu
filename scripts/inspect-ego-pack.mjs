import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
// Pack complete transparent drawings. No segmentation, recoloring or alpha edits.
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(process.env.POPESCU_CANVAS_MODULE||'@napi-rs/canvas');
const source=process.argv[2],output=process.argv[3];assert.ok(source&&output,'source and output PNG paths required');
const image=await loadImage(source),input=createCanvas(image.width,image.height),ic=input.getContext('2d');ic.drawImage(image,0,0);
const atlas=createCanvas(1024,1024),ctx=atlas.getContext('2d'),frames=[];ctx.imageSmoothingEnabled=true;
for(let row=0;row<4;row++){
 const cells=[];
 for(let col=0;col<4;col++){
  const x=Math.round(col*image.width/4),y=Math.round(row*image.height/4),w=Math.round((col+1)*image.width/4)-x,h=Math.round((row+1)*image.height/4)-y,pixels=ic.getImageData(x,y,w,h).data;let left=w,top=h,right=0,bottom=0,paint=0,opaque=0;
  for(let py=0;py<h;py++)for(let px=0;px<w;px++){const a=pixels[(py*w+px)*4+3];if(a>32){left=Math.min(left,px);top=Math.min(top,py);right=Math.max(right,px+1);bottom=Math.max(bottom,py+1);paint++;if(a>=250)opaque++;}}
  assert.ok(paint>1000,`visible frame ${row}/${col}`);assert.ok(opaque/paint>.7,`opaque animal interiors ${row}/${col}: ${opaque/paint}`);assert.ok(left>3&&top>3&&right<w-3&&bottom<h-3,`uncropped body ${row}/${col}`);
  cells.push({row,col,x:x+left,y:y+top,w:right-left,h:bottom-top,opaqueRatio:opaque/paint});
 }
 const scale=Math.min(...cells.map(f=>Math.min(216/f.w,216/f.h)));
 for(const f of cells){const w=f.w*scale,h=f.h*scale,dx=f.col*256+(256-w)/2,dy=row*256+240-h;ctx.drawImage(image,f.x,f.y,f.w,f.h,dx,dy,w,h);frames.push({...f,scale,destination:{x:dx,y:dy,w,h}});}
}
mkdirSync(dirname(resolve(output)),{recursive:true});writeFileSync(output,atlas.toBuffer('image/png'));if(process.argv[4])writeFileSync(process.argv[4],JSON.stringify({source,cell:256,baseline:240,frames},null,2));console.log(output);
