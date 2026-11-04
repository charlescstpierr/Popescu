// Recreate historical fixtures using the two unchanged published checkouts.
// node scripts/generate-v12-save-fixtures.mjs /path/to/0d6e0f9 /path/to/da6a6ea8
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
assert.equal(process.argv.length,4,'Pass the pre-Lamborghini and Lamborghini v12 checkout directories.');
const dir=new URL('../tests/fixtures/',import.meta.url);
const memory=()=>{const data=new Map();return{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
for(const [folder,sha,cases] of [
 [process.argv[2],'0d6e0f99214a5024bbe926707fad209a1d520d33',[['legacy',0]]],
 [process.argv[3],'da6a6ea8d519977d79cd3107ad6e1c04859476da',[['delay',0],['turn',1.7],['return',2.3],['dialogue',0]]],
]){
 const root=pathToFileURL(resolve(folder)+'/dist/');
 const {Game}=await import(new URL('engine.js',root)),{RunStore,captureRun}=await import(new URL('run-save.js',root)),{beginSpeechScene,enqueueSpeech}=await import(new URL('speech.js',root));
 assert.equal(captureRun(new Game({seed:42})).version,12,'Do not generate historical fixtures with the current engine.');
 for(const [label,time] of cases){
  const storage=memory(),store=new RunStore(storage),victory=new Game({seed:12});
  victory.s.elapsed=1200;victory.s.mode='victory';victory.s.kills=60;victory.s.coins=20;
  if(!store.begin('v12-victory',victory,{best:1400,lifetime:3,coins:5}).ok)throw Error('victory');
  if(!store.checkpoint('v12-victory',victory,{credit:true}).ok)throw Error('credit victory');
  const g=new Game({seed:42});g.s.elapsed=123;g.s.kills=17;g.s.coins=9;g.s.companion=true;g.s.upg={car:5,money:3,girlfriend:5};g.s.evolutions.billionaire=true;g.s.trophies.chosen={travestia:'star'};g.recalculate();
  g.timers.car=0;g.weapons(0);if(time)g.updateVehicles(time);
   g.clearSpeech();if(!beginSpeechScene(g,'save-migration',[{who:'TOMA',text:'Mon char revient me chercher.'},{who:'BLONDE IA',text:'Garde ta place.'}],{remember:true}))throw Error('scene');
  if(!enqueueSpeech(g,'SYSTÈME','Attention au convoi.',{urgent:true,encounter:true}))throw Error('urgent');
  if(label==='dialogue')g.s.mode='dialogue';else g.pause();
  const dialogue=label==='dialogue'?{lines:[{who:'TOMA',text:'Je reprends ici.'},{who:'BLONDE IA',text:'Pas encore.'}],index:1}:null;
  const id=`real-v12-${label}`;
  if(!store.begin(id,g,undefined,dialogue).ok)throw Error('begin '+label);
  if(!store.checkpoint(id,g,{credit:true,dialogue}).ok)throw Error('credit '+label);
  g.s.kills+=2;g.s.coins+=1;
  if(!store.checkpoint(id,g,{dialogue}).ok)throw Error('checkpoint '+label);
  const raw=storage.getItem(store.key);writeFileSync(new URL(`runstore-v12-${label}.json`,dir),raw+'\n');
  console.log(label,sha,raw.length,JSON.parse(raw).run.snapshot.game.s.vehicles.map(v=>[v.carPhase,v.carDelay]));
 }
}
