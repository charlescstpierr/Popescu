import {travestiaFrame} from './travestia.js';
// Raster actor atlases share one light direction and one registered foot baseline.
const FILES={travestia_dash:'assets/travestia-dash.png',travestia:'assets/travestia-poses.png',hero:'assets/toma-walk-v2.png',girl:'assets/girl-walk-v2.png',enemy:'assets/gorilla-walk-v2.png',orangutan:'assets/orangutan-walk-v3.png',rival_rooster:'assets/rival_rooster-walk-v3.png',rival_goat:'assets/rival_goat-walk-v3.png'};
const ENEMY_SIZE={normal:76,sprinter:66,gas:79,tank:96,jealous:76,explosive:80,matriarch:116,orangutan:83,rival_rooster:78,rival_goat:88};
const sourceKind=(kind,type)=>kind==='enemy'&&['travestia','orangutan','rival_rooster','rival_goat'].includes(type)?type:kind;
function canvas(w,h){if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}return null;}
function load(src){return new Promise(resolve=>{if(typeof Image==='undefined'){resolve(null);return;}const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src;});}
function box(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function polygon(c,color,points){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
export class ActorArt {
  constructor({loadImage=load}={}){this.images={};this.cache=new Map();this.ready=Promise.all(Object.entries(FILES).map(async([key,path])=>{try{this.images[key]=await loadImage(path);}catch{this.images[key]=null;}}));}
  available(kind){return Boolean(this.images[kind]);}
  availableFor(actor,kind){return Boolean(this.images[sourceKind(kind,actor.type)]);}
  frame(kind,index,back,type='normal',flash=false){
    const image=this.images[sourceKind(kind,type)];if(!image)return null;
    const key=[kind,index,back,type,flash].join(':');if(this.cache.has(key))return this.cache.get(key);
    const frame=canvas(128,128);if(!frame)return null;const c=frame.getContext('2d');c.imageSmoothingEnabled=false;
    c.drawImage(image,(index%4)*128,back?128:0,128,128,0,0,128,128);
    if(kind==='enemy'){
      if(type==='tank'){
        for(const [x,y] of [[22,67],[104,67]]){polygon(c,'#14111f',[[x-13,y],[x-8,y-10],[x+7,y-10],[x+13,y],[x+9,y+10],[x-9,y+10]]);polygon(c,'#997633',[[x-11,y],[x-6,y-8],[x+5,y-8],[x+11,y],[x+7,y+7],[x-7,y+7]]);box(c,'#f5cf79',x-7,y-7,11,2);box(c,'#4b3540',x-4,y-2,10,7);}
      } else if(type==='sprinter'){
        box(c,'#ff69d4',14,103,20,4);box(c,'#ff69d4',91,103,20,4);box(c,'#ffe2f6',16,103,8,1);
      } else if(type==='gas'){
        box(c,'#b8de3a',40,88,6,4);box(c,'#b8de3a',93,79,4,8);box(c,'#697e29',43,93,3,5);
      } else if(type==='explosive'){
        box(c,'#171426',36,92,58,12);for(let x=39;x<92;x+=9){box(c,'#511e36',x-1,88,8,19);box(c,'#d33b54',x,89,6,16);box(c,'#ff8a6e',x,89,2,13);box(c,'#edcda0',x+1,87,4,2);}box(c,'#ffc76b',94,84,2,10);box(c,'#fff3ad',95,81,4,3);
      } else if(type==='matriarch'){
        polygon(c,'#171121',[[58,26],[54,8],[67,15],[78,0],[88,15],[104,7],[99,27]]);polygon(c,'#efbd48',[[61,24],[58,12],[68,19],[78,4],[87,19],[100,12],[97,24]]);box(c,'#fff3b5',62,22,34,2);box(c,'#f860b7',75,16,6,7);box(c,'#f4b9df',76,17,2,2);
      } else if(type==='jealous'&&!back){polygon(c,'#ff5ba0',[[61,80],[65,76],[69,76],[72,80],[76,76],[81,76],[84,80],[83,85],[72,97],[61,86]]);polygon(c,'#2d193b',[[73,78],[70,84],[75,86],[70,94],[74,85],[69,83]]);}
    }
    if(flash){c.globalCompositeOperation='source-in';c.fillStyle='#fff4d7';c.fillRect(0,0,128,128);c.globalCompositeOperation='source-over';}
    this.cache.set(key,frame);if(this.cache.size>144)this.cache.delete(this.cache.keys().next().value);return frame;
  }
  drawTravestia(ctx,e,time){
    if(e.phase?.startsWith('tail_dash')&&this.images.travestia_dash){const image=this.images.travestia_dash,w=image.width/4,h=image.height/2,index=e.tailDashDir;ctx.drawImage(image,index%4*w,Math.floor(index/4)*h,w,h,Math.round(e.x)-100,Math.round(e.y)+11-174,200,200);return true;}
    const image=this.images.travestia;if(!image)return false;
    const index=travestiaFrame(e,time),w=image.width/4,h=image.height/3,size=144;
    ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y)+11);if((e.tailTime>0?e.tailFaceX:e.faceX)<0)ctx.scale(-1,1);
    ctx.drawImage(image,index%4*w,Math.floor(index/4)*h,w,h,-72,-132,size,size);
    ctx.restore();return true;
  }
  draw(ctx,actor,kind,phase,state,time,reduced=false){
    if(actor.type==='travestia')return this.drawTravestia(ctx,actor,time);
    if(!this.availableFor(actor,kind))return false;const enemy=kind==='enemy',girl=kind==='girl',type=actor.type||'normal';
    const gas=enemy&&actor.gasPose>0;const moving=Math.hypot(state.moveX||0,state.moveY||0)>.05;
    const fx=kind==='hero'&&moving?state.moveX:(actor.faceX??state.faceX??1);const fy=kind==='hero'&&moving?state.moveY:(actor.faceY??state.faceY??0);
    const attacking=enemy&&(actor.windup>0||actor.charge>0||actor.crow>0);
    const back=gas||fy<-.45,index=gas?Math.max(0,Math.min(3,Math.floor((.9-actor.gasPose)*4/.9))):attacking?1:phase%4;
    const sprite=this.frame(kind,index,back,type);if(!sprite)return false;
    const size=enemy?ENEMY_SIZE[type]||76:girl?76:80;const scale=size/128,x=Math.round(actor.x),y=Math.round(actor.y)+11;
    ctx.save();ctx.translate(x,y);if(type==='orangutan'&&actor.windup>0&&!reduced)ctx.translate(Math.sin(time*35)*1.5,-2);if(fx<-.1&&!gas)ctx.scale(-1,1);
    // Keep the feet registered while the goat lowers his horns into a headbutt.
    if(type==='rival_goat'&&attacking){const charge=actor.charge>0;ctx.transform(1,0,charge?-.34:-.19,charge?.78:.88,0,0);}
    if(type==='rival_rooster'&&attacking){const crow=actor.crow>0;ctx.scale(crow?1.06:1.03,crow?1.08:1.025);if(crow&&!reduced)ctx.translate(Math.sin(time*32),0);}
    if(actor.down||(kind==='hero'&&state.mode==='gameover')){ctx.rotate(-1.35);ctx.globalAlpha=.6;ctx.drawImage(sprite,-size*.5,-size*.5,size,size);}
    else {
      if(kind==='hero'&&state.invulnerable>0&&Math.floor(time*16)%2)ctx.globalAlpha=.55;
      // Atlas padding registers every frame at the same virtual ground point.
      ctx.drawImage(sprite,-size/2,-121*scale,size,size);
      if(enemy&&actor.hitFlash>0){ctx.globalAlpha=Math.min(.85,actor.hitFlash*5);ctx.drawImage(this.frame(kind,index,back,type,true),-size/2,-121*scale,size,size);}
    }
    ctx.restore();
    // Variant cues remain legible even in the middle of a dense horde.
    if(enemy&&type==='sprinter'&&!reduced){ctx.save();ctx.globalAlpha=.4;for(let i=0;i<3;i++)box(ctx,'#de8afb',x-(fx>0?36:-27)-i*4,y-21+i*5,11,1);ctx.restore();}
    return true;
  }
}
