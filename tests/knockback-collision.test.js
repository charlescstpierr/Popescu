import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

// Real World collision math with controlled solid footprints, not a collides mock.
function scene(props=[],x=0,y=0){
 const g=new Game({seed:42});g.world.chunks.clear();
 for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)g.world.chunks.set(`${a},${b}`,[]);
 for(const p of props)g.world.chunks.get(`${Math.floor(p.x/512)},${Math.floor(p.y/512)}`).push({id:`wall:${p.x}:${p.y}`,type:'pine',solid:true,...p});
 g.world.collisionRegion=null;g.world.collisionBounds=new WeakMap();
 const e=g.spawnEnemy('tank',x,y);e.hp=e.maxhp=1000;return {g,e};
}
function truth(g,e,dx,dy){g.areaDamage(e.x-dx*80,e.y-dy*80,200,43,true);}
function bike(g,e,dx,dy,knockback=85){g.s.vehicles.push({kind:'bike',x:e.x,y:e.y,vx:dx*640,vy:dy*640,life:1,damage:63,knockback,hitIds:new Set()});g.updateVehicles(0);}
const wall={x:26,y:0,w:20,h:18};
for(const power of ['truth','bike'])for(const direction of [1,-1]){
 test(`${power} cannot knock a surviving enemy through a solid in direction ${direction}`,()=>{
  const {g,e}=scene([{...wall,x:26*direction}]);assert.equal(g.world.collides(e.x,e.y,e.r*.6),false);
  (power==='truth'?truth:bike)(g,e,direction,0);
  assert.equal(e.dead,false);assert.equal(e.hp,power==='truth'?957:937);
  assert.equal(e.x,0,'a blocked axis must not jump across terrain');assert.equal(e.y,0);
 });
}
test('vertical and diagonal knockback keep the established X-then-Y wall sliding',()=>{
 const vertical=scene([{x:0,y:26,w:18,h:20}]);truth(vertical.g,vertical.e,0,1);assert.equal(vertical.e.y,0);
 const {g,e}=scene([{x:18,y:0,w:2,h:2}]);const n=Math.SQRT1_2;truth(g,e,n,n);
 assert.equal(e.x,0);assert.ok(Math.abs(e.y-52*n)<1e-10);assert.equal(g.world.collides(e.x,e.y,e.r*.6),false);
});
test('swept knockback catches sub-pixel grazing crossings but permits exact tangency',()=>{
 const radius=26*.6;
 const hit=scene([{x:22.5,y:0,w:.01,h:1}],0,.5+radius-1e-6);truth(hit.g,hit.e,1,0);assert.equal(hit.e.x,0);
 const tangent=scene([{x:22.5,y:0,w:.01,h:1}],0,.5+radius);truth(tangent.g,tangent.e,1,0);assert.equal(tangent.e.x,52);
});
test('swept knockback checks obstacles across chunk boundaries and ignores destroyed solids',()=>{
 const {g,e}=scene([{x:520,y:0,w:20,h:18}],480,0);bike(g,e,1,0);assert.equal(e.x,480);
 g.world.setDestroyed(['wall:520:0']);bike(g,e,1,0);assert.equal(e.x,565);
});
test('unobstructed knockback preserves exact distances, damage and single vehicle hits',()=>{
 for(const rank of [1,5])for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[.6,.8]]){
  const {g,e}=scene();bike(g,e,dx,dy,75+rank*10);assert.equal(e.x,dx*(75+rank*10));assert.equal(e.y,dy*(75+rank*10));assert.equal(e.hp,937);g.updateVehicles(0);assert.equal(e.hp,937);
 }
 const {g,e}=scene();truth(g,e,.6,.8);assert.ok(Math.abs(e.x-31.2)<1e-12);assert.ok(Math.abs(e.y-41.6)<1e-12);assert.equal(e.hp,957);
});
test('existing overlap can still escape but cannot bypass a different solid',()=>{
 const {g,e}=scene([{x:0,y:0,w:20,h:18}]);assert.equal(g.world.collides(0,0,e.r*.6),true);truth(g,e,1,0);assert.equal(e.x,52);
 const blocked=scene([{x:0,y:0,w:20,h:18},{x:40,y:0,w:20,h:18}]);truth(blocked.g,blocked.e,1,0);assert.equal(blocked.e.x,0);
});
for(const power of ['truth','chopper'])test(`${power} full simulation stops at the seeded pine with exact save and pause continuation`,()=>{
 const g=new Game({seed:42});g.s.elapsed=60;const pine=g.world.chunk(2,0).find(p=>p.id==='2,0:forest:5');assert.equal(pine.type,'pine');
 Object.assign(g.s,{x:power==='truth'?1093:1088,y:375});g.world.update(g.s.x,g.s.y);g.nextEvent=1e6;
 for(const key in g.timers)if(key!=='animalIndex')g.timers[key]=1e6;
 g.s.upg[power]=1;g.recalculate();g.timers[power]=0;
 const e=g.spawnEnemy(power==='truth'?'jealous':'tank',power==='truth'?1173:1168,375),hp=e.hp;
 assert.equal(g.world.collides(e.x,e.y,e.r*.64),false);
 const resumed=restoreRun(captureRun(g));g.pause();const paused=captureRun(g);g.update(.25);assert.deepEqual(captureRun(g),paused);g.resume();
 let survivedImpact=false;
 for(let frame=0;frame<40;frame++){
  g.update(1/60);resumed.update(1/60);assert.deepEqual(captureRun(g),captureRun(resumed));
  if(hp-e.hp>=(power==='truth'?43:63)&&!e.dead)survivedImpact=true;
  assert.ok(e.x<pine.x-pine.w/2,'the living enemy must remain on the original side');
 }
 assert.ok(survivedImpact,'the enemy survives the power before ordinary gunfire may finish it');assert.equal(g.s.mode,'playing');
});

test('an overlapping start uses the X actually accepted before sweeping Y',()=>{
 for(const [wallX,wantY] of [[37,52*Math.SQRT1_2],[0,0]]){
  const {g,e}=scene([{x:0,y:0,w:80,h:2},{x:wallX,y:18,w:1,h:.2}]);truth(g,e,Math.SQRT1_2,Math.SQRT1_2);
  assert.equal(e.x,0);assert.ok(Math.abs(e.y-wantY)<1e-10);
 }
});
