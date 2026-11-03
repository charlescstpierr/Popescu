import {updateTrophyEffects,reduceTrophyDamage,notifyTrophyDamage,trophySpeedMultiplier} from './trophy-effects.js';
import {createTrophyState,queueBossTrophy,openPendingTrophy,chooseBossTrophy,trimTrophyChests} from './boss-trophies.js';
import {EVOLUTIONS,REROLL_COSTS,evolutionReady,bounceHeart,updateCarBills} from './evolutions.js';
import {compactDrops} from './drops.js';
import {BOSS_SCHEDULE,createBossDirector,scheduleNextBoss,isMajorBoss} from './boss-director.js';
import {pelicanLocked,updatePelican,interruptPelican} from './pelican.js';
import {ANIMALS,animalLocked,updateAnimal,interruptAnimal} from './animals.js';
import { DISCOVERIES, DISCOVERY_COOLDOWN } from './discoveries.js';
import { tailLocked, updateTravestia } from './travestia.js';
import { World } from './world.js';
import { computeHeroPose, solveHeroAim } from './hero-pose.js';
import { UPGRADES, DIFFICULTIES, contextualBarks, WORLD_REMARKS, STORY_MILESTONES, STUNT_BARKS, STUNT_REPLIES, RIVAL_BARKS, RIVAL_REPLIES, RIVAL_COMPANION_REPLIES, ROOSTER_REACTION } from './content.js';

const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const length=(x,y)=>Math.hypot(x,y);
const dist=(a,b)=>length(a.x-b.x,a.y-b.y);
const CAP={enemies:300,shots:320,drops:260,clouds:90,particles:200,vehicles:10,pulses:36,chests:12,shockwaves:12};
const CONSUMABLES=[{id:'recovery',name:'Pause protéinée',desc:'Récupère 30 % des PV maximum.',icon:'ego',max:1,color:'#8eddab'},{id:'payday',name:'Petit contrat',desc:'Reçois 8 pièces immédiatement.',icon:'money',max:1,color:'#edc764'},{id:'barrier',name:'Compliment gratuit',desc:'Récupère jusqu’à 30 bouclier, sans dépasser ta capacité (minimum 30).',icon:'validation',max:1,color:'#8adce6'}];
const isRival=type=>type==='rival_rooster'||type==='rival_goat';
const BASE={...ANIMALS,pelican:{hp:760,speed:42,r:29},travestia:{hp:680,speed:39,r:30},rival_rooster:{hp:150,speed:70,r:20},rival_goat:{hp:220,speed:42,r:23},orangutan:{hp:40,speed:64,r:18},normal:{hp:24,speed:43,r:17},sprinter:{hp:17,speed:86,r:14},gas:{hp:42,speed:31,r:19},tank:{hp:132,speed:27,r:26},jealous:{hp:43,speed:68,r:18},explosive:{hp:33,speed:57,r:19},matriarch:{hp:550,speed:24,r:33}};

