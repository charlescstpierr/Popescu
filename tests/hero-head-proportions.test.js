import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HERO_FRAMES} from '../dist/hero-frames.js';
import {HeroArt} from '../dist/hero-art.js';
import {Game} from '../dist/engine.js';
import {computeHeroPose,solveHeroAim,HERO_GAIT_STEP} from '../dist/hero-pose.js';

let native;
try { native=createRequire(import.meta.url)('@napi-rs/canvas'); } catch {}
const optional={skip:!native&&'Optional @napi-rs/canvas is not installed'};
const directions=Object.entries(HERO_FRAMES.views).flatMap(([id,v])=>[
  {id,angle:v.angle},...(['N','S'].includes(id)?[]:[{id:v.mirrorId,angle:Math.PI-v.angle}])]);
function state(direction,phase=0,progress=null){
  const s={...new Game({seed:42}).s,x:65,y:97,walkMoving:true,walkDistance:(phase+.1)*HERO_GAIT_STEP,
    moveX:Math.cos(direction.angle),moveY:Math.sin(direction.angle),shots:[],shotClock:0,
    stunt:{kind:'split',active:progress!==null,progress:progress??0}};
  Object.assign(s,solveHeroAim(s,{x:65+200*Math.cos(direction.angle),y:57+200*Math.sin(direction.angle)}));
  return s;
}
const digest=data=>createHash('sha256').update(data).digest('hex');

test('smaller-head revision is the complete atlas actually loaded by HeroArt',async()=>{
  assert.equal(HERO_FRAMES.image,'toma-whole-v9.png');
  assert.equal(HERO_FRAMES.identityRevision,'smaller-head-2026-11-06');
  let source;const art=new HeroArt({loadImage:async url=>{source=url;return {};}});
  assert.equal(await art.ready,true);assert.ok(source.endsWith('/toma-whole-v9.png'));
  assert.deepEqual([HERO_FRAMES.width,HERO_FRAMES.height,HERO_FRAMES.anchor],[144,128,[65,111]]);
});

test('eight native paintings yield fourteen actual solved directions',()=>{
  assert.equal(Object.keys(HERO_FRAMES.views).length,8);assert.equal(directions.length,14);
  const actual=directions.map(d=>computeHeroPose(state(d)).art.id);
  assert.deepEqual(actual,directions.map(d=>d.id));assert.equal(new Set(actual).size,14);
});

test('all fourteen directions have eight distinct rendered steps and an invariant split hold',optional,async()=>{
  const {createCanvas,loadImage}=native;
  const image=await loadImage(readFileSync(new URL('../dist/assets/'+HERO_FRAMES.image,import.meta.url)));
  const art=new HeroArt({loadImage:async()=>image});await art.ready;
  function pixels(s){const c=createCanvas(144,128),before=JSON.stringify(s);art.draw(c.getContext('2d'),s,0,true);
    assert.equal(JSON.stringify(s),before);return digest(c.getContext('2d').getImageData(0,0,144,128).data);}
  for(const d of directions){
    const hashes=Array.from({length:8},(_,i)=>{const s=state(d,i);assert.equal(computeHeroPose(s).art.frameIndex,i);return pixels(s);});
    assert.equal(new Set(hashes).size,8,d.id+' has eight genuinely different complete paintings');
    assert.equal(new Set([.24,.5,.69].map(p=>pixels(state(d,0,p)))).size,1,d.id+' holds the same split pixels');
  }
});

test('failed loading draws exactly the new east-facing run and split bodies',optional,async()=>{
  const {createCanvas,loadImage}=native;
  const image=await loadImage(readFileSync(new URL('../dist/assets/'+HERO_FRAMES.image,import.meta.url)));
  const art=new HeroArt({loadImage:async()=>null});assert.equal(await art.ready,false);
  for(const [progress,frame]of [[null,HERO_FRAMES.views.E.run[0]],[.5,HERO_FRAMES.views.E.split[4]]]){
    const expected=createCanvas(144,128),actual=createCanvas(144,128);
    expected.getContext('2d').drawImage(image,frame.x,frame.y,144,128,0,0,144,128);
    art.draw(actual.getContext('2d'),state(directions.find(d=>d.id==='E'),0,progress),0,true);
    assert.ok(Buffer.from(actual.getContext('2d').getImageData(0,0,144,128).data).equals(Buffer.from(expected.getContext('2d').getImageData(0,0,144,128).data)), 'fallback rendered pixels equal the complete E atlas frame');
  }
});

// Fixed atlas cells and the historical v8 asset provide a local visual baseline.
// These checks measure alignment, not anatomical head size or facial likeness.
async function decodedAtlas(name){
  return native.loadImage(readFileSync(new URL('../dist/assets/'+name,import.meta.url)));
}
function framePixels(image,frame){
  const c=native.createCanvas(144,128),ctx=c.getContext('2d');
  ctx.drawImage(image,frame.x,frame.y,144,128,0,0,144,128);
  return ctx.getImageData(0,0,144,128).data;
}
function muzzleDistance(pixels,muzzle){
  let distance=Infinity;
  for(let y=0;y<128;y++)for(let x=0;x<144;x++)if(pixels[(y*144+x)*4+3]>64){
    distance=Math.min(distance,Math.hypot(x-muzzle[0],y-muzzle[1]));
  }
  return distance;
}
function lowerBody(pixels){
  let sumX=0,sumY=0,count=0,bottom=-1;
  for(let y=78;y<128;y++)for(let x=0;x<144;x++)if(pixels[(y*144+x)*4+3]>64){
    sumX+=x;sumY+=y;count++;bottom=Math.max(bottom,y);
  }
  assert.ok(count>0,'lower body must have opaque pixels');
  return {x:sumX/count,y:sumY/count,bottom};
}
function atlasFrames(){
  return Object.entries(HERO_FRAMES.views).flatMap(([id,v])=>['run','split'].flatMap(sequence=>
    v[sequence].map((frame,index)=>({name:`${id}/${sequence}/${index}`,frame}))));
}

test('historical v8 and current muzzles stay within five pixels of the painted body or weapon',optional,async()=>{
  const frames=atlasFrames();
  for(const name of ['toma-whole-v8.png',HERO_FRAMES.image]){
    const image=await decodedAtlas(name),failures=[];
    for(const {name:label,frame}of frames){
      const distance=muzzleDistance(framePixels(image,frame),frame.muzzle);
      if(distance>5)failures.push(`${label}: ${distance.toFixed(2)}px`);
    }
    assert.deepEqual(failures,[],`${name}: metadata muzzle detached from opaque paint`);
  }
});

test('lower-body centroid and foot ground retain their original v8 frame alignment',optional,async()=>{
  const [before,after]=await Promise.all([decodedAtlas('toma-whole-v8.png'),decodedAtlas(HERO_FRAMES.image)]);
  const failures=[];
  for(const {name,frame}of atlasFrames()){
    const a=lowerBody(framePixels(before,frame)),b=lowerBody(framePixels(after,frame));
    const drift=Math.hypot(a.x-b.x,a.y-b.y),footShift=Math.abs(a.bottom-b.bottom);
    if(drift>3||footShift>2)failures.push(`${name}: lower-body centroid ${drift.toFixed(2)}px; lowest foot ${footShift}px`);
  }
  assert.deepEqual(failures,[], 'y>=78 opaque-pixel centroid drifts at most 3px; lowest foot drifts at most 2px');
});
