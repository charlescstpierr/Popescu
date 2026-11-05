import {renderEncounterPresentation} from '../dist/dialogue-presentation.js';
import test from 'node:test';
import * as workers from 'node:worker_threads';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import * as persistence from '../dist/run-save.js';
import {discoveryPrompt} from '../dist/discoveries.js';
import * as content from '../dist/content.js';
import * as opening from '../dist/opening.js';
import * as trophies from '../dist/boss-trophies.js';
import * as evolutions from '../dist/evolutions.js';
import {carLevel} from '../dist/lamborghini.js';

// Run the real app controller with inert browser surfaces, real engine and storage.
function app(existingValues,locks,clock=performance){
  const sounds=[],charlesPortraits=[];const elements=new Map(),values=existingValues||new Map([['toma-popescu-v1',JSON.stringify({introSeen:true})]]);let queue=Promise.resolve(),confirmed=true;const events={};
  const element=()=>({children:[],listeners:{},textContent:'',style:{setProperty(){},removeProperty(){}},classList:{state:new Set(),toggle(key,on){if(on===undefined)on=!this.state.has(key);on?this.state.add(key):this.state.delete(key);},add(...keys){for(const key of keys)this.state.add(key);},remove(...keys){for(const key of keys)this.state.delete(key);},contains(key){return this.state.has(key);}},addEventListener(type,handler){this.listeners[type]=handler;},setAttribute(key,value){this[key]=value;},getAttribute(key){return this[key];},focus(){context.document.activeElement=this;},replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},getBoundingClientRect:()=>({width:390,height:844}),getContext:()=>({clearRect(){},fillRect(){},save(){},restore(){},translate(){},scale(){}})});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const context=vm.createContext({renderEncounterPresentation:args=>renderEncounterPresentation({...args,document:context.document}),...content,...opening,...persistence,...evolutions,carLevel,...trophies,drawTrophyIcon(){},drawTrophyPortrait(){},discoveryPrompt,Game,console,performance:clock,Date,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),requestAnimationFrame(){},ResizeObserver:class{observe(){}},HTMLInputElement:class{},crypto:{randomUUID:()=>String(Math.random())},navigator:{locks:locks||{request(_key,fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}}},window:{addEventListener(type,fn){events[type]=fn;},confirm:()=>confirmed},document:{hidden:false,getElementById:get,querySelector:()=>element(),querySelectorAll:()=>[],createElement:element,addEventListener(){}},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},Renderer:class{constructor(){this.actors={available:()=>true};this.charles={draw(_ctx,c,time,reduced){charlesPortraits.push({c,time,reduced});}};}resize(){}render(){}},drawIcon(){},AudioManager:class{setEnabled(){}setVolume(){}setScene(){}setDucked(){}setIntensity(){}sfx(name){sounds.push(name);}unlock(){return Promise.resolve();}}});
  for(const match of readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').matchAll(/<[^>]+id="([^"]+)"[^>]*>/g)){const cls=match[0].match(/class="([^"]*)"/);for(const name of cls?.[1].split(/\s+/)||[])get(match[1]).classList.add(name);}
  const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  vm.runInContext(source+'\n globalThis.controller={get activeElement(){return document.activeElement},get game(){return game},get screen(){return screen},setDifficulty,frame,recordRun,renderResult,persistRun,resumeSaved,renderTrophies,syncEngineScreen,updateHud,onGameEvent,showBanter,get runId(){return runId}};',context);
  return {holdLock(){let release;const held=new Promise(resolve=>release=resolve);queue=queue.then(()=>held);return release;},events,charlesPortraits,confirm:value=>confirmed=value,values,sounds,get,click:id=>get(id).onclick?.(),get game(){return context.controller.game;},controller:context.controller,saved:()=>JSON.parse(values.get('toma-popescu-run-v1')).totals};
}


// These are controller/DOM-adapter tests, not browser layout or touch QA.
async function victory(a){await a.click('play');Object.assign(a.game.s,{mode:'victory',elapsed:1200});await a.controller.renderResult(true);}
const visible=(a,id)=>!a.get(id).classList.contains('hidden');