export class Game {
  constructor({difficulty='normal',seed=42,onEvent=()=>{}}={}) {
    this.onEvent=onEvent;this.seed=seed|0;this.rng=(seed|0) || 1;this.id=1;this.world=new World(seed);this.viewport={width:390,height:844};
    this.difficulty=DIFFICULTIES[difficulty] || DIFFICULTIES.normal || {hp:1,damage:1,spawn:1,speed:1};
    const hp=this.difficulty.hp>5?this.difficulty.hp:100*(this.difficulty.hp||1);
    this.state=this.s={mode:'playing',difficulty,x:0,y:0,hp,maxhp:hp,shield:0,xp:0,xpNeed:8,level:1,elapsed:0,kills:0,coins:0,coinsSpent:0,upgradeRerolls:0,evolutions:{},trophies:createTrophyState(),gems:0,endless:false,invulnerable:0,moveX:0,moveY:0,travelX:0,travelY:0,walkDistance:0,walkMoving:false,faceX:0,faceY:1,aimX:1,aimY:0,aimSide:1,stunt:{kind:'split',progress:0,time:0,duration:1.3,active:false,faceX:0,faceY:1,count:0},upg:{},companion:false,girl:{x:-28,y:24,hp:70,maxhp:70,down:0,shoot:0},enemies:[],shots:[],drops:[],clouds:[],particles:[],vehicles:[],pulses:[],chests:[],shockwaves:[],options:[],shotClock:.12,airplane:{x:0,y:0,active:false,life:0,r:440},stats:{}};
    this.timers={spawn:.02,car:1,money:1,airplane:2,chopper:.1,truth:1,bark:13,chest:28,horde:20,pack:10,rival:60,animal:12,animalIndex:0};
    this.bossDirector=createBossDirector(this.seed);
    // Visual-only records are bounded immediately and intentionally omitted from saved runs.
    this.defeatEffects=[];this.powerEffects=[];this.powerCueCooldowns=new Map();
    this.discoveryCooldowns=new Map();this.discoveryContact=null;this.s.discovery={active:null,count:0,nearby:null};
    this.eventSeen=new Set();this.nextEvent=28;this.lastHit=-10;this.barkIndex=0;this.stuntRng=(this.seed^0x5bd1e995)>>>0;this.stuntCharge=0;this.runStreak=0;this.stuntWait=12+this.stuntRandom()*6;this.pendingStuntReply=null;this.pendingRivalReply=null;this.rivalIndex=0;this.rivalBarkIndex=0;this.lastRivalBark=-100;this.rivalRng=(this.seed^0x7f4a7c15)>>>0;this.speechUntil=0;this.recalculate();this.world.update(0,0);
  }
  random(){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x|0;return (x>>>0)/4294967296;}
  stuntRandom(){this.stuntRng=(Math.imul(this.stuntRng,1664525)+1013904223)>>>0;return this.stuntRng/4294967296;}
  rivalRandom(){this.rivalRng=(Math.imul(this.rivalRng,1664525)+1013904223)>>>0;return this.rivalRng/4294967296;}
  emit(type,payload){this.onEvent(type,payload);}
  sound(name){this.emit('sound',name);}
  rank(id){return this.s.upg[id]||0;}
  setViewport(width,height){this.viewport={width:clamp(Number(width)||390,240,1600),height:clamp(Number(height)||844,320,1600)};}
  pause(){if(this.s.mode==='playing')this.s.mode='paused';}
  resume(){if(this.s.mode==='paused')this.s.mode='playing';}
  startDialogue(lines){if(!lines?.length || this.s.mode==='gameover')return;this.s.mode='dialogue';this.s.moveX=0;this.s.moveY=0;this.emit('dialogue',lines);}
  finishDialogue(){if(this.s.mode==='dialogue'){this.s.mode=this.s.options.length?'upgrade':'playing';if(this.s.mode==='upgrade')this.emit('upgrade',this.s.options);else this.openTrophy();}}
  continueEndless(){if(this.s.mode==='victory'){if(this.bossDirector.warned){this.bossDirector.warned=false;this.bossDirector.remaining=BOSS_SCHEDULE.warning;this.bossDirector.retryIn=0;}this.s.endless=true;this.s.mode=this.s.options.length?'upgrade':'playing';this.s.invulnerable=2;this.s.hp=Math.max(this.s.hp,this.s.maxhp*.5);if(this.s.mode==='upgrade')this.emit('upgrade',this.s.options);else this.openTrophy();}}
  openTrophy(){return openPendingTrophy(this);}
  chooseTrophy(id){return chooseBossTrophy(this,id);}
  finishUpgradeChoice(){if(!this.openTrophy())this.gainXP(0);}
  recalculate(){const r=id=>this.rank(id);this.s.stats={speed:144*(1+.08*r('speed')+.03*r('filter')),damage:18*(1+.25*r('muscle')),fireInterval:.52/(1+.18*r('followers')),magnet:70+35*r('magnet')+(this.s.companion?35:0),gasMultiplier:Math.max(.2,1-.16*r('filter')),shieldMax:16*r('validation')+(this.s.companion?20:0),range:620+25*r('followers')};const effect=DISCOVERIES[this.s.discovery?.active?.kind];if(effect){this.s.stats.speed*=effect.speed||1;this.s.stats.damage*=effect.damage||1;this.s.stats.fireInterval*=effect.fireInterval||1;this.s.stats.magnet+=effect.magnet||0;}this.s.stats.speed*=trophySpeedMultiplier(this.s);}
  chooseUpgrade(id){
    const s=this.s;if(s.mode!=='upgrade' || !s.options.some(o=>o.id===id))return false;
    const evolution=EVOLUTIONS.find(o=>o.id===id);
    if(evolution){if(!evolutionReady(s,evolution))return false;s.evolutions[id]=true;this.powerEffect(id,'acquire');s.options=[];s.mode='playing';s.invulnerable=Math.max(s.invulnerable,.6);this.sound('level');this.finishUpgradeChoice();return true;}
    if(CONSUMABLES.some(o=>o.id===id)){
      const from=id==='recovery'?s.hp:id==='barrier'?s.shield:s.coins;
      if(id==='recovery')s.hp=Math.min(s.maxhp,s.hp+s.maxhp*.3);
      if(id==='payday')s.coins+=8;
      if(id==='barrier')s.shield=Math.max(s.shield,Math.min(Math.max(30,s.stats.shieldMax),s.shield+30));
      const to=id==='recovery'?s.hp:id==='barrier'?s.shield:s.coins;
      this.powerEffect(id,'acquire',s.x,s.y,0,{from,to,amount:to-from,maximum:id==='recovery'?s.maxhp:Math.max(30,s.stats.shieldMax)});
      s.options=[];s.mode='playing';s.invulnerable=Math.max(s.invulnerable,.6);this.sound('collect');this.finishUpgradeChoice();return true;
    }
    const def=UPGRADES.find(u=>u.id===id);if(!def)return false;if(def && this.rank(id)>=(def.max||5))return false;
    const previousHp=s.hp,previousShield=s.shield;
    s.upg[id]=this.rank(id)+1;
    if(id==='ego'){s.maxhp+=20;s.hp=Math.min(s.maxhp,s.hp+25);}
    if(id==='girlfriend'){s.companion=true;s.girl.maxhp=70+25*this.rank(id);s.girl.hp=s.girl.maxhp;s.girl.down=0;s.girl.x=s.x-28;s.girl.y=s.y+24;s.girl.shoot=.2;if(this.rank(id)===1){s.shield+=20;this.bark('BLONDE IA','Je suis avec toi. On avance ensemble.');}}
    this.recalculate();
    if(id==='validation')s.shield=Math.max(s.shield,s.stats.shieldMax);
    if(['car','money','airplane','truth','chopper'].includes(id))this.timers[id]=Math.min(this.timers[id],id==='airplane'?0:.4);
    const restoration=id==='ego'?{from:previousHp,to:s.hp,amount:s.hp-previousHp,maximum:s.maxhp}:id==='validation'?{from:previousShield,to:s.shield,amount:s.shield-previousShield,maximum:s.stats.shieldMax}:{};
    if(id==='followers'){const muzzle=computeHeroPose(s).muzzle;restoration.tx=muzzle.x;restoration.ty=muzzle.y;}
    this.powerEffect(id,'acquire',s.x,s.y,0,restoration);
    s.options=[];s.mode='playing';s.invulnerable=Math.max(s.invulnerable,.6);this.sound('level');this.finishUpgradeChoice();return true;
  }
  gainXP(value){
    const s=this.s;s.xp+=value;if(s.xp<s.xpNeed || s.mode!=='playing')return;
    s.xp-=s.xpNeed;s.level++;s.xpNeed=Math.round(8+s.level*4.2+Math.pow(s.level,1.2));s.hp=Math.min(s.maxhp,s.hp+4);
    s.upgradeRerolls=0;s.options=this.rollUpgradeOptions();s.mode='upgrade';s.moveX=0;s.moveY=0;this.sound('level');this.emit('upgrade',s.options);
  }
  upgradePool(){
    const pool=UPGRADES.filter(u=>this.rank(u.id)<(u.max||5));
    if(pool.length<3)for(const item of CONSUMABLES){pool.push(item);if(pool.length>=3)break;}
    return pool;
  }
  rollUpgradeOptions(previous=[]){
    const choices=EVOLUTIONS.filter(def=>evolutionReady(this.s,def));
    const pool=this.upgradePool();
    while(pool.length&&choices.length<3){
      const fresh=pool.filter(u=>!previous.some(p=>p.id===u.id));const candidates=fresh.length?fresh:pool;
      const item=candidates[Math.floor(this.random()*candidates.length)];choices.push(item);pool.splice(pool.indexOf(item),1);
    }
    return choices;
  }
  rerollCost(){return REROLL_COSTS[this.s.upgradeRerolls]??null;}
  canRerollUpgrade(){const s=this.s,cost=this.rerollCost();return s.mode==='upgrade'&&cost!==null&&s.coins>=cost&&this.upgradePool().some(u=>!s.options.some(o=>o.id===u.id));}
  rerollUpgrade(){
    if(!this.canRerollUpgrade())return false;
    const s=this.s,cost=this.rerollCost(),choices=this.rollUpgradeOptions(s.options);
    s.coins-=cost;s.coinsSpent+=cost;s.upgradeRerolls++;s.options=choices;this.emit('upgrade',choices);return true;
  }
  update(dt,input={x:0,y:0}){
    if(this.s.mode!=='playing' || !Number.isFinite(dt) || dt<=0)return;
    let remaining=Math.min(dt,.25);
    while(remaining>1e-7 && this.s.mode==='playing'){const step=Math.min(remaining,1/30);this.step(step,input);remaining-=step;}
  }
  step(dt,input){
    const s=this.s;s.elapsed+=dt;s.invulnerable=Math.max(0,s.invulnerable-dt);
    this.updateDiscoveries(dt);
    const mx=Number.isFinite(input.x)?input.x:0,my=Number.isFinite(input.y)?input.y:0;const n=Math.max(1,length(mx,my));s.moveX=mx/n;s.moveY=my/n;
    if(length(mx,my)>.08){s.faceX=mx/n;s.faceY=my/n;}
    const previousX=s.x,previousY=s.y,previousGirlX=s.girl.x,previousGirlY=s.girl.y;this.move(s,s.moveX*s.stats.speed*dt,s.moveY*s.stats.speed*dt,13);const moved=length(s.x-previousX,s.y-previousY);s.walkMoving=moved>1e-7&&length(s.moveX,s.moveY)>.08;if(s.walkMoving)s.walkDistance+=moved;
    // Keep actual travel separate from aim and blocked movement intent.
    if(moved>1e-7){s.travelX=(s.x-previousX)/moved;s.travelY=(s.y-previousY)/moved;}
    this.world.update(s.x,s.y);
    if(this.rank('detox')){const from=s.hp;s.hp=Math.min(s.maxhp,s.hp+.2*this.rank('detox')*dt);if(s.hp>from)this.powerEffect('detox','heal',s.x,s.y,0,{amount:s.hp-from});}
    if(s.elapsed-this.lastHit>6 && s.shield<s.stats.shieldMax){const from=s.shield;s.shield=Math.min(s.stats.shieldMax,s.shield+(3+2*this.rank('validation'))*dt);if(this.rank('validation')&&s.shield>from)this.powerEffect('validation','recharge',s.x,s.y,0,{from,to:s.shield,maximum:s.stats.shieldMax,amount:s.shield-from});}
    this.spawnWave(dt);this.updateCompanion(dt);this.updateEnemies(dt);const trophySpeed=trophySpeedMultiplier(s);updateTrophyEffects(this,dt);if(trophySpeedMultiplier(s)!==trophySpeed)this.recalculate();if(s.hp>0){this.updateStunt(dt,moved);this.updateRivalBanter();}this.weapons(dt);this.updateShots(dt);this.updateVehicles(dt);this.updateClouds(dt);this.updateShockwaves(dt,{x:previousX,y:previousY},{x:previousGirlX,y:previousGirlY});this.updateDrops(dt);this.updateChests(dt);this.updateEffects(dt);
    if(s.hp<=0){s.hp=0;s.mode='gameover';this.sound('defeat');this.emit('gameover',s);return;}
    if(s.elapsed>=1200 && !s.endless){s.mode='victory';this.sound('victory');this.emit('victory',s);return;}
    this.openTrophy();
    if(s.mode==='playing')this.story(dt);
    for(const [key,max] of Object.entries(CAP))if(key!=='drops'&&s[key].length>max){if(key==='chests')s.chests=trimTrophyChests(s,max);else s[key].splice(0,s[key].length-max);}
  }
  updateDiscoveries(dt){
    const s=this.s,d=s.discovery;
    if(d.active){
      const def=DISCOVERIES[d.active.kind];
      if(def.healing)s.hp=Math.min(s.maxhp,s.hp+def.healing*Math.min(dt,d.active.remaining));
      d.active.remaining=Math.max(0,d.active.remaining-dt);
      if(d.active.remaining===0){d.active=null;this.recalculate();}
    }
    for(const [id,until] of this.discoveryCooldowns)if(until<=s.elapsed)this.discoveryCooldowns.delete(id);
    const cx=Math.floor(s.x/512),cy=Math.floor(s.y/512);let nearby=null,nearest=210;
    for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++){
      const site=this.world.chunk(x,y).find(p=>p.type==='discovery');
      if(site){const distance=dist(s,site);if(distance<nearest){nearest=distance;nearby=site;}}
    }
    // Contact must be broken to reactivate a replenished site. No camping loop.
    if(!nearby||nearest>78)this.discoveryContact=null;
    d.nearby=nearby?{...nearby,needsExit:this.discoveryContact===nearby.id,cooldown:Math.max(0,(this.discoveryCooldowns.get(nearby.id)||0)-s.elapsed)}:null;
    if(!nearby||nearest>52||d.active||this.discoveryContact===nearby.id||this.discoveryCooldowns.has(nearby.id))return;
    const def=DISCOVERIES[nearby.discoveryType];
    this.discoveryContact=nearby.id;
    this.discoveryCooldowns.set(nearby.id,s.elapsed+DISCOVERY_COOLDOWN);
    while(this.discoveryCooldowns.size>256)this.discoveryCooldowns.delete(this.discoveryCooldowns.keys().next().value);
    d.active={id:nearby.id,kind:nearby.discoveryType,name:def.name,description:def.description,color:def.color,remaining:def.duration,duration:def.duration};
    d.count++;this.recalculate();this.pulse(nearby.x,nearby.y,72,def.color,.8);this.sound('collect');
    this.emit('discovery',{...d.active});
  }
  move(entity,dx,dy,r){
    if(tailLocked(entity)||animalLocked(entity)||pelicanLocked(entity))return;
    const oldX=entity.x,oldY=entity.y;
    if(!this.world.collides(entity.x+dx,entity.y,r))entity.x+=dx;
    if(!this.world.collides(entity.x,entity.y+dy,r))entity.y+=dy;
    if(entity.type==='pelican'){const moved=length(entity.x-oldX,entity.y-oldY);entity.peliWalkDistance+=moved;if(moved>1e-7)entity.peliMoving=true;}
    if(entity.type==='travestia'){const moved=length(entity.x-oldX,entity.y-oldY);entity.tailWalkDistance=(entity.tailWalkDistance||0)+moved;if(moved>1e-7)entity.tailMoving=true;}
  }
  spawnEnemy(type,x,y){
    const s=this.s;if(isMajorBoss(type)&&s.enemies.some(e=>isMajorBoss(e.type)&&!e.dead))return null;if(s.enemies.length>=CAP.enemies||isRival(type)&&s.enemies.filter(e=>!e.dead&&isRival(e.type)).length>=2)return null;const spec=BASE[type]||BASE.normal;
    if(x===undefined){const w=this.viewport.width/2+spec.r+24,top=this.viewport.height*.48+spec.r+24,bottom=this.viewport.height*.52+spec.r+24,side=Math.floor(this.random()*4);x=s.x+(side===0?-w:side===1?w:(this.random()*2-1)*w);y=s.y+(side===2?-top:side===3?bottom:-top+this.random()*(top+bottom));for(let i=0;i<8 && this.world.collides(x,y,25);i++){x+=(x<s.x?-1:1)*35;y+=(y<s.y?-1:1)*28;}}
    const minutes=s.elapsed/60,scale=1+Math.min(1.6,minutes*.065)+Math.max(0,minutes-20)*.035;
    // Several attack cycles must survive developed offensive builds. Summons
    // justify a gentler first matriarch; only newly spawned bosses gain HP.
    const earlyBossHealth=type==='matriarch'?1.8:2.4;
    const bossDurability=isMajorBoss(type)?earlyBossHealth+(8-earlyBossHealth)*clamp((minutes-3)/15,0,1):1;
    const hp=spec.hp*scale*(type==='matriarch'?1+minutes*.02:1)*bossDurability;
    const enemy={id:this.id++,type,sex:['travestia','pelican'].includes(type)?null:isRival(type)?'male':'female',x,y,hp,maxhp:hp,r:spec.r,speed:spec.speed*(this.difficulty.speed||1)*(1+Math.min(.35,minutes*.014)),phase:'chase',faceX:0,faceY:1,gasPose:0,windup:0,hitFlash:0,charmed:0,dead:false,cooldown:type==='gas'?2+this.random()*2:0,attack:0,summon:6,crow:0,charge:0,chargeDirX:0,chargeDirY:1,banterCount:0,nextTaunt:0,swipe:0,swipeDirX:0,swipeDirY:1,target:'player',tailTime:0,tailFaceX:1,tailHitPlayer:false,tailHitGirl:false};
    if(type==='pelican')Object.assign(enemy,{peliTime:0,peliDX:1,peliDY:0,peliX:x,peliY:y,peliTravel:0,peliAttackCount:0,peliHitPlayer:false,peliHitGirl:false,peliReplyPending:false,peliBanterIndex:0,peliTauntAt:0,peliReply:'',peliReplyTime:0,peliWalkDistance:0,peliMoving:false});
    if(ANIMALS[type])Object.assign(enemy,{animalTime:0,animalDX:1,animalDY:0,animalX:x,animalY:y,animalTravel:0,animalHit:false});s.enemies.push(enemy);return enemy;
  }
  spawnPack(type,count){
    const first=this.spawnEnemy(type);if(!first)return [];
    const pack=[first],s=this.s,w=this.viewport.width/2+50,h=this.viewport.height/2+65;
    const horizontal=Math.abs(first.x-s.x)/w>Math.abs(first.y-s.y)/h;
    const outwardX=horizontal?(first.x<s.x?-1:1):0,outwardY=horizontal?0:(first.y<s.y?-1:1);
    for(let i=1;i<count;i++){
      const offset=(i%2?1:-1)*Math.ceil(i/2)*37;
      let x=first.x+(horizontal?0:offset),y=first.y+(horizontal?offset:0);
      for(let j=0;j<12&&this.world.collides(x,y,18);j++){x+=outwardX*32;y+=outwardY*32;}
      const e=this.spawnEnemy(type,x,y);if(e)pack.push(e);
    }
    return pack;
  }
  // Pacing is derived from the existing simulation clock, so old saves need no migration.
  runPacing(){
    const t=this.s.elapsed,finale=!this.s.endless&&t>=1140;
    const recovery=t>=120&&!finale&&(t-120)%90>=60&&(t-120)%90<75;
    return {finale,recovery,pressure:recovery?.35:finale?.65:1};
  }
  pendingEncounterNotices(){
    // Rebuild only pending threats from saved simulation clocks, never old jokes.
    const s=this.s,d=this.bossDirector,notices={};
    if(d.warned&&(s.endless||s.elapsed+d.remaining<1140)&&!s.enemies.some(e=>isMajorBoss(e.type)&&!e.dead)){
      const name={matriarch:'La modération',travestia:'Travestia',pelican:'Péli Zodiaque'}[d.nextType];
      notices.boss=`${name} arrive ${d.remaining>0?`dans environ ${Math.ceil(d.remaining)} s`:'bientôt'}. Garde une sortie !`;
    }
    if(s.elapsed>=120&&this.timers.horde>0&&this.timers.horde<=6&&(s.endless||s.elapsed+this.timers.horde<1140)){
      notices.horde=`Une horde arrive dans environ ${Math.ceil(this.timers.horde)} s. Garde une sortie !`;
    }
    if(!s.endless)for(const [at,arrival,label,hint] of [[1130,1140,'Dernière minute','Garde une sortie !'],[1154,1160,'Le dernier rival arrive','Garde tes distances !'],[1174,1180,'Dernière vague','Tiens jusqu’à vingt minutes !']]){
      if(this.eventSeen.has(`finale:${at}`)&&s.elapsed>=at&&s.elapsed<arrival)notices.finale=`${label} dans environ ${Math.ceil(arrival-s.elapsed)} s. ${hint}`;
    }
    return notices;
  }
  pendingEncounterWarning(){return Object.values(this.pendingEncounterNotices()).join(' ');}
  announceEncounter(text,kind){
    // Keep other pending threats readable when a new critical notice replaces the bubble.
    if(kind){const pending=this.pendingEncounterNotices();delete pending[kind];text=[text,...Object.values(pending)].join(' ');}
    // Encounter notices remain visible even when optional banter is disabled.
    this.emit('bark',{who:'SYSTÈME',text,encounter:true});
    // Narrative uses the UI's full reading duration; combat reactions stay immediate.
    this.speechUntil=Math.max(this.speechUntil,this.s.elapsed+Math.max(4.3,text.length*.039));
    // Do not let a previously queued joke immediately cover an encounter warning.
    for(const reply of [this.pendingStuntReply,this.pendingRivalReply])if(reply)reply.at=Math.max(reply.at,this.speechUntil+.2);
  }
  reserveFinaleSlots(count){
    // Only retire ordinary enemies already offscreen, never visible threats or bosses.
    const s=this.s,w=this.viewport.width/2,h=this.viewport.height;
    let needed=Math.max(0,s.enemies.length+count-CAP.enemies);
    for(let i=s.enemies.length-1;i>=0&&needed>0;i--){
      const e=s.enemies[i];
      if(!isRival(e.type)&&!isMajorBoss(e.type)&&(Math.abs(e.x-s.x)>w+e.r+32||e.y<s.y-h*.48-e.r-32||e.y>s.y+h*.52+e.r+32)){s.enemies.splice(i,1);needed--;}
    }
  }
  spawnFinaleEnemy(type){
    if(isMajorBoss(type)){const existing=this.s.enemies.find(e=>isMajorBoss(e.type)&&!e.dead);if(existing)return existing.type===type?existing:null;}
    if(isRival(type)&&this.s.enemies.filter(e=>isRival(e.type)&&!e.dead).length>=2)return null;
    this.reserveFinaleSlots(1);return this.spawnEnemy(type);
  }
  updateFinale(dt){
    const s=this.s;if(s.endless)return;
    const beat=(at,action)=>{
      const key=`finale:${at}`,pending=`${key}:pending`;
      const crossed=s.elapsed>=at&&s.elapsed-dt<at;
      if(s.elapsed>=at+20){this.eventSeen.delete(pending);return;}
      if(!this.eventSeen.has(key)&&(crossed||this.eventSeen.has(pending))){
        if(action()===false)this.eventSeen.add(pending);
        else{this.eventSeen.delete(pending);this.eventSeen.add(key);}
      }
    };
    beat(1130,()=>this.announceEncounter('Dernière minute dans dix secondes. Un dernier défi t’attend : garde une sortie !','finale'));
    beat(1140,()=>{
      this.timers.horde=45;this.timers.rival=90;
      if(!s.enemies.some(e=>isMajorBoss(e.type)&&!e.dead)&&!this.spawnScheduledBoss())return false;
      this.announceEncounter('Le dernier direct ! Survis jusqu’à vingt minutes. Ses attaques restent esquivables.','finale');
    });
    beat(1154,()=>this.announceEncounter('Un dernier rival approche. Garde tes distances !','finale'));
    beat(1160,()=>{if(!this.spawnFinaleEnemy(this.rivalIndex%2?'rival_goat':'rival_rooster'))return false;this.rivalIndex++;});
    beat(1174,()=>this.announceEncounter('Dernière vague dans six secondes. Tiens jusqu’à vingt minutes !','finale'));
    beat(1180,()=>{this.reserveFinaleSlots(24);if(s.enemies.length>=CAP.enemies)return false;this.spawnHorde();this.announceEncounter('Dernière vague ! Pas besoin de tout éliminer : survis jusqu’à vingt minutes !','finale');});
  }
  spawnHorde(){
    const s=this.s,m=s.elapsed/60,count=18+Math.min(24,Math.floor(m*1.4));
    const variant=s.elapsed<120?0:Math.round((s.elapsed-20)/45)%3;
    const groups=variant===0?[['orangutan',1/3],['sprinter',1/5],['normal',.5]]:variant===1?[['gas',.2],['orangutan',.35],['normal',.45]]:[['tank',.15],['jealous',.35],['normal',.5]];
    for(const [type,share] of groups)this.spawnPack(type,Math.ceil(count*share));
    this.pulse(s.x,s.y,70,'#e2b944',.45);this.bark('SYSTÈME','Un groupe de discussion vient de te trouver.');
  }
  spawnWave(dt){
    const s=this.s,m=s.elapsed/60,pacing=this.runPacing();this.updateFinale(dt);this.timers.spawn-=dt;
    const interval=Math.max(.08,.46/(1+m*.22))/((this.difficulty.spawn||1)*pacing.pressure);
    if(this.timers.spawn<=0){
      this.timers.spawn+=interval;let type='normal';const p=this.random();
      if(m>.5&&p<.2)type='sprinter';else if(m>1&&p<.36)type='gas';else if(m>2&&p<.45)type='jealous';else if(m>3&&p<.55)type='tank';else if(m>4&&p<.65)type='explosive';
      if(s.elapsed<.1)this.spawnPack('normal',3);else this.spawnEnemy(type);
    }
    this.timers.animal-=dt;if(this.timers.animal<=0&&!pacing.finale&&!pacing.recovery){if(s.enemies.filter(e=>ANIMALS[e.type]&&!e.dead).length<8){const types=Object.keys(ANIMALS);const rng=this.rng;this.rng=(this.seed^Math.imul(this.timers.animalIndex+1,1640531527))|0;const animal=this.spawnEnemy(types[this.timers.animalIndex%4]);this.rng=rng;if(animal){this.timers.animalIndex++;this.timers.animal=this.timers.animalIndex<4?14:22;}}else this.timers.animal=3;}
    this.timers.pack-=dt;
    if(this.timers.pack<=0){this.timers.pack=pacing.recovery||pacing.finale?.1:7;if(!pacing.recovery&&!pacing.finale)this.spawnPack('orangutan',3+Math.min(3,Math.floor(m/3)));}
    if(pacing.finale)return;
    if((s.endless||s.elapsed+this.timers.horde<1140)&&s.elapsed>=120&&this.timers.horde>6&&this.timers.horde-dt<=6)this.announceEncounter('Une horde arrive dans six secondes. Garde une sortie !','horde');
    this.timers.horde-=dt;
    if(this.timers.horde<=0){
      this.timers.horde=45;this.spawnHorde();
    }
    this.timers.rival-=dt;
    if(this.timers.rival<=0){
      const active=s.enemies.filter(e=>!e.dead&&isRival(e.type)).length;
      if(active<2){
        if(s.enemies.length>=CAP.enemies){let farthest=-1,best=-1;for(let i=0;i<s.enemies.length;i++){const e=s.enemies[i],d=dist(e,s);if(!isRival(e.type)&&!isMajorBoss(e.type)&&d>best){best=d;farthest=i;}}if(farthest>=0)s.enemies.splice(farthest,1);}
        const e=this.spawnEnemy(this.rivalIndex%2?'rival_goat':'rival_rooster');
        if(e){this.rivalIndex++;this.timers.rival=this.rivalIndex===1?45:90+this.rivalRandom()*30;}else this.timers.rival=5;
      }else this.timers.rival=10;
    }
    this.updateBossArrivals(dt);
  }
  spawnScheduledBoss(){
    if(this.s.enemies.some(e=>isMajorBoss(e.type)&&!e.dead))return null;
    const d=this.bossDirector;
    this.reserveFinaleSlots(1);
    const boss=this.spawnEnemy(d.nextType);
    if(!boss)return null; // Keep the same decision and RNG when the cap blocks it.
    d.lastType=d.nextType;scheduleNextBoss(d);
    return boss;
  }
  updateBossArrivals(dt){
    const s=this.s,d=this.bossDirector;
    // Cooldown is quiet play time after defeat, never combat time or wall time.
    if(s.enemies.some(e=>isMajorBoss(e.type)&&!e.dead))return;
    if(!s.endless&&(s.elapsed>=BOSS_SCHEDULE.finaleAt||s.elapsed+d.remaining-dt>=BOSS_SCHEDULE.finaleAt))return;
    d.remaining=Math.max(0,d.remaining-dt);
    if(!d.warned&&d.remaining<=BOSS_SCHEDULE.warning){
      if(!s.endless&&s.elapsed+BOSS_SCHEDULE.warning>=BOSS_SCHEDULE.finaleAt)return;
      d.warned=true;d.remaining=BOSS_SCHEDULE.warning;
      const warnings={matriarch:'La modération arrive dans cinq secondes. Prépare une sortie !',travestia:'Travestia arrive dans cinq secondes. Méfie-toi de sa queue !',pelican:'Péli Zodiaque arrive dans cinq secondes. Garde une sortie pour ses câlins !'};
      this.announceEncounter(warnings[d.nextType],'boss');return;
    }
    if(d.remaining>0)return;
    d.retryIn=Math.max(0,d.retryIn-dt);if(d.retryIn>0)return;
    const boss=this.spawnScheduledBoss();
    if(!boss){d.retryIn=BOSS_SCHEDULE.retry;return;}
    const arrivals={matriarch:'La modération entre en scène !',travestia:'Travestia entre en scène ! Gare à la queue hélicoptère.',pelican:'Péli Zodiaque entre en scène ! Câlins, tarot et astrologie.'};
    this.announceEncounter(arrivals[boss.type],'boss');
  }

  nearest(x,y,range=Infinity,exclude){let target=null,best=range*range;for(const e of this.s.enemies){if(e.dead || e===exclude || e.charmed>0)continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<best){best=d;target=e;}}return target;}
  reenterBoss(e){
    // Running out of the active city must not count as defeating a boss.
    // Reuse its identity/HP, outside the camera and with a fresh attack delay.
    // The existing cooldown also bounds retries if every candidate is blocked.
    if(e.cooldown>0)return false;
    const s=this.s,v=this.viewport,moving=length(s.moveX,s.moveY)>.08;
    // Old saves may contain overlapping encounters. Preserve both, but do not
    // bring a distant second boss back on top of the one already nearby.
    if(s.enemies.some(other=>other!==e&&!other.dead&&isMajorBoss(other.type)&&dist(other,s)<=1600)){e.cooldown=.5;return false;}
    const angle=Math.atan2(moving?s.moveY:e.y-s.y,moving?s.moveX:e.x-s.x);
    for(let i=0;i<24;i++){
      const offset=i===0?0:(i%2?1:-1)*Math.ceil(i/2)*Math.PI/12;
      const dx=Math.cos(angle+offset),dy=Math.sin(angle+offset);
      const edgeX=(v.width/2+e.r+112)/Math.max(.001,Math.abs(dx));
      const edgeY=(v.height*(dy<0?.48:.52)+e.r+144)/Math.max(.001,Math.abs(dy));
      const radius=Math.max(520,Math.min(edgeX,edgeY)),x=s.x+dx*radius,y=s.y+dy*radius;
      // Check the full body plus a short approach, never force it through cover.
      if([0,40,80].some(back=>this.world.collides(x-dx*back,y-dy*back,e.r)))continue;
      e.x=x;e.y=y;e.phase='chase';e.cooldown=2.5;e.attack=Math.max(e.attack,2.5);
      e.windup=0;e.tailTime=0;e.tailReplyPending=false;e.tailMoving=false;
      e.summon=Math.max(e.summon,3);interruptPelican(e);
      if(e.type==='pelican'){e.peliX=x;e.peliY=y;e.peliTravel=0;}
      return true;
    }
    e.cooldown=.5;return false;
  }
  updateEnemies(dt){
    const s=this.s,g=s.girl;
    for(const e of s.enemies){
      if(e.dead)continue;if(e.type==='pelican')e.peliMoving=false;if(e.type==='travestia')e.tailMoving=false;e.hitFlash=Math.max(0,e.hitFlash-dt);e.attack=Math.max(0,(e.attack||0)-dt);e.cooldown=Math.max(0,(e.cooldown||0)-dt);e.gasPose=Math.max(0,e.gasPose-dt);e.swipe=Math.max(0,(e.swipe||0)-dt);e.charge=Math.max(0,(e.charge||0)-dt);e.crow=Math.max(0,(e.crow||0)-dt);e.charmed=Math.max(0,e.charmed-dt);
      // Optional on older saves; absent means the first charm can interrupt.
      if(e.bossCharmResistance!==undefined)e.bossCharmResistance=Math.max(0,e.bossCharmResistance-dt);
      if(length(e.x-s.x,e.y-s.y)>1600){if(!isMajorBoss(e.type)){e.dead=true;continue;}if(!this.reenterBoss(e))continue;}
      let target=s;e.target='player';if(e.type==='jealous' && s.companion && g.down<=0){target=g;e.target='girl';}
      if(e.charmed>0){const friend=this.nearest(e.x,e.y,350,e);if(friend){target=friend;e.target='enemy';}else target={x:e.x+(e.x-s.x),y:e.y+(e.y-s.y)};}
      const dx=target.x-e.x,dy=target.y-e.y,d=length(dx,dy)||1;if(e.type==='gas' && (e.windup>0 || e.gasPose>0) && Number.isFinite(e.gasDirX)){e.faceX=e.gasDirX;e.faceY=e.gasDirY;}else if(e.type==='orangutan'&&(e.windup>0||e.swipe>0)){e.faceX=e.swipeDirX;e.faceY=e.swipeDirY;}else if(isRival(e.type)&&(e.windup>0||e.charge>0||e.crow>0)){e.faceX=e.chargeDirX;e.faceY=e.chargeDirY;}else{e.faceX=dx/d;e.faceY=dy/d;}
      const suppressed=s.airplane.active && dist(e,s)<s.airplane.r;
      if(suppressed){e.cooldown=Math.max(e.cooldown,1.5);e.windup=0;e.gasPose=0;e.swipe=0;e.charge=0;e.crow=0;e.phase='suppressed';interruptAnimal(e);interruptPelican(e,'suppressed');}
      if(ANIMALS[e.type])updateAnimal(this,e,dt,suppressed);
      if(e.type==='travestia')updateTravestia(this,e,dt,suppressed);
      if(e.type==='pelican')updatePelican(this,e,dt,suppressed);
      if(e.type==='gas' && e.charmed<=0 && !suppressed){
        if(e.windup>0){e.phase='windup';e.windup=Math.max(0,e.windup-dt);if(e.windup===0){e.phase='gas';e.gasPose=.9;e.cooldown=5;e.emitClock=0;this.sound('gas');}}
        else if(e.gasPose>0){e.phase='gas';e.emitClock=(e.emitClock||0)-dt;if(e.emitClock<=0){e.emitClock=.11;const spread=(this.random()-.5)*.55,a=Math.atan2(e.gasDirY,e.gasDirX)+spread,v=72+this.random()*20;s.clouds.push({x:e.x+Math.cos(a)*22,y:e.y+Math.sin(a)*22,r:21,life:3.2,maxlife:3.2,vx:Math.cos(a)*v,vy:Math.sin(a)*v});}}
        else if(d<225 && e.cooldown<=0){e.windup=1.05;e.gasDirX=dx/d;e.gasDirY=dy/d;e.phase='windup';}
        else e.phase='chase';
      }
      if(e.type==='rival_rooster'&&e.charmed>0){e.windup=0;e.crow=0;e.charge=0;e.cooldown=Math.max(e.cooldown,2);}
      if(e.type==='rival_rooster'&&e.charmed<=0&&!suppressed){
        e.charge=0;
        if(e.windup>0){
          e.phase='windup';e.windup=Math.max(0,e.windup-dt);
          if(e.windup===0){e.crow=.7;e.cooldown=5.5;e.phase='crow';s.shockwaves.push({x:e.x,y:e.y,r:28,prevR:28,maxR:180,life:1,maxlife:1,width:12,damage:13*(this.difficulty.damage||1),hitPlayer:false,hitGirl:false,ownerId:e.id});this.sound('rooster');this.reactToCrow();}
        }else if(e.crow>0)e.phase='crow';
        else if(d<195&&e.cooldown<=0){e.windup=.85;e.chargeDirX=dx/d;e.chargeDirY=dy/d;e.phase='windup';}
        else e.phase='chase';
      }
      if(e.type==='rival_goat'&&e.charmed<=0&&!suppressed){
        if(e.windup>0){e.phase='windup';e.windup=Math.max(0,e.windup-dt);if(e.windup===0){e.charge=.55;e.cooldown=4.2;e.attack=0;e.phase='charge';this.pulse(e.x,e.y,e.r+13,'#e4bf6a',.3);}}
        else if(e.charge>0)e.phase='charge';
        else if(d<180&&e.cooldown<=0){e.windup=.8;e.chargeDirX=dx/d;e.chargeDirY=dy/d;e.faceX=e.chargeDirX;e.faceY=e.chargeDirY;e.phase='windup';}
        else e.phase='chase';
        if(e.charge>0){this.move(e,e.chargeDirX*285*dt,e.chargeDirY*285*dt,e.r*.64);if(dist(e,target)<e.r+15&&e.attack<=0){e.attack=1;this.damage(20*(this.difficulty.damage||1),'touch');}}
      }
      if(e.type==='orangutan'&&e.charmed<=0&&!suppressed){
        if(e.windup>0){
          e.phase='windup';e.windup=Math.max(0,e.windup-dt);
          if(e.windup===0){
            e.phase='swipe';e.swipe=.28;e.cooldown=2.5;
            const reach=length(target.x-e.x,target.y-e.y)||1,dot=((target.x-e.x)*e.swipeDirX+(target.y-e.y)*e.swipeDirY)/reach;
            if(reach<=73&&dot>=.55){if(target===g){g.hp-=14*(this.difficulty.damage||1);this.burst(g.x,g.y,'#fc7f9f',5);}else this.damage(14*(this.difficulty.damage||1),'touch');}
            this.pulse(e.x+e.swipeDirX*35,e.y+e.swipeDirY*35,32,'#f0a552',.25);
          }
        }else if(e.swipe>0)e.phase='swipe';
        else if(d<84&&e.cooldown<=0){e.windup=.6;e.swipeDirX=dx/d;e.swipeDirY=dy/d;e.faceX=e.swipeDirX;e.faceY=e.swipeDirY;e.phase='windup';}
        else e.phase='chase';
      }
      if(e.type==='explosive' && e.charmed<=0 && !suppressed){if(e.windup>0){e.phase='windup';e.windup-=dt;if(e.windup<=0){this.explode(e,87,23);e.dead=true;this.kill(e);continue;}}else if(d<68){e.windup=.72;e.phase='windup';}}
      if(e.type==='matriarch'){e.summon-=dt;if(e.summon<=0){e.summon=9;for(let j=0;j<4;j++)this.spawnEnemy(j===0?'gas':'orangutan',e.x+(j-1.5)*39,e.y+35);this.pulse(e.x,e.y,100,'#ec6ca8',.6);}}
      if(!animalLocked(e)&&e.windup<=0&&e.gasPose<=0&&!(e.swipe>0)&&!(e.charge>0)&&!(e.crow>0)){const speed=e.speed*(suppressed?.55:1)*(1-.07*this.rank('charisma'))*(e.type==='sprinter'?(Math.sin(s.elapsed*2.7+e.id)>.15?1.55:.65):1);const ox=e.x,oy=e.y;this.move(e,dx/d*speed*dt,dy/d*speed*dt,e.r*.64);if(length(e.x-ox,e.y-oy)<speed*dt*.2 && d>35){const sign=e.id%2?1:-1;this.move(e,-dy/d*speed*dt*sign,dx/d*speed*dt*sign,e.r*.64);}if(this.rank('charisma')&&length(e.x-ox,e.y-oy)>0&&dist(e,s)<200)this.powerEffect('charisma','slow',e.x,e.y,0,{tx:ox,ty:oy});}
      if(d<e.r+15&&e.attack<=0&&e.charmed<=0&&!ANIMALS[e.type]&&e.type!=='travestia'&&e.type!=='pelican'&&e.type!=='orangutan'&&!isRival(e.type)){e.attack=suppressed?1.6:.85;if(target===g){g.hp-=12*(this.difficulty.damage||1);this.burst(g.x,g.y,'#fc7f9f',5);}else this.damage((e.type==='tank'?20:e.type==='matriarch'?26:11)*(this.difficulty.damage||1),'touch',{kind:'ordinary-contact',actorType:e.type,actorId:e.id});}
      if(e.charmed>0 && e.target==='enemy' && d<e.r+target.r+4 && e.attack<=0){e.attack=.55;this.hurt(target,20+5*this.rank('charisma'));}
    }
    s.enemies=s.enemies.filter(e=>!e.dead);this.separateEnemies(dt);
  }
  separateEnemies(dt){
    const buckets=new Map(),size=64;
    for(const e of this.s.enemies){const key=`${Math.floor(e.x/size)},${Math.floor(e.y/size)}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e);}
    for(const e of this.s.enemies){const cx=Math.floor(e.x/size),cy=Math.floor(e.y/size);let pushes=0;
      neighbors:for(let a=cx-1;a<=cx+1;a++)for(let b=cy-1;b<=cy+1;b++)for(const other of buckets.get(`${a},${b}`)||[]){
        if(other.id<=e.id)continue;let dx=e.x-other.x,dy=e.y-other.y;const gap=(e.r+other.r)*.8;
        // Most neighboring cells do not overlap. Keep the exact distance and
        // push for actual contacts, but reject separated bounds first.
        if(Math.abs(dx)>=gap||Math.abs(dy)>=gap)continue;let d=length(dx,dy);if(d>=gap)continue;
        if(d<.001){const angle=e.id*2.399963+other.id*.37;dx=Math.cos(angle);dy=Math.sin(angle);d=1;}
        const push=Math.min((gap-d)*.5,35*dt);if(!animalLocked(e)&&!(e.type==='rival_rooster'&&(e.windup>0||e.crow>0)))this.move(e,dx/d*push,dy/d*push,e.r*.64);if(!animalLocked(other)&&!(other.type==='rival_rooster'&&(other.windup>0||other.crow>0)))this.move(other,-dx/d*push,-dy/d*push,other.r*.64);
        if(++pushes>=8)break neighbors;
      }
    }
  }
  updateCompanion(dt){
    const s=this.s,g=s.girl;if(!s.companion)return;
    if(g.hp<=0 && g.down<=0){this.bark('BLONDE IA','Je redémarre. Évite de mourir pendant la mise à jour.');g.down=12;}
    if(g.down>0){g.down=Math.max(0,g.down-dt);if(g.down===0){g.hp=g.maxhp;g.x=s.x-25;g.y=s.y+28;s.shield=Math.max(s.shield,20);this.burst(g.x,g.y,'#ffa1c5',12);}return;}
    const tx=s.x-s.faceX*36,ty=s.y-s.faceY*36+16,dx=tx-g.x,dy=ty-g.y,d=length(dx,dy);
    if(d>500){g.x=tx;g.y=ty;}else if(d>9)this.move(g,dx/Math.max(d,1)*Math.min(d*4,s.stats.speed*1.15)*dt,dy/Math.max(d,1)*Math.min(d*4,s.stats.speed*1.15)*dt,10);
    g.shoot-=dt;const target=this.nearest(g.x,g.y,440);
    if(target && g.shoot<=0){g.shoot=1.25/(1+.22*this.rank('girlfriend'));this.shoot(g.x,g.y,target,'heart',13+8*this.rank('girlfriend'),240);this.sound('heart');}
  }
  weapons(dt){
    const s=this.s;s.shotClock-=dt;const target=this.nearest(s.x,s.y,s.stats.range);
    if(target){
      const d=dist(target,s)||1;s.aimX=(target.x-s.x)/d;s.aimY=(target.y-s.y)/d;
      if(Math.abs(s.aimX)>.1)s.aimSide=s.aimX<0?-1:1;
      // At contact distance the enemy may already be under the carried barrel.
      // Keep facing them; the hit below must not send a bullet back through it.
      if(d+1e-7>=80){const aim=solveHeroAim(s,target);s.aimX=aim.aimX;s.aimY=aim.aimY;s.aimArtView=aim.aimArtView;}else s.aimArtView=null;
    }else{s.aimArtView=null;if(length(s.moveX,s.moveY)>.08){const d=length(s.moveX,s.moveY);s.aimX=s.moveX/d;s.aimY=s.moveY/d;if(Math.abs(s.aimX)>.1)s.aimSide=s.aimX<0?-1:1;}}

    if(target && s.shotClock<=0){s.shotClock=s.stats.fireInterval;const count=1+(this.rank('followers')>=3?1:0)+(this.rank('followers')>=5?1:0);const pose=computeHeroPose(s),muzzle=pose.muzzle;const underBarrel=dist(target,s)<80&&(target.x-muzzle.x)*pose.aim.x+(target.y-muzzle.y)*pose.aim.y<=0;if(underBarrel)this.hurt(target,s.stats.damage*count);else for(let i=0;i<count;i++)this.shoot(muzzle.x,muzzle.y,target,'bullet',s.stats.damage,460,(i-(count-1)/2)*.12);s.faceX=(target.x-s.x)/(dist(target,s)||1);s.faceY=(target.y-s.y)/(dist(target,s)||1);this.sound('shoot');}
    for(const key of ['car','money','airplane','truth','chopper'])this.timers[key]-=dt;
    const car=this.rank('car');if(car && this.timers.car<=0){this.timers.car=Math.max(3,10-car*1.1);s.vehicles.push({x:s.x-480,y:s.y+40,vx:420+car*35,vy:0,life:2.6,kind:'car',damage:50+car*22,hitIds:new Set(),...(s.evolutions.billionaire?{billSalvos:2,billClock:.8}:{})});this.powerEffect('car','activate');this.sound('truth');}
    const money=this.rank('money');if(money && this.timers.money<=0){this.timers.money=Math.max(1.2,4-money*.4);const t=target||{x:s.x+s.faceX*100,y:s.y+s.faceY*100};for(let i=0;i<3+money;i++)this.shoot(s.x,s.y,t,'bill',16+money*9,310,(i-(2+money)/2)*.23);this.powerEffect('money','activate');}
    const airplane=this.rank('airplane');
    if(airplane && this.timers.airplane<=0){
      this.timers.airplane=Math.max(8,17-airplane*1.2);s.airplane={x:s.x,y:s.y,active:true,life:3+airplane*.6,r:420+airplane*35};s.clouds=[];s.shockwaves=[];
      for(const e of s.enemies)if(dist(e,s)<s.airplane.r){e.windup=0;e.gasPose=0;e.charge=0;e.crow=0;e.swipe=0;e.cooldown=Math.max(e.cooldown,3);e.attack=Math.max(e.attack,1.2);e.phase='suppressed';interruptAnimal(e);interruptPelican(e,'suppressed');}
      this.powerEffect('airplane','activate',s.x,s.y,s.airplane.r);this.sound('truth');
    }
    if(s.airplane.active){s.airplane.x=s.x;s.airplane.y=s.y;s.airplane.life-=dt;if(s.airplane.life<=0)s.airplane.active=false;}
    const chopper=this.rank('chopper');
    if(chopper && this.timers.chopper<=0){
      this.timers.chopper=Math.max(2.7,5.7-chopper*.6);const angle=target?Math.atan2(target.y-s.y,target.x-s.x):0,dx=Math.cos(angle),dy=Math.sin(angle);
      s.vehicles.push({x:s.x-dx*300,y:s.y-dy*300+22,vx:dx*640,vy:dy*640,life:1.15,kind:'bike',damage:42+chopper*21,knockback:75+chopper*10,hitIds:new Set()});this.powerEffect('chopper','activate',s.x,s.y+22,0,{tx:s.x+dx*30,ty:s.y+22+dy*30});
    }
    const truth=this.rank('truth');if(truth && this.timers.truth<=0){this.timers.truth=Math.max(3,8-truth*.65);this.areaDamage(s.x,s.y,145+truth*24,28+truth*15,true);this.powerEffect('truth','activate',s.x,s.y,145+truth*24);this.sound('truth');}
  }
  shoot(x,y,target,kind,damage,speed,offset=0){const a=Math.atan2(target.y-y,target.x-x)+offset;this.s.shots.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,kind,life:1.8,damage,r:kind==='heart'?8:kind==='bill'?7:4,pierce:kind==='bill'?1:0,hitIds:new Set(),...(kind==='heart'&&this.s.evolutions.viralLove?{viral:true,linkX:x,linkY:y}:{})});}
  updateShots(dt){
    const s=this.s,buckets=new Map(),size=80;
    for(const e of s.enemies){const key=`${Math.floor(e.x/size)},${Math.floor(e.y/size)}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e);}
    // Boss hearts retain full damage. Brief interrupts plus recovery let the
    // existing warned attacks finish without long untargetable charm windows.
    for(const p of s.shots){p.life-=dt;const steps=Math.max(1,Math.ceil(length(p.vx,p.vy)*dt/17));for(let i=0;i<steps && p.life>0;i++){p.x+=p.vx*dt/steps;p.y+=p.vy*dt/steps;const cx=Math.floor(p.x/size),cy=Math.floor(p.y/size);let hit=false;for(let a=cx-1;a<=cx+1 && !hit;a++)for(let b=cy-1;b<=cy+1 && !hit;b++)for(const e of buckets.get(`${a},${b}`)||[]){if(e.dead || e.charmed>0 || p.hitIds?.has(e.id) || length(e.x-p.x,e.y-p.y)>e.r+(p.r||4))continue;p.hitIds?.add(e.id);this.hurt(e,p.damage);if(p.kind==='heart' && !e.dead && this.random()<.55+.08*this.rank('charisma')&&!(e.bossCharmResistance>0)){e.charmed=isMajorBoss(e.type)?.7+.1*this.rank('charisma'):2.5+.9*this.rank('charisma');if(isMajorBoss(e.type))e.bossCharmResistance=10;e.windup=0;e.swipe=0;e.charge=0;e.crow=0;e.phase='charmed';interruptAnimal(e);interruptPelican(e,'charmed');this.burst(e.x,e.y,'#ff80b5',4);}if(!bounceHeart(this,p,e)){if((p.pierce||0)>0)p.pierce--;else p.life=0;}hit=true;break;}}}
    s.shots=s.shots.filter(p=>p.life>0);
  }
  hurt(e,damage){if(e.dead)return;e.hp-=damage;e.hitFlash=.12;if(e.hp<=0){e.dead=true;this.kill(e);}}
  kill(e){
    if(e.rewarded)return;e.rewarded=true;const s=this.s;s.kills++;
    if(e.type==='explosive')s.clouds.push({x:e.x,y:e.y,r:26,maxr:65,arm:.45,life:3.2,maxlife:3.2,vx:0,vy:0});const elite=isMajorBoss(e.type),mini=isRival(e.type),xp=elite?22:mini?9:e.type==='tank'?4:e.type==='orangutan'?3:2;
    s.drops.push({x:e.x,y:e.y,kind:'xp',value:xp,life:38});
    const chance=this.random();if(chance<.14||elite||mini)s.drops.push({x:e.x+9,y:e.y,kind:elite?'gem':'coin',value:elite?3:mini?3:1,life:35});
    if(this.random()<.045||elite||mini)s.drops.push({x:e.x-10,y:e.y,kind:'heal',value:elite?25:mini?14:9,life:35});
    s.drops=compactDrops(s,this.world);
    if(elite)s.chests.push({id:this.id++,x:e.x,y:e.y,open:false,openedAt:0,bossType:e.type,bossId:e.id});
    // Retire the five old burst particles without changing future seeded gameplay.
    // Their three random draws each belong to the established loot/spawn RNG stream.
    for(let i=0;i<15;i++)this.random();
    // Preserve the real final pose, including enemies killed before their first render.
    // Offscreen deaths never displace a visible impact or spend its audio budget.
    const visible=Math.abs(e.x-s.x)<this.viewport.width/2+80&&e.y>s.y-this.viewport.height*.48-80&&e.y<s.y+this.viewport.height*.52+100;
    if(visible){
      this.defeatEffects=this.defeatEffects.filter(effect=>s.elapsed-effect.start<effect.life);
      if(this.defeatEffects.length<16)this.defeatEffects.push({actor:{...e},start:s.elapsed,life:.45,phase:Math.floor(s.elapsed*10+(typeof e.phase==='number'?e.phase*3:0)+(Number(e.id)||0))%8});
      this.sound('kill');
    }
  }
  damage(value,source,context){const s=this.s;if(s.invulnerable>0 || s.hp<=0)return;if(source==='gas'){if(s.airplane.active)return;const original=value;value*=s.stats.gasMultiplier;if(this.rank('filter')&&value<original)this.powerEffect('filter','resist',s.x,s.y,0,{amount:original-value});}value=reduceTrophyDamage(this,value,source,context);if(value<=0)return;const blocked=Math.min(s.shield,value);s.shield-=blocked;s.hp-=value-blocked;const trophySpeed=trophySpeedMultiplier(s);notifyTrophyDamage(this);if(trophySpeedMultiplier(s)!==trophySpeed)this.recalculate();s.invulnerable=source==='gas'?.55:.72;this.lastHit=s.elapsed;this.burst(s.x,s.y,blocked?'#73d8ef':'#ff8289',7);this.sound('hit');}
  explode(e,r,damage){this.pulse(e.x,e.y,r,'#f5a16c',.65);this.burst(e.x,e.y,'#f7a16b',16);if(dist(e,this.s)<r+12)this.damage(damage*(this.difficulty.damage||1),'explosion');if(this.s.companion && this.s.girl.down<=0 && dist(e,this.s.girl)<r)this.s.girl.hp-=damage*.7;}
  areaDamage(x,y,r,damage,knock=false){for(const e of this.s.enemies)if(!e.dead && length(e.x-x,e.y-y)<r+e.r){this.hurt(e,damage);if(knock && !e.dead){const d=length(e.x-x,e.y-y)||1;this.move(e,(e.x-x)/d*52,(e.y-y)/d*52,e.r*.6);}}}
  updateVehicles(dt){for(const v of this.s.vehicles){v.x+=v.vx*dt;v.y+=v.vy*dt;v.life-=dt;updateCarBills(this,v,dt);for(const e of this.s.enemies)if(!e.dead && !v.hitIds?.has(e.id) && Math.abs(v.x-e.x)<e.r+38 && Math.abs(v.y-e.y)<e.r+23){v.hitIds?.add(e.id);this.hurt(e,v.damage||65);if(v.kind==='bike')this.powerEffect('chopper','impact',e.x,e.y,0,{tx:e.x+v.vx,ty:e.y+v.vy});if(v.knockback && !e.dead){const n=length(v.vx,v.vy)||1;this.move(e,v.vx/n*v.knockback,v.vy/n*v.knockback,e.r*.6);}this.burst(e.x,e.y,'#f2bd53',4);}}this.s.vehicles=this.s.vehicles.filter(v=>v.life>0);}
  updateClouds(dt){const s=this.s;for(const c of s.clouds){c.life-=dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.vx*=Math.exp(-dt*.45);c.vy*=Math.exp(-dt*.45);c.r=Math.min(c.maxr||49,c.r+dt*(c.maxr?16:10));c.arm=Math.max(0,(c.arm||0)-dt);if(c.life>0 && c.arm<=0 && length(c.x-s.x,c.y-s.y)<c.r+10)this.damage(7*(this.difficulty.damage||1),'gas');if(c.arm<=0 && s.companion && s.girl.down<=0 && length(c.x-s.girl.x,c.y-s.girl.y)<c.r+8)s.girl.hp-=dt*3*s.stats.gasMultiplier;}s.clouds=s.clouds.filter(c=>c.life>0);}
  updateShockwaves(dt,previousPlayer=this.s,previousGirl=this.s.girl){
    const s=this.s;
    for(const wave of s.shockwaves){
      const owner=s.enemies.find(e=>e.id===wave.ownerId);
      if(owner?.charmed>0||s.airplane.active&&length(wave.x-s.x,wave.y-s.y)<s.airplane.r){wave.life=0;continue;}
      wave.prevR=wave.r;wave.r=Math.min(wave.maxR,wave.r+(wave.maxR-wave.r)*Math.min(1,dt/Math.max(dt,wave.life)));wave.life=Math.max(0,wave.life-dt);
      const crosses=(from,to,radius)=>{
        const x=from.x-wave.x,y=from.y-wave.y,vx=to.x-from.x,vy=to.y-from.y,dr=wave.r-wave.prevR,half=wave.width/2+radius;
        const gap=t=>length(x+vx*t,y+vy*t)-(wave.prevR+dr*t),first=gap(0),last=gap(1),maximum=Math.max(first,last);let minimum=Math.min(first,last);
        if(maximum < -half)return false;
        // Signed radial distance is convex. Check its interior minimum as well
        // as endpoints, so lateral movement and fast outward dodges both agree
        // with the visible moving annulus rather than a filled swept disk.
        const slope=t=>((x+vx*t)*vx+(y+vy*t)*vy)/Math.max(.000001,length(x+vx*t,y+vy*t))-dr;
        if(minimum>half&&slope(0)<0&&slope(1)>0){let low=0,high=1;for(let i=0;i<12;i++){const mid=(low+high)/2;if(slope(mid)<0)low=mid;else high=mid;}minimum=Math.min(minimum,gap((low+high)/2));}
        return minimum<=half&&maximum>=-half;
      };
      if(!wave.hitPlayer&&crosses(previousPlayer,s,13)){wave.hitPlayer=true;this.damage(wave.damage,'shockwave');}
      if(s.companion&&s.girl.down<=0&&!wave.hitGirl&&crosses(previousGirl,s.girl,10)){wave.hitGirl=true;s.girl.hp-=wave.damage;this.burst(s.girl.x,s.girl.y,'#f1be73',5);}
    }
    s.shockwaves=s.shockwaves.filter(w=>w.life>0);
  }
  updateDrops(dt){
    const s=this.s,g=s.girl,collected=new Set();let girlCollected=false;s.drops=compactDrops(s,this.world);for(const d of s.drops){if(!d.compact)d.life-=dt;let target=s;let distance=dist(d,s);if(s.companion && g.down<=0 && dist(d,g)<distance){target=g;distance=dist(d,g);}
      if(distance<s.stats.magnet&&distance>0){const speed=130+Math.max(0,s.stats.magnet-distance)*4,pull=Math.min(distance,speed*dt);if(pull>0&&this.rank('magnet'))this.powerEffect('magnet','attract',d.x,d.y,0,{tx:target.x,ty:target.y});d.x+=(target.x-d.x)/distance*pull;d.y+=(target.y-d.y)/distance*pull;distance=dist(d,target);}
      if(distance<22){collected.add(d);if(target===g)girlCollected=true;if(d.kind==='xp'){this.gainXP(d.value);this.sound('collect');}else if(d.kind==='heal'){s.hp=Math.min(s.maxhp,s.hp+d.value);if(s.companion)g.hp=Math.min(g.maxhp,g.hp+d.value*.5);this.burst(d.x,d.y,'#8eddab',6);this.sound('collect');}else if(d.kind==='coin'){s.coins+=d.value;const from=s.hp;s.hp=Math.min(s.maxhp,s.hp+this.rank('money')*.75);if(s.hp>from)this.powerEffect('money','heal',s.x,s.y,0,{amount:s.hp-from});this.sound('coin');}else if(d.kind==='gem'){s.gems+=d.value;s.hp=Math.min(s.maxhp,s.hp+4);this.sound('coin');}}
    }s.drops=s.drops.filter(d=>!collected.has(d));s.drops=compactDrops(s,this.world);if(girlCollected)this.powerEffect('girlfriend','collect',g.x,g.y);
  }
  updateChests(dt){
    const s=this.s;this.timers.chest-=dt;if(this.timers.chest<=0){this.timers.chest=47;const angle=this.random()*TAU;let x=s.x+Math.cos(angle)*210,y=s.y+Math.sin(angle)*210;for(let i=0;i<10 && this.world.collides(x,y,16);i++){x+=30;y-=25;}s.chests.push({id:this.id++,x,y,open:false,openedAt:0});}
    for(const c of s.chests)if(!c.open && dist(c,s)<32){c.open=true;c.openedAt=s.elapsed;s.coins+=5;s.hp=Math.min(s.maxhp,s.hp+18);s.shield=Math.max(s.shield,Math.min(s.stats.shieldMax,s.shield+12));this.gainXP(10+Math.floor(s.level*.5));this.pulse(c.x,c.y,90,'#f5cd67',.7);this.sound('chest');queueBossTrophy(this,c);}
    const pendingIds=new Set(s.trophies.pending.map(p=>p.chestId));s.chests=s.chests.filter(c=>pendingIds.has(c.id)||(!c.open || s.elapsed-c.openedAt<8) && dist(c,s)<1600);
  }
  pulse(x,y,r,color,life=.5){this.s.pulses.push({x,y,r:4,maxr:r,life,maxlife:life,color});}
  powerEffect(power,kind,x=this.s.x,y=this.s.y,r=0,detail={}){
    // Cosmetic records and their throttles never enter saved state or consume RNG.
    this.prunePowerEffects();
    const now=this.s.elapsed,key=`${power}:${kind}`,period=kind==='heal'||kind==='recharge'?1.2:kind==='impact'?.12:0;
    if(period&&now<(this.powerCueCooldowns.get(key)??-Infinity))return;
    if(kind==='collect'&&this.powerEffects.some(e=>e.kind===kind&&e.power===power))return;
    if(kind==='attract'||kind==='slow'){let count=0;for(const e of this.powerEffects)if(e.kind===kind&&++count>=3)return;}
    if(period)this.powerCueCooldowns.set(key,now+period);
    if(this.powerEffects.length>=16)this.powerEffects.shift();
    this.powerEffects.push({power,kind,x,y,r,rank:this.rank(power),start:now,life:kind==='acquire'?.85:kind==='collect'||kind==='attract'?.28:power==='truth'?.42:power==='airplane'?.5:.55,...detail});
  }
  prunePowerEffects(){let count=0;for(const effect of this.powerEffects)if(this.s.elapsed-effect.start<effect.life)this.powerEffects[count++]=effect;this.powerEffects.length=count;}
  burst(x,y,color,count){for(let i=0;i<count;i++){const a=this.random()*TAU,v=20+this.random()*70,life=.25+this.random()*.35;this.s.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life,maxlife:life,color});}}
  updateEffects(dt){const s=this.s;this.prunePowerEffects();this.defeatEffects=this.defeatEffects.filter(effect=>s.elapsed-effect.start<effect.life);for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}s.particles=s.particles.filter(p=>p.life>0);for(const p of s.pulses){p.life-=dt;p.r=p.maxr*(1-p.life/p.maxlife);}s.pulses=s.pulses.filter(p=>p.life>0);}
  updateStunt(dt,moved){
    const s=this.s,stunt=s.stunt;
    if(stunt.active){stunt.time=Math.min(stunt.duration,stunt.time+dt);stunt.progress=clamp(stunt.time/stunt.duration,0,1);if(stunt.time>=stunt.duration){stunt.active=false;s.walkDistance=0;}}
    if(this.pendingStuntReply&&s.elapsed>=this.pendingStuntReply.at){
      const reply=this.pendingStuntReply;this.pendingStuntReply=null;
      if(s.companion&&s.girl.down<=0&&STUNT_REPLIES.length){const line=STUNT_REPLIES[reply.index%STUNT_REPLIES.length];this.speechUntil=s.elapsed+3.1;this.bark(line.who,line.text,true);}
    }
    const running=moved>=dt*28&&length(s.moveX,s.moveY)>.35;
    this.runStreak=running?this.runStreak+dt:0;if(running)this.stuntCharge+=dt;
    if(!stunt.active&&this.stuntCharge>=this.stuntWait&&this.runStreak>=2.5&&s.elapsed>=this.speechUntil){
      const index=stunt.count++,d=length(s.moveX,s.moveY)||1;
      stunt.active=true;stunt.time=0;stunt.progress=0;stunt.faceX=s.moveX/d;stunt.faceY=s.moveY/d;
      this.stuntCharge=0;this.stuntWait=22+this.stuntRandom()*13;this.speechUntil=s.elapsed+3.2;
      if(STUNT_BARKS.length){const line=STUNT_BARKS[index%STUNT_BARKS.length];this.bark(line.who,line.text,true);}
      this.pendingStuntReply={at:s.elapsed+2.6,index};this.sound('split');
    }
  }
  reactToCrow(){
    const now=this.s.elapsed;if(now-(this.lastCrowReaction??-100)<.9)return;
    this.lastCrowReaction=now;const until=now+4.3;
    for(const reply of [this.pendingStuntReply,this.pendingRivalReply])if(reply)reply.at=Math.max(reply.at,until+.1);
    this.bark(ROOSTER_REACTION.who,ROOSTER_REACTION.text,true);this.speechUntil=Math.max(this.speechUntil,until);
  }
  updateRivalBanter(){
    const s=this.s;
    if(this.pendingRivalReply&&s.elapsed>=this.pendingRivalReply.at){
      const reply=this.pendingRivalReply;this.pendingRivalReply=null;
      if(reply.ally){if(s.companion&&s.girl.down<=0){const line=RIVAL_COMPANION_REPLIES[reply.index%RIVAL_COMPANION_REPLIES.length];if(line)this.bark(line.who,line.text,true);}}
      else if(s.enemies.some(e=>e.id===reply.id&&!e.dead)){const lines=RIVAL_REPLIES[reply.type]||[],text=lines[reply.index%lines.length];if(text)this.bark(reply.type==='rival_rooster'?'COQ RIVAL':'BOUC RIVAL',text,true);}
    }
    if(s.elapsed<this.speechUntil||s.elapsed-this.lastRivalBark<10||!RIVAL_BARKS.length)return;
    const rival=s.enemies.find(e=>!e.dead&&e.sex==='male'&&isRival(e.type)&&e.charmed<=0&&e.banterCount<2&&(e.banterCount===0||dist(e,s)<330&&s.elapsed>=e.nextTaunt));
    if(!rival)return;
    const index=this.rivalBarkIndex++,line=RIVAL_BARKS[index%RIVAL_BARKS.length];this.bark(line.who,line.text,true);this.lastRivalBark=s.elapsed;rival.banterCount++;rival.nextTaunt=s.elapsed+22;
    if(index%2===0||s.companion)this.pendingRivalReply={at:s.elapsed+2.7,id:rival.id,type:rival.type,index,ally:index%2===1&&s.companion};
  }
  bark(who,text,priority=false){if(who==='BLONDE IA'&&(!this.s.companion||this.s.girl.down>0))return false;if(!priority&&this.s.elapsed<this.speechUntil)return false;this.emit('bark',{who,text});this.speechUntil=Math.max(this.speechUntil,this.s.elapsed+(priority?3.1:Math.max(4.3,text.length*.039)));return true;}

  story(dt){
    const s=this.s;this.timers.bark-=dt;
    if(s.elapsed<this.speechUntil)return;
    // Persist chapter flags in the already bounded, saved event set. A late
    // checkpoint catches up to its current chapter, not several stale speeches.
    const due=STORY_MILESTONES.filter(m=>s.elapsed>=m.at&&!this.eventSeen.has(`chapter:${m.at}`));
    if(due.length){
      for(const m of due)this.eventSeen.add(`chapter:${m.at}`);
      const line=due.at(-1);this.bark(line.who,line.text);return;
    }
    if(s.elapsed>=this.nextEvent){
      const props=this.world.getVisible(s.x,s.y,360,360);
      const prop=props.find(p=>WORLD_REMARKS[p.type]&&!this.eventSeen.has(p.type)&&dist(p,s)<Math.max(55,p.w*.6));
      if(prop){
        const line=WORLD_REMARKS[prop.type];this.eventSeen.add(prop.type);
        this.nextEvent=s.elapsed+80;this.bark(line.who,line.text);return;
      }
    }
    if(this.timers.bark<=0){
      this.timers.bark=18+this.random()*9;const available=contextualBarks(s);
      if(available.length){const line=available[this.barkIndex++%available.length];this.bark(line.who,line.text);}
    }
  }
}
