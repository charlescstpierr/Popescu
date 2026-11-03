import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';

// A separated nearby pair must be discarded before an expensive Euclidean
// distance. Removing the axis rejection makes this test fail.
test('crowd separation rejects non-overlapping bounds without a distance calculation',()=>{
 const game=new Game({seed:42});
 game.s.enemies=[{id:1,x:0,y:0,r:14},{id:2,x:63,y:63,r:14}];
 const before=structuredClone(game.s.enemies),hypot=Math.hypot;let distances=0;
 Math.hypot=(...args)=>{distances++;return hypot(...args);};
 try{game.separateEnemies(1/60);}finally{Math.hypot=hypot;}
 assert.deepEqual(game.s.enemies,before);
 assert.equal(distances,0,'non-overlapping neighbor bounds need no Euclidean distance');
});
