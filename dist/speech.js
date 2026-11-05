import {currentBarkContext} from './content.js';
// One serializable reading lane for all speakers. Urgent combat cues interrupt
// immediately; the interrupted line keeps its remaining visible reading time.
export const SPEECH_QUEUE_LIMIT=16;
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
export function beginSpeechScene(g,id,lines,{actorId=null,scope='survival',remember=false}={}){
 flushSpeech(g);const state=g.speech;
 if(g.banterEnabled===false||state.active||state.queue.length||state.scene||!lines.length)return false;
 const scene={id,lines:lines.map(({who,text})=>({who,text})),index:0,actorId,scope,remember,companion:lines.some(line=>line.who==='BLONDE IA')};
 if(!sceneAvailable(g,scene))return false;
 state.scene=scene;flushSpeech(g);return true;
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
 if(state.active||g.banterEnabled===false)return;
 if(state.scene){
  // An urgent warning may have interrupted the current scene line. Resume its
  // remaining budget before advancing; unrelated chatter cannot split a pair.
  const index=state.queue.findIndex(line=>line.sceneId===state.scene.id);
  if(index>=0){start(g,state.queue.splice(index,1)[0]);return;}
  const scene=state.scene,line=scene.lines[scene.index];
  start(g,{id:state.nextId++,who:line.who,text:line.text,encounter:false,actorId:scene.actorId,scope:scene.scope,sceneId:scene.id,remaining:speechDuration(line.text),until:0});return;
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
 if(!urgent&&state.active){
  if(!queue||state.queue.length>=SPEECH_QUEUE_LIMIT)return false;
  state.nextId++;state.queue.push(line);return true;
 }
 if(urgent&&state.active){
  // A fresh warning supersedes older time-sensitive warnings. Never replay an
  // obsolete "in five seconds" instruction after that attack has happened.
  const interrupted=state.active;
  if(!interrupted.encounter)retainInterrupted(g,interrupted);
 }
 state.nextId++;start(g,line);return true;
}
export function dismissSpeech(g){if(g.speech.active?.sceneId){if(g.speech.scene?.remember)g.eventSeen.add(`skip:${g.speech.scene.id}`);cancelScene(g);}else g.speech.active=null;}
