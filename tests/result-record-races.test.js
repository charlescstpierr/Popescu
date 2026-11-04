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
import * as evolutions from '../dist/evolutions.js';
import {carLevel} from '../dist/lamborghini.js';

// Run the real app controller with inert browser surfaces, real engine and storage.
function app(existingValues, locks){
  const sounds=[];const elements=new Map(),values=existingValues||new Map([['toma-popescu-v1',JSON.stringify({introSeen:true})]]);let queue=Promise.resolve(),confirmed=true;const events={};
  const element=()=>({children:[],listeners:{},textContent:'',style:{setProperty(){},removeProperty(){}},classList:{state:new Set(),toggle(key,on){if(on===undefined)on=!this.state.has(key);on?this.state.add(key):this.state.delete(key);},add(key){this.state.add(key);},remove(key){this.state.delete(key);},contains(key){return this.state.has(key);}},addEventListener(type,handler){this.listeners[type]=handler;},setAttribute(key,value){this[key]=value;},replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},getBoundingClientRect:()=>({width:390,height:844}),getContext:()=>({})});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const context=vm.createContext({...content,...opening,...persistence,...evolutions,carLevel,discoveryPrompt,Game,console,performance,Date,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),requestAnimationFrame(){},ResizeObserver:class{observe(){}},HTMLInputElement:class{},crypto:{randomUUID:()=>String(Math.random())},navigator:{locks:locks||{request(_key,fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}}},window:{addEventListener(type,fn){events[type]=fn;},confirm:()=>confirmed},document:{hidden:false,getElementById:get,querySelector:()=>element(),querySelectorAll:()=>[],createElement:element,addEventListener(){}},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},Renderer:class{constructor(){this.actors={available:()=>true};}resize(){}render(){}},drawIcon(){},AudioManager:class{setEnabled(){}setVolume(){}setScene(){}setDucked(){}setIntensity(){}sfx(name){sounds.push(name);}unlock(){return Promise.resolve();}}});
  const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  vm.runInContext(source+'\n globalThis.controller={get game(){return game},get screen(){return screen},setDifficulty,frame,recordRun,renderResult,persistRun,resumeSaved,get runId(){return runId},get debug(){return {best,lifetime,lifetimeCoins,creditedKills,creditedCoins,transitionBusy,runPersistence}}};',context);
  return {events,confirm:value=>confirmed=value,values,sounds,get,click:id=>get(id).onclick(),get game(){return context.controller.game;},controller:context.controller,saved:()=>JSON.parse(values.get('toma-popescu-run-v1')).totals};
}

// Node 24.5+ supplies the native LockManager. A Promise.then-only fake does
// not reproduce the native ordering between queued grants and caller resumes.
const native={skip:typeof workers.locks?.request!=='function',timeout:5000};
async function holdNativeLock(){
 let release,entered;const acquired=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
 const held=workers.locks.request('toma-popescu-run-v1',async()=>{entered();await gate;});await acquired;
 return {release,held};
}
function failWrites(a,count){let writes=0;const put=a.values.set.bind(a.values);a.values.set=(key,value)=>{if(key==='toma-popescu-run-v1'&&++writes<=count)throw Error('quota');return put(key,value);};}
async function terminal(){const a=app(undefined,workers.locks);await a.click('play');Object.assign(a.game.s,{mode:'victory',elapsed:1200,kills:80,coins:32});return a;}
function assertCredits(a,kills,coins,creditedKills,creditedCoins){const d=a.controller.debug;assert.equal(d.lifetime,kills);assert.equal(d.lifetimeCoins,coins);assert.equal(d.creditedKills,creditedKills);assert.equal(d.creditedCoins,creditedCoins);}

test('native lock: failed old result write cannot credit the new run after Retry',native,async()=>{
 const a=await terminal(),old=a.game,lock=await holdNativeLock();let rendered,retried;
 try{failWrites(a,1);rendered=a.controller.renderResult(true);retried=a.click('retry');}finally{lock.release();}
 await Promise.all([rendered,retried,lock.held]);assert.notEqual(a.game,old);assert.equal(a.controller.screen,'hud');
 assertCredits(a,80,32,0,0);assert.equal(a.saved().lifetime,80);assert.equal(a.saved().coins,32);
 Object.assign(a.game.s,{elapsed:20,kills:3,coins:2});await a.click('pause-menu');
 assert.equal(a.saved().lifetime,83);assert.equal(a.saved().coins,34);
});
test('native lock: successful results and Retry retain exact totals and new run credits',native,async()=>{
 const a=await terminal(),lock=await holdNativeLock();let rendered,retried;
 try{rendered=a.controller.renderResult(true);retried=a.click('retry');}finally{lock.release();}
 await Promise.all([rendered,retried,lock.held]);assertCredits(a,80,32,0,0);assert.equal(a.saved().lifetime,80);assert.equal(a.saved().coins,32);
});
test('native lock: failed result write still credits the same current run exactly once',native,async()=>{
 const a=await terminal();failWrites(a,4);await a.controller.renderResult(true);assertCredits(a,80,32,80,32);
 await a.controller.recordRun();assertCredits(a,80,32,80,32);
 // Failed writes leave the last durable envelope unchanged.
 assert.equal(a.saved().lifetime,0);assert.equal(a.saved().coins,0);
});
test('native lock: cancelled Retry retains fallback credits on the old run',native,async()=>{
 const a=await terminal(),old=a.game,lock=await holdNativeLock();let rendered,retried;
 try{failWrites(a,2);a.confirm(false);rendered=a.controller.renderResult(true);retried=a.click('retry');}finally{lock.release();}
 await Promise.all([rendered,retried,lock.held]);assert.equal(a.game,old);assert.equal(a.controller.screen,'results');assertCredits(a,80,32,80,32);assert.equal(a.saved().lifetime,0);
});
test('native lock: failed initial result save followed by Menu cannot double durable totals',native,async()=>{
 const a=await terminal(),lock=await holdNativeLock();let rendered,menu;
 try{failWrites(a,1);rendered=a.controller.renderResult(true);menu=a.click('result-menu');}finally{lock.release();}
 await Promise.all([rendered,menu,lock.held]);assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);assert.equal(a.controller.debug.lifetime,80);assert.equal(a.controller.debug.lifetimeCoins,32);assert.equal(a.saved().lifetime,80);assert.equal(a.saved().coins,32);
});
