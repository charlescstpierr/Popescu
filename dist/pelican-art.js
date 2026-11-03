import {PELICAN,pelicanCards,pelicanRingRadius} from './pelican.js';

// Every atlas cell is an intact painting. Only translation and horizontal mirror
// are used by ActorArt; gait comes from distance, never the rendering clock.
export const PELICAN_ART={columns:4,rows:3,size:160,footY:332*160/362};
export function pelicanFrame(e){
  const poses={peli_hug_warning:5,peli_hug:6,peli_zodiac_warning:7,peli_zodiac:7,peli_tarot_warning:8,peli_tarot:9,peli_recover:10};
  if(poses[e.phase]!==undefined)return poses[e.phase];
  if(e.hitFlash>0)return 11;
  return e.peliMoving?Math.floor((e.peliWalkDistance||0)/14)%4:4;
}

// Pure geometry exposed for parity tests. Width is the collision half-width.
export function pelicanHazards(e){
  if(e.type!=='pelican'||!e.phase?.startsWith('peli_')||e.phase==='peli_recover')return null;
  const warning=e.phase.endsWith('_warning'),kind=e.phase.slice(5).replace('_warning',''),a=PELICAN[kind];
  if(!a)return null;
  const base={kind,warning,x:e.peliX,y:e.peliY,aim:Math.atan2(e.peliDY,e.peliDX),width:a.width};
  if(kind==='hug')return {...base,length:a.speed*a.duration,liveX:e.x,liveY:e.y};
  if(kind==='zodiac'){
    const radius=warning?a.radius:pelicanRingRadius(e.peliTime);
    return {...base,radius,inner:warning?a.width:Math.max(a.width,radius-a.width/2),outer:radius+a.width/2,gap:a.gap};
  }
  return {...base,length:a.reach,spread:a.spread,cards:pelicanCards(e)};
}

const TAU=Math.PI*2,GOLD='#ffd685',PINK='#ff79ce',INK='#251332';
function star(ctx,x,y,r,color=GOLD){
  ctx.fillStyle=color;ctx.beginPath();
  for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,d=i%2?r*.42:r;const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
  ctx.closePath();ctx.fill();
}
function capsule(ctx,length,width){
  ctx.beginPath();ctx.moveTo(0,-width);ctx.lineTo(length,-width);ctx.arc(length,0,width,-Math.PI/2,Math.PI/2);ctx.lineTo(0,width);ctx.arc(0,0,width,Math.PI/2,Math.PI*1.5);ctx.closePath();
}
function sector(ctx,h){
  if(h.outer<=h.inner)return false;
  ctx.beginPath();ctx.arc(0,0,h.outer,h.gap,TAU-h.gap);ctx.arc(0,0,h.inner,TAU-h.gap,h.gap,true);ctx.closePath();return true;
}
function arrow(ctx,x,y,color=GOLD){
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-5,y-5);ctx.lineTo(x+2,y);ctx.lineTo(x-5,y+5);ctx.stroke();
}

