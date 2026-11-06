import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image,loadImage}=require('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js');
const output=resolve(process.argv[2]||'/tmp/toma-defeats-qa');mkdirSync(output,{recursive:true});
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;
assert(renderer.actors.available('enemy'));assert(renderer.hero.image);
function fixture(){
 const g=new Game({seed:42}),s=g.s;s.elapsed=42;s.moveX=0;s.moveY=0;s.faceX=1;s.faceY=0;s.upg={magnet:1};g.recalculate();s.shotClock=.4;s.xpNeed=9999;
 for(const [type,x,y]of [['normal',82,-35],['orangutan',-105,125],['gas',120,-250],['tank',-115,-135],['jealous',100,215]])g.spawnEnemy(type,x,y);
 return g;
}
const g=fixture();renderer.render(g,g.s.elapsed);
const target=g.s.enemies[0];g.hurt(target,24e3);assert.equal(g.defeatEffects.length,1);
const contact=createCanvas(390*4,844),cc=contact.getContext('2d'),labels=['IMPACT · 35 ms','FRAGMENTS · 130 ms','XP · 230 ms','EFFETS RÉDUITS'];
let last=0;const stages=[.035,.13,.23];
for(const [i,age]of stages.entries()){
 g.s.elapsed=42+age;g.updateDrops(age-last);g.updateEffects(age-last);last=age;
 const before=JSON.stringify(g.s),effects=JSON.stringify(g.defeatEffects);renderer.render(g,g.s.elapsed);assert.equal(JSON.stringify(g.s),before);assert.equal(JSON.stringify(g.defeatEffects),effects);
 writeFileSync(resolve(output,`defeat-${i}.png`),canvas.toBuffer('image/png'));cc.drawImage(await loadImage(canvas.toBuffer('image/png')),i*390,0);
}
const reduced=fixture();reduced.hurt(reduced.s.enemies[0],10000);reduced.s.elapsed+=.035;renderer.reducedEffects=true;renderer.render(reduced,reduced.s.elapsed);cc.drawImage(await loadImage(canvas.toBuffer('image/png')),1170,0);writeFileSync(resolve(output,'defeat-reduced.png'),canvas.toBuffer('image/png'));
for(let i=0;i<4;i++){cc.fillStyle='#151326';cc.fillRect(i*390,0,390,35);cc.fillStyle=i===2?'#75e7f2':'#fff4d7';cc.font='bold 15px monospace';cc.fillText(labels[i],i*390+16,24);}
writeFileSync(resolve(output,'defeat-contact.png'),contact.toBuffer('image/png'));
// Rendering all normal/boss families uses the same complete actor snapshot.
const types=['normal','orangutan','tank','matriarch','travestia','pelican','moose','disco_chicken'],sheet=createCanvas(960,480),sc=sheet.getContext('2d');sc.fillStyle='#292039';sc.fillRect(0,0,960,480);
for(let i=0;i<types.length;i++){
 const f=new Game({seed:42}),e=f.spawnEnemy(types[i],0,0);assert(e);f.hurt(e,1e9);f.s.elapsed=.035;renderer.combat.prepare(f.s,f.seed,f.defeatEffects);renderer.reducedEffects=false;
 const old=renderer.ctx;renderer.ctx=sc;sc.save();sc.translate(i%4*240+120,Math.floor(i/4)*240+196);renderer._defeatImpact(f.defeatEffects[0],f.s);sc.restore();renderer.ctx=old;
 const stamp=renderer.defeatStamps.get(f.defeatEffects[0]).original,pixels=stamp.getContext('2d').getImageData(0,0,stamp.width,stamp.height).data;
 // Check an uncropped oracle's bounds: disconnected feet can lie beyond a cropped edge.
 const oracle=createCanvas(512,512),oc=oracle.getContext('2d');oc.imageSmoothingEnabled=false;oc.translate(256,256);
 renderer.actors.draw(oc,{...f.defeatEffects[0].actor,hitFlash:0},'enemy',f.defeatEffects[0].phase,f.s,0,true);
 const expected=oc.getImageData(0,0,512,512).data;
 for(let n=3;n<expected.length;n+=4)if(expected[n]){
   const pixel=(n-3)/4,x=pixel%512-256,y=Math.floor(pixel/512)-256;
   assert(x>=-112&&x<stamp.width-112&&y>=-184&&y<stamp.height-184,`${types[i]} opaque painting fits the impact stamp`);
 }

 for(let x=0;x<stamp.width;x++)assert.equal(pixels[((stamp.height-1)*stamp.width+x)*4+3],0,`${types[i]} feet must not touch the clipped stamp edge`);
 for(let y=0;y<stamp.height;y++){assert.equal(pixels[(y*stamp.width)*4+3],0,`${types[i]} left edge`);assert.equal(pixels[(y*stamp.width+stamp.width-1)*4+3],0,`${types[i]} right edge`);}

 sc.fillStyle='#fff4d7';sc.font='13px monospace';sc.fillText(types[i],i%4*240+14,Math.floor(i/4)*240+226);
}
writeFileSync(resolve(output,'defeat-actors.png'),sheet.toBuffer('image/png'));
// A 300-enemy native-Canvas stress test; this is not a phone/browser measurement.
const crowded=new Game({seed:42});crowded.s.elapsed=500;crowded.s.hp=crowded.s.maxhp=1e8;crowded.s.xpNeed=1e9;
for(let i=0;i<300;i++){const a=i*2.39996,r=45+Math.sqrt(i/300)*350;crowded.spawnEnemy(['normal','orangutan','tank','sprinter'][i%4],Math.cos(a)*r,Math.sin(a)*r);}
function measure(mode,frames=120){
 // Native Skia keeps previous draw recordings unless reset; a browser's frame boundary handles this.
 renderer.reducedEffects=mode==='reduced';for(let i=0;i<12;i++){renderer.ctx.reset();renderer.render(crowded,crowded.s.elapsed);canvas.getContext('2d').getImageData(0,0,1,1);}
 const times=[];for(let i=0;i<frames;i++){const start=performance.now();renderer.ctx.reset();renderer.render(crowded,crowded.s.elapsed);canvas.getContext('2d').getImageData(0,0,1,1);times.push(performance.now()-start);}
 times.sort((a,b)=>a-b);return {mean:times.reduce((a,b)=>a+b,0)/frames,p95:times[Math.floor(frames*.95)]};
}
const baseline=measure('normal');for(const e of crowded.s.enemies.slice(0,16))crowded.hurt(e,1e9);
const coldStart=performance.now();renderer.render(crowded,crowded.s.elapsed);canvas.getContext('2d').getImageData(0,0,1,1);const coldImpactMs=performance.now()-coldStart;
const impact=measure('normal');crowded.s.elapsed+=.12;const breakup=measure('normal'),reducedMs=measure('reduced');
assert.equal(crowded.defeatEffects.length,16);assert(renderer.defeatStamps.size<=16);
const state=JSON.stringify(crowded.s);renderer.render(crowded,crowded.s.elapsed);assert.equal(JSON.stringify(crowded.s),state);
crowded.s.elapsed+=1;crowded.updateEffects(0);renderer.render(crowded,crowded.s.elapsed);assert.equal(crowded.defeatEffects.length,0);assert.equal(renderer.defeatStamps.size,0);
const report={framesPerTiming:120,baseline300:baseline,impact284Plus16:impact,breakup284Plus128Chunks:breakup,reduced:reducedMs,coldImpactMs,maxDefeatRecords:16,maxBreakupChunks:128,readOnly:true,expiredCachesReleased:true,browser:false,physicalMobile:false};
writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
