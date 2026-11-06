import {renderEncounterPresentation} from '../dist/dialogue-presentation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import * as persistence from '../dist/run-save.js';
import {discoveryPrompt} from '../dist/discoveries.js';
import * as content from '../dist/content.js';
import * as opening from '../dist/opening.js';
import * as evolutions from '../dist/evolutions.js';
import {carLevel} from '../dist/lamborghini.js';

// Run the real app controller with inert browser surfaces, real engine and storage.
function app(existingValues){
  const sounds=[];const elements=new Map(),values=existingValues||new Map([['toma-popescu-v1',JSON.stringify({introSeen:true})]]);let queue=Promise.resolve(),confirmed=true;const events={};
  const element=()=>({children:[],listeners:{},textContent:'',style:{setProperty(){},removeProperty(){}},classList:{state:new Set(),toggle(key,on){if(on===undefined)on=!this.state.has(key);on?this.state.add(key):this.state.delete(key);},add(...keys){for(const key of keys)this.state.add(key);},remove(...keys){for(const key of keys)this.state.delete(key);},contains(key){return this.state.has(key);}},addEventListener(type,handler){this.listeners[type]=handler;},setAttribute(key,value){this[key]=value;},replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},getBoundingClientRect:()=>({width:390,height:844}),getContext:()=>({})});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const context=vm.createContext({renderEncounterPresentation:args=>renderEncounterPresentation({...args,document:context.document}),...content,...opening,...persistence,...evolutions,carLevel,discoveryPrompt,Game,console,performance,Date,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),requestAnimationFrame(){},ResizeObserver:class{observe(){}},HTMLInputElement:class{},crypto:{randomUUID:()=>String(Math.random())},navigator:{locks:{request(_key,fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}}},window:{addEventListener(type,fn){events[type]=fn;},confirm:()=>confirmed},document:{hidden:false,getElementById:get,querySelector:()=>element(),querySelectorAll:()=>[],createElement:element,addEventListener(){}},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},Renderer:class{constructor(){this.actors={available:()=>true};}resize(){}render(){}},drawIcon(){},AudioManager:class{setEnabled(){}setVolume(){}setScene(){}setDucked(){}setIntensity(){}sfx(name){sounds.push(name);}unlock(){return Promise.resolve();}}});
  const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  vm.runInContext(source+'\n globalThis.controller={get game(){return game},get screen(){return screen},setDifficulty,frame,recordRun,renderResult,persistRun,resumeSaved,get runId(){return runId}};',context);
  return {events,confirm:value=>confirmed=value,values,sounds,get,click:id=>get(id).onclick(),get game(){return context.controller.game;},controller:context.controller,saved:()=>JSON.parse(values.get('toma-popescu-run-v1')).totals};
}

test('pause restart persists the abandoned run before creating a fresh game',async()=>{
  const a=app();await a.click('play');Object.assign(a.game.s,{elapsed:123,kills:17,coins:9});a.click('pause');await a.click('restart');
  assert.equal(a.saved().best,123);assert.equal(a.saved().lifetime,17);assert.equal(a.saved().coins,9);assert.equal(a.game.s.elapsed,0);
  a.click('pause');await a.click('restart');assert.equal(a.saved().lifetime,17);assert.equal(a.saved().coins,9);
});

test('victory then endless restart credits only the new kills and coins',async()=>{
  const a=app();await a.click('play');Object.assign(a.game.s,{mode:'victory',elapsed:1200,kills:80,coins:32});await a.controller.renderResult(true);
  await a.controller.renderResult(true);assert.equal(a.saved().lifetime,80);
  a.click('endless');Object.assign(a.game.s,{elapsed:1230,kills:87,coins:35});a.click('pause');await a.click('restart');
  assert.equal(a.saved().best,1230);assert.equal(a.saved().lifetime,87);assert.equal(a.saved().coins,35);
});

