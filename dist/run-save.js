import {survivalDuration,LEGACY_SURVIVAL_SECONDS,SURVIVAL_SECONDS} from './run-rules.js';
import {migrateEncounterDialogue,validateEncounterDialogue} from './encounter-dialogue.js';
import {validLamborghiniState,CAR_TRIP} from './lamborghini.js';
import {createReplayState,validateReplayState,recordReplay,validateDeathCause} from './run-history.js';
import {createSpeech,SPEECH_QUEUE_LIMIT,speechDuration} from './speech.js';
import {CHARLES,CHARLES_LINES} from './charles.js';
import {createTrophyState,trimTrophyChests} from './boss-trophies.js';
import {EVOLUTIONS,totalEarnedCoins} from './evolutions.js';
import {compactDrops} from './drops.js';
import {BOSS_TYPES,BOSS_SCHEDULE,createBossDirector} from './boss-director.js';
import {ANIMALS} from './animals.js';
import {EGO_BEASTS,EGO_LIMITS,validateEgoBeast} from './ego-beasts.js';
// Versioned, validated persistence for the approved save/resume flow.
import {TAIL_DASH,DASH_DIRECTIONS} from './travestia-dash.js';
import {TRAVESTIA_BANTER,TRAVESTIA_BANTER_LEGACY_REPLIES} from './travestia.js';
import {PELICAN,PELICAN_BANTER,PELICAN_BANTER_LEGACY_REPLIES} from './pelican.js';
import {DISCOVERIES} from './discoveries.js';
import {Game} from './engine.js';
import {UPGRADES,DIFFICULTIES} from './content.js';
// v13 fences off engines that predate ranked Lamborghini trips. Those engines
// accept v12's extra car fields but move them with incompatible physics.
// v12 data already has the required fields: migrate its version, never its trip.
// v14 fences paused encounter cursors/context from engines that cannot resume them.
// v15 fences new enemy attack state from older readers.
const VERSION=16;
const MAX_BYTES=1500000;
const CAPS={enemies:300,shots:320,drops:260,clouds:90,particles:200,vehicles:10,pulses:36,chests:12,shockwaves:12,options:3};
const INTERNAL=['encounters','speech','bossDirector','seed','rng','id','viewport','timers','eventSeen','nextEvent','lastHit','barkIndex','stuntRng','stuntCharge','runStreak','stuntWait','pendingStuntReply','pendingRivalReply','rivalIndex','rivalBarkIndex','lastRivalBark','rivalRng','speechUntil','discoveryCooldowns','discoveryContact'];
const MODES=['playing','paused','upgrade','dialogue','trophy','victory','gameover'];
const ENEMIES=[...Object.keys(ANIMALS),...Object.keys(EGO_BEASTS),'travestia','pelican','normal','sprinter','gas','tank','jealous','explosive','matriarch','orangutan','rival_rooster','rival_goat'];
const REQUIRED={enemies:'id x y hp maxhp r speed windup hitFlash charmed cooldown attack summon',shots:'x y vx vy life damage r pierce',drops:'x y life value',clouds:'x y vx vy r life',particles:'x y vx vy life maxlife',vehicles:'x y vx vy life damage',pulses:'x y r maxr life maxlife',chests:'id x y openedAt',shockwaves:'x y r prevR maxR life maxlife width damage ownerId'};
function check(ok){if(!ok)throw new Error('Invalid run save');}
function object(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;}
function finite(n){return typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e12;}
function integer(n,min=0){return Number.isSafeInteger(n)&&n>=min&&n<=1e12;}
function tree(v,depth=0){check(depth<18);if(v===null||typeof v==='boolean')return;if(typeof v==='number'){check(finite(v));return;}if(typeof v==='string'){check(v.length<=2000);return;}if(Array.isArray(v)){check(v.length<=2000);for(const x of v)tree(x,depth+1);return;}check(object(v));for(const [k,x] of Object.entries(v)){check(!['__proto__','constructor','prototype'].includes(k));tree(x,depth+1);}}
function shape(value,model){check(object(value));for(const [k,v] of Object.entries(model)){if(Array.isArray(v)){check(Array.isArray(value[k]));continue;}if(v===null)continue;if(object(v))shape(value[k],v);else check(typeof value[k]===typeof v&&(typeof v!=='number'||finite(value[k])));}}
function physics(v){
 if(Array.isArray(v)){for(const x of v)physics(x);return;}if(!object(v))return;
 for(const [key,x] of Object.entries(v)){
  if(['r','maxr','maxR','prevR','width','range','magnet'].includes(key))check(finite(x)&&x>=0&&x<=5000);
  if(['x','y'].includes(key))check(finite(x)&&Math.abs(x)<=1e8);
  if(['vx','vy','speed','damage','knockback'].includes(key))check(finite(x)&&Math.abs(x)<=10000);
  physics(x);
 }
}
function copy(v){return JSON.parse(JSON.stringify(v,(_k,x)=>{if(typeof x==='number')check(finite(x));return x instanceof Set||x instanceof Map?[...x]:x;}));}
const TROPHY_PAIRS={pelican:['tarot','ascendant'],travestia:['panache','star'],matriarch:['fanclub','badge']};
const TROPHY_CLOCKS={tarot:8,ascendant:12,panache:10,star:8,fanclub:18};
const TROPHY_GORILLAS=['normal','sprinter','gas','tank','jealous','explosive'];
function validateTrophies(s,nextId){
 const t=s.trophies;check(object(t)&&object(t.chosen)&&object(t.cooldowns));
 const chosen=Object.entries(t.chosen);check(chosen.length<=3);
 for(const [type,id] of chosen)check(Object.hasOwn(TROPHY_PAIRS,type)&&TROPHY_PAIRS[type].includes(id));
 const owns=id=>Object.values(t.chosen).includes(id);
 const bounded=(n,max)=>finite(n)&&n>=0&&n<=max;
 const validId=id=>integer(id,1)&&id<nextId;
 for(const [id,max] of Object.entries(TROPHY_CLOCKS))check(bounded(t.cooldowns[id],max)&&(owns(id)||t.cooldowns[id]===0));
 check(Object.keys(t.cooldowns).length===Object.keys(TROPHY_CLOCKS).length);
 check(bounded(t.starLife,2)&&(owns('star')||t.starLife===0));
 const chestIds=new Set(),bossIds=new Set();
 for(const c of s.chests){
  check(validId(c.id)&&!chestIds.has(c.id));chestIds.add(c.id);
  if(c.bossType!==undefined||c.bossId!==undefined){
   check(Object.hasOwn(TROPHY_PAIRS,c.bossType)&&validId(c.bossId)&&c.bossId<c.id&&!bossIds.has(c.bossId));bossIds.add(c.bossId);
   const defeated=s.enemies.find(e=>e.id===c.bossId);
   if(defeated)check(defeated.type===c.bossType&&defeated.dead===true&&defeated.rewarded===true&&defeated.hp<=0);
  }
  if(c.open)check(c.openedAt>=0&&c.openedAt<=s.elapsed);
 }
 check(Array.isArray(t.pending)&&t.pending.length<=3);const pendingTypes=new Set(),pendingChests=new Set();
 for(const p of t.pending){
  check(object(p)&&Object.hasOwn(TROPHY_PAIRS,p.bossType)&&!Object.hasOwn(t.chosen,p.bossType)&&!pendingTypes.has(p.bossType)&&!pendingChests.has(p.chestId)&&validId(p.chestId)&&validId(p.bossId));
  const chest=s.chests.find(c=>c.id===p.chestId);check(chest&&chest.open===true&&chest.bossType===p.bossType&&chest.bossId===p.bossId);
  pendingTypes.add(p.bossType);pendingChests.add(p.chestId);
 }
 if(s.mode==='trophy')check(t.pending.length>0&&s.hp>0&&(s.endless||s.elapsed<survivalDuration(s)));
 const direction=a=>finite(a.dx)&&finite(a.dy)&&Math.abs(Math.hypot(a.dx,a.dy)-1)<1e-6;
 const position=a=>finite(a.x)&&finite(a.y)&&Math.abs(a.x)<=1e8&&Math.abs(a.y)<=1e8;
 const hits=(ids,max)=>Array.isArray(ids)&&ids.length<=max&&new Set(ids).size===ids.length&&ids.every(validId);
 if(t.tarot!==null){
  const a=t.tarot;check(owns('tarot')&&object(a)&&position(a)&&direction(a)&&bounded(a.age,1.6)&&finite(a.originX)&&finite(a.originY)&&Math.abs(a.originX)<=1e8&&Math.abs(a.originY)<=1e8&&hits(a.hitOut,3)&&hits(a.hitBack,3)&&new Set([...a.hitOut,...a.hitBack]).size<=3);
  if(a.age<.8)check(a.hitBack.length===0);
  const distance=220*(a.age<=.8?a.age:1.6-a.age)/.8;
  check(Math.abs(a.x-a.originX-a.dx*distance)<1e-5&&Math.abs(a.y-a.originY-a.dy*distance)<1e-5);
 }
 if(t.panache!==null){const a=t.panache;check(owns('panache')&&object(a)&&position(a)&&direction(a)&&bounded(a.life,.35)&&hits(a.hitIds,300));}
 if(t.feedback!==null){const f=t.feedback;check(object(f)&&owns(f.id)&&bounded(f.life,.8)&&bounded(f.amount,20));}
 check(s.enemies.filter(e=>e.trophyCharmLife>0).length<=2);
 for(const e of s.enemies)if(e.trophyCharmLife!==undefined){check(bounded(e.trophyCharmLife,2.5));if(e.trophyCharmLife>0)check(owns('fanclub')&&TROPHY_GORILLAS.includes(e.type)&&e.charmed>0);}
}
function validateCharles(s,nextId,world){
 const c=s.charles;if(c===null)return;check(object(c));
 check(integer(c.id,1)&&c.id<nextId&&c.type==='charles'&&c.r===28&&c.hp===1&&c.maxhp===1&&c.dead===false&&c.charmed===0);
 check(!s.enemies.some(e=>e.id===c.id)&&finite(c.x)&&finite(c.y)&&Math.abs(c.x)<=1e8&&Math.abs(c.y)<=1e8);
 check(Object.hasOwn(CHARLES.phases,c.phase)&&c.phaseDuration===CHARLES.phases[c.phase]&&finite(c.phaseTime)&&c.phaseTime>=0&&c.phaseTime<=c.phaseDuration);
 check(finite(c.hitFlash)&&c.hitFlash>=0&&c.hitFlash<=.12&&integer(c.hits)&&c.hits<=CHARLES.hitsToTransform&&typeof c.powered==='boolean');
 check(finite(c.elapsed)&&c.elapsed>=0&&c.elapsed<=1e8&&integer(c.attackCount));
 check(integer(c.dialogueIndex)&&c.dialogueIndex<=CHARLES_LINES.length&&finite(c.nextDialogue)&&c.nextDialogue>=0&&c.nextDialogue<=c.elapsed+4.8+1e-6);
 check(finite(c.safeAngle)&&Math.abs(c.safeAngle)<=Math.PI&&[300,380].includes(c.waveMax)&&[112,145].includes(c.capeRadius));
 check(c.powered||c.waveMax===300&&c.capeRadius===112);
 check(s.elapsed>=survivalDuration(s));
 if(c.phase==='complete')check(['defeated','left'].includes(c.outcome)&&(s.endless||s.mode==='victory'));
 else check(c.outcome===''&&!s.endless&&['playing','paused','dialogue'].includes(s.mode)&&s.hp>0&&c.phaseTime>0);
 if(c.phase==='intro')check(c.hits===0&&c.attackCount===0&&!c.powered);
 if(['descend','bend','scream','burst','empowered'].includes(c.phase))check(c.hits===CHARLES.hitsToTransform&&c.attackCount>=2);
 if(['descend','bend','scream','burst'].includes(c.phase))check(!c.powered);
 if(c.powered)check(c.hits===CHARLES.hitsToTransform&&c.attackCount>=2);
 check(Array.isArray(c.destroyed)&&c.destroyed.length<=CHARLES.maxDestroyed&&new Set(c.destroyed).size===c.destroyed.length);
 for(const id of c.destroyed){check(typeof id==='string'&&/^-?\d+,-?\d+:(?:forest:)?\d+$/.test(id));const [x,y]=id.split(':')[0].split(',').map(Number);check(Number.isSafeInteger(x)&&Number.isSafeInteger(y)&&Math.abs(x)<=2e5&&Math.abs(y)<=2e5);const p=world.chunk(x,y).find(p=>p.id===id);check(p&&['tree','pine','crate','pallet','barricade','planter'].includes(p.type));}
}
function validateSpeech(s,nextActorId,now){
 check(object(s)&&integer(s.nextId,1)&&Array.isArray(s.queue)&&s.queue.length<=SPEECH_QUEUE_LIMIT);
 check(s.scene===null||object(s.scene));
 if(s.scene){
  const scene=s.scene;
  check(typeof scene.id==='string'&&/^[a-z0-9:-]{1,80}$/.test(scene.id));
  check(Array.isArray(scene.lines)&&scene.lines.length>=1&&scene.lines.length<=4&&integer(scene.index)&&scene.index<scene.lines.length);
  check(scene.actorId===null||integer(scene.actorId,1)&&scene.actorId<nextActorId);
  check(['survival','charles'].includes(scene.scope)&&typeof scene.remember==='boolean'&&typeof scene.companion==='boolean');
  for(const line of scene.lines)check(object(line)&&typeof line.who==='string'&&line.who.length>0&&line.who.length<=80&&typeof line.text==='string'&&line.text.length>0&&line.text.length<=2000);
  check(scene.companion===scene.lines.some(line=>line.who==='BLONDE IA'));
  // Optional since the lull-gated story scenes; older saves omit both fields.
  check(scene.calm===undefined||scene.calm===true);
  check(scene.waitSince===undefined||scene.calm===true&&finite(scene.waitSince)&&scene.waitSince>=0&&scene.waitSince<=now+1e-6);
 }
 const ids=new Set();check(s.queue.every(object));let sceneLines=0;
 for(const line of [s.active,...s.queue]){if(line===null){check(s.active===null);continue;}
  check(object(line)&&integer(line.id,1)&&line.id<s.nextId&&!ids.has(line.id));ids.add(line.id);
  check(typeof line.who==='string'&&line.who.length>0&&line.who.length<=80&&typeof line.text==='string'&&line.text.length>0&&line.text.length<=2000);
  check(typeof line.encounter==='boolean'&&['survival','charles'].includes(line.scope));
  check(line.sceneId===null||typeof line.sceneId==='string');
  if(line.sceneId!==null){
   const scene=s.scene;check(scene&&line.sceneId===scene.id&&line.actorId===scene.actorId&&line.scope===scene.scope&&!line.encounter);
   check(line.who===scene.lines[scene.index].who&&line.text===scene.lines[scene.index].text);sceneLines++;
  }
  check(line.actorId===null||integer(line.actorId,1)&&line.actorId<nextActorId);
  check(finite(line.remaining)&&line.remaining>0&&line.remaining<=speechDuration(line.text));
  check(finite(line.until)&&line.until>=0&&line.until<=now+speechDuration(line.text)+1e-6);
 }
 check(sceneLines===(s.scene?1:0));
}
function validate(snapshot){
 tree(snapshot);
 if(Number.isInteger(snapshot.version)&&snapshot.version>=1&&snapshot.version<VERSION){
  // Old schemas cannot contain a new boss or invent its missing attack state.
  check(object(snapshot.game)&&object(snapshot.game.timers)&&Array.isArray(snapshot.game.s?.enemies));
  // A prior schema cannot claim new actors, phases, fields, or scheduler state.
  if(snapshot.version<15){
   check(!Object.keys(snapshot.game.timers).some(key=>key.startsWith('ego')));
   check(snapshot.game.s.enemies.every(e=>object(e)&&!Object.hasOwn(EGO_BEASTS,e.type)&&!e.phase?.startsWith('ego_')&&!Object.keys(e).some(key=>key.startsWith('ego'))));
   check(!Object.hasOwn(EGO_BEASTS,snapshot.game.s.deathCause?.actorType));
   snapshot.game.timers.ego=9;snapshot.game.timers.egoIndex=0;
  }
  snapshot.game.s.survivalDuration=LEGACY_SURVIVAL_SECONDS;
  if(snapshot.version<5)check(snapshot.game.s.enemies.every(e=>object(e)&&e.type!=='pelican'&&!e.phase?.startsWith('peli_')&&!Object.keys(e).some(key=>key.startsWith('peli'))));
  if(snapshot.version<=3){snapshot.game.timers.animal??=12;snapshot.game.timers.animalIndex??=0;}
  if(snapshot.version===3)check(snapshot.game.s.enemies.every(e=>!ANIMALS[e.type]));
  if(snapshot.version===1){
   // v1 predates Travestia. Never synthesize missing attack state for a boss.
   check(snapshot.game.s.enemies.every(e=>e.type!=='travestia'));
   for(const e of snapshot.game.s.enemies){if(e.tailTime===undefined)e.tailTime=0;if(e.tailFaceX===undefined)e.tailFaceX=1;if(e.tailHitPlayer===undefined)e.tailHitPlayer=false;if(e.tailHitGirl===undefined)e.tailHitGirl=false;}
  }
  if(snapshot.version===2)check(snapshot.game.s.enemies.every(e=>!e.phase?.startsWith('tail_dash')));
  if(snapshot.version<6){
   snapshot.game.bossDirector=createBossDirector(snapshot.game.seed,snapshot.game.s.elapsed,snapshot.game.s.enemies);
   for(const key of ['boss','travestia','pelican'])delete snapshot.game.timers[key];
  }
  if(snapshot.version<7){snapshot.game.s.coinsSpent=0;snapshot.game.s.upgradeRerolls=0;snapshot.game.s.evolutions={};}
  // Facing and input in older saves do not prove actual, unblocked movement.
  if(snapshot.version<8){snapshot.game.s.travelX=0;snapshot.game.s.travelY=0;}
  // Trophy state and boss provenance did not exist in any earlier schema.
  if(snapshot.version<9){snapshot.game.s.trophies=createTrophyState();
   for(const c of snapshot.game.s.chests||[]){delete c.bossType;delete c.bossId;}
   for(const e of snapshot.game.s.enemies)delete e.trophyCharmLife;}
  if(snapshot.version<10)snapshot.game.s.charles=null;
  if(snapshot.version<11)snapshot.game.speech=createSpeech();
  if(snapshot.version<12){
   const speech=snapshot.game.speech;check(object(speech)&&Array.isArray(speech.queue));speech.scene=null;
   for(const line of [speech.active,...speech.queue])if(line!==null){check(object(line));line.sceneId=null;}
  }
  if(snapshot.version<14)snapshot.game.encounters=migrateEncounterDialogue(snapshot.game,snapshot.dialogue);
  snapshot.version=VERSION;
 }
 check(snapshot.version===VERSION&&object(snapshot.game));const d=snapshot.game,s=d.s;check(object(s)&&Object.hasOwn(DIFFICULTIES,s.difficulty));const base=new Game({difficulty:s.difficulty,seed:d.seed});shape(s,base.s);check([SURVIVAL_SECONDS,LEGACY_SURVIVAL_SECONDS].includes(s.survivalDuration));shape(d.viewport,base.viewport);shape(d.timers,base.timers);check(integer(d.timers.animalIndex));check(integer(d.timers.egoIndex)&&finite(d.timers.ego)&&Math.abs(d.timers.ego)<=1e8);
 if(s.heroMotion!==undefined){const m=s.heroMotion;check(object(m)&&Object.keys(m).length===4&&finite(m.angle)&&Math.abs(m.angle)<=Math.PI&&finite(m.phase)&&m.phase>=0&&m.phase<8&&finite(m.distance)&&m.distance>=0&&typeof m.reverse==='boolean');}
 const director=d.bossDirector;check(object(director));
 check(integer(director.rng)&&director.rng<=4294967295&&BOSS_TYPES.includes(director.nextType));
 check(Array.isArray(director.bag)&&director.bag.length<=2&&new Set(director.bag).size===director.bag.length&&director.bag.every(type=>BOSS_TYPES.includes(type)&&type!==director.nextType));
 check(director.lastType===null||BOSS_TYPES.includes(director.lastType)&&director.lastType!==director.nextType);
 check(finite(director.remaining)&&director.remaining>=0&&director.remaining<=BOSS_SCHEDULE.firstMax&&typeof director.warned==='boolean');
 check(finite(director.retryIn)&&director.retryIn>=0&&director.retryIn<=BOSS_SCHEDULE.retry);
 if(director.warned)check(director.remaining<=BOSS_SCHEDULE.warning);
 else check(director.retryIn===0);
 if(director.retryIn>0)check(director.warned&&director.remaining===0);
 for(const key of INTERNAL){if(['encounters','speech','bossDirector','viewport','timers','eventSeen','pendingStuntReply','pendingRivalReply','discoveryCooldowns','discoveryContact'].includes(key))continue;check(finite(d[key]));}
 check(Number.isInteger(d.seed)&&d.seed>=-2147483648&&d.seed<=2147483647);check(Number.isInteger(d.rng)&&d.rng>=-2147483648&&d.rng<=2147483647);check(integer(d.id,1)&&integer(d.stuntRng)&&d.stuntRng<=4294967295&&integer(d.rivalRng)&&d.rivalRng<=4294967295);
 for(const key of ['barkIndex','rivalIndex','rivalBarkIndex'])check(integer(d[key]));if(d.lastCrowReaction!==undefined)check(finite(d.lastCrowReaction));
 check(d.viewport.width>=240&&d.viewport.width<=1600&&d.viewport.height>=320&&d.viewport.height<=1600);check(Array.isArray(d.eventSeen)&&d.eventSeen.length<=100&&d.eventSeen.every(x=>typeof x==='string'));
 // Optional in v13: preserve the exact measured layout for deterministic replay.
 // Old snapshots have no masks; the app refreshes them before its next attempt.
 if(Object.hasOwn(d.viewport,'occlusions')){
  const rects=d.viewport.occlusions;check(Array.isArray(rects)&&rects.length<=24);
  for(const r of rects)check(object(r)&&Object.keys(r).length===4&&['x','y','width','height'].every(k=>finite(r[k]))&&r.x>=0&&r.y>=0&&r.width>0&&r.height>0&&r.x+r.width<=d.viewport.width&&r.y+r.height<=d.viewport.height);
 }
 for(const key of ['pendingStuntReply','pendingRivalReply']){const p=d[key];check(p===null||object(p)&&finite(p.at)&&integer(p.index));if(key==='pendingRivalReply'&&p)check(integer(p.id,1)&&['rival_rooster','rival_goat'].includes(p.type)&&typeof p.ally==='boolean');}
 validateSpeech(d.speech,d.id,s.elapsed+(s.charles?.elapsed||0));
 check(Array.isArray(d.discoveryCooldowns)&&d.discoveryCooldowns.length<=256);
 for(const entry of d.discoveryCooldowns)check(Array.isArray(entry)&&entry.length===2&&typeof entry[0]==='string'&&finite(entry[1])&&entry[1]>=0);
 check(d.discoveryContact===null||typeof d.discoveryContact==='string');
 check(object(s.discovery)&&integer(s.discovery.count));
 const active=s.discovery.active;
 if(active!==null){check(object(active)&&Object.hasOwn(DISCOVERIES,active.kind));const def=DISCOVERIES[active.kind];check(typeof active.id==='string'&&active.duration===def.duration&&finite(active.remaining)&&active.remaining>=0&&active.remaining<=def.duration&&active.name===def.name&&active.description===def.description&&active.color===def.color);}
 const nearby=s.discovery.nearby;if(nearby!==null)check(object(nearby)&&Object.hasOwn(DISCOVERIES,nearby.discoveryType)&&typeof nearby.id==='string'&&finite(nearby.x)&&finite(nearby.y)&&finite(nearby.cooldown)&&nearby.cooldown>=0&&typeof nearby.needsExit==='boolean');
 check(MODES.includes(s.mode)&&s.elapsed>=0&&s.maxhp>0&&s.hp>=0&&s.hp<=s.maxhp&&s.xp>=0&&s.xpNeed>0&&s.shield>=0);for(const k of ['level','kills','coins','gems'])check(integer(s[k],k==='level'?1:0));
 check(integer(s.coinsSpent)&&integer(totalEarnedCoins(s))&&integer(s.upgradeRerolls)&&s.upgradeRerolls<=2);
 check(object(s.evolutions));for(const [id,active] of Object.entries(s.evolutions)){const def=EVOLUTIONS.find(u=>u.id===id);check(def&&active===true&&def.requires.every(key=>(s.upg[key]||0)>=3));}
 check(integer(s.stunt.count));
 const travel=Math.hypot(s.travelX,s.travelY);check(travel===0||Math.abs(travel-1)<1e-6);
 check(s.girl.maxhp>0&&s.stunt.duration>0&&s.stunt.progress>=0&&s.stunt.progress<=1);
 // Optional fields preserve older checkpoints without resetting their combat state.
 for(const [field,max] of Object.entries({walkDistance:100000,shieldClock:8,droneClock:2,supportFlash:.6}))if(s.girl[field]!==undefined)check(finite(s.girl[field])&&s.girl[field]>=0&&s.girl[field]<=max);
 if(s.girl.walkMoving!==undefined)check(typeof s.girl.walkMoving==='boolean');
 for(const field of ['faceX','faceY'])if(s.girl[field]!==undefined)check(finite(s.girl[field])&&Math.abs(s.girl[field])<=1);

 check(object(s.upg));for(const [id,rank] of Object.entries(s.upg)){const def=UPGRADES.find(u=>u.id===id);check(def&&integer(rank)&&rank<=def.max);}
 for(const [key,cap] of Object.entries(CAPS)){check(Array.isArray(s[key])&&s[key].length<=cap);for(const item of s[key]){check(object(item));for(const field of (REQUIRED[key]||'').split(' ').filter(Boolean))check(finite(item[field]));}}
 const egoActors=s.enemies.filter(e=>Object.hasOwn(EGO_BEASTS,e.type)&&!e.dead);
 check(egoActors.length<=EGO_LIMITS.active);
 for(const type of Object.keys(EGO_BEASTS))check(egoActors.filter(e=>e.type===type).length<=EGO_LIMITS.perType);
 const actorIds=new Set(),majorBosses=new Set();
 for(const e of s.enemies){
  check(ENEMIES.includes(e.type)&&integer(e.id,1)&&e.id<d.id&&e.maxhp>0&&e.r>0&&!actorIds.has(e.id));actorIds.add(e.id);
  if(e.bossCharmResistance!==undefined)check(BOSS_TYPES.includes(e.type)&&finite(e.bossCharmResistance)&&e.bossCharmResistance>=0&&e.bossCharmResistance<=10);
  if(['travestia','pelican'].includes(e.type)){check(!majorBosses.has(e.type));majorBosses.add(e.type);}
  base.s.enemies=[];const template=base.spawnEnemy(e.type,0,0);check(template);shape(e,template);check(e.r===template.r&&integer(e.banterCount));
  if(Object.hasOwn(EGO_BEASTS,e.type)){check(validateEgoBeast(e));check(!['egoPath','egoCursor'].some(key=>Object.hasOwn(e,key)));}
  else check(!Object.keys(e).some(key=>key.startsWith('ego'))&&!e.phase?.startsWith('ego_'));
  if(ANIMALS[e.type]){const a=ANIMALS[e.type],limits={chase:0,animal_warning:a.warning,animal_active:a.duration,animal_recover:a.recovery};check(Object.hasOwn(limits,e.phase)&&e.animalTime>=0&&e.animalTime<=limits[e.phase]&&typeof e.animalHit==='boolean'&&Math.abs(Math.hypot(e.animalDX,e.animalDY)-1)<1e-6&&e.animalTravel>=0&&e.animalTravel<=a.reach+1e-6);}
  if(e.type==='travestia'){
   const interrupted=(e.phase==='charmed'&&e.charmed>0)||(e.phase==='suppressed'&&s.airplane.active);
   const limits={chase:0,suppressed:interrupted?4.2:0,charmed:interrupted?4.2:0,tail_windup:4.2,tail_spin:1.4,tail_recover:1.2,tail_dash_windup:TAIL_DASH.warning,tail_dash:TAIL_DASH.duration,tail_dash_recover:TAIL_DASH.recovery};
   check(Object.hasOwn(limits,e.phase)&&e.tailTime>=0&&e.tailTime<=limits[e.phase]&&[-1,1].includes(e.tailFaceX));
   if(e.phase.startsWith('tail_'))check(e.tailTime>0);
   if(e.tailAttackCount!==undefined)check(integer(e.tailAttackCount));
   const dash=e.phase.startsWith('tail_dash');
   if(dash||e.tailDashDir!==undefined){
    check(integer(e.tailDashDir)&&e.tailDashDir<8&&finite(e.tailDashX)&&Math.abs(e.tailDashX)<=1e8&&finite(e.tailDashY)&&Math.abs(e.tailDashY)<=1e8&&finite(e.tailDashDistance)&&e.tailDashDistance>=0&&e.tailDashDistance<=TAIL_DASH.speed*TAIL_DASH.duration+1e-6);
    if(dash){const dir=DASH_DIRECTIONS[e.tailDashDir];check(Math.abs(e.x-e.tailDashX-dir.x*e.tailDashDistance)<1e-5&&Math.abs(e.y-e.tailDashY-dir.y*e.tailDashDistance)<1e-5);}
   }
   if(e.tailBanterIndex!==undefined)check(integer(e.tailBanterIndex));
   if(e.tailTauntAt!==undefined)check(finite(e.tailTauntAt)&&e.tailTauntAt>=0);
   if(e.tailWalkDistance!==undefined)check(finite(e.tailWalkDistance)&&e.tailWalkDistance>=0);
   if(e.tailMoving!==undefined)check(typeof e.tailMoving==='boolean');
   if(e.tailReplyPending!==undefined||e.tailWarning===4.2)check(typeof e.tailReplyPending==='boolean');
   if(e.tailWarning!==undefined||e.phase==='tail_windup')check([1.2,4.2].includes(e.tailWarning));
   if(e.tailReplyPending)check((e.phase==='tail_windup'||interrupted)&&(TRAVESTIA_BANTER.some(pair=>pair[1]===e.tailReply)||TRAVESTIA_BANTER_LEGACY_REPLIES.includes(e.tailReply)));
  }
  if(e.type==='pelican'){
   const interrupted=(e.phase==='charmed'&&e.charmed>0)||(e.phase==='suppressed'&&s.airplane.active);
   const maxAttackTime=Math.max(PELICAN.hug.warning,PELICAN.hug.duration,PELICAN.zodiac.warning,PELICAN.zodiac.duration,PELICAN.tarot.warning,PELICAN.tarot.duration,PELICAN.hug.recovery);
   const limits={chase:0,charmed:interrupted?maxAttackTime:0,suppressed:interrupted?maxAttackTime:0,peli_hug_warning:PELICAN.hug.warning,peli_hug:PELICAN.hug.duration,peli_zodiac_warning:PELICAN.zodiac.warning,peli_zodiac:PELICAN.zodiac.duration,peli_tarot_warning:PELICAN.tarot.warning,peli_tarot:PELICAN.tarot.duration,peli_recover:PELICAN.hug.recovery};
   check(Object.hasOwn(limits,e.phase)&&e.peliTime>=0&&e.peliTime<=limits[e.phase]);
   if(e.phase.startsWith('peli_'))check(e.peliTime>0);
   check(Math.abs(Math.hypot(e.peliDX,e.peliDY)-1)<1e-6&&Math.abs(e.peliX)<=1e8&&Math.abs(e.peliY)<=1e8&&e.peliTravel>=0&&e.peliTravel<=PELICAN.hug.speed*PELICAN.hug.duration+1e-6);
   check(integer(e.peliAttackCount)&&integer(e.peliBanterIndex)&&e.peliTauntAt>=0&&e.peliWalkDistance>=0);
   if(e.phase.startsWith('peli_')){
    const kind=['hug','zodiac','tarot'][e.peliAttackCount%3];
    if(e.phase!=='peli_recover')check(e.phase===`peli_${kind}`||e.phase===`peli_${kind}_warning`);
    const travelled=e.phase==='peli_hug'||e.phase==='peli_recover'&&e.peliAttackCount%3===0;
    if(!travelled)check(e.peliTravel===0);
    check(Math.abs(e.x-e.peliX-e.peliDX*e.peliTravel)<1e-5&&Math.abs(e.y-e.peliY-e.peliDY*e.peliTravel)<1e-5);
   }
   check(e.peliReplyTime>=0&&e.peliReplyTime<=PELICAN.replyDelay);
   if(e.peliReplyPending)check(e.peliReplyTime>0&&(PELICAN_BANTER.some(pair=>pair[1]===e.peliReply)||PELICAN_BANTER_LEGACY_REPLIES.includes(e.peliReply)));
   else check(e.peliReplyTime===0);
   check(e.peliReply===''||(PELICAN_BANTER.some(pair=>pair[1]===e.peliReply)||PELICAN_BANTER_LEGACY_REPLIES.includes(e.peliReply)));
  }
  if(e.type==='gas'&&(e.windup>0||e.gasPose>0))check(finite(e.gasDirX)&&Math.abs(e.gasDirX)<=1.001&&finite(e.gasDirY)&&Math.abs(e.gasDirY)<=1.001);
 }
 if(s.opening!==undefined){check(object(s.opening)&&['move','shoot','done'].includes(s.opening.phase)&&finite(s.opening.startedAt)&&s.opening.startedAt>=0&&s.opening.startedAt<=s.elapsed);}
 if(s.deathCause!==undefined){check(s.mode==='gameover'&&s.hp===0);validateDeathCause(s.deathCause,s.elapsed,d.id);}
 physics(s);
 for(const [key,kinds] of [['shots',['bullet','heart','bill']],['vehicles',['car','bike']]])for(const item of s[key]){check(kinds.includes(item.kind)&&Array.isArray(item.hitIds)&&item.hitIds.length<=2000&&item.hitIds.every(id=>integer(id,1)));}
 for(const vehicle of s.vehicles)check(validLamborghiniState(vehicle,s.upg.car||0));
 if(s.vehicles.some(v=>v.carRank!==undefined))check(s.vehicles.filter(v=>v.kind==='car').length<=CAR_TRIP.maxActive);
 for(const shot of s.shots)if(shot.drone!==undefined)check(shot.drone===true&&shot.kind==='heart'&&s.upg.girlfriend===5&&shot.damage===6&&shot.pierce===0);
 for(const shot of s.shots)if(shot.viral!==undefined){check(shot.viral===true&&shot.kind==='heart'&&s.evolutions.viralLove===true&&shot.hitIds.length<3&&new Set(shot.hitIds).size===shot.hitIds.length&&finite(shot.linkX)&&finite(shot.linkY)&&Math.abs(shot.linkX)<=1e8&&Math.abs(shot.linkY)<=1e8&&shot.pierce===0);}
 for(const car of s.vehicles)if(car.billSalvos!==undefined||car.billClock!==undefined){check(car.kind==='car'&&s.evolutions.billionaire===true&&integer(car.billSalvos)&&car.billSalvos<=2&&finite(car.billClock)&&car.billClock>=0&&car.billClock<=.8&&(car.billSalvos>0||car.billClock===0));}
 for(const item of s.drops){check(['xp','coin','gem','heal'].includes(item.kind)&&item.value>=0);if(item.compact!==undefined)check(typeof item.compact==='boolean'&&item.kind==='xp');}
 check(s.drops.filter(item=>item.compact===true).length<=1);
 for(const c of s.chests)check(typeof c.open==='boolean');for(const wave of s.shockwaves)check(typeof wave.hitPlayer==='boolean'&&typeof wave.hitGirl==='boolean');
 for(const option of s.options)check([...EVOLUTIONS.map(u=>u.id),...UPGRADES.map(u=>u.id),'recovery','payday','barrier'].includes(option.id)&&typeof option.name==='string'&&typeof option.desc==='string');
 validateTrophies(s,d.id);validateCharles(s,d.id,base.world);
 if(s.mode==='upgrade')check(s.options.length>0);if(s.mode==='gameover')check(s.hp===0);if(s.mode==='victory')check(s.elapsed>=survivalDuration(s)&&!s.endless);
 if(s.mode==='dialogue'){const ui=snapshot.dialogue;check(object(ui)&&Array.isArray(ui.lines)&&ui.lines.length>0&&ui.lines.length<=100&&integer(ui.index)&&ui.index<ui.lines.length);for(const line of ui.lines)check(object(line)&&typeof line.who==='string'&&typeof line.text==='string');}else check(snapshot.dialogue===null);
 validateEncounterDialogue(d.encounters,s,d.id,snapshot.dialogue);
 if(s.charles&&s.charles.phase!=='complete'&&s.mode==='dialogue')check(d.encounters.active?.actorType==='charles');
 return snapshot;
}
export function captureRun(game,dialogue=null){
 const data={};for(const key of INTERNAL)data[key]=game[key];if(game.lastCrowReaction!==undefined)data.lastCrowReaction=game.lastCrowReaction;data.s=game.s;
 const active=game.encounters.active;
 if(active)dialogue={lines:active.lines,index:active.index};
 const snapshot=copy({version:VERSION,game:data,dialogue:game.s.mode==='dialogue'?dialogue:null});
 // Terminal events return before the engine's usual end-of-step capacity trim.
 // Apply that same policy to the detached checkpoint, never to live state.
 snapshot.game.s.drops=compactDrops(snapshot.game.s,game.world);
 for(const [key,cap] of Object.entries(CAPS))if(!['options','drops'].includes(key)&&snapshot.game.s[key]?.length>cap)snapshot.game.s[key]=key==='chests'?trimTrophyChests(snapshot.game.s,cap):snapshot.game.s[key].slice(-cap);
 validate(snapshot);check(JSON.stringify(snapshot).length<=MAX_BYTES);return snapshot;
}
export function restoreRun(snapshot,{onEvent=()=>{}}={}){
 const validated=validate(copy(snapshot)),d=validated.game;
 const game=new Game({difficulty:d.s.difficulty,seed:d.seed,onEvent});for(const key of INTERNAL)game[key]=d[key];if(d.lastCrowReaction!==undefined)game.lastCrowReaction=d.lastCrowReaction;
 game.discoveryCooldowns=new Map(d.discoveryCooldowns);game.eventSeen=new Set(d.eventSeen);game.state=game.s=d.s;for(const key of ['shots','vehicles'])for(const item of game.s[key])item.hitIds=new Set(item.hitIds);
 if(game.s.charles)game.world.setDestroyed(game.s.charles.destroyed);
 game.recalculate();game.world.update(game.s.x,game.s.y);return game;
}
function totals(v){check(object(v)&&finite(v.best)&&v.best>=0&&integer(v.lifetime)&&integer(v.coins));return v;}
function validateRecord(v){
 tree(v);check(Number.isInteger(v.version)&&v.version>=1&&v.version<=VERSION&&integer(v.revision,1));totals(v.totals);if(v.replay===undefined)v.replay=createReplayState(v.totals.best);else validateReplayState(v.replay);check(object(v.run)&&typeof v.run.id==='string'&&v.run.id.length>0&&v.run.id.length<200);validate(v.run.snapshot);v.version=VERSION;check(integer(v.run.creditedKills)&&integer(v.run.creditedCoins)&&v.run.creditedKills<=v.run.snapshot.game.s.kills&&v.run.creditedCoins<=totalEarnedCoins(v.run.snapshot.game.s));return v;
}
function beginRecord(store,id,snapshot,legacy={best:0,lifetime:0,coins:0},previous=null){return store.transaction(old=>{
  const accumulated=old?{...old.totals}:totals(copy(legacy)),replay=old?copy(old.replay):createReplayState(accumulated.best);
  if(old){
   if(previous)check(previous.id===old.run.id);
   const source=previous?validate(copy(previous.snapshot)):old.run.snapshot,s=source.game.s;
   check(s.kills>=old.run.creditedKills&&totalEarnedCoins(s)>=old.run.creditedCoins);
   accumulated.best=Math.max(accumulated.best,s.elapsed);accumulated.lifetime+=s.kills-old.run.creditedKills;accumulated.coins+=totalEarnedCoins(s)-old.run.creditedCoins;
   recordReplay(replay,old.run.id,source,{replaced:true});
  }
  return {totals:accumulated,replay,run:{id,snapshot:snapshot(),creditedKills:0,creditedCoins:0}};
 });}
