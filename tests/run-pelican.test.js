import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {PELICAN,PELICAN_BANTER,pelicanCards} from '../dist/pelican.js';
import {captureRun,restoreRun,RunStore} from '../dist/run-save.js';

const fields=['peliTime','peliDX','peliDY','peliX','peliY','peliTravel','peliAttackCount','peliHitPlayer','peliHitGirl','peliReplyPending','peliBanterIndex','peliTauntAt','peliReply','peliReplyTime','peliWalkDistance','peliMoving'];
const limits={peli_hug_warning:1.25,peli_hug:.65,peli_zodiac_warning:1.4,peli_zodiac:1.25,peli_tarot_warning:1.1,peli_tarot:2.2,peli_recover:1.1};
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};};
function setup(){
 const events=[],g=new Game({seed:42,onEvent:(type,payload)=>events.push([type,payload])});
 for(const key in g.timers)g.timers[key]=100000;g.bossDirector.remaining=200;g.nextEvent=100000;g.world.collides=()=>false;
 g.s.companion=true;g.s.girl.x=0;g.s.girl.y=0;g.recalculate();
 const e=g.spawnEnemy('pelican',-100,0);return {g,e,events};
}
function advance(g,seconds){for(let t=0;t<seconds-1e-7;t+=.01){g.s.elapsed+=.01;g.updateEnemies(.01);}}
function phase(g,e,name,time=limits[name]/2){const kind=['hug','zodiac','tarot'].indexOf(name.split('_')[1]);Object.assign(e,{phase:name,peliTime:time,peliDX:1,peliDY:0,peliX:e.x,peliY:e.y,peliTravel:0});if(kind>=0)e.peliAttackCount=kind;}
function resume(g){const events=[],copy=restoreRun(captureRun(g),{onEvent:(type,payload)=>events.push([type,payload])});copy.world.collides=()=>false;return {copy,events};}

