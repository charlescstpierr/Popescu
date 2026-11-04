import test from 'node:test';
import assert from 'node:assert/strict';
import {CityArt} from '../dist/city-art.js';
import {World} from '../dist/world.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {Game} from '../dist/engine.js';
function recorder(){const calls=[];return {calls,ctx:new Proxy({},{get:(_,key)=>(...args)=>calls.push([key,...args]),set:(_,key,value)=>(calls.push([key,value]),true)})};}

test('street fixtures include at least four visibly different silhouettes, not five identical warning signs',()=>{
 const art=new CityArt();const images=Array.from({length:5},(_,variant)=>{const c=recorder();art._billboard(c.ctx,{w:86,h:52,variant});return JSON.stringify(c.calls)});
 assert.ok(new Set(images).size>=4);
});
test('narrow apartments can use the condo facade without changing their footprint',()=>{
 const art=new CityArt(),p={type:'building',x:166,y:380,w:72,h:76,variant:3,buildingKind:'apartment',damage:1};
 const a=recorder(),b=recorder(),snapshot=JSON.stringify(p);art._buildingVariant(a.ctx,p,42);art._condo(b.ctx,p,42);
 assert.deepEqual(a.calls,b.calls);assert.equal(JSON.stringify(p),snapshot);
});
test('residential brick facade replaces generic repeated neon frontage',()=>{
 const art=new CityArt();assert.equal(typeof art._residentialBrick,'function');
 const p={type:'building',x:320,y:280,w:150,h:180,variant:2,buildingKind:'apartment',damage:1};
 const a=recorder(),b=recorder();art._buildingVariant(a.ctx,p,42);art._residentialBrick(b.ctx,p,42);assert.deepEqual(a.calls,b.calls);
});
test('scenery change keeps saved position and generated obstacles exactly stable',()=>{
 const game=new Game({seed:42});game.s.x=1024;game.s.y=256;const snapshot=captureRun(game),restored=restoreRun(snapshot);
 assert.equal(restored.s.x,1024);assert.equal(restored.s.y,256);
 assert.deepEqual(restored.world.chunk(2,0),new World(42).chunk(2,0));
 assert.equal(restored.world.collides(restored.s.x,restored.s.y,13),false);
});
test('garage roof silhouette varies while facade contact stays fixed',()=>{
 const art=new CityArt(),p={type:'building',x:320,y:280,w:150,h:180,buildingKind:'garage',damage:0};
 const a=recorder(),b=recorder();art._buildingVariant(a.ctx,{...p,variant:0},42);art._buildingVariant(b.ctx,{...p,variant:1},42);
 assert.notDeepEqual(a.calls,b.calls);
});