function checkpointRecord(store,id,snapshot,{credit=false}={}){return store.transaction(old=>{
 if(!old||old.run.id!==id)throw Error('conflict');const captured=snapshot(),s=captured.game.s;check(s.kills>=old.run.creditedKills&&totalEarnedCoins(s)>=old.run.creditedCoins);const next={totals:{...old.totals},replay:copy(old.replay),run:{...old.run,snapshot:captured}};
 // Preserve a saved survival victory even when the next write is already endless.
 if(!old.run.snapshot.game.s.endless&&s.endless)recordReplay(next.replay,id,old.run.snapshot);
 if(credit){recordReplay(next.replay,id,captured);next.totals.best=Math.max(next.totals.best,s.elapsed);next.totals.lifetime+=s.kills-old.run.creditedKills;next.totals.coins+=totalEarnedCoins(s)-old.run.creditedCoins;next.run.creditedKills=s.kills;next.run.creditedCoins=totalEarnedCoins(s);}return next;
 });}
// Run, cumulative totals, and credit markers share ONE atomic localStorage write.
// Optimistic revision checks detect stale tabs; callers must stop autosaving on conflict.
// Browser integration uses LockedRunStore below for cross-tab serialization.
export class RunStore {
 constructor(storage,key='toma-popescu-run-v1'){this.storage=storage;this.key=key;this.revision=null;}
 read(){try{const raw=this.storage.getItem(this.key);if(raw===null){this.revision=0;return {status:'empty'};}if(raw.length>MAX_BYTES)return {status:'corrupt'};let v;try{v=validateRecord(JSON.parse(raw));}catch{return {status:'corrupt'};}this.revision=v.revision;return {status:'ready',value:v};}catch{return {status:'unavailable'};}}
 transaction(change){
 const expected=this.revision;const current=this.read();if(!['empty','ready'].includes(current.status))return {ok:false,reason:current.status};if(expected!==null&&expected!==this.revision){this.revision=expected;return {ok:false,reason:'conflict'};}
 try{const next=change(current.value);next.version=VERSION;next.revision=this.revision+1;validateRecord(next);const raw=JSON.stringify(next);check(raw.length<=MAX_BYTES);this.storage.setItem(this.key,raw);this.revision=next.revision;return {ok:true,value:next};}catch(e){return {ok:false,reason:e.message==='conflict'?'conflict':'write-failed'};}
 }
 begin(id,game,legacy,dialogue=null,previous=null){return beginRecord(this,id,()=>captureRun(game,dialogue),legacy,previous);}
 checkpoint(id,game,options={}){return checkpointRecord(this,id,()=>captureRun(game,options.dialogue??null),options);}

}
export class Autosave {
 constructor(write,now=()=>Date.now(),interval=5000){this.write=write;this.now=now;this.interval=interval;this.last=-Infinity;this.result=null;}
 tick(){if(this.now()-this.last>=this.interval)return this.flush();return this.result;}
 flush(){this.last=this.now();try{this.result=this.write();}catch{this.result={ok:false,reason:'write-failed'};}return this.result;}
}
// Use this adapter for browser writes. Fail closed when Web Locks is unavailable;
// never claim a successful multi-tab-safe save when the platform cannot lock it.
export class LockedRunStore {
 constructor(storage,locks,key='toma-popescu-run-v1'){this.store=new RunStore(storage,key);this.locks=locks;}
 read(){return this.store.read();}
 async write(method,args){
  if(typeof this.locks?.request!=='function')return {ok:false,reason:'locking-unavailable'};
  try{
   // Freeze and validate once before waiting. Restoring a throwaway Game and
   // recapturing it here repeated two full validations every five seconds.
   const dialogue=method==='begin'?args[3]:args[2]?.dialogue;
   const snapshot=captureRun(args[1],dialogue),options=args[2]===undefined?undefined:copy(args[2]);
   const previous=args[4]===undefined?undefined:copy(args[4]);
   // A queued start or checkpoint may lose its session owner before this
   // lock is granted. The runtime guard is never serialized; a discarded
   // or replaced session must not write after newer navigation completes.
   const mayCommit=method==='begin'?args[5]:args[3];
   return await this.locks.request(this.store.key,()=>{
    if(mayCommit&&!mayCommit())return {ok:false,reason:'cancelled'};
    return method==='begin'?beginRecord(this.store,args[0],()=>snapshot,options,previous)
     :checkpointRecord(this.store,args[0],()=>snapshot,options);
   });
  }catch{return {ok:false,reason:'unavailable'};}
 }
 begin(...args){return this.write('begin',args);}
 checkpoint(...args){return this.write('checkpoint',args);}
}
