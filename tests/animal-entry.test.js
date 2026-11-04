import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {ANIMALS,updateAnimal} from '../dist/animals.js';
import {positionNewRun} from '../dist/opening.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
const types=Object.keys(ANIMALS);
const size=type=>type==='moose'?104:type==='ostrich'?98:80;
function fullFrame(g,e){const n=size(e.type),dx=e.x-g.s.x,dy=e.y-g.s.y;return Math.abs(dx)+n/2<=g.viewport.width/2&&dy+10-n*.94>=-g.viewport.height*.48&&dy+10+n*.06<=g.viewport.height*.52;}
function empty(g){g.world.chunks.clear();for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++)g.world.chunks.set(`${a},${b}`,[]);g.world.collisionBounds=new WeakMap();g.world.collisionRegion=null;}
function corridor(g,e){const d=Math.hypot(e.x-g.s.x,e.y-g.s.y),dx=(g.s.x-e.x)/d,dy=(g.s.y-e.y)/d;let hasInterior=false;for(let n=0;n<=d;n+=2){const p={...e,x:e.x+dx*n,y:e.y+dy*n};assert.equal(g.world.collides(p.x,p.y,e.r*.64),false,`${e.type} blocked at ${p.x},${p.y}`);if(fullFrame(g,p)&&Math.hypot(p.x-g.s.x,p.y-g.s.y)<=150){hasInterior=true;break;}}assert.ok(hasInterior,'the corridor reaches a fully visible interior point');}
function animal(g,index){g.rng=(g.seed^Math.imul(index+1,1640531527))|0;return g.spawnEnemy(types[index%4]);}
// Removing corridor validation restores these real seeded building-blocked arrivals.
for(const index of [1,2])test(`seed42 ${types[index]} enters along a clear real-world corridor`,()=>{const g=new Game({seed:42});positionNewRun(g);const e=animal(g,index);assert.ok(e);corridor(g,e);});
// Removing the viewport gate freezes a 220px attack outside the portrait screen.
for(const type of types)for(const [width,height] of [[390,844],[844,390],[240,320]])test(`${type} keeps chasing until its frame fits ${width}x${height}`,()=>{
 const g=new Game({seed:42});g.setViewport(width,height);empty(g);const e=g.spawnEnemy(type,width/2+ANIMALS[type].r+24,0);let warning=false;
 for(let i=0;i<40*60;i++){g.updateEnemies(1/60);if(e.phase==='animal_warning'){assert.ok(fullFrame(g,e),`windup at ${e.x},${e.y}`);warning=true;break;}}
 assert.ok(warning);assert.equal(g.s.hp,g.s.maxhp);assert.equal(e.hp,e.maxhp);assert.equal(e.charmed,0);
});
function solids(g,props){empty(g);for(const [index,p] of props.entries())g.world.chunks.get(`${Math.floor(p.x/512)},${Math.floor(p.y/512)}`).push({id:`wall:${index}`,type:'pine',solid:true,...p});}
function sealed(g){const props=[];for(const at of [-160,-80,0,80,160])for(const side of [-170,170])props.push({x:side,y:at,w:8,h:88},{x:at,y:side,w:88,h:8});solids(g,props);}
function quiet(g){for(const k of ['pack','horde','rival','chest'])g.timers[k]=1e6;g.bossDirector.remaining=1e6;g.s.elapsed=100;g.timers.spawn=0;g.timers.animal=0;}
test('no route keeps the due species and fills only the ordinary slot, then retries',()=>{
 const g=new Game({seed:42});sealed(g);quiet(g);g.timers.animalIndex=4;g.spawnWave(.01);
 assert.equal(g.s.enemies.length,1);assert.equal(ANIMALS[g.s.enemies[0].type],undefined);assert.equal(g.timers.animalIndex,4);assert.ok(g.timers.animal<=0);
 empty(g);g.timers.spawn=0;g.spawnWave(.01);assert.equal(g.s.enemies.length,2);assert.equal(g.s.enemies[1].type,'ostrich');assert.equal(g.timers.animalIndex,5);
});
test('impossible entries do bounded collision work without creating an enemy',()=>{
 const g=new Game({seed:42});sealed(g);let calls=0;const collides=g.world.collides.bind(g.world);g.world.collides=(...a)=>{calls++;return collides(...a);};const id=g.id,rng=g.rng;
 assert.equal(g.spawnEnemy('moose'),null);assert.equal(g.id,id);assert.equal(g.s.enemies.length,0);assert.ok(calls<=32*161,`bounded samples: ${calls}`);
 const expected=new Game({seed:42});expected.rng=rng;expected.random();expected.random();assert.equal(g.rng,expected.rng,'the bounded fan consumes no random draws');
});
test('a thin solid cannot be skipped between entry corridor samples',()=>{
 const g=new Game({seed:42});solids(g,[{x:199.125,y:0,w:.01,h:180}]);g.random=()=>.375;const e=g.spawnEnemy('moose');assert.ok(e);assert.notEqual(e.y,0);corridor(g,e);
});
test('explicit animal placement stays exact and is immediately damageable',()=>{
 const g=new Game({seed:42});const e=g.spawnEnemy('moose',200,0);assert.equal(e.x,200);assert.equal(e.y,0);const hp=e.hp;g.hurt(e,18);assert.equal(e.hp,hp-18);assert.equal(e.cooldown,0);assert.equal(e.phase,'chase');
});
for(const phase of ['animal_warning','animal_active','animal_recover'])test(`${phase} is not cancelled by camera movement or resize`,()=>{
 const g=new Game({seed:42});empty(g);const e=g.spawnEnemy('paparazzi',0,0);e.phase=phase;e.animalTime=.2;e.animalX=0;e.animalY=0;g.s.x=1000;g.setViewport(240,320);updateAnimal(g,e,.01,false);assert.equal(e.phase,phase);assert.equal(e.animalTime,.19);assert.equal(e.x,0);
});
test('a fleeing player can keep an animal offscreen without teleportation or forced attack',()=>{
 const g=new Game({seed:42});empty(g);const e=g.spawnEnemy('paparazzi',237,0);for(let i=0;i<120;i++){g.s.x-=144/60;g.updateEnemies(1/60);}assert.equal(e.phase,'chase');assert.ok(e.x-g.s.x>237);assert.ok(e.x<237&&e.x>150);assert.equal(e.hp,e.maxhp);
});
test('viewport change can permit a normal full telegraph without resetting a saved run',()=>{
 const g=new Game({seed:42});empty(g);const e=g.spawnEnemy('moose',180,0);updateAnimal(g,e,.01,false);assert.equal(e.phase,'chase');g.setViewport(844,390);updateAnimal(g,e,.01,false);assert.equal(e.phase,'animal_warning');assert.equal(e.animalTime,ANIMALS.moose.warning);
 const snapshot=captureRun(g);assert.equal(snapshot.version,15);const copy=restoreRun(snapshot);assert.deepEqual(captureRun(copy),snapshot);
});
test('entry, due timer and attack gate resume exactly from v13 including pause',()=>{
 const a=new Game({seed:914});positionNewRun(a);quiet(a);a.timers.animalIndex=2;a.bossDirector.remaining=100;a.setViewport(844,390);const b=restoreRun(captureRun(a));
 for(const g of [a,b])g.spawnWave(.01);assert.deepEqual(captureRun(b),captureRun(a));a.pause();const paused=captureRun(a);a.update(.25);assert.deepEqual(captureRun(a),paused);a.resume();
 for(let i=0;i<180;i++){for(const g of [a,b]){if(g.s.mode==='upgrade')g.chooseUpgrade(g.s.options[0].id);if(g.s.mode==='dialogue')g.finishDialogue();g.update(1/60,{x:0,y:0});}assert.deepEqual(captureRun(b),captureRun(a));}
});
test('successful scheduled animal entry leaves ordinary gameplay RNG unchanged',()=>{
 const a=new Game({seed:914});positionNewRun(a);quiet(a);const b=new Game({seed:914});b.rng=a.rng;b.random();a.spawnWave(.01);assert.ok(ANIMALS[a.s.enemies[0].type]);assert.equal(a.rng,b.rng);
});
test('non-animal edge selection still consumes the original draws and outward escape',()=>{
 for(const type of ['normal','gas','orangutan','rival_goat','pelican'])for(const seed of [42,914]){
  const a=new Game({seed}),b=new Game({seed});positionNewRun(a);positionNewRun(b);const radii={normal:17,gas:19,orangutan:18,rival_goat:23,pelican:29},r=radii[type],w=b.viewport.width/2+r+24,top=b.viewport.height*.48+r+24,bottom=b.viewport.height*.52+r+24,side=Math.floor(b.random()*4);
  let x=b.s.x+(side===0?-w:side===1?w:(b.random()*2-1)*w),y=b.s.y+(side===2?-top:side===3?bottom:-top+b.random()*(top+bottom));for(let i=0;i<8&&b.world.collides(x,y,25);i++){x+=(x<b.s.x?-1:1)*35;y+=(y<b.s.y?-1:1)*28;}
  if(type==='gas')b.random();const e=a.spawnEnemy(type);assert.equal(e.x,x);assert.equal(e.y,y);assert.equal(a.rng,b.rng);
 }
});
test('all supported viewport extremes and seeded near/far locations retain safe real corridors',()=>{
 for(const [width,height] of [[390,844],[844,390],[240,320],[1600,1600]])for(const seed of [42,17,914])for(const [x,y] of [[256,512],[0,0],[2304,-2048],[-10000,9984]]){
  const g=new Game({seed});g.setViewport(width,height);g.s.x=x;g.s.y=y;g.world.update(x,y);
  let entered=0;for(let index=0;index<4;index++){const e=animal(g,index);if(!e)continue;entered++;const distance=Math.hypot(e.x-x,e.y-y);assert.ok(distance>=Math.min(width/2,height*.48)+e.r+23.99);assert.ok(Math.abs(e.x-x)>=width/2+e.r+23.99||Math.abs(e.y-y)>=height*(e.y<y?.48:.52)+e.r+23.99);corridor(g,e);}assert.equal(entered,4,`${width}x${height}/${seed}/${x},${y}`);
 }
});