test('legacy Charles offer remains available only for an unplayed saved victory',async()=>{
 const a=app();await a.click('play');await a.controller.renderResult(false);
 assert.equal(visible(a,'charles-choice'),false);
 Object.assign(a.game.s,{mode:'victory',elapsed:1200});await a.controller.renderResult(true);
 assert.equal(visible(a,'charles-choice'),true);assert.equal(visible(a,'endless'),true);
 a.game.s.endless=true;await a.controller.renderResult(true);assert.equal(visible(a,'charles-choice'),false);
 a.game.s.endless=false;a.game.s.charles={phase:'complete'};await a.controller.renderResult(true);assert.equal(visible(a,'charles-choice'),false);
});

test('legacy victory offer keeps its explicit confirmation and cancellation',async()=>{
 const a=app();await victory(a);const before=JSON.stringify(a.game.s);
 a.click('meet-charles');assert.equal(a.controller.screen,'charles-confirm');assert.equal(a.game.s.mode,'victory');assert.equal(a.game.s.charles??null,null);
 a.controller.frame(performance.now()+1000);assert.equal(JSON.stringify(a.game.s),before);
 a.click('charles-cancel');assert.equal(a.controller.screen,'results');assert.equal(JSON.stringify(a.game.s),before);
 a.click('meet-charles');a.events.keydown({key:'Escape',target:{}});assert.equal(a.controller.screen,'results');assert.equal(JSON.stringify(a.game.s),before);
});

test('confirming Charles starts once and enters the regular playing HUD',async()=>{
 const a=app();await victory(a);
 a.click('charles-start');assert.equal(a.game.s.mode,'victory','a hidden stale confirmation cannot start the epilogue');
 a.click('meet-charles');a.click('charles-start');assert.equal(a.game.s.mode,'playing');assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.charles.phase,'intro');
 const charles=a.game.s.charles;a.click('charles-start');assert.equal(a.game.s.charles,charles);assert.equal(visible(a,'charles-banner'),true);
});

test('confirmation traps keyboard focus between its two explicit choices',async()=>{
 const a=app();await victory(a);a.click('meet-charles');
 assert.equal(a.controller.activeElement,a.get('charles-cancel'));let prevented=0;
 a.events.keydown({key:'Tab',target:{},preventDefault(){prevented++}});assert.equal(a.controller.activeElement,a.get('charles-start'));
 a.events.keydown({key:'Tab',target:{},preventDefault(){prevented++}});assert.equal(a.controller.activeElement,a.get('charles-cancel'));assert.equal(prevented,2);
});

test('Charles HUD explains invincibility, phase and transformation hits without an HP bar',async()=>{
 const a=app();await a.click('play');a.game.s.charles={phase:'shock_warning',hits:7,powered:false};a.controller.updateHud(true);
 assert.equal(visible(a,'charles-banner'),true);assert.match(a.get('charles-phase').textContent,/onde de choc/i);assert.match(a.get('charles-progress').textContent,/7 \/ 18.*transformation/i);
 assert.equal(a.get('time-goal').textContent,'CHARLES EST LÀ');
 a.game.s.charles.hits=99;a.game.s.charles.powered=true;a.game.s.charles.phase='empowered';a.controller.updateHud(true);
 assert.match(a.get('charles-progress').textContent,/transformation accomplie/i);assert.doesNotMatch(a.get('charles-progress').textContent,/99|PV|HP/);
 a.game.s.charles.phase='complete';a.controller.updateHud(true);assert.equal(visible(a,'charles-banner'),false);
});

test('critical Charles warnings remain visible with banter disabled and use Charles art',async()=>{
 const a=app(new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,banter:false,reduced:true})]]));await a.click('play');
 a.game.s.charles={phase:'hover',hits:0,powered:false,x:100,y:90};a.controller.updateHud(true);
 a.controller.showBanter({who:'CHARLES',text:'Une réplique facultative.'});assert.equal(visible(a,'banter'),false);
 a.controller.showBanter({who:'CHARLES',text:'Onde de choc. Un seul coup est mortel.',encounter:true});
 assert.equal(visible(a,'banter'),true);assert.equal(visible(a,'banter-rival'),true);assert.equal(visible(a,'banter-portrait'),false);
 assert.equal(a.charlesPortraits.length,1);assert.equal(a.charlesPortraits[0].reduced,true);assert.equal(a.game.s.charles.x,100);
 a.click('banter-close');assert.equal(visible(a,'charles-banner'),true,'the permanent warning survives dismissing dialogue');
});

