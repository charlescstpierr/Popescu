import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h)}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js');const {Renderer}=await import('../dist/renderer.js');const {COMPANION_LEVELS}=await import('../dist/content.js');
const out=resolve(process.argv[2]||resolve(root,'proof/companion'));mkdirSync(out,{recursive:true});
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;assert(renderer.companion.image);
const sheet=createCanvas(1950,900),ctx=sheet.getContext('2d');ctx.fillStyle='#141124';ctx.fillRect(0,0,1950,900);
const report={size:[390,844],ranks:[],renderReadOnly:true,physicalMobile:false,browser:false};
for(let rank=1;rank<=5;rank++){
 const game=new Game({seed:42}),s=game.s;for(let i=0;i<rank;i++){s.mode='upgrade';s.options=[{id:'girlfriend'}];assert(game.chooseUpgrade('girlfriend'));}
 Object.assign(s,{elapsed:150,faceX:1,faceY:0,walkDistance:12,walkMoving:true});Object.assign(s.girl,{x:70,y:-35,faceX:1,faceY:0,walkDistance:14,walkMoving:true,supportFlash:rank===4?.5:0});game.powerEffects=[];
 for(const [type,x,y]of [['normal',-88,-150],['sprinter',120,-215],['gas',-100,155],['jealous',100,180]])game.spawnEnemy(type,x,y);
 s.drops=[{x:100,y:5,kind:'xp',value:1,life:20},{x:123,y:50,kind:'xp',value:1,life:20},{x:-40,y:93,kind:'coin',value:1,life:20}];
 s.shots=[{x:s.girl.x+30,y:s.girl.y-20,vx:10,vy:10,kind:'heart',life:1,damage:13+8*rank,hitIds:new Set()}];
 const before=JSON.stringify(s);renderer.render(game,150);assert.equal(JSON.stringify(s),before);
 const bytes=canvas.toBuffer('image/png');writeFileSync(resolve(out,`in-game-rank-${rank}.png`),bytes);ctx.putImageData(canvas.getContext('2d').getImageData(0,0,390,844),(rank-1)*390,56);ctx.fillStyle='#ffe4a3';ctx.font='bold 17px sans-serif';ctx.fillText(`NIV. ${rank} · ${COMPANION_LEVELS[rank-1].name}`,(rank-1)*390+15,23);ctx.fillStyle='#e8d7eb';ctx.font='12px sans-serif';ctx.fillText(COMPANION_LEVELS[rank-1].short,(rank-1)*390+15,44);
 const t=performance.now();for(let i=0;i<60;i++)renderer.render(game,150+i/60);const ms=(performance.now()-t)/60;
 report.ranks.push({rank,file:`in-game-rank-${rank}.png`,sha256:createHash('sha256').update(bytes).digest('hex'),nativeCanvasMs:Number(ms.toFixed(2))});
}
assert.equal(new Set(report.ranks.map(r=>r.sha256)).size,5);writeFileSync(resolve(out,'five-ranks-in-game.png'),sheet.toBuffer('image/png'));writeFileSync(resolve(out,'render-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
