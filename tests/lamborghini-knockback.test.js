import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {launchLamborghini,carLevel} from '../dist/lamborghini.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

function scene(rank,direction=1,{tangent=false,destroyed=false}={}){
 const g=new Game({seed:42}),pine=g.world.chunk(2,0).find(p=>p.id==='2,0:forest:5');
 const push=carLevel(rank).knockback;
 const e=g.spawnEnemy('tank',pine.x-direction*push/2,pine.y+pine.h/2+26*.6-(tangent?0:.01));
 e.hp=e.maxhp=1000;
 Object.assign(g.s,{x:e.x,y:e.y-40});g.s.upg.car=rank;g.recalculate();g.world.update(g.s.x,g.s.y);
 if(destroyed)g.world.setDestroyed([pine.id]);
 launchLamborghini(g);
 if(direction<0){const v=g.s.vehicles[0];v.x=v.carOriginX+480;v.vx=-carLevel(rank).speed;v.carPhase='back';v.life=960/carLevel(rank).speed;}
 return {g,e,pine,push};
}
for(const [rank,direction] of [[2,1],[3,1],[4,1],[4,-1],[5,1],[5,-1]])test(`rank ${rank} bumper direction ${direction} cannot cross a real seeded pine`,()=>{
 const {g,e,push}=scene(rank,direction),x=e.x,y=e.y,hp=e.hp;
 assert.equal(g.world.collides(x,y,e.r*.6),false);
 assert.equal(g.world.collides(x+direction*push,y,e.r*.6),false);
 assert.equal(g.world.blocksAxisMove(x,y,direction*push,e.r*.6),true);
 g.updateVehicles(.9);
 assert.ok(e.hp<hp,'the real car must make contact');assert.equal(e.dead,false);
 assert.equal(e.x,x);assert.equal(e.y,y);
});
for(const option of ['tangent','destroyed'])test(`bumper preserves its full push for ${option} terrain`,()=>{
 const {g,e,push}=scene(3,1,{[option]:true}),x=e.x;g.updateVehicles(.9);
 assert.equal(e.x,x+push);assert.equal(e.hp,884);
});
test('blocked bumper contact keeps exact damage and one hit per passage',()=>{
 const {g,e}=scene(4),x=e.x;g.updateVehicles(.9);assert.equal(e.hp,918);assert.equal(e.x,x);
 g.updateVehicles(.05);assert.equal(e.hp,918);assert.equal(e.x,x);
});
test('pause and save resume preserve the blocked seeded bumper contact',()=>{
 const {g,e}=scene(3),x=e.x;const resumed=restoreRun(captureRun(g));
 g.pause();const paused=captureRun(g);g.update(.25);assert.deepEqual(captureRun(g),paused);g.resume();
 g.updateVehicles(.9);resumed.updateVehicles(.9);
 assert.equal(e.x,x);assert.equal(e.hp,884);assert.deepEqual(captureRun(g),captureRun(resumed));
});
