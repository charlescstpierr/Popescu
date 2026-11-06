import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';
import {captureRun} from '../dist/run-save.js';

// Real controller, engine and RunStore; only browser surfaces, locks and storage are doubled.
const KEY='toma-popescu-run-v1';
const raw=a=>a.values.get(KEY);
const record=a=>JSON.parse(raw(a));
const visible=(a,id)=>!a.get(id).classList.contains('hidden');
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const key=(a,key,shiftKey=false)=>{let prevented=false;a.events.keydown({key,shiftKey,target:a.controller.activeElement||{},preventDefault(){prevented=true;}});return prevented;};
function failWrites(a){const set=a.values.set.bind(a.values);a.values.set=(k,v)=>{if(k===KEY)throw Error('quota');return set(k,v);};return ()=>{a.values.set=set;};}
async function paused(){const a=app();await a.click('play');Object.assign(a.game.s,{elapsed:7,kills:7,coins:3});assert.equal((await a.controller.persistRun(true)).ok,true);Object.assign(a.game.s,{elapsed:12,kills:12,coins:5});a.click('pause');return a;}
async function failed(){const a=await paused(),restore=failWrites(a),current=a.game,before=raw(a);await a.click('pause-menu');return {a,restore,current,before};}
function assertChoice(a,current,before){assert.equal(a.controller.screen,'save-exit');assert.equal(a.game,current);assert.equal(a.game.s.mode,'paused');assert.equal(raw(a),before);}

test('successful pause exit saves the exact checkpoint and credits gains once',async()=>{
 const a=await paused(),snapshot=captureRun(a.game);await a.click('pause-menu');assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);assert.deepEqual(record(a).run.snapshot,snapshot);assert.deepEqual(a.saved(),{best:12,lifetime:12,coins:5});
 await a.click('resume-saved');assert.deepEqual(captureRun(a.game),snapshot);await a.click('pause-menu');assert.deepEqual(a.saved(),{best:12,lifetime:12,coins:5});
});

test('failed exit and repeated failed retries preserve the same paused session and old bytes',async()=>{
 const a=await paused(),current=a.game,snapshot=captureRun(current),before=raw(a),restore=failWrites(a);await a.click('pause-menu');assertChoice(a,current,before);assert.deepEqual(captureRun(current),snapshot);assert.equal(a.controller.activeElement,a.get('save-exit-stay'));
 for(let i=0;i<2;i++){await a.click('save-exit-retry');assertChoice(a,current,before);assert.deepEqual(captureRun(current),snapshot);}
 restore();await a.click('save-exit-retry');assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);assert.deepEqual(record(a).run.snapshot,snapshot);assert.deepEqual(a.saved(),{best:12,lifetime:12,coins:5});await a.click('resume-saved');assert.deepEqual(captureRun(a.game),snapshot);assert.equal((await a.controller.persistRun(true)).ok,true);assert.deepEqual(a.saved(),{best:12,lifetime:12,coins:5});
});

for(const action of ['stay','Escape'])test(`${action} returns to pause without resuming and restores Menu focus`,async()=>{
 const {a,current,before}=await failed();assertChoice(a,current,before);const snapshot=captureRun(current);if(action==='stay')a.click('save-exit-stay');else key(a,'Escape');assert.equal(a.controller.screen,'pause-screen');assert.equal(a.controller.activeElement,a.get('pause-menu'));assert.deepEqual(captureRun(a.game),snapshot);assert.equal(raw(a),before);
});

test('only explicit discard abandons memory and leaves the old checkpoint recoverable',async()=>{
 const {a,restore,current,before}=await failed();assertChoice(a,current,before);await a.click('pause-menu');assertChoice(a,current,before);a.click('save-exit-discard');assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);assert.equal(raw(a),before);restore();await a.click('resume-saved');assert.equal(a.game.s.elapsed,7);assert.equal(a.game.s.kills,7);assert.equal(a.game.s.coins,3);
});

test('save exit traps Tab and Shift-Tab among the visible choices',async()=>{
 const {a}=await failed();assert.equal(a.controller.screen,'save-exit');assert.equal(a.controller.activeElement,a.get('save-exit-stay'));
 for(const [back,expected] of [[false,'save-exit-discard'],[false,'save-exit-retry'],[true,'save-exit-discard'],[true,'save-exit-stay']]){assert.equal(key(a,'Tab',back),true);assert.equal(a.controller.activeElement,a.get(expected));}
});

for(const outcome of ['success','failure'])test(`delayed ${outcome} exit blocks duplicate clicks, resume, Escape and restart`,async()=>{
 const a=await paused(),current=a.game,before=raw(a),revision=record(a).revision;if(outcome==='failure')failWrites(a);const release=a.holdLock(),pending=a.click('pause-menu');let duplicate,restart;
 try{await tick();duplicate=a.click('pause-menu');a.click('resume');key(a,'Escape');restart=a.click('restart');await tick();assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game,current);assert.equal(a.game.s.mode,'paused');assert.equal(raw(a),before);}finally{release();await pending;await duplicate;await restart;}
 if(outcome==='failure')assertChoice(a,current,before);else{assert.equal(a.controller.screen,'menu');assert.equal(record(a).revision,revision+1);assert.deepEqual(a.saved(),{best:12,lifetime:12,coins:5});}
});