test('leaving Charles through pause returns to a separate epilogue result and keeps endless',async()=>{
 const a=app();await victory(a);a.click('meet-charles');a.click('charles-start');a.click('pause');
 assert.equal(visible(a,'charles-leave'),true);a.click('charles-leave');
 assert.equal(a.game.s.mode,'victory');assert.equal(a.game.s.charles.phase,'complete');assert.equal(a.controller.screen,'results');
 assert.match(a.get('result-title').textContent,/victoire/i);assert.match(a.get('charles-result').textContent,/épilogue/i);assert.match(a.get('charles-result').textContent,/victoire.*conservée/i);
 assert.equal(visible(a,'charles-choice'),false);assert.equal(visible(a,'endless'),true);
 a.click('endless');assert.equal(a.game.s.endless,true);assert.notEqual(a.game.s.mode,'victory');assert.equal(visible(a,'charles-banner'),false);
});

test('epilogue completion event displays survival victory rather than game over',async()=>{
 const a=app();await victory(a);a.game.s.charles={phase:'complete',hits:18,powered:true};a.game.s.mode='victory';
 a.controller.onGameEvent('epilogue-complete',{});assert.equal(a.controller.screen,'results');assert.match(a.get('result-title').textContent,/victoire/i);
 assert.equal(visible(a,'charles-result'),true);assert.equal(visible(a,'endless'),true);assert.equal(visible(a,'charles-choice'),false);
});

test('Charles phase guidance restores the safe direction after pause without stale normal encounters',async()=>{
 const a=app();await victory(a);a.click('meet-charles');a.click('charles-start');
 Object.assign(a.game.s.charles,{phase:'shock_warning',phaseTime:2});a.game.bossDirector.warned=true;a.game.bossDirector.remaining=3;
 a.controller.updateHud(true);assert.match(a.get('charles-phase').textContent,/ouverture verte/i);
 a.click('pause');a.click('resume');assert.equal(visible(a,'banter'),false,'normal encounter warnings must not overwrite Charles');assert.equal(visible(a,'charles-banner'),true);
 a.game.s.charles.phase='cape_warning';a.controller.updateHud();assert.match(a.get('charles-phase').textContent,/sors du cercle/i);
});

test('saved Charles resumes paused with its warning and explicit exit available',async()=>{
 const a=app();await victory(a);a.click('meet-charles');a.click('charles-start');a.click('pause');await a.controller.persistRun();
 const b=app(a.values);await b.click('resume-saved');assert.equal(b.controller.screen,'pause-screen');assert.equal(visible(b,'charles-leave'),true);
 b.click('resume');assert.equal(b.controller.screen,'hud');assert.equal(b.game.s.charles.phase,'intro');assert.equal(visible(b,'charles-banner'),true);
});

test('managed dialogue remains visible after a wall-clock jump while simulation is paused',async()=>{
 const a=app();await a.click('play');a.game.bark('TOMA','Une phrase que je veux finir de lire.',true);const line=a.get('banter-text').textContent;
 a.click('pause');a.controller.frame(performance.now()+30000);a.click('resume');
 assert.equal(visible(a,'banter'),true);assert.equal(a.get('banter-text').textContent,line);
 a.controller.frame(performance.now()+60000);assert.equal(visible(a,'banter'),true);
});
test('saved active dialogue returns on resume rather than leaving a blank reserved interval',async()=>{
 const a=app();await a.click('play');a.game.bark('TOMA','Je conserve cette phrase après la sauvegarde.',true);a.click('pause');await a.controller.persistRun();
 const b=app(a.values);await b.click('resume-saved');b.click('resume');assert.equal(visible(b,'banter'),true);assert.match(b.get('banter-text').textContent,/conserve cette phrase/);
});

