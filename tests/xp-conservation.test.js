import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
const xp=(value,x=500,life=38)=>({x,y:0,kind:'xp',value,life});
const total=g=>g.s.drops.filter(d=>d.kind==='xp').reduce((n,d)=>n+d.value,0);
const run=()=>{const g=new Game({survivalDuration:1200,seed:19});g.world.collides=()=>false;return g;};

test('expired XP becomes a persistent pickup without awarding a level',()=>{
 const g=run();g.s.drops=[xp(47,500,.01)];g.updateDrops(.02);
 assert.equal(total(g),47);assert.equal(g.s.xp,0);assert.equal(g.s.level,1);assert.equal(g.s.drops[0].compact,true);
 for(let i=0;i<200;i++)g.updateDrops(1);assert.equal(total(g),47);assert.equal(g.s.xp,0);
});
test('distant XP returns as collectible value outside both collection ranges',()=>{
 const g=run();g.s.companion=true;g.s.girl.x=-300;g.s.girl.y=0;g.recalculate();g.s.drops=[xp(33,2000)];g.updateDrops(.01);
 assert.equal(total(g),33);assert.equal(g.s.xp,0);assert.equal(g.s.mode,'playing');const d=g.s.drops[0];
 assert.ok(Math.hypot(d.x-g.s.x,d.y-g.s.y)>g.s.stats.magnet);
 assert.ok(Math.hypot(d.x-g.s.girl.x,d.y-g.s.girl.y)>g.s.stats.magnet);
 assert.ok(Math.hypot(d.x-g.s.x,d.y-g.s.y)<1800);
});
test('a full mixed field remains capped and preserves every XP reward',()=>{
 const g=run();g.random=()=>0;let earned=0;
 for(let i=0;i<2000;i++){g.kill({type:'normal',x:500+i%40,y:0});earned+=2;assert.ok(g.s.drops.length<=260);assert.equal(total(g),earned);}
 assert.equal(g.s.xp,0);assert.equal(g.s.drops.filter(d=>d.compact).length,1);
});
test('collecting compact XP removes it once and still opens normal upgrade cards',()=>{
 const g=run();g.s.drops=[xp(47,500,.01)];g.updateDrops(.02);const d=g.s.drops[0];g.s.x=d.x;g.s.y=d.y;g.updateDrops(.02);
 assert.equal(total(g),0);assert.equal(g.s.level,2);assert.equal(g.s.xp,39);assert.equal(g.s.mode,'upgrade');
 const n=g.s.xp;g.updateDrops(.02);assert.equal(g.s.xp,n);
});
test('large magnet cannot overshoot and oscillate around a pickup',()=>{
 const g=run();g.s.stats.magnet=395;g.s.drops=[{x:26.71875,y:0,kind:'coin',value:2,life:35}];g.updateDrops(1/30);
 assert.equal(g.s.coins,2);assert.equal(g.s.drops.length,0);
});
test('nearest living companion collects with the same clamped magnet motion',()=>{
 const g=run();g.s.companion=true;g.s.girl.x=500;g.s.girl.y=0;g.s.stats.magnet=395;g.s.drops=[xp(2,526.71875)];g.updateDrops(1/30);
 assert.equal(g.s.xp,2);assert.equal(g.s.drops.length,0);
});
test('saving over-cap terminal state conserves XP without changing live state',()=>{
 const g=run();g.s.drops=Array.from({length:300},(_,i)=>xp(i+1,500+i));g.s.hp=0;g.s.mode='gameover';const before=structuredClone(g.s.drops),sum=total(g);
 const snapshot=captureRun(g);assert.deepEqual(g.s.drops,before);assert.ok(snapshot.game.s.drops.length<=260);assert.equal(total(restoreRun(snapshot)),sum);
});
test('old ordinary XP and new compact XP survive repeated checkpoint restores',()=>{
 const g=run();g.s.drops=[xp(6,500,.01)];const old=captureRun(g);assert.equal(old.game.s.drops[0].compact,undefined);
 let resumed=restoreRun(old);resumed.updateDrops(.02);assert.equal(total(resumed),6);assert.equal(resumed.s.drops[0].compact,true);
 for(let i=0;i<10;i++){const snapshot=captureRun(resumed);resumed=restoreRun(snapshot);assert.deepEqual(captureRun(resumed),snapshot);resumed.updateDrops(10);assert.equal(total(resumed),6);}
});
test('compact marker rejects malformed or non-XP persisted objects',()=>{
 for(const changes of [d=>d.compact='true',d=>{d.compact=true;d.kind='coin';}]){const g=run();g.s.drops=[xp(2)];const snapshot=captureRun(g);changes(snapshot.game.s.drops[0]);assert.throws(()=>restoreRun(snapshot));}
});
test('compaction preserves non-XP expiry rules and normal nearby crystal positions',()=>{
 const g=run();g.s.drops=[xp(3,500,12),{x:600,y:0,kind:'coin',value:2,life:.01},{x:1900,y:0,kind:'heal',value:5,life:10}];g.updateDrops(.02);
 assert.equal(g.s.drops.length,1);assert.deepEqual(g.s.drops[0],xp(3,500,11.98));
});

test('relocation uses a reachable point instead of placing XP inside a warehouse',()=>{
 const g=new Game({seed:0});g.s.x=222.5414872660474;g.s.y=375.1593543962962;g.s.travelX=-1;g.s.travelY=0;g.s.stats.magnet=70;
 g.world.update(g.s.x,g.s.y);g.s.drops=[xp(12,g.s.x+2000)];g.s.drops[0].y=g.s.y;g.updateDrops(.01);
 const d=g.s.drops[0];assert.equal(total(g),12);assert.equal(g.s.xp,0);assert.equal(g.world.collides(d.x,d.y,13),false);
 const length=Math.hypot(d.x-g.s.x,d.y-g.s.y);assert.ok(length>g.s.stats.magnet);
 for(let step=0;step<=length;step+=6){const t=step/length;assert.equal(g.world.collides(g.s.x+(d.x-g.s.x)*t,g.s.y+(d.y-g.s.y)*t,13),false);}
});
test('relocation respects actual horizontal travel in an open arena',()=>{
 const g=run();g.update(1/30,{x:-1,y:0});g.s.faceX=1;g.s.faceY=0;g.s.drops=[xp(4,2000)];g.updateDrops(.01);assert.equal(g.s.drops[0].y,0);assert.ok(g.s.drops[0].x>0);
});
test('blocked relocation retains the old XP instead of forcing an inaccessible pickup',()=>{
 const g=run();g.world.collides=()=>true;g.s.drops=[xp(7,2000)];g.updateDrops(.01);
 assert.equal(total(g),7);assert.equal(g.s.xp,0);assert.equal(g.s.drops[0].x,2000);
 g.world.collides=()=>false;g.updateDrops(.01);assert.ok(g.s.drops[0].x<1800);assert.equal(total(g),7);
});
test('terminal capture also chooses reachable terrain for relocated XP',()=>{
 const g=new Game({seed:0});g.s.x=222.5414872660474;g.s.y=375.1593543962962;g.s.travelX=-1;g.s.travelY=0;g.s.stats.magnet=70;g.s.drops=[xp(12,g.s.x+2000)];g.s.drops[0].y=g.s.y;
 const snapshot=captureRun(g),d=snapshot.game.s.drops[0];assert.equal(g.world.collides(d.x,d.y,13),false);assert.equal(g.s.drops[0].x,g.s.x+2000);assert.equal(snapshot.game.s.xp,0);
});
