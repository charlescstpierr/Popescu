import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {EVENTS} from '../dist/content.js';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {CHARLES_LINES,CHARLES} from '../dist/charles.js';
import {PELICAN_BANTER,PELICAN_BANTER_LEGACY_REPLIES} from '../dist/pelican.js';
import {TRAVESTIA_BANTER,TRAVESTIA_BANTER_LEGACY_REPLIES} from '../dist/travestia.js';

function run(type='pelican',enabled=true){
 const events=[],g=new Game({seed:43,onEvent:(type,payload)=>events.push({type,payload})});
 g.setPausedEncountersEnabled(enabled);g.world.collides=()=>false;
 for(const key of Object.keys(g.timers))if(key!=='animalIndex')g.timers[key]=1000;
 g.nextEvent=1000;g.s.shotClock=1000;const e=g.spawnEnemy(type,100,0);e.cooldown=0;return {g,e,events};
}
function charles(index=0){const g=new Game({seed:72});g.setPausedEncountersEnabled(true);g.s.elapsed=1200;g.s.mode='victory';g.startCharlesEpilogue();g.s.charles.dialogueIndex=index;return g;}
function snapshot(g){return captureRun(g);}
function pendingTrophy(g,type='travestia'){const bossId=g.id++,chestId=g.id++;g.s.chests.push({id:chestId,x:500,y:500,open:true,openedAt:g.s.elapsed,bossType:type,bossId});g.s.trophies.pending.push({bossType:type,chestId,bossId});}

