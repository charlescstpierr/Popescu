import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
const run=()=>{const g=new Game({seed:72});g.s.elapsed=1200;g.s.mode='victory';g.startCharlesEpilogue();return g;};
test('rejects forged Charles phases, power, health, unsafe timers and unlimited scenery',()=>{
 const changes=[c=>c.phase='unknown',c=>c.phaseTime=100,c=>c.phaseDuration=.1,c=>c.hits=19,c=>c.hp=0,c=>c.dead=true,c=>c.powered='yes',c=>c.destroyed=Array(65).fill('a'),c=>c.destroyed=['invented'],c=>c.safeAngle=7,c=>c.waveMax=999,c=>c.outcome='defeated'];
 for(const change of changes){const snapshot=captureRun(run());change(snapshot.game.s.charles);assert.throws(()=>restoreRun(snapshot));}
});
test('v9 migration preserves trophies and cannot invent an epilogue',()=>{const g=new Game({seed:90});g.s.trophies.chosen={pelican:'tarot'};const snapshot=captureRun(g);snapshot.version=9;snapshot.game.s.charles={phase:'burst'};const b=restoreRun(snapshot);assert.deepEqual(b.s.trophies.chosen,{pelican:'tarot'});assert.equal(b.s.charles,null);assert.equal(captureRun(b).version,11);});
test('active Charles cannot exist before victory, during endless or after player death',()=>{for(const change of [s=>s.elapsed=1199,s=>s.endless=true,s=>s.hp=0,s=>s.mode='trophy']){const snapshot=captureRun(run());change(snapshot.game.s);assert.throws(()=>restoreRun(snapshot));}});
