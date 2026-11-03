import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {STORY_MILESTONES,ROOSTER_REACTION} from '../dist/content.js';
function fixture(time){const events=[],g=new Game({seed:42,onEvent:(type,payload)=>events.push({type,payload})});g.s.elapsed=time;for(const k in g.timers)g.timers[k]=100000;g.nextEvent=100000;return {g,events};}
test('finale encounter leads the overlapping chapter, which remains readable and survives resume',()=>{
 const {g,events}=fixture(1140.01);g.spawnWave(.02);g.story(.02);
 assert.match(events.at(-1).payload.text,/dernier direct/i);assert.ok(!g.eventSeen.has('chapter:1140'));
 const b=restoreRun(captureRun(g)),more=[];b.onEvent=(type,payload)=>more.push({type,payload});
 b.s.elapsed=1143.2;b.story(.02);assert.equal(more.length,0);assert.ok(b.speechUntil>=1144.31);
 b.s.elapsed=b.speechUntil+.01;b.story(.02);
 assert.equal(more.at(-1).payload.text,STORY_MILESTONES.at(-1).text);assert.ok(b.eventSeen.has('chapter:1140'));
 b.s.elapsed+=5;b.story(.02);assert.equal(more.length,1);assert.equal(b.s.mode,'playing');
});
test('encounter warning delays queued banter through a checkpoint',()=>{
 const {g,events}=fixture(150);g.s.companion=true;g.pendingStuntReply={at:150,index:0};g.pendingRivalReply={at:150,index:0,ally:true,id:1,type:'rival_goat'};
 g.timers.horde=6.01;g.spawnWave(.02);const warning=events.at(-1).payload.text;
 const b=restoreRun(captureRun(g)),more=[];b.onEvent=(type,payload)=>more.push({type,payload});b.updateStunt(.01,0);b.updateRivalBanter();b.story(.01);
 assert.match(warning,/six secondes/);assert.equal(more.length,0);assert.ok(b.pendingStuntReply.at>b.speechUntil);assert.ok(b.pendingRivalReply.at>b.speechUntil);
});
test('actual rooster reaction remains immediate during finale announcement and defers narrative',()=>{
 const {g,events}=fixture(1140.01);g.spawnWave(.02);g.reactToCrow();g.story(.02);
 assert.equal(events.at(-1).payload.text,ROOSTER_REACTION.text);assert.ok(!g.eventSeen.has('chapter:1140'));assert.equal(g.s.mode,'playing');
});
