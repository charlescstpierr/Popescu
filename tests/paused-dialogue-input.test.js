import test from 'node:test';
import {seedUpgradeOffer} from './helpers/upgrade-offer.js';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';
import {EVENTS} from '../dist/content.js';
import {captureRun} from '../dist/run-save.js';
const key=(a,value,repeat=false)=>a.events.keydown({key:value,repeat,preventDefault(){}});
async function boss(){const a=app();await a.click('play');a.game.setPausedEncountersEnabled(true);a.game.world.collides=()=>false;a.game.s.shotClock=1000;const e=a.game.spawnEnemy('pelican',a.game.s.x+100,a.game.s.y);e.cooldown=0;a.game.update(.01);assert.equal(a.controller.screen,'dialogue');return a;}
const progress=a=>a.get('dialogue-progress').textContent;
async function companion(){const a=app();await a.click('play');seedUpgradeOffer(a.game,'girlfriend');a.game.gainXP(8);const index=a.game.s.options.findIndex(o=>o.id==='girlfriend');a.get('upgrade-options').children[index].dispatch('click',{});return a;}

test('held Enter and Space cannot consume a modal and cannot spill into resumed controls',async()=>{
 const a=await companion();for(const button of ['Enter',' ']){for(let i=0;i<8;i++)key(a,button,true);assert.equal(progress(a),'1 / 5');}key(a,'Enter');assert.equal(progress(a),'2 / 5');for(let i=0;i<8;i++)key(a,'Enter',true);assert.equal(progress(a),'2 / 5');
 a.click('skip-dialogue');key(a,'ArrowRight',true);assert.equal(a.controller.inputState.keys.length,0);key(a,'ArrowRight');assert.ok(a.controller.inputState.keys.includes('arrowright'));
});
test('boss controller owns one cursor, saves every line, and skip is idempotent',async()=>{
 const a=await boss();a.click('next-dialogue');assert.equal(progress(a),'2 / 2');assert.equal(a.game.encounters.active.index,1);assert.equal((await a.controller.persistRun()).ok,true);
 const b=app(a.values);await b.click('resume-saved');assert.equal(b.controller.screen,'pause-screen');b.click('resume');assert.equal(b.controller.activeElement,b.get('next-dialogue'));assert.equal(progress(b),'2 / 2');assert.equal(b.game.encounters.active.index,1);
 b.click('skip-dialogue');assert.equal(b.controller.screen,'hud');assert.equal(b.controller.activeElement,b.get('pause'));assert.equal(b.game.encounters.outcomes['boss:pelican'],'skipped');const before=captureRun(b.game);b.click('skip-dialogue');assert.deepEqual(captureRun(b.game),before);
});
test('rapid physical clicks and double-click delivery cannot skip two lines',async()=>{
 const a=await companion(),click=a.get('next-dialogue').onclick;click({detail:1});assert.equal(progress(a),'2 / 5');click({detail:1});click({detail:2});assert.equal(progress(a),'2 / 5');
});
test('modal entry releases a captured touch and held movement never reappears after close',async()=>{
 const a=app();await a.click('play');const surface=a.get('app');const pointer={pointerId:5,clientX:60,clientY:650,target:{closest:()=>false},preventDefault(){}};surface.dispatch('pointerdown',pointer);surface.dispatch('pointermove',{...pointer,clientX:90});key(a,'d');assert.equal(a.controller.inputState.pointer,5);
 a.game.startDialogue(EVENTS.companion);assert.equal(a.controller.inputState.pointer,null);assert.equal(surface.captured,null);assert.equal(a.controller.inputState.keys.length,0);a.click('skip-dialogue');surface.dispatch('pointermove',{...pointer,clientX:100});surface.dispatch('pointerup',pointer);key(a,'d',true);assert.equal(a.controller.inputState.pointer,null);assert.equal(a.controller.inputState.keys.length,0);
});
test('new important scenes start manual even after the preceding scene used AUTO',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await companion();a.click('auto-dialogue');a.click('skip-dialogue');a.game.startDialogue(EVENTS.companion.slice(0,2));t.mock.timers.tick(60000);assert.equal(progress(a),'1 / 2');assert.equal(a.game.s.mode,'dialogue');
});
test('boss AUTO remains frozen through blur/hidden and resumed scene keeps actor context',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await boss();const before=captureRun(a.game);a.click('auto-dialogue');a.events.blur();a.document.hidden=true;a.documentEvents.visibilitychange();t.mock.timers.tick(60000);assert.deepEqual(captureRun(a.game),before);
 a.events.focus();t.mock.timers.tick(60000);assert.equal(progress(a),'1 / 2');a.document.hidden=false;a.documentEvents.visibilitychange();t.mock.timers.tick(Math.max(2500,a.get('dialogue-text').textContent.length*48));assert.equal(progress(a),'2 / 2');assert.equal(a.game.encounters.active.index,1);assert.equal(a.game.dialoguePresentation().actorType,'pelican');
});

test('approved browser flow enables paused bosses for new and resumed runs while the engine remains explicit',async()=>{
 const a=app();await a.click('play');assert.equal(a.game.pausedEncountersEnabled,true);await a.controller.persistRun();const b=app(a.values);await b.click('resume-saved');assert.equal(b.game.pausedEncountersEnabled,true);assert.equal(b.controller.screen,'pause-screen');
});

