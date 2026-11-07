import {computeHeroPose} from './hero-pose.js';
// Short-lived visual reactions are derived from simulation changes, never written back.
export const RIMS={normal:'#ce8eae',sprinter:'#8bcbd8',gas:'#b6cf86',tank:'#d9bc7f',jealous:'#da91b5',explosive:'#e6ac7d',matriarch:'#e4c68c'};
const COLORS={hit:'#ffe293',heart:'#ff8ebc',dust:'#a494a4'};
export const TELEGRAPH_STYLES=Object.freeze({
  charge:{fill:'#ff472b',edge:'#ff8951',windup:.8},
  crow:{fill:'#ff472b',edge:'#ff6984',windup:.85},
  blast:{fill:'#ff472b',edge:'#ff8951',windup:.72},
  gas:{fill:'#ff472b',edge:'#ff8951',windup:1.05},
  swipe:{fill:'#ff472b',edge:'#ff8951',windup:.6},
  tail:{fill:'#ff472b',edge:'#ff8951',windup:1.2},
  tailDash:{fill:'#ff472b',edge:'#ff8951',windup:1.3},
  hug:{fill:'#ff472b',edge:'#ff8951',windup:1},
  zodiac:{fill:'#ff472b',edge:'#ff8951',windup:1},
  tarot:{fill:'#ff472b',edge:'#ff8951',windup:1},
  egoFrame:{fill:'#ff472b',edge:'#ff8951',windup:1.2},
  egoLane:{fill:'#ff472b',edge:'#ff8951',windup:1},
  animalLane:{fill:'#ff472b',edge:'#ff8951',windup:1},
  animalFlash:{fill:'#ff472b',edge:'#ff8951',windup:1},
  charlesShock:{fill:'#ff472b',edge:'#ff8951',windup:2.6},
  charlesCape:{fill:'#ff472b',edge:'#ff8951',windup:2.2}
});
export function drawTelegraph(ctx,family,remaining,time,reduced,active=false,pass='edge',windup=TELEGRAPH_STYLES[family].windup){
  if(pass==='both'){drawTelegraph(ctx,family,remaining,time,reduced,active,'ground',windup);drawTelegraph(ctx,family,remaining,time,reduced,active,'edge',windup);return;}
  const style=TELEGRAPH_STYLES[family],progress=Math.max(0,Math.min(1,1-remaining/windup));
  const pulse=reduced?0:(.5+.5*Math.sin(time*8))*progress;
  ctx.save();const alpha=ctx.globalAlpha;ctx.setLineDash([]);ctx.lineWidth=family==='tail'&&active?3:2;
  if(pass==='ground'){ctx.fillStyle=style.fill;ctx.globalAlpha=alpha*(active?(reduced?.32:.38):reduced?.14+progress*.08:.12+progress*.1+pulse*.08);ctx.fill();}
  else{ctx.strokeStyle=style.edge;ctx.globalAlpha=alpha*(active?1:.85+progress*.15);ctx.stroke();}ctx.restore();
}
export function enemyAccent(actor,state){
  if(!Number.isFinite(state.x)||!Number.isFinite(state.y))return 1;
  if(actor.windup>0||actor.swipe>0||actor.charge>0||actor.crow>0||actor.phase==='animal_warning'||actor.phase==='ego_warning')return 1;
  const t=Math.max(0,Math.min(1,(Math.hypot(actor.x-state.x,actor.y-state.y)-110)/260));
  return 1-.78*t*t*(3-2*t);
}

/* Game-feel registry. Every reaction below is presentation only: it is derived
   from simulation deltas, keyed to simulation seconds (modal pauses freeze it)
   and never written back. Lifetimes and caps live here instead of in scattered
   conditionals, so a 300-enemy horde spends a fixed, small drawing budget. */
