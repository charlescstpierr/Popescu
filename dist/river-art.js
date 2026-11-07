import {riverSection} from './biomes.js';

// Ground-only art: no obstacles, world mutation or additional tile cache.
// Every sample and random detail is anchored in world coordinates. The overlap
// includes the full height of stones, reeds and bridge fronts at tile edges.
const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function poly(c,color,points){c.fillStyle=color;c.beginPath();c.moveTo(...points[0].map(Math.round));for(let i=1;i<points.length;i++)c.lineTo(...points[i].map(Math.round));c.closePath();c.fill();}
function randomAt(lane,y,seed){let n=Math.imul(lane,374761393)^Math.imul(y,668265263)^(seed|0);return()=>{n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967296;};}
function stone(c,x,y,w,h){
 poly(c,'#293e44',[[x-w,y+1],[x-w*.5,y-h],[x+w*.6,y-h*.7],[x+w,y+2],[x+w*.3,y+h*.6],[x-w*.7,y+h*.6]]);
 poly(c,'#746d78',[[x-w,y-1],[x-w*.5,y-h],[x+w*.45,y-h*.8],[x+w*.8,y],[x+w*.2,y+h*.35],[x-w*.6,y+h*.3]]);
 poly(c,'#9b9090',[[x-w*.85,y-2],[x-w*.45,y-h+1],[x+w*.35,y-h*.75],[x+w*.05,y-1],[x-w*.4,y+h*.15]]);
 poly(c,'#565665',[[x+w*.05,y-1],[x+w*.35,y-h*.75],[x+w*.8,y],[x+w*.2,y+h*.35]]);
}
// The simulation river remains unchanged. The painted shallows breathe within
// the same 140px clear street corridor, narrowing beside the strongest bends.
function artSection(lane,y){
 const a=riverSection(lane,y),base=1024+lane*4096;
 const halfWidth=Math.min(a.halfWidth+9+5*Math.sin(y/63),58-Math.abs(a.x-base));
 return {...a,halfWidth};
}
function reeds(c,x,y,r){
 for(let i=0;i<6;i++){
  const bx=Math.round(x+i*2-5),height=9+r()*15;
  c.strokeStyle=i%2?'#b1ad69':'#7f925b';c.lineWidth=1;
  c.beginPath();c.moveTo(bx,Math.round(y));c.lineTo(Math.round(bx+(i-2.5)*1.5),Math.round(y-height));c.stroke();
  if(i%3===0)rect(c,'#c1b780',bx+(i-2.5)*1.5,y-height,2,4);
 }
}
function bridge(c,x,y){
 // Road surface stays level and unobstructed; the exposed masonry below its
 // near edge supplies depth without painting a raised wall across the route.
 rect(c,'#172c36',x-78,y-59,156,137);
 rect(c,'#514c54',x-78,y-58,156,116);
 rect(c,'#8d7d7b',x-77,y-56,154,6);
 rect(c,'#302f40',x-77,y-50,154,5);
 rect(c,'#8e7b78',x-77,y+48,154,10);
 for(let row=-42;row<49;row+=16){
  rect(c,'#3c3a46',x-75,y+row,150,1);
  rect(c,'#70656a',x-74,y+row+1,148,1);
  for(let col=-68;col<65;col+=28){const offset=row%32===-10?8:0;rect(c,'#3f3b46',x+col+offset,y+row-14,1,14);rect(c,'#7e716f',x+col+offset+2,y+row-12,12,1);}
 }
 // Arch cutout is filled with the shaded stream, not erased (tiles are opaque).
 rect(c,'#807076',x-77,y+58,154,19);
 for(let xx=-76;xx<76;xx+=19){rect(c,'#c3a695',x+xx,y+59,17,2);rect(c,'#493e50',x+xx,y+62,2,13);}
 rect(c,'#d5baa1',x-78,y+54,156,4);
 rect(c,'#322e40',x-78,y+58,156,3);
 rect(c,'#272d3e',x-78,y+76,156,3);
 c.fillStyle='#132e3b';c.beginPath();c.moveTo(x-57,y+79);c.quadraticCurveTo(x-52,y+57,x,y+61);c.quadraticCurveTo(x+52,y+57,x+57,y+79);c.closePath();c.fill();
 c.strokeStyle='#cfb49e';c.lineWidth=5;c.beginPath();c.moveTo(x-61,y+79);c.quadraticCurveTo(x-56,y+53,x,y+57);c.quadraticCurveTo(x+56,y+53,x+61,y+79);c.stroke();
 for(const side of [-1,1])poly(c,'#907e7d',[[x+side*13,y+58],[x+side*21,y+58],[x+side*24,y+65],[x+side*17,y+64]]);
 for(const side of [-1,1]){
  const rail=y+side*58;
  // Open iron balustrade, low enough that actors always remain legible.
  rect(c,'#1b2736',x-65,rail-13,130,4);
  for(let xx=-58;xx<=58;xx+=14){rect(c,'#1c2534',x+xx,rail-11,4,11);rect(c,'#a59288',x+xx,rail-10,1,8);}
  rect(c,'#dac1a8',x-65,rail-15,130,2);rect(c,'#c4aa98',x-65,rail-1,130,2);
  for(const end of [-1,1]){
   const px=x+end*72;
   rect(c,'#292c3c',px-7,rail-19,14,23);rect(c,'#8f7b7c',px-6,rail-18,12,21);
   rect(c,'#d9bfa4',px-6,rail-19,12,3);rect(c,'#d3b8a0',px-6,rail-16,2,17);rect(c,'#4b4256',px+3,rail-16,3,19);
  }
 }
}
export function drawRiverTile(c,tx,ty,seed=42){
 const wx=tx*256,wy=ty*256;
 const first=Math.ceil((wx-80-1024)/4096),last=Math.floor((wx+336-1024)/4096);
 if(first>last)return;
 c.save();
 for(let lane=first;lane<=last;lane++){
  for(let row=0;row<256;row+=2){
   const ay=wy+row,a=artSection(lane,ay),x=a.x-wx,w=a.halfWidth;
   const fringe=Math.min(5+2*Math.sin(ay/9)+2*Math.sin(ay/23),65-Math.abs(a.x-(1024+lane*4096))-w);
   rect(c,'#344c40',x-w-fringe-5,row,w*2+fringe*2+10,2);
   rect(c,'#52614c',x-w-fringe,row,w*2+fringe*2,2);
   rect(c,'#657460',x-w-2,row,w*2+4,2);
   rect(c,'#507879',x-w,row,w*2,2);
   rect(c,'#284d5a',x-w+4,row,w*2-8,2);
   rect(c,'#315b65',x-w+10,row,w*2-20,2);
   const current=x+Math.sin(ay/39)*w*.25;
   rect(c,'#35636c',current-w*.26,row,w*.52,2);
  }
  // Independent world grids keep highlights and bank clusters seamless even
  // where a tall reed or a boulder crosses the top of a cached tile.
  for(let ay=Math.floor((wy-36)/14)*14;ay<wy+292;ay+=14){
   const a=artSection(lane,ay),r=randomAt(lane,ay,seed+201),x=a.x-wx,y=ay-wy;
   for(let i=0;i<5;i++){
    const px=x-a.halfWidth+7+r()*(a.halfWidth*2-22),py=y+r()*12;
    rect(c,i%2?'#649397':'#83aaa6',px,py,3+r()*9,1);
    if(i===2)rect(c,'#416f79',px-3,py+2,13,1);
   }
  }
  for(let ay=Math.floor((wy-44)/28)*28;ay<wy+300;ay+=28){
   const a=artSection(lane,ay),r=randomAt(lane,ay,seed+417),x=a.x-wx,y=ay-wy;
   for(const side of [-1,1]){
    const group=r(),by=y+(r()-.5)*12;
    const w=group>.66?13+r()*6:4+r()*6,h=w*(.65+r()*.2);
    // Keep outer rock silhouette within the pre-existing clear corridor.
    const base=1024+lane*4096-wx;
    const bx=Math.max(base-69+w,Math.min(base+69-w,x+side*(a.halfWidth+2)));
    if(group>.14){
     stone(c,bx,by,w,h);
     if(group>.55)stone(c,bx-side*(w*.7),by+h*.65,4+r()*4,4+r()*3);
     if(group>.8)stone(c,bx+side*3,by-10,5+r()*4,4+r()*3);
    }
    if(group<.5)reeds(c,Math.max(base-56,Math.min(base+56,bx+side*4)),by+5,r);
    // Moss and low flowers are painted, never world props or obstacles.
    for(let i=0;i<5;i++){
     const px=Math.max(base-69,Math.min(base+67,bx+side*(6+r()*9))),py=by+8+r()*12;
     rect(c,i===0?'#b8b77b':'#7e8c55',px,py,2,2);
    }
   }
  }
  // Small pale stones communicate that the stream can be crossed anywhere.
  for(let fy=Math.ceil((wy-12-256)/512)*512+256;fy<wy+268;fy+=512){
   const a=artSection(lane,fy);
   for(let i=0;i<6;i++)stone(c,a.x-wx-a.halfWidth+5+i*(a.halfWidth*2-10)/5,fy-wy+(i%2)*4,4,3);
  }
  for(let by=Math.ceil((wy-80)/512)*512;by<=wy+336;by+=512)bridge(c,1024+lane*4096-wx,by-wy);
 }
 c.restore();
}