test('pelican initializes every persistable attack field alongside the shared boss schedule',()=>{
 const g=new Game({seed:42}),e=g.spawnEnemy('pelican',123,-45);
 assert.ok(g.bossDirector.remaining>=150&&g.bossDirector.remaining<=210);
 for(const key of fields)assert.ok(Object.hasOwn(e,key),key);
 assert.equal(e.peliX,123);assert.equal(e.peliY,-45);assert.equal(e.peliDX,1);assert.equal(e.peliDY,0);
 assert.equal(captureRun(g).version,10);
});
for(const [name,time] of [['peli_hug_warning',.7],['peli_hug',.4],['peli_zodiac_warning',.9],['peli_zodiac',.7],['peli_tarot_warning',.6],['peli_tarot',.6],['peli_recover',.5]])test(`${name} resumes exactly without restarting or skipping the attack`,()=>{
 const {g,e}=setup();phase(g,e,name,time);
 const {copy}=resume(g);assert.deepEqual(captureRun(copy),captureRun(g));
 advance(g,.35);advance(copy,.35);assert.deepEqual(captureRun(copy),captureRun(g));
});
for(const [name,elapsed] of [['peli_hug_warning',.4],['peli_hug',.2],['peli_zodiac',.4],['peli_tarot',1.5]])test(`naturally reached ${name} resumes real partial progress deterministically`,()=>{
 const {g,e}=setup();let frames=0;
 while(e.phase!==name&&frames++<2500)advance(g,.01);
 assert.equal(e.phase,name);advance(g,elapsed);assert.equal(e.phase,name);
 if(name==='peli_hug')assert.ok(e.peliTravel>0&&e.peliTravel<PELICAN.hug.speed*PELICAN.hug.duration);
 if(name==='peli_tarot')assert.ok(e.peliTime<PELICAN.tarot.duration/2,'cards are on their return path');
 const {copy}=resume(g);assert.deepEqual(pelicanCards(copy.s.enemies[0]),pelicanCards(e));
 advance(g,.7);advance(copy,.7);assert.deepEqual(captureRun(copy),captureRun(g));
});
for(const attack of ['peli_hug','peli_zodiac','peli_tarot'])test(`${attack} hit flags survive restoring without repeat player or companion damage`,()=>{
 const {g,e}=setup();phase(g,e,attack,.4);e.peliHitPlayer=true;e.peliHitGirl=true;
 const {copy}=resume(g),hp=copy.s.hp,girlHp=copy.s.girl.hp;copy.s.invulnerable=0;advance(copy,.3);
 assert.equal(copy.s.hp,hp);assert.equal(copy.s.girl.hp,girlHp);
});
test('pause freezes a restored attack, reply clock, scheduler and walk frame',()=>{
 const {g,e}=setup();phase(g,e,'peli_tarot',.6);Object.assign(e,{peliWalkDistance:47,peliMoving:true,peliReplyPending:true,peliReplyTime:.5,peliReply:PELICAN_BANTER[0][1]});g.pause();
 const {copy}=resume(g),saved=captureRun(copy);copy.update(.2,{x:1,y:0});assert.deepEqual(captureRun(copy),saved);
 assert.equal(copy.bossDirector.remaining,200);assert.equal(copy.s.enemies[0].peliWalkDistance,47);assert.equal(copy.spawnEnemy('pelican',200,0),null);
});
for(const effect of ['charm','airplane'])test(`${effect} interrupts restored attack state before it can hit`,()=>{
 const {g,e}=setup();phase(g,e,'peli_tarot',.6);Object.assign(e,{peliReplyPending:true,peliReplyTime:.02,peliReply:PELICAN_BANTER[0][1]});
 if(effect==='charm'){e.charmed=3;e.phase='charmed';}else{g.s.airplane.active=true;e.phase='suppressed';}
 const {copy,events}=resume(g),hp=copy.s.hp;copy.updateEnemies(.01);const boss=copy.s.enemies[0];
 assert.equal(boss.peliTime,0);assert.equal(boss.peliReplyPending,false);assert.equal(boss.peliReplyTime,0);assert.equal(copy.s.hp,hp);advance(copy,.5);assert.equal(events.filter(([type,payload])=>type==='bark'&&payload.who==='TOMA').length,0);
});
test('nonblocking reply survives a completed attack and resumes once in chase',()=>{
 const {g,e}=setup();g.updateEnemies(.01);assert.equal(e.peliReplyPending,true);assert.equal(e.peliReplyTime,PELICAN.replyDelay);
 advance(g,3.2);assert.equal(e.phase,'chase');assert.ok(e.peliReplyPending);const {copy,events}=resume(g);
 advance(g,1.4);advance(copy,1.4);assert.deepEqual(captureRun(copy),captureRun(g));
 assert.equal(events.filter(([type,payload])=>type==='bark'&&payload.who==='TOMA'&&payload.text===PELICAN_BANTER[0][1]).length,1);
 advance(copy,1);assert.equal(events.filter(([type,payload])=>type==='bark'&&payload.who==='TOMA').length,1);
});
for(const name of ['chase',...Object.keys(limits)])test(`pending reply remains independent of ${name} during save and resume`,()=>{
 const {g,e}=setup();phase(g,e,name,name==='chase'?0:limits[name]/2);Object.assign(e,{peliReplyPending:true,peliReplyTime:.2,peliReply:PELICAN_BANTER[0][1]});
 const {copy,events}=resume(g);advance(g,.3);advance(copy,.3);assert.deepEqual(captureRun(copy),captureRun(g));
 assert.equal(events.filter(([type,payload])=>type==='bark'&&payload.who==='TOMA'&&payload.text===PELICAN_BANTER[0][1]).length,1);
});
test('every required pelican state field must exist before restoring',()=>{
 for(const key of fields){const {g}=setup(),saved=captureRun(g);delete saved.game.s.enemies[0][key];assert.throws(()=>restoreRun(saved),key);}
});
test('pelican phase timers must be positive, finite and bounded without softlock states',()=>{
 for(const name of Object.keys(limits))for(const value of [0,-.1,limits[name]+.01,null,'1']){
  const {g,e}=setup();phase(g,e,name);const saved=captureRun(g);saved.game.s.enemies[0].peliTime=value;assert.throws(()=>restoreRun(saved),`${name}: ${value}`);
 }
 for(const patch of [{phase:'peli_unknown'},{phase:'chase',peliTime:1},{phase:'charmed',peliTime:1,charmed:0},{phase:'suppressed',peliTime:1}]){
  const {g}=setup(),saved=captureRun(g);Object.assign(saved.game.s.enemies[0],patch);assert.throws(()=>restoreRun(saved));
 }
});
test('pelican vectors, origins, travel, indexes and reply clocks reject malformed fields',()=>{
 const patches=[{peliDX:0,peliDY:0},{peliDX:2},{peliX:1e9},{peliY:-1e9},{peliTravel:-1},{peliTravel:350*.65+.01},{peliAttackCount:.5},{peliBanterIndex:-1},{peliTauntAt:-1},{peliHitPlayer:0},{peliHitGirl:null},{peliReplyPending:'yes'},{peliReplyTime:-1},{peliReplyTime:4.41},{peliReplyPending:true,peliReplyTime:0},{peliReplyPending:true,peliReplyTime:1,peliReply:'unrecognized reply'},{peliWalkDistance:-1},{peliMoving:1}];
 for(const patch of patches){const {g}=setup(),saved=captureRun(g);Object.assign(saved.game.s.enemies[0],patch);assert.throws(()=>restoreRun(saved),JSON.stringify(patch));}
 for(const value of [undefined,null,'360',-1]){const saved=captureRun(new Game());if(value===undefined)delete saved.game.bossDirector.remaining;else saved.game.bossDirector.remaining=value;assert.throws(()=>restoreRun(saved));}
});
test('duplicate live pelicans are rejected instead of creating a second boss on restore',()=>{
 const {g}=setup(),saved=captureRun(g),other=structuredClone(saved.game.s.enemies[0]);other.id=saved.game.id++;saved.game.s.enemies.push(other);assert.throws(()=>restoreRun(saved));
});
for(const version of [1,2,3,4])test(`v${version} migrates into the shared boss scheduler without losing progress or discoveries`,()=>{
 const g=new Game({seed:42});g.spawnEnemy('normal',100,100);g.s.elapsed=123;g.s.hp=67;g.s.kills=7;g.s.coins=11;
 g.discoveryCooldowns.set('site',250);g.discoveryContact='site';g.eventSeen.add('phone');
 const old=captureRun(g);old.version=version;delete old.game.timers.pelican;
 if(version<=3){delete old.game.timers.animal;delete old.game.timers.animalIndex;}
 if(version===1){delete old.game.timers.travestia;for(const enemy of old.game.s.enemies)for(const key of ['tailTime','tailFaceX','tailHitPlayer','tailHitGirl'])delete enemy[key];}
 const original=structuredClone(old),copy=restoreRun(old),saved=captureRun(copy);
 assert.deepEqual(old,original,'migration must not mutate the supplied snapshot');assert.equal(saved.version,10);assert.ok(copy.bossDirector.remaining>5&&copy.bossDirector.remaining<=210);
 assert.equal(copy.s.elapsed,123);assert.equal(copy.s.hp,67);assert.equal(copy.s.kills,7);assert.equal(copy.s.coins,11);
 assert.deepEqual([...copy.discoveryCooldowns],[['site',250]]);assert.equal(copy.discoveryContact,'site');assert.ok(copy.eventSeen.has('phone'));
});
test('legacy versions cannot smuggle new pelican enemies or attack state through migration',()=>{
 for(const version of [1,2,3,4]){
  const {g}=setup(),saved=captureRun(g);saved.version=version;assert.throws(()=>restoreRun(saved));
  const normal=new Game();normal.spawnEnemy('normal',20,20);const old=captureRun(normal);old.version=version;old.game.s.enemies[0].peliTime=1;assert.throws(()=>restoreRun(old));
 }
});
test('v4 store envelope upgrades atomically and keeps cumulative credits intact',()=>{
 const storage=memory(),originalStore=new RunStore(storage),g=new Game({seed:42});g.s.kills=7;g.s.coins=11;g.s.elapsed=123;
 assert.ok(originalStore.begin('legacy-v4',g,{best:100,lifetime:20,coins:30}).ok);assert.ok(originalStore.checkpoint('legacy-v4',g,{credit:true}).ok);
 const old=JSON.parse(storage.getItem(originalStore.key));old.version=4;old.run.snapshot.version=4;delete old.run.snapshot.game.timers.pelican;
 const raw=JSON.stringify(old);storage.setItem(originalStore.key,raw);const store=new RunStore(storage),read=store.read();
 assert.equal(read.status,'ready');assert.equal(read.value.version,10);assert.equal(read.value.run.snapshot.version,10);assert.deepEqual(read.value.totals,old.totals);assert.equal(storage.getItem(store.key),raw);
 const copy=restoreRun(read.value.run.snapshot);assert.ok(store.checkpoint('legacy-v4',copy,{credit:true}).ok);
 const written=JSON.parse(storage.getItem(store.key));assert.equal(written.version,10);assert.equal(written.run.snapshot.version,10);assert.equal(written.revision,old.revision+1);assert.deepEqual(written.totals,old.totals);
});
test('real pre-animal v3 envelope retains its Travestia state and both scheduler migrations',()=>{
 const raw=readFileSync(new URL('./fixtures/runstore-v3.json',import.meta.url),'utf8'),old=JSON.parse(raw),storage=memory();storage.setItem('toma-popescu-run-v1',raw);
 const store=new RunStore(storage),read=store.read();assert.equal(read.status,'ready');assert.deepEqual(read.value.totals,old.totals);
 const copy=restoreRun(read.value.run.snapshot);assert.equal(copy.timers.animal,12);assert.ok(copy.bossDirector.remaining>5&&copy.bossDirector.remaining<=210);assert.equal(copy.s.enemies[0].type,'travestia');
 assert.ok(store.checkpoint(old.run.id,copy,{credit:true}).ok);assert.deepEqual(store.read().value.totals,old.totals);
});
test('invalid migrated boss snapshots never rewrite the atomic store record',()=>{
 const {g}=setup(),snapshot=captureRun(g),storage=memory();snapshot.version=4;
 const raw=JSON.stringify({version:4,revision:1,totals:{best:0,lifetime:0,coins:0},run:{id:'bad',snapshot,creditedKills:0,creditedCoins:0}});storage.setItem('toma-popescu-run-v1',raw);
 const store=new RunStore(storage);assert.equal(store.read().status,'corrupt');assert.equal(store.begin('replacement',new Game()).ok,false);assert.equal(storage.getItem(store.key),raw);
});
test('locked pelican hazards cannot restore detached from the boss or their announced corridor',()=>{
 for(const name of Object.keys(limits))for(const patch of [{peliX:100000},{peliY:-100000},{x:12},{y:12}]){
  const {g,e}=setup();phase(g,e,name);const saved=captureRun(g);Object.assign(saved.game.s.enemies[0],patch);assert.throws(()=>restoreRun(saved),`${name}: ${JSON.stringify(patch)}`);
 }
});
test('warnings and stationary attacks reject travel even when the origin is shifted to match',()=>{
 for(const name of ['peli_hug_warning','peli_zodiac_warning','peli_zodiac','peli_tarot_warning','peli_tarot']){
  const {g,e}=setup();phase(g,e,name);const saved=captureRun(g),boss=saved.game.s.enemies[0];boss.peliTravel=10;boss.x=boss.peliX+10;assert.throws(()=>restoreRun(saved),name);
 }
});
test('recovery preserves real hug travel but rejects travel invented after zodiac or tarot',()=>{
 const {g,e}=setup();phase(g,e,'peli_recover');e.peliTravel=50;e.x=e.peliX+50;assert.doesNotThrow(()=>restoreRun(captureRun(g)));
 for(const count of [1,2]){const saved=captureRun(g);saved.game.s.enemies[0].peliAttackCount=count;assert.throws(()=>restoreRun(saved));}
});