export function drawPelicanGround(ctx,e,reduced=false){
  const h=pelicanHazards(e);if(!h)return;
  ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.aim);
  ctx.strokeStyle=h.warning?GOLD:PINK;ctx.lineWidth=2;ctx.fillStyle=h.warning?'#ffcf6924':'#f852bd4a';
  if(h.kind==='hug'){
    // The corridor previews the maximum travel. Only the moving contact disc is
    // live during the dash, so the already-crossed corridor has no damage fill.
    capsule(ctx,h.length,h.width);ctx.setLineDash(h.warning?[6,5]:[3,8]);if(h.warning)ctx.fill();ctx.stroke();ctx.setLineDash([]);
    for(let x=36;x<h.length;x+=44)arrow(ctx,x,0,h.warning?GOLD:'#c58ec7');
    if(!h.warning){
      const dx=h.liveX-h.x,dy=h.liveY-h.y,x=dx*Math.cos(h.aim)+dy*Math.sin(h.aim),y=-dx*Math.sin(h.aim)+dy*Math.cos(h.aim);
      ctx.beginPath();ctx.arc(x,y,h.width,0,TAU);ctx.fillStyle='#f852bd42';ctx.fill();ctx.strokeStyle=PINK;ctx.stroke();
    }
  }else if(h.kind==='zodiac'){
    if(sector(ctx,h)){ctx.fill();ctx.setLineDash(h.warning?[7,5]:[]);ctx.stroke();ctx.setLineDash([]);}
    if(!reduced&&h.outer>h.inner){
      // Stars sit only on the dangerous arc, never across the safe opening.
      const radius=h.warning?h.radius:(h.inner+h.outer)/2,size=Math.min(h.warning?3:4,(h.outer-h.inner)/2);
      for(let i=0;i<10;i++){const a=h.gap+.13+(TAU-2*h.gap-.26)*i/9;star(ctx,Math.cos(a)*radius,Math.sin(a)*radius,size,h.warning?GOLD:PINK);}
    }
    if(h.warning){
      ctx.strokeStyle='#7ee5ce';ctx.globalAlpha=.85;
      for(const a of [-h.gap,h.gap]){ctx.beginPath();ctx.moveTo(Math.cos(a)*22,Math.sin(a)*22);ctx.lineTo(Math.cos(a)*(h.outer+5),Math.sin(a)*(h.outer+5));ctx.stroke();}
      arrow(ctx,60,0,'#a6ffe7');arrow(ctx,88,0,'#a6ffe7');
    }
  }else if(h.warning){
    for(const spread of [-1,0,1]){
      ctx.save();ctx.rotate(spread*h.spread);capsule(ctx,h.length,h.width);ctx.fill();ctx.setLineDash([5,6]);ctx.stroke();ctx.setLineDash([]);
      for(let x=42;x<h.length;x+=55)arrow(ctx,x,0);ctx.restore();
    }
  }
  ctx.restore();
  if(h.warning){
    const label=h.kind==='hug'?'CÂLIN COSMIQUE !':h.kind==='zodiac'?'ZODIAQUE : PASSE DANS L’OUVERTURE':'TAROT : ATTENTION AU RETOUR !';
    ctx.save();ctx.textAlign='center';ctx.font='bold 10px sans-serif';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle=INK;ctx.strokeText(label,e.x,e.y+32);ctx.fillStyle=GOLD;ctx.fillText(label,e.x,e.y+32);ctx.restore();
  }
}

export function drawPelicanCards(ctx,e,reduced=false){
  const cards=pelicanCards(e);if(!cards.length)return;
  for(const card of cards){
    ctx.save();ctx.translate(card.x,card.y);
    // The entire 14 x 16 card lies inside the exact 11 px collision radius.
    ctx.beginPath();ctx.arc(0,0,PELICAN.tarot.width,0,TAU);ctx.fillStyle='#ff72c826';ctx.fill();ctx.strokeStyle='#f6a2df';ctx.lineWidth=1;ctx.stroke();
    ctx.rotate(card.angle);
    if(!reduced){ctx.strokeStyle='#ec8ef0';ctx.globalAlpha=.6;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-15,-4);ctx.lineTo(-25,-4);ctx.moveTo(-15,4);ctx.lineTo(-21,4);ctx.stroke();ctx.globalAlpha=1;}
    ctx.fillStyle=INK;ctx.fillRect(-7,-8,14,16);ctx.fillStyle=GOLD;ctx.fillRect(-6,-7,12,14);ctx.fillStyle='#57277b';ctx.fillRect(-4.5,-5.5,9,11);
    if(card.kind===0){ctx.fillStyle='#ffe6a3';ctx.beginPath();ctx.arc(0,0,3,0,TAU);ctx.fill();for(let i=0;i<8;i++){const a=i*TAU/8;ctx.fillRect(Math.round(Math.cos(a)*4),Math.round(Math.sin(a)*4),1,1);}}
    else if(card.kind===1){ctx.fillStyle='#fff0cd';ctx.beginPath();ctx.arc(0,0,3.5,0,TAU);ctx.fill();ctx.fillStyle='#57277b';ctx.beginPath();ctx.arc(1.7,-1,3.1,0,TAU);ctx.fill();}
    else star(ctx,0,0,4,'#fff1b1');
    ctx.restore();
  }
}
