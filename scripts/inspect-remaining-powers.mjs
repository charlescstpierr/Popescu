import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const out=resolve(process.argv[2]||'/tmp/popescu-remaining-qa');mkdirSync(out,{recursive:true});process.chdir(new URL('../dist',import.meta.url).pathname);
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{UPGRADES}=await import('../dist/content.js'),{EVOLUTIONS}=await import('../dist/evolutions.js'),{CombatArt}=await import('../dist/combat-art.js');
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;
const groups=[['followers','ego','money'],['charisma','chopper','filter'],['validation','speed','magnet'],['detox','billionaire','viralLove'],['recovery','payday','barrier']];
const fallback={recovery:'PAUSE PROTÉINÉE',payday:'PETIT CONTRAT',barrier:'COMPLIMENT GRATUIT'};
const name=id=>([...UPGRADES,...EVOLUTIONS].find(u=>u.id===id)?.name||fallback[id]).toUpperCase();
function setup(power){
 renderer.combat=new CombatArt();renderer.defeatStamps.clear();
 const g=new Game({seed:42});g.s.elapsed=42;g.s.faceX=1;g.s.faceY=0;g.s.aimX=1;g.s.aimY=0;g.s.hp=40;g.s.xpNeed=1e9;g.nextEvent=1e9;g.s.shotClock=99;
 for(const key in g.timers)g.timers[key]=1e9;
 for(const [type,x,y]of [['normal',128,0],['orangutan',-120,115],['gas',130,-190]]){const e=g.spawnEnemy(type,x,y);e.hp=e.maxhp=1000;e.speed=0;e.cooldown=99;e.attack=99;}
 if(power==='chopper')g.s.enemies[0].x=70;
 if(power==='billionaire')Object.assign(g.s.upg,{car:3,money:3});
 if(power==='viralLove'||power==='charisma'){Object.assign(g.s.upg,{girlfriend:3,charisma:power==='viralLove'?3:0});g.s.companion=true;g.s.girl.x=-45;g.s.girl.y=34;}
 if(power==='viralLove'){g.s.enemies=[];for(const[x,y]of[[50,35],[100,-65],[160,40]]){const e=g.spawnEnemy('tank',x,y);e.hp=e.maxhp=1000;e.speed=0;e.attack=99;}g.s.girl.x=-25;g.s.girl.y=35;}
 g.recalculate();g.s.mode='upgrade';g.s.options=[{id:power}];assert(g.chooseUpgrade(power));g.s.invulnerable=0;return g;
}
function use(g,id){
 const s=g.s;
 if(['ego','recovery','payday','barrier'].includes(id)){s.elapsed+=.35;return;}
 s.elapsed+=1.1;g.prunePowerEffects();s.invulnerable=0;
 if(id==='followers'){s.shotClock=0;g.weapons(0);g.updateShots(.12);s.shotClock=0;g.weapons(0);}
 if(id==='money'){g.timers.money=0;g.weapons(0);g.updateShots(.25);s.drops=[{kind:'coin',x:0,y:0,value:1,life:30}];g.updateDrops(0);}
 if(id==='charisma'){for(const e of s.enemies)e.speed=43;g.updateEnemies(.08);s.girl.shoot=0;g.updateCompanion(0);g.updateShots(.3);}
 if(id==='chopper'){g.timers.chopper=0;g.weapons(0);g.updateVehicles(.57);}
 if(id==='filter'){s.clouds=[{x:16,y:0,r:32,maxr:32,arm:0,life:5,maxlife:5,vx:0,vy:0}];g.damage(8,'gas');s.invulnerable=0;s.walkMoving=true;s.moveX=1;s.walkDistance=30;}
 if(id==='validation'){s.shield=6;g.lastHit=0;g.step(.03,{x:0,y:0});}
 if(id==='speed'){g.update(.15,{x:1,y:0});}
 if(id==='magnet'){s.drops=[{kind:'xp',x:-70,y:12,value:2,life:30},{kind:'coin',x:65,y:30,value:1,life:30},{kind:'heal',x:15,y:80,value:5,life:30}];g.updateDrops(.04);}
 if(id==='detox')g.step(.03,{x:0,y:0});
 if(id==='billionaire'){g.timers.car=0;g.weapons(0);g.updateVehicles(.8);g.updateShots(.28);g.updateVehicles(.28);}
 if(id==='viralLove'){s.girl.shoot=0;g.updateCompanion(0);for(let i=0;i<34;i++){s.elapsed+=.01;g.updateShots(.01);}}
}
function render(g,file,reduced=false){renderer.reducedEffects=reduced;const before=JSON.stringify(g.s),fx=JSON.stringify(g.powerEffects);renderer.render(g,g.s.elapsed);assert.equal(JSON.stringify(g.s),before);assert.equal(JSON.stringify(g.powerEffects),fx);writeFileSync(resolve(out,file),canvas.toBuffer('image/png'));}
const files=[];
for(let group=0;group<groups.length;group++){
 const page=createCanvas(780,1020),c=page.getContext('2d');c.fillStyle='#151326';c.fillRect(0,0,780,1020);
 for(const[row,id]of groups[group].entries()){
  const g=setup(id);g.s.elapsed+=.08;render(g,`${id}-acquire.png`);c.drawImage(canvas,0,245,390,290,0,row*340+50,390,290);files.push(`${id}-acquire.png`);
  use(g,id);render(g,`${id}-use.png`);c.drawImage(canvas,0,245,390,290,390,row*340+50,390,290);files.push(`${id}-use.png`);render(g,`${id}-use-reduced.png`,true);
  c.fillStyle='#151326';c.fillRect(0,row*340,780,50);c.font='bold 16px monospace';c.fillStyle='#ffdc66';c.fillText(name(id),14,row*340+21);c.font='12px monospace';c.fillStyle='#e7e2f0';c.fillText('ACQUISITION · MOTEUR RÉEL',14,row*340+41);c.fillText('EFFET EN JEU · MOTEUR RÉEL',404,row*340+41);
  const reduced=setup(id);reduced.s.elapsed+=.2;render(reduced,`${id}-reduced.png`,true);
 }
 writeFileSync(resolve(out,`remaining-${group+1}-contact.png`),page.toBuffer('image/png'));
}
const bikeImpact=setup('chopper');use(bikeImpact,'chopper');assert(bikeImpact.powerEffects.some(e=>e.power==='chopper'&&e.kind==='impact'));assert.equal(bikeImpact.s.enemies[0].hp,937);assert(bikeImpact.s.enemies[0].x>70);render(bikeImpact,'chopper-impact.png');
renderer.resize(320,640);const narrow=setup('filter');use(narrow,'filter');render(narrow,'filter-320.png');const narrowReduced=setup('barrier');render(narrowReduced,'barrier-reduced-320.png',true);renderer.resize(390,844);
// Stress the complete effect combination at the existing enemy cap.
const crowd=setup('speed');crowd.s.enemies=[];for(const id of UPGRADES.map(u=>u.id))crowd.s.upg[id]=5;crowd.recalculate();crowd.s.walkMoving=true;crowd.s.moveX=1;crowd.s.shield=60;crowd.s.clouds=[{x:10,y:10,r:32,life:4,maxlife:4,arm:0}];
for(let i=0;i<300;i++){const a=i*2.399963,r=35+Math.sqrt(i/300)*380;crowd.spawnEnemy(['normal','orangutan','tank','gas'][i%4],Math.cos(a)*r,Math.sin(a)*r);}
for(let i=0;i<16;i++)crowd.powerEffect(groups.flat()[i%15],i%2?'acquire':'activate');
render(crowd,'crowd-300-normal.png');render(crowd,'crowd-300-reduced.png',true);
function measure(reduced){renderer.reducedEffects=reduced;const values=[];for(let i=0;i<75;i++){const start=performance.now();renderer.ctx.reset();renderer.render(crowd,crowd.s.elapsed);renderer.ctx.getImageData(0,0,1,1);if(i>=15)values.push(performance.now()-start);}values.sort((a,b)=>a-b);return{meanMs:values.reduce((a,b)=>a+b,0)/values.length,p95Ms:values[Math.floor(values.length*.95)]};}
const report={nativeCanvas:true,browser:false,physicalMobile:false,powers:15,files,enemies:300,powerCueCap:crowd.powerEffects.length,stampCache:renderer.heroPowerStamps.size,normal:measure(false),reduced:measure(true)};
writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
