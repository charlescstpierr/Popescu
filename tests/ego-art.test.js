import test from 'node:test';
import assert from 'node:assert/strict';
import {ActorArt} from '../dist/actor-art.js';
test('ego animals never resolve to the gorilla atlas',async()=>{
 const art=new ActorArt({loadImage:async path=>path.includes('ego-beasts')?null:{width:512,height:512}});await art.ready;
 assert.equal(art.availableFor({type:'ego_toad'},'enemy'),false);
});
test('ego atlas readiness is retryable and shared by concurrent callers',async()=>{
 let calls=0;const art=new ActorArt({loadImage:async path=>path.includes('ego-beasts')?(++calls===1?null:{width:512,height:512}):null});await art.ready;
 assert.equal(typeof art.ensureEgoReady,'function');
 const a=art.ensureEgoReady(),b=art.ensureEgoReady();assert.equal(a,b);assert.deepEqual(await a,{ok:true});assert.equal(calls,2);
});
test('ego rendering contract is available separately from simulation',async()=>{
 const art=await import('../dist/ego-art.js').catch(()=>({}));assert.equal(typeof art.egoFrame,'function');
 assert.equal(art.egoFrame({type:'ego_toad',phase:'ego_warning'}),1);
 assert.equal(art.egoFrame({type:'ego_toad',phase:'ego_recover'}),3);
 assert.equal(art.egoFrame({type:'ego_chameleon',phase:'ego_warning'}),2);
});
test('only approved effect kinds produce ground cues without mutating an actor',async()=>{
 const {drawEgoGround}=await import('../dist/ego-art.js');
 const {initEgoBeast,beginEgoAttack}=await import('../dist/ego-beasts.js');
 for(const type of ['ego_peacock','ego_toad','ego_rat','ego_chameleon']){
  const e=initEgoBeast({type,x:0,y:0,phase:'chase'});beginEgoAttack(e,{x:30,y:0});const before=JSON.stringify(e),calls=[];
  const ctx=new Proxy({save(){},restore(){},setLineDash(){}},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});
  drawEgoGround(ctx,e,true);assert.ok(calls.some(c=>c[0]==='stroke'),type);assert.equal(JSON.stringify(e),before);
 }
});
test('malformed ego atlas cannot pass the activation gate',async()=>{const art=new ActorArt({loadImage:async()=>({width:512,height:256})});await art.ready;assert.equal(art.available('ego'),false);});
test('ego atlas timeout releases loading and ignores a stale late image',async()=>{
 let resolveImage;const ticks=[];const timers={setTimeout(fn){ticks.push(fn);return ticks.length;},clearTimeout(){}};
 const art=new ActorArt({timers,loadImage:path=>path.includes('ego-beasts')?new Promise(resolve=>{resolveImage=resolve;}):Promise.resolve(null)});
 const first=art.ensureEgoReady();ticks[0]();assert.deepEqual(await first,{ok:false,reason:'timeout'});resolveImage({width:512,height:512});await Promise.resolve();assert.equal(art.available('ego'),false);
 art._loadImage=async()=>({width:512,height:512});assert.deepEqual(await art.ensureEgoReady(),{ok:true});await art.ready;
});
test('camouflage selects three bounded surface tints and disappears completely for warning',async()=>{
 const {drawEgoBody}=await import('../dist/ego-art.js');const {initEgoBeast}=await import('../dist/ego-beasts.js');
 const alpha=[];let value=1;const ctx=new Proxy({save(){},restore(){value=1;},drawImage(){alpha.push(value);},get globalAlpha(){return value;},set globalAlpha(v){value=v;}},{get:(o,k)=>k in o?o[k]:()=>{}});
 const cache=new Map(),image={width:512,height:512};
 for(const surface of ['asphalt','building','grass']){const e=initEgoBeast({type:'ego_chameleon',x:1,y:1,phase:'chase'});e.egoReveal=0;e.egoSurface=surface;drawEgoBody(ctx,e,image,cache);assert.ok(alpha.at(-1)<.4);e.phase='ego_warning';drawEgoBody(ctx,e,image,cache);assert.equal(alpha.at(-1),1);}
});
test('segment warnings cover complete collision radius including round ends',async()=>{
 const {drawEgoGround}=await import('../dist/ego-art.js');const {initEgoBeast,beginEgoAttack,egoAttackGeometry}=await import('../dist/ego-beasts.js');
 for(const type of ['ego_peacock','ego_rat','ego_chameleon']){const e=initEgoBeast({type,x:0,y:0,phase:'chase'});beginEgoAttack(e,{x:40,y:0});const calls=[];const ctx=new Proxy({save(){},restore(){},setLineDash(){}},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});drawEgoGround(ctx,e,true);const radius=egoAttackGeometry(e)[0].r;assert.ok(calls.some(c=>c[0]==='arc'&&c[3]===radius),type);}
});
test('packed animal atlas registers sixteen whole-body cells without stretching',async()=>{
 const {readFile}=await import('node:fs/promises');const png=await readFile(new URL('../dist/assets/ego-beasts.png',import.meta.url));assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1024);
 const {frames}=JSON.parse(await readFile(new URL('../art/source/ego-beasts/registration.json',import.meta.url),'utf8'));assert.equal(frames.length,16);
 for(const f of frames){const d=f.destination;assert.ok(d.x>=f.col*256+8&&d.x+d.w<=(f.col+1)*256-8);assert.ok(d.y>=f.row*256+8);assert.ok(Math.abs(d.y+d.h-(f.row*256+240))<1e-6);assert.ok(Math.abs(d.w/f.w-d.h/f.h)<1e-9);assert.ok(f.opaqueRatio>.7);}
 for(let row=0;row<4;row++)assert.equal(new Set(frames.filter(f=>f.row===row).map(f=>f.scale)).size,1);
});