for(const type of ['pelican','travestia'])test(`${type}: first exchange opens only after full step, freezes every simulation field, and keeps explicit actor on both speakers`,()=>{
 const {g,e,events}=run(type);g.updateEnemies(.01);assert.equal(g.s.mode,'playing');assert.equal(g.encounters.queue.length,1);
 g.update(.01,{x:1,y:0});assert.equal(g.s.mode,'dialogue');const active=g.encounters.active;
 assert.equal(active.id,`boss:${type}`);assert.equal(active.actorId,e.id);assert.equal(active.actorType,type);assert.equal(active.index,0);
 assert.deepEqual(active.lines.map(l=>l.text),type==='pelican'?PELICAN_BANTER[0]:TRAVESTIA_BANTER[0]);
 assert.equal(e[type==='pelican'?'peliReplyPending':'tailReplyPending'],false);
 const before=snapshot(g);for(let i=0;i<100;i++)g.update(.25,{x:1,y:1});assert.deepEqual(snapshot(g),before);
 assert.equal(g.advanceEncounterDialogue(active.id,0),true);assert.equal(g.advanceEncounterDialogue(active.id,0),false);assert.equal(g.encounters.active.index,1);
 assert.equal(g.dialoguePresentation().actorId,e.id);assert.equal(g.dialoguePresentation().actorType,type);assert.equal(g.dialoguePresentation().who,'TOMA');
 assert.equal(events.filter(e=>e.type==='dialogue').length,1);
});
for(const type of ['pelican','travestia'])test(`${type}: each speaker and queued state save and restore exactly without replay`,()=>{
 const {g,e}=run(type);g.updateEnemies(.01);let b=restoreRun(snapshot(g));assert.deepEqual(snapshot(b),snapshot(g));
 b.setPausedEncountersEnabled(true);b.openEncounterDialogue();assert.equal(b.s.mode,'dialogue');
 for(let index=0;index<2;index++){
  const saved=snapshot(b),restored=restoreRun(saved);assert.equal(saved.version,15);assert.deepEqual(snapshot(restored),saved);
  assert.equal(restored.pausedEncountersEnabled,false,'entry capability does not silently dismiss a saved modal');restored.update(.25);assert.deepEqual(snapshot(restored),saved);
  assert.equal(restored.advanceEncounterDialogue(`boss:${type}`,index),true);b=restored;
 }
 assert.equal(b.encounters.outcomes[`boss:${type}`],'completed');assert.equal(b.s.mode,'playing');
 assert.equal(b.finishDialogue(),false);assert.equal(b.encounters.outcomes[`boss:${type}`],'completed');
 b.setPausedEncountersEnabled(true);const actor=b.s.enemies.find(x=>x.id===e.id);actor.cooldown=0;actor[type==='pelican'?'peliTime':'tailTime']=0;actor[type==='pelican'?'peliTauntAt':'tailTauntAt']=0; b.speechUntil=0;b.updateEnemies(.01);
 assert.equal(b.encounters.queue.length,0);assert.equal(b.encounters.active,null);
});
test('capability and optional banter gate new scenes; compact urgent warnings remain available',()=>{
 for(const toggle of ['capability','banter']){const {g,events}=run('pelican',toggle!=='capability');if(toggle==='banter')g.setBanterEnabled(false);g.update(.01);assert.equal(g.s.mode,'playing');assert.equal(g.encounters.queue.length,0);g.urgentSpeech('TOMA','Attention !');assert.ok(events.some(e=>e.type==='bark'&&e.payload.text==='Attention !'));}
});
test('queued scene cannot overwrite upgrade, trophy, death, victory or an obsolete actor',()=>{
 for(const mode of ['upgrade','trophy','gameover','victory']){const {g}=run();g.updateEnemies(.01);g.s.mode=mode;assert.equal(g.openEncounterDialogue(),false);assert.equal(g.s.mode,mode);}
 for(const change of [e=>e.dead=true,e=>e.charmed=3,e=>e.phase='peli_hug']){const {g,e}=run();g.updateEnemies(.01);change(e);assert.equal(g.openEncounterDialogue(),false);assert.equal(g.s.mode,'playing');}
 const {g,e}=run();g.updateEnemies(.01);g.s.enemies=[];g.openEncounterDialogue();assert.equal(g.encounters.queue.length,0);assert.equal(g.encounters.outcomes['boss:pelican'],'obsolete');
});
test('pending reward priority remains intact before and after a scene',()=>{
 const {g}=run();g.updateEnemies(.01);g.gainXP(8);assert.equal(g.openEncounterDialogue(),false);g.chooseUpgrade(g.s.options[0].id);g.openEncounterDialogue();assert.equal(g.s.mode,'dialogue');
 g.s.options=g.rollUpgradeOptions();g.finishDialogue(true);assert.equal(g.s.mode,'upgrade');assert.equal(g.encounters.outcomes['boss:pelican'],'skipped');assert.equal(g.finishDialogue(),false);
 const b=run().g;b.updateEnemies(.01);pendingTrophy(b);assert.deepEqual(captureRun(restoreRun(captureRun(b))),captureRun(b));assert.equal(b.openEncounterDialogue(),false);b.openTrophy();assert.equal(b.s.mode,'trophy');
});
test('Charles pauses ordered two-line beats only in safe phases and leaves survival clock unchanged',()=>{
 const g=charles();g.update(.01);assert.equal(g.s.mode,'dialogue');assert.deepEqual(g.encounters.active.lines,CHARLES_LINES.slice(0,2));assert.equal(g.s.elapsed,1200);
 const first=snapshot(g);g.update(10);assert.deepEqual(snapshot(g),first);g.advanceEncounterDialogue('charles:0',0);assert.equal(g.dialoguePresentation().actorType,'charles');
 g.advanceEncounterDialogue('charles:0',1);assert.equal(g.s.mode,'playing');assert.equal(g.s.charles.dialogueIndex,2);g.s.charles.nextDialogue=0;
 g.s.charles.phase='hover';g.s.charles.phaseTime=.001;g.s.charles.phaseDuration=CHARLES.phases.hover;g.update(.01);
 assert.equal(g.s.charles.phase,'shock_warning');assert.equal(g.s.mode,'playing');assert.equal(g.encounters.queue.length,1);
 g.s.charles.phase='recover';g.s.charles.phaseTime=1;g.s.charles.phaseDuration=CHARLES.phases.recover;assert.equal(g.openEncounterDialogue(),true);assert.deepEqual(g.encounters.active.lines,CHARLES_LINES.slice(2,4));assert.equal(g.s.elapsed,1200);
});
test('Charles odd legacy cursor never repeats the preceding line; dormant survival rewards remain dormant',()=>{
 const g=charles(1);g.s.options=g.rollUpgradeOptions();pendingTrophy(g,'pelican');g.update(.01);assert.deepEqual(g.encounters.active.lines,[CHARLES_LINES[1]]);assert.deepEqual(captureRun(restoreRun(captureRun(g))),captureRun(g));g.finishDialogue(true);assert.equal(g.s.mode,'playing');assert.equal(g.s.options.length,3);assert.equal(g.s.trophies.pending.length,1);assert.equal(g.s.elapsed,1200);
});
test('v13 migration preserves every prior gameplay field and exact pending legacy replies',()=>{
 for(const type of ['pelican','travestia']){
  const {g,e}=run(type,false);g.updateEnemies(.01);e[type==='pelican'?'peliReply':'tailReply']=(type==='pelican'?PELICAN_BANTER_LEGACY_REPLIES:TRAVESTIA_BANTER_LEGACY_REPLIES)[0];
  const old=snapshot(g);old.version=13;delete old.game?.timers?.ego;delete old.game?.timers?.egoIndex;delete old.game.encounters;const restored=restoreRun(old),next=snapshot(restored);delete next.game.encounters;next.version=13;delete next.game.timers.ego;delete next.game.timers.egoIndex;assert.deepEqual(next,old);
  restored.setPausedEncountersEnabled(true);assert.deepEqual(restored.encounters.legacyActorIds,[e.id]);assert.equal(restored.encounters.queue.length,0);
 }
});
test('active context, cursor, queue bound and content are validated at the save boundary',()=>{
 const {g}=run();g.update(.01);const source=snapshot(g);
 for(const mutate of [x=>x.game.encounters.active.actorId=999,x=>x.game.encounters.active.actorType='charles',x=>x.game.encounters.active.index=2,x=>x.game.encounters.active.lines[0].text='forged',x=>x.game.encounters.queue=Array(7).fill(x.game.encounters.active),x=>x.dialogue.index=1,x=>x.game.encounters.outcomes['boss:pelican']='completed']){
  const forged=structuredClone(source);mutate(forged);assert.throws(()=>restoreRun(forged));
 }
});
test('presentation derives all five existing companion portraits from current progression',()=>{
 const g=new Game();for(let rank=1;rank<=5;rank++){g.s.upg.girlfriend=rank;const context=g.dialoguePresentation({who:'BLONDE IA',text:'Existing dialogue'});assert.equal(context.companionRank,rank);assert.equal(context.portrait,`assets/companion-portrait-${rank}.png`);}
});
test('ordinary speech payload preserves actor, scope and scene context on Toma replies',()=>{
 const {g,e,events}=run('pelican',false);g.bark('TOMA','Reply',true,{actorId:e.id});const payload=events.find(e=>e.type==='bark').payload;assert.equal(payload.actorId,e.id);assert.equal(payload.scope,'survival');assert.equal(payload.sceneId,null);
});

