/* Read-only, simulation-clock artwork. Sprite anatomy and combat ranges belong
   to their existing renderers; these short accents never define hit geometry. */
const GOLD='#ffd634', LIGHT='#fff3a6', PINK='#ff43aa', LILAC='#d0a6ff';
const GREEN='#a6f36d', SAGE='#dfefab';
const COLORS={car:GOLD,girlfriend:PINK,airplane:GOLD,muscle:PINK,truth:LILAC,followers:LILAC,ego:LILAC,money:GREEN,charisma:PINK,chopper:PINK,filter:SAGE,validation:GOLD,speed:GOLD,magnet:LILAC,detox:SAGE,billionaire:GOLD,viralLove:PINK,recovery:GREEN,payday:GOLD,barrier:LILAC};
const SHAPES={
  car:[-16,5,-16,-2,-11,-4,-7,-11,7,-11,12,-4,16,-2,16,5],
  girlfriend:[0,12,-13,-1,-13,-7,-8,-11,-3,-11,0,-7,3,-11,8,-11,13,-7,13,-1,0,12],
  airplane:[-16,1,-5,-2,1,-14,5,-14,3,-2,14,-2,17,1,3,4,5,13,1,13,-5,4,-13,5],
  muscle:[-13,8,-13,0,-9,-9,-6,-14,1,-14,3,-10,-1,-7,-4,-7,-5,0,0,2,5,-3,11,-2,15,3,14,9,8,13,-3,13],
  truth:[0,-16,14,0,0,16,-14,0]
};
// Hand-painted pixel glyphs. a is the power color, b is a pale accent;
// each row is batched into runs so badges stay cheap even in a busy frame.
const GLYPHS={
  followers:['......aaa......','......aba......','..aa..aaa..aa..','..ab.......ba..','..aa.aaaaa.aa..','.aaa.aaaaa.aaa.','aaaa.aaaaa.aaaa','aaaa.aaaaa.aaaa'],
  ego:['aaaaaaaaaaaaa','a...........a','a....bbbb...a','a...bbbbb...a','a...bb.bbb..a','a....bbbbb..a','a....b..b...a','a...aaaa....a','a..aaaaaa...a','aaaaaaaaaaaaa'],
  money:['...aaa.........','..aaaaa...aaaaa','aaaaaaaa..a.b.a','a..bbb.a..ababa','a.b...ba..a.b.a','a.b...ba..aaaaa','a..bbb.a.......','aaaaaaaa.......'],
  charisma:['..aaa...aaa....','.a...a.a...a...','a.....a.....a..','a...........a..','.a.........a...','..a.......a...b','...a.....a..bbb','....a...a.....b','.....a.a.......','......a........'],
  chopper:['..........aa...','...........a...','.....aaaa..a...','...aa...a.aa...','..a..aaa.a.a...','.aaa.a..a.aaa..','a...aaa..a...a.','a.b.a....a.b.a.','a...a....a...a.','.aaa......aaa..'],
  filter:['aaaa.......aaaa','a.............a','a..........b..a','..........bbb..','.........bbbbb.','..........bbb..','...........b...','a.............a','a.............a','aaaa.......aaaa'],
  validation:['............aa.','...........aaa.','..........aaa..','.........aaa...','..aa....aaa....','..aaa..aaa.....','...aaaaaa......','....aaaa.......','.....aa........'],
  speed:['......aaaaaa...','......a....a...','......abbbba...','......a....a...','......a....a...','.....aa...aa...','...aaa....a....','.aaa......aa...','a..........a...','aaaaaaaaaaaa...'],
  magnet:['..aaa.....bbb..','..aaa.....bbb..','..aaa.....aaa..','..a.a.....a.a..','..a.a.....a.a..','..a.a.....a.a..','..a..a...a..a..','...a..aaa..a...','....a.....a....','.....aaaaa.....'],
  detox:['aaaaaaaa.......','a......a.......','a.b.bb.a....b..','a......a....b..','aaaa..aa..bbbbb','..a..a......b..','..aaa.......b..'],
  billionaire:['...aaaa...bbbbb','..a....a..b.a.b','.aaaaaaaa.babab','a........ab.a.b','aaaaaaaaaabbbbb','.aa....aa......','.......b.......','......bbb......','.......b.......'],
  viralLove:['.aa.aa...aa.aa.','ab.a.ba.ab.a.ba','a.....a.a.....a','.a...a...a...a.','..a.a.....a.a..','...a.......a...','....b.....b....','.....b...b.....','......bbb......','.......b.......'],
  recovery:['.....bbbbb.....','....bbbbbbb....','.....a...a.....','....aaaaaaa....','....a.....a....','....a..b..a....','....a.bbb.a....','....a..b..a....','....a.....a....','.....aaaaa.....'],
  payday:['...bbbbbbbbb...','...baaaaaaab...','...ba.....ab...','...ba...b.ab...','...ba.bbb.ab...','...ba..b..ab...','...ba.....ab...','...baaaaaaab...','...bbbbbbbbb...'],
  barrier:['..aaaaaaaaaaa..','.a...........a.','a......b......a','a.....bbb.....a','a...bbbbbbb...a','a.....bbb.....a','a....b...b....a','.aaaaaa..aaaaa.','......a.a......','......aa.......']
};
function pixelIcon(c,power,x,y,scale,solid){
  const rows=GLYPHS[power],unit=solid?Math.round(2*scale):2*scale,w=Math.max(...rows.map(r=>r.length));
  for(let row=0;row<rows.length;row++)for(let col=0;col<rows[row].length;){
    const value=rows[row][col],start=col;while(col<rows[row].length&&rows[row][col]===value)col++;
    if(value!=='.')rect(c,value==='a'?COLORS[power]:LIGHT,x+(start-w/2)*unit,y+(row-rows.length/2)*unit,(col-start)*unit,unit);
  }
}
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function segment(c,color,x,y,xx,yy,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x),Math.round(y));c.lineTo(Math.round(xx),Math.round(yy));c.stroke();}
function icon(c,power,x,y,scale=1,solid=false){
  if(GLYPHS[power]){pixelIcon(c,power,x,y,scale,solid);return;}
  const points=SHAPES[power];if(!points)return;
  c.fillStyle=solid?COLORS[power]:'#19152b';c.strokeStyle=solid?'#282035':COLORS[power];c.lineWidth=solid?3:2;c.beginPath();
  for(let i=0;i<points.length;i+=2){const px=Math.round(x+points[i]*scale),py=Math.round(y+points[i+1]*scale);if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}
  c.closePath();c.fill();c.stroke();
  if(power==='car'){
    if(solid)rect(c,'#563b4f',x-7*scale,y-8*scale,14*scale,5*scale);
    segment(c,LIGHT,x-10*scale,y-3*scale,x+10*scale,y-3*scale);
    rect(c,GOLD,x-12*scale,y+4*scale,5*scale,4*scale);rect(c,GOLD,x+7*scale,y+4*scale,5*scale,4*scale);
  }else if(power==='truth'){
    segment(c,LIGHT,x-11*scale,y,x+11*scale,y);segment(c,GOLD,x,y-12*scale,x,y+12*scale);
  }else if(power==='airplane')segment(c,LIGHT,x-9*scale,y+1*scale,x+12*scale,y+1*scale);
  else if(power==='muscle')segment(c,'#ffd0ed',x-5*scale,y+5*scale,x+7*scale,y+6*scale);
}
function corners(c,color,x,y,w,h){
  for(let i=0;i<4;i++){const sx=i%2?-1:1,sy=i<2?1:-1,xx=x+(i%2?w:0),yy=y+(i<2?0:h);
    segment(c,color,xx,yy+sy*12,xx,yy,3);segment(c,color,xx,yy,xx+sx*12,yy,3);
  }
}
function chevrons(c,x,y,t,count){for(let i=0;i<count;i++){const xx=x+i*15+Math.floor(t*4)*2;segment(c,GOLD,xx-4,y-4,xx+2,y);segment(c,LIGHT,xx+2,y,xx-4,y+4);}}
function spark(c,color,x,y,size=4){rect(c,color,x-size,y,size*2+2,2);rect(c,color,x,y-size,2,size*2+2);}
function defense(c,x,y){
  const points=[[-35,-8],[-38,-55],[-24,-80],[0,-88],[24,-80],[38,-55],[35,-8]];
  for(let i=1;i<points.length;i++){
    const [a,b]=points[i-1],[aa,bb]=points[i];
    segment(c,'#59405a',x+a,y+b,x+aa,y+bb,6);
    segment(c,i%2?GOLD:LIGHT,x+a,y+b,x+aa,y+bb,3);
  }
  segment(c,GOLD,x-38,y-45,x-31,y-38,3);segment(c,GOLD,x+38,y-45,x+31,y-38,3);
}
function bills(c,x,y,t){
  for(let n=0;n<3;n++){
    const xx=x+24+n*11,yy=y-15+n*13-Math.floor(t*5);
    rect(c,'#23382b',xx-2,yy-2,22,13);rect(c,GREEN,xx,yy,18,9);
    rect(c,'#507d42',xx+2,yy+2,14,5);rect(c,LIGHT,xx+8,yy+2,3,5);
  }
}
function acquisitionMoment(c,s,e,t){
  const x=s.x,y=s.y,color=COLORS[e.power];
  if(e.power==='money'||e.power==='billionaire')bills(c,x+7,y-49,t);
  else if(e.power==='charisma'||e.power==='viralLove'){
    icon(c,'girlfriend',x-42,y-48-t*6,.65,true);icon(c,'girlfriend',x+43,y-32-t*8,.5,true);
  }else if(e.power==='speed'){
    for(let n=0;n<3;n++)segment(c,n===1?LIGHT:GOLD,x-47-n*6,y-10+n*7,x-29,y-10+n*7,3);
  }else if(e.power==='magnet'){
    for(const side of [-1,1]){
      segment(c,LILAC,x+side*53,y-24,x+side*32,y-18,3);
      segment(c,LIGHT,x+side*32,y-18,x+side*37,y-27,3);
    }
  }else if(e.power==='chopper'){
    for(let n=0;n<3;n++){
      rect(c,PINK,x-62-n*5,y-26+n*10,34+n*4,3);rect(c,GOLD,x-44,y-26+n*10,16,1);
    }
  }else if(e.power==='detox'||e.power==='recovery'){
    spark(c,color,x-36,y-30,8);spark(c,LIGHT,x+35,y-57,5);
    segment(c,color,x-33,y-11,x-33,y-19,3);segment(c,color,x+35,y-34,x+35,y-44,3);
  }else if(e.power==='validation'||e.power==='barrier'){
    for(const side of [-1,1]){
      segment(c,color,x+side*28,y-67,x+side*39,y-50,4);
      segment(c,color,x+side*39,y-50,x+side*34,y-19,4);
      segment(c,LIGHT,x+side*34,y-19,x+side*24,y-10,3);
    }
  }
}
function progress(s,e){return(s.elapsed-e.start)/e.life;}
function alive(t){return Number.isFinite(t)&&t>=0&&t<1;}
function newestAcquisition(s,effects){for(let i=effects.length-1;i>=Math.max(0,effects.length-16);i--)if(effects[i].kind==='acquire'&&alive(progress(s,effects[i])))return effects[i];return null;}
function fade(c,t){c.globalAlpha=Math.min(1,(1-t)*2);}

