import {DIFFICULTIES,UPGRADES} from './content.js';
import {EVOLUTIONS,totalEarnedCoins} from './evolutions.js';
import {BOSS_TROPHIES} from './boss-trophies.js';
import {ANIMALS} from './animals.js';
import {EGO_BEASTS} from './ego-beasts.js';

// Additive metadata has its own version; existing run snapshots and totals retain
// their schema. Never assign an old aggregate record to an invented difficulty.
export const RUN_HISTORY_LIMIT=20;
const MODES=['survival','endless'];
const SOURCES=['touch','gas','explosion','shockwave','tail','pelican','unknown'];
const ACTORS=[...Object.keys(ANIMALS),...Object.keys(EGO_BEASTS),'travestia','pelican','normal','sprinter','gas','tank','jealous','explosive','matriarch','orangutan','rival_rooster','rival_goat'];
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const count=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e12;
const number=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e12;
const check=ok=>{if(!ok)throw Error('Invalid run history');};
const only=(v,keys)=>object(v)&&Object.keys(v).every(k=>keys.includes(k));
const copy=v=>JSON.parse(JSON.stringify(v));
const emptyRecord=()=>({bestTime:0,bestKills:0,bestCoins:0,bestLevel:0});

export function createReplayState(legacyBest=0){
 return {version:1,legacyBest,records:Object.fromEntries(Object.keys(DIFFICULTIES).map(difficulty=>[difficulty,Object.fromEntries(MODES.map(mode=>[mode,emptyRecord()]))])),history:[]};
}
export function lethalDamageCause(source,context,at,hpLoss){
 const attributed=ACTORS.includes(context?.actorType)&&Number.isSafeInteger(context?.actorId)&&context.actorId>0;
 return {source:SOURCES.includes(source)?source:'unknown',actorType:attributed?context.actorType:null,actorId:attributed?context.actorId:null,at,hpLoss};
}
export function validateDeathCause(cause,elapsed,nextId=1e12){
 check(only(cause,['source','actorType','actorId','at','hpLoss'])&&SOURCES.includes(cause.source)&&number(cause.at)&&cause.at<=elapsed&&number(cause.hpLoss)&&cause.hpLoss>0&&cause.hpLoss<=10000);
 check(cause.actorType===null&&cause.actorId===null||ACTORS.includes(cause.actorType)&&count(cause.actorId)&&cause.actorId>0&&cause.actorId<nextId);
 return cause;
}
function validateBuild(build){
 check(only(build,['upgrades','evolutions','trophies'])&&object(build.upgrades)&&Array.isArray(build.evolutions)&&object(build.trophies));
 for(const [id,rank] of Object.entries(build.upgrades)){const def=UPGRADES.find(u=>u.id===id);check(def&&count(rank)&&rank>0&&rank<=def.max);}
 check(build.evolutions.length<=EVOLUTIONS.length&&new Set(build.evolutions).size===build.evolutions.length);
 for(const id of build.evolutions){const def=EVOLUTIONS.find(e=>e.id===id);check(def&&def.requires.every(key=>build.upgrades[key]>=3));}
 for(const [type,id] of Object.entries(build.trophies))check(Object.hasOwn(BOSS_TROPHIES,type)&&BOSS_TROPHIES[type].choices.includes(id));
}
export function validateReplayState(replay){
 check(only(replay,['version','legacyBest','records','history'])&&replay.version===1&&number(replay.legacyBest)&&only(replay.records,Object.keys(DIFFICULTIES))&&Array.isArray(replay.history)&&replay.history.length<=RUN_HISTORY_LIMIT);
 for(const difficulty of Object.keys(DIFFICULTIES)){
  const modes=replay.records[difficulty];check(only(modes,MODES));
  for(const mode of MODES){const record=modes[mode];check(only(record,['bestTime','bestKills','bestCoins','bestLevel'])&&number(record.bestTime)&&count(record.bestKills)&&count(record.bestCoins)&&count(record.bestLevel));if(mode==='survival')check(record.bestTime<=1200);}
 }
 const ids=new Set();
 for(const run of replay.history){
  check(only(run,['id','seed','difficulty','mode','outcome','time','kills','coins','level','build','deathCause'])&&typeof run.id==='string'&&run.id.length>0&&run.id.length<200&&Object.hasOwn(DIFFICULTIES,run.difficulty)&&MODES.includes(run.mode));
  const key=JSON.stringify([run.id,run.mode]);check(!ids.has(key));ids.add(key);
  check(Number.isInteger(run.seed)&&run.seed>=-2147483648&&run.seed<=2147483647&&number(run.time)&&count(run.kills)&&count(run.coins)&&count(run.level)&&run.level>0&&['victory','defeat','abandoned'].includes(run.outcome));
  if(run.outcome==='victory')check(run.mode==='survival'&&run.time>=1200);
  validateBuild(run.build);
  if(run.deathCause!==null){check(run.outcome==='defeat');validateDeathCause(run.deathCause,run.time);}
 }
 return replay;
}
export function recordReplay(replay,id,snapshot,{replaced=false}={}){
 const s=snapshot.game.s,mode=s.endless?'endless':'survival',time=s.elapsed,coins=totalEarnedCoins(s),record=replay.records[s.difficulty][mode];
 record.bestTime=Math.max(record.bestTime,mode==='survival'?Math.min(1200,time):time);record.bestKills=Math.max(record.bestKills,s.kills);record.bestCoins=Math.max(record.bestCoins,coins);record.bestLevel=Math.max(record.bestLevel,s.level);
 // Pausing/menu credits are checkpoints, not finished runs. Charles is an
 // optional epilogue: reaching it cannot turn the survival victory into a loss.
 const outcome=s.mode==='gameover'?'defeat':!s.endless&&s.elapsed>=1200?'victory':replaced?'abandoned':null;
 if(!outcome)return;
 const build={upgrades:Object.fromEntries(Object.entries(s.upg).filter(([,rank])=>rank>0)),evolutions:Object.keys(s.evolutions).filter(id=>s.evolutions[id]).sort(),trophies:{...s.trophies.chosen}};
 const summary={id,seed:snapshot.game.seed,difficulty:s.difficulty,mode,outcome,time,kills:s.kills,coins,level:s.level,build,deathCause:outcome==='defeat'?copy(s.deathCause??null):null};
 replay.history=[summary,...replay.history.filter(run=>run.id!==id||run.mode!==mode)].slice(0,RUN_HISTORY_LIMIT);
}
