import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const out=resolve(process.argv[2]||'/tmp/popescu-remaining-preview');mkdirSync(out,{recursive:true});process.chdir(new URL('../dist',import.meta.url).pathname);
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{UPGRADES}=await import('../dist/content.js');
const powers=[['followers','Abonnés fictifs'],['ego','Ego surdimensionné'],['money','Selfie de milliardaire'],['charisma','Charisme imaginaire'],['chopper','Chopper inexistant'],['filter','Filtre beauté'],['validation','Validation sociale'],['speed','Fuite très stratégique'],['magnet','Pouvoir d’attraction'],['detox','Détox de commentaires'],['billionaire','Lambo de milliardaire'],['viralLove','Amour viral'],['recovery','Pause protéinée'],['payday','Petit contrat'],['barrier','Compliment gratuit']];
let frame=0;
for(const [power,label]of powers){
 const canvas=createCanvas(390,640),r=new Renderer(canvas);r.resize(390,640);await r.ready;const c=canvas.getContext('2d'),g=new Game({seed:42});g.s.elapsed=42;g.s.faceX=1;g.s.faceY=0;g.s.hp=40;g.s.xpNeed=1e9;g.nextEvent=1e9;for(const key in g.timers)g.timers[key]=1e9;
 for(const [type,x,y]of [['normal',115,-25],['orangutan',-110,110],['gas',115,-205]]){const e=g.spawnEnemy(type,x,y);e.hp=e.maxhp=1000;e.speed=0;e.cooldown=99;e.attack=99;}
 if(power==='filter')g.s.clouds.push({x:72,y:-25,r:34,maxr:40,arm:0,life:4,maxlife:4,vx:0,vy:0});
 if(power==='billionaire')Object.assign(g.s.upg,{car:3,money:3});if(power==='charisma'||power==='viralLove'){g.s.companion=true;Object.assign(g.s.upg,{girlfriend:3,charisma:power==='viralLove'?3:0});g.s.girl.shoot=.7;}if(power==='viralLove'){g.s.enemies=[];for(const[x,y]of[[60,25],[130,-55],[170,60]]){const e=g.spawnEnemy('tank',x,y);e.hp=e.maxhp=1000;e.speed=0;e.attack=99;}}g.recalculate();g.s.mode='upgrade';g.s.options=[{id:power}];assert(g.chooseUpgrade(power));g.s.invulnerable=0;if(power==='charisma')for(const e of g.s.enemies)e.speed=25;if(power==='followers')g.s.shotClock=.4;if(power==='billionaire')g.timers.car=.4;
 for(let i=0;i<60;i++){
  if(i===24&&power==='magnet')g.s.drops=[{kind:'xp',x:g.s.x-90,y:g.s.y+30,value:2,life:30},{kind:'coin',x:g.s.x+80,y:g.s.y+40,value:1,life:30},{kind:'heal',x:g.s.x+25,y:g.s.y+85,value:5,life:30}];if(i===24&&power==='validation'){g.s.shield=3;g.lastHit=g.s.elapsed-7;}if(i===24&&power==='money')g.s.drops=[{kind:'coin',x:g.s.x+1,y:g.s.y,value:1,life:30}];if(i)g.update(1/24,power==='speed'?{x:1,y:0}:power==='filter'?{x:.25,y:0}:undefined);
  c.reset();r.render(g,g.s.elapsed);c.fillStyle='#151326';c.fillRect(0,0,390,45);c.font='bold 17px monospace';c.fillStyle=power==='car'?'#ffdc66':power==='airplane'||power==='truth'?'#89eeff':'#ff8ec8';c.fillText(label,14,29);
  writeFileSync(resolve(out,`frame-${String(frame++).padStart(4,'0')}.png`),canvas.toBuffer('image/png'));
 }
}
const video=resolve(out,'Toma_Popescu_autres_pouvoirs.mp4'),encoded=spawnSync('ffmpeg',['-y','-loglevel','error','-framerate','24','-i',resolve(out,'frame-%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-movflags','+faststart',video],{encoding:'utf8'});assert.equal(encoded.status,0,encoded.stderr);console.log(JSON.stringify({video,frames:frame,seconds:frame/24,nativeCanvas:true,actualBrowser:false}));