for(const outcome of ['success','failure'])for(const back of [false,true])test(`newer settings navigation${back?' and return':''} survives delayed ${outcome} exit`,async()=>{
 const a=await paused(),current=a.game;if(outcome==='failure')failWrites(a);const release=a.holdLock(),pending=a.click('pause-menu');try{await tick();a.click('settings-open');if(back)a.click('settings-back');}finally{release();await pending;}
 assert.equal(a.controller.screen,back?'pause-screen':'settings');assert.equal(a.game,current);assert.equal(a.game.s.mode,'paused');a.click('settings-back');a.click('resume');assert.equal(a.controller.screen,'hud','obsolete operation must release its transition gate');
});

test('Escape during a pending retry cancels navigation even if its write succeeds',async()=>{
 const {a,restore,current}=await failed();assert.equal(a.controller.screen,'save-exit');restore();const release=a.holdLock(),pending=a.click('save-exit-retry');try{await tick();key(a,'Escape');assert.equal(a.controller.screen,'pause-screen');assert.equal(a.controller.activeElement,a.get('pause-menu'));}finally{release();await pending;}
 assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game,current);assert.equal(a.game.s.mode,'paused');assert.deepEqual(a.saved(),{best:12,lifetime:12,coins:5});a.click('resume');assert.equal(a.controller.screen,'hud');
});

for(const prior of [false,true])test(`conflict ${prior?'already detected':'during exit'} cannot silently discard or rearm writes`,async()=>{
 const a=await paused(),current=a.game,b=app(a.values);await b.click('resume-saved');b.game.s.elapsed=22;assert.equal((await b.controller.persistRun(true)).ok,true);const before=raw(a);
 if(prior)assert.equal((await a.controller.persistRun()).reason,'conflict');await a.click('pause-menu');assertChoice(a,current,before);assert.equal(visible(a,'save-exit-retry'),false);assert.match(a.get('save-exit-title').textContent+' '+a.get('save-exit-status').textContent+' '+a.get('save-exit-details').textContent,/onglet|fenêtre/i);
 assert.equal(a.controller.activeElement,a.get('save-exit-stay'));key(a,'Tab',true);assert.equal(a.controller.activeElement,a.get('save-exit-discard'));key(a,'Tab',true);assert.equal(a.controller.activeElement,a.get('save-exit-stay'));
 await a.click('save-exit-retry');await a.click('pause-menu');assertChoice(a,current,before);a.click('save-exit-stay');await a.click('pause-menu');assertChoice(a,current,before);a.click('save-exit-discard');assert.equal(a.controller.screen,'menu');assert.equal(raw(a),before);await a.click('resume-saved');assert.equal(a.game.s.elapsed,22);
});

test('voluntarily nonpersistent play exits normally without touching saved bytes',async()=>{
 const a=app(),restore=failWrites(a);a.confirm(true);await a.click('play');assert.ok(a.game);const before=raw(a);a.click('pause');await a.click('pause-menu');assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);assert.equal(raw(a),before);restore();
});

test('failed results exit keeps its existing menu contract and credited totals',async()=>{
 const a=await paused();Object.assign(a.game.s,{mode:'victory',elapsed:1200});await a.controller.renderResult(true);const totals=a.saved();failWrites(a);await a.click('result-menu');assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);assert.deepEqual(a.saved(),totals);
});

test('hidden or stale pause and save-exit handlers cannot abandon or resume a session',async()=>{
 const a=await paused();a.click('resume');const current=a.game,before=raw(a);for(const id of ['pause-menu','save-exit-discard','save-exit-retry','save-exit-stay']){await a.click(id);assert.equal(a.controller.screen,'hud',id);assert.equal(a.game,current);assert.equal(raw(a),before);}
 a.click('pause');failWrites(a);await a.click('pause-menu');assert.equal(a.controller.screen,'save-exit');for(const id of ['resume','restart','play','retry','resume-saved','result-menu','endless']){await a.click(id);assert.equal(a.controller.screen,'save-exit',id);assert.equal(a.game,current);assert.equal(a.game.s.mode,'paused');}
 a.click('save-exit-stay');await a.click('save-exit-discard');await a.click('save-exit-retry');assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game,current);
});

test('active Charles epilogue is preserved exactly on failed pause exit',async()=>{
 const a=app();await a.click('play');Object.assign(a.game.s,{mode:'victory',elapsed:1200});await a.controller.renderResult(true);a.click('meet-charles');a.click('charles-start');a.click('pause');const current=a.game,snapshot=captureRun(current),before=raw(a);failWrites(a);await a.click('pause-menu');assertChoice(a,current,before);assert.deepEqual(captureRun(a.game),snapshot);
});

