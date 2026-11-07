import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Game} from '../dist/engine.js';
import {Renderer} from '../dist/renderer.js';
import {CombatArt,DangerLayer,FX,hitFlashAlpha} from '../dist/combat-art.js';

const inert=()=>new Proxy({createRadialGradient:()=>({addColorStop(){}}),globalAlpha:1},{get:(o,k)=>k in o?o[k]:()=>{}});
function scene(){const game=new Game({seed:42});game.s.elapsed=10;game.world.collides=()=>false;const view=new Renderer({getContext:inert});view._drawGround=()=>{};game.world.getVisible=()=>[];return {game,view,s:game.s};}

test('every feel effect is declared in one registry with finite lifetimes and caps',()=>{
 for(const [name,spec]of Object.entries(FX)){
  for(const key of ['life','cap','shakeLife','hold'])if(key in spec)assert.ok(Number.isFinite(spec[key])&&spec[key]>0,`${name}.${key}`);
 }
 assert.ok(FX.hurt.shake<=4&&FX.slam.shake<=4&&FX.blast.shake<=4,'screen shake stays a few pixels');
 assert.ok(FX.hurt.shakeLife<=.15,'player-hurt shake lasts about 120 ms');
 assert.ok(FX.flash.hold<=1/30+1e-9,'the white hit flash holds for at most two 60 Hz frames');
});

test('a 300-enemy hit storm stays inside the effect caps',()=>{
 const g=new Game({seed:42}),art=new CombatArt(),s=g.s;s.elapsed=5;
 for(let i=0;i<300;i++){const e=g.spawnEnemy('normal',(i%20)*30-300,Math.floor(i/20)*30-200);e.hp=e.maxhp=1e6;}
 art.prepare(s,g.seed,g.defeatEffects);
 for(let frame=0;frame<30;frame++){s.elapsed+=1/60;for(const e of s.enemies)g.hurt(e,7);art.prepare(s,g.seed,g.defeatEffects);
  assert.ok(art.sprays.length<=FX.spark.cap);assert.ok(art.recoils.size<=FX.recoil.cap);assert.ok(art.effects.length<=48);assert.ok(art.shakes.length<=FX.shake.cap);}
 assert.equal(art.shakes.length,0,'routine hits never shake the camera');
});

test('hits on one enemy within a few frames grow one popping number',()=>{
 const g=new Game({seed:42}),art=new CombatArt(),e=g.spawnEnemy('tank',80,0);g.s.elapsed=3;art.prepare(g.s,g.seed,g.defeatEffects);
 g.hurt(e,6);g.s.elapsed+=1/60;art.prepare(g.s,g.seed,g.defeatEffects);g.hurt(e,9);g.s.elapsed+=1/60;art.prepare(g.s,g.seed,g.defeatEffects);
 const numbers=art.effects.filter(x=>x.kind==='hit');assert.equal(numbers.length,1);assert.equal(numbers[0].value,15);assert.equal(numbers[0].bump,g.s.elapsed);
 g.s.elapsed+=.5;g.hurt(e,4);art.prepare(g.s,g.seed,g.defeatEffects);assert.equal(art.effects.filter(x=>x.kind==='hit').length,2,'a later hit starts its own number');
});

test('player damage shakes a few pixels for about 120 ms with a red edge, keyed to simulation time',()=>{
 const g=new Game({seed:42}),art=new CombatArt(),s=g.s;s.elapsed=4;art.prepare(s,g.seed,g.defeatEffects);
 g.damage(10,'touch',{actorType:'normal'});art.prepare(s,g.seed,g.defeatEffects);
 let moved=false;for(let t=0;t<FX.hurt.shakeLife;t+=1/120){const o=art.shake(s.elapsed+t);assert.ok(Math.abs(o.x)<=FX.hurt.shake&&Math.abs(o.y)<=FX.hurt.shake);if(o.x||o.y)moved=true;}
 assert.ok(moved,'the hurt kick is visible');
 const a=art.shake(s.elapsed+.03),first={x:a.x,y:a.y},b=art.shake(s.elapsed+.03);assert.deepEqual({x:b.x,y:b.y},first,'a paused frame keeps the same offset');
 assert.deepEqual({...art.shake(s.elapsed+FX.hurt.shakeLife+.001)},{x:0,y:0});
 assert.ok(art.hurt(s.elapsed)>.9);assert.ok(art.hurt(s.elapsed+FX.hurt.life)<1e-9);assert.equal(art.hurt(s.elapsed+FX.hurt.life+.001),0);
 assert.deepEqual({...art.shake(s.elapsed+.03,true)},{x:0,y:0},'reduced effects never shake');assert.equal(art.hurt(s.elapsed,true),0,'reduced effects never flash the edges');
});

test('distant explosions do not shake; nearby ones do, briefly',()=>{
 for(const [distance,expect]of [[60,true],[2000,false]]){
  const g=new Game({seed:42}),art=new CombatArt(),s=g.s;s.elapsed=4;art.prepare(s,g.seed,g.defeatEffects);
  g.pulse(distance,0,87,'#f5a16c',.65);art.prepare(s,g.seed,g.defeatEffects);assert.equal(art.shakes.length>0,expect,`distance ${distance}`);
 }
});

