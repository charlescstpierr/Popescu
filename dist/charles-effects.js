import {CHARLES,charlesWaveRadius} from './charles.js';
const TAU=Math.PI*2;
export function charlesProp(p,destroyed){if(!destroyed?.has(p.id))return p;return {...p,type:'stump',w:20,h:14,r:8,solid:false};}
function circle(ctx,x,y,r,start=0,end=TAU){ctx.beginPath();ctx.arc(x,y,Math.max(0,r),start,end);}
function wedge(ctx,c,r){ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.arc(c.x,c.y,r,c.safeAngle-CHARLES.gapHalfAngle,c.safeAngle+CHARLES.gapHalfAngle);ctx.closePath();}
// Stable original lightning paths evolve continuously with the transformation.
// No RNG, blink clock, screen whiteout, filters or offscreen allocations.
export function charlesBeam(c,reduced=false){
 if(!c||!['descend','bend','scream','burst','empowered'].includes(c.phase))return null;
 const p=Math.max(0,Math.min(1,c.phaseDuration>0?1-c.phaseTime/c.phaseDuration:0));
 const peak=c.phase==='burst'?Math.sin(p*Math.PI):0;
 let strength=c.phase==='descend'?.08*p:c.phase==='bend'?.12+.18*p:c.phase==='scream'?.3+.35*p:c.phase==='burst'?.65+.35*peak:.65-.47*p;
 let height=c.phase==='descend'?140:c.phase==='bend'?150+100*p:c.phase==='scream'?250+130*p:c.phase==='burst'?380+100*peak:380-150*p;
 let width=c.phase==='burst'?40+35*peak:c.phase==='empowered'?40-20*p:16+strength*36;
 const progress=reduced?0:p;if(reduced){strength=.18;height=280;width=24;}
 const templates=[
  [[-38,-8],[-56,-31],[-43,-52],[-92,-67],[-70,-96],[-87,-123],[-50,-147],[-80,-179],[-57,-214],[-72,-247]],
  [[60,5],[44,-26],[75,-42],[52,-75],[88,-103],[61,-122],[86,-155],[49,-181],[72,-212],[43,-253]],
  [[-91,-166],[-58,-188],[-73,-207],[-26,-218],[4,-196],[29,-231],[62,-212],[82,-225],[105,-193]]
 ];
 const clock=reduced?0:(Number.isFinite(c.elapsed)?c.elapsed:0)*4,key=Math.floor(clock),fraction=clock-key,mix=fraction*fraction*(3-2*fraction);
 const noise=(i,j,t)=>{let n=Math.imul(i+19,374761393)^Math.imul(j+7,668265263)^Math.imul(t+13,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295*2-1;};
 const jitter=(i,j)=>reduced?0:(noise(i,j,key)*(1-mix)+noise(i,j,key+1)*mix)*10;
 const scaleY=reduced?1:Math.min(1.15,height/300),spread=width*.25;
 const bolts=templates.slice(0,reduced?2:3).map((path,i)=>path.map(([x,y],j)=>({x:x+Math.sign(x)*spread+jitter(i,j),y:y*scaleY+jitter(i+4,j)*.65})));
 if(!reduced)for(const [i,j,side] of [[0,3,-1],[0,6,-1],[1,2,1],[1,6,1],[2,3,1]]){
  const a=bolts[i][j],branch=[{...a}];
  for(const [k,[dx,dy]] of [[18,-14],[10,-31],[44,-43],[36,-64]].entries())branch.push({x:a.x+side*dx+jitter(i+11,k)*.4,y:a.y+dy*scaleY+jitter(i+17,k)*.4});
  bolts.push(branch);
 }

 return {strength,height,width,bolts,progress};
}
function strokeBolt(ctx,points,x,y){ctx.beginPath();for(let i=0;i<points.length;i++){const p=points[i];if(i)ctx.lineTo(x+p.x,y+p.y);else ctx.moveTo(x+p.x,y+p.y);}ctx.stroke();}
function drawBeam(ctx,c,reduced){
 const b=charlesBeam(c,reduced);if(!b||b.strength<=0)return;
 ctx.save();
 // Broad amber plume, ivory core and golden edge columns remain behind actors.
 for(const [scale,alpha,color] of [[2.8,.14,'#ffbb32'],[1.65,.32,'#ffda75'],[1,.62,'#fff7d1']]){
  ctx.globalAlpha=b.strength*alpha;const gradient=ctx.createLinearGradient(c.x,c.y-b.height,c.x,c.y+12);
  gradient.addColorStop(0,'rgba(255,215,100,0)');gradient.addColorStop(.22,color);gradient.addColorStop(.88,color);gradient.addColorStop(1,'rgba(255,215,100,0)');ctx.fillStyle=gradient;
  ctx.fillRect(c.x-b.width*scale/2,c.y-b.height,b.width*scale,b.height+12);
 }
 const layers=reduced?[[2,.5,'#aacde1']]:[[18,.1,'#416de8'],[10,.24,'#43a5ff'],[5,.8,'#73ddff'],[2.2,1,'#f7ffff']];
 for(const [width,alpha,color] of layers){ctx.lineWidth=width;ctx.globalAlpha=b.strength*alpha;ctx.strokeStyle=color;for(const [i,bolt] of b.bolts.entries()){ctx.lineWidth=width*(i<3?1:.65);strokeBolt(ctx,bolt,c.x,c.y);}}
 if(c.phase==='burst'&&!reduced){
  const p=b.progress,r=35+p*205;ctx.globalAlpha=.7*(1-p);ctx.strokeStyle='#ffdf86';ctx.lineWidth=5;circle(ctx,c.x,c.y,r);ctx.stroke();ctx.lineWidth=2;circle(ctx,c.x,c.y,Math.max(0,r-9));ctx.stroke();
  for(let i=0;i<12;i++){const a=i*TAU/12,inner=45+p*45,outer=95+p*110;ctx.beginPath();ctx.moveTo(c.x+Math.cos(a)*inner,c.y-70+Math.sin(a)*inner);ctx.lineTo(c.x+Math.cos(a+.04)*outer,c.y-70+Math.sin(a+.04)*outer);ctx.stroke();}
 }
 // Feet touch down at the start of bend; this ring never damages the player.
 if(c.phase==='bend'){
  const p=reduced?0:Math.min(1,b.progress*3),r=reduced?70:35+p*110;ctx.globalAlpha=reduced?.22:.65*(1-p);ctx.strokeStyle='#e7bf76';ctx.lineWidth=3;circle(ctx,c.x,c.y,r);ctx.stroke();
  if(!reduced)for(let i=0;i<10;i++){const a=i*TAU/10,rad=26+p*90;ctx.fillStyle=i%2?'#c29459':'#786447';ctx.fillRect(c.x+Math.cos(a)*rad,c.y+Math.sin(a)*rad-p*(1-p)*50,4,3);}
 }
 ctx.restore();
}
export function drawCharlesGround(ctx,c,reduced=false){
 if(!c||c.phase==='complete')return;ctx.save();
 if(c.phase==='shock_warning'||c.phase==='shockwave'){
  // Green opening and both its boundary rays persist even with effects reduced.
  ctx.globalAlpha=.16;ctx.fillStyle='#48e8a1';wedge(ctx,c,c.waveMax);ctx.fill();ctx.globalAlpha=.85;ctx.strokeStyle='#8bffbf';ctx.lineWidth=2;
  for(const side of [-1,1]){const a=c.safeAngle+side*CHARLES.gapHalfAngle;ctx.beginPath();ctx.moveTo(c.x+Math.cos(a)*24,c.y+Math.sin(a)*24);ctx.lineTo(c.x+Math.cos(a)*c.waveMax,c.y+Math.sin(a)*c.waveMax);ctx.stroke();}
  const start=c.safeAngle+CHARLES.gapHalfAngle,end=c.safeAngle+TAU-CHARLES.gapHalfAngle;
  if(c.phase==='shock_warning'){ctx.strokeStyle='#dca745';ctx.globalAlpha=.62;ctx.lineWidth=3;ctx.setLineDash([7,6]);circle(ctx,c.x,c.y,c.waveMax,start,end);ctx.stroke();ctx.setLineDash([]);}
  else{const radius=charlesWaveRadius(c);ctx.strokeStyle='#d39725';ctx.globalAlpha=.95;ctx.lineWidth=CHARLES.waveWidth;circle(ctx,c.x,c.y,radius,start,end);ctx.stroke();ctx.strokeStyle='#fff0b0';ctx.lineWidth=3;circle(ctx,c.x,c.y,radius,start,end);ctx.stroke();}
 }
 if(c.phase==='cape_warning'||c.phase==='cape_spin'){
  ctx.fillStyle='#e6b64e';ctx.globalAlpha=c.phase==='cape_warning'?.13:.2;circle(ctx,c.x,c.y,c.capeRadius);ctx.fill();ctx.globalAlpha=.95;ctx.strokeStyle='#ffe7a2';ctx.lineWidth=3;
  if(c.phase==='cape_warning')ctx.setLineDash([9,6]);circle(ctx,c.x,c.y,c.capeRadius);ctx.stroke();ctx.setLineDash([]);
 }
 if(c.phase==='cape_spin'){
  ctx.save();ctx.translate(c.x,c.y-100);const sway=reduced?0:Math.sin(c.elapsed*24)*12;
  ctx.globalAlpha=.95;ctx.fillStyle='#ffedc4';ctx.strokeStyle='#d9a432';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-c.capeRadius,sway);ctx.quadraticCurveTo(-22,-27,c.capeRadius,-sway);ctx.quadraticCurveTo(22,35,-c.capeRadius,sway);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#fff5dc';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,2,c.capeRadius,34,0,.2,Math.PI*1.55);ctx.stroke();ctx.restore();
 }
 if(['descend','bend','scream','burst','empowered'].includes(c.phase)){
  ctx.globalAlpha=.6;ctx.strokeStyle='#ffe69a';ctx.lineWidth=2;circle(ctx,c.x,c.y,48);ctx.stroke();circle(ctx,c.x,c.y,56);ctx.stroke();
  drawBeam(ctx,c,reduced);
 }
 ctx.restore();
}
export function drawCharlesForeground(ctx,c,reduced=false){
 if(!c||c.phase==='complete')return;ctx.save();

 if(c.hitFlash>0&&!reduced){ctx.globalAlpha=Math.min(.7,c.hitFlash*5);ctx.strokeStyle='#69ffc0';ctx.lineWidth=2;circle(ctx,c.x,c.y-55,44);ctx.stroke();}
 if(c.powered&&!reduced){ctx.globalAlpha=.6;ctx.fillStyle='#ebc45f';for(let n=0;n<8;n++){const a=n*TAU/8+c.elapsed*.4,x=c.x+Math.cos(a)*56,y=c.y-50+Math.sin(a)*48;ctx.fillRect(x,y,2,4);}}
 ctx.restore();
}
