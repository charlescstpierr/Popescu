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
  const sounds=[];const elements=new Map(),values=existingValues||new Map([['toma-popescu-v1',JSON.stringify({introSeen:true})]]);let queue=Promise.resolve(),confirmed=true;const events={};
  const element=()=>({children:[],listeners:{},textContent:'',style:{setProperty(){},removeProperty(){}},classList:{state:new Set(),toggle(key,on){if(on===undefined)on=!this.state.has(key);on?this.state.add(key):this.state.delete(key);},add(key){this.state.add(key);},remove(key){this.state.delete(key);},contains(key){return this.state.has(key);}},addEventListener(type,handler){this.listeners[type]=handler;},setAttribute(key,value){this[key]=value;},getAttribute(key){return this[key];},focus(){context.document.activeElement=this;},replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},getBoundingClientRect:()=>({width:390,height:844}),getContext:()=>({clearRect(){}})});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const context=vm.createContext({...content,...opening,...persistence,...evolutions,...trophies,drawTrophyIcon(){},drawTrophyPortrait(){},discoveryPrompt,Game,console,performance,Date,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),requestAnimationFrame(){},ResizeObserver:class{observe(){}},HTMLInputElement:class{},crypto:{randomUUID:()=>String(Math.random())},navigator:{locks:{request(_key,fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}}},window:{addEventListener(type,fn){events[type]=fn;},confirm:()=>confirmed},document:{hidden:false,getElementById:get,querySelector:()=>element(),querySelectorAll:()=>[],createElement:element,addEventListener(){}},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},Renderer:class{resize(){}render(){}},drawIcon(){},AudioManager:class{setEnabled(){}setVolume(){}setScene(){}setDucked(){}setIntensity(){}sfx(name){sounds.push(name);}unlock(){return Promise.resolve();}}});
  const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  vm.runInContext(source+'\n globalThis.controller={get game(){return game},get screen(){return screen},setDifficulty,frame,recordRun,renderResult,persistRun,resumeSaved,renderTrophies,syncEngineScreen,updateHud,get runId(){return runId}};',context);
  return {events,confirm:value=>confirmed=value,values,sounds,get,click:id=>get(id).onclick(),get game(){return context.controller.game;},controller:context.controller,saved:()=>JSON.parse(values.get('toma-popescu-run-v1')).totals};
}


test('trophy screen freezes simulation, has two distinct choices and prevents stale double click',async()=>{
 const a=app();await a.click('play');const g=a.game;g.s.trophies.pending=[{bossType:'pelican',bossId:1,chestId:1}];g.openTrophy();
 assert.equal(a.controller.screen,'trophies');const cards=a.get('trophy-options').children;assert.equal(cards.length,2);assert.equal(cards[0]['data-trophy'],'tarot');
 const before=JSON.stringify(g.s);a.controller.frame(performance.now()+30);assert.equal(JSON.stringify(g.s),before);
 cards[0].listeners.click();assert.equal(g.s.trophies.chosen.pelican,'tarot');assert.equal(a.controller.screen,'hud');cards[1].listeners.click();assert.equal(g.s.trophies.chosen.pelican,'tarot');
 assert.equal(a.get('trophy-toast-text').textContent,'TAROT FLATTEUR ACQUIS');
 const hud=a.get('powers').children.find(e=>e['data-trophy']==='tarot');assert.equal(hud.children[1].textContent,'8s');assert.ok(!hud.title.includes('Niveau'));
 g.s.trophies.cooldowns.tarot=0;a.controller.updateHud();assert.equal(hud.children[1].textContent,'');assert.ok(hud.title.endsWith('Prêt'));
});
test('trophy keyboard cycles focus and Escape cannot dismiss pending choice',async()=>{
 const a=app();await a.click('play');a.game.s.trophies.pending=[{bossType:'travestia',bossId:1,chestId:1}];a.game.openTrophy();const cards=a.get('trophy-options').children;let prevented=0;
 a.events.keydown({key:'Tab',target:{},preventDefault(){prevented++}});a.events.keydown({key:'Tab',shiftKey:true,target:{},preventDefault(){prevented++}});assert.equal(prevented,2);
 a.events.keydown({key:'Escape',target:{}});assert.equal(a.game.s.mode,'trophy');assert.equal(cards.length,2);
});
test('next pending species retains choice modal and does not expose movement HUD',async()=>{
 const a=app();await a.click('play');a.game.s.trophies.pending=[{bossType:'pelican',bossId:1,chestId:1},{bossType:'matriarch',bossId:2,chestId:2}];a.game.openTrophy();a.get('trophy-options').children[0].listeners.click();assert.equal(a.controller.screen,'trophies');assert.equal(a.get('trophy-boss').textContent,'LA MATRIARCHE');assert.equal(a.get('trophy-options').children[0]['data-trophy'],'fanclub');
});

test('acquired toasts queue until gameplay and run for simulation time across pause',async()=>{
 const a=app();await a.click('play');const g=a.game;g.s.trophies.pending=[{bossType:'pelican',bossId:1,chestId:1},{bossType:'matriarch',bossId:2,chestId:2}];g.openTrophy();a.get('trophy-options').children[0].listeners.click();assert.equal(a.get('trophy-toast-text').textContent,'');assert.ok(a.get('trophy-toast').classList.contains('hidden'));a.get('trophy-options').children[0].listeners.click();assert.equal(a.get('trophy-toast-text').textContent,'TAROT FLATTEUR ACQUIS');
 a.click('pause');let now=performance.now()+100;for(let i=0;i<40;i++)a.controller.frame(now+=50);assert.equal(a.get('trophy-toast-text').textContent,'TAROT FLATTEUR ACQUIS');a.click('resume');for(let i=0;i<31;i++)a.controller.frame(now+=50);assert.equal(a.get('trophy-toast-text').textContent,'FAN-CLUB FORCÉ ACQUIS');
});
