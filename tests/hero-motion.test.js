import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {computeHeroPose} from '../dist/hero-pose.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function game(){const g=new Game({seed:42});for(const key of Object.keys(g.timers))g.timers[key]=100000;g.nextEvent=100000;g.s.shotClock=100;return g;}
function enemy(x,y,id=1){return {id,type:'normal',x,y,r:18,hp:100,maxhp:100,charmed:0};}
function settle(g,n=30){for(let i=0;i<n;i++)g.weapons(1/60);}

test('body keeps the same chest-based view across the 80px contact threshold',()=>{
 const g=game(),e=enemy(80.01,0);g.s.enemies=[e];settle(g);const view=computeHeroPose(g.s).art.id;
 for(let i=0;i<30;i++){e.x=i%2?80.01:79.99;g.weapons(1/60);assert.equal(computeHeroPose(g.s).art.id,view);}
});
test('free movement has seam hysteresis and an idle hero keeps the last body view',()=>{
 const g=game();g.s.moveX=1;settle(g);for(let i=0;i<30;i++){const angle=(i%2?7.1:6.9)*Math.PI/180;g.s.moveX=Math.cos(angle);g.s.moveY=Math.sin(angle);g.weapons(1/60);assert.equal(computeHeroPose(g.s).art.id,'E');}
 const h=game(),a=39*Math.PI/180;h.s.enemies=[enemy(Math.cos(a)*200,Math.sin(a)*200)];settle(h);const view=computeHeroPose(h.s).art.id;h.s.enemies=[];settle(h);assert.equal(computeHeroPose(h.s).art.id,view);
});
test('an opposite target turns through intermediate views without delaying exact shots',()=>{
 const g=game();g.s.enemies=[enemy(200,-40)];settle(g);g.s.enemies=[enemy(-200,-40)];const views=[];
 for(let i=0;i<18;i++){g.weapons(1/60);const p=computeHeroPose(g.s);views.push(p.art.id);const dx=-200-p.muzzle.x,dy=-40-p.muzzle.y;assert.ok(Math.abs(dx*p.aim.y-dy*p.aim.x)<1e-7);}
 assert.notEqual(views[0],'W');assert.equal(views.at(-1),'W');assert.ok(new Set(views).size>=4,views.join(','));
});
test('switching forward to backward never reflects the current gait phase',()=>{
 const g=game();g.s.moveX=1;g.s.walkMoving=true;g.s.walkDistance=20;g.s.enemies=[enemy(200,-40)];settle(g);const phase=computeHeroPose(g.s).art.frameIndex;
 g.s.moveX=-1;g.s.travelX=-1;g.weapons(1/60);assert.equal(computeHeroPose(g.s).art.frameIndex,phase);
 g.s.walkDistance+=10;g.weapons(1/60);assert.equal(computeHeroPose(g.s).art.frameIndex,(phase+7)%8);
});
test('turn state freezes in modal screens and is deterministic after a save',()=>{
 const g=game();g.update(.1,{x:1,y:0});g.update(.02,{x:-1,y:0});const original=JSON.stringify(g.s.heroMotion);assert.ok(g.s.heroMotion);
 for(const mode of ['paused','upgrade','dialogue']){g.s.mode=mode;g.update(.2,{x:-1,y:0});assert.equal(JSON.stringify(g.s.heroMotion),original);}g.s.mode='playing';
 const copy=restoreRun(captureRun(g));for(let i=0;i<20;i++){g.update(1/60,{x:-1,y:0});copy.update(1/60,{x:-1,y:0});assert.deepEqual(copy.s.heroMotion,g.s.heroMotion);assert.deepEqual(computeHeroPose(copy.s),computeHeroPose(g.s));}
});
test('old snapshots without motion state still restore and do not move the player during a turn',()=>{
 const g=game(),snap=captureRun(g);delete snap.game.s.heroMotion;const restored=restoreRun(snap);restored.s.enemies=[enemy(-200,-40)];const position=[restored.s.x,restored.s.y];settle(restored);assert.deepEqual([restored.s.x,restored.s.y],position);assert.equal(computeHeroPose(restored.s).art.id,'W');
});
test('malformed presentation state is rejected without changing save version or keys',()=>{
 const g=game();g.update(.1,{x:1,y:0});const good=captureRun(g);
 for(const [key,value]of [['angle',100],['phase',8],['distance',-1],['reverse',1]]){const bad=structuredClone(good);bad.game.s.heroMotion[key]=value;assert.throws(()=>restoreRun(bad),/Invalid run save/);}
 const legacy=structuredClone(good);delete legacy.game.s.heroMotion;assert.equal(captureRun(restoreRun(legacy)).version,good.version);
});
test('a shot due during a half-turn faces its target without delaying damage or firing backwards',()=>{
 const g=game();g.s.enemies=[enemy(200,-40)];settle(g);g.s.enemies=[enemy(-200,-40)];g.s.shotClock=0;g.weapons(1/60);
 const p=computeHeroPose(g.s),shot=g.s.shots.find(x=>x.kind==='bullet');assert.ok(shot);assert.ok(shot.vx*p.barrelAim.x+shot.vy*p.barrelAim.y>0,'the shot leaves the forward painted barrel');assert.ok(Math.hypot(shot.x-p.muzzle.x,shot.y-p.muzzle.y)<1e-8);assert.equal(g.s.shotClock,g.s.stats.fireInterval);
});
test('a close target switching sides still receives a projectile rather than new instant contact damage',()=>{
 const g=game();g.s.enemies=[enemy(200,-40)];settle(g);const e=enemy(-79,0);g.s.enemies=[e];g.s.shotClock=0;g.weapons(1/60);assert.equal(e.hp,100);assert.equal(g.s.shots.filter(s=>s.kind==='bullet').length,1);
});
