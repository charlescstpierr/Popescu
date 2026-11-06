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
let frames=0;
for(const scene of ['moving'])for(const car of [false,true])for(const reduced of [false,true]){
 const g=new Game({seed:42});g.s.elapsed=400;g.s.hp=g.s.maxhp=1e8;g.nextEvent=99999;g.s.mode='playing';g.s.xpNeed=1e9;
 for(const key of Object.keys(g.timers))g.timers[key]=99999;
 for(let i=0;i<(scene==='stress'?297:81);i++){const angle=i*2.399963,r=45+Math.sqrt(i/81)*250;g.spawnEnemy(['normal','gas','tank','orangutan'][i%4],Math.cos(angle)*r,Math.sin(angle)*r);}
 const orang=g.spawnEnemy('orangutan',-80,-95);Object.assign(orang,{windup:.5,swipeDirX:1,swipeDirY:0});
 const goat=g.spawnEnemy('rival_goat',-100,60);Object.assign(goat,{windup:.5,chargeDirX:1,chargeDirY:0});
 const explosive=g.spawnEnemy('explosive',90,-170);explosive.windup=.5;
 g.s.shockwaves=[{x:70,y:110,r:90,width:12,life:.8,maxlife:1}];
 g.s.clouds=Array.from({length:scene==='stress'?90:6},(_,i)=>({x:Math.cos(i*2.4)*110,y:Math.sin(i*2.4)*150,r:35,life:3,maxlife:4,vx:0,vy:0}));
 if(car){g.s.upg.car=3;g.recalculate();g.s.hp=g.s.maxhp=1e8;g.timers.car=0;g.weapons(0);g.s.vehicles[0].x=-140;}
 for(const {renderer}of renderers)renderer.reducedEffects=reduced;
 for(let frame=0;frame<8;frame++){
  if(frame>0)for(let step=0;step<6;step++)g.update(1/60,{x:1,y:0});
  const before=JSON.stringify(g.s);
  for(const i of frame%2?[0,1]:[1,0]){const {renderer,canvas}=renderers[i];renderer.render(g,g.s.elapsed);assert.equal(JSON.stringify(g.s),before);writeFileSync(resolve(out,`sequence-${car?'car':'no-car'}-${reduced?'reduced':'standard'}-${frame}-${i?'after':'before'}.png`),canvas.toBuffer('image/png'));}
 }
 frames+=8;
}
console.log(JSON.stringify({frames,simulationStep:'six actual 1/60 updates per frame',vehicleVariants:[false,true],reducedEffectVariants:[false,true],simulationUnchangedByRender:true}));
