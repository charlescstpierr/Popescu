import test from 'node:test';
import {seedUpgradeOffer} from './helpers/upgrade-offer.js';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';
import {EVENTS} from '../dist/content.js';

async function companionDialogue(){
 const a=app();await a.click('play');
 // Use a real first-level offer that contains Blonde IA.
 seedUpgradeOffer(a.game,'girlfriend');a.game.gainXP(8);
 const index=a.game.s.options.findIndex(o=>o.id==='girlfriend');assert.ok(index>=0);
 a.get('upgrade-options').children[index].dispatch('click',{});
 assert.equal(a.controller.screen,'dialogue');assert.equal(a.get('dialogue-text').textContent,EVENTS.companion[0].text);return a;
}
const delay=a=>Math.max(2500,a.get('dialogue-text').textContent.length*48);
const progress=a=>a.get('dialogue-progress').textContent;
function tickAll(t){for(let i=0;i<6;i++)t.mock.timers.tick(20000);}
function hidden(a,value){a.document.hidden=value;a.documentEvents.visibilitychange();}

test('AUTO cannot finish the real companion dialogue or resume combat after blur',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await companionDialogue();a.click('auto-dialogue');a.events.blur();tickAll(t);a.controller.frame(performance.now()+100);
 assert.equal(progress(a),'1 / 5');assert.equal(a.controller.screen,'dialogue');assert.equal(a.game.s.mode,'dialogue');assert.equal(a.game.s.elapsed,0);
});
test('focus resumes the current AUTO line once, with a fresh reading interval',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await companionDialogue();a.click('auto-dialogue');t.mock.timers.tick(1000);a.events.blur();tickAll(t);a.events.focus?.();
 const wait=delay(a);t.mock.timers.tick(wait-1);assert.equal(progress(a),'1 / 5');t.mock.timers.tick(1);assert.equal(progress(a),'2 / 5');
 for(let i=0;i<4;i++)t.mock.timers.tick(delay(a));assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.mode,'playing');
});
test('becoming visible without focus cannot rearm AUTO',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await companionDialogue();a.click('auto-dialogue');a.events.blur();hidden(a,true);hidden(a,false);tickAll(t);
 assert.equal(progress(a),'1 / 5');assert.equal(a.game.s.elapsed,0);a.events.focus?.();t.mock.timers.tick(delay(a));assert.equal(progress(a),'2 / 5');
});
test('focus while hidden waits for visibility before rearming AUTO',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await companionDialogue();a.click('auto-dialogue');a.events.blur();hidden(a,true);a.events.focus?.();tickAll(t);assert.equal(progress(a),'1 / 5');
 hidden(a,false);t.mock.timers.tick(delay(a));assert.equal(progress(a),'2 / 5');
});
test('repeated focus events never create duplicate advance timers',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await companionDialogue();a.click('auto-dialogue');a.events.blur();for(let i=0;i<5;i++)a.events.focus?.();t.mock.timers.tick(delay(a));assert.equal(progress(a),'2 / 5');
});
test('focus never resumes a HUD pause and never changes AUTO-off dialogue',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await companionDialogue();a.events.blur();a.events.focus?.();tickAll(t);assert.equal(progress(a),'1 / 5');
 a.click('skip-dialogue');assert.equal(a.controller.screen,'hud');a.events.blur();assert.equal(a.controller.screen,'pause-screen');a.events.focus?.();tickAll(t);a.controller.frame(performance.now()+100);assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.elapsed,0);
 a.click('resume');assert.equal(a.controller.screen,'hud');
});
test('AUTO off and manual skip invalidate the timer after focus restoration',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await companionDialogue();a.click('auto-dialogue');a.events.blur();a.events.focus?.();a.click('auto-dialogue');tickAll(t);assert.equal(progress(a),'1 / 5');
 a.click('auto-dialogue');a.click('skip-dialogue');a.click('pause');a.events.focus?.();tickAll(t);assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.mode,'paused');
});
test('saved companion dialogue keeps its current line through blur and reload',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await companionDialogue();a.click('auto-dialogue');t.mock.timers.tick(delay(a));assert.equal(progress(a),'2 / 5');a.events.blur();await a.controller.persistRun();
 const b=app(a.values);await b.click('resume-saved');assert.equal(b.controller.screen,'pause-screen');b.events.focus?.();tickAll(t);assert.equal(b.controller.screen,'pause-screen');b.click('resume');assert.equal(progress(b),'2 / 5');
 b.click('auto-dialogue');b.events.blur();tickAll(t);assert.equal(progress(b),'2 / 5');b.events.focus?.();t.mock.timers.tick(delay(b));assert.equal(progress(b),'3 / 5');
});
test('opening remains manual across focus and visibility changes even with AUTO set',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=app(new Map());await a.click('play');a.click('auto-dialogue');a.events.blur();hidden(a,true);a.events.focus?.();hidden(a,false);tickAll(t);assert.equal(progress(a),'1 / 5');assert.equal(a.game.s.mode,'dialogue');
});

test('an already queued AUTO callback rechecks visibility before advancing',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=await companionDialogue();a.click('auto-dialogue');
 // Visibility can change before its event is delivered; the callback itself is guarded.
 a.document.hidden=true;t.mock.timers.tick(delay(a));assert.equal(progress(a),'1 / 5');assert.equal(a.game.s.mode,'dialogue');
 hidden(a,false);t.mock.timers.tick(delay(a));assert.equal(progress(a),'2 / 5');
});
