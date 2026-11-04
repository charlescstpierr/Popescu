import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun,RunStore} from '../dist/run-save.js';

const evolutionIds=['billionaire','viralLove'];
function ready(){const g=new Game({seed:98});Object.assign(g.s.upg,{car:3,money:3,girlfriend:3,charisma:3});g.s.companion=true;g.recalculate();return g;}
function select(g,id){g.s.mode='upgrade';g.s.options=[{id,name:id,desc:id}];return g.chooseUpgrade(id);}
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}

test('evolutions are offered only at both prerequisite rank threes and once',()=>{
 const g=new Game();Object.assign(g.s.upg,{car:3,money:2,girlfriend:2,charisma:3});g.gainXP(8);
 assert.equal(g.s.options.some(o=>evolutionIds.includes(o.id)),false);
 const a=ready();a.gainXP(8);assert.deepEqual(a.s.options.slice(0,2).map(o=>o.id),evolutionIds);
 assert.equal(a.chooseUpgrade('billionaire'),true);assert.equal(a.s.evolutions.billionaire,true);assert.equal(a.rank('car'),3);
 a.gainXP(a.s.xpNeed);assert.equal(a.s.options.some(o=>o.id==='billionaire'),false);
 assert.equal(select(new Game(),'viralLove'),false);
});
test('rerolls cost 5 then 10, reject third or poor purchases, and reset on next offer',()=>{
 const g=new Game({seed:7});g.s.coins=24;g.gainXP(8);const before=captureRun(g);
 assert.equal(g.rerollUpgrade(),true);assert.equal(g.s.coins,19);assert.equal(g.s.coinsSpent,5);assert.equal(g.s.upgradeRerolls,1);
 assert.notDeepEqual(g.s.options.map(o=>o.id),before.game.s.options.map(o=>o.id));assert.equal(g.s.mode,'upgrade');
 assert.equal(g.rerollUpgrade(),true);assert.equal(g.s.coins,9);assert.equal(g.s.coinsSpent,15);assert.equal(g.rerollUpgrade(),false);
 g.chooseUpgrade(g.s.options[0].id);g.gainXP(g.s.xpNeed);assert.equal(g.s.upgradeRerolls,0);
 g.s.coins=4;const poor=captureRun(g);assert.equal(g.rerollUpgrade(),false);assert.deepEqual(captureRun(g),poor);
});
test('paid cards, RNG and spending survive reload without charging again',()=>{
 const g=ready();g.s.coins=24;g.gainXP(8);g.rerollUpgrade();const snap=captureRun(g),b=restoreRun(snap);
 assert.deepEqual(captureRun(b),snap);assert.equal(b.s.coins,19);assert.equal(b.s.upgradeRerolls,1);assert.equal(b.rerollUpgrade(),true);assert.equal(b.s.coins,9);
});
test('evolved car emits exactly two salvos of three bills and survives mid-salvo reload',()=>{
 const g=ready();select(g,'billionaire');g.timers.car=0;g.timers.money=99;g.weapons(.01);
 assert.equal(g.s.vehicles[0].billSalvos,2);let first=false;
 for(let i=0;i<150;i++){g.updateVehicles(.01);if(g.s.shots.length===3){first=true;break;}}
 assert.equal(first,true);const b=restoreRun(captureRun(g));
 for(let i=0;i<300;i++){g.updateVehicles(.01);b.updateVehicles(.01);}
 assert.equal(g.s.shots.filter(s=>s.kind==='bill').length,6);assert.deepEqual(captureRun(b),captureRun(g));
});
test('viral heart hits at most three distinct enemies and cannot bounce back',()=>{
 const g=ready();select(g,'viralLove');for(let i=0;i<5;i++){const e=g.spawnEnemy('tank',50+i*70,0);e.hp=e.maxhp=1000;}
 g.s.girl.x=0;g.s.girl.y=0;g.s.girl.shoot=0;g.updateCompanion(0);assert.equal(g.s.shots.length,1);
 for(let i=0;i<300;i++)g.updateShots(.01);
 assert.equal(g.s.enemies.filter(e=>e.hp<1000).length,3);assert.equal(g.s.enemies.filter(e=>e.hp<1000).every(e=>e.hp===963),true);assert.equal(g.s.shots.length,0);
});
test('legacy v6 migration preserves pending boss, RNG, warning and exact offered cards',()=>{
 const g=new Game({seed:7});g.s.coins=22;g.gainXP(8);g.bossDirector.remaining=3;g.bossDirector.warned=true;
 const legacy=captureRun(g);legacy.version=6;delete legacy.game.timers.ego;delete legacy.game.timers.egoIndex;delete legacy.game.s.coinsSpent;delete legacy.game.s.upgradeRerolls;delete legacy.game.s.evolutions;
 const b=restoreRun(legacy);assert.deepEqual(b.bossDirector,g.bossDirector);assert.deepEqual(b.s.options,g.s.options);assert.equal(b.s.coinsSpent,0);assert.equal(b.s.upgradeRerolls,0);
});
test('lifetime credits use total earned before and after spending without duplication',()=>{
 const storage=memory(),store=new RunStore(storage),g=new Game();g.s.coins=24;assert.equal(store.begin('a',g).ok,true);assert.equal(store.checkpoint('a',g,{credit:true}).ok,true);
 g.gainXP(8);g.rerollUpgrade();g.rerollUpgrade();assert.equal(store.checkpoint('a',g,{credit:true}).ok,true);assert.equal(store.read().value.totals.coins,24);
 g.s.coins+=4;assert.equal(store.checkpoint('a',g,{credit:true}).ok,true);assert.equal(store.read().value.totals.coins,28);
 assert.equal(store.checkpoint('a',g,{credit:true}).ok,true);assert.equal(store.read().value.totals.coins,28);
});
test('malformed reroll, evolution and attack states fail validation',()=>{
 const g=ready();select(g,'billionaire');for(const mutate of [s=>s.coinsSpent=-1,s=>s.upgradeRerolls=3,s=>s.evolutions={invalid:true},s=>s.upg.car=2]){const snap=captureRun(g);mutate(snap.game.s);assert.throws(()=>restoreRun(snap));}
});