test('recoil is a decaying presentation offset that is off in reduced effects',()=>{
 const g=new Game({seed:42}),art=new CombatArt(),e=g.spawnEnemy('normal',120,0);g.s.elapsed=2;art.prepare(g.s,g.seed,g.defeatEffects);
 g.hurt(e,5);art.prepare(g.s,g.seed,g.defeatEffects);const x=e.x,y=e.y;
 const peak=art.recoil(e.id,g.s.elapsed+FX.recoil.life*.25);assert.ok(peak&&peak.x>0,'the enemy is shoved away from Toma');assert.ok(Math.hypot(peak.x,peak.y)<=FX.recoil.px+1);
 assert.equal(art.recoil(e.id,g.s.elapsed+FX.recoil.life),null);assert.equal(art.recoil(e.id,g.s.elapsed+.02,true),null);
 assert.equal(e.x,x);assert.equal(e.y,y,'the simulation position is never touched');
});

test('hit flash holds a near-white silhouette briefly, then fades; reduced mode only tints',()=>{
 assert.equal(hitFlashAlpha(FX.flash.life),FX.flash.peak);assert.ok(hitFlashAlpha(FX.flash.life-FX.flash.hold-.01)<=FX.flash.tail);
 assert.equal(hitFlashAlpha(0),0);assert.ok(hitFlashAlpha(FX.flash.life,true)<=FX.flash.reduced);
});

test('collected pickups sparkle; pickups removed far from Toma do not',()=>{
 const g=new Game({seed:42}),art=new CombatArt(),s=g.s;s.elapsed=1;s.drops=[{x:12,y:4,kind:'xp',value:2,life:20},{x:900,y:0,kind:'coin',value:1,life:20}];
 art.prepare(s,g.seed,g.defeatEffects);s.drops=[];s.elapsed+=1/60;art.prepare(s,g.seed,g.defeatEffects);
 assert.equal(art.collects.length,1);assert.equal(art.collects[0].color,'#75e7f2');
});

test('the real render traversal with every feel effect active never changes the run',()=>{
 const {game,view,s}=scene();const victims=[];for(let i=0;i<8;i++)victims.push(game.spawnEnemy(['normal','tank','explosive','jealous'][i%4],60+i*14,-40+(i%3)*20));
 victims[2].windup=.4;victims[3].windup=.3;s.drops=[{x:10,y:0,kind:'xp',value:2,life:20}];view.render(game,10);
 for(const e of victims)game.hurt(e,e===victims[0]?1e6:9);game.damage(8,'touch',{actorType:'normal'});s.shotClock=s.stats.fireInterval;s.drops=[];s.level+=1;
 const before=JSON.stringify(s),effects=JSON.stringify(game.defeatEffects);
 for(let i=0;i<20;i++){view.render(game,10+i/60);view.reducedEffects=i%2===1;}
 assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify(game.defeatEffects),effects);
 assert.ok(view.combat.shots.length>=1&&view.combat.collects.length===1&&view.combat.sprays.length>0);
});

test('muzzle bloom, smoke and brass are painted before Toma, never over his painting',()=>{
 const {game,view,s}=scene(),order=[];view.render(game,10);s.shotClock=s.stats.fireInterval;view.combat.prepare(s,game.seed,game.defeatEffects);
 const under=view.combat.drawHeroUnder.bind(view.combat);view.combat.drawHeroUnder=(...a)=>{order.push('under');under(...a);};
 view.hero.draw=()=>{order.push('hero');return true;};view._actor(s,'hero',0,s);
 assert.deepEqual(order,['under','hero']);
});

test('danger fills merge without changing the warned area or stacking opacity',async t=>{
 const require=createRequire(import.meta.url);let native;try{native=require('@napi-rs/canvas');}catch{}
 if(!native){t.skip('@napi-rs/canvas is not installed');return;}
 const hadOffscreen='OffscreenCanvas' in globalThis,previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
 try{
  const shapes=[[90,100,48,.2],[130,100,48,.29],[110,140,40,.16],[60,150,30,.22]];
  const paint=(ctx,layered)=>{const d=new DangerLayer(),c=layered?d.record(ctx):ctx;
   for(const [x,y,r,a]of shapes){c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.globalAlpha=a;c.fillStyle='#ff472b';c.fill();c.restore();}
   c.save();c.translate(150,60);c.rotate(.4);c.beginPath();c.rect(-10,-12,90,24);c.globalAlpha=.25;c.fill();c.restore();
   if(layered)d.flush(1);};
  const direct=native.createCanvas(240,220),merged=native.createCanvas(240,220);paint(direct.getContext('2d'),false);paint(merged.getContext('2d'),true);
  const a=direct.getContext('2d').getImageData(0,0,240,220).data,b=merged.getContext('2d').getImageData(0,0,240,220).data;
  let differentCoverage=0;for(let i=3;i<a.length;i+=4){if((a[i]>8)!==(b[i]>8))differentCoverage++;assert.ok(b[i]<=Math.round(.29*255)+2,'no pixel exceeds the strongest single zone');}
  assert.ok(differentCoverage<60,'the merged layer warns exactly the same area (anti-aliasing aside)');
  const overlap=(x,y)=>merged.getContext('2d').getImageData(x,y,1,1).data[3];
  assert.ok(Math.abs(overlap(110,100)-Math.round(.29*255))<=2,'an overlap shows the stronger zone level');
  assert.ok(direct.getContext('2d').getImageData(110,100,1,1).data[3]>overlap(110,100)+20,'the old direct drawing stacked opacity there');
 }finally{if(hadOffscreen)globalThis.OffscreenCanvas=previous;else delete globalThis.OffscreenCanvas;}
});
