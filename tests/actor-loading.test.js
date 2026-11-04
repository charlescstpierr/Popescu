import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {ActorArt} from '../dist/actor-art.js';

const ANIMALS_PATH='assets/animals-approved.png';
const goodImage=()=>({width:1254,height:1254,naturalWidth:1254,naturalHeight:1254});
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function fakeTimers(){
 let now=0,next=0;const pending=new Map();
 return {setTimeout(fn,ms){const id=++next;pending.set(id,{fn,at:now+ms});return id;},clearTimeout(id){pending.delete(id);},
  advance(ms){now+=ms;for(const [id,entry] of [...pending])if(entry.at<=now){pending.delete(id);entry.fn();}},get size(){return pending.size;}};
}
function setup(){
 const timers=fakeTimers(),attempts=[];
 const art=new ActorArt({animalsTimeoutMs:100,timers,loadImage(path){if(path!==ANIMALS_PATH)return Promise.resolve(goodImage());const attempt=deferred();attempts.push(attempt);return attempt.promise;}});
 return {art,timers,attempts};
}
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};

test('pending animal atlas is unavailable and all callers share the initial load',async()=>{
 const {art,timers,attempts}=setup();
 assert.equal(typeof art.ensureAnimalsReady,'function');
 const pending=art.ensureAnimalsReady();let settled=false;pending.then(()=>{settled=true;});
 for(let i=0;i<100;i++)assert.equal(art.ensureAnimalsReady(),pending);
 await flush();assert.equal(settled,false);assert.equal(art.available('animals'),false);assert.equal(art.availableFor({type:'moose'},'enemy'),false);
 assert.equal(attempts.length,1);assert.equal(timers.size,1);
 const image=goodImage();attempts[0].resolve(image);
 assert.deepEqual(await pending,{ok:true});await art.ready;
 assert.equal(art.images.animals,image);assert.equal(art.available('animals'),true);assert.equal(art.availableFor({type:'moose'},'enemy'),true);assert.equal(timers.size,0);
});

for(const outcome of ['null','reject'])test(`animal ${outcome} resolves failure and retries only on the next explicit call`,async()=>{
 const {art,timers,attempts}=setup(),first=art.ensureAnimalsReady();
 if(outcome==='null')attempts[0].resolve(null);else attempts[0].reject(new Error('offline'));
 assert.deepEqual(await first,{ok:false,reason:'failed'});await art.ready;
 assert.equal(art.available('animals'),false);assert.equal(timers.size,0);
 timers.advance(1000);await flush();assert.equal(attempts.length,1);
 const retry=art.ensureAnimalsReady();assert.equal(art.ensureAnimalsReady(),retry);assert.equal(attempts.length,2);
 attempts[1].resolve(goodImage());assert.deepEqual(await retry,{ok:true});assert.equal(timers.size,0);
});

test('synchronous loader errors are contained and a subsequent call can recover',async()=>{
 const timers=fakeTimers();let calls=0,fail=true;
 const art=new ActorArt({timers,loadImage(path){if(path!==ANIMALS_PATH)return null;calls++;if(fail)throw new Error('decode failed');return goodImage();}});
 await art.ready;assert.equal(calls,1);assert.equal(art.available('animals'),false);assert.equal(timers.size,0);
 assert.deepEqual(await art.ensureAnimalsReady(),{ok:false,reason:'failed'});assert.equal(calls,2);assert.equal(timers.size,0);
 fail=false;assert.deepEqual(await art.ensureAnimalsReady(),{ok:true});assert.equal(calls,3);assert.equal(timers.size,0);
});

for(const image of [{},{width:0,height:1254},{width:1254,height:0},{width:-1,height:1254},{width:1254,height:1254,naturalWidth:0,naturalHeight:0}]){
 test(`animal loader rejects unusable dimensions ${JSON.stringify(image)}`,async()=>{
  const {art,attempts,timers}=setup(),pending=art.ensureAnimalsReady();attempts[0].resolve(image);
  assert.deepEqual(await pending,{ok:false,reason:'failed'});assert.equal(art.available('animals'),false);assert.equal(art.availableFor({type:'ostrich'},'enemy'),false);assert.equal(art.images.animals,null);assert.equal(timers.size,0);
 });
}

