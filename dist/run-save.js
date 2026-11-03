// Versioned, validated persistence for the approved save/resume flow.
import {DISCOVERIES} from './discoveries.js';
import {Game} from './engine.js';
import {UPGRADES,DIFFICULTIES} from './content.js';
const VERSION=1;
const MAX_BYTES=1500000;
const CAPS={enemies:300,shots:320,drops:260,clouds:90,particles:200,vehicles:10,pulses:36,chests:12,shockwaves:12,options:3};
const INTERNAL=['seed','rng','id','viewport','timers','eventSeen','nextEvent','lastHit','barkIndex','stuntRng','stuntCharge','runStreak','stuntWait','pendingStuntReply','pendingRivalReply','rivalIndex','rivalBarkIndex','lastRivalBark','rivalRng','speechUntil','discoveryCooldowns','discoveryContact'];
const MODES=['playing','paused','upgrade','dialogue','victory','gameover'];
const ENEMIES=['normal','sprinter','gas','tank','jealous','explosive','matriarch','orangutan','rival_rooster','rival_goat'];
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
function validate(snapshot){
 tree(snapshot);check(snapshot.version===VERSION&&object(snapshot.game));const d=snapshot.game,s=d.s;check(object(s)&&Object.hasOwn(DIFFICULTIES,s.difficulty));const base=new Game({difficulty:s.difficulty,seed:d.seed});shape(s,base.s);shape(d.viewport,base.viewport);shape(d.timers,base.timers);
 for(const key of INTERNAL){if(['viewport','timers','eventSeen','pendingStuntReply','pendingRivalReply','discoveryCooldowns','discoveryContact'].includes(key))continue;check(finite(d[key]));}
 check(Number.isInteger(d.seed)&&d.seed>=-2147483648&&d.seed<=2147483647);check(Number.isInteger(d.rng)&&d.rng>=-2147483648&&d.rng<=2147483647);check(integer(d.id,1)&&integer(d.stuntRng)&&d.stuntRng<=4294967295&&integer(d.rivalRng)&&d.rivalRng<=4294967295);
 for(const key of ['barkIndex','rivalIndex','rivalBarkIndex'])check(integer(d[key]));if(d.lastCrowReaction!==undefined)check(finite(d.lastCrowReaction));
 check(d.viewport.width>=240&&d.viewport.width<=1600&&d.viewport.height>=320&&d.viewport.height<=1600);check(Array.isArray(d.eventSeen)&&d.eventSeen.length<=100&&d.eventSeen.every(x=>typeof x==='string'));
 for(const key of ['pendingStuntReply','pendingRivalReply']){const p=d[key];check(p===null||object(p)&&finite(p.at)&&integer(p.index));if(key==='pendingRivalReply'&&p)check(integer(p.id,1)&&['rival_rooster','rival_goat'].includes(p.type)&&typeof p.ally==='boolean');}
 check(Array.isArray(d.discoveryCooldowns)&&d.discoveryCooldowns.length<=256);
 for(const entry of d.discoveryCooldowns)check(Array.isArray(entry)&&entry.length===2&&typeof entry[0]==='string'&&finite(entry[1])&&entry[1]>=0);
 check(d.discoveryContact===null||typeof d.discoveryContact==='string');
 check(object(s.discovery)&&integer(s.discovery.count));
 const active=s.discovery.active;
 if(active!==null){check(object(active)&&Object.hasOwn(DISCOVERIES,active.kind));const def=DISCOVERIES[active.kind];check(typeof active.id==='string'&&active.duration===def.duration&&finite(active.remaining)&&active.remaining>=0&&active.remaining<=def.duration&&active.name===def.name&&active.description===def.description&&active.color===def.color);}
 const nearby=s.discovery.nearby;if(nearby!==null)check(object(nearby)&&Object.hasOwn(DISCOVERIES,nearby.discoveryType)&&typeof nearby.id==='string'&&finite(nearby.x)&&finite(nearby.y)&&finite(nearby.cooldown)&&nearby.cooldown>=0&&typeof nearby.needsExit==='boolean');
 check(MODES.includes(s.mode)&&s.elapsed>=0&&s.maxhp>0&&s.hp>=0&&s.hp<=s.maxhp&&s.xp>=0&&s.xpNeed>0&&s.shield>=0);for(const k of ['level','kills','coins','gems'])check(integer(s[k],k==='level'?1:0));
 check(integer(s.stunt.count));
 check(s.girl.maxhp>0&&s.stunt.duration>0&&s.stunt.progress>=0&&s.stunt.progress<=1);
 check(object(s.upg));for(const [id,rank] of Object.entries(s.upg)){const def=UPGRADES.find(u=>u.id===id);check(def&&integer(rank)&&rank<=def.max);}
 for(const [key,cap] of Object.entries(CAPS)){check(Array.isArray(s[key])&&s[key].length<=cap);for(const item of s[key]){check(object(item));for(const field of (REQUIRED[key]||'').split(' ').filter(Boolean))check(finite(item[field]));}}
 const actorIds=new Set();
 for(const e of s.enemies){
  check(ENEMIES.includes(e.type)&&integer(e.id,1)&&e.id<d.id&&e.maxhp>0&&e.r>0&&!actorIds.has(e.id));actorIds.add(e.id);
  const template=base.spawnEnemy(e.type,0,0);shape(e,template);check(e.r===template.r&&integer(e.banterCount));
  if(e.type==='gas'&&(e.windup>0||e.gasPose>0))check(finite(e.gasDirX)&&Math.abs(e.gasDirX)<=1.001&&finite(e.gasDirY)&&Math.abs(e.gasDirY)<=1.001);
 }
 physics(s);
 for(const [key,kinds] of [['shots',['bullet','heart','bill']],['vehicles',['car','bike']]])for(const item of s[key]){check(kinds.includes(item.kind)&&Array.isArray(item.hitIds)&&item.hitIds.length<=2000&&item.hitIds.every(id=>integer(id,1)));}
 for(const item of s.drops)check(['xp','coin','gem','heal'].includes(item.kind)&&item.value>=0);
 for(const c of s.chests)check(typeof c.open==='boolean');for(const wave of s.shockwaves)check(typeof wave.hitPlayer==='boolean'&&typeof wave.hitGirl==='boolean');
 for(const option of s.options)check([...UPGRADES.map(u=>u.id),'recovery','payday','barrier'].includes(option.id)&&typeof option.name==='string'&&typeof option.desc==='string');
 if(s.mode==='upgrade')check(s.options.length>0);if(s.mode==='gameover')check(s.hp===0);if(s.mode==='victory')check(s.elapsed>=1200&&!s.endless);
 if(s.mode==='dialogue'){const ui=snapshot.dialogue;check(object(ui)&&Array.isArray(ui.lines)&&ui.lines.length>0&&ui.lines.length<=100&&integer(ui.index)&&ui.index<ui.lines.length);for(const line of ui.lines)check(object(line)&&typeof line.who==='string'&&typeof line.text==='string');}else check(snapshot.dialogue===null);
 return snapshot;
}
export function captureRun(game,dialogue=null){
 const data={};for(const key of INTERNAL)data[key]=game[key];if(game.lastCrowReaction!==undefined)data.lastCrowReaction=game.lastCrowReaction;data.s=game.s;
 const snapshot=copy({version:VERSION,game:data,dialogue:game.s.mode==='dialogue'?dialogue:null});
 // Terminal events return before the engine's usual end-of-step capacity trim.
 // Apply that same policy to the detached checkpoint, never to live state.
 for(const [key,cap] of Object.entries(CAPS))if(key!=='options'&&snapshot.game.s[key]?.length>cap)snapshot.game.s[key]=snapshot.game.s[key].slice(-cap);
 validate(snapshot);check(JSON.stringify(snapshot).length<=MAX_BYTES);return snapshot;
}
export function restoreRun(snapshot,{onEvent=()=>{}}={}){
 const validated=validate(copy(snapshot)),d=validated.game;
 const game=new Game({difficulty:d.s.difficulty,seed:d.seed,onEvent});for(const key of INTERNAL)game[key]=d[key];if(d.lastCrowReaction!==undefined)game.lastCrowReaction=d.lastCrowReaction;
 game.discoveryCooldowns=new Map(d.discoveryCooldowns);game.eventSeen=new Set(d.eventSeen);game.state=game.s=d.s;for(const key of ['shots','vehicles'])for(const item of game.s[key])item.hitIds=new Set(item.hitIds);
 game.recalculate();game.world.update(game.s.x,game.s.y);return game;
}
function totals(v){check(object(v)&&finite(v.best)&&v.best>=0&&integer(v.lifetime)&&integer(v.coins));return v;}
function validateRecord(v){
 tree(v);check(v.version===VERSION&&integer(v.revision,1));totals(v.totals);check(object(v.run)&&typeof v.run.id==='string'&&v.run.id.length>0&&v.run.id.length<200);validate(v.run.snapshot);check(integer(v.run.creditedKills)&&integer(v.run.creditedCoins)&&v.run.creditedKills<=v.run.snapshot.game.s.kills&&v.run.creditedCoins<=v.run.snapshot.game.s.coins);return v;
}
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
 begin(id,game,legacy={best:0,lifetime:0,coins:0},dialogue=null,previous=null){return this.transaction(old=>{
  const accumulated=old?{...old.totals}:totals(copy(legacy));
  if(old){
   if(previous)check(previous.id===old.run.id);
   const source=previous?validate(copy(previous.snapshot)):old.run.snapshot,s=source.game.s;
   check(s.kills>=old.run.creditedKills&&s.coins>=old.run.creditedCoins);
   accumulated.best=Math.max(accumulated.best,s.elapsed);accumulated.lifetime+=s.kills-old.run.creditedKills;accumulated.coins+=s.coins-old.run.creditedCoins;
  }
  return {totals:accumulated,run:{id,snapshot:captureRun(game,dialogue),creditedKills:0,creditedCoins:0}};
 });}
 checkpoint(id,game,{credit=false,dialogue=null}={}){return this.transaction(old=>{
 if(!old||old.run.id!==id)throw Error('conflict');const s=game.s;check(s.kills>=old.run.creditedKills&&s.coins>=old.run.creditedCoins);const next={totals:{...old.totals},run:{...old.run,snapshot:captureRun(game,dialogue)}};
 if(credit){next.totals.best=Math.max(next.totals.best,s.elapsed);next.totals.lifetime+=s.kills-old.run.creditedKills;next.totals.coins+=s.coins-old.run.creditedCoins;next.run.creditedKills=s.kills;next.run.creditedCoins=s.coins;}return next;
 });}
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
   // Freeze the requested checkpoint before awaiting a lock or any other task.
   const dialogue=method==='begin'?args[3]:args[2]?.dialogue;
   const frozen=[args[0],restoreRun(captureRun(args[1],dialogue))];
   if(args[2]!==undefined)frozen[2]=copy(args[2]);if(args[3]!==undefined)frozen[3]=copy(args[3]);if(args[4]!==undefined)frozen[4]=copy(args[4]);
   return await this.locks.request(this.store.key,()=>this.store[method](...frozen));
  }catch{return {ok:false,reason:'unavailable'};}
 }
 begin(...args){return this.write('begin',args);}
 checkpoint(...args){return this.write('checkpoint',args);}
}
