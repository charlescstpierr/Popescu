import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(process.argv[2]||'/tmp/popescu-gorilla-accessories');mkdirSync(out,{recursive:true});process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js');
const types=['jealous','gas','sprinter','tank'];
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;
assert.ok(renderer.actors.available('enemy'));
const contact=createCanvas(1200,680),cc=contact.getContext('2d');cc.fillStyle='#201b31';cc.fillRect(0,0,1200,680);cc.imageSmoothingEnabled=false;
for(let row=0;row<4;row++)for(let column=0;column<8;column++){
 const frame=column%4,back=column>=4,e={type:types[row],x:column*150+75,y:row*170+145,faceX:1,faceY:back?-1:0};
 renderer.actors.draw(cc,e,'enemy',frame,{},0,true);cc.fillStyle='#f4d6aa';cc.font='12px sans-serif';cc.fillText(`${e.type} ${back?'dos':'face'} ${frame}`,column*150+6,row*170+16);
}
writeFileSync(resolve(out,'contact-approved.png'),contact.toBuffer('image/png'));
const results=[];
for(const width of [320,390])for(const reduced of [false,true]){
 const folder=resolve(out,`${width}-${reduced?'reduced':'standard'}`);mkdirSync(folder,{recursive:true});renderer.resize(width,844);renderer.reducedEffects=reduced;
 const g=new Game({seed:42});g.s.elapsed=400;g.s.hp=g.s.maxhp=1e8;g.s.xpNeed=1e9;g.s.mode='playing';g.nextEvent=99999;g.world.collides=()=>false;
 for(const key of Object.keys(g.timers))g.timers[key]=99999;
 // A seeded full combat scene, including effects that could hide the new cues.
 for(let i=0;i<48;i++){const angle=i*2.399963,r=75+Math.sqrt(i/48)*260;const e=g.spawnEnemy([...types,'normal','explosive'][i%6],Math.cos(angle)*r,Math.sin(angle)*r);e.hp=e.maxhp=1e6;e.cooldown=3+i%4;}
 const warning=g.s.enemies.find(e=>e.type==='explosive');warning.x=85;warning.y=-130;warning.windup=.65;
 g.s.clouds=Array.from({length:5},(_,i)=>({x:Math.cos(i*2.4)*90,y:Math.sin(i*2.4)*100,r:30,life:3,maxlife:4,vx:0,vy:0}));
 const phases=Object.fromEntries(types.map(t=>[t,new Set()])),orientations=Object.fromEntries(types.map(t=>[t,new Set()]));
 const original=renderer.actors.draw.bind(renderer.actors);renderer.actors.draw=(ctx,e,kind,phase,...args)=>{if(types.includes(e.type)){phases[e.type].add(phase%4);orientations[e.type].add((e.gasPose>0||e.faceY<-.45)?'back':'front');}return original(ctx,e,kind,phase,...args);};
 for(let frame=0;frame<90;frame++){
  g.update(1/30,{x:Math.cos(frame/24),y:Math.sin(frame/24)});g.s.mode='playing';
  const before=JSON.stringify(g.s);renderer.render(g,g.s.elapsed);assert.equal(JSON.stringify(g.s),before);
  writeFileSync(resolve(folder,`${String(frame).padStart(3,'0')}.png`),canvas.toBuffer('image/png'));
 }
 renderer.actors.draw=original;
 for(const t of types){assert.deepEqual([...phases[t]].sort(),[0,1,2,3],`${t} actually walks through all phases`);assert.equal(orientations[t].size,2,`${t} actually faces front and back`);}
 results.push({width,reduced,frames:90,seconds:3,phases:Object.fromEntries(types.map(t=>[t,[...phases[t]].sort()])),orientations:Object.fromEntries(types.map(t=>[t,[...orientations[t]]])),cacheSize:renderer.actors.cache.size,simulationUnchanged:true});assert.ok(renderer.actors.cache.size<=144);
}
writeFileSync(resolve(out,'results.json'),JSON.stringify({kind:'native Canvas, actual Game.update and Renderer.render',phoneTested:false,results},null,2));console.log(JSON.stringify(results));
