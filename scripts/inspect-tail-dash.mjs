import {createRequire} from 'node:module';import {mkdirSync,writeFileSync} from 'node:fs';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(resolve(root,'dist'));globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{captureRun,restoreRun}=await import('../dist/run-save.js');
const out=resolve(root,'proof/tail-dash');mkdirSync(out,{recursive:true});mkdirSync(resolve(out,'frames'),{recursive:true});
const game=new Game({seed:42}),s=game.s;s.elapsed=250;s.x=85;s.y=85;const boss=game.spawnEnemy('travestia',-20,-20);boss.tailAttackCount=1;game.world.collides=()=>false;game.updateEnemies(.01);
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;assert.ok(renderer.actors.images.travestia_dash,'dash atlas decodes');
const sheet=createCanvas(1170,844),c=sheet.getContext('2d');
for(const [i,phase,time,travel,title]of [[0,'tail_dash_windup',1,0,'1. COULOIR ANNONCÉ'],[1,'tail_dash',.3,120,'2. CHARGE ARRIÈRE'],[2,'tail_dash_recover',1,240,'3. RÉCUPÉRATION']]){
 Object.assign(boss,{phase,tailTime:time,tailDashDistance:travel,x:-20+Math.SQRT1_2*travel,y:-20+Math.SQRT1_2*travel});const before=JSON.stringify(s);renderer.render(game,250);assert.equal(JSON.stringify(s),before);const ctx=canvas.getContext('2d');ctx.fillStyle='#171426';ctx.fillRect(0,0,390,58);ctx.fillStyle='#ffe8ad';ctx.font='bold 16px sans-serif';ctx.fillText(title,14,35);c.drawImage(canvas,i*390,0);
 const clone=restoreRun(captureRun(game));assert.deepEqual(clone.s.enemies,s.enemies);
}
writeFileSync(resolve(out,'phases.png'),sheet.toBuffer('image/png'));
const directions=createCanvas(800,440),dc=directions.getContext('2d');dc.fillStyle='#28223b';dc.fillRect(0,0,800,440);for(let i=0;i<8;i++){const x=100+i%4*200,y=190+Math.floor(i/4)*220;renderer.actors.drawTravestia(dc,{x,y,phase:'tail_dash',tailDashDir:i},0);dc.fillStyle='#ffe8ad';dc.font='14px sans-serif';dc.fillText(['E','SE','S','SW','W','NW','N','NE'][i],x-5,y+20);}writeFileSync(resolve(out,'directions.png'),directions.toBuffer('image/png'));
Object.assign(boss,{phase:'chase',tailTime:0,cooldown:0,x:-20,y:-20,tailAttackCount:1});s.hp=s.maxhp;s.x=85;s.y=85;
for(let i=0;i<150;i++){const dt=1/30;s.elapsed+=dt;s.invulnerable=Math.max(0,s.invulnerable-dt);if(i>8&&i<32){s.x+=100*dt;s.y-=100*dt;s.walkMoving=true;s.walkDistance+=Math.sqrt(2)*100*dt;}else s.walkMoving=false;game.updateEnemies(dt);renderer.render(game,s.elapsed);writeFileSync(resolve(out,'frames',`${String(i).padStart(3,'0')}.png`),canvas.toBuffer('image/png'));}
assert.equal(s.hp,s.maxhp);console.log(JSON.stringify({output:out,atlas:true,renderPure:true,allPhasesSave:true,escapeDamage:0}));