export const FX=Object.freeze({
  number:{life:.62,merge:.16,pop:.12},          // enemy damage numbers ('hit' cues)
  ouch:{life:.45},                               // Toma's lost health
  level:{life:.8},
  flash:{life:.12,hold:.03,peak:.92,tail:.5,reduced:.3,color:'#fffdf4'},
  recoil:{life:.11,cap:96,px:3},                 // per-enemy shove along the shot
  spark:{life:.17,cap:24,perFrame:10,count:4},   // impact sprays
  burst:{life:.42,count:10,ring:12},             // death breakup in the rim colour
  pop:{life:.14,hold:.045},                      // defeat silhouette pop, then squash
  splat:{life:2.4,cap:24},                       // fading ground mark of ordinary defeats
  shake:{cap:4},
  hurt:{life:.26,shake:4,shakeLife:.12},         // red edge flash and kick when health drops
  block:{shake:2,shakeLife:.09},                 // shield absorbed the hit
  blast:{shake:3,shakeLife:.11,reach:420},       // explosive gorilla detonation
  slam:{shake:4,shakeLife:.14,reach:560},        // boss impacts and crow shockwaves
  bossDown:{shake:3,shakeLife:.12,reach:520},
  muzzle:{life:.075},                            // bloom under the painting
  smoke:{life:.34,cap:6},
  casing:{life:.7,cap:10},
  collect:{life:.3,cap:14,near:46}
});
const DROP_COLORS={xp:'#75e7f2',coin:'#ffe09a',gem:'#e68ff2',heal:'#ff8fa6'};
const BURST_COLORS={orangutan:'#f0a35c',rival_goat:'#e8d6a8',rival_rooster:'#ff8a5c',pelican:'#d58af5',travestia:'#f65f9f',ego_peacock:'#71e1eb',ego_toad:'#f18db4',ego_rat:'#f4ce76',ego_chameleon:'#c9a2ff'};
const BODY_Y={tank:40,matriarch:50,orangutan:36,rival_goat:38,rival_rooster:36,pelican:70,travestia:80,moose:50,ostrich:46};
const HEAD_Y={tank:58,matriarch:74,pelican:104,travestia:116,moose:86,ostrich:80};
const BIG=new Set(['tank','matriarch','orangutan','rival_goat','rival_rooster','travestia','pelican','moose']);
const BOSS=new Set(['pelican','travestia','ego_peacock','ego_toad','ego_rat','ego_chameleon']);
const SLAM_PHASES=new Set(['tail_spin','tail_dash']);
const CHARLES_SLAMS=new Set(['shockwave','cape_spin']);
const TAU=Math.PI*2;
export const burstColor=type=>BURST_COLORS[type]||RIMS[type]||'#c5bec5';
const easeOut=t=>1-(1-t)*(1-t)*(1-t);
function makeCanvas(w,h){
  if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);
  if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  return null;
}
export const hitFlashAlpha=(flash,reduced=false)=>{
  // The engine starts hitFlash at 0.12 s. Hold a near-white silhouette for
  // about two frames, then let it drop off quickly; reduced effects only tint.
  if(!(flash>0))return 0;
  if(reduced)return Math.min(FX.flash.reduced,flash*2.5);
  const age=FX.flash.life-flash;
  return age<FX.flash.hold?FX.flash.peak:Math.min(FX.flash.tail,flash/(FX.flash.life-FX.flash.hold)*FX.flash.tail);
};

/* Danger fills from many overlapping telegraphs used to stack into opaque red.
   The ground pass draws into this recorder instead: geometry, transform and
   alpha are kept exactly, then fills are composited by increasing alpha into
   one layer where each zone first erases what it covers. Every pixel therefore
   shows the strongest single zone, never a sum. Edges are untouched. */
