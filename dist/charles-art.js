import {charlesArrival,CHARLES_ARRIVAL} from './charles.js';
import {CHARLES_MOTION_FRAMES} from './charles-motion-frames.js';
// Complete painted figures. Neither animation nor aiming assembles limbs.
const ASSET=new URL('./assets/charles-whole-v1.png',import.meta.url).href;
const MOTION_ASSET=new URL('./assets/charles-motion-v1.png',import.meta.url).href;
const MOTION_BY_NAME=Object.fromEntries(CHARLES_MOTION_FRAMES.frames.map(frame=>[frame.name,frame]));
const FLIGHT_LOOP=['flight0','flight1','flight2','flight1'];
const HOVER_LOOP=['hover0','hover1'];
const ARRIVAL_ASSET=new URL('./assets/charles-arrival-v1.png',import.meta.url).href;
const ARRIVAL_EYES=[[[120.005,45.855],[123.89,45.855]],[[89.295,46.225],[93.365,46.225]],[[88.925,46.225],[92.625,46.225]]];
export const CHARLES_ART=Object.freeze({cell:176,columns:5,anchorX:88,anchorY:160,hoverHeight:26});
const EYES=[[[86.44,45.73],[91.12,45.73]],[[86.18,50.15]],[[105.68,83.82],[111.14,84.08]],[[89.82,63.28]],[[89.3,46.64]]];
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=t=>t*t*(3-2*t);
function load(src){
 return new Promise(resolve=>{
  if(typeof Image==='undefined'){resolve(null);return;}
  const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);
  image.src=src.startsWith('file:')?decodeURIComponent(new URL(src).pathname):src;
 });
}

/** x/y are the simulation's ground anchor; phaseTime is time remaining. */
export function charlesPose(c,time=0,reduced=false){
 const progress=c.phaseDuration>0?clamp(1-(c.phaseTime||0)/c.phaseDuration):0;
 const clock=Number.isFinite(c.elapsed)?c.elapsed:(Number.isFinite(time)?time:0);
 const hover=CHARLES_ART.hoverHeight;
 const frameByPhase={descend:1,bend:2,scream:3,burst:4,empowered:4,cape_warning:4,cape_spin:4};
 const arrival=charlesArrival(c),arrivalFrame=arrival?.stage==='flight'?0:arrival?.stage==='prepare'?1:arrival?.stage==='snap'?2:null;
 const frame=frameByPhase[c.phase]??(c.powered?4:0);
 let lift=hover;
 if(c.phase==='descend')lift=hover*(1-ease(progress));
 else if(c.phase==='bend'||c.phase==='scream')lift=0;
 else if(c.phase==='burst')lift=hover*ease(progress);
 else if(c.phase==='intro')lift=hover+22*(1-ease(arrival.flight));
 else if(!reduced)lift+=Math.sin(clock*2.3)*2;
 // The painted flight leans its head 32 px ahead of its feet. Ease that
 // complete figure back as it straightens, keeping the face steady at settle.
 const lean=arrivalFrame===0?32*ease(arrival.flight):0;
 return {frame,arrivalFrame,progress,lift,x:c.x-(arrival?260*(1-ease(arrival.flight)):0)-lean,y:c.y-lift};
}

