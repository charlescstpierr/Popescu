// Optional post-victory encounter. Its clock never changes the survival record.
export const CHARLES={hitsToTransform:18,maxDestroyed:64,waveWidth:18,gapHalfAngle:.52,phases:{intro:8,hover:2.4,shock_warning:2.6,shockwave:1.8,cape_warning:2.2,cape_spin:.85,recover:2,descend:1.25,bend:1.5,scream:1.25,burst:1.4,empowered:2.2,complete:0}};
export const CHARLES_LINES=[
 {who:'TOMA',text:"Vingt minutes, Charles. Chuck Norris demande mon programme d'entraînement."},
 {who:'CHARLES',text:"Ton programme ? J'ai surtout la photo de ton char à six roues."},
 {who:'TOMA',text:"Deux roues de plus. Deux fois plus exclusif. Fais le calcul."},
 {who:'CHARLES',text:"J'ai compté tes doigts aussi. Six. Même fournisseur ?"},
 {who:'TOMA',text:"Une main de génie. Ça prend du surplus pour compter mes millions."},
 {who:'CHARLES',text:"Tes millions sont sur la photo. Comme la villa. Comme les clés."},
 {who:'TOMA',text:"J'ai survécu pour vrai, moi. Ça, tu peux pas l'effacer."},
 {who:'CHARLES',text:"Ça, c'est vrai. Le reste, on va le regarder sans filtre."}
];
export function charlesActive(s){return Boolean(s.charles&&s.charles.phase!=='complete'&&!s.endless);}
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function charlesWaveRadius(c){return c.waveMax*(1-c.phaseTime/c.phaseDuration);}
export function charlesWaveSafe(c,x,y,margin=0){const d=Math.hypot(x-c.x,y-c.y);return d>margin&&Math.abs(angleDelta(Math.atan2(y-c.y,x-c.x),c.safeAngle))<Math.max(0,CHARLES.gapHalfAngle-Math.asin(Math.min(1,margin/d)));}
function phase(c,name){c.phase=name;c.phaseDuration=CHARLES.phases[name];c.phaseTime=c.phaseDuration;}
function line(g,text){g.urgentSpeech('CHARLES',text);}
export function startCharles(g){
 const s=g.s;if(s.mode!=='victory'||s.endless||s.charles||s.elapsed<1200)return false;
 g.clearSpeech();
 const offset=Math.max(-30,Math.min(80,g.viewport.height*.48-310));
 s.charles={id:g.id++,type:'charles',x:s.x+(g.viewport.height<650?65:0),y:s.y-offset,r:28,hp:1,maxhp:1,dead:false,charmed:0,hitFlash:0,hits:0,powered:false,phase:'intro',phaseTime:8,phaseDuration:8,elapsed:0,attackCount:0,safeAngle:Math.PI/2,waveMax:300,capeRadius:112,dialogueIndex:0,nextDialogue:0,outcome:'',destroyed:[]};
 // No ordinary enemy or projectile can steal this optional encounter. Rewards
 // already pending keep their provenance and can be chosen in endless mode.
 for(const key of ['enemies','shots','drops','clouds','particles','vehicles','pulses','shockwaves'])s[key]=[];
 s.airplane.active=false;s.airplane.life=0;s.stunt.active=false;s.stunt.progress=0;s.stunt.time=0;
 g.defeatEffects=[];g.powerEffects=[];g.powerCueCooldowns.clear();g.pendingStuntReply=null;g.pendingRivalReply=null;
 s.hp=Math.max(s.hp,s.maxhp*.5);s.mode='playing';s.moveX=0;s.moveY=0;g.emit('epilogue-start',s.charles);return true;
}
export function finishCharles(g,outcome='left'){
 const s=g.s,c=s.charles;if(!charlesActive(s))return false;
 g.powerEffects=[];g.defeatEffects=[];g.powerCueCooldowns.clear();
 g.clearSpeech();c.outcome=outcome;phase(c,'complete');s.mode='victory';s.moveX=0;s.moveY=0;s.walkMoving=false;
 if(outcome==='defeated'){s.hp=0;g.sound('defeat');}g.emit('epilogue-complete',c);return true;
}
export function hitCharles(g,c,damage){
 if(!charlesActive(g.s)||c!==g.s.charles||!Number.isFinite(damage)||damage<=0)return;
 c.hitFlash=.12;if(c.phase!=='intro'&&!c.powered)c.hits=Math.min(CHARLES.hitsToTransform,c.hits+1);
}
// A stable third of props break in waves, leaving scenery for the two impacts.
// Do not consume combat randomness or select fresh props on every wave frame.
function waveBreaksProp(id){let hash=0;for(const ch of id)hash=(Math.imul(hash,31)+ch.charCodeAt(0))>>>0;return hash%3===0;}
function destroyScenery(g,c,r,sparse=false){
 if(c.destroyed.length>=CHARLES.maxDestroyed)return;
 const props=g.world.getVisible(c.x,c.y,r*2+100,r*2+100),ids=new Set(c.destroyed);
 for(const p of props){if(ids.size>=CHARLES.maxDestroyed)break;if(['tree','pine','crate','pallet','barricade','planter'].includes(p.type)&&Math.hypot(p.x-c.x,p.y-c.y)<=r&&!ids.has(p.id)&&(!sparse||waveBreaksProp(p.id)))ids.add(p.id);}
 c.destroyed=[...ids];g.world.setDestroyed(c.destroyed);
}
// Conservative swept radial collision, using convexity to catch a moving
// player crossing the ring while preserving the visible safe opening.
export function charlesWaveHits(c,from,to,oldRadius,newRadius){
 const vx=to.x-from.x,vy=to.y-from.y,dr=newRadius-oldRadius,px=from.x-c.x,py=from.y-c.y,half=CHARLES.waveWidth/2+13;
 const gap=t=>Math.hypot(px+vx*t,py+vy*t)-(oldRadius+dr*t);
 // The body's safe interval is the intersection of two linear half-planes.
 // Test annulus overlap only outside that interval, rather than punishing a
 // player who reached the opening before the wave reached their body.
 let safeLo=0,safeHi=1;
 for(const side of [-1,1]){
  const a=c.safeAngle+side*CHARLES.gapHalfAngle,nx=side*Math.sin(a),ny=-side*Math.cos(a);
  const first=nx*px+ny*py-13,delta=nx*vx+ny*vy;
  if(Math.abs(delta)<1e-12){if(first<0){safeLo=1;safeHi=0;break;}}
  else if(delta>0)safeLo=Math.max(safeLo,-first/delta);else safeHi=Math.min(safeHi,-first/delta);
 }
 const overlaps=(a,b)=>{
  if(b-a<1e-10)return false;
  const maximum=Math.max(gap(a),gap(b));if(maximum < -half)return false;
  let l=a,r=b;for(let i=0;i<24;i++){const x=(2*l+r)/3,y=(l+2*r)/3;if(gap(x)<gap(y))r=y;else l=x;}
  return Math.min(gap(a),gap(b),gap((l+r)/2))<=half;
 };
 if(safeLo>=safeHi||safeHi<0||safeLo>1)return overlaps(0,1);
 return overlaps(0,Math.max(0,safeLo))||overlaps(Math.min(1,safeHi),1);
}

