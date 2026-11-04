import test from 'node:test';
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

// Run the real app controller with inert browser surfaces, real engine and storage.
function app(existingValues){
  const sounds=[],charlesPortraits=[];const elements=new Map(),values=existingValues||new Map([['toma-popescu-v1',JSON.stringify({introSeen:true})]]);let queue=Promise.resolve(),confirmed=true;const events={};
  const element=()=>({children:[],listeners:{},textContent:'',style:{setProperty(){},removeProperty(){}},classList:{state:new Set(),toggle(key,on){if(on===undefined)on=!this.state.has(key);on?this.state.add(key):this.state.delete(key);},add(key){this.state.add(key);},remove(key){this.state.delete(key);},contains(key){return this.state.has(key);}},addEventListener(type,handler){this.listeners[type]=handler;},setAttribute(key,value){this[key]=value;},getAttribute(key){return this[key];},focus(){context.document.activeElement=this;},replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},getBoundingClientRect:()=>({width:390,height:844}),getContext:()=>({clearRect(){},fillRect(){},save(){},restore(){},translate(){},scale(){}})});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const context=vm.createContext({...content,...opening,...persistence,...evolutions,...trophies,drawTrophyIcon(){},drawTrophyPortrait(){},discoveryPrompt,Game,console,performance,Date,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),requestAnimationFrame(){},ResizeObserver:class{observe(){}},HTMLInputElement:class{},crypto:{randomUUID:()=>String(Math.random())},navigator:{locks:{request(_key,fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}}},window:{addEventListener(type,fn){events[type]=fn;},confirm:()=>confirmed},document:{hidden:false,getElementById:get,querySelector:()=>element(),querySelectorAll:()=>[],createElement:element,addEventListener(){}},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},Renderer:class{constructor(){this.charles={draw(_ctx,c,time,reduced){charlesPortraits.push({c,time,reduced});}};}resize(){}render(){}},drawIcon(){},AudioManager:class{setEnabled(){}setVolume(){}setScene(){}setDucked(){}setIntensity(){}sfx(name){sounds.push(name);}unlock(){return Promise.resolve();}}});
  for(const match of readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').matchAll(/<[^>]+id="([^"]+)"[^>]*>/g)){const cls=match[0].match(/class="([^"]*)"/);for(const name of cls?.[1].split(/\s+/)||[])get(match[1]).classList.add(name);}
  const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  vm.runInContext(source+'\n globalThis.controller={get activeElement(){return document.activeElement},get game(){return game},get screen(){return screen},setDifficulty,frame,recordRun,renderResult,persistRun,resumeSaved,renderTrophies,syncEngineScreen,updateHud,onGameEvent,showBanter,get runId(){return runId}};',context);
  return {events,charlesPortraits,confirm:value=>confirmed=value,values,sounds,get,click:id=>get(id).onclick?.(),get game(){return context.controller.game;},controller:context.controller,saved:()=>JSON.parse(values.get('toma-popescu-run-v1')).totals};
}


// These are controller/DOM-adapter tests, not browser layout or touch QA.
async function victory(a){await a.click('play');Object.assign(a.game.s,{mode:'victory',elapsed:1200});await a.controller.renderResult(true);}
const visible=(a,id)=>!a.get(id).classList.contains('hidden');

test('Charles offer is available only for a normal unplayed victory',async()=>{
 const a=app();await a.click('play');await a.controller.renderResult(false);
 assert.equal(visible(a,'charles-choice'),false);
 Object.assign(a.game.s,{mode:'victory',elapsed:1200});await a.controller.renderResult(true);
 assert.equal(visible(a,'charles-choice'),true);assert.equal(visible(a,'endless'),true);
 a.game.s.endless=true;await a.controller.renderResult(true);assert.equal(visible(a,'charles-choice'),false);
 a.game.s.endless=false;a.game.s.charles={phase:'complete'};await a.controller.renderResult(true);assert.equal(visible(a,'charles-choice'),false);
});

test('Charles requires an explicit confirmation and cancel preserves the earned victory',async()=>{
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
 assert.equal(a.get('time-goal').textContent,'SURVIE DÉJÀ GAGNÉE');
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
