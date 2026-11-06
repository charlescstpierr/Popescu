import {computeHeroPose} from './hero-pose.js';
import {HERO_FRAMES} from './hero-frames.js';
import {ActorArt} from './actor-art.js';

const ASSET=new URL('./assets/toma-whole-v9.png',import.meta.url).href;
function load(src){return new Promise(resolve=>{if(typeof Image==='undefined'){resolve(null);return;}const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=src.startsWith('file:')?decodeURIComponent(new URL(src).pathname):src;});}
const pt=(x,y)=>({x,y});
function line(c,color,a,b,width=1){
  let x=Math.round(a.x),y=Math.round(a.y),tx=Math.round(b.x),ty=Math.round(b.y),dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1,e=dx-dy;c.fillStyle=color;
  for(let i=0;i<100;i++){c.fillRect(x-Math.floor(width/2),y-Math.floor(width/2),width,width);if(x===tx&&y===ty)break;const t=e*2;if(t>-dy){e-=dy;x+=sx;}if(t<dx){e+=dx;y+=sy;}}
}
function polygon(c,color,points){
  c.fillStyle=color;c.beginPath();c.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))c.lineTo(p.x,p.y);c.closePath();c.fill();
}

/** Each animation frame is one complete painting: head to boots and both hands. */
export class HeroArt {
  constructor({loadImage=load}={}){
    this.image=null;this.error=null;this.outlines=new Map();this.visibility=new Map();
    this.ready=Promise.resolve().then(()=>loadImage(ASSET)).then(image=>{this.image=image||null;return Boolean(image);}).catch(error=>{this.error=error;return false;});
  }
  _wholeFrame(c,pose,reduced){
    const art=pose.art,f=art.frame,t=art.transform,anchor=art.anchor||HERO_FRAMES.anchor;
    const left=art.mirror?anchor[0]-f.w:-anchor[0],dest=ActorArt.snap(c,art.ground.x+left,art.ground.y-anchor[1]);
    c.save();c.translate(dest.x-left,dest.y+anchor[1]);
    if(!reduced){
      const key=`${f.x}:${f.y}:${Boolean(art.mirror)}`;let rim=this.outlines.get(key);
      if(!rim){rim=ActorArt.outline(this.image,f.x,f.y,f.w,f.h,f.w,f.h,'#deb981',art.mirror);if(rim){this.outlines.set(key,rim);if(this.outlines.size>48)this.outlines.delete(this.outlines.keys().next().value);}}
      if(rim){this.outlines.delete(key);this.outlines.set(key,rim);const edge=ActorArt.snap(c,left-1,-anchor[1]-1);c.save();c.globalAlpha*=.4;c.drawImage(rim,edge.x,edge.y);c.restore();}
    }
    c.transform(t.a,t.b,t.c,t.d,0,0);if(art.mirror)c.scale(-1,1);
    c.drawImage(this.image,f.x,f.y,f.w,f.h,-anchor[0],-anchor[1],f.w,f.h);c.restore();
  }
  visibilityFrame(pose){
    if(!this.image)return null;
    const art=pose.art,f=art.frame,key=`${f.x}:${f.y}:${Boolean(art.mirror)}`;
    if(this.visibility.has(key))return this.visibility.get(key);
    const mask=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(f.w,f.h):typeof document!=='undefined'?document.createElement('canvas'):null;
    if(!mask)return null;mask.width=f.w;mask.height=f.h;
    const c=mask.getContext('2d');c.save();if(art.mirror){c.translate(f.w,0);c.scale(-1,1);}c.drawImage(this.image,f.x,f.y,f.w,f.h,0,0,f.w,f.h);c.restore();
    const pixels=c.getImageData(0,0,f.w,f.h).data;let left=f.w,right=0,top=f.h,bottom=0;
    for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(pixels[(y*f.w+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
    const frame={rim:ActorArt.outline(this.image,f.x,f.y,f.w,f.h,f.w,f.h,'#ffe6b0',art.mirror),left,right,top,bottom};
    this.visibility.set(key,frame);if(this.visibility.size>48)this.visibility.delete(this.visibility.keys().next().value);return frame;
  }
  visibilityBounds(s){
    const pose=computeHeroPose(s),f=this.visibilityFrame(pose);if(!f)return null;
    const art=pose.art,anchor=art.anchor||HERO_FRAMES.anchor,left=art.ground.x+(art.mirror?anchor[0]-art.frame.w:-anchor[0]),top=art.ground.y-anchor[1];
    return {left:left+f.left,right:left+f.right,top:top+f.top,foot:top+f.bottom};
  }
  drawVisibility(ctx,s){
    if(s.mode==='gameover')return;
    const pose=computeHeroPose(s),f=this.visibilityFrame(pose);if(!f)return;
    const art=pose.art,anchor=art.anchor||HERO_FRAMES.anchor,dest=ActorArt.snap(ctx,art.ground.x+(art.mirror?anchor[0]-art.frame.w:-anchor[0]),art.ground.y-anchor[1]);
    ctx.save();ctx.strokeStyle='#ffe6b0';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(s.x,s.y+9,18,6,0,0,Math.PI*2);ctx.stroke();ctx.imageSmoothingEnabled=false;if(f.rim)ctx.drawImage(f.rim,dest.x-1,dest.y-1);ctx.restore();
  }
  _fallback(c,pose){
    // The load-failure path also uses a complete approved painting, never limbs.
    const fallback=HERO_FRAMES.fallback,frame=pose.split.amount>.5?fallback.split:fallback.run,anchor=HERO_FRAMES.anchor;
    const ground=ActorArt.snap(c,pose.art.ground.x,pose.art.ground.y);
    c.save();c.translate(ground.x,ground.y);if(pose.side<0)c.scale(-1,1);
    const palette=frame.palette||fallback.palette;
    for(const [y,x,length,color]of frame.rows){c.fillStyle=palette[color];c.fillRect(x-anchor[0],y-anchor[1],length,1);}
    c.restore();
  }
  _flash(c,pose,s,time,reduced){
    if(s.mode==='gameover'||!this.image)return;
    const fresh=Number.isFinite(s.shotClock)&&s.shotClock>Math.max(0,(s.stats?.fireInterval||.52)-.065);
    const shooting=fresh||(s.shots||[]).some(shot=>shot.kind==='bullet'&&Math.hypot(shot.x-pose.muzzle.x,shot.y-pose.muzzle.y)<42&&((shot.vx||0)*pose.aim.x+(shot.vy||0)*pose.aim.y)>0);
    if(!shooting||Math.floor(time*42)%3===1)return;
    const a=pose.barrelAim,m=pose.muzzle,n=pt(-a.y,a.x),v=(x,y)=>pt(m.x+a.x*x+n.x*y,m.y+a.y*x+n.y*y);
    if(reduced){line(c,'#ffe9a1',v(1,0),v(5,0),2);return;}
    c.save();c.globalAlpha*=.18;polygon(c,'#ffbd65',[v(-3,-3),v(9,-9),v(23,0),v(9,9),v(-3,3)]);c.restore();
    polygon(c,'#ed9b47',[v(0,-2),v(7,-6),v(6,-2),v(19,0),v(6,3),v(8,6),v(0,2)]);
    polygon(c,'#ffe489',[v(0,-2),v(9,-3),v(15,0),v(8,3),v(0,2)]);polygon(c,'#fffdeb',[v(1,-1),v(11,0),v(1,2)]);
  }
  draw(ctx,s,time=0,reduced=false){
    const pose=computeHeroPose(s);ctx.save();ctx.imageSmoothingEnabled=false;
    if(s.invulnerable>0&&Math.floor(time*16)%2)ctx.globalAlpha*=.58;
    if(s.mode==='gameover'){ctx.translate(pose.x,pose.y+8);ctx.rotate(-1.35);ctx.translate(-pose.x,-pose.y-8);ctx.globalAlpha*=.72;}
    if(this.image)this._wholeFrame(ctx,pose,reduced);else this._fallback(ctx,pose);
    this._flash(ctx,pose,s,time,reduced);ctx.restore();return true;
  }
}
