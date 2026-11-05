import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';
import {beginTutorial} from '../dist/opening.js';
import {EVENTS} from '../dist/content.js';
import {captureRun} from '../dist/run-save.js';

const buttons=['pause','battle-sound','opening-help-skip','banter-close'];
function key(a,type,target,value=' ',repeat=false){
 let prevented=false;
 a.events[type]({key:value,target,repeat,preventDefault(){prevented=true;}});
 return prevented;
}
async function playing(){const a=app();await a.click('play');beginTutorial(a.game);a.controller.updateHud(true);return a;}
function targetFor(a,id,child=false){const button=a.get(id);button.focus();if(!child)return button;const target=a.document.createElement('span');button.append(target);return target;}
function assertAction(a,id){
 if(id==='pause'){assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.mode,'paused');}
 if(id==='battle-sound'){assert.equal(a.controller.prefs.sound,false);assert.equal(a.get(id).getAttribute('aria-pressed'),'false');}
 if(id==='opening-help-skip'){assert.equal(a.game.s.opening.phase,'done');assert.equal(a.get('opening-help').classList.contains('hidden'),true);}
 if(id==='banter-close')assert.equal(a.get('banter').classList.contains('hidden'),true);
}
// The adapter delivers the browser's default click only after allowed key events.
// This checks the controller boundary and real click handlers, not browser internals.
function releaseSpace(a,target,initialPrevented=false){const prevented=key(a,'keyup',target);if(!initialPrevented&&!prevented){const button=target.closest('button');button?.onclick?.({detail:0});button?.dispatch('click',{detail:0});}return prevented;}