function follow(g,c,dt){const dx=g.s.x-c.x,dy=g.s.y-c.y,d=Math.hypot(dx,dy)||1;const travel=Math.min(Math.max(0,d-100),240*dt);c.x+=dx/d*travel;c.y+=dy/d*travel;}
function nextAttack(g,c){
 c.waveMax=c.powered?380:300;c.capeRadius=c.powered?145:112;
 if(c.attackCount%2===0){c.safeAngle=Math.atan2(g.s.y-c.y,g.s.x-c.x);phase(c,'shock_warning');line(g,'LA VÉRITÉ ARRIVE. Reste dans l’ouverture verte !');}
 else{phase(c,'cape_warning');line(g,'CAPE-LAME. Sors du cercle doré !');}
}
export function updateCharles(g,dt,previousPlayer){
 const s=g.s,c=s.charles;if(!charlesActive(s))return;
 c.elapsed+=dt;c.hitFlash=Math.max(0,c.hitFlash-dt);
 if(c.dialogueIndex<CHARLES_LINES.length&&c.elapsed>=c.nextDialogue&&['intro','hover','recover','empowered'].includes(c.phase)){
  const dialogue=CHARLES_LINES[c.dialogueIndex];if(g.bark(dialogue.who,dialogue.text,true)){c.dialogueIndex++;c.nextDialogue=c.elapsed+4.8;}
 }
 const oldPhase=c.phase,oldRadius=c.phase==='shockwave'?charlesWaveRadius(c):0;
 if(['hover','recover','empowered'].includes(c.phase))follow(g,c,dt);
 c.phaseTime=Math.max(0,c.phaseTime-dt);
 if(c.phase==='shockwave'){
  const radius=charlesWaveRadius(c);destroyScenery(g,c,radius,true);
  if(charlesWaveHits(c,previousPlayer,s,oldRadius,radius)){finishCharles(g,'defeated');return;}
 }
 if(c.phase==='cape_spin'){
  const dx=s.x-previousPlayer.x,dy=s.y-previousPlayer.y,den=dx*dx+dy*dy;
  const t=den?Math.max(0,Math.min(1,((c.x-previousPlayer.x)*dx+(c.y-previousPlayer.y)*dy)/den)):0;
  if(Math.hypot(previousPlayer.x+dx*t-c.x,previousPlayer.y+dy*t-c.y)<c.capeRadius+13){finishCharles(g,'defeated');return;}
 }
 if(c.hits>=CHARLES.hitsToTransform&&!c.powered&&c.attackCount>=2&&['hover','recover'].includes(c.phase)){
  phase(c,'descend');line(g,'Bon. J’avais promis de rester humble. J’ai pas promis de rester petit.');return;
 }
 if(c.phaseTime>0)return;
 if(oldPhase==='intro'){phase(c,'hover');return;}
 if(['hover','recover','empowered'].includes(oldPhase)){nextAttack(g,c);return;}
 if(oldPhase==='shock_warning'){phase(c,'shockwave');g.sound('truth');return;}
 if(oldPhase==='cape_warning'){phase(c,'cape_spin');g.sound('truth');return;}
 if(['shockwave','cape_spin'].includes(oldPhase)){c.attackCount++;phase(c,'recover');return;}
 if(oldPhase==='descend'){phase(c,'bend');destroyScenery(g,c,145);return;}
 if(oldPhase==='bend'){phase(c,'scream');line(g,'AAAAAAAH ! Même sans filtre, la vérité éclaire.');return;}
 if(oldPhase==='scream'){phase(c,'burst');destroyScenery(g,c,240);g.sound('truth');return;}
 if(oldPhase==='burst'){c.powered=true;phase(c,'empowered');line(g,'CHARLES ÉVEILLÉ. Même vérité. Beaucoup plus de portée.');}
}
