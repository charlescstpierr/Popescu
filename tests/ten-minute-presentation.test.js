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
import * as trophies from '../dist/boss-trophies.js';
import * as evolutions from '../dist/evolutions.js';
import {carLevel} from '../dist/lamborghini.js';
import * as runRules from '../dist/run-rules.js';
import {CHARLES_LINES,charlesLines,startCharles,CHARLES_ARRIVAL} from '../dist/charles.js';
import {encounterLines} from '../dist/encounter-dialogue.js';

// Run the real app controller with inert browser surfaces, real engine and storage.
function app(existingValues,locks,clock=performance){
  const sounds=[],charlesPortraits=[],intensities=[];const elements=new Map(),values=existingValues||new Map([['toma-popescu-v1',JSON.stringify({introSeen:true})]]);let queue=Promise.resolve(),confirmed=true;const events={};
  const element=()=>({children:[],listeners:{},textContent:'',style:{setProperty(){},removeProperty(){}},classList:{state:new Set(),toggle(key,on){if(on===undefined)on=!this.state.has(key);on?this.state.add(key):this.state.delete(key);},add(...keys){for(const key of keys)this.state.add(key);},remove(...keys){for(const key of keys)this.state.delete(key);},contains(key){return this.state.has(key);}},addEventListener(type,handler){this.listeners[type]=handler;},setAttribute(key,value){this[key]=value;},getAttribute(key){return this[key];},focus(){context.document.activeElement=this;},replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},getBoundingClientRect:()=>({width:390,height:844}),getContext:()=>({clearRect(){},fillRect(){},save(){},restore(){},translate(){},scale(){}})});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const context=vm.createContext({renderEncounterPresentation:args=>renderEncounterPresentation({...args,document:context.document}),...content,...runRules,...opening,...persistence,...evolutions,carLevel,...trophies,drawTrophyIcon(){},drawTrophyPortrait(){},discoveryPrompt,Game,console,performance:clock,Date,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),requestAnimationFrame(){},ResizeObserver:class{observe(){}},HTMLInputElement:class{},crypto:{randomUUID:()=>String(Math.random())},navigator:{locks:locks||{request(_key,fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}}},window:{addEventListener(type,fn){events[type]=fn;},confirm:()=>confirmed},document:{hidden:false,getElementById:get,querySelector:()=>element(),querySelectorAll:()=>[],createElement:element,addEventListener(){}},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},Renderer:class{constructor(){this.actors={available:()=>true};this.charles={draw(_ctx,c,time,reduced){charlesPortraits.push({c,time,reduced});}};}resize(){}render(){}},drawIcon(){},AudioManager:class{setEnabled(){}setVolume(){}setScene(){}setDucked(){}setIntensity(value){intensities.push(value);}sfx(name){sounds.push(name);}unlock(){return Promise.resolve();}}});
  for(const match of readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').matchAll(/<[^>]+id="([^"]+)"[^>]*>/g)){const cls=match[0].match(/class="([^"]*)"/);for(const name of cls?.[1].split(/\s+/)||[])get(match[1]).classList.add(name);}
  const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  vm.runInContext(source+'\n globalThis.controller={get activeElement(){return document.activeElement},get game(){return game},get screen(){return screen},setDifficulty,frame,recordRun,renderResult,persistRun,resumeSaved,renderTrophies,syncEngineScreen,updateHud,onGameEvent,showBanter,get runId(){return runId}};',context);
  return {holdLock(){let release;const held=new Promise(resolve=>release=resolve);queue=queue.then(()=>held);return release;},events,charlesPortraits,intensities,confirm:value=>confirmed=value,values,sounds,get,click:id=>get(id).onclick?.(),get game(){return context.controller.game;},controller:context.controller,saved:()=>JSON.parse(values.get('toma-popescu-run-v1')).totals};
}