const PATH_OPS=['moveTo','lineTo','arc','arcTo','ellipse','rect','closePath','bezierCurveTo','quadraticCurveTo'];
const IDENTITY=Object.freeze({a:1,b:0,c:0,d:1,e:0,f:0});
const multiply=(m,a,b,c,d,e,f)=>({a:m.a*a+m.c*b,b:m.b*a+m.d*b,c:m.a*c+m.c*d,d:m.b*c+m.d*d,e:m.a*e+m.c*f+m.e,f:m.b*e+m.d*f+m.f});
const matrixOf=m=>({a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f});
// Alpha step used to union near-equal crowd discs into one fill (imperceptible: ≤0.01).
const DISC_STEP=.02;
export class DangerLayer{
  constructor(){this.zones=[];this.path=[];this.target=null;this.proxy=null;this.bound=new Map();this.ops=new Map();this.surfaces=new Map();this.composited=0;this.fills=0;
    this.matrix=IDENTITY;this.stack=[];
    this._begin=()=>{this.path=[];};
    this._fill=rule=>{if(this.path.length)this.zones.push({ops:this.path.slice(),alpha:this.target.globalAlpha,style:this.target.fillStyle,rule:typeof rule==='string'?rule:'nonzero'});};
    for(const name of PATH_OPS)this.ops.set(name,(...args)=>{this.path.push([name,args,this.matrix]);});
    // Track the transform alongside the real context, so recording never allocates DOMMatrix objects.
    const t=(name,update)=>(...args)=>{this.target[name](...args);update(...args);};
    this.transforms=new Map([
      ['save',t('save',()=>this.stack.push(this.matrix))],
      ['restore',t('restore',()=>{if(this.stack.length)this.matrix=this.stack.pop();})],
      ['translate',t('translate',(x,y)=>{this.matrix=multiply(this.matrix,1,0,0,1,x,y);})],
      ['scale',t('scale',(x,y)=>{this.matrix=multiply(this.matrix,x,0,0,y,0,0);})],
      ['rotate',t('rotate',a=>{const c=Math.cos(a),n=Math.sin(a);this.matrix=multiply(this.matrix,c,n,-n,c,0,0);})],
      ['transform',t('transform',(a,b,c,d,e,f)=>{this.matrix=multiply(this.matrix,a,b,c,d,e,f);})],
      ['setTransform',t('setTransform',(...a)=>{this.matrix=a.length>=6?{a:a[0],b:a[1],c:a[2],d:a[3],e:a[4],f:a[5]}:matrixOf(this.target.getTransform());})],
      ['resetTransform',t('resetTransform',()=>{this.matrix=IDENTITY;})]
    ]);
  }
  record(target){
    if(this.target!==target){
      this.target=target;this.bound.clear();const self=this;
      this.proxy=new Proxy(target,{
        get(t,key){
          if(key==='beginPath')return self._begin;
          if(key==='fill')return self._fill;
          const op=self.ops.get(key)||self.transforms.get(key);if(op)return op;
          const value=t[key];if(typeof value!=='function')return value;
          let bound=self.bound.get(key);if(!bound){bound=value.bind(t);self.bound.set(key,bound);}return bound;
        },
        set(t,key,value){t[key]=value;return true;}
      });
    }
    this.zones.length=0;this.path=[];this.stack.length=0;this.matrix=matrixOf(target.getTransform());return this.proxy;
  }
  static bounds(zone){
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
    const add=(m,x,y)=>{const px=m.a*x+m.c*y+m.e,py=m.b*x+m.d*y+m.f;if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py;};
    for(const [name,a,m]of zone.ops){
      if(name==='arc'||name==='ellipse'){const r=name==='arc'?a[2]:Math.max(a[2],a[3]);add(m,a[0]-r,a[1]-r);add(m,a[0]+r,a[1]-r);add(m,a[0]-r,a[1]+r);add(m,a[0]+r,a[1]+r);}
      else if(name==='rect'){add(m,a[0],a[1]);add(m,a[0]+a[2],a[1]);add(m,a[0],a[1]+a[3]);add(m,a[0]+a[2],a[1]+a[3]);}
      else for(let i=0;i+1<a.length;i+=2)add(m,a[i],a[i+1]);
    }
    return [x0-2,y0-2,x1+2,y1+2];
  }
  // A single clockwise full circle under a non-mirrored transform: these union safely with nonzero fill.
  static disc(zone){
    if(zone.rule!=='nonzero'||zone.ops.length!==1)return false;const [name,a,m]=zone.ops[0];
    return name==='arc'&&!a[5]&&a[4]-a[3]>=Math.PI*2-1e-6&&m.a*m.d-m.b*m.c>0;
  }
  /** Append zones as separate subpaths of one path; place(m) maps recorded matrices to the surface. */
  static trace(c,group,place){
    c.beginPath();
    for(const zone of group)for(let i=0;i<zone.ops.length;i++){
      const [name,args,m]=zone.ops[i];place(m);
      if(i===0&&group.length>1){
        // Start every zone on a fresh subpath, exactly where its own path began.
        if(name==='arc')c.moveTo(args[0]+args[2]*Math.cos(args[3]),args[1]+args[2]*Math.sin(args[3]));
        else if(name==='lineTo'){c.moveTo(args[0],args[1]);continue;}
      }
      c[name](...args);
    }
  }
  _surface(w,h){
    // Compositing cost follows the layer's own size, so it is sized to the
    // danger bounds (64 px buckets, a few cached), not to the whole screen.
    const bw=Math.ceil(w/64)*64,bh=Math.ceil(h/64)*64,key=`${bw}x${bh}`;let entry=this.surfaces.get(key);
    if(entry){this.surfaces.delete(key);this.surfaces.set(key,entry);return entry;}
    const canvas=makeCanvas(bw,bh),ctx=canvas?.getContext('2d');if(!ctx)return null;
    entry={canvas,ctx};this.surfaces.set(key,entry);if(this.surfaces.size>4)this.surfaces.delete(this.surfaces.keys().next().value);return entry;
  }
  flush(scale=1){
    const t=this.target,zones=this.zones,n=zones.length;this.composited=0;this.fills=0;if(!t||!n)return;
    const boxes=zones.map(DangerLayer.bounds),meet=(a,b)=>a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3],linked=new Uint8Array(n);
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(meet(boxes[i],boxes[j]))linked[i]=linked[j]=1;
    // Overlapping zones become groups: near-equal crowd discs share one union fill,
    // every other shape keeps its own fill. Groups are painted by increasing alpha.
    const groups=[],discs=new Map(),direct=m=>t.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);
    for(let i=0;i<n;i++){
      const zone=zones[i];
      if(!linked[i]){t.save();DangerLayer.trace(t,[zone],direct);t.globalAlpha=zone.alpha;t.fillStyle=zone.style;t.fill(zone.rule);t.restore();this.fills++;continue;}
      if(DangerLayer.disc(zone)){
        const key=`${Math.round(zone.alpha/DISC_STEP)}|${zone.style}`;let group=discs.get(key);
        if(!group){group={zones:[],alpha:0,style:zone.style,rule:'nonzero',box:[Infinity,Infinity,-Infinity,-Infinity],first:i};discs.set(key,group);groups.push(group);}
        group.zones.push(zone);group.alpha=Math.max(group.alpha,zone.alpha);const b=boxes[i],g=group.box;g[0]=Math.min(g[0],b[0]);g[1]=Math.min(g[1],b[1]);g[2]=Math.max(g[2],b[2]);g[3]=Math.max(g[3],b[3]);
      }else groups.push({zones:[zone],alpha:zone.alpha,style:zone.style,rule:zone.rule,box:boxes[i],first:i});
    }
    if(!groups.length)return;
    if(groups.length===1){
      // One union fill is already a single level: no layer is needed.
      const g=groups[0];t.save();DangerLayer.trace(t,g.zones,direct);t.globalAlpha=g.alpha;t.fillStyle=g.style;t.fill(g.rule);t.restore();this.fills++;this.composited=g.zones.length;return;
    }
    const w=t.canvas?.width|0,h=t.canvas?.height|0;
    let x0=w,y0=h,x1=0,y1=0;for(const g of groups){const b=g.box;x0=Math.min(x0,b[0]);y0=Math.min(y0,b[1]);x1=Math.max(x1,b[2]);y1=Math.max(y1,b[3]);}
    x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(w,Math.ceil(x1));y1=Math.min(h,Math.ceil(y1));
    const k=Math.min(1,Math.max(.25,scale)),lw=Math.ceil((x1-x0)*k),lh=Math.ceil((y1-y0)*k),surface=x1>x0&&y1>y0?this._surface(lw,lh):null;
    if(!surface){
      // No offscreen surface: keep the previous stacked look rather than drop a warning.
      for(const g of groups)for(const zone of g.zones){t.save();DangerLayer.trace(t,[zone],direct);t.globalAlpha=zone.alpha;t.fillStyle=zone.style;t.fill(zone.rule);t.restore();this.fills++;}
      return;
    }
    const L=surface.ctx,drawn=[],place=m=>L.setTransform(m.a*k,m.b*k,m.c*k,m.d*k,(m.e-x0)*k,(m.f-y0)*k);
    L.save();L.setTransform(1,0,0,1,0,0);L.globalCompositeOperation='source-over';L.globalAlpha=1;L.clearRect(0,0,lw+1,lh+1);
    groups.sort((a,b)=>a.alpha-b.alpha||a.first-b.first);
    for(const g of groups){
      const box=g.box;let ex0=Infinity,ey0=Infinity,ex1=-Infinity,ey1=-Infinity;
      // Erase only inside the rectangle this group shares with weaker groups already painted.
      for(const d of drawn)if(meet(box,d)){ex0=Math.min(ex0,Math.max(box[0],d[0]));ey0=Math.min(ey0,Math.max(box[1],d[1]));ex1=Math.max(ex1,Math.min(box[2],d[2]));ey1=Math.max(ey1,Math.min(box[3],d[3]));}
      // Clip-and-clear needs no composite mode (destination-out path fills are unreliable in some canvases).
      DangerLayer.trace(L,g.zones,place);
      if(ex1>ex0){L.save();L.clip(g.rule);L.setTransform(1,0,0,1,0,0);L.clearRect(Math.floor((ex0-x0)*k),Math.floor((ey0-y0)*k),Math.ceil((ex1-ex0)*k)+1,Math.ceil((ey1-ey0)*k)+1);L.restore();DangerLayer.trace(L,g.zones,place);}
      L.globalAlpha=g.alpha;L.fillStyle=g.style;L.fill(g.rule);drawn.push(box);this.fills++;this.composited+=g.zones.length;
    }
    L.restore();
    t.save();t.setTransform(1,0,0,1,0,0);t.globalAlpha=1;t.globalCompositeOperation='source-over';t.imageSmoothingEnabled=k<1;
    t.drawImage(surface.canvas,0,0,lw,lh,x0,y0,lw/k,lh/k);t.restore();
  }
}

