import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const out=resolve(process.argv[2]||'/tmp/popescu-power-preview');mkdirSync(out,{recursive:true});process.chdir(new URL('../dist',import.meta.url).pathname);
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{UPGRADES}=await import('../dist/content.js');
const powers=[['car','Lamborghini imaginaire'],['girlfriend','Blonde IA'],['airplane','Mode avion'],['muscle','Muscles Photoshop'],['truth','Vérité brute']];
let frame=0;
for(const [power,label]of powers){
 const canvas=createCanvas(390,640),r=new Renderer(canvas);r.resize(390,640);await r.ready;const c=canvas.getContext('2d'),g=new Game({seed:42});g.s.elapsed=42;g.s.faceX=1;g.s.faceY=0;g.s.hp=g.s.maxhp=1e6;g.s.xpNeed=1e9;g.nextEvent=1e9;for(const key in g.timers)g.timers[key]=1e9;
 for(const [type,x,y]of [['normal',115,-25],['orangutan',-110,110],['gas',115,-205]]){const e=g.spawnEnemy(type,x,y);e.hp=e.maxhp=1000;e.speed=0;e.cooldown=99;e.attack=99;}
 if(power==='airplane')g.s.clouds.push({x:72,y:-25,r:34,maxr:40,arm:0,life:4,maxlife:4,vx:0,vy:0});
 g.s.mode='upgrade';g.s.options=[UPGRADES.find(u=>u.id===power)];assert(g.chooseUpgrade(power));
 for(let i=0;i<60;i++){
  if(i)g.update(1/24);
  c.reset();r.render(g,g.s.elapsed);c.fillStyle='#151326';c.fillRect(0,0,390,45);c.font='bold 17px monospace';c.fillStyle=power==='car'?'#ffdc66':power==='airplane'||power==='truth'?'#89eeff':'#ff8ec8';c.fillText(label,14,29);
  writeFileSync(resolve(out,`frame-${String(frame++).padStart(4,'0')}.png`),canvas.toBuffer('image/png'));
 }
}
const video=resolve(out,'Toma_Popescu_cinq_pouvoirs.mp4'),encoded=spawnSync('ffmpeg',['-y','-loglevel','error','-framerate','24','-i',resolve(out,'frame-%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-movflags','+faststart',video],{encoding:'utf8'});assert.equal(encoded.status,0,encoded.stderr);console.log(JSON.stringify({video,frames:frame,seconds:frame/24,nativeCanvas:true,actualBrowser:false}));
