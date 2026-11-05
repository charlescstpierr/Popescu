import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {BARKS, contextualBarks} from '../dist/content.js';
import {captureRun, restoreRun} from '../dist/run-save.js';

const SLAP = "Toma, tasse-toi. L'orang-outan prépare sa claque.";
const HEALTH = 'Tes PV baissent. Fais ton beau plus loin.';
function fixture(){
  const events=[];
  const g=new Game({onEvent:(type,payload)=>events.push({type,payload})});
  g.s.companion=true;
  g.recalculate();
  g.s.elapsed=10;
  return {g,events};
}
const pool=g=>contextualBarks(g.s,g.recentHealthDamage);
const has=(g,text)=>pool(g).some(line=>line.text===text);
function preparing(g){
  const ape=g.spawnEnemy('orangutan',g.s.x+70,g.s.y);
  g.updateEnemies(.01);
  assert.equal(ape.phase,'windup');
  assert.ok(ape.windup>0);
  return ape;
}

// Removing any one of the threat guards must allow its corresponding false cue.
for(const [name,change] of [
  ['chasing',e=>{e.phase='chase';e.windup=0;}],
  ['charmed',e=>{e.charmed=3;}],
  ['already striking',e=>{e.phase='swipe';e.windup=0;e.swipe=.28;}],
  ['dead',e=>{e.dead=true;}],
  ['far away',e=>{e.x=1000;}],
  ['aimed away',e=>{e.swipeDirX=1;}],
  ['targeting another enemy',e=>{e.target='enemy';}],
  ['suppressed',(_e,g)=>{g.s.airplane.active=true;}],
])test(`slap warning is absent when the orangutan is ${name}`,()=>{
  const {g}=fixture(),ape=preparing(g);
  change(ape,g);
  assert.equal(has(g,SLAP),false);
});

test('a distant charmed orangutan in chase never supplies the slap warning',()=>{
  const {g}=fixture(),ape=g.spawnEnemy('orangutan',1000,0);
  ape.charmed=3;
  assert.equal(has(g,SLAP),false);
});

test('a hostile orangutan actually preparing its forward slap supplies the unchanged warning',()=>{
  const {g}=fixture();preparing(g);
  assert.equal(has(g,SLAP),true);
  // The warning remains available throughout the approach range that starts windup.
  g.s.enemies[0].x=83;
  assert.equal(has(g,SLAP),true);
});

test('another hostile windup remains eligible beside a charmed orangutan',()=>{
  const {g}=fixture();g.spawnEnemy('orangutan',1000,0).charmed=3;preparing(g);
  assert.equal(has(g,SLAP),true);
});

test('the slap warning disappears after real windup completion',()=>{
  const {g}=fixture();preparing(g);
  for(let i=0;i<13;i++)g.updateEnemies(.05);
  assert.equal(has(g,SLAP),false);
  assert.ok(g.s.hp<g.s.maxhp,'the real swipe hit Toma');
});

test('full health without damage never supplies the falling-health line',()=>{
  const {g}=fixture();
  assert.equal(has(g,HEALTH),false);
});

test('low but stable health does not claim that health is falling',()=>{
  const {g}=fixture();g.s.hp=30;
  assert.equal(has(g,HEALTH),false);
});

test('shield-only hits cannot supply the falling-health line, even below full health',()=>{
  const {g}=fixture();g.s.hp=30;g.s.shield=20;g.damage(5,'touch');
  assert.equal(g.s.hp,30);assert.equal(g.s.shield,15);
  assert.equal(has(g,HEALTH),false);
});

test('invulnerable hits do not supply the falling-health line',()=>{
  const {g}=fixture();g.s.hp=30;g.s.invulnerable=2;g.damage(5,'touch');
  assert.equal(has(g,HEALTH),false);
});

