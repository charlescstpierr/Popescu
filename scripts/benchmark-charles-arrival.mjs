// Offline diagnostic only. Use one fresh process at a time.
// node scripts/benchmark-charles-arrival.mjs /path/to/repo candidate true arrival
// Kinds: survival, after, arrival, matched (81 in both), cap (300 in both).
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=resolve(process.argv[2]||'.'),variant=process.argv[3]||'candidate';
const reduced=process.argv[4]==='true',kind=process.argv[5]||'arrival';
if(!['survival','after','arrival','matched','cap'].includes(kind))throw Error('Unknown scene');
const require=createRequire(root+'/package.json');
const {createCanvas,Image}=require('@napi-rs/canvas');
globalThis.Image=Image;
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h)}};
process.chdir(root+'/dist');
const {Game}=await import(pathToFileURL(root+'/dist/engine.js'));
const {Renderer}=await import(pathToFileURL(root+'/dist/renderer.js'));
const g=new Game({seed:71});g.setViewport(390,844);
g.s.elapsed=kind==='survival'?1100:1200;
const count=kind==='cap'?300:81;
for(let i=0;i<count;i++){
 const x=kind==='cap'?Math.cos(i*2.399963)*Math.sqrt((i+1)/count)*155:-170+i%9*42;
 const y=kind==='cap'?Math.sin(i*2.399963)*Math.sqrt((i+1)/count)*260:-220+Math.floor(i/9)*54;
 g.spawnEnemy(['normal','sprinter','gas','tank','orangutan'][i%5],x,y);
}
if(kind!=='survival'){
 g.s.mode='victory';const witnesses=g.s.enemies;g.startCharlesEpilogue();
 // A diagnostic renderer comparison, not a claim about old live gameplay:
 // the old start cleared its crowd; matched/cap deliberately restore it.
 if(kind==='matched'||kind==='cap')g.s.enemies=witnesses;
 g.s.charles.elapsed=kind==='after'?10:3.75;
 g.s.charles.phaseTime=kind==='after'?1:4.25;
 if(kind==='after'){
  g.s.charles.phase='hover';g.s.charles.phaseDuration=2.4;g.s.enemies=[];
 }
}
const canvas=createCanvas(390,844),r=new Renderer(canvas);await r.ready;
r.resize(390,844);r.reducedEffects=reduced;
const ctx=canvas.getContext('2d'),warmup=kind==='cap'?2:4,samples=kind==='cap'?8:24;
const frame=()=>{r.render(g,3.75);ctx.getImageData(0,0,390,844);};
for(let i=0;i<warmup;i++)frame();
const times=[];
for(let i=0;i<samples;i++){
 const before=performance.now();frame();times.push(performance.now()-before);
}
times.sort((a,b)=>a-b);
console.log(JSON.stringify({variant,reduced,kind,enemies:g.s.enemies.length,
 p50:times[Math.floor(samples*.5)],p95:times[Math.min(samples-1,Math.floor(samples*.95))],
 max:times.at(-1),rssMiB:process.memoryUsage().rss/1048576,
 cache:{actors:r.actors.cache.size,terrain:r.city.tiles.size},frames:samples,warmup,
 width:390,height:844,dpr:r.dpr,
 limitation:'Short native render + full RGBA readback sample, not browser or phone. At 8 frames p95 is just the maximum.'}));
