// Native geometry adapted from the approved trophy preview. Never mutates simulation.
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h)}
function line(c,col,x,y,X,Y,width=1){c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke()}
function poly(c,col,pts){c.fillStyle=col;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill()}
function star(c,x,y,r,col){const points=[];for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,rr=i%2?r*.34:r;points.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr])}poly(c,col,points)}
export function drawTrophyIcon(c,id,x,y,s=1,col='#efc86c'){c.save();c.translate(x,y);c.scale(s,s);c.lineJoin='miter';
 if(id==='tarot'){for(const [dx,dy] of [[-4,-2],[3,2]]){rect(c,'#19152e',dx-8,dy-12,17,25);c.strokeStyle=col;c.lineWidth=2;c.strokeRect(dx-8,dy-12,17,25);star(c,dx,dy,7,'#ffebad')}}
 if(id==='ascendant'){star(c,0,0,16,col);star(c,0,0,9,'#fdf0bd');rect(c,'#4f3768',-2,-2,4,4)}
 if(id==='panache'){c.strokeStyle=col;c.lineWidth=5;c.beginPath();c.moveTo(-13,10);c.bezierCurveTo(2,8,21,-2,9,-15);c.stroke();c.lineWidth=2;c.strokeStyle='#ffe0ee';c.beginPath();c.moveTo(-10,8);c.bezierCurveTo(5,4,12,-4,8,-10);c.stroke();for(let i=0;i<4;i++)rect(c,col,3-i*5,3+i*2,4,4)}
 if(id==='star'){for(let i=0;i<2;i++){poly(c,col,[[-10+i*13,-12],[-2+i*13,0],[-10+i*13,12],[-4+i*13,12],[4+i*13,0],[-4+i*13,-12]])}rect(c,'#ffdae9',-17,-2,6,3)}
 if(id==='fanclub'){poly(c,col,[[-15,9],[-18,-12],[-8,-3],[0,-16],[8,-3],[18,-12],[15,9]]);rect(c,'#fff2b7',-13,7,26,3);rect(c,'#f451a6',-3,-4,6,7)}
 if(id==='badge'){poly(c,col,[[-15,-13],[15,-13],[13,5],[0,16],[-13,5]]);poly(c,'#26223b',[[-11,-9],[11,-9],[9,3],[0,11],[-9,3]]);line(c,'#fff0b9',-7,0,-1,6,3);line(c,'#fff0b9',-1,6,8,-5,3)}
 c.restore();}

export function drawTrophyPortrait(ctx,actors,type,width=320,height=140){
 ctx.clearRect(0,0,width,height);ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.translate(width/2,height-20);const scale=type==='matriarch'?1.15:.92;ctx.scale(scale,scale);
 const actor={type,x:0,y:0,phase:'chase',faceX:1,faceY:0,hp:100,maxhp:100};
 if(type==='pelican')actors.drawPelican(ctx,actor,0);
 else if(type==='travestia')actors.drawTravestia(ctx,actor,0);
 else actors.draw(ctx,actor,'enemy',0,{moveX:0,moveY:0,faceX:1},0);
 ctx.restore();
}
export function drawTrophyGround(ctx,s,reduced=false){
 const p=s.trophies?.panache;if(!p)return;
 const a=Math.atan2(p.dy,p.dx);ctx.save();ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.arc(p.x,p.y,100,a-Math.PI/3,a+Math.PI/3);ctx.closePath();
 ctx.fillStyle='#f68dbb22';ctx.fill();ctx.strokeStyle='#f68dbb';ctx.lineWidth=2;ctx.stroke();
 if(!reduced)for(let i=0;i<5;i++){const angle=a-Math.PI/3+i*Math.PI/6;drawTrophyIcon(ctx,'panache',p.x+Math.cos(angle)*92,p.y+Math.sin(angle)*92,.3,'#f68dbb');}
 ctx.restore();
}
export function drawTrophyForeground(ctx,s,reduced=false){
 const t=s.trophies;if(!t)return;
 if(t.tarot){const p=t.tarot;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.dy,p.dx));
 // Outer card is exactly the damage rectangle: 24 along travel × 36 across it.
 ctx.fillStyle='#cc9cf6';ctx.fillRect(-12,-18,24,36);ctx.fillStyle='#19152e';ctx.fillRect(-10,-16,20,32);star(ctx,0,0,8,'#ffebad');ctx.restore();}
 for(const e of s.enemies||[])if(!e.dead&&e.trophyCharmLife>0)drawTrophyIcon(ctx,'fanclub',e.x,e.y-69,.4,'#f0ca70');
 const f=t.feedback;
 if(f?.life>0){const colors={ascendant:'#cc9cf6',badge:'#f0ca70',star:'#f68dbb',fanclub:'#f0ca70'};drawTrophyIcon(ctx,f.id,s.x-24,s.y-63,.55,colors[f.id]);
 ctx.save();ctx.font='bold 14px monospace';ctx.fillStyle=colors[f.id]||'#fff0c4';ctx.fillText(f.id==='star'?'+25 %':['ascendant','badge'].includes(f.id)&&f.amount?'−'+f.amount:'',s.x+28,s.y-44);ctx.restore();}
 if(t.starLife>0&&!reduced){ctx.save();ctx.fillStyle='#f39bc7';for(let i=0;i<3;i++)ctx.fillRect(s.x-45-i*5,s.y-33+i*10,20+i*4,2);ctx.restore();}
}