test('retry and menu after results never count a completed run twice',async()=>{
  const a=app();await a.click('play');Object.assign(a.game.s,{mode:'gameover',hp:0,elapsed:60,kills:10,coins:5});await a.controller.renderResult(false);await a.click('retry');
  assert.equal(a.saved().lifetime,10);assert.equal(a.saved().coins,5);
  Object.assign(a.game.s,{elapsed:20,kills:3,coins:2});a.click('pause');await a.click('pause-menu');assert.equal(a.saved().best,60);assert.equal(a.saved().lifetime,13);assert.equal(a.saved().coins,7);
  await a.click('play');a.click('pause');await a.click('pause-menu');assert.equal(a.saved().lifetime,13);
});


test('chained upgrade renders once and plays one level cue per offer',async()=>{
  const a=app();await a.click('play');a.game.gainXP(50);await Promise.resolve();a.sounds.length=0;
  const index=a.game.s.options.findIndex(o=>o.id!=='girlfriend');
  a.get('upgrade-options').children[index].listeners.click();await Promise.resolve();
  assert.equal(a.game.s.mode,'upgrade');assert.equal(a.get('upgrade-options').children.length,3);
  assert.equal(a.sounds.filter(s=>s==='level').length,1);
});

test('endless button keeps the earned upgrade screen instead of hiding it behind the HUD',async()=>{
  const a=app();await a.click('play');a.game.s.elapsed=1199.99;
  a.game.s.drops=[{x:a.game.s.x,y:a.game.s.y,kind:'xp',value:50,life:10}];a.game.update(.02);
  a.click('pause');a.click('charles-leave');a.click('endless');assert.equal(a.game.s.mode,'upgrade');
  assert.equal(a.controller.screen,'upgrades');
});


test('reload restores pending upgrade, resets input, and waits for explicit resume',async()=>{
 const a=app();await a.click('play');a.game.gainXP(20);await a.controller.persistRun();const savedOptions=a.game.s.options.map(o=>o.id);const b=app(a.values);await b.click('resume-saved');assert.equal(b.controller.screen,'pause-screen');assert.equal(b.game.s.mode,'upgrade');b.click('resume');assert.equal(b.controller.screen,'upgrades');assert.deepEqual(b.game.s.options.map(o=>o.id),savedOptions);
});
test('reload preserves dialogue index and exact lines before resuming',async()=>{
 const a=app();await a.click('play');a.game.startDialogue([{who:'TOMA',text:'one'},{who:'TOMA',text:'two'}]);a.click('next-dialogue');await a.controller.persistRun();const b=app(a.values);await b.click('resume-saved');b.click('resume');assert.equal(b.controller.screen,'dialogue');assert.equal(b.get('dialogue-text').textContent,'two');b.click('skip-dialogue');assert.equal(b.game.s.mode,'playing');
});

test('upgrade autosave runs after the update removes consumed XP drops',async()=>{
 const a=app();await a.click('play');a.game.s.drops=[{x:a.game.s.x,y:a.game.s.y,life:10,kind:'xp',value:50}];a.controller.frame(performance.now()+50);await new Promise(r=>setTimeout(r,0));const snapshot=JSON.parse(a.values.get('toma-popescu-run-v1')).run.snapshot;assert.equal(snapshot.game.s.mode,'upgrade');assert.equal(snapshot.game.s.drops.length,0);assert.equal(snapshot.game.s.xp,a.game.s.xp);
});
test('canceling a replacement leaves the saved run and active game untouched',async()=>{
 const a=app();await a.click('play');const id=a.controller.runId,old=a.game;a.click('pause');a.confirm(false);await a.click('restart');assert.equal(a.game,old);assert.equal(a.controller.runId,id);assert.equal(JSON.parse(a.values.get('toma-popescu-run-v1')).run.id,id);
});
test('visibility/pagehide recovery preserves a paused living run',async()=>{
 const a=app();await a.click('play');a.game.s.elapsed=25;a.click('pause');a.events.pagehide();await new Promise(r=>setTimeout(r,0));const b=app(a.values);await b.click('resume-saved');assert.equal(b.game.s.elapsed,25);assert.equal(b.controller.screen,'pause-screen');b.click('resume');assert.equal(b.game.s.mode,'playing');
});
test('New Game after reload credits the saved unfinished run exactly once',async()=>{
 const a=app();await a.click('play');Object.assign(a.game.s,{elapsed:123,kills:17,coins:9});await a.controller.persistRun();const b=app(a.values);await b.click('play');assert.deepEqual(b.saved(),{best:123,lifetime:17,coins:9});await b.click('pause-menu');assert.deepEqual(b.saved(),{best:123,lifetime:17,coins:9});
});

