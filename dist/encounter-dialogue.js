import {EVENTS} from './content.js';
import {CHARLES_LINES,charlesActive} from './charles.js';
import {PELICAN_BANTER} from './pelican.js';
import {TRAVESTIA_BANTER} from './travestia.js';

// This is a capability, not a preference: the approved portrait renderer enables
// it explicitly. A saved active scene stays paused even without that capability.
export const ENCOUNTER_QUEUE_LIMIT=7;
const IDS=['companion:invocation','boss:pelican','boss:travestia','charles:0','charles:1','charles:2','charles:3'];
const SAFE_CHARLES=['intro','hover','recover','empowered'];
export function createEncounterDialogue(){return {active:null,queue:[],outcomes:{},legacyActorIds:[]};}
export function migrateEncounterDialogue(game,dialogue){
 const state=createEncounterDialogue(),speech=game.speech;
 const attributed=[speech?.active,...(speech?.queue||[]),speech?.scene].filter(Boolean);
 state.legacyActorIds=game.s.enemies.filter(e=>['pelican','travestia'].includes(e.type)&&(e.peliReplyPending||e.tailReplyPending||e.peliBanterIndex>0||e.tailBanterIndex>0||attributed.some(line=>line.actorId===e.id))).map(e=>e.id);
 if(game.s.mode==='dialogue'&&JSON.stringify(dialogue?.lines)===JSON.stringify(EVENTS.companion)){state.active={id:'companion:invocation',actorId:null,actorType:'companion',scope:'survival',start:0,pair:0,lines:dialogue.lines,index:dialogue.index};state.outcomes['companion:invocation']='active';}
 return state;
}
export function encounterLines(id,start=0,pair=0){
 if(id==='companion:invocation')return EVENTS.companion.map(line=>({...line}));
 if(id==='boss:pelican')return PELICAN_BANTER[pair]?.map((text,i)=>({who:i?'TOMA':'PÉLI ZODIAQUE',text}));
 if(id==='boss:travestia')return TRAVESTIA_BANTER[pair]?.map((text,i)=>({who:i?'TOMA':'TRAVESTIA',text}));
 if(/^charles:[0-3]$/.test(id)){const first=Number(id.slice(-1))*2;return start===first||start===first+1?CHARLES_LINES.slice(start,first+2).map(line=>({...line})):null;}
 return null;
}
function pendingCharlesNarrative(g){return [g.speech.active,...g.speech.queue].some(line=>line&&line.scope==='charles'&&!line.encounter);}
function actor(g,scene){return scene.actorType==='charles'?g.s.charles:g.s.enemies.find(e=>e.id===scene.actorId);}
function validActor(g,scene){if(scene.actorType==='companion')return !charlesActive(g.s);const e=actor(g,scene);return Boolean(e&&e.id===scene.actorId&&e.type===scene.actorType&&!e.dead&&e.charmed<=0&&(scene.scope!=='charles'||charlesActive(g.s)));}
function safeActor(g,scene){
 if(scene.actorType==='companion')return true;
 const e=actor(g,scene);if(scene.actorType==='charles')return SAFE_CHARLES.includes(e.phase);
 if(g.s.airplane.active||['charmed','suppressed'].includes(e.phase))return false;
 return scene.actorType==='pelican'?e.phase==='chase'||e.phase==='peli_recover'||e.phase.endsWith('_warning'):['chase','tail_windup','tail_recover','tail_dash_windup','tail_dash_recover'].includes(e.phase);
}
export function queueEncounterDialogue(g,{id,actorId,actorType,scope='survival',start=0,pair=0}){
 const state=g.encounters,lines=encounterLines(id,start,pair);
 if((actorType!=='companion'&&(!g.pausedEncountersEnabled||!g.banterEnabled))||!lines?.length||state.outcomes[id]||state.legacyActorIds.includes(actorId)||state.queue.length>=ENCOUNTER_QUEUE_LIMIT)return false;
 if(actorType==='charles'&&pendingCharlesNarrative(g))return false;
 const scene={id,actorId,actorType,scope,start,pair,lines,index:0};
 if(!validActor(g,scene))return false;
 if(actorType==='companion')state.queue.unshift(scene);else state.queue.push(scene);state.outcomes[id]='queued';return true;
}
export function openEncounterDialogue(g){
 const state=g.encounters,s=g.s;
 if(state.active||s.mode!=='playing'||s.hp<=0)return false;
 const epilogue=charlesActive(s);
 if(!epilogue&&(s.options.length||s.trophies.pending.length||s.elapsed>=1200&&!s.endless))return false;
 while(state.queue.length){
  const scene=state.queue[0];
  if(scene.actorType!=='companion'&&(!g.pausedEncountersEnabled||!g.banterEnabled))return false;
  if(!validActor(g,scene)||scene.scope==='survival'&&epilogue){state.queue.shift();state.outcomes[scene.id]='obsolete';continue;}
  if(!safeActor(g,scene)||scene.actorType==='charles'&&pendingCharlesNarrative(g))return false;
  state.queue.shift();state.active=scene;state.outcomes[scene.id]='active';s.mode='dialogue';s.moveX=0;s.moveY=0;s.walkMoving=false;
  g.emit('dialogue',{lines:scene.lines,index:scene.index,context:dialoguePresentation(g)});return true;
 }
 return false;
}
export function advanceEncounterDialogue(g,id,index){
 const scene=g.encounters.active;
 if(g.s.mode!=='dialogue'||!scene||scene.id!==id||scene.index!==index)return false;
 if(index+1<scene.lines.length)scene.index++;
 else g.finishDialogue();
 return true;
}
export function cancelEncounterDialogues(g,scope){
 const state=g.encounters;
 for(const scene of [...state.queue,...(state.active?[state.active]:[])])if(scene.scope===scope)state.outcomes[scene.id]='obsolete';
 state.queue=state.queue.filter(scene=>scene.scope!==scope);if(state.active?.scope===scope)state.active=null;
}
export function closeEncounterDialogue(g,skipped=false){
 const state=g.encounters,scene=state.active;if(!scene)return;
 state.outcomes[scene.id]=skipped?'skipped':'completed';state.active=null;
}
// Pure presentation context. The renderer, not persisted dialogue metadata,
// selects the current companion level from the authoritative upgrade state.
export function dialoguePresentation(g,line=g.encounters.active?.lines[g.encounters.active.index]){
 const scene=g.encounters.active;
 const who=line?.who||'',companionRank=scene?.actorType==='companion'||who==='BLONDE IA'?Math.max(1,Math.min(5,g.s.upg.girlfriend||1)):null;
 return {who,sceneId:scene?.id??null,actorId:scene?.actorId??null,actorType:scene?.actorType??(who==='BLONDE IA'?'companion':null),scope:scene?.scope??'survival',companionRank,portrait:companionRank?`assets/companion-portrait-${companionRank}.png`:null};
}
export function validateEncounterDialogue(state,s,nextId,ui){
 const check=value=>{if(!value)throw new Error('Invalid run save');};
 const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
 check(object(state)&&Array.isArray(state.queue)&&state.queue.length<=ENCOUNTER_QUEUE_LIMIT&&object(state.outcomes));
 check(Array.isArray(state.legacyActorIds)&&state.legacyActorIds.length<=2&&new Set(state.legacyActorIds).size===state.legacyActorIds.length&&state.legacyActorIds.every(id=>Number.isSafeInteger(id)&&id>0&&id<nextId));
 const outcomes=['queued','active','completed','skipped','obsolete'];
 for(const [id,outcome] of Object.entries(state.outcomes))check(IDS.includes(id)&&outcomes.includes(outcome));
 check(state.active===null||object(state.active));
 const present=new Set();
 for(const scene of [...state.queue,...(state.active?[state.active]:[])]){
  check(object(scene)&&IDS.includes(scene.id)&&!present.has(scene.id));present.add(scene.id);
  const type=scene.id==='companion:invocation'?'companion':scene.id.startsWith('charles:')?'charles':scene.id.slice(5);
  check(type==='companion'?scene.actorId===null:Number.isSafeInteger(scene.actorId)&&scene.actorId>0&&scene.actorId<nextId);
  check(scene.actorType===type&&scene.scope===(type==='charles'?'charles':'survival'));
  check(Number.isInteger(scene.start)&&scene.start>=0&&Number.isInteger(scene.pair)&&scene.pair>=0);
  if(type==='charles'||type==='companion')check(scene.pair===0);if(type!=='charles')check(scene.start===0);
  const expected=encounterLines(scene.id,scene.start,scene.pair);
  check(expected&&JSON.stringify(scene.lines)===JSON.stringify(expected));
  check(Number.isInteger(scene.index)&&scene.index>=0&&scene.index<scene.lines.length);
  check(state.outcomes[scene.id]===(scene===state.active?'active':'queued'));
  if(scene!==state.active)check(scene.index===0);
 }
 for(const [id,outcome] of Object.entries(state.outcomes))if(['active','queued'].includes(outcome))check(present.has(id));
 if(state.active){
  const scene=state.active,e=scene.actorType==='charles'?s.charles:s.enemies.find(e=>e.id===scene.actorId);
  check(s.mode==='dialogue'&&s.hp>0);
  if(scene.actorType!=='companion')check(e&&e.id===scene.actorId&&e.type===scene.actorType&&!e.dead&&e.charmed<=0);
  check(ui&&ui.index===scene.index&&JSON.stringify(ui.lines)===JSON.stringify(scene.lines));
  if(scene.actorType==='charles')check(charlesActive(s)&&SAFE_CHARLES.includes(e.phase));
 }
}
