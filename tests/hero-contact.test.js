import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {computeHeroPose} from '../dist/hero-pose.js';

test('an enemy touching the carried rifle never makes Toma fire back through his own barrel',()=>{
  const game=new Game({seed:42}),s=game.state;
  const enemy=game.spawnEnemy('tank',0,-24);enemy.hp=1000;
  s.shotClock=0;game.weapons(0);
  assert.ok(s.aimY<-.7,'Toma keeps facing the enemy north of his feet at point-blank range');
  const pose=computeHeroPose(s);
  for(const shot of s.shots.filter(p=>p.kind==='bullet')){
    assert.ok(shot.vx*pose.aim.x+shot.vy*pose.aim.y>0,'bullets travel out of the painted barrel, not backwards');
  }
  if((enemy.x-pose.muzzle.x)*pose.aim.x+(enemy.y-pose.muzzle.y)*pose.aim.y<=0){
    assert.equal(enemy.hp,1000-s.stats.damage,'a target already under the barrel is still hit');
  }
});

test('point-blank hits preserve follower damage and the weapon cooldown',()=>{
  const game=new Game({seed:42}),s=game.state;s.upg.followers=5;game.recalculate();
  const enemy=game.spawnEnemy('tank',0,-24);enemy.hp=1000;s.shotClock=0;
  game.weapons(0);assert.equal(enemy.hp,1000-s.stats.damage*3);
  game.weapons(.01);assert.equal(enemy.hp,1000-s.stats.damage*3,'contact damage is not applied every frame');
  assert.ok(s.shotClock>0);
});

test('the actual projectile starts at the whole-frame muzzle and follows the target ray through every direction seam',()=>{
  const game=new Game({seed:42}),s=game.state;let worst={dot:1};
  for(const split of [false,true])for(let frame=0;frame<8;frame++)for(const radius of [80,81,150,500])for(let degree=0;degree<360;degree++){
    s.enemies=[];s.shots=[];s.x=0;s.y=0;s.elapsed=3.8;s.moveX=.7;s.moveY=-.3;s.walkMoving=true;s.walkDistance=frame*10;s.stunt={kind:'split',active:split,progress:.5,faceX:1,faceY:0};
    const a=degree*Math.PI/180;const enemy=game.spawnEnemy('tank',Math.cos(a)*radius,Math.sin(a)*radius);enemy.hp=10000;s.shotClock=0;game.weapons(0);
    const pose=computeHeroPose(s),shot=s.shots.find(p=>p.kind==='bullet');assert.ok(shot);
    assert.ok(Math.hypot(shot.x-pose.muzzle.x,shot.y-pose.muzzle.y)<1e-6);
    const dot=(shot.vx*pose.aim.x+shot.vy*pose.aim.y)/Math.hypot(shot.vx,shot.vy);
    if(dot<worst.dot)worst={dot,degree,radius,split,frame};
  }
  assert.ok(worst.dot>1-1e-8,`bullet and exact target aim must share the same ray: ${JSON.stringify(worst)}`);
});

test('point-blank and free running replace stale locks with the shared chest or movement view',()=>{
  const game=new Game({seed:42}),s=game.state;
  s.aimArtView='SE';game.spawnEnemy('tank',0,-24);game.weapons(0);assert.equal(s.aimArtView,'S');
  s.enemies=[];s.aimArtView='NE';s.moveX=-1;s.moveY=0;game.weapons(0);assert.equal(s.aimArtView,'W');
});