test('saved menu keeps new-game difficulty selectable without changing resumed difficulty',async()=>{
 const a=app();a.controller.setDifficulty('nightmare');await a.click('play');await a.controller.persistRun();const b=app(a.values);assert.equal(b.get('difficulty-picker').classList.contains('hidden'),false);b.controller.setDifficulty('easy');await b.click('resume-saved');assert.equal(b.game.s.difficulty,'nightmare');assert.ok(b.get('coordinates').textContent.includes(content.DIFFICULTIES.nightmare.label));await b.click('restart');assert.equal(b.game.s.difficulty,'easy');
});


test('first opening checkpoint stores first card before any animation frame',async()=>{
 const a=app(new Map());await a.click('play');const snapshot=JSON.parse(a.values.get('toma-popescu-run-v1')).run.snapshot;
 assert.equal(snapshot.game.s.mode,'dialogue');assert.equal(snapshot.dialogue.lines[0].opening,'offline');
 assert.equal(a.get('next-dialogue').textContent,'SUITE ›');
});
test('opening reload keeps exact card and completion stages one tutorial gorilla',async()=>{
 const a=app(new Map());await a.click('play');a.click('next-dialogue');await a.controller.persistRun();
 const b=app(a.values);await b.click('resume-saved');b.click('resume');assert.equal(b.get('dialogue-text').textContent,'J’existe même pas pis il me tape déjà sur les nerfs.');
 for(let i=0;i<4;i++)b.click('next-dialogue');assert.equal(b.game.s.mode,'playing');assert.equal(b.game.s.opening.phase,'move');assert.equal(b.game.s.enemies.length,1);
 b.controller.frame(performance.now()+50);assert.equal(b.game.s.elapsed,0);
});
test('skip opening starts immediately and replay cannot overwrite saved progress',async()=>{
 const a=app(new Map());await a.click('play');a.click('skip-dialogue');assert.equal(a.game.s.mode,'playing');assert.equal(a.game.s.opening?.phase,'shoot');
 a.game.s.elapsed=30;await a.click('pause-menu');const before=a.values.get('toma-popescu-run-v1');
 a.click('story');a.click('next-dialogue');a.click('next-dialogue');assert.ok(a.game);for(let i=0;i<3;i++)a.click('next-dialogue');
 assert.equal(a.controller.screen,'menu');assert.equal(a.values.get('toma-popescu-run-v1'),before);
});

test('one-time rewards are not announced as new permanent powers',async()=>{
 const a=app();await a.click('play');for(const u of content.UPGRADES)a.game.s.upg[u.id]=u.max;a.game.s.evolutions={billionaire:true,viralLove:true};
 a.game.gainXP(8);
 for(const card of a.get('upgrade-options').children){assert.equal(card.children[1].children[2].textContent,'RÉCOMPENSE IMMÉDIATE');assert.ok(card['aria-label'].endsWith('Récompense immédiate'));assert.ok(!card['aria-label'].includes('Niveau'));}
});