test('v13 migration suppresses only already-started legacy actors and permits a fresh first encounter',()=>{
 const g=new Game({seed:43}),old=captureRun(g);old.version=13;delete old.game?.timers?.ego;delete old.game?.timers?.egoIndex;delete old.game.encounters;const fresh=restoreRun(old);fresh.setPausedEncountersEnabled(true);const first=fresh.spawnEnemy('pelican',100,0);first.cooldown=0;fresh.updateEnemies(.01);assert.equal(fresh.encounters.queue.length,1);
 const {g:legacy,e}=run('pelican',false);legacy.updateEnemies(.01);const saved=captureRun(legacy);saved.version=13;delete saved.game?.timers?.ego;delete saved.game?.timers?.egoIndex;delete saved.game.encounters;const restored=restoreRun(saved);restored.setPausedEncountersEnabled(true);assert.deepEqual(restored.encounters.legacyActorIds,[e.id]);restored.s.enemies=[];const later=restored.spawnEnemy('pelican',100,0);later.cooldown=0;restored.speechUntil=0;restored.clearSpeech();restored.updateEnemies(.01);assert.equal(restored.encounters.queue.length,1);assert.equal(restored.encounters.queue[0].actorId,later.id);
});

test('leaving Charles from a restored modal cancels active and queued scenes before the victory checkpoint',()=>{
 const g=charles();g.update(.01);const restored=restoreRun(captureRun(g));assert.equal(restored.leaveCharlesEpilogue(),true);assert.equal(restored.encounters.active,null);assert.equal(restored.encounters.outcomes['charles:0'],'obsolete');assert.equal(restored.s.mode,'victory');assert.doesNotThrow(()=>captureRun(restored));
 const queued=charles();queued.s.charles.phase='hover';queued.s.charles.phaseDuration=CHARLES.phases.hover;queued.s.charles.phaseTime=.001;queued.update(.01);assert.equal(queued.encounters.queue.length,1);queued.leaveCharlesEpilogue();assert.equal(queued.encounters.queue.length,0);assert.equal(queued.encounters.outcomes['charles:0'],'obsolete');assert.doesNotThrow(()=>captureRun(queued));
});
test('generic dialogue cannot overwrite an active boss scene or another modal',()=>{
 const {g}=run();g.update(.01);const before=captureRun(g);assert.equal(g.startDialogue([{who:'TOMA',text:'Unexpected replacement'}]),false);assert.deepEqual(captureRun(g),before);
});