test('banter setting suspends an actual story and resumes the same visible line',async()=>{
 const a=app();await a.click('play');a.game.s.elapsed=30;a.game.s.upg.car=1;a.game.timers.bark=1000;a.game.world.getVisible=()=>[];a.game.story(.01);
 const first=a.get('banter-text').textContent;assert.equal(a.game.speech.scene.id,'build-car');a.game.s.elapsed+=1;const remaining=a.game.speech.active.until-a.game.s.elapsed;
 a.click('pause');a.get('banter-setting').onchange({target:{checked:false}});a.click('resume');assert.equal(a.game.banterEnabled,false);assert.equal(visible(a,'banter'),false);
 a.game.s.elapsed+=100;a.game.story(.01);assert.equal(a.game.eventSeen.has('scene:build-car'),false);
 a.click('pause');a.get('banter-setting').onchange({target:{checked:true}});a.click('resume');assert.equal(visible(a,'banter'),true);assert.equal(a.get('banter-text').textContent,first);assert.ok(Math.abs(a.game.speech.active.remaining-remaining)<1e-6);
});
test('saved banter preference is applied before a resumed scene can consume reading time',async()=>{
 const a=app(new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,banter:false,reduced:true})]]));await a.click('play');assert.equal(a.game.banterEnabled,false);a.game.s.elapsed=30;a.game.s.upg.car=1;a.game.story(.01);assert.equal(a.game.speech.scene,null);
 a.game.announceEncounter('Attention, une horde arrive !');assert.equal(visible(a,'banter'),true);assert.match(a.get('banter-text').textContent,/horde/);
});

for(const competing of ['endless','meet-charles','retry','result-menu']){
 test(`pending results menu blocks ${competing} until its save completes`,async()=>{
  const a=app();await victory(a);const current=a.game,id=a.controller.runId,revision=JSON.parse(a.values.get('toma-popescu-run-v1')).revision;let competingAction;
  const release=a.holdLock(),pending=a.click('result-menu');
  try{
   await new Promise(resolve=>setTimeout(resolve,0));
   competingAction=a.click(competing);await Promise.resolve();
   assert.equal(a.controller.screen,'results','the pending menu transition owns navigation');
   assert.equal(a.game,current);assert.equal(a.controller.runId,id);
   assert.equal(a.game.s.endless,false);assert.equal(a.game.s.charles,null);
  }finally{release();await pending;await competingAction;}
  assert.equal(JSON.parse(a.values.get('toma-popescu-run-v1')).revision,revision+1,'only one Menu checkpoint is written');
  assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);
  await a.click('play');assert.equal(a.controller.screen,'hud','the completed transition releases its gate');
 });
}

test('stale results handlers cannot exit endless play or interrupt a Charles confirmation',async()=>{
 const a=app();await victory(a);a.click('endless');const current=a.game;
 await a.click('result-menu');assert.equal(a.controller.screen,'hud');assert.equal(a.game,current);
 await a.controller.persistRun();a.click('pause');await a.click('pause-menu');
 await victory(a);a.click('meet-charles');a.click('endless');
 assert.equal(a.controller.screen,'charles-confirm');assert.equal(a.game.s.endless,false);
 await a.click('result-menu');assert.equal(a.controller.screen,'charles-confirm');
});

test('failed results menu save releases navigation without duplicating totals',async()=>{
 const a=app();await a.click('play');Object.assign(a.game.s,{mode:'victory',elapsed:1200,kills:10,coins:5});await a.controller.renderResult(true);
 const originalSet=a.values.set.bind(a.values);a.values.set=()=>{throw Error('quota');};
 const release=a.holdLock(),pending=a.click('result-menu');
 try{
  await new Promise(resolve=>setTimeout(resolve,0));a.click('endless');
  assert.equal(a.controller.screen,'results');assert.equal(a.game.s.endless,false);
 }finally{release();await pending;a.values.set=originalSet;}
 assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);
 assert.equal(a.get('toast').classList.contains('hidden'),false,'write failure remains visible');
 assert.equal(a.saved().lifetime,10);assert.equal(a.saved().coins,5);
 await a.click('play');assert.equal(a.controller.screen,'hud');
 assert.equal(a.saved().lifetime,10);assert.equal(a.saved().coins,5);
});

test('results menu stays serialized behind the initial result save and pagehide flush',async()=>{
 const a=app();await a.click('play');Object.assign(a.game.s,{mode:'victory',elapsed:1200,kills:80,coins:32});
 const release=a.holdLock(),initial=a.controller.renderResult(true),pending=a.click('result-menu');let secondMenu;
 try{
  a.events.pagehide();a.click('endless');secondMenu=a.click('result-menu');await Promise.resolve();
  assert.equal(a.controller.screen,'results');assert.equal(a.game.s.endless,false);
 }finally{release();await initial;await pending;await secondMenu;await new Promise(resolve=>setTimeout(resolve,0));}
 assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);
 const saved=JSON.parse(a.values.get('toma-popescu-run-v1'));
 assert.equal(saved.totals.lifetime,80);assert.equal(saved.totals.coins,32);
 assert.equal(saved.replay.history.filter(result=>result.mode==='survival'&&result.outcome==='victory').length,1);
});

