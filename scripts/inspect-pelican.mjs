/** Native render QA of the shipped atlas, game renderer and exact attack phases. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js');
const {PELICAN,pelicanCards}=await import('../dist/pelican.js');
const {PELICAN_ART,drawPelicanGround,drawPelicanCards}=await import('../dist/pelican-art.js');
const out=resolve(root,process.argv[2]||'proof/pelican');mkdirSync(out,{recursive:true});
const game=new Game({seed:42}),s=game.s;s.elapsed=360;s.x=0;s.y=90;s.faceX=1;
const boss=game.spawnEnemy('pelican',-32,-42);Object.assign(boss,{faceX:1,peliDX:.8,peliDY:.6,peliX:-32,peliY:-42});
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;
assert.ok(renderer.actors.images.pelican,'the shipped pelican atlas must decode');
assert.deepEqual([renderer.actors.images.pelican.width,renderer.actors.images.pelican.height],[1448,1086]);
const phases=[
 ['peli_hug_warning',1,'1. CÂLIN : PRÉPARATION'],['peli_hug',.4,'2. CÂLIN : CHARGE'],
 ['peli_zodiac_warning',1,'3. ZODIAQUE : OUVERTURE'],['peli_zodiac',.3,'4. ZODIAQUE : ONDE'],
 ['peli_tarot_warning',.8,'5. TAROT : PRÉPARATION'],['peli_tarot',1.5,'6. TAROT : ALLER'],
 ['peli_tarot',.55,'7. TAROT : RETOUR'],['peli_recover',.6,'8. RÉCUPÉRATION']
];
const sheet=createCanvas(390*4,844*2),sheetCtx=sheet.getContext('2d');
for(const [i,[phase,peliTime,label]]of phases.entries()){
 Object.assign(boss,{phase,peliTime,x:-32,y:-42});
 if(phase==='peli_hug'){boss.x+=.8*88;boss.y+=.6*88;}
 const before=JSON.stringify(s);renderer.render(game,360);assert.equal(JSON.stringify(s),before,'the renderer may not mutate simulation');
 const ctx=canvas.getContext('2d');ctx.fillStyle='#171426';ctx.fillRect(0,0,390,54);ctx.fillStyle='#ffe8ad';ctx.font='bold 15px sans-serif';ctx.fillText(label,14,32);
 sheetCtx.drawImage(canvas,i%4*390,Math.floor(i/4)*844);writeFileSync(resolve(out,`${i+1}-${phase}.png`),canvas.toBuffer('image/png'));
}
writeFileSync(resolve(out,'pelican-phases.png'),sheet.toBuffer('image/png'));
// Actual-size twelve-pose contact sheet, paired with the real unmodified Toma.
const contact=createCanvas(960,440),c=contact.getContext('2d');c.fillStyle='#292238';c.fillRect(0,0,960,440);
const poses=[...Array.from({length:4},(_,i)=>({phase:'chase',peliMoving:true,peliWalkDistance:i*14})),{phase:'chase',peliMoving:false},...phases.slice(0,6).filter((_,i)=>i!==3).map(([phase,peliTime])=>({phase,peliTime})),{phase:'peli_recover',peliTime:.7},{phase:'chase',peliMoving:false,hitFlash:.1}];
for(let i=0;i<12;i++){
 const x=i%6*160+80,y=Math.floor(i/6)*220+175;
 renderer.actors.drawPelican(c,{...boss,...poses[i],x,y,faceX:1,peliDX:1},360);
 c.fillStyle='#fff1cb';c.font='11px sans-serif';c.textAlign='center';c.fillText(i<4?`PAS ${i+1}`:poses[i].phase,x,y+32);
}
writeFileSync(resolve(out,'pelican-poses.png'),contact.toBuffer('image/png'));
// Every frame has bounded nonempty alpha, distinct pixels, and clear gutters.
const source=renderer.actors.images.pelican,raw=createCanvas(source.width,source.height),r=raw.getContext('2d');r.drawImage(source,0,0);
const hashes=[];for(let i=0;i<12;i++){
 const p=r.getImageData(i%4*362,Math.floor(i/4)*362,362,362).data;let count=0,minX=362,maxX=0,minY=362,maxY=0;
 for(let y=0;y<362;y++)for(let x=0;x<362;x++)if(p[(y*362+x)*4+3]>127){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 assert.ok(count>20000&&count<85000,`frame ${i} has a transparent complete character`);assert.ok(minX>8&&maxX<354&&minY>8&&maxY<350,`frame ${i} remains within its cell`);assert.ok(Math.abs(maxY-332)<=1,`frame ${i} feet share a baseline`);
 hashes.push(createHash('sha256').update(p).digest('hex'));
}assert.equal(new Set(hashes).size,12,'all twelve pose paintings are distinct');
// Ring opening stays truly clear in the *painted* ground layer, not just geometry.
const hazards=createCanvas(400,400),h=hazards.getContext('2d'),hazard={...boss,x:200,y:200,peliX:200,peliY:200,peliDX:1,peliDY:0,phase:'peli_zodiac',peliTime:PELICAN.zodiac.duration*(1-110/155)};
drawPelicanGround(h,hazard,true);
const alpha=(x,y)=>h.getImageData(x,y,1,1).data[3];assert.equal(alpha(310,200),0,'safe wedge is not painted as damaging');assert.ok(alpha(90,200)>0,'opposite ring arc is visibly dangerous');assert.equal(alpha(200,200),0,'safe center remains clear');
writeFileSync(resolve(out,'zodiac-footprint.png'),hazards.toBuffer('image/png'));
// Before the front reaches the 16 px safe center, decorations must also leave it clear.
h.clearRect(0,0,400,400);drawPelicanGround(h,{...hazard,peliTime:PELICAN.zodiac.duration},false);
assert.equal(alpha(200,200),0,'newly started ring cannot paint stars into the safe center');
// Cards render directly at their simulation positions, with no hidden lift.
h.clearRect(0,0,400,400);const tarot={...hazard,phase:'peli_tarot',peliTime:1.5,peliDX:0,peliDY:-1};drawPelicanCards(h,tarot,true);
for(const card of pelicanCards(tarot))assert.ok(alpha(Math.round(card.x),Math.round(card.y))>0,'card art covers exact live collision center');
// No operation uses a deformed or assembled actor. Mirroring is the only scale.
let calls=[];const spy=new Proxy({}, {get:(_,key)=>key==='drawImage'?(...args)=>calls.push(['drawImage',...args]):(...args)=>calls.push([key,...args])});
const frozen=Object.freeze({...boss,x:0,y:0,peliDX:-1,phase:'peli_hug',peliTime:.4});renderer.actors.drawPelican(spy,frozen,360);
assert.equal(calls.filter(c=>c[0]==='drawImage').length,1);assert.deepEqual(calls.filter(c=>c[0]==='scale'),[['scale',-1,1]]);assert.ok(!calls.some(c=>['rotate','transform','setTransform'].includes(c[0])));
const result={output:out,atlas:[source.width,source.height],poseCount:12,renderSize:PELICAN_ART.size,renderPure:true,ringSafeWedge:true,tarotCollisionCenters:true,wholeBodyPainting:true};
writeFileSync(resolve(out,'qa.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
