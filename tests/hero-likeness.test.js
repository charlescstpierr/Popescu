import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {HERO_FRAMES} from '../dist/hero-frames.js';
import {HeroArt} from '../dist/hero-art.js';

let nativeCanvas=null;
try{nativeCanvas=createRequire(import.meta.url)('@napi-rs/canvas');}catch{}

test('the photo-corrected whole-body atlas is the image actually loaded in play',async()=>{
  assert.equal(HERO_FRAMES.image,'toma-whole-v9.png');
  assert.equal(HERO_FRAMES.identityRevision,'smaller-head-2026-11-06');
  let loaded='';
  const art=new HeroArt({loadImage:async src=>{loaded=src;return {};}});
  assert.equal(await art.ready,true);
  assert.ok(loaded.endsWith('/'+HERO_FRAMES.image));
  assert.equal(Object.keys(HERO_FRAMES.views).length,8);
});

test('failed image loading retains the corrected face in the full-body fallback',
  {skip:!nativeCanvas&&'Optional @napi-rs/canvas is not installed'},async()=>{
  const {loadImage,createCanvas}=nativeCanvas;
  const image=await loadImage(readFileSync(new URL('../dist/assets/'+HERO_FRAMES.image,import.meta.url)));
  for(const [name,frame]of [['run',HERO_FRAMES.views.E.run[0]],['split',HERO_FRAMES.views.E.split[4]]]){
    const c=createCanvas(144,128),ctx=c.getContext('2d');ctx.drawImage(image,frame.x,frame.y,144,128,0,0,144,128);
    const reference=ctx.getImageData(0,0,144,128).data;
    ctx.clearRect(0,0,144,128);
    const fallback=HERO_FRAMES.fallback[name];
    for(const [y,x,length,color] of fallback.rows){ctx.fillStyle=fallback.palette[color];ctx.fillRect(x,y,length,1);}
    assert.ok(Buffer.from(ctx.getImageData(0,0,144,128).data).equals(Buffer.from(reference)),
      'fallback must show exactly the same corrected whole figure');
  }
});
