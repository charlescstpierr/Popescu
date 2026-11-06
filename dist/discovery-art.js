// Small, hand-drawn landmarks. Rendering never changes discovery state.
const rect=(ctx,color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
const polygon=(ctx,color,points)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
export function drawDiscovery(ctx,p,time=0,reduced=false){
  const color=p.discoveryType==='anomaly'?'#c6a1e8':p.color||'#c6bbff';
  ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
  rect(ctx,'#17172a',-36,-13,72,30);
  rect(ctx,'#4b4056',-34,-11,68,26);
  for(let x=-32;x<32;x+=12)rect(ctx,'#67576b',x,10,8,2);
  // Corner beacons communicate a walk-up discovery without blocking the road.
  for(const x of [-34,30])for(const y of [-13,12])rect(ctx,color,x,y,4,3);
  if(p.discoveryType==='ruin'){
    rect(ctx,'#443849',-29,-44,15,42);rect(ctx,'#a3939a',-27,-44,11,39);
    rect(ctx,'#443849',16,-56,15,54);rect(ctx,'#897d89',18,-54,11,49);
    rect(ctx,'#c0a9a4',-29,-47,17,7);rect(ctx,'#b4a3a5',14,-58,19,7);
    rect(ctx,'#5e5164',-17,-9,34,10);rect(ctx,'#baaaa8',-14,-11,14,6);
    for(let i=0;i<4;i++)rect(ctx,'#5b515d',-27,-35+i*9,11,2);
    polygon(ctx,'#807285',[[16,-54],[7,-54],[3,-47],[16,-47]]);
    rect(ctx,color,-5,-24,10,12);rect(ctx,'#f5edce',-2,-22,3,7);
    rect(ctx,'#62755e',-29,-1,10,4);rect(ctx,'#819466',21,-12,7,11);
  }else if(p.discoveryType==='cabin'){
    rect(ctx,'#302434',-30,-42,60,46);rect(ctx,'#865c49',-27,-41,54,42);
    for(let y=-37;y<0;y+=8){rect(ctx,'#b48358',-28,y,56,3);rect(ctx,'#533f3f',-28,y+3,56,2);}
    polygon(ctx,'#302434',[[-35,-41],[0,-66],[35,-41]]);
    polygon(ctx,'#676e65',[[-31,-43],[0,-62],[31,-43]]);
    rect(ctx,'#a8aa84',-31,-43,62,4);rect(ctx,'#302434',-4,-28,17,32);
    rect(ctx,'#b68b61',-2,-26,13,27);rect(ctx,'#f4cf7e',7,-12,2,3);
    rect(ctx,'#302434',-23,-31,15,16);rect(ctx,'#f2c574',-21,-29,11,12);
    rect(ctx,'#624943',-16,-29,2,12);rect(ctx,'#624943',-21,-24,11,2);
    rect(ctx,'#4d3c40',19,-63,8,16);rect(ctx,'#b5a79d',17,-65,12,4);
  }else if(p.discoveryType==='altar'){
    rect(ctx,'#30283d',-26,-4,52,12);rect(ctx,'#a899b5',-24,-5,48,7);
    rect(ctx,'#5b4a73',-16,-26,32,22);rect(ctx,'#9682af',-14,-26,28,20);
    rect(ctx,'#c2afcf',-22,-30,44,7);rect(ctx,'#5e467e',-24,-32,48,3);
    polygon(ctx,'#3d2d58',[[0,-66],[16,-49],[0,-34],[-16,-49]]);
    polygon(ctx,color,[[0,-62],[11,-49],[0,-38],[-11,-49]]);
    polygon(ctx,'#f9e9ff',[[0,-59],[0,-41],[-8,-49]]);
    for(const x of [-29,26]){rect(ctx,'#d6ba99',x,-24,3,20);rect(ctx,'#ffe8a0',x,-29,3,5);}
  }else if(p.discoveryType==='wreck'){
    // Deflated wheels, split windshield and detached hood: this cannot be driven.
    rect(ctx,'#100f1c',-31,-6,13,15);rect(ctx,'#100f1c',18,-6,13,15);
    rect(ctx,'#71535c',-29,3,11,4);rect(ctx,'#71535c',20,3,11,4);
    polygon(ctx,'#292437',[[-34,-8],[-32,-28],[-19,-31],[-11,-45],[17,-44],[25,-30],[34,-26],[32,3],[-30,3]]);
    polygon(ctx,'#a25f54',[[-31,-9],[-29,-26],[-16,-28],[-8,-41],[15,-40],[23,-27],[30,-23],[28,0],[-27,0]]);
    polygon(ctx,'#41576a',[[-12,-28],[-6,-38],[12,-37],[18,-27]]);
    polygon(ctx,'#b7c9bf',[[0,-37],[4,-32],[0,-29],[7,-27],[3,-32],[6,-37]]);
    rect(ctx,'#503746',-27,-17,53,9);rect(ctx,'#c38a61',-28,-18,10,4);
    rect(ctx,'#dcb77c',20,-18,7,4);rect(ctx,'#242333',-13,-16,27,9);
    polygon(ctx,'#c17b61',[[-31,-25],[-16,-33],[-9,-25],[-15,-18]]);
    rect(ctx,'#362b39',-20,-7,5,3);rect(ctx,'#362b39',17,-24,6,3);
    rect(ctx,color,2,-10,7,4);
  }else{
    rect(ctx,'#332a50',-23,-20,46,24);rect(ctx,'#7f6b96',-19,-23,38,6);
    const pulse=reduced?0:Math.floor(Math.sin(time*2)*2);
    // An open, fractured seal cannot be mistaken for the collectible XP diamond.
    ctx.lineCap='square';ctx.lineWidth=5;ctx.strokeStyle='#3c325a';
    for(const [start,end,r]of [[.15,1.4,19],[1.75,3.05,21],[3.45,4.8,18],[5.15,5.9,22]]){
      ctx.beginPath();ctx.arc(0,-43+pulse,r,start,end);ctx.stroke();
      ctx.lineWidth=2;ctx.strokeStyle=color;ctx.stroke();ctx.lineWidth=5;ctx.strokeStyle='#3c325a';
    }
    const crack=[[3,-66],[-4,-51],[3,-46],[-6,-31],[-2,-23]];
    ctx.lineWidth=3;ctx.strokeStyle='#211d35';ctx.beginPath();crack.forEach(([x,y],i)=>i?ctx.lineTo(x,y+pulse):ctx.moveTo(x,y+pulse));ctx.stroke();
    ctx.lineWidth=1;ctx.strokeStyle='#eed9ff';ctx.stroke();
    for(const [x,y]of [[-28,-47],[28,-35],[-16,-67],[19,-62]])rect(ctx,color,x,y,3,2);
  }
  ctx.restore();
}