test('endless retains a pending upgrade and rejects stale results navigation',async()=>{
 const a=app();await a.click('play');a.game.gainXP(8);const options=a.game.s.options.map(option=>option.id);
 Object.assign(a.game.s,{mode:'victory',elapsed:1200});await a.controller.renderResult(true);
 a.click('endless');assert.equal(a.controller.screen,'upgrades');assert.equal(a.game.s.mode,'upgrade');
 a.click('endless');await a.click('result-menu');
 assert.equal(a.controller.screen,'upgrades');assert.equal(a.game.s.endless,true);
 assert.deepEqual(a.game.s.options.map(option=>option.id),options);
});

test('real v11 saved run remains visible and playable through the current controller',async()=>{
 const raw=readFileSync(new URL('./fixtures/runstore-v11.json',import.meta.url),'utf8');
 const values=new Map([['toma-popescu-v1',JSON.stringify({introSeen:true})],['toma-popescu-run-v1',raw]]);
 const a=app(values);assert.equal(a.get('saved-run').classList.contains('hidden'),false);
 assert.equal(values.get('toma-popescu-run-v1'),raw,'opening the menu does not rewrite the old save');
 await a.click('resume-saved');assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.elapsed,123);
 a.click('resume');assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.mode,'playing');
 assert.equal(a.game.s.trophies.chosen.travestia,'star');assert.equal(a.game.s.kills,17);
 assert.equal((await a.controller.persistRun()).ok,true);
 const saved=JSON.parse(values.get('toma-popescu-run-v1'));
 assert.equal(saved.version,persistence.captureRun(a.game).version);assert.equal(saved.run.snapshot.version,saved.version);
 assert.deepEqual(saved.totals,{best:1200,lifetime:97,coins:41});
});


for(const native of [false,true])test(`leaving recovered Charles re-enables requested and periodic endless saves (${native?'native':'queued'} locks)`,{skip:native&&!workers.locks,timeout:5000},async()=>{
 let queue=Promise.resolve(),now=100;const locks=native?workers.locks:{request(_key,fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}};
 const clock={now:()=>now},drain=()=>locks.request('toma-popescu-run-v1',()=>{}),record=a=>JSON.parse(a.values.get('toma-popescu-run-v1'));
 const a=app(undefined,locks,clock);await a.click('play');a.game.s.elapsed=1199.99;a.game.update(.02);await a.controller.persistRun(true);
 assert.equal(a.game.s.mode,'playing');assert.equal(a.game.s.charles.phase,'intro');a.click('pause');assert.ok((await a.controller.persistRun()).ok);
 const b=app(a.values,locks,clock);await b.click('resume-saved');assert.equal(b.controller.screen,'pause-screen');
 const untouched=b.values.get('toma-popescu-run-v1');now+=6000;b.controller.frame(now);await drain();assert.equal(b.values.get('toma-popescu-run-v1'),untouched,'recovery pause remains read-only until an explicit choice');
 b.click('charles-leave');await drain();assert.equal(b.controller.screen,'results');assert.equal(b.game.s.charles.phase,'complete');
 const terminal=record(b);assert.equal(terminal.run.snapshot.game.s.mode,'victory');const kills=terminal.totals.lifetime,coins=terminal.totals.coins;
 b.click('endless');now+=50;b.controller.frame(now);await drain();
 const requested=record(b);assert.equal(b.controller.screen,'hud');assert.equal(b.game.s.endless,true);assert.ok(requested.revision>terminal.revision,'first endless frame must persist its requested transition');assert.equal(requested.run.snapshot.game.s.endless,true);
 now+=5100;b.controller.frame(now);await drain();const periodic=record(b);assert.ok(periodic.revision>requested.revision,'ordinary periodic autosave must remain enabled');assert.ok(periodic.run.snapshot.game.s.elapsed>requested.run.snapshot.game.s.elapsed);assert.equal(periodic.totals.lifetime,kills);assert.equal(periodic.totals.coins,coins);
 const restored=app(b.values,locks,clock);await restored.click('resume-saved');assert.equal(restored.game.s.endless,true);assert.equal(restored.game.s.elapsed,periodic.run.snapshot.game.s.elapsed);
});