// These bars are snapshots of actual restoration, never promises of healing.
function restoration(c,s,e){
  if(!Number.isFinite(e.from)||!Number.isFinite(e.to)||!(e.maximum>0))return;
  const x=s.x-20,y=s.y-136,shield=e.power==='barrier'||e.power==='validation';
  const before=Math.max(0,Math.min(1,e.from/e.maximum)),after=Math.max(0,Math.min(1,e.to/e.maximum));
  rect(c,'#171727',x-2,y-2,44,7);
  rect(c,shield?GOLD:GREEN,x,y,Math.round(after*40),3);
  rect(c,shield?'#947348':'#548748',x,y,Math.round(before*40),3);
  if(e.amount>0)amountLabel(c,shield?GOLD:GREEN,s.x+24,y+5,e.amount);
}
function amountLabel(c,color,x,y,amount){
  c.font='bold 10px monospace';c.textAlign='left';c.fillStyle=color;c.fillText('+'+Math.round(amount),Math.round(x),Math.round(y));
}
function localLink(c,e,color,t){
  if(!Number.isFinite(e.tx)||!Number.isFinite(e.ty))return;
  const dx=e.tx-e.x,dy=e.ty-e.y,d=Math.hypot(dx,dy);if(d<1)return;
  const length=Math.min(30,d),ux=dx/d,uy=dy/d;
  for(let n=0;n<3;n++){const a=(n+.25+t*.5)*length/3,b=Math.min(length,a+4);segment(c,color,e.x+ux*a,e.y+uy*a,e.x+ux*b,e.y+uy*b);}
}
function useCue(c,e,t){
  const color=COLORS[e.power];
  if(e.power==='charisma'&&e.kind==='slow'){
    if(!Number.isFinite(e.tx)||!Number.isFinite(e.ty))return;
    const dx=e.x-e.tx,dy=e.y-e.ty,d=Math.hypot(dx,dy);if(d<.01)return;
    const ux=dx/d,uy=dy/d;
    for(const side of [-1,1])segment(c,PINK,e.x-ux*5-uy*side*3,e.y-uy*5+ux*side*3,e.x-ux*8-uy*side*3,e.y-uy*8+ux*side*3);
  }else if(e.power==='magnet'&&e.kind==='attract')localLink(c,e,color,t);
  else if(e.power==='viralLove'&&e.kind==='bounce'){spark(c,PINK,e.x,e.y,3);localLink(c,e,PINK,t);}
  else if((e.power==='detox'&&e.kind==='heal')||(e.power==='money'&&(e.kind==='collect'||e.kind==='heal')))spark(c,GREEN,e.x+31,e.y-26-t*9,7);
  else if(e.power==='validation'&&e.kind==='recharge'){
    segment(c,GOLD,e.x+27,e.y-42,e.x+34,e.y-35,4);segment(c,GOLD,e.x+34,e.y-35,e.x+47,e.y-52,4);
  }else if(e.power==='filter'&&e.kind==='resist'){
    corners(c,SAGE,e.x-25,e.y-63,50,60);spark(c,SAGE,e.x+30,e.y-63,3);
  }else if(e.power==='chopper'&&e.kind==='activate'){
    const dx=Number.isFinite(e.tx)?e.tx-e.x:1,dy=Number.isFinite(e.ty)?e.ty-e.y:0,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
    for(let n=-1;n<=1;n++){segment(c,PINK,e.x-ux*(52+t*12)-uy*n*8,e.y-uy*(52+t*12)+ux*n*8,e.x-ux*12-uy*n*8,e.y-uy*12+ux*n*8,4);segment(c,GOLD,e.x-ux*34-uy*n*8,e.y-uy*34+ux*n*8,e.x-ux*17-uy*n*8,e.y-uy*17+ux*n*8,2);}
  }else if(e.power==='chopper'&&e.kind==='impact'){
    spark(c,LIGHT,e.x,e.y,6);const dx=Number.isFinite(e.tx)?e.tx-e.x:1,dy=Number.isFinite(e.ty)?e.ty-e.y:0,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;for(let n=-1;n<=1;n++)segment(c,n?PINK:GOLD,e.x+ux*10-uy*n*7,e.y+uy*10+ux*n*7,e.x+ux*(25+t*6)-uy*n*12,e.y+uy*(25+t*6)+ux*n*12,4);
  }else if((e.power==='money'&&e.kind==='activate')||(e.power==='billionaire'&&e.kind==='volley')){
    bills(c,e.x,e.y-24,t); spark(c,LIGHT,e.x+30,e.y-35,4);
  }
}

