// Pending implementation contract. Not part of the production suite before approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {EGO_BEASTS,EGO_LIMITS} from '../dist/ego-beasts.js';
import {egoFitsViewport} from '../dist/ego-entry.js';
const types=Object.keys(EGO_BEASTS);
function clear(g){g.world.chunks.clear();for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++)g.world.chunks.set(`${a},${b}`,[]);g.world.collisionBounds=new WeakMap();g.world.collisionRegion=null;}
for(const type of types)test(`spawnEnemy initializes real ${type} rather than generic fallback`,()=>{const g=new Game(),e=g.spawnEnemy(type,100,0);assert.equal(e.maxhp,EGO_BEASTS[type].hp);assert.equal(e.r,EGO_BEASTS[type].r);assert.equal(e.egoTime,0);});
for(const seed of [1,42,914,20261104])test(`normal new run ${seed} introduces all four within a minute`,()=>{
 const g=new Game({seed});clear(g);const found=[];const spawn=g.spawnEnemy.bind(g);g.spawnEnemy=(type,...args)=>{const e=spawn(type,...args);if(e&&EGO_BEASTS[type]&&!found.includes(type)){assert.ok(egoFitsViewport(g,e));found.push(type);}return e;};
 for(let i=0;i<60*20;i++){g.s.elapsed=i*.05;g.spawnWave(.05);g.s.enemies=[];}
 assert.deepEqual(found,types);
});
test('new actor population cannot exceed eight total or two per species',()=>{const g=new Game();for(let i=0;i<30;i++)for(const type of types)g.spawnEnemy(type,100+i,0);const animals=g.s.enemies.filter(e=>EGO_BEASTS[e.type]);assert.equal(animals.length,EGO_LIMITS.active);for(const type of types)assert.equal(animals.filter(e=>e.type===type).length,EGO_LIMITS.perType);});
test('new schedule does not delay the existing four animal introductions',()=>{
 const a=new Game({seed:42}),b=new Game({seed:42});clear(a);clear(b);b.timers.ego=10000;const traces=[[],[]];
 for(const [i,g] of [a,b].entries()){const original=g.spawnEnemy.bind(g);g.spawnEnemy=(type,...args)=>{const e=original(type,...args);if(e&&['ostrich','paparazzi','moose','disco_chicken'].includes(type))traces[i].push([type,g.s.elapsed]);return e;};}
 for(let i=0;i<60*20;i++)for(const g of [a,b]){g.s.elapsed=i*.05;g.spawnWave(.05);g.s.enemies=[];}
 assert.deepEqual(traces[0],traces[1]);
});
test('blocked introductions retry the same species instead of invisibly consuming it',()=>{
 const g=new Game();clear(g);g.timers.spawn=0;g.timers.ego=0;g.timers.animal=100;g.setViewportOcclusions([{x:0,y:0,width:390,height:844}]);g.spawnWave(.01);assert.equal(g.timers.egoIndex,0);assert.equal(g.s.enemies.filter(e=>EGO_BEASTS[e.type]).length,0);
 g.s.enemies=[];g.setViewportOcclusions([]);g.timers.spawn=0;g.spawnWave(.01);assert.equal(g.timers.egoIndex,1);assert.equal(g.s.enemies[0].type,'ego_peacock');
});
test('beast diagnostics are bounded, readable and read-only',()=>{
 const g=new Game();for(const type of types)g.spawnEnemy(type,100,0);const before=JSON.stringify(g.s),rng=g.rng,info=g.egoStatus();assert.equal(info.active,4);assert.equal(info.species.length,4);assert.ok(info.species.every(e=>e.name&&e.count===1&&e.phases.chase===1));assert.equal(JSON.stringify(g.s),before);assert.equal(g.rng,rng);
});
test('camouflage surface classification comes from world geometry without pixel reads',()=>{
 const g=new Game();clear(g);assert.equal(g.egoSurfaceAt(0,0),'asphalt');g.world.chunks.get('0,0').push({id:'wall',type:'building',x:150,y:140,w:90,h:130,buildingKind:'apartment'});assert.equal(g.egoSurfaceAt(150,211),'building');assert.equal(g.egoSurfaceAt(1250,250),'grass');
});
