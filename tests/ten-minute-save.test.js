import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun,RunStore} from '../dist/run-save.js';
import {createReplayState,recordReplay,validateReplayState} from '../dist/run-history.js';

test('ten-minute snapshots retain their duration through repeated restores',()=>{
 const game=new Game();assert.equal(game.s.survivalDuration,600);
 const snapshot=captureRun(game);assert.equal(snapshot.version,16);
 assert.deepEqual(captureRun(restoreRun(captureRun(restoreRun(snapshot)))),snapshot);
});

test('published legacy records keep twenty-minute timing without rewriting original bytes',()=>{
 const raw=readFileSync(new URL('./fixtures/runstore-v12-legacy.json',import.meta.url),'utf8');
 let stored=raw;const storage={getItem:()=>stored,setItem:(_key,value)=>stored=value};
 const store=new RunStore(storage),first=store.read();assert.equal(first.status,'ready');
 assert.equal(first.value.run.snapshot.game.s.survivalDuration,1200);
 assert.equal(stored,raw);assert.deepEqual(store.read(),first);
 const game=restoreRun(first.value.run.snapshot);game.s.elapsed=700;game.s.invulnerable=10;
 game.update(.01);assert.equal(game.s.charles,null);
 assert.equal(store.checkpoint(first.value.run.id,game).ok,true);
 const checkpoint=store.read().value;assert.equal(checkpoint.version,16);
 assert.equal(checkpoint.run.snapshot.game.s.survivalDuration,1200);
 assert.equal(store.checkpoint(first.value.run.id,game).ok,true);
 assert.deepEqual(store.read().value.totals,checkpoint.totals);
});

test('v15 migration retains ego actors and does not reapply migration on restore',()=>{
 const game=new Game({survivalDuration:1200});game.spawnEnemy('ego_toad',200,200);
 const old=captureRun(game);old.version=15;delete old.game.s.survivalDuration;
 const before=structuredClone(old),restored=restoreRun(old),current=captureRun(restored);
 assert.equal(current.game.s.survivalDuration,1200);assert.deepEqual(current.game.s.enemies,old.game.s.enemies);
 assert.deepEqual(old,before);assert.deepEqual(captureRun(restoreRun(current)),current);
});

test('invalid or missing v16 duration is rejected',()=>{
 for(const duration of [undefined,0,300,601,'600',null]){
  const saved=captureRun(new Game());saved.game.s.survivalDuration=duration;
  assert.throws(()=>restoreRun(saved),/Invalid run save/);
 }
});

test('a ten-minute win is recorded once and retains historical twenty-minute victories',()=>{
 const game=new Game();game.s.elapsed=600;game.s.mode='victory';
 const replay=createReplayState();const snapshot=captureRun(game);
 recordReplay(replay,'short-win',snapshot);recordReplay(replay,'short-win',snapshot);
 assert.equal(replay.history.length,1);assert.equal(replay.history[0].outcome,'victory');
 assert.equal(replay.history[0].time,600);assert.equal(replay.records.normal.survival.bestTime,600);
 assert.doesNotThrow(()=>validateReplayState(replay));
 const legacy=new Game({survivalDuration:1200});legacy.s.elapsed=1200;legacy.s.mode='victory';
 recordReplay(replay,'old-win',captureRun(legacy));assert.equal(replay.history.length,2);
 assert.equal(replay.records.normal.survival.bestTime,1200);assert.doesNotThrow(()=>validateReplayState(replay));
});
