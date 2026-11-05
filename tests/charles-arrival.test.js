import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import * as charles from '../dist/charles.js';

function won({paused=false,count=3}={}){
 const events=[],g=new Game({seed:71,onEvent:(type,value)=>events.push({type,value})});
 g.setPausedEncountersEnabled(paused);g.s.elapsed=1200;
 for(let i=0;i<count;i++)g.spawnEnemy(['normal','orangutan','gas'][i%3],30+i%20*8,20+Math.floor(i/20)*8);
 g.s.mode='victory';return {g,events};
}
function tick(g,seconds,input={x:0,y:0}){for(let n=0;n<Math.ceil(seconds*60);n++)g.update(Math.min(1/60,seconds-n/60),input);}
const snaps=events=>events.filter(e=>e.type==='sound'&&e.value==='snap');

test('remaining enemies stay visible until the flight and snap rather than vanishing at entry',()=>{
 const {g,events}=won(),enemies=structuredClone(g.s.enemies),totals=[g.s.kills,g.s.coins,g.s.xp];
 g.startCharlesEpilogue();assert.deepEqual(g.s.enemies,enemies);
 tick(g,3.3,{x:1,y:0});assert.deepEqual(g.s.enemies,enemies);assert.equal(snaps(events).length,0);
 tick(g,.3);assert.equal(snaps(events).length,1);assert.equal(g.s.enemies.length,3,'painted actors remain during their brief dissolve');
 tick(g,.6);assert.equal(g.s.enemies.length,0);assert.deepEqual([g.s.kills,g.s.coins,g.s.xp],totals);assert.equal(g.s.drops.length,0);assert.equal(g.s.elapsed,1200);
 tick(g,1);assert.equal(snaps(events).length,1);
});

test('fresh paused dialogue cannot interrupt flight, gesture or disappearance',()=>{
 const {g}=won({paused:true});g.startCharlesEpilogue();tick(g,4.4);
 assert.equal(g.s.mode,'playing');assert.equal(g.encounters.active,null);assert.equal(g.s.charles.dialogueIndex,0);assert.equal(g.s.enemies.length,0);
 tick(g,.3);assert.equal(g.s.mode,'dialogue');assert.equal(g.encounters.active.actorType,'charles');assert.equal(g.s.charles.dialogueIndex,2);
});

test('arrival locks movement and attacks temporarily but releases normal controls afterwards',()=>{
 const {g}=won();g.s.companion=true;g.s.upg.girlfriend=1;g.recalculate();g.startCharlesEpilogue();const p={x:g.s.x,y:g.s.y,girl:structuredClone(g.s.girl)};
 tick(g,4.4,{x:1,y:0});assert.equal(g.s.x,p.x);assert.equal(g.s.y,p.y);assert.deepEqual(g.s.girl,p.girl);assert.equal(g.s.shots.length,0);assert.equal(g.s.charles.hits,0);
 tick(g,.4,{x:1,y:0});assert.ok(g.s.x>p.x);assert.equal(g.s.charles.phase,'intro');
});

test('active trophy attacks expire without hurting frozen enemies or generating rewards',()=>{
 const {g}=won(),s=g.s;s.trophies.chosen={pelican:'tarot',rival_rooster:'panache',matriarch:'fanclub'};
 s.trophies.cooldowns={...s.trophies.cooldowns,tarot:2,panache:2,fanclub:2};
 s.trophies.tarot={x:0,y:0,originX:0,originY:0,dx:1,dy:0,age:0,hitOut:[],hitBack:[]};
 s.trophies.panache={x:0,y:0,dx:1,dy:0,life:.35,hitIds:[]};
 for(const e of s.enemies)e.hp=1;
 const enemies=structuredClone(s.enemies);g.startCharlesEpilogue();tick(g,2.5);
 assert.deepEqual(s.enemies,enemies);assert.equal(s.trophies.tarot,null);assert.equal(s.trophies.panache,null);assert.equal(s.trophies.cooldowns.tarot,0);assert.equal(s.trophies.cooldowns.panache,0);assert.equal(s.kills,0);assert.equal(s.coins,0);assert.equal(s.drops.length,0);
});

test('pause and save preserve the exact arrival and do not replay its snap',()=>{
 for(const checkpoint of [.2,2.8,3.44,3.6,4.2]){
  const {g:a,events}=won();a.startCharlesEpilogue();tick(a,checkpoint);a.pause();const paused=captureRun(a);tick(a,2,{x:1,y:1});assert.deepEqual(captureRun(a),paused);
  const b=restoreRun(paused),other=[];b.onEvent=(type,value)=>other.push({type,value});assert.deepEqual(captureRun(b),paused);assert.equal(paused.version,15);a.resume();b.resume();const prior=snaps(events).length;
  for(let n=0;n<240;n++){a.update(1/60);b.update(1/60);assert.deepEqual(captureRun(a),captureRun(b));}
  assert.equal(snaps(other).length,snaps(events).length-prior);assert.equal(snaps(events).length,1);
 }
});

test('leaving before the snap keeps victory and cannot leave hostile actors or a lock in endless',()=>{
 const {g,events}=won();g.startCharlesEpilogue();tick(g,1);g.leaveCharlesEpilogue();assert.equal(g.s.mode,'victory');assert.equal(g.s.enemies.length,0);assert.equal(snaps(events).length,0);
 g.continueEndless();const x=g.s.x;g.update(.2,{x:1,y:0});assert.ok(g.s.x>x);assert.equal(g.s.endless,true);
});

test('the shared timeline is pure, bounded and ends in the original eight-second intro',()=>{
 assert.equal(typeof charles.charlesArrival,'function');const {g}=won({count:300});g.startCharlesEpilogue();const before=captureRun(g);
 for(let i=0;i<=800;i++){const c={...g.s.charles,phaseTime:8-i/100};const a=charles.charlesArrival(c);assert.ok(a.enemyOpacity>=0&&a.enemyOpacity<=1);assert.ok(a.flight>=0&&a.flight<=1);}
 assert.deepEqual(captureRun(g),before);assert.equal(charles.CHARLES.phases.intro,8);
 tick(g,4.2);assert.equal(g.s.enemies.length,0);assert.equal(g.s.kills,0);assert.equal(g.defeatEffects.length,0);
});