for(const duration of [600,1200]){
 test(`HUD, victory, Charles and endless copy use the ${duration/60}-minute run goal`,async()=>{
  const a=app();await a.click('play');a.game.s.survivalDuration=duration;
  Object.assign(a.game.s,{elapsed:duration/2,enemies:[]});a.controller.updateHud(true);
  assert.equal(a.get('time-goal').textContent,`OBJECTIF ${duration===600?'10':'20'}:00`);
  assert.equal(a.intensities.at(-1),.6);
  Object.assign(a.game.s,{elapsed:duration,mode:'victory'});await a.controller.renderResult(true);
  assert.equal(a.get('result-kicker').textContent,`${duration/60} MINUTES. ZÉRO RETOUCHE.`);
  assert.match(a.get('result-quote').textContent,duration===600?/^Dix minutes/:/^Vingt minutes/);
  assert.ok(a.get('charles-offer-note').textContent.includes(`survie de ${duration/60} minutes`));
  assert.ok(a.get('charles-secured').textContent.includes(`victoire des ${duration/60} minutes`));
  a.click('meet-charles');a.click('charles-start');a.click('pause');a.click('charles-leave');
  assert.ok(a.get('charles-result').textContent.includes(`victoire des ${duration/60} minutes`));
  a.click('endless');a.controller.updateHud(true);
  assert.equal(a.get('time-goal').textContent,'SURVIE INFINIE');
  assert.match(a.get('banter-text').textContent,duration===600?/^Dix minutes/:/^Vingt minutes/);
 });
 test(`last-minute timer feedback begins at ${duration-60} seconds`,async()=>{
  const a=app();await a.click('play');a.game.s.survivalDuration=duration;
  a.game.s.elapsed=duration-62;a.controller.updateHud(true);a.get('time').classList.remove('timer-beat');
  a.game.s.elapsed=duration-61;a.controller.updateHud();
  assert.equal(a.get('time').classList.contains('timer-beat'),false);
  a.game.s.elapsed=duration-60;a.controller.updateHud();
  assert.equal(a.get('time').classList.contains('timer-beat'),true);
  a.get('time').classList.remove('timer-beat');
  a.game.s.elapsed=duration-59;a.controller.updateHud();
  assert.equal(a.get('time').classList.contains('timer-beat'),true);
 });
 test(`Charles starts at ${duration} seconds and speaks that run's duration`,()=>{
  const g=new Game({seed:721});g.s.survivalDuration=duration;g.s.elapsed=duration-.01;
  assert.equal(startCharles(g),false);g.s.elapsed=duration;assert.equal(startCharles(g),true);
  assert.match(charlesLines(g.s)[0].text,duration===600?/^Dix minutes/:/^Vingt minutes/);
  assert.deepEqual(encounterLines('charles:0',0,0,g.s),charlesLines(g.s).slice(0,2));
  g.s.charles.phaseTime=8-CHARLES_ARRIVAL.release-.01;g.update(.01);
  assert.match(g.speech.active.text,duration===600?/^Dix minutes/:/^Vingt minutes/);
 });
}

test('new runs advertise ten minutes on the landing screen, in metadata and in the introduction',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(html,/<title>Toma Popescu : 10 minutes sans IA<\/title>/);
 assert.match(html,/<meta name="description" content="[^"]*tenir 10 minutes sans IA/);
 assert.match(html,/10 MINUTES SANS IA/);assert.match(html,/Une partie dure 10 minutes/);
 assert.doesNotMatch(html,/20 MINUTES|20 minutes|20:00/);
 assert.ok(content.INTRO.some(line=>line.text.includes('Survis 10 minutes.')));
});

test('story clocks and callbacks follow the new milestones and preserve the old milestone table',()=>{
 const current={survivalDuration:600},legacy={survivalDuration:1200};
 assert.deepEqual(content.storyMilestones(current).map(line=>line.at),[150,300,450,540]);
 assert.equal(content.storyMilestones(legacy),content.STORY_MILESTONES);
 assert.deepEqual(content.storyMilestones(legacy).map(line=>line.at),[300,600,900,1140]);
 const built=new Set(['scene:build-car']),street=new Set(['scene:street:bench']);
 assert.match(content.storyMilestoneLine(content.storyMilestones(current)[1],built,current).text,/^Cinq minutes/);
 assert.match(content.storyMilestoneLine(content.storyMilestones(legacy)[1],built,legacy).text,/^Dix minutes/);
 assert.equal(content.storyMilestoneLine(content.storyMilestones(current)[2],street,current).text,'Sept minutes trente. Le pigeon a toujours pas payé.');
 assert.equal(content.storyMilestoneLine(content.storyMilestones(legacy)[2],street,legacy).text,'Quinze minutes. Le pigeon a toujours pas payé.');
 assert.match(content.storyMilestones(current)[3].text,/victoire est à dix minutes/);
 assert.match(content.storyMilestones(legacy)[3].text,/victoire est à vingt minutes/);
});

test('every victory callback uses its saved run duration',()=>{
 for(const duration of [600,1200]){
  const s={survivalDuration:duration,upg:{truth:0},companion:false};
  const expected=duration===600?/^Dix minutes/:/^Vingt minutes/;
  for(const flag of ['scene:build-car','scene:build-money','scene:build-followers']){
   for(const companion of [false,true])assert.match(content.victoryQuote({...s,companion},new Set([flag])),expected);
  }
  assert.match(content.victoryQuote({...s,companion:true}),expected);
  assert.match(content.victoryQuote({...s,upg:{truth:1}}),expected);
  assert.match(content.victoryQuote(s),expected);
 }
 assert.match(CHARLES_LINES[0].text,/^Vingt minutes/);
 assert.equal(charlesLines({survivalDuration:1200}),CHARLES_LINES);
});
