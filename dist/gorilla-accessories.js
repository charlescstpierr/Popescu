// Geometry approved in the November 6 mockup. Draw only into ActorArt's cached
// whole-body cell; gait, world coordinates, hitboxes and saved state stay unchanged.
const box=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const poly=(c,color,pts)=>{c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
function heart(c,x,y){
 poly(c,'#1d1129',[[x-15,y-5],[x-11,y-11],[x-5,y-11],[x,y-6],[x+5,y-11],[x+12,y-11],[x+16,y-5],[x+15,y+4],[x,y+18],[x-15,y+4]]);
 poly(c,'#ed58a4',[[x-12,y-4],[x-9,y-8],[x-5,y-8],[x,y-3],[x+5,y-8],[x+11,y-8],[x+13,y-4],[x+12,y+3],[x,y+14],[x-12,y+3]]);
 poly(c,'#ffb3d6',[[x-10,y-4],[x-8,y-6],[x-5,y-6],[x-3,y-4],[x-5,y-2],[x-8,y-2]]);
 poly(c,'#311a3c',[[x+2,y-9],[x-3,y-1],[x+2,y+2],[x-4,y+13],[x+7,y+1],[x+2,y-2],[x+6,y-9]]);
}
function tankPad(c,x,y,flip=1){
 c.save();c.translate(x,y);c.scale(flip,1);
 poly(c,'#211b2b',[[-12,-3],[-6,-12],[4,-14],[13,-7],[16,2],[11,9],[0,9],[-10,4]]);
 poly(c,'#94703e',[[-10,-2],[-5,-10],[4,-11],[11,-6],[13,2],[9,6],[0,6],[-8,3]]);
 poly(c,'#e1b95d',[[-8,-3],[-4,-8],[4,-9],[10,-5],[11,0],[0,2],[-7,0]]);
 poly(c,'#ffe9a2',[[-5,-7],[3,-8],[8,-5],[7,-3],[-5,-4]]);
 poly(c,'#5a4650',[[-5,3],[7,2],[8,5],[0,7],[-5,5]]);c.restore();
}
function gasCanister(c,x,y){
 poly(c,'#182222',[[x-10,y-15],[x-6,y-20],[x+5,y-20],[x+10,y-15],[x+10,y+16],[x+6,y+21],[x-6,y+21],[x-10,y+16]]);
 box(c,'#56632d',x-7,y-14,14,30);box(c,'#bddc43',x-5,y-15,10,29);box(c,'#edffa1',x-4,y-13,3,25);
 box(c,'#343c31',x-8,y-8,16,4);box(c,'#343c31',x-8,y+9,16,4);box(c,'#c5d8ba',x-5,y-19,10,4);
 poly(c,'#111a1c',[[x,y-3],[x-4,y+5],[x+4,y+5]]);box(c,'#f2f6b0',x,y,1,2);
}
const shoulderFront=[[[45,59],[96,66]],[[44,58],[101,65]],[[44,66],[101,74]],[[44,58],[101,64]]];
const shoulderBack=[[[50,62],[94,60]],[[49,64],[94,63]],[[48,64],[96,66]],[[49,63],[96,62]]];
const headFront=[[77,40],[77,39],[80,44],[81,39]];
const headBack=[[78,37],[78,40],[80,40],[78,40]];

export function drawGorillaAccessories(x,type,index,back){
 const frame=index%4;
 if(type==='jealous'){
  const [hx,hy]=back?[[64,62],[62,64],[65,64],[64,63]][frame]:[[73,79],[75,78],[78,84],[76,79]][frame];
  heart(x,hx,hy);
 }else if(type==='gas'){
  if(back){const [cx,cy]=[[60,62],[59,64],[61,65],[60,64]][frame];gasCanister(x,cx,cy);}
  else {const [cx,cy]=[[44,64],[43,64],[43,71],[43,63]][frame];gasCanister(x,cx,cy);}
 }else if(type==='sprinter'){
  const [hx,hy]=(back?headBack:headFront)[frame];
  poly(x,'#183043',[[hx-16,hy-5],[hx-2,hy-7],[hx+10,hy-3],[hx+12,hy+3],[hx+4,hy+4],[hx-3,hy],[hx-16,hy+2]]);
  poly(x,'#74d8e9',[[hx-14,hy-3],[hx-3,hy-5],[hx+8,hy-2],[hx+10,hy+1],[hx+4,hy+1],[hx-3,hy-2],[hx-14,hy]]);
  box(x,'#e6fffc',hx-10,hy-3,7,2);
  poly(x,'#14293b',[[hx-17,hy-1],[hx-20,hy+5],[hx-29,hy+9],[hx-28,hy+3],[hx-21,hy-2]]);
  poly(x,'#92edf1',[[hx-18,hy],[hx-21,hy+3],[hx-26,hy+6],[hx-25,hy+3],[hx-20,hy-1]]);
 }else if(type==='tank'){
  const anchors=(back?shoulderBack:shoulderFront)[frame];tankPad(x,...anchors[0],1);tankPad(x,...anchors[1],-1);
 }
}