test('warning and active phases must match the saved attack counter throughout repeated cycles',()=>{
 for(const [index,kind] of ['hug','zodiac','tarot'].entries())for(const suffix of ['', '_warning']){
  const {g,e}=setup();phase(g,e,`peli_${kind}${suffix}`);e.peliAttackCount=index+3;
  const valid=captureRun(g);assert.doesNotThrow(()=>restoreRun(valid));
  for(const offset of [1,2]){const bad=structuredClone(valid);bad.game.s.enemies[0].peliAttackCount+=offset;assert.throws(()=>restoreRun(bad),`${kind}${suffix} with counter ${index+3+offset}`);}
 }
});
for(const [index,kind] of ['hug','zodiac','tarot'].entries())test(`${kind} resumes through recovery with valid phase/counter checkpoints`,()=>{
 const {g,e}=setup();phase(g,e,`peli_${kind}`,.4);e.peliAttackCount=index+3;
 let copy=resume(g).copy;
 for(let frame=0;frame<200;frame++){advance(g,.01);advance(copy,.01);if(frame%20===0){copy=resume(copy).copy;assert.deepEqual(captureRun(copy),captureRun(g));}}
 assert.equal(copy.s.enemies[0].phase,'chase');assert.equal(copy.s.enemies[0].peliAttackCount,index+4);
});
