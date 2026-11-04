import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import * as content from '../dist/content.js';
import * as speech from '../dist/speech.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
function fixture(){const events=[],g=new Game({seed:42,onEvent:(type,payload)=>{if(type==='bark')events.push(payload);}});g.s.elapsed=30;g.timers.bark=1000;g.world.getVisible=()=>[];return {g,events};}
function read(g){g.s.elapsed=g.speech.active.until+.001;g.flushSpeech();}

test('each stunt boast owns a specific answer instead of indexing an unrelated pool',()=>{
 assert.ok(content.STUNT_BARKS.every(line=>typeof line.id==='string'&&line.reply?.who==='BLONDE IA'&&line.reply.text));
 assert.equal(new Set(content.STUNT_BARKS.map(line=>line.id)).size,content.STUNT_BARKS.length);
 for(const [index,line] of content.STUNT_BARKS.entries()){
  const {g,events}=fixture();g.s.companion=true;g.s.stunt.count=index;g.s.moveX=1;g.stuntCharge=100;g.runStreak=3;g.updateStunt(.01,1);
  assert.equal(events[0].text,line.text);read(g);assert.equal(events.at(-1).text,line.reply.text);
 }
});
test('every rival replies to its own setup, with actor-specific authored answers',()=>{
 assert.ok(content.RIVAL_BARKS.every(line=>line.id&&line.replies?.rival_rooster&&line.replies?.rival_goat));
 for(const type of ['rival_rooster','rival_goat'])for(const [index,line] of content.RIVAL_BARKS.entries()){
  const {g,events}=fixture();g.rivalBarkIndex=index;g.spawnEnemy(type,100,0);g.updateRivalBanter();assert.equal(events[0].text,line.text);read(g);assert.equal(events.at(-1).text,line.replies[type]);
 }
});
test('a dismissed setup cannot leave an orphan reply',()=>{
 const {g,events}=fixture();g.spawnEnemy('rival_goat',100,0);g.updateRivalBanter();g.dismissSpeech();g.s.elapsed+=5;g.updateRivalBanter();assert.equal(events.length,1);
});
test('a charmed rival cancels the remaining exchange',()=>{
 const {g,events}=fixture();const rival=g.spawnEnemy('rival_goat',100,0);g.updateRivalBanter();rival.charmed=5;read(g);assert.equal(events.length,1);
});
test('a story scene is complete only after its final reading budget',()=>{
 const {g,events}=fixture();assert.equal(typeof speech.beginSpeechScene,'function');
 const lines=[{who:'TOMA',text:'Un char pour chaque pied !'},{who:'SYSTÈME',text:'Les deux pieds sont encore au sol.'}];
 assert.equal(speech.beginSpeechScene(g,'test-scene',lines,{remember:true}),true);assert.equal(g.eventSeen.has('scene:test-scene'),false);read(g);assert.equal(events.length,2);assert.equal(g.eventSeen.has('scene:test-scene'),false);read(g);assert.equal(g.eventSeen.has('scene:test-scene'),true);
});
test('an interrupted scene resumes its exact setup before its answer across save',()=>{
 const {g,events}=fixture();g.spawnEnemy('rival_goat',100,0);g.updateRivalBanter();const setup=events[0].text;g.s.elapsed+=1;g.announceEncounter('Une horde arrive.');
 const snapshot=captureRun(g),restored=restoreRun(snapshot),more=[];restored.onEvent=(type,payload)=>{if(type==='bark')more.push(payload);};assert.deepEqual(captureRun(restored),snapshot);
 read(restored);assert.equal(more.at(-1).text,setup);read(restored);assert.equal(more.at(-1).text,content.RIVAL_BARKS[0].replies.rival_goat);
});
test('offline companion scene never invents an ally and completes once unlocked',()=>{
 const {g,events}=fixture();g.story(.01);assert.equal(events.length,0);g.s.companion=true;g.story(.01);assert.match(events[0].text,/locale/i);assert.equal(g.eventSeen.has('scene:companion-local'),false);
 read(g);read(g);read(g);assert.equal(g.eventSeen.has('scene:companion-local'),true);const count=events.length;g.story(.01);assert.equal(events.length,count);
});
test('horde reality-check requires a real horde, not elapsed time alone',()=>{
 const {g,events}=fixture();g.story(.01);assert.equal(events.length,0);for(let i=0;i<12;i++)g.spawnEnemy('normal',100+i,0);g.story(.01);assert.equal(g.speech.scene?.id,'first-horde');assert.equal(g.s.mode,'playing');
});
test('a build scene needs the actual upgrade and its callback needs completed reading',()=>{
 const {g,events}=fixture();g.s.upg.car=1;g.story(.01);assert.equal(g.speech.scene?.id,'build-car');const snapshot=captureRun(g);const early=restoreRun(snapshot);early.s.elapsed=600;early.clearSpeech();early.story(.01);assert.equal(early.speech.active.text,content.STORY_MILESTONES[1].text);
 read(g);read(g);read(g);g.s.elapsed=600;g.story(.01);assert.notEqual(events.at(-1).text,content.STORY_MILESTONES[1].text);assert.match(events.at(-1).text,/siège|distance|char/i);
});
test('v11 saves gain an empty scene cursor without losing reading or replay data',()=>{
 const {g}=fixture();g.bark('TOMA','Ancienne phrase encore à lire.');const old=captureRun(g);old.version=11;delete old.game.speech.scene;for(const line of [old.game.speech.active,...old.game.speech.queue])if(line)delete line.sceneId;
 const copy=restoreRun(old);assert.equal(copy.speech.scene,null);assert.equal(copy.speech.active.text,old.game.speech.active.text);assert.equal(captureRun(copy).version,13);
});