test('animal loading has a bounded timeout and does not retry by itself',async()=>{
 const {art,timers,attempts}=setup(),pending=art.ensureAnimalsReady();let settled=false;pending.then(()=>{settled=true;});
 timers.advance(99);await flush();assert.equal(settled,false);
 timers.advance(1);assert.deepEqual(await pending,{ok:false,reason:'timeout'});await art.ready;
 assert.equal(art.available('animals'),false);assert.equal(timers.size,0);timers.advance(10000);assert.equal(attempts.length,1);
 const retry=art.ensureAnimalsReady();assert.equal(attempts.length,2);attempts[1].resolve(goodImage());assert.deepEqual(await retry,{ok:true});assert.equal(timers.size,0);
});

for(const outcome of ['success','failure'])for(const timing of ['before','after'])test(`obsolete animal ${outcome} ${timing} retry completion cannot replace current state`,async()=>{
 const {art,timers,attempts}=setup(),first=art.ensureAnimalsReady();timers.advance(100);
 assert.deepEqual(await first,{ok:false,reason:'timeout'});
 const current=art.ensureAnimalsReady(),newImage=goodImage(),oldImage={...goodImage(),old:true};
 const finishOld=()=>outcome==='success'?attempts[0].resolve(oldImage):attempts[0].reject(new Error('obsolete failure'));
 if(timing==='before'){finishOld();await flush();assert.equal(art.available('animals'),false);assert.equal(art.ensureAnimalsReady(),current);assert.equal(timers.size,1);}
 attempts[1].resolve(newImage);assert.deepEqual(await current,{ok:true});
 if(timing==='after'){finishOld();await flush();}
 assert.equal(art.images.animals,newImage);assert.equal(art.available('animals'),true);assert.equal(timers.size,0);assert.equal(attempts.length,2);
});

test('already-loaded animals need neither another load nor a timer',async()=>{
 const {art,attempts,timers}=setup();attempts[0].resolve(goodImage());await art.ready;
 for(let i=0;i<100;i++)assert.deepEqual(await art.ensureAnimalsReady(),{ok:true});
 assert.equal(art.available('animals'),true);assert.equal(attempts.length,1);assert.equal(timers.size,0);
});

test('animal readiness is independent of optional art while ready still waits for it',async()=>{
 const timers=fakeTimers(),optional=deferred();
 const art=new ActorArt({timers,loadImage(path){if(path===ANIMALS_PATH)return goodImage();if(path==='assets/pelican-poses.png')return optional.promise;throw new Error('optional art missing');}});
 let allReady=false;art.ready.then(()=>{allReady=true;});
 assert.deepEqual(await art.ensureAnimalsReady(),{ok:true});assert.equal(allReady,false);assert.equal(art.available('girl'),false);
 const pelican={path:'pelican'};optional.resolve(pelican);await art.ready;assert.equal(allReady,true);assert.equal(art.images.pelican,pelican);assert.equal(art.availableFor({type:'pelican'},'enemy'),true);
});

function controlledDefaultImages(t,{dom=true}={}){
 const original=Object.getOwnPropertyDescriptor(globalThis,'Image'),images=[];
 class ControlledImage{
  constructor(){this.width=0;this.height=0;this.naturalWidth=0;this.naturalHeight=0;this.sources=[];this.removals=0;images.push(this);}
  set src(value){this.source=value;this.sources.push(value);if(value!==ANIMALS_PATH)queueMicrotask(()=>this.onerror?.());}
  get src(){return this.source;}
  removeAttribute(name){assert.equal(name,'src');assert.equal(this.onload,null);assert.equal(this.onerror,null);this.source=null;this.removals++;}
 }
 if(!dom)delete ControlledImage.prototype.removeAttribute;
 Object.defineProperty(globalThis,'Image',{configurable:true,writable:true,value:ControlledImage});
 t.after(()=>{if(original)Object.defineProperty(globalThis,'Image',original);else delete globalThis.Image;});
 return images;
}

test('default animal timeouts detach handlers and clear obsolete sources before retrying',async t=>{
 const images=controlledDefaultImages(t),timers=fakeTimers(),art=new ActorArt({timers,animalsTimeoutMs:100}),stale=[];
 for(let i=0;i<3;i++){
  const pending=art.ensureAnimalsReady(),image=images.findLast(im=>im.src===ANIMALS_PATH);stale.push([image,image.onload,image.onerror]);
  timers.advance(100);assert.deepEqual(await pending,{ok:false,reason:'timeout'});
  assert.equal(image.onload,null);assert.equal(image.onerror,null);assert.equal(image.src,null);assert.equal(image.removals,1);assert.equal(timers.size,0);
  await art.ready;assert.equal(art.available('animals'),false);
 }
 const retry=art.ensureAnimalsReady(),current=images.findLast(im=>im.src===ANIMALS_PATH);
 for(const [image,onload,onerror] of stale){Object.assign(image,goodImage());onload();onerror();assert.equal(image.removals,1);}
 await flush();assert.equal(art.available('animals'),false);assert.equal(art.ensureAnimalsReady(),retry);
 Object.assign(current,goodImage());current.onload();assert.deepEqual(await retry,{ok:true});
 assert.equal(art.images.animals,current);assert.equal(current.src,ANIMALS_PATH);assert.equal(current.removals,0);assert.equal(current.onload,null);assert.equal(current.onerror,null);assert.equal(timers.size,0);
 assert.equal(images.filter(im=>im.sources.includes(ANIMALS_PATH)).length,4);
});

