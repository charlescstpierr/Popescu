import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const out=resolve(process.argv[2]||'/tmp/popescu-power-qa');mkdirSync(out,{recursive:true});process.chdir(new URL('../dist',import.meta.url).pathname);
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{UPGRADES}=await import('../dist/content.js'),{CombatArt}=await import('../dist/combat-art.js');
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;
const cases=[['car','LAMBORGHINI',[.08,.54,1.62]],['girlfriend','BLONDE IA',[.08,.3,.7]],['airplane','MODE AVION',[0,.15,.86]],['muscle','MUSCLES PHOTOSHOP',[.08,.4,.7]],['truth','VÉRITÉ BRUTE',[.08,.42,.73]]];
const contact=createCanvas(1170,1640),cc=contact.getContext('2d');cc.fillStyle='#151326';cc.fillRect(0,0,1170,1640);
function setup(power){
 renderer.combat=new CombatArt();renderer.defeatStamps.clear();
 const g=new Game({seed:42});g.s.elapsed=42;g.s.faceX=1;g.s.faceY=0;g.s.aimX=1;g.s.aimY=0;g.s.hp=g.s.maxhp=1e6;g.s.xpNeed=1e9;g.nextEvent=1e9;
 for(const key in g.timers)g.timers[key]=1e9;
 for(const [type,x,y]of [['normal',120,-25],['orangutan',-110,110],['gas',115,-205]]){const e=g.spawnEnemy(type,x,y);e.hp=e.maxhp=1000;e.speed=0;e.cooldown=99;e.attack=99;}
 if(power==='airplane')g.s.clouds.push({x:72,y:-25,r:34,maxr:40,arm:0,life:4,maxlife:4,vx:0,vy:0});
 g.s.mode='upgrade';g.s.options=[UPGRADES.find(u=>u.id===power)];assert(g.chooseUpgrade(power));return g;
}
const captures=[];
for(const [row,[power,name,stages]]of cases.entries()){
 const g=setup(power);let last=0;
 for(const [col,t]of stages.entries()){
  while(last<t-1e-8){const dt=Math.min(1/120,t-last);g.update(dt);last+=dt;}
  // The first frame is the actual choice before the first defensive tick.
  const before=JSON.stringify(g.s),effects=JSON.stringify(g.powerEffects);renderer.render(g,g.s.elapsed);assert.equal(JSON.stringify(g.s),before);assert.equal(JSON.stringify(g.powerEffects),effects);
  const file=`${power}-${col}.png`;writeFileSync(resolve(out,file),canvas.toBuffer('image/png'));captures.push(file);
  cc.drawImage(canvas,0,250,390,290,col*390,row*328+36,390,290);
  cc.fillStyle='#151326';cc.fillRect(col*390,row*328,390,36);cc.fillStyle=power==='car'?'#ffdc66':power==='airplane'||power==='truth'?'#89eeff':'#ff8ec8';cc.font='bold 15px monospace';cc.fillText(`${name} · ${Math.round(t*1000)} ms`,col*390+14,row*328+24);
 }
}
writeFileSync(resolve(out,'five-powers-contact.png'),contact.toBuffer('image/png'));
// Reduced-effects and 320 px evidence use the same production renderer.
const reduced=setup('airplane');reduced.update(.12);renderer.reducedEffects=true;renderer.render(reduced,reduced.s.elapsed);writeFileSync(resolve(out,'airplane-reduced.png'),canvas.toBuffer('image/png'));
renderer.resize(320,640);const narrow=setup('muscle');narrow.update(.18);renderer.render(narrow,narrow.s.elapsed);writeFileSync(resolve(out,'muscle-reduced-320.png'),canvas.toBuffer('image/png'));
renderer.resize(390,844);renderer.reducedEffects=false;
// Measure rendering cost with 300 enemies, with and without a maximum cue queue.
const crowd=setup('muscle');crowd.s.enemies=[];crowd.powerEffects.length=0;for(let i=0;i<300;i++){const a=i*2.399963,r=40+Math.sqrt(i/300)*390;crowd.spawnEnemy(['normal','orangutan','tank','sprinter'][i%4],Math.cos(a)*r,Math.sin(a)*r);}
function measure(reducedEffects,frames=90){renderer.reducedEffects=reducedEffects;const times=[];for(let i=0;i<frames+12;i++){const start=performance.now();renderer.ctx.reset();renderer.render(crowd,crowd.s.elapsed);renderer.ctx.getImageData(0,0,1,1);if(i>=12)times.push(performance.now()-start);}times.sort((a,b)=>a-b);return{meanMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:times[Math.floor(times.length*.95)]};}
const baseline=measure(false);for(let i=0;i<16;i++)crowd.powerEffect(cases[i%5][0],i%3?'acquire':'activate',0,0,169);const normal=measure(false),reducedPerf=measure(true);
const report={nativeCanvas:true,actualBrowser:false,physicalMobile:false,captures,output:out,performance:{enemies:300,effectCap:crowd.powerEffects.length,baseline,normal,reduced:reducedPerf}};
writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