test('real recent health loss supplies the unchanged line without requiring low HP',()=>{
  const {g}=fixture();g.damage(5,'touch');
  assert.equal(g.s.hp,95);assert.equal(has(g,HEALTH),true);
  g.s.elapsed+=2.99;
  assert.equal(has(g,HEALTH),true);
});

test('health damage through a partially depleted shield supplies the line',()=>{
  const {g}=fixture();g.s.shield=3;g.damage(5,'touch');
  assert.equal(g.s.hp,98);assert.equal(has(g,HEALTH),true);
});

test('health loss older than three seconds no longer supplies the line',()=>{
  const {g}=fixture();g.damage(5,'touch');g.s.elapsed+=3.01;
  assert.equal(has(g,HEALTH),false);
});

test('healing since the last hit suppresses the falling-health line',()=>{
  const {g}=fixture();g.damage(10,'touch');g.gainXP(g.s.xpNeed);
  assert.equal(g.s.hp,94);assert.equal(has(g,HEALTH),false);
});

test('reaching full health suppresses the line even immediately after damage',()=>{
  const {g}=fixture();g.damage(5,'touch');g.s.hp=g.s.maxhp;
  assert.equal(has(g,HEALTH),false);
});

test('a new health loss after healing becomes eligible again',()=>{
  const {g}=fixture();g.damage(10,'touch');g.s.hp=94;g.s.elapsed+=1;g.s.invulnerable=0;g.damage(2,'touch');
  assert.equal(g.s.hp,92);assert.equal(has(g,HEALTH),true);
});

for(const [name,change] of [
  ['locked',g=>{g.s.companion=false;}],
  ['down',g=>{g.s.girl.down=5;}],
])test(`both warnings stay silent while the companion is ${name}`,()=>{
  const {g}=fixture();preparing(g);g.damage(5,'touch');change(g);
  assert.equal(has(g,SLAP),false);assert.equal(has(g,HEALTH),false);
});

test('ambient story emits the health line after damage and not on the next undamaged turn',()=>{
  const {g,events}=fixture();g.damage(5,'touch');
  g.barkIndex=pool(g).findIndex(line=>line.text===HEALTH);
  assert.ok(g.barkIndex>=0);g.timers.bark=0;g.story(.01);
  assert.equal(events.filter(e=>e.type==='bark').at(-1).payload.text,HEALTH);
  g.s.elapsed+=5;g.timers.bark=0;g.story(.01);
  assert.notEqual(events.filter(e=>e.type==='bark').at(-1).payload.text,HEALTH);
});

test('save/restore preserves a valid windup but does not invent recent damage',()=>{
  const {g}=fixture();preparing(g);g.damage(5,'touch');
  assert.equal(has(g,HEALTH),true);
  const saved=captureRun(g),copy=restoreRun(saved);
  assert.ok(copy);assert.deepEqual(captureRun(copy),saved);
  assert.equal(has(copy,SLAP),true);assert.equal(has(copy,HEALTH),false);
  copy.s.elapsed+=1;copy.s.invulnerable=0;copy.damage(5,'touch');
  assert.equal(has(copy,HEALTH),true);
});

test('context filtering leaves saved simulation, RNG, and every other bark unchanged',()=>{
  const {g}=fixture();g.spawnEnemy('orangutan',1000,0).charmed=3;
  const before=captureRun(g),other=line=>line.text!==SLAP&&line.text!==HEALTH;
  const expected=BARKS.filter(line=>line.context!=='horde'&&other(line));
  for(let i=0;i<100;i++)assert.deepEqual(pool(g).filter(other),expected);
  assert.deepEqual(captureRun(g),before);
});

test('time spent in the Charles epilogue cannot make old health loss recent again',()=>{
  const {g}=fixture();g.s.elapsed=1200;g.damage(5,'touch');
  g.s.mode='victory';assert.equal(g.startCharlesEpilogue(),true);
  g.s.charles.elapsed=10;assert.equal(g.leaveCharlesEpilogue(),true);
  assert.equal(has(g,HEALTH),false);
  g.continueEndless();g.s.invulnerable=0;g.damage(5,'touch');
  assert.equal(has(g,HEALTH),true);
  g.s.elapsed+=3.01;assert.equal(has(g,HEALTH),false);
});