test('companion invocation retains actor context through every speaker and derives current rank after restore',()=>{
 const g=new Game({seed:42});g.s.upg.girlfriend=3;g.s.companion=true;g.startDialogue(EVENTS.companion);
 for(let index=0;index<5;index++){const saved=captureRun(g),restored=restoreRun(saved);assert.equal(restored.encounters.active.id,'companion:invocation');assert.equal(restored.encounters.active.index,index);const context=restored.dialoguePresentation();assert.equal(context.actorType,'companion');assert.equal(context.portrait,'assets/companion-portrait-3.png');assert.equal(context.who,EVENTS.companion[index].who);g.advanceEncounterDialogue('companion:invocation',index);}
 assert.equal(g.encounters.outcomes['companion:invocation'],'completed');assert.equal(g.startDialogue(EVENTS.companion),false);
});
test('first companion invocation waits behind reward choices and survives a queued checkpoint exactly once',()=>{
 const g=new Game({seed:42});g.rng=4;g.gainXP(8);g.s.xp=100;assert.equal(g.chooseUpgrade('girlfriend'),true);assert.equal(g.s.mode,'upgrade');assert.equal(g.startDialogue(EVENTS.companion),true);assert.equal(g.s.mode,'upgrade');assert.equal(g.encounters.queue.length,1);
 const b=restoreRun(captureRun(g));b.s.xp=0;b.chooseUpgrade(b.s.options[0].id);assert.equal(b.s.mode,'playing');b.update(.01);assert.equal(b.s.mode,'dialogue');assert.equal(b.encounters.active.id,'companion:invocation');b.finishDialogue(true);assert.equal(b.encounters.outcomes['companion:invocation'],'skipped');assert.equal(b.startDialogue(EVENTS.companion),false);
});
test('saved v13 companion invocation gains stable context without moving its cursor or changing old gameplay',()=>{
 const g=new Game();g.s.mode='dialogue';const old=captureRun(g,{lines:EVENTS.companion,index:3});old.version=13;delete old.game?.timers?.ego;delete old.game?.timers?.egoIndex;delete old.game.encounters;const b=restoreRun(old);assert.equal(b.encounters.active.id,'companion:invocation');assert.equal(b.encounters.active.index,3);assert.equal(b.dialoguePresentation().actorType,'companion');const next=captureRun(b);delete next.game.encounters;next.version=13;delete next.game.timers.ego;delete next.game.timers.egoIndex;assert.deepEqual(next,old);
});

