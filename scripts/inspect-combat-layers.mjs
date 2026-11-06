import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const baseline=resolve(process.argv[2]),candidate=resolve(process.argv[3]),out=resolve(process.argv[4]);mkdirSync(out,{recursive:true});process.chdir(resolve(candidate,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const {Game}=await import(pathToFileURL(resolve(candidate,'dist/engine.js')));
const renderers=[];for(const root of [baseline,candidate]){const {Renderer}=await import(pathToFileURL(resolve(root,'dist/renderer.js')));const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;renderers.push({canvas,renderer});}
const results=[];
for(const scene of ['crowd','moving','stress'])for(const reduced of [true,false]){
 const g=new Game({seed:42});g.s.elapsed=400;g.s.hp=g.s.maxhp=1e8;g.nextEvent=99999;g.s.mode='playing';g.s.xpNeed=1e9;
 for(const key of Object.keys(g.timers))g.timers[key]=99999;
 for(let i=0;i<(scene==='stress'?297:81);i++){const angle=i*2.399963,r=45+Math.sqrt(i/81)*250;g.spawnEnemy(['normal','gas','tank','orangutan'][i%4],Math.cos(angle)*r,Math.sin(angle)*r);}
 const orang=g.spawnEnemy('orangutan',-80,-95);Object.assign(orang,{windup:.5,swipeDirX:1,swipeDirY:0});
 const goat=g.spawnEnemy('rival_goat',-100,60);Object.assign(goat,{windup:.5,chargeDirX:1,chargeDirY:0});
 const explosive=g.spawnEnemy('explosive',90,-170);explosive.windup=.5;
 g.s.shockwaves=[{x:70,y:110,r:90,width:12,life:.8,maxlife:1}];
 g.s.clouds=Array.from({length:scene==='stress'?90:6},(_,i)=>({x:Math.cos(i*2.4)*110,y:Math.sin(i*2.4)*150,r:35,life:3,maxlife:4,vx:0,vy:0}));
 const times=[[],[]];for(const {renderer}of renderers)renderer.reducedEffects=reduced;
 for(let frame=-4;frame<20;frame++){
  if(scene==='moving'){g.s.x+=1.5;g.s.y+=.4;g.s.walkDistance+=1.55;g.s.moveX=1;g.s.walkMoving=true;}
  const before=JSON.stringify(g.s);
  for(const i of frame%2?[0,1]:[1,0]){const {renderer,canvas}=renderers[i],start=performance.now();renderer.render(g,400+frame/60);canvas.getContext('2d').getImageData(0,0,390,844);const elapsed=performance.now()-start;if(frame>=0)times[i].push(elapsed);assert.equal(JSON.stringify(g.s),before);if(frame===0)writeFileSync(resolve(out,`${scene}-${reduced?'reduced':'standard'}-${i?'after':'before'}.png`),canvas.toBuffer('image/png'));}
 }
 const stats=times.map(v=>{v.sort((a,b)=>a-b);return{p50:v[Math.floor(v.length*.5)],p95:v[Math.floor(v.length*.95)],samples:v};});results.push({scene,reduced,stats,changePercent:(stats[1].p50/stats[0].p50-1)*100});
}
writeFileSync(resolve(out,'results.json'),JSON.stringify({node:process.version,frames:20,results},null,2));console.log(JSON.stringify(results.map(({scene,reduced,stats,changePercent})=>({scene,reduced,before:stats[0].p50,after:stats[1].p50,changePercent})),null,2));
