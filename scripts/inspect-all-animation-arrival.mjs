import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
// Offline QA only: actual Game and Renderer, synthetic victory, no browser storage.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image,loadImage}=require('@napi-rs/canvas');
const root=resolve(import.meta.dirname,'..'),out=resolve(process.argv[2]||root+'/proof/charles-arrival');mkdirSync(out,{recursive:true});process.chdir(root+'/dist');
globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h)}};
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{captureRun,restoreRun}=await import('../dist/run-save.js');
const report={renderer:'Actual Game + Renderer on native Canvas; not browser HUD or physical phone',frames:[],checkpoints:[]};
const times=[1.3,2.8,3.3,3.55,3.85,4.15],includeEgo=process.argv.includes('--ego'),includeAll=process.argv.includes('--all');
report.scene=includeAll?'Four active EGO creatures plus three new whole attacks and ordinary witness':includeEgo?'Four active EGO creatures plus ordinary witnesses':'Seven ordinary witnesses';
for(const [width,height]of [[390,844],[320,568]])for(const reduced of [false,true]){
 const tag=`${width}x${height}${reduced?'-reduced':''}`,frames=resolve(out,tag);mkdirSync(frames,{recursive:true});
 const sounds=[],g=new Game({seed:71,onEvent:(type,value)=>{if(type==='sound')sounds.push({value,time:g.s.charles?.elapsed});}});g.setViewport(width,height);g.s.elapsed=1200;g.s.mode='victory';g.s.companion=true;g.s.upg.girlfriend=1;g.recalculate();
 const placements=includeAll?[['ego_peacock',-115,-145],['ego_toad',105,-145],['ego_rat',-115,0],['ego_chameleon',110,0],['orangutan',-100,150],['rival_goat',100,150],['rival_rooster',-110,275],['normal',105,275]]:includeEgo?[['ego_peacock',-110,-50],['ego_toad',104,5],['ego_rat',-70,120],['ego_chameleon',110,165],['normal',-115,190],['orangutan',-102,-134],['jealous',70,-180]]:[['normal',-110,-50],['orangutan',104,5],['gas',-48,85],['sprinter',110,165],['tank',-115,190],['rival_rooster',-102,-134],['jealous',70,-180]];
 for(const [type,x,y]of placements){const e=g.spawnEnemy(type,x,y);if(type.startsWith('ego_'))Object.assign(e,{phase:'ego_active',egoTime:.1,egoDX:1,egoDY:0,egoReveal:2,hp:e.maxhp*.55,hitFlash:.08});if(includeAll&&['orangutan','rival_goat','rival_rooster'].includes(type))Object.assign(e,{windup:0,swipe:type==='orangutan'?.28:0,charge:type==='rival_goat'?.5:0,crow:type==='rival_rooster'?.7:0,swipeDirX:1,swipeDirY:0,chargeDirX:1,chargeDirY:0,hitFlash:.08});}
 g.startCharlesEpilogue();
 const canvas=createCanvas(width,height),renderer=new Renderer(canvas);await renderer.ready;renderer.resize(width,height);renderer.reducedEffects=reduced;assert.ok(renderer.charles.arrivalImage);
 const sheet=createCanvas(width*3,height*2+48),sc=sheet.getContext('2d');sc.fillStyle='#171326';sc.fillRect(0,0,sheet.width,sheet.height);
 let next=0;
 for(let i=0;i<144;i++){
  const time=i/24,save=captureRun(g);renderer.render(g,time);assert.deepEqual(captureRun(g),save);
  if(width===390)writeFileSync(`${frames}/frame-${String(i).padStart(4,'0')}.png`,canvas.toBuffer('image/png'));
  if(next<times.length&&time>=times[next]){
   const name=`${tag}-${times[next].toFixed(2)}.png`;writeFileSync(resolve(out,name),canvas.toBuffer('image/png'));
   const x=next%3*width,y=Math.floor(next/3)*(height+24);sc.drawImage(await loadImage(canvas.toBuffer('image/png')),x,y+24);sc.fillStyle='#ffe6a0';sc.font='14px sans-serif';sc.fillText(`${time.toFixed(2)} s | ${g.s.enemies.length} ennemis`,x+10,y+17);
   assert.deepEqual(captureRun(restoreRun(save)),save);report.checkpoints.push({tag,time,enemies:g.s.enemies.length,types:g.s.enemies.map(e=>e.type),hitFlashes:g.s.enemies.map(e=>e.hitFlash)});next++;
  }
  g.update(1/24);
 }
 assert.equal(sounds.filter(x=>x.value==='snap').length,1);assert.equal(g.s.enemies.length,0);assert.equal(g.s.kills,0);assert.equal(g.s.elapsed,1200);
 writeFileSync(resolve(out,`${tag}-sequence.png`),sheet.toBuffer('image/png'));report.frames.push({tag,sounds,actorCache:renderer.actors.cache.size,terrainCache:renderer.city.tiles.size});
}
writeFileSync(resolve(out,'render-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
