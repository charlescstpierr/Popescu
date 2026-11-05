import {EGO_BEASTS,egoAttackGeometry,egoHeight,egoCamoRatio} from './ego-beasts.js';
import {EGO_FRAMES} from './ego-entry.js';
export const EGO_ART=Object.freeze({columns:6,rows:4,types:Object.freeze(['ego_peacock','ego_toad','ego_rat','ego_chameleon'])});
export const EGO_SURFACES=Object.freeze({building:'#776e78',asphalt:'#352c43',grass:'#4e5938'});
export function egoFrame(e,step=0){
 if(e.phase==='ego_warning')return 3;
 if(e.phase==='ego_recover')return 5;
 if(e.phase==='ego_active'){
  if(e.type==='ego_toad')return egoHeight(e)>0?4:5;
  if(e.type==='ego_rat'){const age=EGO_BEASTS.ego_rat.duration-e.egoTime;return (age+.0000001)%.36<.24?4:3;}
  return 4;
 }
 return [0,1,0,2][Math.abs(Math.floor(Number.isFinite(step)?step:0))%4];
}
// Registered on the complete painted active poses, relative to the ground point.
export const EGO_ANCHORS=Object.freeze({camera:Object.freeze({x:35,y:-56}),mouth:Object.freeze({x:34,y:-17})});

function canvas(w,h){if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}return null;}
export function drawEgoBody(ctx,e,image,cache,step=0,reduced=false){
 if(!EGO_BEASTS[e.type])return false;
 if(!image){ctx.save();ctx.fillStyle='#ffdd97';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(EGO_BEASTS[e.type].name,e.x,e.y-24);ctx.strokeStyle='#ffdd97';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,Math.max(14,e.r||14),0,Math.PI*2);ctx.stroke();ctx.restore();return true;}
 const frame=egoFrame(e,step),row=EGO_ART.types.indexOf(e.type),cell=image.width/EGO_ART.columns,f=EGO_FRAMES[e.type],camo=egoCamoRatio(e),surface=Object.hasOwn(EGO_SURFACES,e.egoSurface)?e.egoSurface:'asphalt';
 let sprite=image,sx=frame*cell,sy=row*cell,alpha=1;
 if(camo>0){
  const key=`ego:${frame}:${surface}`;let tint=cache.get(key);
  if(!tint){tint=canvas(cell,cell);if(tint){const c=tint.getContext('2d');c.drawImage(image,sx,sy,cell,cell,0,0,cell,cell);c.globalCompositeOperation='source-atop';c.globalAlpha=.92;c.fillStyle=EGO_SURFACES[surface];c.fillRect(0,0,cell,cell);cache.set(key,tint);if(cache.size>144)cache.delete(cache.keys().next().value);}}
  if(tint){sprite=tint;sx=0;sy=0;}alpha=1-camo*.78;
 }
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(Math.round(e.x),Math.round(e.y)+f.anchorY-Math.round(egoHeight(e)));if((e.faceX??1)<0)ctx.scale(-1,1);ctx.drawImage(sprite,sx,sy,cell,cell,f.left,f.top,f.size,f.size);
 if(e.hitFlash>0){
  const key=`ego-hit:${row}:${frame}`;let flash=cache.get(key);
  if(!flash){flash=canvas(cell,cell);if(flash){const c=flash.getContext('2d');c.drawImage(image,frame*cell,row*cell,cell,cell,0,0,cell,cell);c.globalCompositeOperation='source-atop';c.fillStyle='#fff3b3';c.fillRect(0,0,cell,cell);cache.set(key,flash);if(cache.size>144)cache.delete(cache.keys().next().value);}}
  if(flash){ctx.globalAlpha*=Math.min(reduced?.25:.65,e.hitFlash*5);ctx.drawImage(flash,0,0,cell,cell,f.left,f.top,f.size,f.size);}
 }
 ctx.restore();return true;
}
function capsule(ctx,g){const a=Math.atan2(g.by-g.ay,g.bx-g.ax),px=Math.sin(a)*g.r,py=-Math.cos(a)*g.r;ctx.beginPath();ctx.moveTo(g.ax+px,g.ay+py);ctx.lineTo(g.bx+px,g.by+py);ctx.arc(g.bx,g.by,g.r,a-Math.PI/2,a+Math.PI/2);ctx.lineTo(g.ax-px,g.ay-py);ctx.arc(g.ax,g.ay,g.r,a+Math.PI/2,a+Math.PI*1.5);ctx.closePath();}
export function drawEgoGround(ctx,e,reduced=false){
 if(!EGO_BEASTS[e.type])return;
 const shapes=egoAttackGeometry(e);if(!shapes.length)return;
 ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#ffbd66';ctx.fillStyle='#ef76462b';
 for(const g of shapes){
  if(g.kind==='slam'){
   ctx.setLineDash(g.hot?[]:[7,5]);ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
   ctx.beginPath();ctx.moveTo(g.x-7,g.y);ctx.lineTo(g.x+7,g.y);ctx.moveTo(g.x,g.y-7);ctx.lineTo(g.x,g.y+7);ctx.stroke();
   if(g.hot){ctx.strokeStyle='#ffec9b';for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(g.x+Math.cos(a)*13,g.y+Math.sin(a)*13);ctx.lineTo(g.x+Math.cos(a+.1)*25,g.y+Math.sin(a+.1)*25);ctx.lineTo(g.x+Math.cos(a)*36,g.y+Math.sin(a)*36);ctx.stroke();}if(!reduced){ctx.fillStyle='#bca18a';for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.fillRect(g.x+Math.cos(a)*34-3,g.y+Math.sin(a)*25-3,6,5);}}}
  }else if(g.kind==='frame'||g.kind==='receipt'){
   ctx.strokeStyle=g.hot?'#fff1b0':g.kind==='frame'?'#71e1eb':'#f4ce76';ctx.lineWidth=2;ctx.setLineDash(g.hot?[]:[7,5]);ctx.fillStyle=g.hot?(g.kind==='frame'?'#71e1eb55':'#f4ce76'):'#e8ba6a30';capsule(ctx,g);ctx.fill();ctx.stroke();ctx.setLineDash([]);
   if(g.kind==='receipt'&&g.hot){const d=Math.hypot(g.bx-g.ax,g.by-g.ay)||1,dx=(g.bx-g.ax)/d,dy=(g.by-g.ay)/d;ctx.strokeStyle='#554256';ctx.lineWidth=1;for(let n=5;n<d;n+=9){const x=g.ax+dx*n,y=g.ay+dy*n;ctx.beginPath();ctx.moveTo(x-dy*6,y+dx*6);ctx.lineTo(x+dy*6,y-dx*6);ctx.stroke();}}
  }else if(g.kind==='tongue'){
   // Shared short strike corridor is visible for the whole reveal/windup.
   ctx.save();ctx.setLineDash(g.hot?[]:[5,4]);capsule(ctx,g);ctx.fill();ctx.stroke();ctx.restore();
  }
 }
 ctx.restore();
}