test('default loader clears a timed-out source without DOM attribute helpers',async t=>{
 const images=controlledDefaultImages(t,{dom:false}),timers=fakeTimers(),art=new ActorArt({timers,animalsTimeoutMs:100}),pending=art.ensureAnimalsReady();
 const image=images.find(im=>im.src===ANIMALS_PATH);timers.advance(100);
 assert.deepEqual(await pending,{ok:false,reason:'timeout'});await art.ready;
 assert.equal(image.onload,null);assert.equal(image.onerror,null);assert.equal(image.src,'');assert.deepEqual(image.sources,[ANIMALS_PATH,'']);assert.equal(timers.size,0);
});

for(const outcome of ['success','failure'])test(`default animal ${outcome} releases handlers without abandoning completed images`,async t=>{
 const images=controlledDefaultImages(t),timers=fakeTimers(),art=new ActorArt({timers,animalsTimeoutMs:100}),pending=art.ensureAnimalsReady();
 const image=images.find(im=>im.src===ANIMALS_PATH);
 if(outcome==='success'){Object.assign(image,goodImage());image.onload();}else image.onerror();
 assert.deepEqual(await pending,outcome==='success'?{ok:true}:{ok:false,reason:'failed'});await art.ready;
 assert.equal(image.onload,null);assert.equal(image.onerror,null);assert.equal(image.src,ANIMALS_PATH);assert.equal(image.removals,0);assert.equal(timers.size,0);
});

test('optional custom loader cancellation is invoked once on timeout',async()=>{
 const timers=fakeTimers();let cancelled=0;
 const art=new ActorArt({timers,animalsTimeoutMs:100,loadImage(path,registerCancel){if(path!==ANIMALS_PATH)return null;return new Promise(resolve=>{registerCancel(()=>{cancelled++;resolve(null);});});}});
 const pending=art.ensureAnimalsReady();timers.advance(100);assert.deepEqual(await pending,{ok:false,reason:'timeout'});await art.ready;
 timers.advance(1000);await flush();assert.equal(cancelled,1);assert.equal(art.available('animals'),false);assert.equal(timers.size,0);
});

test('fresh standalone retries the exact embedded animal image offline',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'popescu-animal-loading-'));
 try{
  const output=join(dir,'game.html'),exported=spawnSync('python3',['scripts/export-standalone.py',output],{encoding:'utf8'});assert.equal(exported.status,0,exported.stderr);
  const html=readFileSync(output,'utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)[1];
  const marker='modules["./actor-art.js"]={ActorArt};\n})();',end=script.indexOf(marker);assert.ok(end>=0);
  const expected='data:image/png;base64,'+readFileSync(new URL('../dist/assets/animals-approved.png',import.meta.url)).toString('base64');
  const sources=[],timers=fakeTimers();let animalCalls=0;
  class OfflineImage{
   constructor(){this.width=0;this.height=0;this.naturalWidth=0;this.naturalHeight=0;}
   set src(value){sources.push(value);queueMicrotask(()=>{if(value!==expected||++animalCalls===1)this.onerror();else{Object.assign(this,goodImage());this.onload();}});}
  }
  const context=vm.createContext({Image:OfflineImage,setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout});
  vm.runInContext(script.slice(0,end+marker.length)+'\nglobalThis.ActorArt=modules["./actor-art.js"].ActorArt;\n})();',context);
  const art=new context.ActorArt();await art.ready;assert.equal(art.available('animals'),false);
  const result=await art.ensureAnimalsReady();assert.equal(result.ok,true);assert.equal(art.available('animals'),true);assert.equal(animalCalls,2);
  assert.equal(sources.filter(src=>src===expected).length,2);assert.ok(sources.every(src=>src.startsWith('data:')));assert.equal(timers.size,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