export class CombatArt {
  constructor(){
    this.previous=new Map();this.effects=[];this.appeared=new Map();this.seed=null;this.lastKills=0;this.lastLevel=1;this.lastHP=0;this.lastShield=0;this.lastShotClock=0;this.started=false;this.defeats=[];this.owner=new WeakSet();this.lastElapsed=0;
    this.recoils=new Map();this.sprays=[];this.shakes=[];this.hurtAt=null;this.shots=[];this.collects=[];this.splats=[];
    this.drops=new Map();this.nextDrops=new Map();this.seen=new WeakSet();this.charlesPhase=null;this.scratch={x:0,y:0};
  }
  _reset(state){
    this.previous.clear();this.appeared.clear();this.effects=[];this.started=false;this.lastKills=state.kills;this.lastLevel=state.level;this.lastHP=state.hp;this.lastShield=state.shield||0;this.lastShotClock=Number(state.shotClock)||0;
    this.recoils.clear();this.sprays=[];this.shakes=[];this.hurtAt=null;this.shots=[];this.collects=[];this.drops.clear();this.nextDrops.clear();this.seen=new WeakSet();this.charlesPhase=state.charles?.phase??null;
  }
  prepare(state,seed,defeats=[],source=state){
    this.defeats=defeats;
    // The raw state is stable through Charles's temporary render copies. Keep
    // only a weak identity so returning to the menu does not retain an old run.
    if(!this.owner.has(source)||source.elapsed<this.lastElapsed||this.seed!==seed||state.kills<this.lastKills){this.owner=new WeakSet([source]);this.seed=seed;this._reset(state);}
    this.lastElapsed=source.elapsed;
    const now=state.elapsed,next=new Map(),live=this.started,hx=state.x||0,hy=(state.y||0)-38;let sprays=0;
    for(const enemy of state.enemies){if(enemy.dead)continue;const prev=this.previous.get(enemy.id);next.set(enemy.id,{hp:enemy.hp,x:enemy.x,y:enemy.y,phase:enemy.phase});
      if(prev&&prev.hp-enemy.hp>.5){
        let dx=enemy.x-hx,dy=enemy.y-(BODY_Y[enemy.type]||30)-hy;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
        this._number(enemy,prev.hp-enemy.hp,now,dx);
        if(this.recoils.size>=FX.recoil.cap)this.recoils.delete(this.recoils.keys().next().value);
        this.recoils.delete(enemy.id);this.recoils.set(enemy.id,{start:now,dx,dy});
        if(sprays++<FX.spark.perFrame){const body=BODY_Y[enemy.type]||30;this.sprays.push({x:enemy.x-dx*Math.min(14,(enemy.r||16)*.6),y:enemy.y-body,dx,dy,start:now,seed:Number(enemy.id)||0,color:enemy.charmed>0?COLORS.heart:'#ffc35c'});}
      }
      if(prev&&live&&prev.phase!==enemy.phase&&enemy.type==='travestia'&&SLAM_PHASES.has(enemy.phase))this._shake(now,FX.slam,enemy,state);
      if(!prev&&live)this.appeared.set(enemy.id,now);
    }
    if(this.sprays.length>FX.spark.cap)this.sprays.splice(0,this.sprays.length-FX.spark.cap);
    const shield=state.shield||0;
    if(state.hp<this.lastHP-.5){this.effects.push({kind:'ouch',x:state.x,y:state.y-88,start:now,life:FX.ouch.life,value:Math.round(this.lastHP-state.hp),color:'#ff7294',side:1});if(live){this.hurtAt=now;this._shake(now,{shake:FX.hurt.shake,shakeLife:FX.hurt.shakeLife});}}
    else if(live&&shield<this.lastShield-.5)this._shake(now,{shake:FX.block.shake,shakeLife:FX.block.shakeLife});
    if(state.level>this.lastLevel)this.effects.push({kind:'level',x:state.x,y:state.y,start:now,life:FX.level.life,color:'#f9d078'});
    // A new shot resets the clock upward: remember the painted muzzle for bloom, smoke and casing.
    const clock=Number(state.shotClock);
    if(live&&Number.isFinite(clock)&&clock>this.lastShotClock+.004&&state.mode!=='gameover'){
      const pose=computeHeroPose(state),a=pose.barrelAim||pose.aim;
      this.shots.push({x:pose.muzzle.x,y:pose.muzzle.y,ax:a.x,ay:a.y,side:pose.side||1,ground:(state.y||0)+6,start:now});if(this.shots.length>FX.casing.cap)this.shots.shift();
    }
    if(Number.isFinite(clock))this.lastShotClock=clock;
    // Explosions, crow rings and boss defeats nudge the camera only when close.
    for(const p of state.pulses||[])if(!this.seen.has(p)){this.seen.add(p);if(live&&p.color==='#f5a16c')this._shake(now,FX.blast,p,state);}
    for(const w of state.shockwaves||[])if(!this.seen.has(w)){this.seen.add(w);if(live)this._shake(now,FX.slam,w,state);}
    for(const d of defeats)if(!this.seen.has(d)){this.seen.add(d);if(live&&BOSS.has(d.actor?.type))this._shake(now,FX.bossDown,d.actor,state);}
    const charles=state.charles?.phase??null;if(live&&charles!==this.charlesPhase&&CHARLES_SLAMS.has(charles))this._shake(now,FX.slam,state.charles,state);this.charlesPhase=charles;
    // Pickups that vanish beside Toma or the companion were collected.
    const drops=this.nextDrops;drops.clear();for(const d of state.drops||[])drops.set(d,d.kind);
    if(live){const girl=state.companion&&state.girl&&!(state.girl.down>0)?state.girl:null,near=FX.collect.near;
      for(const [d,kind]of this.drops)if(!drops.has(d)&&(Math.hypot(d.x-state.x,d.y-state.y)<near||girl&&Math.hypot(d.x-girl.x,d.y-girl.y)<near)){this.collects.push({x:d.x,y:d.y,start:now,color:DROP_COLORS[kind]||'#fff3a6'});if(this.collects.length>FX.collect.cap)this.collects.shift();}}
    this.nextDrops=this.drops;this.drops=drops;
    // Charles completion returns to survival time without replacing the run.
    // Drop future-dated cues, while preserving newly observed lethal damage.
    const alive=e=>now>=e.start&&now-e.start<(e.life??FX.spark.life);
    this.effects=this.effects.filter(alive).slice(-48);for(const [id,start]of this.appeared)if(now<start||now-start>.45)this.appeared.delete(id);
    this.sprays=this.sprays.filter(alive);this.shots=this.shots.filter(e=>now>=e.start&&now-e.start<FX.casing.life);this.collects=this.collects.filter(e=>now>=e.start&&now-e.start<FX.collect.life);
    this.shakes=this.shakes.filter(e=>now>=e.start&&now-e.start<e.life);if(this.hurtAt!==null&&(now<this.hurtAt||now-this.hurtAt>=FX.hurt.life))this.hurtAt=null;
    for(const [id,r]of this.recoils)if(now<r.start||now-r.start>=FX.recoil.life)this.recoils.delete(id);
    this.previous=next;this.lastKills=state.kills;this.lastLevel=state.level;this.lastHP=state.hp;this.lastShield=shield;this.started=true;
  }
  _number(enemy,amount,now,dx){
    // Hits landing on one enemy within a few frames grow one number instead of stacking a column.
    for(let i=this.effects.length-1;i>=0&&i>=this.effects.length-24;i--){const e=this.effects[i];if(e.kind==='hit'&&e.id===enemy.id&&now-e.bump<FX.number.merge&&now>=e.start&&now-e.start<.3){e.raw+=amount;e.value=Math.round(e.raw);e.bump=now;e.life=Math.max(e.life,now-e.start+FX.number.life*.8);return;}}
    this.effects.push({kind:'hit',id:enemy.id,x:enemy.x,y:enemy.y-(HEAD_Y[enemy.type]||47),value:Math.round(amount),raw:amount,start:now,bump:now,life:FX.number.life,side:dx<0?-1:1,color:enemy.charmed>0?COLORS.heart:COLORS.hit});
  }
  _shake(now,spec,source=null,state=null){
    let amp=spec.shake;
    if(source&&state&&spec.reach){const d=Math.hypot((source.x||0)-(state.x||0),(source.y||0)-(state.y||0));amp*=Math.max(0,1-d/spec.reach);}
    if(amp<.75)return;
    this.shakes.push({start:now,amp,life:spec.shakeLife,phase:(this.shakes.length*1.7+now*13)%TAU});if(this.shakes.length>FX.shake.cap)this.shakes.shift();
  }
  alpha(id,elapsed){const t=this.appeared.get(id);return t===undefined?1:Math.max(.2,Math.min(1,(elapsed-t)/.28));}
  /** Presentation offset of one enemy after a hit; never applied to Toma or written to state. */
  recoil(id,now,reduced=false){
    if(reduced)return null;const r=this.recoils.get(id);if(!r)return null;const t=(now-r.start)/FX.recoil.life;if(t<0||t>=1)return null;
    const k=FX.recoil.px*(t<.25?t/.25:(1-t)/.75*(1-t)/.75),x=Math.round(r.dx*k),y=Math.round(r.dy*k*.7);
    if(!x&&!y)return null;this.scratch.x=x;this.scratch.y=y;return this.scratch;
  }
  /** Whole-scene camera offset, a few pixels for about a tenth of a second. */
  shake(now,reduced=false){
    const out=this.scratch;out.x=0;out.y=0;if(reduced)return out;
    let best=null,amp=0;for(const e of this.shakes){const t=(now-e.start)/e.life;if(t<0||t>=1)continue;const a=e.amp*(1-t)*(1-t);if(a>amp){amp=a;best=e;}}
    if(!best)return out;const age=now-best.start;
    out.x=Math.round(Math.sin(age*92+best.phase)*amp);out.y=Math.round(Math.cos(age*71+best.phase*1.3)*amp*.75);return out;
  }
  hurt(now,reduced=false){if(reduced||this.hurtAt===null)return 0;const t=(now-this.hurtAt)/FX.hurt.life;return t<0||t>=1?0:(1-t)*(1-t);}
  muzzle(now){const shot=this.shots[this.shots.length-1];if(!shot)return null;const age=now-shot.start;return age>=0&&age<FX.muzzle.life?{shot,t:age/FX.muzzle.life}:null;}
  /** Bloom, smoke and brass are painted under Toma, so his own pixels stay untouched. */
  drawHeroUnder(ctx,state,reduced){
    if(reduced||state.mode==='gameover')return;this.drawCollects(ctx,state,reduced);const now=state.elapsed,flash=this.muzzle(now);
    if(flash){
      const {shot,t}=flash,x=shot.x+shot.ax*7,y=shot.y+shot.ay*7,glow=this.glow||(this.glow=CombatArt.glowStamp());
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.85*(1-t)*(1-t);
      if(glow){const r=Math.round(13+10*t);ctx.drawImage(glow,Math.round(x-r),Math.round(y-r),r*2,r*2);}
      ctx.restore();
    }
    for(const shot of this.shots){
      const age=now-shot.start;if(age<0)continue;
      if(age<FX.smoke.life&&this.shots.length-this.shots.indexOf(shot)<=FX.smoke.cap){
        const u=age/FX.smoke.life,size=Math.round(2+u*4);ctx.save();ctx.globalAlpha=.38*(1-u);ctx.fillStyle='#d9d0e2';
        for(let n=0;n<2;n++){const d=9+u*(18+n*9),w=(n?-1:1)*Math.sin(age*14+n)*2,x=Math.round(shot.x+shot.ax*d-shot.ay*w),y=Math.round(shot.y+shot.ay*d+shot.ax*w-u*4);ctx.fillRect(x-size,y-(size>>1),size*2,size);ctx.fillRect(x-(size>>1),y-size,size,size*2);}
        ctx.restore();
      }
      // Brass ejects to the painting's open side, arcs, bounces once and fades.
      // Thrown up and back from the ejection port so it clears his silhouette.
      const u=age/FX.casing.life,back=Math.abs(shot.ax)>.25?-Math.sign(shot.ax):-shot.side,px=shot.x-shot.ax*14,py=shot.y-shot.ay*14,land=.42,flight=Math.min(age,land);
      const x=px+back*(110*flight+(age>land?40*Math.min(.12,age-land):0));let y=py-150*flight+600*flight*flight;
      if(age>land){const b=age-land;y=shot.ground-Math.max(0,40*b-330*b*b);}y=Math.min(y,shot.ground);ctx.save();ctx.globalAlpha=u>.7?(1-u)/.3:1;ctx.fillStyle='#4a3218';ctx.fillRect(Math.round(x)-1,Math.round(y),4,2);ctx.fillStyle=Math.floor(age*30)%2?'#f4cf6a':'#c99033';ctx.fillRect(Math.round(x),Math.round(y),2,1);ctx.restore();
    }
  }
  /** Collect sparkle plus a coloured pulse at the collector's feet, under Toma's painting. */
  drawCollects(ctx,state,reduced){
    if(reduced)return;const now=state.elapsed;
    for(const c of this.collects){
      const age=now-c.start;if(age<0||age>=FX.collect.life)continue;const t=age/FX.collect.life,r=Math.round(3+easeOut(t)*9);
      ctx.save();ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle=c.color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(Math.round(state.x),Math.round(state.y+9),10+easeOut(t)*16,(10+easeOut(t)*16)*.42,0,0,TAU);ctx.stroke();
      ctx.translate(Math.round(c.x),Math.round(c.y));ctx.globalAlpha=1-t;ctx.fillStyle=c.color;
      ctx.fillRect(-r,-1,r*2,2);ctx.fillRect(-1,-r,2,r*2);ctx.fillStyle='#ffffff';ctx.fillRect(-2,-2,4,4);
      const d=Math.round(r*.75);ctx.fillStyle=c.color;for(const [sx,sy]of [[1,1],[1,-1],[-1,1],[-1,-1]])ctx.fillRect(sx*d-1,sy*d-1,2,2);
      ctx.restore();
    }
  }
  static glowStamp(){
    const c=makeCanvas(32,32);if(!c)return null;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,1,16,16,16);
    r.addColorStop(0,'rgba(255,248,214,1)');r.addColorStop(.3,'rgba(255,196,96,.75)');r.addColorStop(1,'rgba(255,140,40,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return c;
  }
  /** Ground-level cues: the level-up ring sits at Toma's feet, below every actor. */
  drawUnder(ctx,state,reduced){
    if(reduced)return;const now=state.elapsed;
    for(const e of this.effects)if(e.kind==='level'){
      const age=now-e.start;if(age<0||age>=e.life)continue;
      for(let n=0;n<2;n++){const u=(age-n*.12)/.55;if(u<0||u>=1)continue;const k=easeOut(u),r=12+k*66;
        ctx.save();ctx.globalAlpha=(1-u)*.9;ctx.strokeStyle=n?'#fff3a6':'#ffd634';ctx.lineWidth=n?2:3;ctx.beginPath();ctx.ellipse(Math.round(e.x),Math.round(e.y+9),r,r*.42,0,0,TAU);ctx.stroke();ctx.restore();}
    }
  }
  drawDefeats(ctx,state,reduced){
    if(reduced)return;
    for(const e of this.defeats){
      const age=state.elapsed-e.start;if(age<0||age>=FX.burst.life)continue;
      const color=burstColor(e.actor.type),big=BIG.has(e.actor.type)||BOSS.has(e.actor.type),radius=Math.max(16,Math.min(28,e.actor.r||17)),t=age/FX.burst.life;
      ctx.save();ctx.translate(Math.round(e.actor.x),Math.round(e.actor.y-(BODY_Y[e.actor.type]||28)));
      if(age<.05){
        // One bright pop frame, then the pieces carry the motion.
        ctx.globalAlpha=1-age/.1;ctx.fillStyle='#fff4d7';const arm=big?16:12;
        ctx.fillRect(-2,-arm,4,arm*2);ctx.fillRect(-arm,-2,arm*2,4);ctx.fillRect(-5,-5,10,10);
      }
      if(age<.2){
        // A thin ring of rim-coloured pixels marks where the enemy stood.
        const u=age/.2,r=8+easeOut(u)*(radius+6);ctx.globalAlpha=(1-u)*.85;ctx.fillStyle=u<.35?'#fff4d7':color;
        for(let i=0;i<FX.burst.ring;i++){const a=i*TAU/FX.burst.ring;ctx.fillRect(Math.round(Math.cos(a)*r)-1,Math.round(Math.sin(a)*r*.62)-1,2,2);}
      }
      // Pieces leave once the silhouette pop has been seen, then arc and fall.
      const fly=Math.max(0,age-.035)/(FX.burst.life-.035);ctx.globalAlpha=Math.min(1,(1-fly)*2.2);
      if(age>=.035)for(let i=0;i<FX.burst.count;i++){
        // Deterministic pieces: no allocations, blur or random draws.
        const a=i*TAU/FX.burst.count+(e.actor.id%7)*.23,v=(i%3===0?1.15:i%3===1?.85:1)*(radius+12),k=easeOut(fly);
        const x=Math.round(Math.cos(a)*(8+k*v)),y=Math.round(Math.sin(a)*(8+k*v)*.72-k*10+fly*fly*18),size=i%3===0?4:3;
        if(size===4){ctx.fillStyle='#3a2446';ctx.fillRect(x,y+size,size,1);}
        ctx.fillStyle=color;ctx.fillRect(x,y,size,size);
        ctx.fillStyle='#fff1df';ctx.fillRect(x,y,size-2,1);
      }
      ctx.restore();
    }
  }
  draw(ctx,state,reduced){
    const now=state.elapsed;
    this.drawDefeats(ctx,state,reduced);
    if(!reduced)for(const p of this.sprays){
      const age=now-p.start;if(age<0||age>=FX.spark.life)continue;const t=age/FX.spark.life;
      ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
      if(age<.05){
        // Impact star is high-contrast so distant hits still read in a crowd.
        ctx.globalAlpha=1-age/.08;ctx.fillStyle='#ff9a3c';ctx.fillRect(-7,-2,14,4);ctx.fillRect(-2,-7,4,14);ctx.fillStyle='#fff8dc';ctx.fillRect(-6,-1,12,2);ctx.fillRect(-1,-6,2,12);ctx.fillStyle='#ffffff';ctx.fillRect(-2,-2,4,4);
      }
      ctx.globalAlpha=1-t;const base=Math.atan2(p.dy,p.dx);
      for(let i=0;i<FX.spark.count;i++){
        const a=base+((i*0.37+p.seed*.13)%1-.5)*1.5,v=70+((p.seed*7+i*29)%5)*12,d=v*age*(1-t*.5),x=Math.round(Math.cos(a)*d),y=Math.round(Math.sin(a)*d+t*t*6);
        ctx.fillStyle=p.color;ctx.fillRect(x-Math.round(Math.cos(a)*3),y-Math.round(Math.sin(a)*3),2,2);ctx.fillStyle='#fff6d0';ctx.fillRect(x,y,2,2);
      }
      ctx.restore();
    }
    for(const e of this.effects){
      const age=now-e.start,t=Math.max(0,age/e.life);if(age<0||t>=1)continue;
      if(e.kind==='hit'||e.kind==='ouch'){
        const pop=Math.min(1,Math.max(0,now-(e.bump??e.start))/FX.number.pop),scale=reduced?1:1+.7*(1-pop)*(1-pop)*(1-pop),big=e.value>=40;
        const x=reduced?0:e.side*14*t,y=-(31*t-9*t*t);
        ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*1.6);ctx.translate(Math.round(e.x+x),Math.round(e.y+y));if(scale!==1)ctx.scale(scale,scale);
        const text=e.kind==='ouch'?`−${e.value}`:String(e.value);
        ctx.font=e.kind==='ouch'?'bold 13px monospace':big?'bold 13px monospace':e.value>=20?'bold 11px monospace':'bold 10px monospace';ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='#121024';ctx.strokeText(text,0,0);ctx.fillStyle=big&&e.kind==='hit'&&e.color===COLORS.hit?'#ffc061':e.color;ctx.fillText(text,0,0);
        ctx.restore();
      }else if(e.kind==='level'&&!reduced){
        // Sparks rise in an oval outside Toma's silhouette, never over his painting.
        ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y-32));const k=easeOut(Math.min(1,t*1.4));ctx.globalAlpha=Math.min(1,(1-t)*1.8);
        for(let i=0;i<16;i++){const a=i*TAU/16+t*.6,rx=50+k*26,ry=56+k*20,x=Math.round(Math.cos(a)*rx),y=Math.round(Math.sin(a)*ry-t*14);ctx.fillStyle=i%2?'#fff3a6':e.color;ctx.fillRect(x-1,y-3,2,7);ctx.fillRect(x-3,y-1,7,2);}
        ctx.restore();
      }
    }
    // Footfall dust follows movement; its fixed small footprint preserves gas readability.
    if(!reduced&&Math.hypot(state.moveX,state.moveY)>.1){ctx.save();ctx.globalAlpha=.2;ctx.fillStyle=COLORS.dust;for(let i=0;i<3;i++){const phase=(now*5+i*.31)%1;ctx.fillRect(Math.round(state.x-state.moveX*phase*16-5+i*4),Math.round(state.y+11-state.moveY*phase*13),2+phase*4,2);}ctx.restore();}
  }
}