test('every story line restores the same cursor, remainder and final completion',()=>{
 for(const id of Object.keys(content.STORY_SCENES)){
  const {g}=fixture();g.s.companion=true;g.recalculate();speech.beginSpeechScene(g,id,content.STORY_SCENES[id],{remember:true});
  for(let index=0;index<content.STORY_SCENES[id].length;index++){
   g.s.elapsed+=.25;g.announceEncounter('Attention !');const saved=captureRun(g),r=restoreRun(saved);assert.deepEqual(captureRun(r),saved);read(r);assert.equal(r.speech.active.text,content.STORY_SCENES[id][index].text);
   read(g);read(g);read(r);assert.deepEqual(captureRun(r),captureRun(g));
  }
  assert.equal(g.speech.scene,null);assert.equal(g.eventSeen.has(`scene:${id}`),true);
 }
});
test('death during an urgent interruption discards both setup and answer',()=>{
 const {g,events}=fixture(),rival=g.spawnEnemy('rival_rooster',100,0);g.updateRivalBanter();g.s.elapsed+=1;g.reactToCrow();rival.dead=true;read(g);assert.equal(g.speech.scene,null);assert.equal(g.speech.queue.length,0);assert.equal(events.length,2);
});
test('companion shutdown cancels her scene without earning a callback',()=>{
 const {g,events}=fixture();g.s.companion=true;g.story(.01);g.s.girl.down=5;read(g);assert.equal(g.speech.scene,null);assert.equal(g.eventSeen.has('scene:companion-local'),false);assert.equal(events.length,1);
});
test('dismissed remembered scenes are skipped, never completed or replayed immediately',()=>{
 const {g,events}=fixture();g.s.upg.car=1;g.story(.01);g.dismissSpeech();g.s.elapsed+=10;g.story(.01);assert.equal(events.length,1);assert.equal(g.eventSeen.has('scene:build-car'),false);assert.equal(g.eventSeen.has('skip:build-car'),true);
});
test('a busy reading lane rejects a scene without losing or marking its setup',()=>{
 const {g}=fixture();g.bark('TOMA','Première phrase.');const before=captureRun(g);assert.equal(speech.beginSpeechScene(g,'build-car',content.STORY_SCENES['build-car'],{remember:true}),false);assert.deepEqual(captureRun(g),before);
});
test('scene schema rejects malformed cursors, mismatched text and orphan scene lines',()=>{
 const {g}=fixture();g.s.upg.car=1;g.story(.01);
 for(const change of [
  s=>s.scene.index=99,s=>s.scene.lines=[],s=>s.scene.id='bad/id',s=>s.scene.actorId=-1,s=>s.scene.companion=true,
  s=>s.active.text='A different setup.',s=>s.active.sceneId='another',s=>s.scene=null,s=>s.scene.scope='invalid',
  s=>s.queue.push({...s.active,id:s.nextId++}),s=>s.scene.lines[0].who='',s=>s.scene.lines.push(...s.scene.lines),
 ]){const bad=captureRun(g);change(bad.game.speech);assert.throws(()=>restoreRun(bad));}
});
test('legacy pending replies keep their exact old wording after migration',()=>{
 const {g}=fixture();g.s.companion=true;const rival=g.spawnEnemy('rival_goat',100,0);g.pendingStuntReply={at:30,index:3};g.pendingRivalReply={at:30,index:2,ally:false,id:rival.id,type:rival.type};
 const old=captureRun(g);old.version=11;delete old.game.speech.scene;const r=restoreRun(old),lines=[];r.onEvent=(t,p)=>{if(t==='bark')lines.push(p.text);};r.updateStunt(.01,0);read(r);r.updateRivalBanter();
 assert.deepEqual(lines,[content.STUNT_REPLIES[3].text,content.RIVAL_REPLIES.rival_goat[2]]);
});
test('final minute does not start optional three-line story scenes',()=>{
 const {g,events}=fixture();g.s.elapsed=1150;g.s.companion=true;g.s.upg.car=1;for(const m of content.STORY_MILESTONES)g.eventSeen.add(`chapter:${m.at}`);g.story(.01);assert.equal(g.speech.scene,null);assert.equal(events.length,0);
});

