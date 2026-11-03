import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

function chestAtPlayer(game){game.s.chests=[{id:game.id++,x:game.s.x,y:game.s.y,open:false,openedAt:0}];game.updateChests(0);}

test('chest reward never removes temporary shield above the regenerating capacity',()=>{
  for(const rank of [0,1]){
    const game=new Game();game.s.upg.validation=rank;game.recalculate();game.s.shield=30;
    chestAtPlayer(game);assert.equal(game.s.shield,30);
  }
});

test('chest still restores shield up to its normal capacity and rewards only once',()=>{
  const game=new Game();game.s.upg.validation=2;game.recalculate();game.s.shield=27;
  chestAtPlayer(game);assert.equal(game.s.shield,32);assert.equal(game.s.coins,5);
  game.updateChests(0);assert.equal(game.s.shield,32);assert.equal(game.s.coins,5);
});

test('shield refill upgrade never removes an existing temporary shield',()=>{
  const game=new Game();game.s.shield=30;game.s.mode='upgrade';game.s.options=[{id:'validation'}];
  game.chooseUpgrade('validation');assert.equal(game.s.shield,30);assert.equal(game.s.stats.shieldMax,16);
});

test('temporary shield survives save and chest collection after resuming',()=>{
  const game=new Game();game.s.shield=30;const resumed=restoreRun(captureRun(game));
  chestAtPlayer(resumed);assert.equal(resumed.s.shield,30);
});

test('barrier reward preserves shield already above its temporary limit',()=>{
 const game=new Game();game.s.shield=50;game.s.mode='upgrade';game.s.options=[{id:'barrier'}];
 game.chooseUpgrade('barrier');assert.equal(game.s.shield,50);
});