test('a queued AUTO callback from before focus recovery or a later scene cannot steal reading time',async()=>{
 const callbacks=[],a=app(undefined,undefined,performance,undefined,{setTimeout:fn=>{callbacks.push(fn);return callbacks.length;},clearTimeout(){}});await a.click('play');a.game.startDialogue(EVENTS.companion);a.click('auto-dialogue');const beforeBlur=callbacks.at(-1);a.events.blur();a.events.focus();const afterFocus=callbacks.at(-1);beforeBlur();assert.equal(progress(a),'1 / 5');afterFocus();assert.equal(progress(a),'2 / 5');
 const beforeClose=callbacks.at(-1);a.click('skip-dialogue');a.game.startDialogue(EVENTS.companion.slice(0,2));a.click('auto-dialogue');beforeClose();assert.equal(progress(a),'1 / 2');
});

test('real controller applies the approved variant on both speakers and removes it on close',async()=>{
 const a=await boss();assert.equal(a.get('dialogue').classList.contains('encounter-dialogue'),true);assert.equal(a.get('encounter-name').textContent,'PÉLI ZODIAQUE');a.click('next-dialogue');assert.equal(a.get('encounter-name').textContent,'TOMA POPESCU');assert.equal(a.get('encounter-portrait').src,'assets/dialogue-toma.png');assert.match(a.get('encounter-description').textContent,/Toma Popescu répond/);a.click('skip-dialogue');assert.equal(a.get('dialogue').classList.contains('encounter-dialogue'),false);assert.equal(a.get('dialogue').getAttribute('aria-modal'),null);
});
test('Space in the dialogue reading region scrolls natively rather than skipping a line',async()=>{
 const a=await companion();let prevented=false;a.events.keydown({key:' ',repeat:false,target:a.get('dialogue-text'),preventDefault(){prevented=true;}});assert.equal(progress(a),'1 / 5');assert.equal(prevented,false);
});

test('successful paid reroll preserves runtime encounter capability and action-banter preference',async()=>{
 for(const banter of [true,false]){
  const a=app(new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,banter})]]));await a.click('play');a.game.s.coins=50;a.game.gainXP(8);assert.equal(await a.click('reroll-upgrades'),true);assert.equal(a.game.pausedEncountersEnabled,true);assert.equal(a.game.banterEnabled,banter);
  a.game.chooseUpgrade(a.game.s.options.find(x=>!['girlfriend','airplane'].includes(x.id)).id);a.game.world.collides=()=>false;a.game.s.shotClock=1000;const e=a.game.spawnEnemy('pelican',a.game.s.x+100,a.game.s.y);e.cooldown=0;a.game.update(.01);assert.equal(a.game.s.mode,banter?'dialogue':'playing');
 }
});

test('a repeated skip event cannot dismiss the next scene after reentry',async()=>{
 const a=await companion();a.get('skip-dialogue').onclick({detail:1});assert.equal(a.controller.screen,'hud');a.game.startDialogue(EVENTS.companion.slice(0,2));a.get('skip-dialogue').onclick({detail:2});a.get('skip-dialogue').onclick({detail:1});assert.equal(a.controller.screen,'dialogue');assert.equal(progress(a),'1 / 2');
});

for(const id of ['skip-dialogue','auto-dialogue','next-dialogue'])test(`focused ${id} retains native keyboard activation and rejects held activation`,async()=>{
 const a=await companion(),target=a.get(id);target.focus();let prevented=false;
 a.events.keydown({key:'Enter',repeat:false,target,preventDefault(){prevented=true;}});assert.equal(prevented,false);assert.equal(progress(a),'1 / 5');
 target.onclick({detail:0});if(id==='skip-dialogue')assert.equal(a.controller.screen,'hud');else if(id==='auto-dialogue'){assert.equal(progress(a),'1 / 5');assert.equal(target.getAttribute('aria-pressed'),'true');}else assert.equal(progress(a),'2 / 5');
 if(id!=='skip-dialogue'){prevented=false;a.events.keydown({key:'Enter',repeat:true,target,preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(progress(a),id==='next-dialogue'?'2 / 5':'1 / 5');a.click('skip-dialogue');}
});
test('Tab and Shift-Tab stay in the active dialogue and include the scrollable text region',async()=>{
 const a=await boss(),cycle=['skip-dialogue','dialogue-text','auto-dialogue','next-dialogue'];
 assert.equal(a.controller.activeElement,a.get('next-dialogue'));
 for(const id of cycle){let prevented=false;a.events.keydown({key:'Tab',target:a.controller.activeElement,preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(a.controller.activeElement,a.get(id));}
 a.get('skip-dialogue').focus();a.events.keydown({key:'Tab',shiftKey:true,target:a.controller.activeElement,preventDefault(){}});assert.equal(a.controller.activeElement,a.get('next-dialogue'));
});

test('held Enter after final Continue cannot activate the newly focused Pause button',async()=>{
 const a=await boss();a.click('next-dialogue');const next=a.get('next-dialogue');let prevented=false;a.events.keydown({key:'Enter',repeat:false,target:next,preventDefault(){prevented=true;}});assert.equal(prevented,false);next.onclick({detail:0});assert.equal(a.controller.screen,'hud');assert.equal(a.controller.activeElement,a.get('pause'));
 const pause=a.get('pause');prevented=false;a.events.keydown({key:'Enter',repeat:true,target:pause,preventDefault(){prevented=true;}});if(!prevented)pause.onclick();assert.equal(prevented,true);assert.equal(a.controller.screen,'hud');
 prevented=false;a.events.keydown({key:'Enter',repeat:false,target:pause,preventDefault(){prevented=true;}});assert.equal(prevented,false);pause.onclick();assert.equal(a.controller.screen,'pause-screen');
});