// Complete paintings change pose, while the face follows one continuous path.
// This is sampled only from the saved simulation clock: no render-owned tween,
// wall-clock animation, rotated cutouts or allocation of extra render surfaces.
export function charlesMotionPose(c,time=0,reduced=false){
 if(!c||c.powered||!['intro','hover','recover','shock_warning','shockwave'].includes(c.phase))return null;
 const base=charlesPose(c,time,reduced),arrival=charlesArrival(c);
 const clock=Number.isFinite(c.elapsed)?Math.max(0,c.elapsed):(Number.isFinite(time)?Math.max(0,time):0);
 const t=arrival?.time??clock;
 let name;
 if(arrival&&t<1.72)name=FLIGHT_LOOP[Math.floor(t*7.5)%FLIGHT_LOOP.length];
 else if(arrival&&t<2.05)name='brake0';
 else if(arrival&&t<2.38)name='brake1';
 else if(arrival&&t<2.68)name='settle';
 else if(arrival&&t<CHARLES_ARRIVAL.prepare)name='hover0';
 else if(arrival&&t<3.18)name='raise';
 else if(arrival&&t<CHARLES_ARRIVAL.snap)name='prepare';
 else if(arrival&&t<3.58)name='snap';
 else if(arrival&&t<4.02)name='recoil';
 else if(arrival&&t<4.3)name='raise';
 else name=reduced?'hover0':HOVER_LOOP[Math.floor(t*2.2)%HOVER_LOOP.length];
 const motionFrame=MOTION_BY_NAME[name];
 if(!motionFrame)return null;
 const eyes=motionFrame.eyes,faceX=eyes.reduce((sum,eye)=>sum+eye[0],0)/eyes.length,faceY=eyes.reduce((sum,eye)=>sum+eye[1],0)/eyes.length;
 // Keep the established mobile-safe flight envelope. The final small dip and
 // return provide weight as the cape brakes, without changing the world anchor.
 const settle=arrival?clamp((t-2.38)/.57):0;
 const lift=arrival?base.lift-1.5*Math.sin(settle*Math.PI)**2:base.lift;
 const travel=arrival?260*(1-ease(arrival.flight)):0;
 const x=c.x-travel+90-faceX,y=c.y-lift+46-faceY;
 const hand=motionFrame.hand?{x:Math.round(x)+motionFrame.hand[0]-88,y:Math.round(y)+motionFrame.hand[1]-160}:null;
 return {...base,x,y,lift,motionFrame,hand};
}

export class CharlesArt {
 constructor({loadImage=load}={}){
  this.image=null;this.arrivalImage=null;this.motionImage=null;this.error=null;this.arrivalError=null;this.motionError=null;
  const main=Promise.resolve().then(()=>loadImage(ASSET)).then(image=>{this.image=image||null;return Boolean(image);}).catch(error=>{this.error=error;return false;});
  const arrival=Promise.resolve().then(()=>loadImage(ARRIVAL_ASSET)).then(image=>{this.arrivalImage=image||null;}).catch(error=>{this.arrivalError=error;});
  const motion=Promise.resolve().then(()=>loadImage(MOTION_ASSET)).then(image=>{this.motionImage=image||null;}).catch(error=>{this.motionError=error;});
  this.ready=Promise.all([main,arrival,motion]).then(([ready])=>ready);
 }
 pose(c,time=0,reduced=false){return (this.motionImage&&charlesMotionPose(c,time,reduced))||charlesPose(c,time,reduced);}
 /** Draw body only; attack footprints, beams and debris belong to effects. */
 draw(ctx,c,time=0,reduced=false){
  if(!this.image||!c||!Number.isFinite(c.x)||!Number.isFinite(c.y))return false;
  const pose=this.pose(c,time,reduced),a=CHARLES_ART,motion=pose.motionFrame,arrival=pose.arrivalFrame!==null&&this.arrivalImage,frame=arrival?pose.arrivalFrame:pose.frame;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(pose.x),Math.round(pose.y));
  if(motion)ctx.drawImage(this.motionImage,motion.x,motion.y,a.cell,a.cell,-a.anchorX,-a.anchorY,a.cell,a.cell);
  else ctx.drawImage(arrival||this.image,frame*a.cell,0,a.cell,a.cell,-a.anchorX,-a.anchorY,a.cell,a.cell);
  // Restore the source painting's emerald iris highlight after downsampling.
  // These are one-pixel light glints, not substitute facial/body geometry.
  ctx.fillStyle='#51f48d';
  for(const [x,y]of (motion?motion.eyes:(arrival?ARRIVAL_EYES:EYES)[frame]))ctx.fillRect(Math.round(x-a.anchorX),Math.round(y-a.anchorY),1,1);
  ctx.restore();return true;
 }
}
