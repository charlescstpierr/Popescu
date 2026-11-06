import {RIMS,enemyAccent} from './combat-art.js';
import {drawGorillaAccessories} from './gorilla-accessories.js';
import {enemyAttackPose} from './enemy-attack-pose.js';
import {EGO_BEASTS} from './ego-beasts.js';
import {drawEgoBody,EGO_ART} from './ego-art.js';
import {ANIMALS,ANIMAL_FRAMES} from './animals.js';
import {travestiaPose} from './travestia-pose.js';
import {PELICAN_ART,pelicanFrame} from './pelican-art.js';
// Raster actor atlases share one light direction and one registered foot baseline.
const FILES={orangutan_attack:'assets/orangutan-slap-v1.png',rival_goat_attack:'assets/rival_goat-attack-v1.png',rival_rooster_attack:'assets/rival_rooster-attack-v1.png',ego:'assets/ego-beasts-v2.png',pelican:'assets/pelican-poses.png',animals:'assets/animals-approved.png',travestia_dash:'assets/travestia-dash.png',travestia:'assets/travestia-poses.png',hero:'assets/toma-walk-v2.png',girl:'assets/girl-walk-v2.png',enemy:'assets/gorilla-walk-v2.png',orangutan:'assets/orangutan-walk-v3.png',rival_rooster:'assets/rival_rooster-walk-v3.png',rival_goat:'assets/rival_goat-walk-v3.png'};
const ENEMY_SIZE={normal:76,sprinter:66,gas:79,tank:96,jealous:76,explosive:80,matriarch:116,orangutan:83,rival_rooster:78,rival_goat:88};
const sourceKind=(kind,type)=>EGO_BEASTS[type]?'ego':ANIMALS[type]?'animals':kind==='enemy'&&['pelican','travestia','orangutan','rival_rooster','rival_goat'].includes(type)?type:kind;
function canvas(w,h){if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}return null;}
function load(src,registerCancel){return new Promise(resolve=>{
  if(typeof Image==='undefined'){resolve(null);return;}
  const im=new Image();let done=false;
  const finish=image=>{if(done)return;done=true;im.onload=null;im.onerror=null;resolve(image);};
  im.onload=()=>finish(im);im.onerror=()=>finish(null);
  registerCancel?.(()=>{
    if(done)return;finish(null);
    // Detach handlers first; DOM images can abandon their source without a new URL.
    try{if(typeof im.removeAttribute==='function')im.removeAttribute('src');else im.src='';}catch{}
  });
  try{im.src=src;}catch{finish(null);}
});}
function usableAnimals(image){return Boolean(image&&image.width>0&&image.height>0&&(image.naturalWidth===undefined||image.naturalWidth>0)&&(image.naturalHeight===undefined||image.naturalHeight>0));}
function usableEgo(image){return usableAnimals(image)&&image.width%EGO_ART.columns===0&&image.height%EGO_ART.rows===0&&image.width/EGO_ART.columns===image.height/EGO_ART.rows;}
function box(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function polygon(c,color,points){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
export class ActorArt {
  static snap(ctx,x,y){
    const t=ctx.getTransform?.();
    if(t&&Number.isFinite(t.a)&&t.a!==0&&t.d!==0&&t.b===0&&t.c===0)return {x:(Math.round(x*t.a+t.e)-t.e)/t.a,y:(Math.round(y*t.d+t.f)-t.f)/t.d};
    return {x:Math.round(x),y:Math.round(y)};
  }
  static outline(image,sx,sy,sw,sh,w,h,color,mirror=false){
    const mask=canvas(w+2,h+2),rim=canvas(w+2,h+2);if(!mask||!rim)return null;
    const m=mask.getContext('2d'),c=rim.getContext('2d');m.imageSmoothingEnabled=false;c.imageSmoothingEnabled=false;
    m.save();if(mirror){m.translate(w+2,0);m.scale(-1,1);}m.drawImage(image,sx,sy,sw,sh,1,1,w,h);m.restore();
    for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])c.drawImage(mask,dx,dy);
    c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,w+2,h+2);
    c.globalCompositeOperation='destination-out';c.drawImage(mask,0,0);return rim;
  }
  constructor({loadImage=load,animalsTimeoutMs=10000,timers=globalThis}={}){
    this.images={};this.cache=new Map();this.outlines=new Map();this.accessories=new Map();this._loadImage=loadImage;this._animalsTimeoutMs=animalsTimeoutMs;this._animalsTimers=timers;this._animalsAttempt=null;
    this.ready=Promise.all(Object.entries(FILES).map(async([key,path])=>{if(key==='ego'){await this.ensureEgoReady();return;}if(key==='animals'){await this.ensureAnimalsReady();return;}try{this.images[key]=await loadImage(path);}catch{this.images[key]=null;}}));
  }
  ensureAnimalsReady(){
    if(this.available('animals'))return Promise.resolve({ok:true});
    if(this._animalsAttempt)return this._animalsAttempt.promise;
    let resolve;const promise=new Promise(done=>{resolve=done;}),attempt={promise};this._animalsAttempt=attempt;
    let settled=false,cancelLoad=null;
    const finish=(image,reason='failed')=>{
      // A timed-out image can still finish later; it must not replace a retry.
      if(settled)return;settled=true;this._animalsTimers.clearTimeout(timer);
      if(reason==='timeout'){try{cancelLoad?.();}catch{}}cancelLoad=null;
      const ok=usableAnimals(image);this.images.animals=ok?image:null;this._animalsAttempt=null;
      resolve(ok?{ok:true}:{ok:false,reason});
    };
    const timer=this._animalsTimers.setTimeout(()=>finish(null,'timeout'),this._animalsTimeoutMs);
    // Existing one-argument loaders remain valid; cancellation is optional.
    try{Promise.resolve(this._loadImage(FILES.animals,cancel=>{if(!settled&&typeof cancel==='function')cancelLoad=cancel;})).then(image=>finish(image),()=>finish(null));}catch{finish(null);}
    return promise;
  }
  ensureEgoReady(){
    if(this.available('ego'))return Promise.resolve({ok:true});
    if(this._egoAttempt)return this._egoAttempt.promise;
    let resolve;const promise=new Promise(done=>{resolve=done;}),attempt={promise};this._egoAttempt=attempt;
    let settled=false,cancelLoad=null;
    const finish=(image,reason='failed')=>{
      // A timed-out image can still finish later; it must not replace a retry.
      if(settled)return;settled=true;this._animalsTimers.clearTimeout(timer);
      if(reason==='timeout'){try{cancelLoad?.();}catch{}}cancelLoad=null;
      const ok=usableEgo(image);this.images.ego=ok?image:null;this._egoAttempt=null;
      resolve(ok?{ok:true}:{ok:false,reason});
    };
    const timer=this._animalsTimers.setTimeout(()=>finish(null,'timeout'),this._animalsTimeoutMs);
    // Existing one-argument loaders remain valid; cancellation is optional.
    try{Promise.resolve(this._loadImage(FILES.ego,cancel=>{if(!settled&&typeof cancel==='function')cancelLoad=cancel;})).then(image=>finish(image),()=>finish(null));}catch{finish(null);}
    return promise;
  }
  available(kind){return kind==='ego'?usableEgo(this.images.ego):kind==='animals'?usableAnimals(this.images.animals):Boolean(this.images[kind]);}
  availableFor(actor,kind){return this.available(sourceKind(kind,actor.type));}
  frame(kind,index,back,type='normal',flash=false){
    const image=this.images[sourceKind(kind,type)];if(!image)return null;
    const key=[kind,index,back,type,flash].join(':');if(this.cache.has(key))return this.cache.get(key);
    const frame=canvas(128,128);if(!frame)return null;const c=frame.getContext('2d');c.imageSmoothingEnabled=false;
    c.drawImage(image,(index%4)*128,back?128:0,128,128,0,0,128,128);
    if(kind==='enemy'){
      const bare=canvas(128,128),decoration=canvas(128,128),d=decoration?.getContext('2d');
      if(bare&&d&&!flash){bare.getContext('2d').drawImage(frame,0,0);this._decorate(d,type,index,back);this.accessories.set([index,back,type].join(':'),{bare,decoration});if(this.accessories.size>96)this.accessories.delete(this.accessories.keys().next().value);}
      this._decorate(c,type,index,back);
    }
    if(flash){c.globalCompositeOperation='source-in';c.fillStyle='#fff4d7';c.fillRect(0,0,128,128);c.globalCompositeOperation='source-over';}
    this.cache.set(key,frame);if(this.cache.size>144)this.cache.delete(this.cache.keys().next().value);return frame;
  }
  _decorate(c,type,index,back){
      drawGorillaAccessories(c,type,index,back);
      if(type==='explosive'){
        box(c,'#171426',36,92,58,12);for(let x=39;x<92;x+=9){box(c,'#511e36',x-1,88,8,19);box(c,'#d33b54',x,89,6,16);box(c,'#ff8a6e',x,89,2,13);box(c,'#edcda0',x+1,87,4,2);}box(c,'#ffc76b',94,84,2,10);box(c,'#fff3ad',95,81,4,3);
      } else if(type==='matriarch'){
        polygon(c,'#171121',[[58,26],[54,8],[67,15],[78,0],[88,15],[104,7],[99,27]]);polygon(c,'#efbd48',[[61,24],[58,12],[68,19],[78,4],[87,19],[100,12],[97,24]]);box(c,'#fff3b5',62,22,34,2);box(c,'#f860b7',75,16,6,7);box(c,'#f4b9df',76,17,2,2);
      }
  }
  _rim(ctx,image,sx,sy,sw,sh,x,y,w,h,type,key,accent=1){
    let rim=this.outlines.get(key);
    if(!rim){rim=ActorArt.outline(image,sx,sy,sw,sh,w,h,RIMS[type]||'#c5bec5');if(!rim)return;this.outlines.set(key,rim);if(this.outlines.size>96)this.outlines.delete(this.outlines.keys().next().value);}
    this.outlines.delete(key);this.outlines.set(key,rim);
    const dest=ActorArt.snap(ctx,x-1,y-1);ctx.save();ctx.globalAlpha*=.56*accent;ctx.drawImage(rim,dest.x,dest.y);ctx.restore();
  }
  drawEnemyAttack(ctx,actor,reduced=false,accent=1){
    const pose=enemyAttackPose(actor);if(!pose)return false;
    const image=this.images[pose.image];if(!image)return false;
    const {cellWidth:w,anchorX,size,index,back,flip}=pose,scale=size/128;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(actor.x,actor.y+11);if(flip)ctx.scale(-1,1);
    const dest=ActorArt.snap(ctx,-anchorX*scale,-121*scale),width=Math.round(w*scale);
    if(!reduced)this._rim(ctx,image,index*w,back?128:0,w,128,dest.x,dest.y,width,size,actor.type,['attack',pose.image,index,back].join(':'),accent);
    ctx.drawImage(image,index*w,back?128:0,w,128,dest.x,dest.y,w*scale,size);
    if(actor.hitFlash>0){
      const key=['attack',pose.image,index,back].join(':');let flash=this.cache.get(key);
      if(!flash){flash=canvas(w,128);if(flash){const c=flash.getContext('2d');c.drawImage(image,index*w,back?128:0,w,128,0,0,w,128);c.globalCompositeOperation='source-in';c.fillStyle='#fff4d7';c.fillRect(0,0,w,128);this.cache.set(key,flash);if(this.cache.size>144)this.cache.delete(this.cache.keys().next().value);}}
      if(flash){ctx.globalAlpha*=Math.min(.85,actor.hitFlash*5);ctx.drawImage(flash,dest.x,dest.y,w*scale,size);}
    }
    ctx.restore();return true;
  }
  drawPelican(ctx,e,time){
    const image=this.images.pelican;if(!image)return false;
    const index=pelicanFrame(e),w=image.width/PELICAN_ART.columns,h=image.height/PELICAN_ART.rows,size=PELICAN_ART.size;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(e.x,e.y+11);
    if((e.peliTime>0?e.peliDX:e.faceX)<0)ctx.scale(-1,1);
    const dest=ActorArt.snap(ctx,-size/2,-PELICAN_ART.footY);
    ctx.drawImage(image,index%4*w,Math.floor(index/4)*h,w,h,dest.x,dest.y,size,size);
    ctx.restore();return true;
  }
  drawTravestia(ctx,e,time){
    const pose=travestiaPose(e,time);
    if(pose.directional&&this.images.travestia_dash){const image=this.images.travestia_dash,w=image.width/4,h=image.height/2,index=pose.index,dest=ActorArt.snap(ctx,e.x-100,e.y+11-174);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,index%4*w,Math.floor(index/4)*h,w,h,dest.x,dest.y,200,200);ctx.restore();return true;}
    const image=this.images.travestia;if(!image)return false;
    const index=pose.directional?4:pose.index,w=image.width/4,h=image.height/3,size=144;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(e.x,e.y+11);if(pose.flip)ctx.scale(-1,1);
    const dest=ActorArt.snap(ctx,-72,-132);ctx.drawImage(image,index%4*w,Math.floor(index/4)*h,w,h,dest.x,dest.y,size,size);
    ctx.restore();return true;
  }
  draw(ctx,actor,kind,phase,state,time,reduced=false){
    if(EGO_BEASTS[actor.type])return drawEgoBody(ctx,actor,this.images.ego,this.cache,phase,reduced);
    if(ANIMALS[actor.type]){const im=this.images.animals;if(!this.available('animals'))return false;const row=Object.keys(ANIMALS).indexOf(actor.type),cell=im.width/4,frame=ANIMAL_FRAMES[actor.type],size=frame.size,index=actor.phase==='animal_warning'?2:actor.phase==='animal_active'?3:phase%2;ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(actor.x,actor.y+frame.anchorY);if(actor.faceX<0)ctx.scale(-1,1);const dest=ActorArt.snap(ctx,frame.left,frame.top);ctx.drawImage(im,index*cell,row*cell,cell,cell,dest.x,dest.y,size,size);ctx.restore();return true;}
    if(actor.type==='pelican')return this.drawPelican(ctx,actor,time);
    if(actor.type==='travestia')return this.drawTravestia(ctx,actor,time);
    if(kind==='enemy'&&this.drawEnemyAttack(ctx,actor,reduced,enemyAccent(actor,state)))return true;
    if(!this.availableFor(actor,kind))return false;const enemy=kind==='enemy',girl=kind==='girl',type=actor.type||'normal';
    const gas=enemy&&actor.gasPose>0;const moving=Math.hypot(state.moveX||0,state.moveY||0)>.05;
    const fx=kind==='hero'&&moving?state.moveX:(actor.faceX??state.faceX??1);const fy=kind==='hero'&&moving?state.moveY:(actor.faceY??state.faceY??0);
    const attacking=enemy&&(actor.windup>0||actor.swipe>0||actor.charge>0||actor.crow>0);
    const back=gas||fy<-.45,index=gas?Math.max(0,Math.min(3,Math.floor((.9-actor.gasPose)*4/.9))):attacking?1:phase%4;
    const sprite=this.frame(kind,index,back,type);if(!sprite)return false;
    const accent=enemy?enemyAccent(actor,state):1;
    const size=enemy?ENEMY_SIZE[type]||76:girl?76:80;const scale=size/128,x=actor.x,y=actor.y+11;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(x,y);if(fx<-.1&&!gas)ctx.scale(-1,1);
    if(actor.down||(kind==='hero'&&state.mode==='gameover')){ctx.rotate(-1.35);ctx.globalAlpha=.6;ctx.drawImage(sprite,-size*.5,-size*.5,size,size);}
    else {
      if(kind==='hero'&&state.invulnerable>0&&Math.floor(time*16)%2)ctx.globalAlpha=.55;
      // Atlas padding registers every frame at the same virtual ground point.
      const dest=ActorArt.snap(ctx,-size/2,-121*scale);
      if(enemy&&!reduced)this._rim(ctx,sprite,0,0,128,128,dest.x,dest.y,size,size,type,[kind,index,back,type].join(':'),accent);
      const layers=enemy&&accent<1?this.accessories.get([index,back,type].join(':')):null;
      ctx.drawImage(layers?.bare||sprite,dest.x,dest.y,size,size);
      if(layers){ctx.save();ctx.globalAlpha*=accent;ctx.drawImage(layers.decoration,dest.x,dest.y,size,size);ctx.restore();}
      if(enemy&&actor.hitFlash>0){ctx.globalAlpha*=Math.min(.85,actor.hitFlash*5);ctx.drawImage(this.frame(kind,index,back,type,true),dest.x,dest.y,size,size);}
    }
    ctx.restore();
    // Variant cues remain legible even in the middle of a dense horde.
    if(enemy&&type==='sprinter'&&!reduced){ctx.save();ctx.globalAlpha*=.4*accent;for(let i=0;i<3;i++)box(ctx,'#de8afb',x-(fx>0?36:-27)-i*4,y-21+i*5,11,1);ctx.restore();}
    return true;
  }
}
