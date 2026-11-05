// Optional isolated native Canvas comparison, not a full scene/browser/phone FPS result.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(process.env.POPESCU_CANVAS_MODULE||'@napi-rs/canvas'),root=resolve(process.argv[2]||'.');
process.chdir(resolve(root,'dist'));globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
const {ActorArt}=await import(pathToFileURL(resolve(root,'dist/actor-art.js'))),{Renderer}=await import(pathToFileURL(resolve(root,'dist/renderer.js'))),{EGO_BEASTS,initEgoBeast,beginEgoAttack}=await import(pathToFileURL(resolve(root,'dist/ego-beasts.js'))),{drawEgoGround}=await import(pathToFileURL(resolve(root,'dist/ego-art.js')));
const runs=[];
for(const reduced of [false,true]){
 const canvas=createCanvas(390,844),ctx=canvas.getContext('2d'),art=new ActorArt({loadImage:path=>path.includes('ego-beasts')?loadImage(path):null});await art.ready;assert.ok(art.available('ego'));
 const renderer=Object.create(Renderer.prototype);Object.assign(renderer,{ctx,actors:art,reducedEffects:reduced,time:1,_shadow(){}});
 const enemies=[];
 for(let i=0;i<8;i++){const type=Object.keys(EGO_BEASTS)[i%4],e=initEgoBeast({id:500+i,type,x:i%2?260:110,y:160+Math.floor(i/2)*175,phase:'chase',faceX:1,faceY:0,hp:40,maxhp:100,r:EGO_BEASTS[type].r,hitFlash:process.argv[3]==='hit'?.12:0});beginEgoAttack(e,{x:e.x+50,y:e.y+30});e.phase='ego_active';e.egoTime=type==='ego_toad'?.6:EGO_BEASTS[type].duration-.05;enemies.push(e);}
 // Native Canvas retains display-list snapshots across opaque overdraw.
 // Reset only the output surface each frame; runtime art caches remain warm.
 const paint=()=>{canvas.width=390;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#28223b';ctx.fillRect(0,0,390,844);for(const e of enemies){drawEgoGround(ctx,e,reduced);renderer._actor(e,'enemy',0,{});}ctx.getImageData(0,0,1,1);};
 const before=JSON.stringify(enemies);for(let i=0;i<30;i++)paint();globalThis.gc?.();
 for(let run=0;run<3;run++){const times=[];for(let i=0;i<120;i++){const start=performance.now();paint();times.push(performance.now()-start);}times.sort((a,b)=>a-b);runs.push({reduced,run,frames:times.length,mean:times.reduce((a,b)=>a+b,0)/times.length,p50:times[60],p95:times[114],actorCache:art.cache.size,rss:process.memoryUsage().rss});globalThis.gc?.();}
 assert.equal(JSON.stringify(enemies),before);assert.ok(art.cache.size<=144);
}
console.log(JSON.stringify({root,node:process.version,backend:'native Canvas',scenario:process.argv[3]==='hit'?'continuous hit flash':'active attack',scope:'eight isolated creatures, hazards and status; no world, shadow, hero or UI',actors:8,runs},null,2));
