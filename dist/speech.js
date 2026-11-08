import {currentBarkContext} from './content.js';
// One serializable reading lane for all speakers. Urgent combat cues interrupt
// immediately; the interrupted line keeps its remaining visible reading time.
export const SPEECH_QUEUE_LIMIT=16;
// Lull-gated scenes wait at most this long (game time) for calm, then cancel.
export const SCENE_CALM_WAIT=8;
export function speechDuration(text){return Math.max(4.3,text.length*.039);}
export function createSpeech(){return {active:null,queue:[],nextId:1,scene:null};}
export function speechTime(g){return g.s.elapsed+(g.s.charles?.elapsed||0);}
function available(g,line){
 if(!currentBarkContext(g.s,line,g.recentHealthDamage))return false;
 if(line.who==='BLONDE IA'&&(!g.s.companion||g.s.girl.down>0))return false;
 if(line.actorId!==null&&!g.s.enemies.some(e=>e.id===line.actorId&&!e.dead))return false;
 if(line.scope==='charles'&&(!g.s.charles||g.s.charles.phase==='complete'||g.s.endless))return false;
 return true;
}
function sceneAvailable(g,scene){
 if(scene.companion&&(!g.s.companion||g.s.girl.down>0))return false;
 if(scene.actorId!==null&&!g.s.enemies.some(e=>e.id===scene.actorId&&!e.dead&&e.charmed<=0))return false;
 return scene.scope!=='charles'||Boolean(g.s.charles&&g.s.charles.phase!=='complete'&&!g.s.endless);
}
function cancelScene(g){
 const id=g.speech.scene?.id;if(!id)return;
 if(g.speech.active?.sceneId===id)g.speech.active=null;
 g.speech.queue=g.speech.queue.filter(line=>line.sceneId!==id);g.speech.scene=null;
}
export function beginSpeechScene(g,id,lines,{actorId=null,scope='survival',remember=false,calm=false}={}){
 flushSpeech(g);const state=g.speech;
 if(g.banterEnabled===false||state.active||state.queue.length||state.scene||!lines.length)return false;
 const scene={id,lines:lines.map(({who,text})=>({who,text})),index:0,actorId,scope,remember,companion:lines.some(line=>line.who==='BLONDE IA')};
 if(calm)scene.calm=true;
 if(!sceneAvailable(g,scene))return false;
 state.scene=scene;flushSpeech(g);return true;
}
function sceneCursor(g,scene){const line=scene.lines[scene.index];return {id:g.speech.nextId++,who:line.who,text:line.text,encounter:false,actorId:scene.actorId,scope:scene.scope,sceneId:scene.id,remaining:speechDuration(line.text),until:0};}
// A calm-gated scene keeps its next line queued while danger lasts. Other
// queued lines (a boss taunt, for example) play first; the save invariant of
// exactly one active-or-queued scene line holds throughout the wait.
function waitForCalm(g,scene,now){
 const state=g.speech;
 if(scene.waitSince===undefined)scene.waitSince=now;
 if(!state.queue.some(line=>line.sceneId===scene.id)){
  if(state.queue.length>=SPEECH_QUEUE_LIMIT){const discard=state.queue.findLastIndex(queued=>!queued.sceneId);if(discard>=0)state.queue.splice(discard,1);}
  state.queue.push(sceneCursor(g,scene));
 }
 state.queue=state.queue.filter(line=>line.sceneId||available(g,line));
 const other=state.queue.findIndex(line=>!line.sceneId);
 if(other>=0)start(g,state.queue.splice(other,1)[0]);
 return true;
}
function retainInterrupted(g,line){
 line.remaining=Math.min(speechDuration(line.text),Math.max(0,line.until-speechTime(g)));
 if(line.remaining<=0)return;
 const queue=g.speech.queue;
 if(queue.length>=SPEECH_QUEUE_LIMIT){
  // A scene owns exactly one active/queued cursor line. Evict disposable
  // chatter, never that line, or a later save would have an orphan cursor.
  const discard=queue.findLastIndex(queued=>!queued.sceneId);
  if(discard>=0)queue.splice(discard,1);
 }
 queue.unshift(line);
}
export function setSpeechEnabled(g,enabled){
 const next=Boolean(enabled);if(g.banterEnabled===next)return;
 if(g.banterEnabled!==false)flushSpeech(g);
 g.banterEnabled=next;
 if(!next&&g.speech.active&&!g.speech.active.encounter){
  retainInterrupted(g,g.speech.active);g.speech.active=null;g.speechUntil=g.s.elapsed;
 }
}
function payload(g,line){return {who:line.who,text:line.text,encounter:line.encounter,speechId:line.id,actorId:line.actorId,scope:line.scope,sceneId:line.sceneId,readingSeconds:Math.max(0,line.until-speechTime(g))};}
function start(g,line){line.until=speechTime(g)+line.remaining;g.speech.active=line;g.speechUntil=Math.max(g.speechUntil,g.s.elapsed+line.remaining);g.emit('bark',payload(g,line));}
export function flushSpeech(g){
 const state=g.speech,now=speechTime(g);
 if(state.active&&!currentBarkContext(g.s,state.active,g.recentHealthDamage))state.active=null;
 if(state.scene&&!sceneAvailable(g,state.scene))cancelScene(g);
 if(state.active&&now>=state.active.until){
  const finished=state.active;state.active=null;
  if(state.scene&&finished.sceneId===state.scene.id){
   state.scene.index++;
   if(state.scene.index===state.scene.lines.length){
    if(state.scene.remember)g.eventSeen.add(`scene:${state.scene.id}`);
    state.scene=null;
   }
  }
 }
 const waiting=state.scene;
 if(waiting?.waitSince!==undefined&&now-waiting.waitSince>=SCENE_CALM_WAIT){
  if(waiting.remember)g.eventSeen.add(`skip:${waiting.id}`);
  cancelScene(g);
 }
 if(state.active||g.banterEnabled===false)return;
 if(state.scene){
  // An urgent warning may have interrupted the current scene line. Resume its
  // remaining budget before advancing; unrelated chatter cannot split a pair.
  const scene=state.scene;
  if(scene.calm&&typeof g.isCalm==='function'&&!g.isCalm(scene.id)){if(waitForCalm(g,scene,now))return;}
  else{
   delete scene.waitSince;
   const index=state.queue.findIndex(line=>line.sceneId===scene.id);
   if(index>=0){start(g,state.queue.splice(index,1)[0]);return;}
   start(g,sceneCursor(g,scene));return;
  }
 }
 while(state.queue.length){const next=state.queue.shift();if(available(g,next)){start(g,next);break;}}
}
export function presentSpeech(g){flushSpeech(g);if(g.speech.active)g.emit('bark',payload(g,g.speech.active));}
export function enqueueSpeech(g,who,text,{queue=false,urgent=false,encounter=false,actorId=null,scope='survival'}={}){
 flushSpeech(g);const state=g.speech;
 if(g.banterEnabled===false&&!encounter)return false;
 if(urgent&&state.active?.who===who&&state.active.text===text)return true;
 const line={id:state.nextId,who,text,encounter,actorId,scope,sceneId:null,remaining:speechDuration(text),until:0};
 if(!available(g,line))return false;
 // While a calm-gated scene waits, ordinary chatter cannot start in its gap.
 const sceneWaiting=!state.active&&state.scene?.waitSince!==undefined;
 if(!urgent&&(state.active||sceneWaiting)){
  if(!queue||state.queue.length>=SPEECH_QUEUE_LIMIT)return false;
  state.nextId++;state.queue.push(line);if(sceneWaiting)flushSpeech(g);return true;
 }
 if(urgent&&state.active){
  // A fresh warning supersedes older time-sensitive warnings. Never replay an
  // obsolete "in five seconds" instruction after that attack has happened.
  const interrupted=state.active;
  if(!interrupted.encounter)retainInterrupted(g,interrupted);
 }
 state.nextId++;start(g,line);return true;
}
// Compact boss pairs use legacy delayed-reply fields rather than scene cursors.
// Closing their visible setup must cancel both a still-timed answer and one
// already queued behind an interruption. Combat clocks remain unchanged.
function cancelCompactBossReply(g,line){
 if(!line||line.encounter||line.sceneId||line.actorId===null)return;
 const boss=g.s.enemies.find(e=>e.id===line.actorId);
 const prefix=boss?.type==='pelican'&&line.who==='PÉLI ZODIAQUE'?'peli':boss?.type==='travestia'&&line.who==='TRAVESTIA'?'tail':null;
 if(!prefix)return;
 boss[`${prefix}ReplyPending`]=false;
 if(prefix==='peli')boss.peliReplyTime=0;
 g.speech.queue=g.speech.queue.filter(queued=>!(queued.actorId===boss.id&&queued.who==='TOMA'&&queued.text===boss[`${prefix}Reply`]&&!queued.encounter&&!queued.sceneId));
}
export function dismissSpeech(g){
 if(g.speech.active?.sceneId){if(g.speech.scene?.remember)g.eventSeen.add(`skip:${g.speech.scene.id}`);cancelScene(g);}
 else{cancelCompactBossReply(g,g.speech.active);g.speech.active=null;}
}
