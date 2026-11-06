import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
// Independent offline QA: real threshold crossing and Game/Renderer; no user storage.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image,loadImage}=require('@napi-rs/canvas');
const root=resolve(process.argv[3]||resolve(import.meta.dirname,'..')),out=resolve(process.argv[2]||root+'/proof/charles-motion');
mkdirSync(out,{recursive:true});process.chdir(root+'/dist');
globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h)}};
const module=async name=>import(pathToFileURL(root+'/dist/'+name+'.js').href);
const {Game}=await module('engine'),{Renderer}=await module('renderer'),{captureRun,restoreRun}=await module('run-save'),{charlesPose}=await module('charles-art');
const report={root,renderer:'Actual Game + Renderer on native Canvas; not browser DOM, touch or physical phone',frames:[],checkpoints:[]};
const times=[0,.5,1,1.5,2,2.5,2.625,2.96,3.333,3.458,3.75,4.083,4.5,5,6.5,8,8.083,9,10.375,10.5];
for(const [width,height]of [[390,844],[320,568]])for(const reduced of [false,true]){
 const tag=`${width}x${height}${reduced?'-reduced':''}`;if(process.env.QA_VARIANT&&process.env.QA_VARIANT!==tag)continue;const frames=resolve(out,tag);mkdirSync(frames,{recursive:true});
 const sounds=[],g=new Game({seed:71,onEvent:(type,value)=>{if(type==='sound')sounds.push({value,time:g.s.charles?.elapsed});}});
 g.setViewport(width,height);Object.assign(g.s,{elapsed:1199.99,invulnerable:10,shotClock:100,companion:true});g.s.upg.girlfriend=1;g.recalculate();
 for(const [type,x,y]of [['ego_peacock',-110,-50],['ego_toad',104,5],['ego_rat',-70,120],['ego_chameleon',110,165],['normal',-115,190],['orangutan',-102,-134],['jealous',70,-180]]){
  const e=g.spawnEnemy(type,x,y);if(type.startsWith('ego_'))Object.assign(e,{phase:'ego_active',egoTime:.1,egoDX:1,egoDY:0,egoReveal:2,hp:e.maxhp*.55,hitFlash:.08});
 }
 g.update(.01);assert.equal(g.s.mode,'playing');assert.equal(g.s.charles?.phase,'intro');assert.equal(sounds.some(x=>x.value==='victory'),false);
 const canvas=createCanvas(width,height),renderer=new Renderer(canvas);await renderer.ready;renderer.resize(width,height);renderer.reducedEffects=reduced;assert.ok(renderer.charles.arrivalImage);
 const sheet=createCanvas(width*4,(height+24)*5),sc=sheet.getContext('2d');sc.fillStyle='#171326';sc.fillRect(0,0,sheet.width,sheet.height);
 let next=0;
 for(let i=0;i<=264;i++){
  const time=i/24,save=captureRun(g);renderer.render(g,time);assert.deepEqual(captureRun(g),save);
  const png=canvas.toBuffer('image/png');writeFileSync(`${frames}/frame-${String(i).padStart(4,'0')}.png`,png);
  if(next<times.length&&time+1e-8>=times[next]){
   writeFileSync(resolve(out,`${tag}-${times[next].toFixed(3)}.png`),png);
   const x=next%4*width,y=Math.floor(next/4)*(height+24);sc.drawImage(await loadImage(png),x,y+24);sc.fillStyle='#ffe6a0';sc.font='14px sans-serif';sc.fillText(`${time.toFixed(3)}s | ${g.s.enemies.length} enemies`,x+10,y+17);
   assert.deepEqual(captureRun(restoreRun(save)),save);report.checkpoints.push({tag,time,enemies:g.s.enemies.length,phase:g.s.charles.phase,pose:renderer.charles.pose?.(g.s.charles,time,reduced)??charlesPose(g.s.charles,time,reduced)});next++;
  }
  if(i<264)g.update(1/24);
 }
 assert.equal(next,times.length);assert.equal(sounds.filter(x=>x.value==='snap').length,1);assert.equal(g.s.enemies.length,0);assert.equal(g.s.kills,0);assert.equal(g.s.elapsed,1200);
 writeFileSync(resolve(out,`${tag}-contact.png`),sheet.toBuffer('image/png'));
 const encoded=spawnSync('ffmpeg',['-y','-loglevel','error','-framerate','24','-i',frames+'/frame-%04d.png','-c:v','libx264','-pix_fmt','yuv420p','-crf','18',resolve(out,`${tag}.mp4`)],{encoding:'utf8'});assert.equal(encoded.status,0,encoded.stderr);
 report.frames.push({tag,sounds,actorCache:renderer.actors.cache.size,terrainCache:renderer.city.tiles.size});
 writeFileSync(resolve(out,'render-report.json'),JSON.stringify(report,null,2));
 console.log('Finished '+tag);
}
console.log(JSON.stringify(report.frames,null,2));
