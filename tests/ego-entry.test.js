import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import * as entry from '../dist/ego-entry.js';
const types=['ego_peacock','ego_toad','ego_rat','ego_chameleon'];
function empty(g){g.world.chunks.clear();for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++)g.world.chunks.set(`${a},${b}`,[]);g.world.collisionBounds=new WeakMap();g.world.collisionRegion=null;}
for(const [width,height] of [[390,844],[320,568],[240,320],[844,390]])for(const type of types)test(`${type} initial entry is fully on screen at ${width}x${height}`,()=>{
 const g=new Game({seed:42});empty(g);g.setViewport(width,height);Object.assign(g.s,{walkMoving:true,travelX:1,travelY:0});
 const p=entry.findEgoEntry(g,type,{x:250,y:0},true);assert.ok(p);const e={...p,type},f=entry.EGO_FRAMES[type];
 assert.equal(entry.egoFitsViewport(g,e),true);assert.ok(Math.hypot(p.x,p.y)>=120);assert.ok(Math.abs(p.x)+f.size/2<=width/2-24+1e-7);
 assert.ok(p.y+f.anchorY+f.top>=-height*.48+24-1e-7);assert.ok(p.y+f.anchorY+f.top+f.size<=height*.52-24+1e-7);
});
for(const type of types)test(`${type} initial entry avoids HUD, foreground buildings and crowd`,()=>{
 const g=new Game({seed:42});empty(g);Object.assign(g.s,{walkMoving:true,travelX:1,travelY:0});
 g.world.chunks.get('0,0').push({id:'canopy',type:'pine',solid:true,x:155,y:70,w:20,h:18,variant:0});
 g.setViewportOcclusions([{x:0,y:0,width:390,height:72},{x:12,y:140,width:366,height:80},{x:24,y:669,width:110,height:110}]);
 const p=entry.findEgoEntry(g,type,{x:250,y:0},true);assert.ok(p);const f=entry.EGO_FRAMES[type],left=g.viewport.width/2+p.x-f.size/2,top=g.viewport.height*.48+p.y+f.anchorY+f.top;
 for(const r of g.viewport.occlusions)assert.ok(left+f.size<=r.x-6||left>=r.x+r.width+6||top+f.size<=r.y-6||top>=r.y+r.height+6);
 assert.ok(Math.abs(p.y)>20);
});
test('fully obstructed entry defers boundedly and consumes no RNG or state',()=>{
 const g=new Game({seed:42});empty(g);g.setViewportOcclusions([{x:0,y:0,width:390,height:844}]);const rng=g.rng;let calls=0;g.world.collides=()=>{calls++;return false;};
 const before=JSON.stringify(g.s);for(const type of types)assert.equal(entry.findEgoEntry(g,type,{x:250,y:0},true),null);
 assert.equal(g.rng,rng);assert.equal(JSON.stringify(g.s),before);assert.equal(calls,0);
});
test('entry remains independent of attack animation or simulation state',()=>{
 const g=new Game({seed:42});empty(g);for(const type of types){const a=entry.findEgoEntry(g,type,{x:250,y:0},false);assert.ok(a);assert.equal(entry.egoFitsViewport(g,{type,...a}),false);}
});
