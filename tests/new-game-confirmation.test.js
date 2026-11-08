import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/asset-controller.js';

const key='toma-popescu-run-v1';
const record=a=>JSON.parse(a.values.get(key));
const keypress=(a,key,shiftKey=false)=>a.events.keydown({key,shiftKey,repeat:false,target:{},preventDefault(){}});
async function exited(){
 const a=app(undefined,undefined,undefined,undefined,{manualStartConfirmation:true});
 await a.click('play');Object.assign(a.game.s,{elapsed:60,kills:7,coins:4});a.click('pause');await a.click('pause-menu');return a;
}

test('after playing and quitting, new game asks in the game and cancel preserves the save',async()=>{
 const a=await exited(),before=a.values.get(key);
 await a.click('play');assert.equal(a.controller.screen,'new-run-confirm');assert.equal(a.game,null);
 assert.equal(a.values.get(key),before);assert.equal(a.controller.activeElement,a.get('new-run-cancel'));
 assert.equal(a.get('menu').inert,true);keypress(a,'Tab');assert.equal(a.controller.activeElement,a.get('new-run-start'));
 keypress(a,'Tab',true);assert.equal(a.controller.activeElement,a.get('new-run-cancel'));
 keypress(a,'Escape');assert.equal(a.controller.screen,'menu');assert.equal(a.values.get(key),before);assert.equal(a.controller.activeElement,a.get('play'));
 await a.click('play');a.click('new-run-cancel');assert.equal(a.controller.screen,'menu');assert.equal(a.values.get(key),before);
});

test('confirming a new game after quitting resets the run once and keeps records and selected difficulty',async()=>{
 const a=await exited(),before=record(a);a.controller.setDifficulty('hard');
 await a.click('play');assert.equal(a.controller.screen,'new-run-confirm');
 a.events.blur();a.events.focus();
 const pending=a.click('new-run-start');await a.click('new-run-start');await pending;
 assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.elapsed,0);assert.equal(a.game.s.difficulty,'hard');
 assert.notEqual(record(a).run.id,before.run.id);assert.equal(record(a).revision,before.revision+1);
 assert.deepEqual(record(a).totals,{best:60,lifetime:7,coins:4});
});

test('pause restart cancellation restores the paused game and keyboard focus',async()=>{
 const a=app(undefined,undefined,undefined,undefined,{manualStartConfirmation:true});await a.click('play');a.game.s.elapsed=12;a.click('pause');
 const old=a.game,before=a.values.get(key);await a.click('restart');assert.equal(a.controller.screen,'new-run-confirm');
 keypress(a,'Escape');assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game,old);assert.equal(a.game.s.elapsed,12);
 assert.equal(a.values.get(key),before);assert.equal(a.controller.activeElement,a.get('restart'));
});

test('a blocked native confirmation cannot block the in-game replacement choice',async()=>{
 const a=await exited();a.confirm(false);await a.click('play');
 assert.equal(a.controller.screen,'new-run-confirm');await a.click('new-run-start');
 assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.elapsed,0);
});

test('a dismissed replacement choice cannot be accepted later from another screen',async()=>{
 const a=await exited(),before=a.values.get(key);await a.click('play');a.click('new-run-cancel');a.click('credits-open');
 await a.click('new-run-start');assert.equal(a.controller.screen,'credits');assert.equal(a.values.get(key),before);
});
