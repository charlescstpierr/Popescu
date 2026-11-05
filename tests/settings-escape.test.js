import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';
import {captureRun} from '../dist/run-save.js';
import {EVENTS} from '../dist/content.js';
const inputs=['volume','sound-setting','reduced-fx','banter-setting'];
function key(a,target,value='Escape',repeat=false){let prevented=false;a.events.keydown({key:value,target,repeat,preventDefault(){prevented=true;}});return prevented;}
async function settings(){const a=app();await a.click('play');a.click('pause');a.click('settings-open');return a;}
for(const id of inputs)test(`Escape from ${id} closes settings without resuming or changing preferences`,async()=>{
 const a=await settings(),target=a.get(id);target.focus();const before=captureRun(a.game),prefs=JSON.stringify(a.controller.prefs);
 key(a,target);assert.equal(a.controller.screen,'pause-screen');assert.deepEqual(captureRun(a.game),before);assert.equal(JSON.stringify(a.controller.prefs),prefs);assert.equal(a.controller.inputState.keys.length,0);
 for(let i=0;i<3;i++){key(a,target,'Escape',true);key(a,{},'Escape',true);a.controller.frame(performance.now()+1000);assert.equal(a.controller.screen,'pause-screen');assert.deepEqual(captureRun(a.game),before);}
 key(a,{});assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.mode,'playing');
});
test('held Escape in a settings input does not close it without a fresh press',async()=>{
 const a=await settings();key(a,a.get('volume'),'Escape',true);assert.equal(a.controller.screen,'settings');key(a,a.get('volume'));assert.equal(a.controller.screen,'pause-screen');
});
test('arrows, Space, Enter and game shortcuts retain native input behavior in settings',async()=>{
 const a=await settings(),before=captureRun(a.game),prefs=JSON.stringify(a.controller.prefs);
 for(const id of inputs)for(const value of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter','m','w','z','d'])assert.equal(key(a,a.get(id),value),false);
 assert.equal(a.controller.screen,'settings');assert.deepEqual(captureRun(a.game),before);assert.equal(JSON.stringify(a.controller.prefs),prefs);assert.equal(a.controller.inputState.keys.length,0);
});
test('unrelated text fields keep Escape and shortcuts in settings and other screens',async()=>{
 const a=await settings(),field=a.document.createElement('input');field.type='text';
 for(const value of ['Escape','m','w','ArrowRight',' '])assert.equal(key(a,field,value),false);
 assert.equal(a.controller.screen,'settings');a.click('settings-back');key(a,field);assert.equal(a.controller.screen,'pause-screen');
 a.click('resume');key(a,field);assert.equal(a.controller.screen,'hud');for(const value of ['m','w','ArrowRight',' '])key(a,field,value);assert.equal(a.controller.inputState.keys.length,0);
 a.game.startDialogue(EVENTS.companion);const before=captureRun(a.game);key(a,field);key(a,field,'Enter');key(a,field,' ');assert.deepEqual(captureRun(a.game),before);assert.equal(a.controller.screen,'dialogue');
});
test('stale settings input targets cannot pause or skip other screens',async()=>{
 const a=await settings();a.click('settings-back');a.click('resume');key(a,a.get('volume'));assert.equal(a.controller.screen,'hud');
 a.game.startDialogue(EVENTS.companion);const before=captureRun(a.game);for(const id of inputs)key(a,a.get(id));assert.deepEqual(captureRun(a.game),before);assert.equal(a.controller.screen,'dialogue');
});
