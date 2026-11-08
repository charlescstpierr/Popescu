import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,CALM_N,CALM_R} from '../dist/engine.js';
import * as content from '../dist/content.js';
import {SCENE_CALM_WAIT} from '../dist/speech.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

function fixture({seed=42,props=[]}={}){
 const events=[],g=new Game({survivalDuration:1200,seed,onEvent:(type,payload)=>{if(type==='bark')events.push(payload);}});
 g.s.elapsed=30;g.timers.bark=1000;g.world.getVisible=()=>props.map(type=>({type,x:g.s.x,y:g.s.y,w:24}));return {g,events};
}
function read(g){g.s.elapsed=g.speech.active.until+.001;g.flushSpeech();}
function sceneLines(g){return [g.speech.active,...g.speech.queue].filter(line=>line?.sceneId).length;}

test('defeat lines follow the recorded cause, sources first',()=>{
 const q=(source,actorType,seed=0)=>content.defeatQuote({deathCause:{source,actorType,actorId:actorType?1:null,at:1,hpLoss:5}},seed);
 assert.equal(q('gas',null),"Mon parfum attire même les ambulances.");
 assert.equal(q('explosion','explosive'),"Sortie explosive. Comme mes entrées.");
 assert.equal(q('shockwave','rival_rooster'),"Le coq m'a pas eu. J'me suis couché avant son solo.");
 assert.equal(q('tail','travestia'),"J'suis pas tombé. J'ai fini sur un grand écart.");
 assert.equal(q('pelican','pelican'),"Péli m'a pas battu. Mercure était rétrograde.");
 assert.equal(q('touch','orangutan'),"Elle m'a pas frappé. C'était un câlin de fan.");
 assert.equal(q('touch','rival_goat'),"Le bouc m'a pas battu. Son odeur m'a endormi.");
 assert.match(q('touch','matriarch'),/^La Matriarche m'a pas sorti/);
 // A gas gorilla's slap is an ordinary contact, never the gas-cloud joke.
 assert.notEqual(q('touch','gas'),q('gas',null));
 const contact=new Set();for(let seed=-6;seed<6;seed++){const line=q('touch','normal',seed);assert.equal(typeof line,'string');contact.add(line);}
 assert.equal(contact.size,3);
 assert.equal(q('touch','normal',-2147483648),q('touch','normal',-2147483648));
 for(const actor of ['skunk','moose',null])assert.equal(q('touch',actor),content.DEFEAT_FALLBACK);
 assert.equal(q('unknown',null),content.DEFEAT_FALLBACK);assert.equal(content.defeatQuote({}),content.DEFEAT_FALLBACK);
 assert.match(readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),/defeatQuote\(s,current\.seed\)/);
});

test('a lull excludes every announced or ongoing danger',()=>{
 const base=()=>{const {g}=fixture();assert.equal(g.isCalm(),true);return g;};
 const cases={
  warning:g=>{g.spawnEnemy('normal',g.s.x+400,g.s.y).phase='animal_warning';},
  windupPhase:g=>{g.spawnEnemy('normal',g.s.x+400,g.s.y).phase='tail_windup';},
  activeCharge:g=>{g.spawnEnemy('normal',g.s.x+400,g.s.y).phase='ego_active';},
  windup:g=>{g.spawnEnemy('orangutan',g.s.x+400,g.s.y).windup=1;},
  swipe:g=>{g.spawnEnemy('orangutan',g.s.x+400,g.s.y).swipe=.2;},
  gasPose:g=>{g.spawnEnemy('gas',g.s.x+400,g.s.y).gasPose=.5;},
  crow:g=>{g.spawnEnemy('rival_rooster',g.s.x+400,g.s.y).crow=.5;},
  cloud:g=>{g.s.clouds.push({x:0,y:0,r:20,maxr:60,arm:0,life:2,maxlife:3,vx:0,vy:0});},
  shockwave:g=>{g.s.shockwaves.push({});},
  bossOnScreen:g=>{g.spawnEnemy('matriarch',g.s.x+300,g.s.y);},
  bossAttackingOffScreen:g=>{g.spawnEnemy('travestia',g.s.x+2000,g.s.y).phase='tail_dash';},
  attackOnScreen:g=>{g.spawnEnemy('normal',g.s.x+300,g.s.y).phase='ego_warning';},
  crowd:g=>{for(let i=0;i<=CALM_N;i++)g.spawnEnemy('normal',g.s.x+CALM_R-20,g.s.y+i*3);},
  contact:g=>{const e=g.spawnEnemy('normal',g.s.x,g.s.y);e.x=g.s.x+(e.r||10);},
  recentHit:g=>{g.lastHit=g.s.elapsed-.5;},
  finalMinute:g=>{g.s.elapsed=1135;},
  otherSpeech:g=>{g.bark('TOMA','Une autre phrase.');},
  companionDown:g=>{g.s.companion=true;g.s.girl.down=3;},
 };
 for(const [name,make] of Object.entries(cases)){const g=base();make(g);assert.equal(g.isCalm(),false,name);}
 {const far=base();far.spawnEnemy('orangutan',far.s.x+1500,far.s.y).windup=1;far.s.clouds.push({x:far.s.x+2000,y:far.s.y,r:20,maxr:60,arm:0,life:2,maxlife:3,vx:0,vy:0});far.spawnEnemy('matriarch',far.s.x+1500,far.s.y);assert.equal(far.isCalm(),true,'off-screen dangers do not block a lull');}
 const g=base();for(let i=0;i<CALM_N;i++)g.spawnEnemy('normal',g.s.x+CALM_R-20,g.s.y+i*3);assert.equal(g.isCalm(),true);
});

