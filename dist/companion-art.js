// Every atlas cell is a complete painted figure. Only translation and mirroring
// are used. The renderer owns no simulation state and allocates no frame cache.
export const COMPANION_ART = Object.freeze({
  path:'assets/companion-levels-whole.png', columns:6, rows:5,
  cell:128, size:82, anchorX:64, footY:121,
});
const finite = (v, fallback=0) => Number.isFinite(v) ? v : fallback;
export function companionRank(state) {
  return Math.max(0, Math.min(5, Math.floor(finite(state?.upg?.girlfriend))));
}
export function companionFrame(girl, reduced=false) {
  const rear=finite(girl.faceY)<-.45;
  if (girl.down || reduced || !girl.walkMoving) return rear?3:0;
  return (rear?4:1) + (Math.floor(Math.max(0, finite(girl.walkDistance))/13) % 2);
}
function load(src) {
  return new Promise(resolve => {
    if (typeof Image === 'undefined') { resolve(null); return; }
    const image=new Image(); image.onload=()=>resolve(image);
    image.onerror=()=>resolve(null); image.src=src;
  });
}
function ring(ctx,x,y,rank,phase,supportFlash) {
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=rank===5?'#ff63db':'#5ee9ee';
  ctx.globalAlpha=.55;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,-1,rank===5?26:22,6,0,0,Math.PI*2);ctx.stroke();
  // Four collection marks, restrained enough to preserve hazard readability.
  ctx.fillStyle='#b5ffff';for(let i=0;i<4;i++){const a=i*Math.PI/2+phase*.35;ctx.fillRect(Math.cos(a)*22-1,Math.sin(a)*6-2,2,2);}
  if(rank>=4&&supportFlash>0){ctx.globalAlpha=Math.min(.65,Math.max(0,supportFlash));ctx.strokeStyle='#ffdf83';ctx.beginPath();ctx.arc(0,-34,25,-.65,.65);ctx.stroke();ctx.beginPath();ctx.arc(0,-34,25,Math.PI-.65,Math.PI+.65);ctx.stroke();}
  ctx.restore();
}
function drone(ctx,x,y,phase,side) {
  ctx.save();ctx.translate(Math.round(x+side*21),Math.round(y-36));
  ctx.fillStyle='#17182e';ctx.fillRect(-6,-4,12,8);ctx.fillStyle='#65e9f8';ctx.fillRect(-4,-3,8,6);
  ctx.fillStyle='#fff8fe';ctx.fillRect(-2,-1,3,2);ctx.fillStyle='#a7ffff';ctx.fillRect(-8,-1,2,3);ctx.fillRect(6,-1,2,3);
  ctx.fillStyle='#ff72d6';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(-5,-10);ctx.lineTo(-5,-13);ctx.lineTo(-2,-15);ctx.lineTo(0,-13);ctx.lineTo(2,-15);ctx.lineTo(5,-13);ctx.lineTo(5,-10);ctx.closePath();ctx.fill();ctx.restore();
}
export class CompanionArt {
  constructor({loadImage=load}={}) {
    this.image=null;
    this.ready=Promise.resolve().then(()=>loadImage(COMPANION_ART.path))
      .then(image=>{this.image=image;}).catch(()=>{this.image=null;});
  }
  draw(ctx,girl,state,time=0,reduced=false) {
    const rank=companionRank(state);if(!this.image || !rank || !girl)return false;
    const a=COMPANION_ART, frame=companionFrame(girl,reduced);
    const x=Math.round(finite(girl.x)), y=Math.round(finite(girl.y))+11;
    const phase=reduced?0:finite(time);
    if(rank>=3&&!girl.down)ring(ctx,x,y,rank,phase,finite(girl.supportFlash));
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(x,y);
    if(finite(girl.faceX,1)<-.1)ctx.scale(-1,1);
    if(girl.down)ctx.globalAlpha=.4;
    ctx.drawImage(this.image,frame*a.cell,(rank-1)*a.cell,a.cell,a.cell,
      -a.anchorX*a.size/a.cell,-a.footY*a.size/a.cell,a.size,a.size);
    ctx.restore();
    if(rank===5&&!girl.down){drone(ctx,x,y,phase,-1);drone(ctx,x,y,phase,1);}
    return true;
  }
}