test('modal rerolls never advance combat, and exhausted identical consumables cannot be bought again',()=>{
 const g=ready();g.s.coins=100;g.gainXP(8);g.rerollUpgrade();const frozen=captureRun(g);g.update(.25,{x:1,y:1});assert.deepEqual(captureRun(g),frozen);
 for(const id of ['muscle','car','followers','ego','money','airplane','girlfriend','charisma','chopper','truth','filter','validation','speed','magnet','detox'])g.s.upg[id]=5;
 g.s.evolutions={billionaire:true,viralLove:true};g.s.options=[];g.s.mode='playing';g.gainXP(g.s.xpNeed);assert.equal(g.s.options.length,3);assert.equal(g.canRerollUpgrade(),false);assert.equal(g.rerollUpgrade(),false);assert.equal(g.s.coins,95);
});
test('a viral heart restored after two hits cannot deal a fourth hit or repeat either target',()=>{
 const g=ready();select(g,'viralLove');for(let i=0;i<5;i++){const e=g.spawnEnemy('tank',50+i*70,0);e.hp=e.maxhp=1000;}
 g.s.girl.x=0;g.s.girl.y=0;g.s.girl.shoot=0;g.updateCompanion(0);
 for(let i=0;i<200&&!g.s.shots.some(p=>p.hitIds.size===2);i++)g.updateShots(.01);
 assert.equal(g.s.shots[0].hitIds.size,2);const b=restoreRun(captureRun(g));for(let i=0;i<300;i++)b.updateShots(.01);
 assert.equal(b.s.enemies.filter(e=>e.hp<1000).length,3);assert.equal(b.s.enemies.filter(e=>e.hp<1000).every(e=>e.hp===963),true);
});