export class PowerArt{
  drawGround(c,s,effects,reduced=false){
    const acquiring=newestAcquisition(s,effects);
    for(let i=Math.max(0,effects.length-16);i<effects.length;i++){
      const e=effects[i],t=progress(s,e);if(!alive(t)||(e.kind==='acquire'&&e!==acquiring)||(reduced&&!(e.power==='truth'&&e.kind==='activate')))continue;
      c.save();if(!reduced)fade(c,t);
      if(e.power==='truth'&&e.kind==='activate'){
        const r=e.r||150;
        // The outer edge is the actual instantaneous range, never a travelling wave.
        c.strokeStyle=reduced?LILAC:'#251e37';c.lineWidth=reduced?2:5;
        c.beginPath();c.arc(e.x,e.y,r-c.lineWidth/2,0,Math.PI*2);c.stroke();
        if(!reduced){c.strokeStyle=LILAC;c.lineWidth=3;c.beginPath();c.arc(e.x,e.y,r-1.5,0,Math.PI*2);c.stroke();}
      }
      if(reduced){c.restore();continue;}
      if(e.power==='car')chevrons(c,e.x-38,e.y+(e.kind==='activate'?40:5),t,e.kind==='activate'?8:5);
      if(e.power==='girlfriend'&&e.kind==='acquire'){
        const g=s.girl||e;
        for(let n=0;n<8;n++){const a=n*Math.PI/4;rect(c,PINK,g.x+Math.cos(a)*27,g.y+Math.sin(a)*7+4,4,2);}
      }
      if(e.kind==='acquire'){
        if(e.power==='speed')chevrons(c,s.x-18,s.y+6,t,3);
        if(e.power==='charisma'||e.power==='magnet'){
          const color=COLORS[e.power];for(let n=0;n<8;n++){const a=n*Math.PI/4;segment(c,color,s.x+Math.cos(a)*32,s.y+Math.sin(a)*9+3,s.x+Math.cos(a+.2)*32,s.y+Math.sin(a+.2)*9+3);}
        }
      }
      c.restore();
    }
  }
  drawForeground(c,s,effects,reduced=false){
    const acquiring=newestAcquisition(s,effects);
    let reducedUse=null;
    if(reduced)for(let i=effects.length-1;i>=Math.max(0,effects.length-16);i--){const e=effects[i];if(e.kind==='acquire'||!alive(progress(s,e))||!COLORS[e.power])continue;if((e.power==='magnet'&&e.kind==='attract')||(e.power==='charisma'&&e.kind==='slow')||(e.power==='billionaire'&&e.kind==='volley'))continue;if(acquiring&&Math.hypot(e.x-s.x,e.y-s.y)<72)continue;reducedUse=e;break;}
    let acquiringAirplane=false;
    for(let i=Math.max(0,effects.length-16);i<effects.length;i++){
      const e=effects[i];if(e===acquiring&&e.power==='airplane'&&e.kind==='acquire'&&alive(progress(s,e)))acquiringAirplane=true;
    }
    if(s.airplane?.active){
      c.save();
      if(!reduced)defense(c,s.x,s.y);
      if(!acquiringAirplane)icon(c,'airplane',s.x-22,s.y-98,.65);c.restore();
    }
    for(let i=Math.max(0,effects.length-16);i<effects.length;i++){
      const e=effects[i],t=progress(s,e);if(!alive(t)||!COLORS[e.power]||(e.kind==='acquire'&&e!==acquiring))continue;
      if(reduced&&e.kind!=='acquire'&&e!==reducedUse)continue;
      if(reduced&&((e.power==='magnet'&&e.kind==='attract')||(e.power==='charisma'&&e.kind==='slow')||(e.power==='billionaire'&&e.kind==='volley')))continue;
      if(reduced&&e.power==='airplane'&&e.kind==='activate'&&(s.airplane?.active||acquiringAirplane))continue;
      c.save();
      if(reduced){
        // Reduced mode has no interpolation, pulse, floor mark or particle shower.
        const local=GLYPHS[e.power]&&Math.hypot(e.x-s.x,e.y-s.y)<72;
        const x=e.kind==='acquire'||local?s.x:e.x,y=e.kind==='acquire'||local?s.y-94:e.y-32;
        icon(c,e.power,x,y,e.kind==='collect'?.4:.8);c.restore();continue;
      }
      fade(c,t);
      if(e.kind==='acquire'){
        icon(c,e.power,s.x,s.y-105-Math.floor(t*6),e.power==='payday'?2.3:1.6,true);
        acquisitionMoment(c,s,e,t);
        const color=COLORS[e.power];
        // Four deterministic pixels, never allocated particles.
        for(let n=0;n<4;n++){const a=n*Math.PI/2+Math.PI/4,r=23+t*9;rect(c,color,s.x+Math.cos(a)*r-1,s.y-96+Math.sin(a)*r-t*10,3,3);}
        if(e.power==='girlfriend'){
          const g=s.girl||e;icon(c,'girlfriend',g.x-33,g.y-62-t*8,.7,true);icon(c,'girlfriend',g.x+31,g.y-38-t*10,.5,true);
        }else if(e.power==='muscle'){
          corners(c,PINK,s.x-28,s.y-72,56,74);spark(c,'#ffd0ed',s.x+36,s.y-72-t*6);spark(c,PINK,s.x-36,s.y-20+t*4,3);
        }else if(e.power==='airplane'&&!s.airplane?.active)defense(c,s.x,s.y);
        else if(e.power==='truth')spark(c,LILAC,s.x-26,s.y-50,3);
        else if(e.power==='filter')corners(c,SAGE,s.x-27,s.y-73,54,75);
        else if(e.power==='ego'||e.power==='recovery'||e.power==='barrier'||e.power==='validation'){
          restoration(c,s,e);if(e.power==='ego')corners(c,LILAC,s.x-28,s.y-73,56,75);
        }else if(e.power==='followers'&&Number.isFinite(e.tx)&&Number.isFinite(e.ty)){
          for(let n=0;n<3;n++){const u=Math.min(1,Math.max(0,t*1.4-n*.14));rect(c,LILAC,s.x+(e.tx-s.x)*u,s.y-80+(e.ty-(s.y-80))*u,5,5);}
        }
        else if(e.power==='payday'&&e.amount===8){
          // Eight real reward coins converge on a local +8 counter, not new drops.
          amountLabel(c,LIGHT,s.x+30,s.y-93,e.amount);
          for(let n=0;n<8;n++){const a=n*Math.PI/4,u=Math.min(1,t*1.5),xx=s.x+Math.cos(a)*27,yy=s.y-43+Math.sin(a)*24;rect(c,GOLD,xx+(s.x+22-xx)*u,yy+(s.y-98-yy)*u,4,4);}
        }
      }else if(e.power==='girlfriend'&&e.kind==='collect'){
        icon(c,'girlfriend',e.x-24,e.y-38-t*15,.6,true);icon(c,'girlfriend',e.x+23,e.y-29-t*12,.4,true);
      }else if(e.power==='airplane'&&e.kind==='activate'){
        if(!s.airplane?.active)defense(c,e.x,e.y);
        spark(c,LIGHT,e.x-38,e.y-53,6);spark(c,GOLD,e.x+38,e.y-22,5);
      }else if(e.power==='truth'&&e.kind==='activate'){
        // Every shard reaches the actual radius from frame zero. Nothing travels
        // outward and there is no filled disc to conceal enemies or gas warnings.
        const r=e.r||150;c.globalAlpha=.72*(1-t);
        for(let n=0;n<12;n++){const a=n*Math.PI/6,inner=r*(n%2?.83:.76);segment(c,n%2?LILAC:LIGHT,e.x+Math.cos(a)*inner,e.y+Math.sin(a)*inner,e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,2);}
        // Local impact rays match the approved burst around the torso. Both
        // endpoints are fixed from first frame; only opacity changes with age.
        for(let color=0;color<2;color++){
          c.strokeStyle=color?LILAC:LIGHT;c.lineWidth=2;c.beginPath();
          for(let n=color;n<8;n+=2){const a=n*Math.PI/4+.12;
            c.moveTo(Math.round(e.x+Math.cos(a)*36),Math.round(e.y-35+Math.sin(a)*36));
            c.lineTo(Math.round(e.x+Math.cos(a)*65),Math.round(e.y-35+Math.sin(a)*65));
          }c.stroke();
        }
        spark(c,LIGHT,e.x,e.y,6);spark(c,LILAC,e.x,e.y,3);
      }else if(GLYPHS[e.power])useCue(c,e,t);
      c.restore();
    }
  }
}