test('companion invocation remains available with optional action banter off',()=>{const g=new Game();g.setBanterEnabled(false);assert.equal(g.startDialogue(EVENTS.companion),true);assert.equal(g.s.mode,'dialogue');assert.equal(g.encounters.active.id,'companion:invocation');});
test('paused scenes freeze populated combat expiry, damage sources, spawn schedule, RNG and effect clocks',()=>{
 const {g,e}=run();g.update(.01);g.s.shots.push({x:0,y:0,vx:100,vy:0,life:.001,damage:3,r:4,pierce:0,kind:'bullet',hitIds:new Set()});g.s.clouds.push({x:g.s.x,y:g.s.y,vx:10,vy:0,r:40,life:2,maxlife:2});g.s.drops.push({x:0,y:0,kind:'xp',value:3,life:120});g.burst(0,0,'#ffffff',5);g.pulse(0,0,20,'#ffffff');g.timers.spawn=0;g.s.invulnerable=0;g.s.girl.down=4;
 const before=captureRun(g);for(let n=0;n<60;n++)g.update(.25,{x:1,y:1});assert.deepEqual(captureRun(g),before);assert.equal(g.s.enemies[0].id,e.id);
});
test('all eight Charles lines keep exact order, each speaker checkpoint and one consumption per beat',()=>{
 const g=charles(),seen=[];
 for(let beat=0;beat<4;beat++){
  g.s.charles.nextDialogue=0;g.update(.01);assert.equal(g.encounters.active.id,`charles:${beat}`);
  for(let index=0;index<2;index++){const snap=captureRun(g);assert.deepEqual(captureRun(restoreRun(snap)),snap);seen.push(g.encounters.active.lines[index]);g.advanceEncounterDialogue(`charles:${beat}`,index);}
  assert.equal(g.encounters.outcomes[`charles:${beat}`],'completed');assert.equal(g.s.elapsed,1200);
 }
 assert.deepEqual(seen,CHARLES_LINES);g.s.charles.nextDialogue=0;g.update(.01);assert.equal(g.encounters.active,null);assert.equal(g.s.charles.dialogueIndex,8);
});

test('genuine v13 Charles interrupted premise finishes before the next paused response',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/paused-charles-v13-recover.json',import.meta.url),'utf8'));assert.equal(old.version,13);assert.equal(old.game.s.charles.dialogueIndex,3);assert.equal(old.game.speech.active.text,CHARLES_LINES[2].text);
 const g=restoreRun(old);g.setPausedEncountersEnabled(true);g.update(.01);assert.equal(g.s.mode,'playing');assert.equal(g.s.charles.dialogueIndex,3);assert.equal(g.speech.active.text,CHARLES_LINES[2].text);
 let steps=0;while(g.s.mode==='playing'&&steps++<3000)g.update(.01,{x:0,y:1});assert.equal(g.s.mode,'dialogue');assert.deepEqual(g.encounters.active.lines,[CHARLES_LINES[3]]);assert.equal([g.speech.active,...g.speech.queue].some(line=>line?.scope==='charles'&&!line.encounter),false);assert.equal(g.s.elapsed,1200);assert.deepEqual(captureRun(restoreRun(captureRun(g))),captureRun(g));
});

test('actual triggering update completes all remaining combat work before emitting a modal',()=>{
 const {g}=run(),called=[],methods=['weapons','updateShots','updateVehicles','updateClouds','updateShockwaves','updateDrops','updateChests','updateEffects'];
 for(const name of methods){const original=g[name].bind(g);g[name]=(...args)=>{const result=original(...args);called.push(name);return result;};}
 g.onEvent=(type)=>{if(type==='dialogue')assert.deepEqual(called,methods);};g.update(.01);assert.equal(g.s.mode,'dialogue');assert.deepEqual(called,methods);
});
test('lethal damage later in the triggering step wins over the queued boss scene',()=>{
 const {g}=run();g.s.hp=1;g.s.clouds.push({x:g.s.x,y:g.s.y,vx:0,vy:0,r:40,life:2,maxlife:2});g.update(.01);assert.equal(g.s.mode,'gameover');assert.equal(g.encounters.active,null);assert.doesNotThrow(()=>captureRun(g));
});
