import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js');
const out=resolve(process.argv[2]||resolve(root,'proof'));mkdirSync(out,{recursive:true});mkdirSync(resolve(out,'frames'),{recursive:true});
const game=new Game({seed:42}),s=game.s;s.elapsed=240;s.x=-65;s.y=95;s.faceX=1;
const boss=game.spawnEnemy('travestia',20,-15);boss.faceX=1;boss.tailFaceX=1;
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;assert.ok(renderer.actors.images.travestia,'atlas decodes');
const sheet=createCanvas(1170,844),sheetCtx=sheet.getContext('2d');
for(const [i,phase,tailTime,label]of [[0,'tail_windup',.7,'1. PRÉPARATION'],[1,'tail_spin',1.3,'2. QUEUE HÉLICOPTÈRE'],[2,'tail_recover',.9,'3. RÉCUPÉRATION']]){
 Object.assign(boss,{phase,tailTime});const before=JSON.stringify(s);renderer.render(game,240);assert.equal(JSON.stringify(s),before,'render leaves simulation unchanged');
 const ctx=canvas.getContext('2d');ctx.fillStyle='#171426';ctx.fillRect(0,0,390,58);ctx.fillStyle='#ffe8ad';ctx.font='bold 17px sans-serif';ctx.fillText(label,18,35);sheetCtx.drawImage(canvas,i*390,0);writeFileSync(resolve(out,`${phase}.png`),canvas.toBuffer('image/png'));
}
writeFileSync(resolve(out,'travestia-phases.png'),sheet.toBuffer('image/png'));
// Real simulation advances the warning, spin, recovery. Toma retreats during the warning.
Object.assign(boss,{phase:'chase',tailTime:0,cooldown:0,x:20,y:-15});s.x=-30;s.y=50;game.world.collides=()=>false;
for(let i=0;i<240;i++){
 const dt=1/30;s.elapsed+=dt;s.invulnerable=Math.max(0,s.invulnerable-dt);if(i<38){s.x-=70*dt;s.y+=70*dt;s.walkMoving=true;s.walkDistance+=Math.hypot(70*dt,70*dt);}else s.walkMoving=false;
 game.updateEnemies(dt);renderer.render(game,s.elapsed);writeFileSync(resolve(out,'frames',`${String(i).padStart(3,'0')}.png`),canvas.toBuffer('image/png'));
}
assert.equal(s.hp,s.maxhp,'retreat during warning evades attack');
console.log(JSON.stringify({output:out,atlas:[renderer.actors.images.travestia.width,renderer.actors.images.travestia.height],renderPure:true,escapeDamage:0}));