test('paid reroll commits new cards and balance together and reload keeps them',async()=>{
 const a=app();await a.click('play');a.game.s.coins=24;a.game.gainXP(8);await a.controller.persistRun();
 const old=a.game,oldCards=a.game.s.options.map(o=>o.id);const pending=a.click('reroll-upgrades');assert.equal(a.game,old);assert.equal(a.game.s.coins,24);
 await pending;assert.equal(a.game.s.coins,19);assert.equal(a.game.s.coinsSpent,5);assert.equal(a.game.s.upgradeRerolls,1);assert.notDeepEqual(a.game.s.options.map(o=>o.id),oldCards);
 const saved=JSON.parse(a.values.get('toma-popescu-run-v1')).run.snapshot.game.s;assert.deepEqual(saved.options.map(o=>o.id),a.game.s.options.map(o=>o.id));assert.equal(saved.coins,19);
 const b=app(a.values);await b.click('resume-saved');b.click('resume');assert.equal(b.game.s.coins,19);assert.equal(b.get('reroll-upgrades').textContent,'↻ RELANCER · 10 PIÈCES');
});
test('double-click reroll charges once while a failed write keeps old cards and coins',async()=>{
 const a=app();await a.click('play');a.game.s.coins=24;a.game.gainXP(8);await a.controller.persistRun();
 await Promise.all([a.click('reroll-upgrades'),a.click('reroll-upgrades')]);assert.equal(a.game.s.coins,19);assert.equal(a.game.s.upgradeRerolls,1);
 const old=a.game,raw=a.values.get('toma-popescu-run-v1'),write=a.values.set;a.values.set=()=>{throw Error('quota')};await a.click('reroll-upgrades');
 assert.equal(a.game,old);assert.equal(a.game.s.coins,19);assert.equal(a.game.s.upgradeRerolls,1);assert.equal(a.values.get('toma-popescu-run-v1'),raw);assert.equal(a.get('toast').classList.contains('hidden'),false);
 a.values.set=write;await a.click('reroll-upgrades');assert.equal(a.game.s.coins,9);assert.equal(a.game.s.upgradeRerolls,2);assert.equal(a.get('reroll-upgrades').disabled,true);
});
test('pagehide during paid reroll cannot overwrite the successful purchase with old cards',async()=>{
 const a=app();await a.click('play');a.game.s.coins=24;a.game.gainXP(8);await a.controller.persistRun();
 const pending=a.click('reroll-upgrades');a.events.pagehide();await pending;await new Promise(r=>setTimeout(r,0));
 assert.equal(JSON.parse(a.values.get('toma-popescu-run-v1')).run.snapshot.game.s.coins,19);
});

test('an upgrade-card click during reroll cannot consume or replace the pending transaction',async()=>{
 const a=app();await a.click('play');a.game.s.coins=24;a.game.gainXP(8);await a.controller.persistRun();
 const old=a.game,card=a.get('upgrade-options').children[0],before=JSON.stringify(old.s.upg);const pending=a.click('reroll-upgrades');card.listeners.click();
 assert.equal(a.game,old);assert.equal(JSON.stringify(old.s.upg),before);assert.equal(old.s.mode,'upgrade');await pending;
 assert.equal(a.game.s.mode,'upgrade');assert.equal(a.game.s.coins,19);assert.equal(JSON.stringify(a.game.s.upg),before);
});
test('a conflicting tab keeps the newer save and does not charge the stale reroll',async()=>{
 const a=app();await a.click('play');a.game.s.coins=24;a.game.gainXP(8);await a.controller.persistRun();
 const b=app(a.values);await b.click('resume-saved');b.game.s.coins=30;await b.controller.persistRun();const raw=a.values.get('toma-popescu-run-v1');
 await a.click('reroll-upgrades');assert.equal(a.game.s.coins,24);assert.equal(a.game.s.upgradeRerolls,0);assert.equal(a.values.get('toma-popescu-run-v1'),raw);assert.equal(a.get('reroll-upgrades').disabled,true);
});

test('disabled reroll explains when every available card is already offered',async()=>{
 const a=app();await a.click('play');for(const u of content.UPGRADES)a.game.s.upg[u.id]=u.max;a.game.s.evolutions={billionaire:true,viralLove:true};a.game.s.coins=24;a.game.gainXP(8);
 assert.equal(a.get('reroll-upgrades').disabled,true);assert.equal(a.get('reroll-feedback').textContent,'Aucune autre carte disponible.');
});
test('existing power tooltip identifies its chosen evolution without adding HUD icons',async()=>{
 const a=app();await a.click('play');Object.assign(a.game.s.upg,{car:3,money:3});a.game.gainXP(8);a.get('upgrade-options').children[0].listeners.click();
 const powers=a.get('powers').children;assert.equal(powers.length,2);assert.ok(powers.every(p=>p.title.includes('Lambo de milliardaire')));
});