test('every attack phase in the code is classified for the lull check',()=>{
 const phases=new Set();
 for(const file of ['engine.js','animals.js','ego-beasts.js','pelican.js','travestia.js','travestia-dash.js'])
  for(const m of readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8').matchAll(/phase(?:===|=|:)\s*'([a-z_]+)'/g))if(m[1]!=='string')phases.add(m[1]);
 // Pelican phases are built at runtime: peli_<kind>_warning, then peli_<kind>.
 for(const kind of ['hug','zodiac','tarot'])for(const p of [`peli_${kind}_warning`,`peli_${kind}`])phases.add(p);
 assert.match(readFileSync(new URL('../dist/pelican.js',import.meta.url),'utf8'),/\['hug','zodiac','tarot'\]/,'update this list with the pelican attacks');
 const safe=new Set(['chase','none','charmed','suppressed','animal_recover','ego_recover','peli_recover','tail_recover','tail_dash_recover','intro','move','shoot','done','complete','number','hover','descend','bend','scream','burst','empowered']);
 const {g}=fixture();
 for(const phase of phases){
  if(safe.has(phase))continue;
  const e=g.spawnEnemy('normal',g.s.x+400,g.s.y);e.phase=phase;
  assert.equal(g.isCalm(),false,`phase ${phase} must block a lull or be listed as safe`);e.dead=true;
 }
});

test('a street scene plays only in a lull, once, and pays off at fifteen minutes',()=>{
 const {g,events}=fixture({props:['phone']});
 const ape=g.spawnEnemy('orangutan',g.s.x+400,g.s.y);ape.windup=1;g.story(.01);
 assert.equal(g.speech.scene,null);assert.equal(events.length,0);assert.equal(g.eventSeen.has('phone'),false);
 ape.windup=0;ape.dead=true;g.story(.01);assert.equal(g.speech.scene?.id,'street:phone');assert.equal(events[0].text,content.EVENTS.phone[0].text);
 read(g);read(g);read(g);assert.ok(g.eventSeen.has('scene:street:phone'));assert.equal(events.length,3);
 g.s.elapsed+=200;g.story(.01);assert.equal(g.speech.scene,null,'no replay of a read scene');
 g.world.getVisible=()=>[];const copy=restoreRun(captureRun(g));copy.s.elapsed=900;copy.clearSpeech();copy.story(.01);
 assert.equal(copy.speech.active.text,"Quinze minutes. Toujours cinq cent trois sur dix.");
});

test('the fifteen-minute callback pays the last completed street scene, across a save',()=>{
 const seen=new Set(['scene:street:phone','chapter:300','scene:street:bench']);
 assert.equal(content.storyMilestoneLine(content.STORY_MILESTONES[2],seen).text,"Quinze minutes. Le pigeon a toujours pas payé.");
 assert.equal(content.storyMilestoneLine(content.STORY_MILESTONES[2],new Set(['skip:street:phone'])),content.STORY_MILESTONES[2]);
 const {g}=fixture();for(const flag of seen)g.eventSeen.add(flag);assert.deepEqual([...restoreRun(captureRun(g)).eventSeen],[...g.eventSeen]);
});

test('a scene waits for calm with one saved cursor, lets a boss taunt through, then cancels',()=>{
 const {g,events}=fixture({props:['vending']});g.story(.01);assert.equal(g.speech.scene?.id,'street:vending');
 const ape=g.spawnEnemy('orangutan',g.s.x+400,g.s.y);ape.windup=1;read(g);
 assert.equal(g.speech.active,null);assert.equal(sceneLines(g),1);assert.equal(typeof g.speech.scene.waitSince,'number');
 assert.equal(g.bark('TOMA','Bavardage ordinaire.'),false,'no ordinary chatter in the gap');
 const saved=captureRun(g),copy=restoreRun(saved);assert.deepEqual(captureRun(copy),saved);
 assert.equal(g.bark('PÉLI ZODIAQUE','Ton thème astral est en retard.',true),true);assert.equal(g.speech.active?.text,'Ton thème astral est en retard.');assert.equal(sceneLines(g),1);
 read(g);assert.equal(g.speech.active,null);assert.equal(sceneLines(g),1);
 g.s.elapsed=g.speech.scene.waitSince+SCENE_CALM_WAIT+.01;g.flushSpeech();
 assert.equal(g.speech.scene,null);assert.ok(g.eventSeen.has('skip:street:vending'));assert.equal(sceneLines(g),0);
 ape.windup=0;ape.dead=true;g.s.elapsed+=200;g.story(.01);assert.equal(g.speech.scene,null,'a cancelled scene does not return');
 assert.ok(events.length>=2);
});

test('a waiting scene resumes as soon as the lull returns',()=>{
 const {g,events}=fixture({props:['bench']});g.story(.01);const ape=g.spawnEnemy('orangutan',g.s.x+400,g.s.y);ape.windup=1;read(g);
 assert.equal(g.speech.active,null);ape.windup=0;ape.dead=true;g.flushSpeech();assert.equal(g.speech.active?.text,content.EVENTS.bench[1].text);assert.equal(g.speech.scene.waitSince,undefined);
 read(g);read(g);assert.ok(g.eventSeen.has('scene:street:bench'));assert.equal(events.length,3);
});

test('each new woman gets one arrival, and only the highest pending rank plays',()=>{
 const {g,events}=fixture();g.s.companion=true;g.recalculate();g.eventSeen.add('scene:companion-local');
 for(const rank of [2,3])g.eventSeen.add(`companion-rank:${rank}`);g.story(.01);
 assert.equal(g.speech.scene?.id,'arrival:3');assert.equal(events[0].text,content.COMPANION_ARRIVALS[3][0].text);assert.ok(g.eventSeen.has('skip:arrival:2'));
 read(g);read(g);assert.ok(g.eventSeen.has('scene:arrival:3'));assert.equal(events.at(-1).who,'BLONDE IA');
 g.s.elapsed+=100;g.story(.01);assert.notEqual(g.speech.scene?.id,'arrival:2');
 const solo=fixture().g;solo.eventSeen.add('companion-rank:4');solo.story(.01);assert.equal(solo.speech.scene,null,'no arrival without her');
});

test('choosing a companion rank above one marks its arrival as pending',()=>{
 const {g}=fixture();g.s.upg.girlfriend=1;g.s.companion=true;g.s.mode='upgrade';g.s.options=[{id:'girlfriend'}];
 assert.equal(g.chooseUpgrade('girlfriend'),true);assert.ok(g.eventSeen.has('companion-rank:2'));
 for(const line of Object.values(content.COMPANION_ARRIVALS).flat())assert.ok(line.text.length<=70,line.text);
});

test('the joke rotation start depends on the seed without consuming a generator',()=>{
 const firsts=[];
 for(let seed=1;seed<=20;seed++){
  const g=new Game({seed});const rng=g.rng,stunt=g.stuntRng,rival=g.rivalRng;const offset=g.storyOffset();
  assert.equal(offset,new Game({seed}).storyOffset());assert.equal(g.rng,rng);assert.equal(g.stuntRng,stunt);assert.equal(g.rivalRng,rival);
  assert.equal(g.s.stunt.count,0);assert.equal(g.barkIndex,0);assert.equal(g.rivalBarkIndex,0);
  firsts.push(content.STUNT_BARKS[offset%content.STUNT_BARKS.length].text);
 }
 let differ=0;for(let i=1;i<firsts.length;i++)if(firsts[i]!==firsts[i-1])differ++;
 assert.ok(differ/(firsts.length-1)>=.75,`${differ} of ${firsts.length-1}`);
 assert.ok(new Game({seed:-123456}).storyOffset()>=0);
});

test('new story flags stay well under the saved event limit',()=>{
 const {g}=fixture();
 const flags=['horde-peak','scene:first-horde',...content.STREET_SCENE_TYPES.flatMap(t=>[`scene:street:${t}`,`skip:street:${t}`]),...[2,3,4,5].flatMap(r=>[`companion-rank:${r}`,`scene:arrival:${r}`,`skip:arrival:${r}`])];
 assert.ok(flags.length<=28);
 const existing=[...Object.keys(content.WORLD_REMARKS),...content.STORY_MILESTONES.map(m=>`chapter:${m.at}`),...content.STORY_BUILD_IDS.flatMap(id=>[`build-choice:${id}`,`scene:build-${id}`,`skip:build-${id}`]),'scene:companion-local','skip:companion-local','skip:first-horde'];
 for(const flag of [...existing,...flags])g.eventSeen.add(flag);
 assert.ok(g.eventSeen.size<100,`${g.eventSeen.size}`);assert.deepEqual([...restoreRun(captureRun(g)).eventSeen],[...g.eventSeen]);
});

test('the real rooster crow reply stays exact',()=>{
 assert.equal(content.ROOSTER_REACTION.text,'Men, farmes ta criss de gueule !');
});
