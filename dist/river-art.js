import {riverSection} from './biomes.js';

// Ground-only art: no obstacles, world mutation, animation or additional cache.
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
function bridge(c,x,y){
 // Road surface stays level and unobstructed; the exposed masonry below its
 // near edge supplies depth without painting a raised wall across the route.
 rect(c,'#24343d',x-78,y-59,156,137);
 rect(c,'#514759',x-78,y-58,156,116);
 rect(c,'#655969',x-77,y-56,154,6);
 rect(c,'#756671',x-77,y+48,154,10);
 for(let row=-42;row<49;row+=16){
  rect(c,'#615466',x-75,y+row,150,1);
  for(let col=-68;col<76;col+=28)rect(c,'#756473',x+col+(row%32===-10?8:0),y+row-10,2,2);
 }
 // Arch cutout is filled with the shaded stream, not erased (tiles are opaque).
 rect(c,'#71616e',x-77,y+58,154,19);
 c.fillStyle='#203f4a';c.beginPath();c.moveTo(x-57,y+79);c.quadraticCurveTo(x-52,y+57,x,y+61);c.quadraticCurveTo(x+52,y+57,x+57,y+79);c.closePath();c.fill();
 c.strokeStyle='#a38b8c';c.lineWidth=4;c.beginPath();c.moveTo(x-61,y+79);c.quadraticCurveTo(x-56,y+53,x,y+57);c.quadraticCurveTo(x+56,y+53,x+61,y+79);c.stroke();
 for(const side of [-1,1]){
  const rail=y+side*58;
  // Open iron balustrade, low enough that actors always remain legible.
  rect(c,'#252b3d',x-65,rail-13,130,3);
  for(let xx=-58;xx<=58;xx+=14){rect(c,'#252b3d',x+xx,rail-11,3,11);rect(c,'#8c7d8b',x+xx,rail-10,1,8);}
  rect(c,'#a59699',x-65,rail-14,130,2);rect(c,'#b4a09c',x-65,rail-1,130,2);
  for(const end of [-1,1]){
   const px=x+end*72;
   rect(c,'#302d40',px-7,rail-19,14,23);rect(c,'#82717c',px-6,rail-18,12,21);
   rect(c,'#b4a09a',px-6,rail-19,12,3);rect(c,'#c6afa3',px-6,rail-16,2,17);rect(c,'#574c60',px+3,rail-16,3,19);
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
   const a=riverSection(lane,wy+row),x=a.x-wx,w=a.halfWidth;
   rect(c,'#354b43',x-w-12,row,w*2+24,2);
   rect(c,'#666c5c',x-w-7,row,w*2+14,2);
   rect(c,'#527675',x-w,row,w*2,2);
   rect(c,'#2d5360',x-w+5,row,w*2-10,2);
   rect(c,'#345f68',x-w+12,row,w*2-22,2);
  }
  for(let ay=Math.floor((wy-24)/16)*16;ay<wy+280;ay+=16){
   const a=riverSection(lane,ay),r=randomAt(lane,ay,seed+201),x=a.x-wx,y=ay-wy;
   for(let i=0;i<4;i++)rect(c,i%2?'#6f9695':'#86aaa2',x-a.halfWidth+5+r()*(a.halfWidth*2-16),y+r()*12,3+r()*7,1);
   for(const side of [-1,1]){
    const bx=x+side*(a.halfWidth+3),by=y+(r()-.5)*5,w=4+r()*5,h=3+r()*5;
    stone(c,bx,by,w,h);
    if(r()>.58){
     const rx=bx+side*6;
     for(let i=0;i<3;i++){
      c.strokeStyle=i%2?'#9b9c59':'#697e4f';c.lineWidth=1;c.beginPath();c.moveTo(Math.round(rx+i),Math.round(by+3));c.lineTo(Math.round(rx+i+(i-1)*2),Math.round(by-4-r()*8));c.stroke();
     }
    }
   }
  }
  // Small pale stones communicate that the stream can be crossed anywhere.
  for(let fy=Math.ceil((wy-12-256)/512)*512+256;fy<wy+268;fy+=512){
   const a=riverSection(lane,fy);
   for(let i=0;i<6;i++)stone(c,a.x-wx-a.halfWidth+5+i*(a.halfWidth*2-10)/5,fy-wy+(i%2)*4,4,3);
  }
  for(let by=Math.ceil((wy-80)/512)*512;by<=wy+336;by+=512)bridge(c,1024+lane*4096-wx,by-wy);
 }
 c.restore();
}