for(const banter of [false,true])for(const reduced of [false,true]){
 const label=`banter ${banter?'on':'off'}, reduced effects ${reduced?'on':'off'}`;
 test(`encounter warnings remain visible with ${label}`,async()=>{
  const a=app(new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,banter,reduced})]]));await a.click('play');
  const g=a.game;g.s.elapsed=150;for(const key in g.timers)g.timers[key]=100000;g.nextEvent=100000;
  a.click('banter-close');g.bark('SYSTÈME','Une blague facultative.',true);
  assert.equal(a.get('banter').classList.contains('hidden'),!banter,'ordinary system remarks follow the banter preference');
  a.click('banter-close');g.reactToCrow();
  assert.equal(a.get('banter').classList.contains('hidden'),!banter,'priority jokes still follow the banter preference');
  a.click('banter-close');g.timers.horde=6.01;g.spawnWave(.02);
  assert.equal(a.get('banter').classList.contains('hidden'),false,'horde warning must be visible');
  assert.match(a.get('banter-text').textContent,/horde.*six secondes/i);
  assert.equal(a.get('banter-name').textContent,'SYSTÈME');
  assert.equal(a.get('app').classList.contains('reduced-fx'),reduced);
  assert.equal(g.s.mode,'playing');
 });
 test(`finale warnings remain visible with ${label}`,async()=>{
  const a=app(new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,banter,reduced})]]));await a.click('play');
  const g=a.game;for(const key in g.timers)g.timers[key]=100000;g.nextEvent=100000;
  for(const [time,notice] of [[1130.01,/Dernière minute/],[1140.01,/dernier direct/],[1154.01,/dernier rival/],[1174.01,/Dernière vague dans/],[1180.01,/Dernière vague !/]]){
   a.click('banter-close');g.s.elapsed=time;g.spawnWave(.02);
   assert.equal(a.get('banter').classList.contains('hidden'),false,`finale warning at ${time} must be visible`);
   assert.match(a.get('banter-text').textContent,notice);
  }
 });
 test(`every boss warning and arrival remains visible with ${label}`,async()=>{
  for(const type of ['matriarch','travestia','pelican']){
   const a=app(new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,banter,reduced})]]));await a.click('play');
   const g=a.game;g.s.elapsed=300;Object.assign(g.bossDirector,{nextType:type,bag:['matriarch','travestia','pelican'].filter(other=>other!==type),remaining:5.01,warned:false});
   a.click('banter-close');g.updateBossArrivals(.02);
   assert.equal(a.get('banter').classList.contains('hidden'),false,`${type} warning must be visible`);
   assert.match(a.get('banter-text').textContent,/cinq secondes/);
   a.click('banter-close');g.s.elapsed+=5;g.updateBossArrivals(5);
   assert.equal(a.get('banter').classList.contains('hidden'),false,`${type} arrival must be visible`);
   assert.match(a.get('banter-text').textContent,/entre en scène/);
   assert.equal(g.s.enemies.length,1);assert.equal(g.s.enemies[0].type,type);
  }
 });
}

test('muted encounter warnings survive preference changes, pause and saved-run resume',async()=>{
 const a=app();await a.click('play');a.click('pause');a.click('settings-open');
 a.get('banter-setting').onchange({target:{checked:false}});
 a.get('reduced-fx').onchange({target:{checked:true}});
 a.click('settings-back');a.click('resume');
 const g=a.game;g.s.elapsed=300;for(const key in g.timers)g.timers[key]=100000;g.nextEvent=100000;
 Object.assign(g.bossDirector,{remaining:5.01,warned:false});
 a.click('pause');const before=persistence.captureRun(g);g.update(.05);
 assert.deepEqual(persistence.captureRun(g),before,'pause freezes encounter clocks');
 assert.equal(a.get('banter').classList.contains('hidden'),true);
 await a.controller.persistRun();const b=app(a.values);await b.click('resume-saved');
 assert.equal(b.controller.screen,'pause-screen');assert.equal(b.get('banter-setting').checked,false);
 b.controller.frame(performance.now()+50);assert.equal(b.get('banter').classList.contains('hidden'),true);
 b.click('resume');b.game.update(.02);
 assert.equal(b.get('banter').classList.contains('hidden'),false);
 assert.match(b.get('banter-text').textContent,/arrive.*cinq secondes/);
 assert.equal(b.game.s.reducedEffects,true);
 b.click('banter-close');b.game.bark('TOMA','Une autre blague.',true);
 assert.equal(b.get('banter').classList.contains('hidden'),true);
});

