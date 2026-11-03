import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import * as persistence from '../dist/run-save.js';
import {discoveryPrompt} from '../dist/discoveries.js';
import * as content from '../dist/content.js';

// Run the real app controller with inert browser surfaces, real engine and storage.
function app(existingValues){
  const sounds=[];const elements=new Map(),values=existingValues||new Map([['toma-popescu-v1',JSON.stringify({introSeen:true})]]);let queue=Promise.resolve(),confirmed=true;const events={};
  const element=()=>({children:[],listeners:{},textContent:'',style:{setProperty(){},removeProperty(){}},classList:{state:new Set(),toggle(key,on){if(on===undefined)on=!this.state.has(key);on?this.state.add(key):this.state.delete(key);},add(key){this.state.add(key);},remove(key){this.state.delete(key);},contains(key){return this.state.has(key);}},addEventListener(type,handler){this.listeners[type]=handler;},setAttribute(){},replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},getBoundingClientRect:()=>({width:390,height:844}),getContext:()=>({})});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const context=vm.createContext({...content,...persistence,discoveryPrompt,Game,console,performance,Date,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),requestAnimationFrame(){},ResizeObserver:class{observe(){}},HTMLInputElement:class{},crypto:{randomUUID:()=>String(Math.random())},navigator:{locks:{request(_key,fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}}},window:{addEventListener(type,fn){events[type]=fn;},confirm:()=>confirmed},document:{hidden:false,getElementById:get,querySelector:()=>element(),querySelectorAll:()=>[],createElement:element,addEventListener(){}},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},Renderer:class{resize(){}render(){}},drawIcon(){},AudioManager:class{setEnabled(){}setVolume(){}setScene(){}setDucked(){}setIntensity(){}sfx(name){sounds.push(name);}unlock(){return Promise.resolve();}}});
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
  Object.assign(a.game.s,{elapsed:20,kills:3,coins:2});await a.click('pause-menu');assert.equal(a.saved().best,60);assert.equal(a.saved().lifetime,13);assert.equal(a.saved().coins,7);
  a.click('play');await a.click('pause-menu');assert.equal(a.saved().lifetime,13);
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
  a.game.s.drops=[{x:0,y:0,kind:'xp',value:50,life:10}];a.game.update(.02);
  a.click('endless');assert.equal(a.game.s.mode,'upgrade');
  assert.equal(a.controller.screen,'upgrades');
});


test('reload restores pending upgrade, resets input, and waits for explicit resume',async()=>{
 const a=app();await a.click('play');a.game.gainXP(20);await a.controller.persistRun();const savedOptions=a.game.s.options.map(o=>o.id);const b=app(a.values);await b.click('resume-saved');assert.equal(b.controller.screen,'pause-screen');assert.equal(b.game.s.mode,'upgrade');b.click('resume');assert.equal(b.controller.screen,'upgrades');assert.deepEqual(b.game.s.options.map(o=>o.id),savedOptions);
});
test('reload preserves dialogue index and exact lines before resuming',async()=>{
 const a=app();await a.click('play');a.game.startDialogue([{who:'TOMA',text:'one'},{who:'TOMA',text:'two'}]);a.click('next-dialogue');await a.controller.persistRun();const b=app(a.values);await b.click('resume-saved');b.click('resume');assert.equal(b.controller.screen,'dialogue');assert.equal(b.get('dialogue-text').textContent,'two');b.click('skip-dialogue');assert.equal(b.game.s.mode,'playing');
});

test('upgrade autosave runs after the update removes consumed XP drops',async()=>{
 const a=app();await a.click('play');a.game.s.drops=[{x:0,y:0,life:10,kind:'xp',value:50}];a.controller.frame(performance.now()+50);await new Promise(r=>setTimeout(r,0));const snapshot=JSON.parse(a.values.get('toma-popescu-run-v1')).run.snapshot;assert.equal(snapshot.game.s.mode,'upgrade');assert.equal(snapshot.game.s.drops.length,0);assert.equal(snapshot.game.s.xp,a.game.s.xp);
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