// The tile remains cached. Only these narrow, world-anchored surface marks flow.
export function drawRiverCurrent(c,left,top,width,height,seed=42,time=0,reduced=false){
 if(reduced)return;
 const first=Math.ceil((left-65-1024)/4096),last=Math.floor((left+width+65-1024)/4096);
 if(first>last)return;
 c.save();
 for(let lane=first;lane<=last;lane++){
  const travel=time*11+(seed%31)+lane*7;
  for(let row=Math.floor((top-travel-8)/32);row*32+travel<top+height;row++){
   const y=row*32+travel;
   if(y<top||y>=top+height||Math.abs(y-Math.round(y/512)*512)<=88)continue;
   const a=artSection(lane,y),r=randomAt(lane,row,seed+809);
   for(let i=0;i<3;i++){
    const span=3+r()*7,x=a.x+(r()-.5)*(a.halfWidth*2-24)-span/2;
    c.globalAlpha=.18+.08*Math.sin(time*.9+row+i);
    rect(c,i===0?'#a5c9bf':'#82afad',x,y+i*2,span,1);
   }
   if(row%3===0){
    c.globalAlpha=.19;
    const side=row%2===0?-1:1;
    rect(c,'#b8ccc0',a.x+side*(a.halfWidth-8)-2,y-2,4,1);
    rect(c,'#89b5b0',a.x+side*(a.halfWidth-10)-1,y+1,3,1);
   }
  }
 }
 c.restore();
}
