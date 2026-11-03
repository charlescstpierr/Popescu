/* Read-only, simulation-clock artwork. Sprite anatomy and combat ranges belong
   to their existing renderers; these short accents never define hit geometry. */
const GOLD='#ffd634', LIGHT='#fff3a6', PINK='#ff43aa', CYAN='#71eeff', LILAC='#d0a6ff';
const COLORS={car:GOLD,girlfriend:PINK,airplane:CYAN,muscle:PINK,truth:CYAN};
const SHAPES={
  car:[-16,5,-16,-2,-11,-4,-7,-11,7,-11,12,-4,16,-2,16,5],
  girlfriend:[0,12,-13,-1,-13,-7,-8,-11,-3,-11,0,-7,3,-11,8,-11,13,-7,13,-1,0,12],
  airplane:[-16,1,-5,-2,1,-14,5,-14,3,-2,14,-2,17,1,3,4,5,13,1,13,-5,4,-13,5],
  muscle:[-13,8,-13,0,-9,-9,-6,-14,1,-14,3,-10,-1,-7,-4,-7,-5,0,0,2,5,-3,11,-2,15,3,14,9,8,13,-3,13],
  truth:[0,-16,14,0,0,16,-14,0]
};
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function segment(c,color,x,y,xx,yy,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x),Math.round(y));c.lineTo(Math.round(xx),Math.round(yy));c.stroke();}
function icon(c,power,x,y,scale=1){
  const points=SHAPES[power];if(!points)return;
  c.fillStyle='#19152b';c.strokeStyle=COLORS[power];c.lineWidth=2;c.beginPath();
  for(let i=0;i<points.length;i+=2){const px=Math.round(x+points[i]*scale),py=Math.round(y+points[i+1]*scale);if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}
  c.closePath();c.fill();c.stroke();
  if(power==='car'){
    segment(c,LIGHT,x-10*scale,y-3*scale,x+10*scale,y-3*scale);
    rect(c,GOLD,x-12*scale,y+4*scale,5*scale,4*scale);rect(c,GOLD,x+7*scale,y+4*scale,5*scale,4*scale);
  }else if(power==='truth'){
    segment(c,LIGHT,x-11*scale,y,x+11*scale,y);segment(c,CYAN,x,y-12*scale,x,y+12*scale);
  }else if(power==='airplane')segment(c,'#e1fcff',x-9*scale,y+1*scale,x+12*scale,y+1*scale);
  else if(power==='muscle')segment(c,'#ffd0ed',x-5*scale,y+5*scale,x+7*scale,y+6*scale);
}
function corners(c,color,x,y,w,h){
  for(let i=0;i<4;i++){const sx=i%2?-1:1,sy=i<2?1:-1,xx=x+(i%2?w:0),yy=y+(i<2?0:h);
    segment(c,color,xx,yy+sy*9,xx,yy);segment(c,color,xx,yy,xx+sx*9,yy);
  }
}
function chevrons(c,x,y,t,count){for(let i=0;i<count;i++){const xx=x+i*15+Math.floor(t*4)*2;segment(c,GOLD,xx-4,y-4,xx+2,y);segment(c,LIGHT,xx+2,y,xx-4,y+4);}}
function spark(c,color,x,y,size=4){rect(c,color,x-size,y,size*2+2,2);rect(c,color,x,y-size,2,size*2+2);}
function progress(s,e){return(s.elapsed-e.start)/e.life;}
function alive(t){return Number.isFinite(t)&&t>=0&&t<1;}
function fade(c,t){c.globalAlpha=Math.min(1,(1-t)*2);}

export class PowerArt{
  drawGround(c,s,effects,reduced=false){
    if(reduced)return;
    for(let i=Math.max(0,effects.length-16);i<effects.length;i++){
      const e=effects[i],t=progress(s,e);if(!alive(t))continue;
      c.save();fade(c,t);
      if(e.power==='car')chevrons(c,e.x-38,e.y+(e.kind==='activate'?40:5),t,e.kind==='activate'?8:5);
      if(e.power==='girlfriend'&&e.kind==='acquire'){
        const g=s.girl||e;
        for(let n=0;n<8;n++){const a=n*Math.PI/4;rect(c,PINK,g.x+Math.cos(a)*27,g.y+Math.sin(a)*7+4,4,2);}
      }
      c.restore();
    }
  }
  drawForeground(c,s,effects,reduced=false){
    let acquiringAirplane=false;
    for(let i=Math.max(0,effects.length-16);i<effects.length;i++){
      const e=effects[i];if(e.power==='airplane'&&e.kind==='acquire'&&alive(progress(s,e)))acquiringAirplane=true;
    }
    if(s.airplane?.active){
      c.save();
      if(!reduced)corners(c,CYAN,s.x-28,s.y-74,56,76);
      if(!acquiringAirplane)icon(c,'airplane',s.x-22,s.y-90,.65);c.restore();
    }
    for(let i=Math.max(0,effects.length-16);i<effects.length;i++){
      const e=effects[i],t=progress(s,e);if(!alive(t)||!COLORS[e.power])continue;
      if(reduced&&e.power==='airplane'&&e.kind==='activate'&&(s.airplane?.active||acquiringAirplane))continue;
      c.save();
      if(reduced){
        // Reduced mode has no interpolation, pulse, floor mark or particle shower.
        const x=e.kind==='acquire'?s.x:e.x,y=e.kind==='acquire'?s.y-94:e.y-32;
        icon(c,e.power,x,y,e.kind==='collect'?.4:.8);c.restore();continue;
      }
      fade(c,t);
      if(e.kind==='acquire'){
        icon(c,e.power,s.x,s.y-94-Math.floor(t*10));
        const color=COLORS[e.power];
        // Four deterministic pixels, never allocated particles.
        for(let n=0;n<4;n++){const a=n*Math.PI/2+Math.PI/4,r=23+t*9;rect(c,color,s.x+Math.cos(a)*r-1,s.y-96+Math.sin(a)*r-t*10,3,3);}
        if(e.power==='girlfriend'){
          const g=s.girl||e;icon(c,'girlfriend',g.x-19,g.y-68-t*8,.48);icon(c,'girlfriend',g.x+19,g.y-50-t*10,.3);
        }else if(e.power==='muscle'){
          corners(c,PINK,s.x-28,s.y-72,56,74);spark(c,'#ffd0ed',s.x+36,s.y-72-t*6);spark(c,PINK,s.x-36,s.y-20+t*4,3);
        }else if(e.power==='airplane'&&!s.airplane?.active)corners(c,CYAN,s.x-28,s.y-74,56,76);
        else if(e.power==='truth')spark(c,LILAC,s.x-26,s.y-50,3);
      }else if(e.power==='girlfriend'&&e.kind==='collect'){
        icon(c,'girlfriend',e.x-9,e.y-38-t*15,.32);icon(c,'girlfriend',e.x+8,e.y-29-t*12,.22);
      }else if(e.power==='airplane'&&e.kind==='activate'){
        // A few broken local arcs indicate activation, not a defensive perimeter.
        for(let n=0;n<6;n++){const a=n*Math.PI/3+.15,r=46;segment(c,CYAN,e.x+Math.cos(a)*r,e.y-36+Math.sin(a)*r,e.x+Math.cos(a+.24)*r,e.y-36+Math.sin(a+.24)*r);rect(c,CYAN,e.x+Math.cos(a)*(48+t*15),e.y-36+Math.sin(a)*(48+t*15),3,3);}
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
        spark(c,CYAN,e.x,e.y,6);spark(c,LILAC,e.x,e.y,3);
      }
      c.restore();
    }
  }
}
