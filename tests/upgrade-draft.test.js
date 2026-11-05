import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {UPGRADES} from '../dist/content.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

const offense=new Set(['muscle','car','followers','money','girlfriend','chopper','truth','billionaire','viralLove']);
const survival=new Set(['ego','airplane','charisma','filter','validation','speed','detox','recovery','barrier']);
const ids=options=>options.map(o=>o.id);
const balanced=options=>options.some(o=>offense.has(o.id))&&options.some(o=>survival.has(o.id));
function exhausted(){const g=new Game({seed:71});for(const u of UPGRADES)g.s.upg[u.id]=u.max;g.s.evolutions={billionaire:true,viralLove:true};return g;}

test('a new level offers offense and survival without duplicate cards across 512 seeds',()=>{
 for(let i=0;i<512;i++){
  const g=new Game({seed:Math.imul(i+1,0x9e3779b9)});g.gainXP(8);
  assert.equal(g.s.options.length,3);assert.equal(new Set(ids(g.s.options)).size,3);
  assert.ok(balanced(g.s.options),`seed ${g.seed}: ${ids(g.s.options)}`);
 }
});

test('all fifteen powers remain available and no card slot is locked to offense',()=>{
 const seen=new Set(),slots=[new Set(),new Set(),new Set()];
 for(let i=0;i<1000;i++){
  const g=new Game({seed:Math.imul(i+1,0x9e3779b9)});
  g.rollUpgradeOptions().forEach((o,index)=>{seen.add(o.id);slots[index].add(o.id);});
 }
 assert.deepEqual([...seen].sort(),UPGRADES.map(o=>o.id).sort());
 for(const slot of slots)assert.deepEqual([...slot].sort(),[...seen].sort());
});

test('both paid rerolls stay balanced and replace every card when fresh alternatives exist',()=>{
 for(let i=0;i<128;i++){
  const g=new Game({seed:Math.imul(i+1,0x9e3779b9)});g.s.coins=15;g.gainXP(8);
  for(const cost of [5,10]){
   const old=new Set(ids(g.s.options)),coins=g.s.coins;assert.equal(g.rerollUpgrade(),true);
   assert.ok(balanced(g.s.options));assert.ok(g.s.options.every(o=>!old.has(o.id)));
   assert.equal(g.s.coins,coins-cost);
  }
  assert.equal(g.s.coins,0);assert.equal(g.s.coinsSpent,15);assert.equal(g.rerollUpgrade(),false);
 }
});

test('ready evolutions stay first and leave a survival choice when both are ready',()=>{
 for(let i=0;i<64;i++){
  const g=new Game({seed:i+1});Object.assign(g.s.upg,{car:3,money:3,girlfriend:3,charisma:3});g.s.companion=true;g.recalculate();g.gainXP(8);
  assert.deepEqual(ids(g.s.options).slice(0,2),['billionaire','viralLove']);
  assert.ok(survival.has(g.s.options[2].id));
 }
});

test('a reroll cannot charge for the only balanced offer beside two ready evolutions',()=>{
 const g=exhausted();g.s.evolutions={};Object.assign(g.s.upg,{muscle:0,followers:0,validation:0});g.s.coins=20;g.gainXP(8);
 assert.deepEqual(ids(g.s.options),['billionaire','viralLove','validation']);
 const before=captureRun(g);assert.equal(g.canRerollUpgrade(),false);assert.equal(g.rerollUpgrade(),false);assert.deepEqual(captureRun(g),before);
});

test('a small pool repeats only the required role and still offers a fresh alternative',()=>{
 const g=exhausted();Object.assign(g.s.upg,{muscle:0,followers:0,car:0,validation:0});g.s.coins=20;g.gainXP(8);
 const before=new Set(ids(g.s.options));assert.equal(g.rerollUpgrade(),true);
 assert.ok(balanced(g.s.options));assert.ok(g.s.options.some(o=>!before.has(o.id)));assert.ok(g.s.options.some(o=>o.id==='validation'));
 assert.equal(new Set(ids(g.s.options)).size,3);
});

test('exhausted pools retain consumables and never invent a maxed power',()=>{
 for(const remaining of [null,'muscle','validation','magnet']){
  const g=exhausted();if(remaining)g.s.upg[remaining]=0;g.gainXP(8);
  assert.equal(g.s.options.length,3);assert.equal(new Set(ids(g.s.options)).size,3);
  assert.ok(g.s.options.every(o=>['recovery','payday','barrier',remaining].includes(o.id)));
  assert.equal(g.canRerollUpgrade(),false);
 }
});

test('saved cards remain exact and subsequent rerolls and levels continue deterministically',()=>{
 const a=new Game({seed:2026});a.s.coins=30;a.gainXP(8);const b=restoreRun(captureRun(a));
 assert.deepEqual(captureRun(a),captureRun(b));
 for(const run of [a,b]){run.rerollUpgrade();const frozen=captureRun(run);run.update(.25,{x:1,y:1});assert.deepEqual(captureRun(run),frozen);run.chooseUpgrade(run.s.options[0].id);run.gainXP(run.s.xpNeed);}
 assert.deepEqual(captureRun(a),captureRun(b));
});

test('a pre-existing unbalanced saved offer is not rewritten on load or made unselectable',()=>{
 const g=new Game();g.s.mode='upgrade';g.s.options=['speed','magnet','detox'].map(id=>UPGRADES.find(u=>u.id===id));
 const snapshot=captureRun(g),restored=restoreRun(snapshot);assert.deepEqual(captureRun(restored),snapshot);
 assert.equal(restored.chooseUpgrade('magnet'),true);assert.equal(restored.rank('magnet'),1);
});

test('drafts retain one combat RNG draw per non-evolution card and availability checks use none',()=>{
 for(const fixed of [0,1,2]){
  const g=new Game({seed:2026});if(fixed>=1)Object.assign(g.s.upg,{car:3,money:3});if(fixed===2)Object.assign(g.s.upg,{girlfriend:3,charisma:3});
  const start=g.rng;for(let i=0;i<3-fixed;i++)g.random();const expected=g.rng;g.rng=start;
  g.s.options=g.rollUpgradeOptions();assert.equal(g.rng,expected);g.s.mode='upgrade';g.s.coins=20;
  for(let i=0;i<10;i++)g.canRerollUpgrade();assert.equal(g.rng,expected);
 }
});
