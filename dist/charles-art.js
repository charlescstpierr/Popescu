// Five complete painted figures. Neither animation nor aiming assembles limbs.
const ASSET=new URL('./assets/charles-whole-v1.png',import.meta.url).href;
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
 const frame=frameByPhase[c.phase]??(c.powered?4:0);
 let lift=hover;
 if(c.phase==='descend')lift=hover*(1-ease(progress));
 else if(c.phase==='bend'||c.phase==='scream')lift=0;
 else if(c.phase==='burst')lift=hover*ease(progress);
 else if(c.phase==='intro')lift=hover+22*(1-ease(progress));
 else if(!reduced)lift+=Math.sin(clock*2.3)*2;
 return {frame,progress,lift,x:c.x,y:c.y-lift};
}

export class CharlesArt {
 constructor({loadImage=load}={}){
  this.image=null;this.error=null;
  this.ready=Promise.resolve().then(()=>loadImage(ASSET)).then(image=>{this.image=image||null;return Boolean(image);}).catch(error=>{this.error=error;return false;});
 }
 /** Draw body only; attack footprints, beams and debris belong to effects. */
 draw(ctx,c,time=0,reduced=false){
  if(!this.image||!c||!Number.isFinite(c.x)||!Number.isFinite(c.y))return false;
  const pose=charlesPose(c,time,reduced),a=CHARLES_ART;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(pose.x),Math.round(pose.y));
  ctx.drawImage(this.image,pose.frame*a.cell,0,a.cell,a.cell,-a.anchorX,-a.anchorY,a.cell,a.cell);
  // Restore the source painting's emerald iris highlight after downsampling.
  // These are one-pixel light glints, not substitute facial/body geometry.
  ctx.fillStyle='#51f48d';
  for(const [x,y]of EYES[pose.frame])ctx.fillRect(Math.round(x-a.anchorX),Math.round(y-a.anchorY),1,1);
  ctx.restore();return true;
 }
}