for(const banter of [false,true])for(const reduced of [false,true])for(const reload of [false,true]){
 test(`an announced encounter returns after ${reload?'saved reload':'pause'} with banter ${banter} and reduced effects ${reduced}`,async()=>{
  for(const encounter of ['matriarch','travestia','pelican','horde']){
   const a=app(new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,banter,reduced})]]));await a.click('play');
   const g=a.game;g.s.elapsed=300;for(const key in g.timers)g.timers[key]=100000;g.nextEvent=100000;
   if(encounter==='horde')g.timers.horde=6.01;
   else Object.assign(g.bossDirector,{nextType:encounter,bag:['matriarch','travestia','pelican'].filter(other=>other!==encounter),remaining:5.01,warned:false});
   g.spawnWave(.02);assert.equal(a.get('banter').classList.contains('hidden'),false);
   g.s.elapsed+=2.5;g.spawnWave(2.5);const timers=JSON.stringify(g.timers),director=JSON.stringify(g.bossDirector);
   a.click('pause');assert.equal(a.get('banter').classList.contains('hidden'),true);
   let b=a;if(reload){await a.controller.persistRun();b=app(a.values);await b.click('resume-saved');}
   b.controller.frame(performance.now()+60000);
   assert.equal(b.get('banter').classList.contains('hidden'),true);
   b.click('resume');
   assert.equal(b.get('banter').classList.contains('hidden'),false,`${encounter} warning must return on resume`);
   assert.match(b.get('banter-text').textContent,encounter==='horde'?/horde.*4 s/i:/arrive.*3 s/i,'warning uses the remaining simulation time');
   assert.equal(JSON.stringify(b.game.timers),timers);assert.equal(JSON.stringify(b.game.bossDirector),director);
   assert.equal(b.get('app').classList.contains('reduced-fx'),reduced);
  }
 });
}

test('resume never repeats optional jokes or invents a countdown after the encounter arrived',async()=>{
 const a=app();await a.click('play');a.game.s.elapsed=300;
 a.game.bark('TOMA','Une blague passée.',true);a.game.s.elapsed+=5;a.game.flushSpeech();a.click('pause');a.click('resume');
 assert.equal(a.get('banter').classList.contains('hidden'),true,'optional joke is not replayed');
 Object.assign(a.game.bossDirector,{remaining:5.01,warned:false});a.game.updateBossArrivals(.02);
 a.game.s.elapsed+=5;a.game.updateBossArrivals(5);a.click('pause');a.click('resume');
 assert.ok(a.get('banter').classList.contains('hidden')||!a.get('banter-text').textContent.includes('dans environ'),'arrived boss does not get a new countdown');
});

test('announced finale countdown returns from a saved pause with remaining time',async()=>{
 for(const [warningAt,pattern] of [[1130,/Dernière minute.*8 s/],[1154,/rival.*4 s/],[1174,/vague.*4 s/]]){
  const a=app(new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,banter:false,reduced:true})]]));await a.click('play');
  const g=a.game;for(const key in g.timers)g.timers[key]=100000;g.nextEvent=100000;g.s.elapsed=warningAt+.01;g.spawnWave(.02);
  g.s.elapsed+=2.5;a.click('pause');await a.controller.persistRun();const b=app(a.values);await b.click('resume-saved');b.click('resume');
  assert.equal(b.get('banter').classList.contains('hidden'),false);assert.match(b.get('banter-text').textContent,pattern);
 }
});

