import {renderEncounterPresentation} from './dialogue-presentation.js';
import {carLevel} from './lamborghini.js';
import {TROPHIES,BOSS_TROPHIES,trophyChoices} from './boss-trophies.js';
import {drawTrophyIcon,drawTrophyPortrait} from './trophy-art.js';
import {EVOLUTIONS,totalEarnedCoins} from './evolutions.js';
import {OPENING,openingStage,positionNewRun,beginTutorial,updateTutorial,tutorialText} from './opening.js';
import {discoveryPrompt} from './discoveries.js';
import {LockedRunStore,restoreRun,captureRun,Autosave} from './run-save.js';
import {Game} from './engine.js';
import {Renderer,drawIcon} from './renderer.js';
import {AudioManager} from './audio.js';
import {companionLevel,INTRO,UPGRADES,DIFFICULTIES,EVENTS,victoryQuote} from './content.js';

const COMPANION_PORTRAITS=['assets/companion-portrait-1.png','assets/companion-portrait-2.png','assets/companion-portrait-3.png','assets/companion-portrait-4.png','assets/companion-portrait-5.png'];
const $=id=>document.getElementById(id);
const screens=['menu','dialogue','upgrades','trophies','pause-screen','save-exit','settings','results','charles-confirm','credits'];
const canvas=$('world'),app=$('app');
const renderer=new Renderer(canvas);
const stored=readStorage();
let runStore;try{runStore=new LockedRunStore(localStorage,navigator.locks);}catch{runStore=new LockedRunStore(null,null);}
let upgradePurchasePending=false;
let savedRecord=runStore.read(),runId=null,runPersistence=false,transitionBusy=false,recoveryPending=false,flushRequested=false,lastSaveError='';
const prefs={sound:stored.sound!==false,volume:stored.volume??50,reduced:stored.reduced??matchMedia('(prefers-reduced-motion: reduce)').matches,banter:stored.banter!==false};
const audio=new AudioManager({enabled:prefs.sound,volume:prefs.volume/100});
audio.setEnabled(prefs.sound);audio.setVolume(prefs.volume/100);
let game=null,screen='menu',difficulty=Object.hasOwn(DIFFICULTIES,stored.difficulty)?stored.difficulty:'normal',lastTime=performance.now();
let width=390,height=844,dialogueLines=[],dialogueIndex=0,dialogueDone=null,auto=false,autoTimer=0,dialogueSession=0,dialogueRender=0,lastDialogueInput=-Infinity;
let windowFocused=document.hasFocus?.()??true;
let input={x:0,y:0},keys=new Set(),pointer=null,origin={x:0,y:0};
const validCount=n=>Number.isSafeInteger(n)&&n>=0?n:0;
let best=Number.isFinite(stored.best)&&stored.best>=0?stored.best:0,lifetime=validCount(stored.lifetime),lifetimeCoins=validCount(stored.coins);
if(savedRecord.status==='ready'){best=savedRecord.value.totals.best;lifetime=savedRecord.value.totals.lifetime;lifetimeCoins=savedRecord.value.totals.coins;}
let creditedKills=0,creditedCoins=0,banterUntil=0,banterSpeechId=null,powerSignature='',settingsReturn='pause-screen',creditsReturn='menu';
let resultRecorded=false,uiTick=0,lastHud='',trophyToastRemaining=0,trophyToastQueue=[];
let assetWait=null,assetError=false,startAttempt=null,hudSpacePress=null;
let navigationVersion=0,runConflict=false,saveExitChoice=null;
function readStorage(){try{const data=JSON.parse(localStorage.getItem('toma-popescu-v1')||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{return {}}}
function save(){try{localStorage.setItem('toma-popescu-v1',JSON.stringify({...prefs,difficulty,best,lifetime,coins:lifetimeCoins,introSeen:stored.introSeen}));}catch{}}
function format(t){const n=Math.max(0,Math.floor(t));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
// Runtime-only capabilities/preferences must survive every game replacement,
// including the detached copy committed by a paid reroll.
function prepareGame(next,{pausedEncountersEnabled=true,banterEnabled=prefs.banter}={}){next.setPausedEncountersEnabled(pausedEncountersEnabled);next.setBanterEnabled(banterEnabled);return next;}
function setText(id,value){const el=$(id);const v=String(value);if(el.textContent!==v)el.textContent=v;}
function sound(name='click'){audio.sfx(name)}
function syncAudio(){const battle=screen==='hud'||screen==='upgrades'||screen==='trophies'||(screen==='dialogue'&&game&&game.state.elapsed>0);const scene=document.hidden||['pause-screen','save-exit','settings'].includes(screen)?'paused':battle?'battle':'menu';audio.setScene(scene);audio.setDucked?.(scene==='battle'&&['upgrades','trophies','dialogue'].includes(screen));}
function activateAudio(){audio.unlock();syncAudio();}
app.addEventListener('pointerdown',activateAudio,{once:true});
window.addEventListener('keydown',activateAudio,{once:true});
function cancelHudSpacePress(){if(hudSpacePress)hudSpacePress.cancelled=true;}
function resetInput(){cancelHudSpacePress();input={x:0,y:0};keys.clear();if(pointer!==null){try{app.releasePointerCapture(pointer)}catch{}}pointer=null;$('stick').style.transform='';$('joystick').classList.remove('active');$('joystick').style.removeProperty('left');$('joystick').style.removeProperty('top');$('joystick').style.removeProperty('bottom');}
function cancelStartAttempt(navigated=false){if(startAttempt){startAttempt.cancelled=true;startAttempt.navigated ||=navigated;}}
function show(name){navigationVersion++;if(name!=='save-exit')saveExitChoice=null;cancelStartAttempt(true);const leavingDialogue=screen==='dialogue'&&name!=='dialogue';if(name!=='dialogue')renderEncounterPresentation({context:null,line:null});cancelAssetWait();resetInput();screen=name;$('charles-leave').classList.toggle('hidden',!charlesActive());if(name==='hud')nextTrophyToast();$('trophy-toast').classList.toggle('hidden',name!=='hud'||trophyToastRemaining<=0);for(const id of screens)$(id).classList.toggle('hidden',id!==name);$('hud').classList.toggle('hidden',name!=='hud'&&name!=='trophies');$('hud').classList.toggle('trophy-backdrop',name==='trophies');syncAudio();if(name!=='dialogue')clearTimeout(autoTimer);if(name!=='hud')$('banter').classList.add('hidden');else{game?.setBanterEnabled(prefs.banter);game?.presentSpeech();}if(leavingDialogue&&name==='hud')$('pause').focus?.();}
function resize(){resetInput();const r=app.getBoundingClientRect();width=Math.round(r.width);height=Math.round(r.height);renderer.resize(width,height);game?.setViewport(width,height);}
window.addEventListener('resize',resize);new ResizeObserver(resize).observe(app);resize();
function updateRecordMenu(){setText('best',format(best));setText('lifetime',`${lifetime.toLocaleString('fr-CA')} singe${lifetime===1?'':'s'} vaincu${lifetime===1?'':'s'}`)}
function syncPrefs(){game?.setBanterEnabled(prefs.banter);audio.setEnabled(prefs.sound);audio.setVolume(prefs.volume/100);app.classList.toggle('reduced-fx',prefs.reduced);renderer.reducedEffects=prefs.reduced;document.querySelectorAll('.sound-button').forEach(b=>{b.textContent=prefs.sound?'♫':'♪̸';b.setAttribute('aria-label',prefs.sound?'Couper le son':'Activer le son');b.setAttribute('aria-pressed',String(prefs.sound));});$('sound-setting').checked=prefs.sound;$('volume').value=prefs.volume;setText('volume-text',`${prefs.volume} %`);$('reduced-fx').checked=prefs.reduced;$('banter-setting').checked=prefs.banter;}
function toggleSound(){prefs.sound=!prefs.sound;audio.unlock();syncPrefs();save();}
function setDifficulty(id){if(!DIFFICULTIES[id])return;difficulty=id;document.querySelectorAll('[data-difficulty]').forEach(b=>{const selected=b.dataset.difficulty===id;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});save();}
function showSaveError(reason){
 if(reason===lastSaveError)return;lastSaveError=reason;
 const message=reason==='conflict'?'Partie modifiée dans un autre onglet. Reviens au menu pour charger la dernière sauvegarde.':'Sauvegarde indisponible. Ta progression récente pourrait ne pas être conservée.';
 setText('toast',message);if(screen!=='save-exit')$('toast').classList.remove('hidden');
}
function dialogueSnapshot(){return game?.s.mode==='dialogue'?{lines:dialogueLines,index:dialogueIndex}:null;}
function requestSave(){flushRequested=true;}
async function persistRun(credit=false){
 if(upgradePurchasePending)return {ok:false,reason:'transaction-pending'};
 if(!game||!runId||!runPersistence)return {ok:false,reason:'inactive'};
 const current=game,id=runId;
 const result=await runStore.checkpoint(id,current,{credit,dialogue:dialogueSnapshot()},()=>game===current&&runId===id&&runPersistence);
 if(result.ok){if(game===current&&runId===id){savedRecord={status:'ready',value:result.value};best=result.value.totals.best;lifetime=result.value.totals.lifetime;lifetimeCoins=result.value.totals.coins;creditedKills=result.value.run.creditedKills;creditedCoins=result.value.run.creditedCoins;lastSaveError='';$('toast').classList.add('hidden');}}
 else if(game===current&&runId===id){if(result.reason==='conflict'){runPersistence=false;runConflict=true;}showSaveError(result.reason);}
 return result;
}
const autosave=new Autosave(()=>persistRun(),()=>performance.now());
function updateResumeMenu(){
 const ready=savedRecord.status==='ready'&&savedRecord.value.run.snapshot.game.s.mode!=='gameover';
 $('saved-run').classList.toggle('hidden',!ready);$('difficulty-picker').classList.remove('hidden');setText('difficulty-legend',ready?'NOUVELLE PARTIE · NIVEAU DE DÉNI':'CHOISIS TON NIVEAU DE DÉNI');
 $('play').classList.toggle('primary',!ready);$('play').classList.toggle('secondary',ready);setText('play-label',ready?'NOUVELLE PARTIE':'JOUER');
 if(ready){const state=savedRecord.value.run.snapshot.game.s;setText('saved-run-details',`${format(state.elapsed)} · Niveau ${state.level} · ${{easy:'Facile',normal:'Normal',hard:'Difficile',nightmare:'Cauchemar'}[state.difficulty]}${state.endless?' · Infini':''}`);}
}
function clearAssetError(){if(assetError){assetError=false;$('toast').classList.add('hidden');}}
function cancelAssetWait(){
 if(!assetWait)return;const wait=assetWait;assetWait=null;wait.cancel();$('loading').classList.add('hidden');resetInput();
}
function allAnimalArtReady(){return renderer.actors.available('animals')&&renderer.actors.available('ego');}
async function loadAnimalAtlases(){const original=await renderer.actors.ensureAnimalsReady();if(!original.ok||renderer.actors.available('ego'))return original;return renderer.actors.ensureEgoReady();}
async function ensureAnimalArt(){
 if(allAnimalArtReady())return true;
 let cancel;const cancelled=new Promise(resolve=>{cancel=()=>resolve({cancelled:true});}),wait={cancel};assetWait=wait;
 resetInput();$('loading').classList.remove('hidden');
 let result;try{result=await Promise.race([loadAnimalAtlases(),cancelled]);}catch{result={ok:false,reason:'failed'};}
 if(assetWait!==wait)return false;
 assetWait=null;$('loading').classList.add('hidden');
 if(result.ok&&allAnimalArtReady())return true;
 assetError=true;setText('toast',result.reason==='timeout'?'Le chargement des images prend trop de temps. Réessaie.':'Impossible de charger les images des animaux. Réessaie.');$('toast').classList.remove('hidden');return false;
}
async function start(){
 if(transitionBusy||screen==='save-exit')return;transitionBusy=true;
 const attempt={cancelled:false,navigated:false},previousGame=game,previousId=runId;startAttempt=attempt;
 const mayStart=()=>startAttempt===attempt&&!attempt.cancelled&&windowFocused&&!document.hidden;
 try{
  const old=game?.s|| (savedRecord.status==='ready'?savedRecord.value.run.snapshot.game.s:null);
  if(old&&!['gameover','victory'].includes(old.mode)&&!window.confirm('Commencer une nouvelle partie remplacera la partie sauvegardée. Continuer ?'))return;
  audio.unlock();
  if(!allAnimalArtReady()&&!await ensureAnimalArt())return;if(!mayStart())return;clearAssetError();
  const previous=game&&runPersistence?{id:runId,snapshot:captureRun(game,dialogueSnapshot())}:null;
  const next=prepareGame(new Game({difficulty,seed:(Date.now()>>>0),onEvent:onGameEvent}));positionNewRun(next);next.setViewport(width,height);next.s.reducedEffects=prefs.reduced;
  const needsOpening=!stored.introSeen;if(needsOpening)next.s.mode='dialogue';
  const nextId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;const begun=await runStore.begin(nextId,next,{best,lifetime,coins:lifetimeCoins},needsOpening?{lines:OPENING,index:0}:null,previous,mayStart);
  const installNext=()=>{trophyToastQueue=[];trophyToastRemaining=0;creditedKills=0;creditedCoins=0;resultRecorded=false;powerSignature='';lastHud='';recoveryPending=false;game=next;runId=nextId;runPersistence=begun.ok;runConflict=false;flushRequested=false;};
  const acceptSave=()=>{best=begun.value.totals.best;lifetime=begun.value.totals.lifetime;lifetimeCoins=begun.value.totals.coins;savedRecord={status:'ready',value:begun.value};lastSaveError='';$('toast').classList.add('hidden');};
  if(!mayStart()){
   // The guard inside the lock normally cancels before any write. If the
   // transaction already committed, never roll it back or run the old session
   // against its replacement. Keep a recovery pause and any newer navigation.
   if(begun.ok){
    acceptSave();
    if(game===previousGame&&runId===previousId){
     installNext();recoveryPending=true;
     if(needsOpening){dialogueLines=OPENING;dialogueIndex=0;dialogueSession++;dialogueDone=finishOpening;auto=false;$('auto-dialogue').setAttribute('aria-pressed','false');setText('auto-dialogue','AUTO : NON');}
     else game.pause();
     updateHud(true);setText('pause-stats',`${format(game.s.elapsed)} · ${game.s.kills} SINGES · NIV. ${game.s.level}`);
     if(!attempt.navigated){startAttempt=null;show('pause-screen');}
    }
    updateRecordMenu();updateResumeMenu();
   }
   return;
  }
  if(begun.reason==='cancelled')return;
  if(!begun.ok&&!window.confirm('La sauvegarde est indisponible. Jouer quand même sans conserver cette partie ni ses records ?')){showSaveError(begun.reason);return;}
  if(!mayStart())return;
  installNext();if(begun.ok)acceptSave();else showSaveError(begun.reason);
  startAttempt=null;
  show('hud');updateHud(true);sound('click');if(needsOpening){openDialogue(OPENING,finishOpening);}else showBanter({who:'TOMA',text:'Je suis prêt. C’est la réalité qui devrait avoir peur.'});requestSave();
 }finally{if(startAttempt===attempt)startAttempt=null;transitionBusy=false;}
}
async function resumeSaved(){
 if(transitionBusy||screen==='save-exit')return;transitionBusy=true;
 try{if(!allAnimalArtReady()&&!await ensureAnimalArt())return;clearAssetError();
  savedRecord=runStore.read();if(savedRecord.status!=='ready'){updateResumeMenu();showSaveError(savedRecord.status);return;}
  const record=savedRecord.value,snapshot=record.run.snapshot;if(snapshot.game.s.mode==='gameover')return;
  game=prepareGame(restoreRun(snapshot,{onEvent:onGameEvent}));runId=record.run.id;runPersistence=true;runConflict=false;recoveryPending=true;resultRecorded=false;powerSignature='';lastHud='';creditedKills=record.run.creditedKills;creditedCoins=record.run.creditedCoins;
  best=record.totals.best;lifetime=record.totals.lifetime;lifetimeCoins=record.totals.coins;game.setViewport(width,height);game.s.reducedEffects=prefs.reduced;
  if(snapshot.dialogue){dialogueLines=snapshot.dialogue.lines;dialogueIndex=snapshot.dialogue.index;dialogueSession++;dialogueDone=openingStage(dialogueLines,dialogueIndex)?finishOpening:skipped=>{game?.finishDialogue(skipped);syncEngineScreen();requestSave();};}
  if(game.s.mode==='playing')game.pause();lastTime=performance.now();updateHud(true);setText('pause-stats',`${format(game.s.elapsed)} · ${game.s.kills} SINGES · NIV. ${game.s.level}`);show('pause-screen');
 }catch{showSaveError('corrupt');}finally{transitionBusy=false;}
}
function mainMenu(){trophyToastQueue=[];trophyToastRemaining=0;clearTimeout(autoTimer);game=null;runId=null;runPersistence=false;runConflict=false;recoveryPending=false;flushRequested=false;savedRecord=runStore.read();if(savedRecord.status==='ready'){best=savedRecord.value.totals.best;lifetime=savedRecord.value.totals.lifetime;lifetimeCoins=savedRecord.value.totals.coins;}show('menu');updateRecordMenu();updateResumeMenu();}
function onGameEvent(type,payload){if(['dialogue','upgrade','trophy','trophy-acquired','victory','gameover','epilogue-start','epilogue-complete'].includes(type))requestSave();if(type==='epilogue-start'){show('hud');updateHud(true);return;}if(type==='trophy'){renderTrophies(typeof payload==='string'?payload:payload?.bossType);return;}if(type==='trophy-acquired'){showTrophyToast(payload);return;}if(type==='sound'){const name=typeof payload==='string'?payload:payload?.name;if(!['level','victory','defeat'].includes(name))sound(name);return;}if(type==='bark'){showBanter(payload);return;}if(type==='dialogue'){openDialogue(Array.isArray(payload)?payload:payload?.lines||[],skipped=>{game?.finishDialogue(skipped);syncEngineScreen();},payload?.index??0);return;}if(type==='upgrade'){renderUpgrades(Array.isArray(payload)?payload:payload?.options||game?.state.options||[]);return;}if(type==='victory'||type==='gameover'||type==='epilogue-complete'){renderResult(type!=='gameover');return;}if(type==='wave'){setText('wave',payload?.text||String(payload));$('wave').classList.remove('hidden');setTimeout(()=>$('wave').classList.add('hidden'),3000);}}
function syncEngineScreen(){
 if(!game)return;const mode=game.state.mode;
 if(mode==='playing'){
  const returning=screen!=='hud';show('hud');
  if(returning&&!charlesActive()){const warning=game.pendingEncounterWarning();if(warning)game.announceEncounter(warning);}
 }else if(mode==='trophy'&&screen!=='trophies')renderTrophies(game.s.trophies.pending[0]?.bossType);else if(mode==='upgrade'&&screen!=='upgrades')renderUpgrades(game.state.options);else if(mode==='paused')show('pause-screen');else if(mode==='victory'||mode==='gameover')renderResult(mode==='victory');
}
function showBanter(payload){
  if(!payload?.text||screen!=='hud'||(!prefs.banter&&payload.encounter!==true))return;
  setText('banter-name',payload.who||'TOMA');setText('banter-text',payload.text);
  const charles=payload.who==='CHARLES';
  const rival={'COQ RIVAL':'rival_rooster','BOUC RIVAL':'rival_goat','TRAVESTIA':'travestia','PÉLI ZODIAQUE':'pelican'}[payload.who];
  $('banter-portrait').classList.toggle('hidden',Boolean(rival)||charles);$('banter-rival').classList.toggle('hidden',!rival&&!charles);
  if(charles){const c=$('banter-rival').getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#252238';c.fillRect(0,0,62,76);c.save();c.translate(31,193);c.scale(1.25,1.25);renderer.charles?.draw(c,{...game?.s.charles,x:0,y:0,phase:'hover',phaseTime:0},0,prefs.reduced);c.restore();}
  else if(rival){const c=$('banter-rival').getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#252238';c.fillRect(0,0,62,76);const boss=rival==='travestia'||rival==='pelican';if(boss){c.save();c.scale(.55,.55);renderer.actors[rival==='pelican'?'drawPelican':'drawTravestia'](c,{x:56,y:130,phase:'chase',faceX:1},0);c.restore();}const frame=boss?null:renderer.actors.frame('enemy',0,false,rival);if(frame)c.drawImage(frame,38,6,64,80,0,0,62,76);else if(!boss){c.fillStyle='#ffd27c';c.font='bold 28px monospace';c.fillText(rival==='rival_goat'?'B':'C',22,46);}}
  else $('banter-portrait').src=payload.who==='BLONDE IA'?'assets/portrait-blonde-ia.webp':'assets/portrait-toma-current.webp';
  banterSpeechId=payload.speechId??null;$('banter').classList.remove('hidden');banterUntil=performance.now()+Math.max(4300,payload.text.length*39);
}
function openDialogue(lines,done,index=0){if(!lines.length){done?.();return;}dialogueSession++;dialogueLines=lines;dialogueIndex=index;dialogueDone=done;auto=false;$('auto-dialogue').setAttribute('aria-pressed','false');setText('auto-dialogue','AUTO : NON');show('dialogue');renderDialogue();$('next-dialogue').focus?.();}
function renderDialogue(){
 dialogueRender++;clearTimeout(autoTimer);const l=dialogueLines[dialogueIndex];if(!l){finishDialogue();return;}
 const stage=openingStage(dialogueLines,dialogueIndex),girl=l.who==='BLONDE IA';
 for(const name of ['fantasy','offline','street'])$('dialogue').classList.toggle(`opening-${name}`,stage===name);
 $('dialogue').classList.toggle('opening',Boolean(stage));$('auto-dialogue').classList.toggle('hidden',Boolean(stage));
 $('opening-reply').classList.toggle('hidden',!stage||!l.reply);$('opening-avatar').classList.toggle('hidden',true);setText('opening-reply-text',l.reply||'');
 setText('speaker',l.who==='TOMA'?'TOMA POPESCU':l.who);setText('dialogue-text',l.text);setText('dialogue-progress',`${dialogueIndex+1} / ${dialogueLines.length}`);
 $('portrait').src=girl?'assets/portrait-blonde-ia.webp':'assets/portrait-toma-current.webp';$('scene-art').src=girl?'assets/portrait-blonde-ia.webp':l.who==='SYSTÈME'?'assets/scene-gorilles.webp':'assets/couverture-personnages.webp';
 setText('next-dialogue',l.action||(dialogueIndex===dialogueLines.length-1?'C’EST PARTI ›':'SUITE ›'));
 setText('scene-label',stage==='fantasy'?'LA VIE PARFAITE · SELON TOMA':stage==='offline'?'CONNEXION PERDUE':stage==='street'?'LA RÉALITÉ · SANS FILTRE':'UNE RÉALITÉ TRÈS RELATIVE');
 renderEncounterPresentation({game,line:l,context:game?.dialoguePresentation(l),index:dialogueIndex,total:dialogueLines.length});
 if(auto&&!stage&&!document.hidden&&windowFocused){const session=dialogueSession,index=dialogueIndex,render=dialogueRender;autoTimer=setTimeout(()=>{if(screen==='dialogue'&&auto&&session===dialogueSession&&render===dialogueRender&&index===dialogueIndex&&windowFocused&&!document.hidden)nextDialogue();},Math.max(2500,l.text.length*48));}
}
function finishOpening(skipped=false){
 if(!runId){mainMenu();return;}
 game?.finishDialogue();if(game){if(skipped)game.s.opening={phase:'shoot',startedAt:game.s.elapsed};else beginTutorial(game);}
 stored.introSeen=true;save();syncEngineScreen();updateHud(true);requestSave();
}
function acceptDialogueInput(event){if(!event)return true;const now=performance.now();if(event.detail>1||now-lastDialogueInput<220)return false;lastDialogueInput=now;return true;}
function nextDialogue(event){
 if(screen!=='dialogue'||!dialogueDone||!windowFocused||document.hidden)return;
 if(!acceptDialogueInput(event))return;
 sound('click');const scene=game?.encounters.active;
 if(scene){if(!game.advanceEncounterDialogue(scene.id,dialogueIndex))return;if(!game.encounters.active){finishDialogue();return;}dialogueIndex=game.encounters.active.index;}else dialogueIndex++;
 renderDialogue();requestSave();
}
function finishDialogue(skipped=false,event){if(screen!=='dialogue'||!dialogueDone||!acceptDialogueInput(event))return;clearTimeout(autoTimer);dialogueSession++;const done=dialogueDone;dialogueDone=null;done(skipped);requestSave();}
function renderTrophies(type){
 const group=BOSS_TROPHIES[type];if(!group)return;
 show('trophies');$('trophies').style.setProperty('--trophy-color',group.color);
 setText('trophy-boss',group.name);setText('trophy-quote',group.quote);$('trophy-options').replaceChildren();
 const portrait=$('trophy-portrait');const paint=()=>{if(screen==='trophies'&&game?.s.trophies.pending[0]?.bossType===type)drawTrophyPortrait(portrait.getContext('2d'),renderer.actors,type,320,140);};
 if(renderer.actors)paint();renderer.ready?.then(paint);
 for(const id of group.choices){const t=TROPHIES[id];const button=document.createElement('button');button.className='trophy-card';button.setAttribute('data-trophy',id);button.setAttribute('aria-label',`${t.name}. ${t.tag}. ${t.desc}. ${t.detail}`);
 const icon=document.createElement('canvas');icon.width=47;icon.height=47;drawTrophyIcon(icon.getContext('2d'),id,23,23,1,group.color);
 const name=document.createElement('h4');name.textContent=t.name;const tag=document.createElement('span');tag.className='trophy-tag';tag.textContent=t.tag;
 const desc=document.createElement('p');desc.className='trophy-description';desc.textContent=t.desc;const detail=document.createElement('p');detail.className='trophy-detail';detail.textContent=t.detail;
 const arrow=document.createElement('span');arrow.className='trophy-arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');button.append(icon,name,tag,arrow,desc,detail);
 button.addEventListener('click',()=>{if(transitionBusy||!game||game.s.mode!=='trophy'||game.s.trophies.pending[0]?.bossType!==type||!game.chooseTrophy(id))return;powerSignature='';syncEngineScreen();updateHud(true);requestSave();});$('trophy-options').append(button);
 }
 $('trophy-options').children[0]?.focus?.();
}
function showTrophyToast(t){if(!t)return;trophyToastQueue.push(t);if(screen==='hud')nextTrophyToast();}
function nextTrophyToast(){if(trophyToastRemaining>0||!trophyToastQueue.length||game?.s.mode!=='playing')return;const t=trophyToastQueue.shift();setText('trophy-toast-text',`${t.name.toUpperCase()} ACQUIS`);const c=$('trophy-toast-icon').getContext('2d');c.clearRect(0,0,32,32);drawTrophyIcon(c,t.id,16,16,.65,t.color);trophyToastRemaining=1.5;$('trophy-toast').classList.remove('hidden');}
function updateTrophyHud(){
 const s=game.s;for(const id of Object.values(s.trophies?.chosen||{})){const t=TROPHIES[id];if(!t)continue;let el=$('powers').children;el=Array.from(el).find(e=>e.getAttribute?.('data-trophy')===id);
 if(!el){el=document.createElement('span');el.className='power-icon trophy-power';el.setAttribute('data-trophy',id);const c=document.createElement('canvas');c.width=26;c.height=26;drawTrophyIcon(c.getContext('2d'),id,13,13,.65,t.color);const cooldown=document.createElement('small');el.append(c,cooldown);$('powers').append(el);}
 const left=Math.ceil(s.trophies.cooldowns[id]||0);el.title=`${t.name} · ${left?`Recharge ${left} s`:id==='badge'?'Passif':'Prêt'}`;el.setAttribute('aria-label',el.title);el.classList.toggle('recharging',left>0);el.children[1].textContent=left?`${left}s`:'';
 }
}
function renderUpgrades(options){
 show('upgrades');audio.unlock().then(()=>sound('level'));$('upgrade-options').replaceChildren();
 for(const u of options.slice(0,3)){
  const rank=game?.state.upg[u.id]||0,permanent=UPGRADES.some(def=>def.id===u.id),evolution=EVOLUTIONS.find(def=>def.id===u.id);
  const companion=u.id==='girlfriend'?companionLevel(rank+1):null,car=u.id==='car'?carLevel(rank+1):null,description=companion?.description||car?.description||u.desc;
  const button=document.createElement('button');button.className=`upgrade-card${evolution?' evolution-card':''}`;
  if(evolution)button.style.setProperty('--evolution-color',evolution.color);
  button.setAttribute('aria-label',`${u.name}. ${evolution?`Évolution disponible. ${evolution.requirement}. `:''}${description}. ${permanent?`Niveau ${rank+1}`:evolution?'Évolution permanente':'Récompense immédiate'}`);
  const icon=document.createElement(companion?'img':'canvas');icon.width=48;icon.height=48;if(companion){icon.src=COMPANION_PORTRAITS[companion.rank-1];icon.alt=`Blonde IA, niveau ${companion.rank}, ${companion.name}`;}else drawIcon(icon.getContext('2d'),u.icon||u.id,0,0,48);
  const copy=document.createElement('div');copy.className='upgrade-copy';const name=document.createElement('h3');name.textContent=companion?`${u.name} · ${companion.name}`:car?`${u.name} · ${car.name}`:u.name;
  const desc=document.createElement('p');desc.textContent=description;const level=document.createElement('span');level.className='upgrade-rank';
  if(evolution){level.textContent='ÉVOLUTION DISPONIBLE';const requirement=document.createElement('p');requirement.className='evolution-requirement';requirement.textContent=evolution.requirement;copy.append(name,level,requirement,desc);}
  else{level.textContent=permanent?`${rank===0?'NOUVEAU POUVOIR':`NIV. ${rank} → ${rank+1}`}  ${rank+1===u.max?'· MAX':''}`:'RÉCOMPENSE IMMÉDIATE';copy.append(name,desc,level);}
  const arrow=document.createElement('span');arrow.className='upgrade-arrow';arrow.textContent='›';button.append(icon,copy,arrow);
  button.addEventListener('click',()=>{if(transitionBusy||!game||game.state.mode!=='upgrade'||!game.chooseUpgrade(u.id))return;powerSignature='';syncEngineScreen();updateHud(true);if(u.id==='girlfriend'&&rank===0&&EVENTS.companion)game.startDialogue(EVENTS.companion);requestSave();});$('upgrade-options').append(button);
 }
 renderReroll();setText('synergy-note','LE TEMPS EST ARRÊTÉ. CHOISIS TRANQUILLEMENT.');
}
function renderReroll(){
 if(!game)return;const s=game.s,cost=game.rerollCost();setText('upgrade-coins',s.coins);
 setText('reroll-upgrades',upgradePurchasePending?'SAUVEGARDE…':cost===null?'RELANCES ÉPUISÉES':`↻ RELANCER · ${cost} PIÈCES`);
 $('reroll-upgrades').disabled=transitionBusy||!runPersistence||!game.canRerollUpgrade();
 setText('reroll-count',`${s.upgradeRerolls} / 2 relances utilisées`);
 setText('reroll-feedback',!runPersistence?'Relance indisponible sans sauvegarde.':cost===null?'Deux relances utilisées pour ce niveau.':s.coins<cost?'Pas assez de pièces pour relancer.':!game.canRerollUpgrade()?'Aucune autre carte disponible.':'Nouveau choix de 3 cartes.');
}
async function rerollUpgrades(){
 if(transitionBusy||!game||!runPersistence||!game.canRerollUpgrade())return false;
 const current=game,id=runId;transitionBusy=true;upgradePurchasePending=true;renderReroll();
 try{
  // Do not show new cards or debit the live balance until both are durable.
  const candidate=prepareGame(restoreRun(captureRun(current)),current);if(!candidate.rerollUpgrade())return false;
  const result=await runStore.checkpoint(id,candidate);
  if(game!==current||runId!==id)return false;
  if(!result.ok){if(result.reason==='conflict'){runPersistence=false;runConflict=true;}showSaveError(result.reason);return false;}
  candidate.onEvent=onGameEvent;game=candidate;savedRecord={status:'ready',value:result.value};flushRequested=false;lastSaveError='';$('toast').classList.add('hidden');
  renderUpgrades(game.s.options);updateHud(true);return true;
 }catch{showSaveError('write-failed');return false;}
 finally{upgradePurchasePending=false;transitionBusy=false;if(game===current||game?.s.mode==='upgrade')renderReroll();}
}

function charlesActive(){return Boolean(game?.s.charles&&game.s.charles.phase!=='complete'&&!game.s.endless);}
function canMeetCharles(){const s=game?.s;return Boolean(s&&s.mode==='victory'&&!s.endless&&!s.charles);}
function openCharlesConfirm(){if(transitionBusy||screen!=='results'||!canMeetCharles())return;show('charles-confirm');$('charles-cancel').focus?.();}
function cancelCharlesConfirm(){if(screen!=='charles-confirm')return;show('results');$('meet-charles').focus?.();}
function startCharlesEpilogue(){
 if(transitionBusy||screen!=='charles-confirm'||!canMeetCharles())return;
 show('hud');if(!game.startCharlesEpilogue()){show('results');return;}
 lastTime=performance.now();updateHud(true);requestSave();
}
function leaveCharlesEpilogue(){
 if(transitionBusy||screen!=='pause-screen'||!charlesActive())return;
 recoveryPending=false;
 game.leaveCharlesEpilogue();updateHud(true);requestSave();if(screen!=='results')syncEngineScreen();
}
function updateCharlesHud(){
 const c=game.s.charles,active=charlesActive();$('hud').classList.toggle('charles-active',active);$('charles-banner').classList.toggle('hidden',!active);
 if(!active)return;
 const phases={intro:'ENTRÉE DE CHARLES',hover:'EN LÉVITATION',shock_warning:'ONDE DE CHOC · OUVERTURE VERTE',shockwave:'ONDE DE CHOC · OUVERTURE VERTE',cape_warning:'CAPE · SORS DU CERCLE DORÉ',cape_spin:'CAPE · SORS DU CERCLE DORÉ',recover:'REPRISE',descend:'IL REDESCEND',bend:'LA TRANSFORMATION COMMENCE',scream:'CRI DE PUISSANCE',burst:'EXPLOSION DE PUISSANCE',empowered:'PLEINE PUISSANCE'};
 setText('charles-phase',phases[c.phase]||'CHARLES EST LÀ');
 setText('charles-progress',c.powered?'TRANSFORMATION ACCOMPLIE':`${Math.max(0,Math.min(18,Math.floor(c.hits||0)))} / 18 touches → transformation`);
}

function pause(){if(!game||game.state.mode!=='playing')return;game.pause();setText('pause-stats',`${format(game.state.elapsed)}  ·  ${game.state.kills} SINGES  ·  NIV. ${game.state.level}`);show('pause-screen');requestSave();}
function resume(){if(!game||transitionBusy||screen!=='pause-screen')return;audio.unlock();lastTime=performance.now();resetInput();
 if(recoveryPending){recoveryPending=false;if(game.s.mode==='dialogue'){show('dialogue');renderDialogue();$('next-dialogue').focus?.();return;}}
 game.resume();syncEngineScreen();requestSave();}
// A live run is released only after a successful checkpoint or an explicit
// discard. A conflict is not the opt-in nonpersistent mode chosen at start.
function ownsSaveExitChoice(){return screen==='save-exit'&&saveExitChoice?.game===game&&saveExitChoice?.id===runId;}
function openSaveExit(reason){
 const conflict=runConflict||reason==='conflict';
 saveExitChoice={game,id:runId,conflict};
 setText('save-exit-title',conflict?'PARTIE MODIFIÉE AILLEURS':'SAUVEGARDE IMPOSSIBLE');
 setText('save-exit-status',conflict?'La sauvegarde a été modifiée dans un autre onglet.':'Ta progression est encore dans cette session.');
 setText('save-exit-details',conflict?'Ta session reste en pause. Quitter abandonnera ses progrès récents. Le menu te permettra de vérifier la sauvegarde disponible.':'Réessaie ou reste en pause. Si tu quittes maintenant, les progrès depuis la dernière sauvegarde seront perdus.');
 $('save-exit-retry').classList.toggle('hidden',conflict);
 $('save-exit-stay').classList.toggle('primary',conflict);$('save-exit-stay').classList.toggle('secondary',!conflict);
 $('toast').classList.add('hidden');show('save-exit');$('save-exit-stay').focus?.();
}
function stayAfterSaveFailure(){if(!ownsSaveExitChoice())return;show('pause-screen');$('pause-menu').focus?.();}
function discardAfterSaveFailure(){if(transitionBusy||!ownsSaveExitChoice())return;mainMenu();}
async function exitPausedRun(retry=false){
 if(transitionBusy||!game||(retry?!ownsSaveExitChoice()||saveExitChoice.conflict:screen!=='pause-screen'))return;
 const current=game,id=runId,navigation=navigationVersion;
 const ownsNavigation=()=>game===current&&runId===id&&navigationVersion===navigation;
 transitionBusy=true;$('save-exit-retry').disabled=true;$('save-exit-discard').disabled=true;
 try{
  if(['gameover','victory'].includes(current.s.mode)||!runPersistence&&!runConflict){
   await recordRun();if(ownsNavigation())mainMenu();return;
  }
  const result=runConflict?{ok:false,reason:'conflict'}:await persistRun(true);
  // Settings (even an out-and-back visit) or a dismissed choice owns the UI
  // now. A completed checkpoint may stand, but must not steal navigation.
  if(!ownsNavigation())return;
  if(result.ok)mainMenu();else openSaveExit(result.reason);
 }finally{transitionBusy=false;$('save-exit-retry').disabled=false;$('save-exit-discard').disabled=false;}
}
function saveExitKey(e,key){
 if(screen!=='save-exit')return false;
 if(key==='escape'){e.preventDefault();if(!e.repeat)stayAfterSaveFailure();return true;}
 if(key==='tab'){
  const choices=[$('save-exit-retry'),$('save-exit-stay'),$('save-exit-discard')].filter(button=>!button.disabled&&!button.classList.contains('hidden'));
  const index=choices.indexOf(document.activeElement),step=e.shiftKey?-1:1;
  e.preventDefault();choices[index<0?(e.shiftKey?choices.length-1:0):(index+step+choices.length)%choices.length]?.focus?.();return true;
 }
 return false;
}
async function recordRun(){if(!game)return false;const current=game,id=runId,s=current.s,newRecord=s.elapsed>best;
 const result=await persistRun(true);if(!result.ok&&game===current&&runId===id){best=Math.max(best,s.elapsed);lifetime+=Math.max(0,s.kills-creditedKills);lifetimeCoins+=Math.max(0,totalEarnedCoins(s)-creditedCoins);creditedKills=s.kills;creditedCoins=totalEarnedCoins(s);}return newRecord;}
async function renderResult(win){if(!game)return;const current=game,s=game.state;const newRecord=s.elapsed>best;resultRecorded=true;show('results');audio.unlock().then(()=>sound(win?'victory':'defeat'));const panel=document.querySelector('.result-panel');panel.classList.toggle('victory',win);panel.classList.toggle('defeat',!win);setText('result-title',win?'VICTOIRE !':'GAME OVER');const epilogueDone=win&&s.charles?.phase==='complete';$('charles-choice').classList.toggle('hidden',!win||!canMeetCharles());$('charles-result').classList.toggle('hidden',!epilogueDone);if(epilogueDone){setText('result-title','VICTOIRE EN SURVIE !');setText('charles-result',s.charles.outcome==='defeated'?'ÉPILOGUE TERMINÉ · Charles a mis Toma K.O. Il reste invaincu. Ta victoire des 20 minutes est conservée.':'ÉPILOGUE TERMINÉ · Charles reste invaincu. Ta victoire des 20 minutes est conservée.');}setText('result-kicker',win?'20 MINUTES. ZÉRO RETOUCHE.':'UNE FIN TRÈS DRAMATIQUE');setText('result-quote',win?victoryQuote(s,current.eventSeen):'FUCKK ! Efface la vidéo. On recommence.');setText('result-time',format(s.elapsed));setText('result-kills',s.kills.toLocaleString('fr-CA'));setText('result-coins',totalEarnedCoins(s).toLocaleString('fr-CA'));setText('result-gems',s.gems.toLocaleString('fr-CA'));setText('record-message',newRecord?'✦ NOUVEAU RECORD PERSONNEL ✦':`RECORD PERSONNEL · ${format(best)}`);$('endless').classList.toggle('hidden',!win);$('retry').classList.toggle('secondary',win);$('retry').classList.toggle('primary',!win);await recordRun();if(game===current&&screen==='results')updateRecordMenu();}
function updateHud(force=false){if(!game)return;const s=game.state;const help=tutorialText(game);$('opening-help').classList.toggle('hidden',!help);setText('opening-help-text',help);audio.setIntensity?.(Math.min(1,s.elapsed/1000+s.enemies.length/650));setText('level',`NIV. ${s.level}`);setText('time',format(s.elapsed));setText('time-goal',charlesActive()?'CHARLES EST LÀ':s.endless?'SURVIE INFINIE':'OBJECTIF 20:00');setText('health-text',`${Math.max(0,Math.ceil(s.hp))} / ${s.maxhp}${s.shield>0?' + ◇':''}`);$('health-fill').style.width=`${Math.max(0,s.hp)/s.maxhp*100}%`;$('xp-fill').style.width=`${Math.min(100,s.xp/s.xpNeed*100)}%`;setText('xp-text',`EXPÉRIENCE ${Math.floor(s.xp)} / ${s.xpNeed}`);setText('coins',s.coins);setText('gems',s.gems);setText('kills',s.kills);setText('coordinates',`SECTEUR ${Math.floor(s.x/512)} · ${Math.floor(s.y/512)}  /  ${DIFFICULTIES[s.difficulty]?.label||s.difficulty}`);$('companion').classList.toggle('unlocked',s.companion);const companion=companionLevel(s.upg.girlfriend);setText('companion-status',s.companion?`NIV. ${companion.rank}/5 · ${s.girl?.down>0?`RETOUR ${Math.ceil(s.girl.down)} s`:companion.short}`:'SIGNAL VERROUILLÉ');$('companion').setAttribute('aria-label',s.companion?`Blonde IA, niveau ${companion.rank} sur 5. ${companion.description}`:'Blonde IA, signal verrouillé');const portrait=$('companion-portrait'),portraitPath=s.companion?COMPANION_PORTRAITS[companion.rank-1]:'assets/portrait-blonde-ia.webp';if(portrait.getAttribute?.('src')!==portraitPath)portrait.setAttribute('src',portraitPath);setText('companion-lock',s.companion?'♥':'◇');const sig=JSON.stringify([s.upg,s.evolutions,s.trophies?.chosen]);if(sig!==powerSignature||force){powerSignature=sig;$('powers').replaceChildren();for(const [id,rank] of Object.entries(s.upg)){if(!rank)continue;const u=UPGRADES.find(u=>u.id===id);if(!u)continue;const el=document.createElement('span');el.className='power-icon';const evolved=EVOLUTIONS.find(def=>s.evolutions[def.id]&&def.requires.includes(id));el.title=`${u.name} · Niveau ${rank}${evolved?` · ${evolved.name}`:''}`;const c=document.createElement('canvas');c.width=26;c.height=26;drawIcon(c.getContext('2d'),u.icon||id,0,0,26);const n=document.createElement('small');n.textContent=rank;el.append(c,n);$('powers').append(el);}}updateTrophyHud();updateDiscoveryHud();updateCharlesHud();drawArrows();}
function updateDiscoveryHud(){
  const discovery=game.state.discovery,active=discovery?.active,site=active||discovery?.nearby;
  const visible=Boolean(site)&&!charlesActive();
  $('discovery-status').classList.toggle('hidden',!visible);
  $('discovery-summary').classList.toggle('hidden',!visible);
  $('time-goal').classList.toggle('hidden',visible);
  if(!site)return;
  const kind=site.kind||site.discoveryType;
  const names={cabin:'CABANE',ruin:'RUINES',altar:'AUTEL',wreck:'ÉPAVE',anomaly:'FAILLE'};
  const effects={cabin:'SOIN',ruin:'DÉGÂTS',altar:'AIMANT',wreck:'VITESSE',anomaly:'CADENCE'};
  const summary=active?`${effects[kind]||'BONUS'} · ${Math.ceil(active.remaining)} s`:site.cooldown>0?'LIEU ÉPUISÉ':`${names[kind]||'LIEU'} PROCHE`;
  const description=active?site.description:discoveryPrompt(site);
  setText('discovery-summary',summary);
  const detail=`${site.name||'Découverte'}. ${active?`${Math.ceil(active.remaining)} secondes. `:''}${description} Détails en pause.`;
  $('discovery-summary').setAttribute('aria-label',detail);
  $('discovery-summary').setAttribute('title',detail);
  $('discovery-status').style.setProperty('--discovery-color',site.color||'#c6bbff');
  setText('discovery-name',site.name||'Découverte');
  setText('discovery-time',active?`${Math.ceil(active.remaining)} s`:site.cooldown>0?`${Math.ceil(site.cooldown)} s`:'◇');
  setText('discovery-description',description);
  $('discovery-fill').style.width=active?`${Math.max(0,Math.min(100,active.remaining/active.duration*100))}%`:'100%';
}
function drawArrows(){const s=game.state;const targets=s.chests.filter(c=>!c.open).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)).slice(0,1);if(s.companionItem)targets.push({...s.companionItem,isGirl:true});$('offscreen').replaceChildren();for(const target of targets){const dx=target.x-s.x,dy=target.y-s.y,halfW=width/2-28,halfH=height*.34;if(Math.abs(dx)<halfW&&Math.abs(dy)<halfH)continue;const scale=Math.min(halfW/Math.abs(dx||.001),halfH/Math.abs(dy||.001));const el=document.createElement('span');el.className=`target-arrow ${target.isGirl?'girl-arrow':''}`;el.textContent=target.isGirl?'♥':'▣';el.style.left=`${width/2+dx*scale-14}px`;el.style.top=`${height*.48+dy*scale-14}px`;el.title=target.isGirl?'Blonde IA':'Coffre';$('offscreen').append(el);}}
function keyVector(){let x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('q')||keys.has('arrowleft'));let y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('z')||keys.has('arrowup'));const d=Math.hypot(x,y)||1;return{x:x/d,y:y/d};}
function dialogueKey(e,key){
 if(screen!=='dialogue')return false;
 const buttons=[$('skip-dialogue'),$('auto-dialogue'),$('next-dialogue')];
 if(key==='tab'){
  const text=$('dialogue-text'),choices=[buttons[0],...(text.getAttribute('tabindex')==='0'?[text]:[]),buttons[1],buttons[2]].filter(node=>!node.hidden&&!node.disabled&&!node.classList.contains('hidden'));
  const index=choices.indexOf(document.activeElement),next=index<0?(e.shiftKey?choices.length-1:0):(index+(e.shiftKey?-1:1)+choices.length)%choices.length;
  e.preventDefault();choices[next]?.focus?.();return true;
 }
 if(key!=='enter'&&key!==' ')return false;
 if(key===' '&&e.target===$('dialogue-text'))return true;
 if(e.repeat){e.preventDefault();return true;}
 // Let the focused control keep its own native action. The click handler owns
 // input de-duplication; keyboard shortcuts elsewhere continue the current line.
 if(buttons.includes(e.target?.closest?.('button')||e.target))return true;
 e.preventDefault();nextDialogue(e);return true;
}
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(assetWait&&key==='escape'){if(!e.repeat)cancelAssetWait();return;}if(key===' '&&!e.repeat){const button=e.target?.closest?.('button');hudSpacePress=screen==='hud'&&button?{button,cancelled:false}:null;}if(e.target instanceof HTMLInputElement&&!(key==='escape'&&screen==='settings'&&[$('volume'),$('sound-setting'),$('reduced-fx'),$('banter-setting')].includes(e.target)))return;if(e.repeat&&['enter',' '].includes(key)&&screen!=='dialogue'){e.preventDefault();return;}if(screen==='hud'&&(['arrowup','arrowdown','arrowleft','arrowright'].includes(key)||(key===' '&&!e.target?.closest?.('button'))))e.preventDefault();if(saveExitKey(e,key)||dialogueKey(e,key))return;if(screen==='charles-confirm'&&key==='tab'){e.preventDefault();const choices=[$('charles-cancel'),$('charles-start')],index=choices.indexOf(document.activeElement);choices[(index+1)%choices.length].focus?.();return;}if(screen==='trophies'&&['tab','arrowleft','arrowright','arrowup','arrowdown'].includes(key)){e.preventDefault();const cards=Array.from($('trophy-options').children),index=cards.indexOf(document.activeElement),step=e.shiftKey||key==='arrowleft'||key==='arrowup'?-1:1;cards[(index+step+cards.length)%cards.length]?.focus?.();return;}if(key==='escape'){if(e.repeat)return;if(screen==='hud')pause();else if(screen==='pause-screen')resume();else if(screen==='settings')show(settingsReturn);else if(screen==='charles-confirm')cancelCharlesConfirm();else if(screen==='dialogue')finishDialogue(true,e);return;}if(key==='m'&&!e.repeat){toggleSound();return;}if(screen==='hud'&&!assetWait&&(!e.repeat||keys.has(key)))keys.add(key);});
// Space belongs to its original HUD button until release. A screen/input reset
// cancels native keyup activation instead of transferring it to a new control.
window.addEventListener('keyup',e=>{const key=e.key.toLowerCase();keys.delete(key);if(key===' '&&hudSpacePress){const press=hudSpacePress;hudSpacePress=null;if(press.cancelled||screen!=='hud'||e.target?.closest?.('button')!==press.button)e.preventDefault();}});
// The invisible CSS box resolves env(safe-area-inset-*) to real pixels. Use
// untransformed DOM metrics so both the base and the thumb's full 33px travel
// fit, including the smaller joystick on narrow screens and its border.
function joystickPlacement(x,y,r){
 const area=$('control-safe-area').getBoundingClientRect(),joy=$('joystick'),stick=$('stick');
 const left=Math.max(0,area.left-r.left),top=Math.max(height*.35,area.top-r.top);
 const right=Math.min(width,area.left+area.width-r.left),bottom=Math.min(height,area.top+area.height-r.top);
 if(x<left||x>Math.min(right,width*.75)||y<top||y>bottom)return null;
 const w=joy.offsetWidth,h=joy.offsetHeight,tx=joy.clientLeft+stick.offsetLeft,ty=joy.clientTop+stick.offsetTop;
 if(!(w>0&&h>0&&stick.offsetWidth>0&&stick.offsetHeight>0))return null;
 const minX=Math.min(0,tx-33),minY=Math.min(0,ty-33);
 const maxX=Math.max(w,tx+stick.offsetWidth+33),maxY=Math.max(h,ty+stick.offsetHeight+33);
 const lowX=left-minX,highX=right-maxX,lowY=top-minY,highY=bottom-maxY;
 if(lowX>highX||lowY>highY)return null;
 return {left:Math.max(lowX,Math.min(highX,x-w/2)),top:Math.max(lowY,Math.min(highY,y-h/2))};
}
app.addEventListener('pointerdown',e=>{if(assetWait||screen!=='hud'||e.target.closest('button')||pointer!==null)return;const bounds=app.getBoundingClientRect(),r={left:bounds.left+(app.clientLeft||0),top:bounds.top+(app.clientTop||0)};const placement=joystickPlacement(e.clientX-r.left,e.clientY-r.top,r);if(!placement)return;pointer=e.pointerId;origin={x:e.clientX,y:e.clientY};try{app.setPointerCapture(pointer)}catch{}$('joystick').classList.add('active');$('joystick').style.left=`${placement.left}px`;$('joystick').style.top=`${placement.top}px`;$('joystick').style.bottom='auto';e.preventDefault();});
app.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;const dx=e.clientX-origin.x,dy=e.clientY-origin.y,d=Math.hypot(dx,dy)||1;const k=Math.min(1,d/40);input={x:dx/d*k,y:dy/d*k};$('stick').style.transform=`translate(${input.x*33}px,${input.y*33}px)`;e.preventDefault();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])app.addEventListener(event,e=>{if(e.pointerId===pointer)resetInput();});
window.addEventListener('blur',()=>{windowFocused=false;cancelStartAttempt();clearTimeout(autoTimer);cancelAssetWait();resetInput();if(screen==='hud')pause();});
window.addEventListener('focus',()=>{windowFocused=true;if(screen==='dialogue'&&auto&&!document.hidden)renderDialogue();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelStartAttempt();cancelAssetWait();clearTimeout(autoTimer);resetInput();if(screen==='hud')pause();audio.setScene('paused');if(game&&screen!=='save-exit')autosave.flush();}else{lastTime=performance.now();syncAudio();if(screen==='dialogue'&&auto)renderDialogue();}});
$('reroll-upgrades').onclick=rerollUpgrades;
$('resume-saved').onclick=resumeSaved;$('play').onclick=start;$('story').onclick=()=>{runId=null;runPersistence=false;game=prepareGame(new Game({difficulty,seed:42}));game.setViewport(width,height);game.s.mode='dialogue';openDialogue(OPENING,mainMenu);sound();};
$('next-dialogue').onclick=nextDialogue;$('skip-dialogue').onclick=event=>finishDialogue(true,event);$('auto-dialogue').onclick=()=>{auto=!auto;$('auto-dialogue').setAttribute('aria-pressed',String(auto));setText('auto-dialogue',`AUTO : ${auto?'OUI':'NON'}`);renderDialogue();};
$('opening-help-skip').onclick=()=>{if(game?.s.opening){game.s.opening.phase='done';requestSave();updateHud(true);}};
$('pause').onclick=pause;$('resume').onclick=resume;$('restart').onclick=start;$('pause-menu').onclick=()=>exitPausedRun();
$('save-exit-retry').onclick=()=>exitPausedRun(true);$('save-exit-stay').onclick=stayAfterSaveFailure;$('save-exit-discard').onclick=discardAfterSaveFailure;
$('settings-open').onclick=()=>{settingsReturn='pause-screen';show('settings');syncPrefs();};$('settings-back').onclick=()=>show(settingsReturn);
$('meet-charles').onclick=openCharlesConfirm;$('charles-cancel').onclick=cancelCharlesConfirm;$('charles-start').onclick=startCharlesEpilogue;$('charles-leave').onclick=leaveCharlesEpilogue;
$('retry').onclick=start;$('result-menu').onclick=async()=>{if(transitionBusy||screen!=='results')return;transitionBusy=true;try{if(game)await recordRun();mainMenu();}finally{transitionBusy=false;}};$('endless').onclick=()=>{if(transitionBusy||screen!=='results'||game?.s.mode!=='victory')return;game.continueEndless();requestSave();resultRecorded=false;syncEngineScreen();updateHud(true);showBanter({who:'TOMA',text:'Vingt minutes ? C’était juste mon échauffement de légende.'});};
$('credits-open').onclick=()=>{creditsReturn='menu';show('credits');};$('credits-back').onclick=()=>show(creditsReturn);
$('banter-close').onclick=()=>{if(banterSpeechId!==null)game?.dismissSpeech();banterSpeechId=null;banterUntil=0;$('banter').classList.add('hidden');};
for(const button of document.querySelectorAll('.sound-button'))button.onclick=toggleSound;
for(const button of document.querySelectorAll('[data-difficulty]'))button.onclick=()=>{setDifficulty(button.dataset.difficulty);sound();};
$('sound-setting').onchange=e=>{prefs.sound=e.target.checked;audio.unlock();syncPrefs();save();};$('volume').oninput=e=>{prefs.volume=Number(e.target.value);syncPrefs();save();};$('reduced-fx').onchange=e=>{prefs.reduced=e.target.checked;if(game)game.state.reducedEffects=prefs.reduced;syncPrefs();save();};$('banter-setting').onchange=e=>{prefs.banter=e.target.checked;syncPrefs();save();};
// Measure only before a due first-tour attempt. Bounds are simulation inputs,
// not renderer state, and include the joystick at its actual dragged location.
function refreshAnimalEntryOcclusions(dt){
 if(game.timers.spawn>dt||!((game.timers.animalIndex<4&&game.timers.animal<=dt)||(game.timers.egoIndex<4&&game.timers.ego<=dt)))return;
 const c=canvas.getBoundingClientRect();if(!(c.width>0&&c.height>0))return;
 const sx=game.viewport.width/c.width,sy=game.viewport.height/c.height,rects=[];
 const selector='.hud-head,.xp-track,#powers,.wallet,.bottom-hud,#joystick,#opening-help,#banter,#wave,#discovery-status,#offscreen .target-arrow,#trophy-toast,#toast,#control-hint,#coordinates';
 for(const el of document.querySelectorAll(selector)){
  if(el.getClientRects&&el.getClientRects().length===0)continue;
  const r=el.getBoundingClientRect();if(!(r.width>0&&r.height>0))continue;
  const box={x:(r.left-c.left)*sx,y:(r.top-c.top)*sy,width:r.width*sx,height:r.height*sy};
  if(rects.length<24)rects.push(box);
  else{ // Keep an overflow conservative instead of silently dropping a panel.
   const last=rects[23],right=Math.max(last.x+last.width,box.x+box.width),bottom=Math.max(last.y+last.height,box.y+box.height);
   last.x=Math.min(last.x,box.x);last.y=Math.min(last.y,box.y);last.width=right-last.x;last.height=bottom-last.y;
  }
 }
 game.setViewportOcclusions(rects);
}
function frame(now){const dt=Math.min(.05,Math.max(0,(now-lastTime)/1000));lastTime=now;if(game){if(!assetWait&&screen==='hud'&&game.state.mode==='playing'){const movement=pointer!==null?input:keyVector();if(updateTutorial(game,movement)){refreshAnimalEntryOcclusions(dt);game.update(dt,movement);}}if(!transitionBusy&&!recoveryPending&&runPersistence&&screen!=='save-exit'){if(flushRequested){flushRequested=false;autosave.flush();}else if(screen==='hud')autosave.tick();}renderer.render(game,now/1000);if(now-uiTick>120){uiTick=now;updateHud();}if(banterSpeechId!==null?game.speech.active?.id!==banterSpeechId:banterUntil<now)$('banter').classList.add('hidden');if(screen==='hud'&&game.s.mode==='playing'&&trophyToastRemaining>0){trophyToastRemaining=Math.max(0,trophyToastRemaining-dt);if(trophyToastRemaining===0){$('trophy-toast').classList.add('hidden');nextTrophyToast();}}}else{renderer.ctx.fillStyle='#0d1023';renderer.ctx.fillRect(0,0,width,height);}requestAnimationFrame(frame);}
setDifficulty(difficulty);syncPrefs();updateRecordMenu();updateResumeMenu();requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{cancelStartAttempt();cancelHudSpacePress();cancelAssetWait();if(game&&screen!=='save-exit')autosave.flush();});
window.addEventListener('error',e=>{console.error('Toma runtime:',e.message);$('loading').classList.add('hidden');});