for(const id of buttons)for(const child of [false,true])test(`Space retains native ${id} activation from ${child?'child':'button'}`,async()=>{
 const a=await playing(),target=targetFor(a,id,child),before=captureRun(a.game);
 const prevented=key(a,'keydown',target);assert.equal(prevented,false);assert.deepEqual(captureRun(a.game),before);assert.equal(a.controller.prefs.sound,true);assert.equal(a.get('banter').classList.contains('hidden'),false);
 assert.equal(releaseSpace(a,target,prevented),false);assertAction(a,id);
});
for(const id of buttons)test(`held Space activates ${id} once on release, without repeated side effects`,async()=>{
 const a=await playing(),target=targetFor(a,id),before=captureRun(a.game),prevented=key(a,'keydown',target);
 assert.equal(prevented,false);for(let i=0;i<5;i++)assert.equal(key(a,'keydown',target,' ',true),true);
 assert.deepEqual(captureRun(a.game),before);assert.equal(a.controller.prefs.sound,true);
 assert.equal(releaseSpace(a,target,prevented),false);assertAction(a,id);
});
for(const id of buttons)test(`Enter keeps native ${id} activation and rejects repeat after its transition`,async()=>{
 const a=await playing(),target=targetFor(a,id,true);
 assert.equal(key(a,'keydown',target,'Enter'),false);target.closest('button').onclick({detail:0});assertAction(a,id);
 for(let i=0;i<3;i++)assert.equal(key(a,'keydown',a.get(id==='pause'?'resume':id),'Enter',true),true);
 assertAction(a,id);assert.equal(key(a,'keyup',target,'Enter'),false);
});
for(const transition of ['pause','pause-return','dialogue','dialogue-return','trophies','blur-focus','hidden-visible','pagehide'])for(const child of [false,true])test(`Space release cannot activate a ${child?'button child':'button'} after ${transition}`,async()=>{
 const a=await playing(),target=targetFor(a,'battle-sound',child);assert.equal(key(a,'keydown',target),false);
 if(transition.startsWith('pause')){a.click('pause');if(transition==='pause-return')a.click('resume');}
 if(transition.startsWith('dialogue')){a.game.startDialogue(EVENTS.companion);if(transition==='dialogue-return')a.click('skip-dialogue');}
 if(transition==='trophies'){a.game.s.xpNeed=1000;const boss=a.game.spawnEnemy('pelican',a.game.s.x,a.game.s.y);a.game.hurt(boss,boss.hp+1);a.game.updateChests(0);a.game.openTrophy();assert.equal(a.controller.screen,'trophies');}
 if(transition==='blur-focus'){a.events.blur();a.events.focus();}
 if(transition==='hidden-visible'){a.document.hidden=true;a.documentEvents.visibilitychange();a.document.hidden=false;a.documentEvents.visibilitychange();}
 if(transition==='pagehide')a.events.pagehide();
 const button=a.controller.screen==='dialogue'?a.get('next-dialogue'):a.controller.screen==='trophies'?a.get('trophy-options').children[0]:a.controller.screen==='pause-screen'?a.get('resume'):a.get('battle-sound');
 button.focus();const destination=child?a.document.createElement('span'):button;if(child)button.append(destination);const before=captureRun(a.game),screen=a.controller.screen;
 for(let i=0;i<3;i++)assert.equal(key(a,'keydown',destination,' ',true),true);
 assert.equal(releaseSpace(a,destination),true);assert.deepEqual(captureRun(a.game),before);assert.equal(a.controller.screen,screen);assert.equal(a.controller.prefs.sound,true);
});
test('changing the focused HUD button cancels the earlier Space release',async()=>{
 const a=await playing();key(a,'keydown',targetFor(a,'battle-sound'));const target=targetFor(a,'pause');assert.equal(releaseSpace(a,target),true);assert.equal(a.controller.screen,'hud');assert.equal(a.controller.prefs.sound,true);
});
test('a fresh Space after interruption works even when the original keyup was lost',async()=>{
 const a=await playing(),target=targetFor(a,'battle-sound');key(a,'keydown',target);a.events.blur();a.events.focus();a.click('resume');
 assert.equal(key(a,'keydown',target),false);assert.equal(releaseSpace(a,target),false);assert.equal(a.controller.prefs.sound,false);
});
test('Space outside a HUD button blocks page scrolling without pausing or advancing the game',async()=>{
 const a=await playing(),before=captureRun(a.game);for(const target of [a.get('world'),a.get('time'),a.document.createElement('div')]){assert.equal(key(a,'keydown',target),true);assert.equal(key(a,'keydown',target,' ',true),true);key(a,'keyup',target);}
 assert.equal(a.controller.screen,'hud');assert.deepEqual(captureRun(a.game),before);
});
test('arrows, movement, M and Escape retain their keyboard behavior around Space',async()=>{
 const a=await playing();assert.equal(key(a,'keydown',a.get('world'),'ArrowRight'),true);assert.ok(a.controller.inputState.keys.includes('arrowright'));key(a,'keyup',a.get('world'),'ArrowRight');assert.equal(a.controller.inputState.keys.length,0);
 key(a,'keydown',a.get('world'),'d');assert.ok(a.controller.inputState.keys.includes('d'));key(a,'keyup',a.get('world'),'d');key(a,'keydown',a.get('world'),'m');assert.equal(a.controller.prefs.sound,false);key(a,'keydown',a.get('world'),'m',true);assert.equal(a.controller.prefs.sound,false);
 key(a,'keydown',a.get('world'),'Escape');assert.equal(a.controller.screen,'pause-screen');key(a,'keydown',a.get('resume'),'Escape',true);assert.equal(a.controller.screen,'pause-screen');key(a,'keydown',a.get('resume'),'Escape');assert.equal(a.controller.screen,'hud');
});
test('Space exemption does not change settings inputs or the native dialogue reading region',async()=>{
 const a=await playing();a.click('pause');a.click('settings-open');for(const id of ['volume','sound-setting','reduced-fx','banter-setting'])assert.equal(key(a,'keydown',a.get(id)),false);
 key(a,'keydown',a.get('volume'),'Escape');assert.equal(a.controller.screen,'pause-screen');a.click('resume');a.game.startDialogue(EVENTS.companion);const before=captureRun(a.game);assert.equal(key(a,'keydown',a.get('dialogue-text')),false);assert.equal(key(a,'keyup',a.get('dialogue-text')),false);assert.deepEqual(captureRun(a.game),before);
});
test('touch buttons remain excluded from the joystick and touch movement still releases on pause',async()=>{
 const a=await playing(),surface=a.get('app'),pointer={pointerId:9,clientX:65,clientY:650,target:targetFor(a,'pause',true),preventDefault(){}};
 surface.dispatch('pointerdown',pointer);assert.equal(a.controller.inputState.pointer,null);pointer.target=a.get('world');surface.dispatch('pointerdown',pointer);surface.dispatch('pointermove',{...pointer,clientX:95});assert.equal(a.controller.inputState.pointer,9);assert.ok(a.controller.inputState.input.x>0);
 a.click('pause');assert.equal(a.controller.inputState.pointer,null);assert.equal(surface.captured,null);assert.equal(a.controller.screen,'pause-screen');a.click('resume');surface.dispatch('pointermove',{...pointer,clientX:110});assert.equal(a.controller.inputState.pointer,null);
});
test('Space pause and resume preserve the saved run, totals and explicit recovery pause',async()=>{
 const a=await playing();a.game.s.kills=7;const id=a.controller.runId,target=targetFor(a,'pause');const prevented=key(a,'keydown',target);releaseSpace(a,target,prevented);assert.equal(a.controller.screen,'pause-screen');assert.equal((await a.controller.persistRun()).ok,true);
 const b=app(a.values);await b.click('resume-saved');assert.equal(b.controller.screen,'pause-screen');assert.equal(b.controller.runId,id);assert.equal(b.game.s.kills,7);assert.equal(b.saved().lifetime,0);
 const resume=targetFor(b,'resume');assert.equal(key(b,'keydown',resume),false);assert.equal(releaseSpace(b,resume),false);assert.equal(b.controller.screen,'hud');assert.equal(b.game.s.kills,7);assert.equal((await b.controller.persistRun()).ok,true);assert.equal(b.saved().lifetime,0);
});
test('Space tutorial skip and sound preference survive reload without changing save schema',async()=>{
 const a=await playing();for(const id of ['opening-help-skip','battle-sound']){const target=targetFor(a,id);releaseSpace(a,target,key(a,'keydown',target));}assert.equal((await a.controller.persistRun()).ok,true);
 const b=app(a.values);await b.click('resume-saved');assert.equal(b.game.s.opening.phase,'done');assert.equal(b.controller.prefs.sound,false);assert.equal(b.get('battle-sound').getAttribute('aria-pressed'),'false');
});