for(const banter of [false,true])for(const reduced of [false,true]){
 test(`overlapping live encounter notices remain together with banter ${banter} and reduced effects ${reduced}`,async()=>{
  for(const type of ['matriarch','travestia','pelican'])for(const [remaining,warned,expected] of [[5.01,false,/cinq secondes/],[3,true,/3 s/],[.01,true,/entre en scène/]]){
   const a=app(new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,banter,reduced})]]));await a.click('play');
   const g=a.game;g.s.elapsed=300;for(const key in g.timers)g.timers[key]=100000;g.nextEvent=100000;g.timers.horde=6.01;
   Object.assign(g.bossDirector,{nextType:type,bag:['matriarch','travestia','pelican'].filter(other=>other!==type),remaining,warned});
   g.spawnWave(.02);
   assert.equal(a.get('banter').classList.contains('hidden'),false);
   const text=a.get('banter-text').textContent;
   assert.match(text,/horde.*(?:six secondes|6 s)/i,'the horde warning is not overwritten');
   assert.match(text,expected,'the boss warning or arrival remains visible too');
   assert.equal((text.match(/horde/gi)||[]).length,1,'the same pending warning is not duplicated');
   assert.equal(a.get('app').classList.contains('reduced-fx'),reduced);
  }
 });
}

test('companion cards describe the next rank and the HUD displays current support',async()=>{
 const a=app();await a.click('play');
 for(let rank=1;rank<=5;rank++){
  a.game.s.mode='playing';a.game.gainXP(a.game.s.xpNeed);a.game.s.options=[content.UPGRADES.find(u=>u.id==='girlfriend')];a.game.emit('upgrade',a.game.s.options);
  const button=a.get('upgrade-options').children[0];assert.equal(button.children[0].src,`assets/companion-portrait-${rank}.png`);assert.match(button.children[1].children[1].textContent,new RegExp(['95 PV','ennemis proches','45 px','4 bouclier','Deux drones'][rank-1]));
  button.listeners.click();await Promise.resolve();if(a.game.s.mode==='dialogue')a.click('skip-dialogue');a.controller.frame(performance.now()+60);
  assert.match(a.get('companion-status').textContent,new RegExp(`NIV. ${rank}/5`));
 }
 a.game.s.girl.down=7;a.controller.frame(performance.now()+360);assert.match(a.get('companion-status').textContent,/RETOUR 7 s/);
});

test('holding Escape keeps a paused run frozen until a fresh press',async()=>{
 const a=app();await a.click('play');
 const escape=repeat=>a.events.keydown({key:'Escape',repeat,target:{}});
 escape(false);assert.equal(a.controller.screen,'pause-screen');
 const elapsed=a.game.s.elapsed,hp=a.game.s.hp;
 for(let i=1;i<=5;i++){
  escape(true);a.controller.frame(performance.now()+i*1000);
  assert.equal(a.controller.screen,'pause-screen');
  assert.equal(a.game.s.mode,'paused');assert.equal(a.game.s.elapsed,elapsed);assert.equal(a.game.s.hp,hp);
 }
 a.events.keyup({key:'Escape'});escape(false);
 assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.mode,'playing');
 escape(true);assert.equal(a.controller.screen,'hud','the resumed run does not pause on the same held press');
 a.events.keyup({key:'Escape'});escape(false);assert.equal(a.controller.screen,'pause-screen');
});

test('Escape held while leaving settings cannot also leave pause',async()=>{
 const a=app();await a.click('play');a.click('pause');a.click('settings-open');
 assert.equal(a.controller.screen,'settings');
 a.events.keydown({key:'Escape',repeat:false,target:{}});assert.equal(a.controller.screen,'pause-screen');
 for(let i=0;i<4;i++){
  a.events.keydown({key:'Escape',repeat:true,target:{}});
  assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.mode,'paused');
 }
});

test('Escape held while skipping a dialogue cannot toggle the next screen',async()=>{
 const a=app();await a.click('play');a.game.startDialogue([{who:'TOMA',text:'Une réplique à passer.'}]);
 assert.equal(a.controller.screen,'dialogue');
 a.events.keydown({key:'Escape',repeat:false,target:{}});assert.equal(a.controller.screen,'hud');
 a.events.keydown({key:'Escape',repeat:true,target:{}});
 assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.mode,'playing');
});

test('app starts new games on urban street but resume keeps the recorded location',async()=>{
 const a=app();await a.click('play');assert.equal(a.game.s.x,256);assert.equal(a.game.s.y,512);
 a.game.s.x=0;a.game.s.y=0;assert.equal((await a.controller.persistRun()).ok,true);
 const b=app(a.values);await b.controller.resumeSaved();assert.equal(b.game.s.x,0);assert.equal(b.game.s.y,0);
});