test('a transient lock failure offers a real retry without abandoning the paused run',async()=>{
 let broken=false;const locks={request(_name,fn){return broken?Promise.reject(Error('lock unavailable')):Promise.resolve().then(fn);}};
 const a=app(undefined,locks);await a.click('play');a.game.s.elapsed=9;a.click('pause');const before=raw(a),current=a.game;broken=true;await a.click('pause-menu');assertChoice(a,current,before);assert.equal(visible(a,'save-exit-retry'),true);broken=false;await a.click('save-exit-retry');assert.equal(a.controller.screen,'menu');assert.equal(record(a).run.snapshot.game.s.elapsed,9);
});

test('a pending retry rejects repeated retry, discard and hidden session controls',async()=>{
 const {a,restore,current}=await failed();assert.equal(a.controller.screen,'save-exit');restore();const revision=record(a).revision,release=a.holdLock(),pending=a.click('save-exit-retry');const others=[];
 try{await tick();for(const id of ['save-exit-retry','save-exit-discard','resume','restart','pause-menu'])others.push(a.click(id));await tick();assert.equal(a.controller.screen,'save-exit');assert.equal(a.game,current);assert.equal(a.game.s.mode,'paused');}finally{release();await pending;await Promise.all(others);}
 assert.equal(a.controller.screen,'menu');assert.equal(record(a).revision,revision+1);assert.deepEqual(a.saved(),{best:12,lifetime:12,coins:5});
});

for(const unavailable of [false,true])test(`discard after conflict never advertises ${unavailable?'unavailable':'finished'} save as resumable`,async()=>{
 const a=await paused(),b=app(a.values);await b.click('resume-saved');Object.assign(b.game.s,{mode:'gameover',hp:0});assert.equal((await b.controller.persistRun(true)).ok,true);await a.click('pause-menu');assert.equal(a.controller.screen,'save-exit');if(unavailable)a.values.delete(KEY);const before=raw(a);a.click('save-exit-discard');assert.equal(a.controller.screen,'menu');assert.equal(visible(a,'saved-run'),false);assert.equal(raw(a),before);
});

for(const mode of ['upgrade','dialogue','trophy'])test(`recovered ${mode} checkpoint survives failed exit and resumes its pending choice`,async()=>{
 const source=app();await source.click('play');
 if(mode==='upgrade')source.game.gainXP(8);
 if(mode==='dialogue')source.game.startDialogue([{who:'TOMA',text:'Cette phrase doit rester disponible.'}]);
 if(mode==='trophy'){source.game.s.xpNeed=1000;const boss=source.game.spawnEnemy('pelican',source.game.s.x,source.game.s.y);source.game.hurt(boss,boss.hp+1);source.game.updateChests(0);source.game.openTrophy();}
 assert.equal(source.game.s.mode,mode,'fixture enters the real engine modal');assert.equal((await source.controller.persistRun()).ok,true);
 const a=app(source.values);await a.click('resume-saved');assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.mode,mode);const current=a.game,before=raw(a),state=JSON.stringify(current.s),restore=failWrites(a);
 await a.click('pause-menu');assert.equal(a.controller.screen,'save-exit');assert.equal(a.game,current);assert.equal(JSON.stringify(current.s),state);assert.equal(raw(a),before);a.click('save-exit-stay');assert.equal(a.controller.screen,'pause-screen');assert.equal(a.controller.activeElement,a.get('pause-menu'));a.click('resume');assert.equal(a.controller.screen,{upgrade:'upgrades',dialogue:'dialogue',trophy:'trophies'}[mode]);assert.equal(a.game.s.mode,mode);assert.equal(JSON.stringify(current.s),state);restore();
});

for(const event of ['visibilitychange','pagehide'])test(`discard prevents a lifecycle ${event} save queued from the failure screen`,async()=>{
 const {a,restore,before}=await failed();assert.equal(a.controller.screen,'save-exit');restore();const release=a.holdLock();
 try{
  if(event==='visibilitychange'){a.document.hidden=true;a.documentEvents.visibilitychange();a.document.hidden=false;}else a.events.pagehide();
  await tick();a.click('save-exit-discard');assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);
 }finally{release();await tick();}
 assert.equal(raw(a),before,'discard must not allow a queued background write to replace the old checkpoint');assert.equal(record(a).run.snapshot.game.s.elapsed,7);
 await a.click('resume-saved');assert.equal(a.game.s.elapsed,7);
});

test('discard invalidates a lifecycle checkpoint already queued from pause before the failure screen',async()=>{
 const a=await paused(),before=raw(a),restore=failWrites(a),pending=a.click('pause-menu');
 // The exit checkpoint is first in the real queue. It fails; the following
 // lifecycle checkpoint waits behind a second lock until after discard.
 const release=a.holdLock();a.document.hidden=true;a.documentEvents.visibilitychange();a.document.hidden=false;
 try{await pending;assert.equal(a.controller.screen,'save-exit');restore();a.click('save-exit-discard');assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);}finally{release();await tick();}
 assert.equal(raw(a),before,'a checkpoint captured before the failure screen must not commit after its session is abandoned');assert.equal(record(a).run.snapshot.game.s.elapsed,7);
 await a.click('resume-saved');assert.equal(a.game.s.elapsed,7);
});