test('repeated urgent interruptions cannot evict the only scene cursor line',()=>{
 const {g}=fixture();speech.beginSpeechScene(g,'build-car',content.STORY_SCENES['build-car'],{remember:true});
 for(let i=0;i<24;i++){g.s.elapsed+=.91;g.reactToCrow();g.announceEncounter(`warning ${i}`);}
 assert.equal(g.speech.queue.filter(line=>line.sceneId==='build-car').length,1);assert.ok(g.speech.queue.length<=speech.SPEECH_QUEUE_LIMIT);
 const r=restoreRun(captureRun(g));read(r);assert.equal(r.speech.active.text,content.STORY_SCENES['build-car'][0].text);read(r);assert.equal(r.speech.active.text,content.STORY_SCENES['build-car'][1].text);
});
test('disabled banter freezes a scene without earning hidden callbacks and re-enables at the same remainder',()=>{
 const {g,events}=fixture();assert.equal(typeof g.setBanterEnabled,'function');g.s.upg.car=1;g.story(.01);g.s.elapsed+=1;const remaining=g.speech.active.until-g.s.elapsed;g.setBanterEnabled(false);
 g.s.elapsed+=200;g.story(.01);assert.equal(g.speech.active,null);assert.equal(g.eventSeen.has('scene:build-car'),false);assert.equal(events.length,1);
 g.announceEncounter('Attention !');assert.equal(g.speech.active.encounter,true);read(g);assert.equal(g.speech.active,null);
 const r=restoreRun(captureRun(g));r.setBanterEnabled(false);r.s.elapsed+=30;r.story(.01);assert.equal(r.speech.active,null);r.setBanterEnabled(true);r.presentSpeech();assert.equal(r.speech.active.text,content.STORY_SCENES['build-car'][0].text);assert.ok(Math.abs(r.speech.active.remaining-remaining)<1e-6);
});
test('disabled banter never starts scenes or advances unseen chapter flags',()=>{
 const {g}=fixture();g.setBanterEnabled(false);g.s.upg.car=1;g.s.elapsed=600;g.story(.01);assert.equal(g.speech.scene,null);assert.equal(g.eventSeen.has('chapter:600'),false);g.setBanterEnabled(true);g.story(.01);assert.equal(g.speech.active.text,content.STORY_MILESTONES[1].text);
});

test('disabling at an exact line deadline preserves a valid scene cursor',()=>{
 const {g}=fixture();assert.equal(typeof g.setBanterEnabled,'function');g.s.upg.car=1;g.story(.01);g.s.elapsed=g.speech.active.until;g.setBanterEnabled(false);assert.doesNotThrow(()=>captureRun(g));assert.equal(g.speech.scene.index,1);g.setBanterEnabled(true);g.presentSpeech();assert.equal(g.speech.active.text,content.STORY_SCENES['build-car'][1].text);
});

test('victory callback requires the completed car scene, not just the upgrade',()=>{
 const {g}=fixture();g.s.upg.car=1;const plain=content.victoryQuote(g.s,g.eventSeen);g.story(.01);assert.equal(content.victoryQuote(g.s,g.eventSeen),plain);read(g);read(g);read(g);const callback=content.victoryQuote(g.s,g.eventSeen);assert.notEqual(callback,plain);assert.match(callback,/siège/i);assert.match(callback,/vingt minutes/i);
});