export function drawEgoForeground(ctx,e,reduced=false){
 if(e.type==='ego_peacock'&&e.phase==='ego_active'&&!reduced){
  const x=e.x+((e.faceX??1)<0?-1:1)*EGO_ANCHORS.camera.x,y=e.y+EGO_ANCHORS.camera.y;
  ctx.save();ctx.strokeStyle='#fff1b0';ctx.lineWidth=2;for(const [dx,dy]of [[6,0],[0,6],[4,4],[4,-4]]){ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x+dx,y+dy);ctx.stroke();}ctx.restore();
 }
 if(e.type!=='ego_chameleon'||!['ego_warning','ego_active'].includes(e.phase))return;
 const facing=(e.faceX??1)<0?-1:1;
 ctx.save();ctx.strokeStyle='#ffe19a';ctx.lineWidth=2;const y=e.y-47;for(const [x,dy]of [[-8,-5],[0,-9],[8,-5]]){ctx.beginPath();ctx.moveTo(e.x+facing*18+x,y);ctx.lineTo(e.x+facing*18+x*1.5,y+dy);ctx.stroke();}
 for(const g of egoAttackGeometry(e))if(g.kind==='tongue'&&g.hot){ctx.strokeStyle='#8d285d';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(e.x+facing*EGO_ANCHORS.mouth.x,e.y+EGO_ANCHORS.mouth.y);ctx.lineTo(g.bx,g.by-17);ctx.stroke();ctx.strokeStyle='#ff88b1';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#ffd1df';ctx.beginPath();ctx.arc(g.bx,g.by-17,5,0,Math.PI*2);ctx.fill();}ctx.restore();
}
