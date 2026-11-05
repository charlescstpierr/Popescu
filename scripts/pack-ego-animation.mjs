// Register complete generated figures; no repainting, alpha edits or stretching.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(process.env.POPESCU_CANVAS_MODULE||'@napi-rs/canvas');
const [source,output,metadata]=process.argv.slice(2);assert(source&&output&&metadata,'source, output and metadata paths required');
const columns=6,rows=4,cell=256,baseline=240,image=await loadImage(source);assert.equal(image.width/columns,image.height/rows);
const input=createCanvas(image.width,image.height),ic=input.getContext('2d');ic.drawImage(image,0,0);
const atlas=createCanvas(columns*cell,rows*cell),ctx=atlas.getContext('2d'),frames=[];
for(let row=0;row<rows;row++){
 const figures=[];
 for(let col=0;col<columns;col++){
  const x=Math.round(col*image.width/columns),y=Math.round(row*image.height/rows),w=Math.round((col+1)*image.width/columns)-x,h=Math.round((row+1)*image.height/rows)-y,pixels=ic.getImageData(x,y,w,h).data;
  let left=w,top=h,right=0,bottom=0,paint=0,opaque=0;
  for(let py=0;py<h;py++)for(let px=0;px<w;px++){const a=pixels[(py*w+px)*4+3];if(a>32){left=Math.min(left,px);top=Math.min(top,py);right=Math.max(right,px+1);bottom=Math.max(bottom,py+1);paint++;if(a>=250)opaque++;}}
  assert(paint>1000&&opaque/paint>.7,`painted opaque figure ${row}/${col}`);assert(left>0&&top>0&&right<w&&bottom<h,`uncropped figure ${row}/${col}`);
  figures.push({row,col,x:x+left,y:y+top,w:right-left,h:bottom-top,opaqueRatio:opaque/paint});
 }
 const scale=Math.min(...figures.map(f=>Math.min(216/f.w,216/f.h)));
 for(const f of figures){const w=f.w*scale,h=f.h*scale,x=f.col*cell+(cell-w)/2,y=row*cell+baseline-h;ctx.drawImage(image,f.x,f.y,f.w,f.h,x,y,w,h);frames.push({...f,scale,destination:{x,y,w,h}});}
}
for(const path of [output,metadata])mkdirSync(dirname(resolve(path)),{recursive:true});
writeFileSync(output,atlas.toBuffer('image/png'));writeFileSync(metadata,JSON.stringify({source:'art/source/ego-beasts/animation-source-v2.png',columns,rows,cell,baseline,frames},null,2)+'\n');console.log(output);