function sayContextualWarning(g,text){
  if(text===HEALTH)g.damage(3,'touch');else preparing(g);
  g.barkIndex=pool(g).findIndex(line=>line.text===text);
  assert.ok(g.barkIndex>=0);g.timers.bark=0;g.story(.01);
  assert.equal(g.speech.active?.text,text);
}
function invalidateWarning(g,text){
  if(text===HEALTH){g.gainXP(g.s.xpNeed);assert.equal(g.s.hp,g.s.maxhp);}
  else {g.hurt(g.s.enemies[0],10000);assert.ok(g.s.enemies[0].dead);}
}
for(const text of [HEALTH,SLAP]){
  for(const restore of [false,true])test(`${text}: obsolete interrupted warning is dropped${restore?' after restore':''}`,()=>{
    const {g,events}=fixture();sayContextualWarning(g,text);
    g.urgentSpeech('SYSTÈME','Urgence en cours.');invalidateWarning(g,text);
    const copy=restore?restoreRun(captureRun(g),{onEvent:(type,payload)=>events.push({type,payload})}):g;
    copy.s.elapsed=15;copy.flushSpeech();
    assert.notEqual(copy.speech.active?.text,text);
    assert.equal(events.filter(e=>e.type==='bark'&&e.payload.text===text).length,1);
  });
  for(const restore of [false,true])test(`${text}: obsolete active warning is removed${restore?' on restored presentation':''}`,()=>{
    const {g,events}=fixture();sayContextualWarning(g,text);invalidateWarning(g,text);
    const copy=restore?restoreRun(captureRun(g),{onEvent:(type,payload)=>events.push({type,payload})}):g;
    copy.presentSpeech();
    assert.notEqual(copy.speech.active?.text,text);
    assert.equal(events.filter(e=>e.type==='bark'&&e.payload.text===text).length,1);
  });
  test(`${text}: re-enabling banter does not revive an obsolete warning`,()=>{
    const {g,events}=fixture();sayContextualWarning(g,text);
    g.setBanterEnabled(false);invalidateWarning(g,text);
    g.setBanterEnabled(true);g.presentSpeech();
    assert.notEqual(g.speech.active?.text,text);
    assert.equal(events.filter(e=>e.type==='bark'&&e.payload.text===text).length,1);
  });
  test(`${text}: interruption still resumes a warning while its context remains true`,()=>{
    const {g,events}=fixture();sayContextualWarning(g,text);
    g.urgentSpeech('SYSTÈME','Urgence en cours.');g.dismissSpeech();g.s.elapsed+=.1;g.flushSpeech();
    assert.equal(g.speech.active?.text,text);
    assert.equal(events.filter(e=>e.type==='bark'&&e.payload.text===text).length,2);
  });
}

test('restoring a still-valid active slap warning preserves its presentation',()=>{
  const {g,events}=fixture();sayContextualWarning(g,SLAP);
  const copy=restoreRun(captureRun(g),{onEvent:(type,payload)=>events.push({type,payload})});
  copy.presentSpeech();assert.equal(copy.speech.active?.text,SLAP);
  assert.equal(events.filter(e=>e.type==='bark'&&e.payload.text===SLAP).length,2);
});

test('a restored health warning is suppressed until there is fresh actual damage',()=>{
  const {g}=fixture();sayContextualWarning(g,HEALTH);
  const copy=restoreRun(captureRun(g));copy.presentSpeech();
  assert.notEqual(copy.speech.active?.text,HEALTH);
  copy.s.elapsed+=1;copy.s.invulnerable=0;copy.damage(2,'touch');
  assert.equal(has(copy,HEALTH),true);
});
