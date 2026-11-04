// One serializable reading lane for all speakers. Urgent combat cues interrupt
// immediately; the interrupted line keeps its remaining visible reading time.
export const SPEECH_QUEUE_LIMIT=16;
export function speechDuration(text){return Math.max(4.3,text.length*.039);}
export function createSpeech(){return {active:null,queue:[],nextId:1};}
export function speechTime(g){return g.s.elapsed+(g.s.charles?.elapsed||0);}
function available(g,line){
 if(line.who==='BLONDE IA'&&(!g.s.companion||g.s.girl.down>0))return false;
 if(line.actorId!==null&&!g.s.enemies.some(e=>e.id===line.actorId&&!e.dead))return false;
 if(line.scope==='charles'&&(!g.s.charles||g.s.charles.phase==='complete'||g.s.endless))return false;
 return true;
}
function payload(g,line){return {who:line.who,text:line.text,encounter:line.encounter,speechId:line.id,readingSeconds:Math.max(0,line.until-speechTime(g))};}
function start(g,line){line.until=speechTime(g)+line.remaining;g.speech.active=line;g.speechUntil=Math.max(g.speechUntil,g.s.elapsed+line.remaining);g.emit('bark',payload(g,line));}
export function flushSpeech(g){
 const state=g.speech,now=speechTime(g);
 if(state.active&&now>=state.active.until)state.active=null;
 if(state.active)return;
 while(state.queue.length){const next=state.queue.shift();if(available(g,next)){start(g,next);break;}}
}
export function presentSpeech(g){flushSpeech(g);if(g.speech.active)g.emit('bark',payload(g,g.speech.active));}
export function enqueueSpeech(g,who,text,{queue=false,urgent=false,encounter=false,actorId=null,scope='survival'}={}){
 flushSpeech(g);const state=g.speech;
 if(urgent&&state.active?.who===who&&state.active.text===text)return true;
 const line={id:state.nextId,who,text,encounter,actorId,scope,remaining:speechDuration(text),until:0};
 if(!available(g,line))return false;
 if(!urgent&&state.active){
  if(!queue||state.queue.length>=SPEECH_QUEUE_LIMIT)return false;
  state.nextId++;state.queue.push(line);return true;
 }
 if(urgent&&state.active){
  // A fresh warning supersedes older time-sensitive warnings. Never replay an
  // obsolete "in five seconds" instruction after that attack has happened.
  const interrupted=state.active;
  if(!interrupted.encounter){interrupted.remaining=Math.min(speechDuration(interrupted.text),Math.max(0,interrupted.until-speechTime(g)));
   if(interrupted.remaining>0){if(state.queue.length>=SPEECH_QUEUE_LIMIT)state.queue.pop();state.queue.unshift(interrupted);}}
 }
 state.nextId++;start(g,line);return true;
}
export function dismissSpeech(g){g.speech.active=null;}
