import {buildingGeometry,propForegroundBounds} from './prop-geometry.js';
import {biomeForChunk,riverSection} from './biomes.js';
import {drawRiverTile,drawRiverCurrent} from './river-art.js';
/* Original, deterministic pixel city. All positions are world coordinates. */
const INK='#100e20', TAU=Math.PI*2, PROP_CACHE_BYTES=8*1024*1024;
const LIGHT_COLORS={pink:'255,85,182',cyan:'109,229,238',gold:'255,190,100'};
const PALETTES=[
  {wall:'#47384f',lit:'#665066',shade:'#2d273e',brick:'#755365',neon:'#ff55b6',light:'#ffc0e5',sign:'EGO CLUB'},
  {wall:'#35394e',lit:'#525b70',shade:'#25283d',brick:'#626178',neon:'#6de5ee',light:'#c5fcff',sign:'SANS IA'},
  {wall:'#513a4c',lit:'#735261',shade:'#33263d',brick:'#926270',neon:'#ffb641',light:'#ffe5a5',sign:'LE LUXE'},
  {wall:'#3f354f',lit:'#5e4a70',shade:'#2c243f',brick:'#74547e',neon:'#c16aff',light:'#edc3ff',sign:'PIXEL BAR'},
  {wall:'#4a3f50',lit:'#685967',shade:'#312b40',brick:'#856b75',neon:'#ff656f',light:'#ffd5b6',sign:'404 LOVE'}
];
function hash(x,y,seed=0){let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(seed|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function rng(seed){let n=seed>>>0;return()=>{n+=0x6d2b79f5;let t=Math.imul(n^(n>>>15),n|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function canvas(w,h){if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}return null;}
function R(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function L(c,color,x0,y0,x1,y1,width=1){let x=Math.round(x0),y=Math.round(y0),tx=Math.round(x1),ty=Math.round(y1),dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1,e=dx-dy;c.fillStyle=color;for(let i=0;i<1400;i++){c.fillRect(x-Math.floor(width/2),y-Math.floor(width/2),width,width);if(x===tx&&y===ty)break;const t=e*2;if(t>-dy){e-=dy;x+=sx;}if(t<dx){e+=dx;y+=sy;}}}
function O(c,color,x,y,w,h,step=1){c.fillStyle=color;const rx=w/2,ry=h/2;for(let row=0;row<h;row+=step){const n=(row+step/2-ry)/ry,span=Math.sqrt(Math.max(0,1-n*n))*rx;c.fillRect(Math.round(x+rx-span),Math.round(y+row),Math.max(1,Math.round(span*2)),step);}}
// Pixel polygon fill, without antialiased diagonal edges.
function P(c,color,pts){let min=Infinity,max=-Infinity;for(const p of pts){min=Math.min(min,p[1]);max=Math.max(max,p[1]);}c.fillStyle=color;for(let y=Math.floor(min);y<=Math.ceil(max);y++){const hits=[];for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))hits.push(a[0]+(y+.5-a[1])/(b[1]-a[1])*(b[0]-a[0]));}hits.sort((a,b)=>a-b);for(let i=0;i<hits.length-1;i+=2)c.fillRect(Math.round(hits[i]),y,Math.max(1,Math.round(hits[i+1]-hits[i])),1);}}
function shadow(c,x,y,w,h,alpha=.44){c.save();c.globalAlpha=alpha;O(c,'#0a0b1c',x-w/2,y-h/2,w,h,2);c.restore();}
function star(c,x,y,color='#ffe7a6',s=3){R(c,color,x-s,y,s*2+1,1);R(c,color,x,y-s,1,s*2+1);R(c,'#fff4d4',x,y,1,1);}
const FONT={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'101111111111101',O:'010101101101010',P:'110101110100100',Q:'010101101111011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111',0:'111101101101111',1:'010110010010111',2:'110001010100111',3:'110001010001110',4:'101101111001001',5:'111100110001110',6:'011100111101111',7:'111001010010010',8:'111101111101111',9:'111101111001110','?':'110001010000010','!':'010010010000010','-':'000000111000000','/':'001001010100100',':':'000010000010000',"'":'010010000000000'};
function text(c,str,x,y,color,scale=1,align='left'){const width=(str.length*4-1)*scale;if(align==='center')x-=width/2;else if(align==='right')x-=width;c.fillStyle=color;for(let i=0;i<str.length;i++){const glyph=FONT[str[i].toUpperCase()];if(!glyph)continue;for(let p=0;p<15;p++)if(glyph[p]==='1')c.fillRect(Math.round(x+(i*4+p%3)*scale),Math.round(y+Math.floor(p/3)*scale),scale,scale);}}
function neon(c,str,x,y,color,scale=1,align='center'){c.save();c.shadowColor=color;c.shadowBlur=5;text(c,str,x,y,color,scale,align);c.restore();text(c,str,x,y,color,scale,align);}
function blot(c,x,y,w,h,color,random){const pts=[];for(let i=0;i<12;i++){const a=i/12*TAU,r=.72+random()*.28;pts.push([x+Math.cos(a)*w*.5*r,y+Math.sin(a)*h*.5*r]);}P(c,color,pts);return pts;}
function trailDistance(x,y){
  const wx=((x%512)+512)%512,wy=((y%512)+512)%512;
  return Math.min(Math.abs((wx>256?wx-512:wx)+11*Math.sin(y/79)),Math.abs((wy>256?wy-512:wy)+11*Math.sin(x/89)),
    Math.abs(wx-256+14*Math.sin(y/67)+4*Math.sin(y/23))+24,Math.abs(wy-256+14*Math.sin(x/71)+4*Math.sin(x/29))+24);
}

export class CityArt {
  constructor({now=()=>performance.now()}={}){this.now=now;this.cutaways=new Map();this.windowMask=null;this.tiles=new Map();this.props=new Map();this.propBytes=0;this.propMode=false;this.glows=new Map();this.lighting=new WeakMap();this.puddles=new WeakMap();this.ambience=new WeakMap();this.facadeDetails=new WeakMap();this.steamStrip=null;this.seed=null;}
  _glow(c,color,x,y,w,h,alpha=1){
    if(!c)return;
    if(!this.glows.has(color)){
      const image=canvas(96,96);if(!image)return;const gctx=image.getContext('2d'),g=gctx.createRadialGradient(48,48,0,48,48,48);
      const rgb=LIGHT_COLORS[color];
      g.addColorStop(0,`rgba(${rgb},.6)`);g.addColorStop(.3,`rgba(${rgb},.32)`);g.addColorStop(.65,`rgba(${rgb},.09)`);g.addColorStop(1,`rgba(${rgb},0)`);
      gctx.fillStyle=g;gctx.fillRect(0,0,96,96);this.glows.set(color,image);
    }
    c.save();c.globalAlpha=alpha;c.drawImage(this.glows.get(color),Math.round(x-w/2),Math.round(y-h/2),Math.round(w),Math.round(h));c.restore();
  }
  _emission(c,color,x,y,w,h,alpha){this._glow(this.lighting.get(c),color,x,y,w,h,alpha);}
  _wetPatches(tx,ty,seed){
    const patches=[];
    for(let i=0;i<2;i++){
      const n=hash(tx,ty,seed+417+i);if(n<.28)continue;
      const vertical=n>.64,a=hash(tx+i,ty,seed+421),b=hash(tx,ty+i,seed+425);
      patches.push({x:vertical?(tx%2===0?40:216):48+a*160,y:vertical?44+b*166:(ty%2===0?38:218),w:30+a*30,h:8+b*7,color:['pink','cyan','gold'][Math.floor(hash(tx+i,ty,seed+429)*3)],phase:n*TAU});
    }
    return patches;
  }
  _wetAsphalt(c,patches,tx,ty,seed){
    const random=rng(Math.floor(hash(tx,ty,seed+433)*4294967295));
    for(const p of patches){
      blot(c,p.x,p.y,p.w+5,p.h+3,'#202135',random);blot(c,p.x,p.y,p.w,p.h,'#282b40',random);
      const tint={pink:'#78516e',cyan:'#476679',gold:'#796550'}[p.color];
      for(let i=0;i<5;i++){const span=p.w*(.22+random()*.38);R(c,tint,p.x-span/2+(random()-.5)*8,p.y-p.h/3+i*p.h/7,span,1);}
      R(c,'#535366',p.x-p.w*.28,p.y-p.h*.46,p.w*.35,1);
    }
  }
  _manhole(c,x,y){
    O(c,'#1c1c2e',x-15,y-9,31,19);O(c,'#4c4659',x-14,y-9,28,16);O(c,'#2c2b3e',x-12,y-7,24,12);
    for(let i=-8;i<=8;i+=4)L(c,'#51485c',x+i,y-4,x+i+3,y+3);
    R(c,'#726073',x-8,y-8,12,1);R(c,'#151b2c',x-9,y-1,3,2);R(c,'#151b2c',x+7,y,3,2);
  }
  _trimProps(){
    while(this.props.size>96||this.propBytes>PROP_CACHE_BYTES){
      const key=this.props.keys().next().value;this.propBytes-=this.props.get(key).bytes;this.props.delete(key);
    }
  }
  _cutaway(item,p,windows){
    const key=windows.map(a=>`${Math.round(a.x-p.x)}:${Math.round(a.y-p.y)}:${a.r}:${a.alpha.toFixed(3)}`).join('|');
    if(item.cutaway&&item.windowKey===key)return item.cutaway;
    if(!this.windowMask){
      this.windowMask=canvas(140,140);if(!this.windowMask)return item.image;
      const c=this.windowMask.getContext('2d'),g=c.createRadialGradient(70,70,0,70,70,70);
      g.addColorStop(0,'rgba(0,0,0,.97)');g.addColorStop(.55,'rgba(0,0,0,.94)');g.addColorStop(.8,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=g;c.fillRect(0,0,140,140);
    }
    if(!item.cutaway){
      item.cutaway=canvas(item.image.width,item.image.height);if(!item.cutaway)return item.image;
      const bytes=item.image.width*item.image.height*4;item.bytes+=bytes;this.propBytes+=bytes;this._trimProps();
    }
    const c=item.cutaway.getContext('2d');c.clearRect(0,0,item.image.width,item.image.height);c.drawImage(item.image,0,0);
    c.save();c.globalCompositeOperation='destination-out';
    for(const a of windows){c.globalAlpha=a.alpha;c.drawImage(this.windowMask,Math.round(a.x-p.x-item.x-a.r),Math.round(a.y-p.y-item.y-a.r),a.r*2,a.r*2);}
    c.restore();item.windowKey=key;return item.cutaway;
  }
  _buildingWindows(p,seed,focus,coversActor,reduced){
    const key=`${seed}:${p.id??`${p.x}:${p.y}`}`,now=this.now();let state=this.cutaways.get(key);
    const targets=[focus,focus?.companion?focus.girl:null];
    if(!state&&targets.some(a=>coversActor(a)))state={at:now,actors:[{alpha:0},{alpha:0}]};
    const windows=[];
    if(state){
      const step=Math.max(0,now-state.at)/120;state.at=now;
      for(let i=0;i<targets.length;i++){
        const actor=targets[i],a=state.actors[i],covered=coversActor(actor);
        a.alpha=reduced?(covered?1:0):Math.max(0,Math.min(1,a.alpha+(covered?step:-step)));
        if(covered){a.x=actor.x;a.y=actor.y-32;}
        if(a.alpha>0)windows.push({...a,r:70});
      }
      this.cutaways.delete(key);
      if(state.actors.some(a=>a.alpha>0)||targets.some(a=>coversActor(a)))this.cutaways.set(key,state);
      if(this.cutaways.size>96)this.cutaways.delete(this.cutaways.keys().next().value);
    }
    // Reveal only the nearest few threats. A crowd must not erase the facade.
    const nearest=[];
    for(const e of focus?.enemies||[]){
      if(e.dead||e.hp<=0||!coversActor(e,38))continue;
      const d=(e.x-focus.x)**2+(e.y-focus.y)**2;
      let i=0;while(i<nearest.length&&nearest[i].d<=d)i++;
      if(i<3){nearest.splice(i,0,{e,d});if(nearest.length>3)nearest.pop();}
    }
    for(const {e} of nearest)windows.push({x:e.x,y:e.y-30,r:42,alpha:.94});
    return windows;
  }
  _forestEdge(c,tx,ty,seed){
    const cx=Math.floor(tx/2),cy=Math.floor(ty/2),localX=((tx%2)+2)%2,localY=((ty%2)+2)%2;
    const edges=[];
    if(localX===0&&biomeForChunk(cx-1,cy,seed)==='forest')edges.push('left');
    if(localX===1&&biomeForChunk(cx+1,cy,seed)==='forest')edges.push('right');
    if(localY===0&&biomeForChunk(cx,cy-1,seed)==='forest')edges.push('top');
    if(localY===1&&biomeForChunk(cx,cy+1,seed)==='forest')edges.push('bottom');
    for(const edge of edges)for(let q=0;q<256;q+=4){
      const n=hash(tx*256+q,ty*256+q,seed+97),depth=8+Math.floor(n*23);
      if(edge==='left')R(c,'#5a4b3e',0,q,depth,4);
      if(edge==='right')R(c,'#5a4b3e',256-depth,q,depth,4);
      if(edge==='top')R(c,'#5a4b3e',q,0,4,depth);
      if(edge==='bottom')R(c,'#5a4b3e',q,256-depth,4,depth);
      if(n>.65){const a=(edge==='left'?depth-1:edge==='right'?256-depth:q),b=(edge==='top'?depth-1:edge==='bottom'?256-depth:q);R(c,'#717260',a,b,3,2);}
    }
  }
  _forestTile(c,tx,ty,seed){
    const random=rng(Math.floor(hash(tx,ty,seed+61)*4294967295));
    R(c,'#253b39',0,0,256,256);
    for(let i=0;i<85;i++)blot(c,random()*256,random()*256,20+random()*65,10+random()*34,['#2c4540','#33493e','#24343a','#34463e'][i%4],random);
    // Crossroads remain broad, walkable dirt trails, matching collision-free roads.
    for(let y=0;y<256;y+=4)for(let x=0;x<256;x+=4){
      const globalX=tx*256+x,globalY=ty*256+y;
      const edge=trailDistance(globalX,globalY),noise=hash(Math.floor(globalX/12),Math.floor(globalY/12),seed+84)*9+5*Math.sin(globalY/19+globalX/31);
      const grain=hash(Math.floor(globalX/20),Math.floor(globalY/20),seed+87);
      if(edge<44+noise)R(c,edge<36?(grain>.6?'#69513f':grain>.2?'#604b3b':'#594736'):'#494735',x,y,4,4);
    }
    for(let i=0;i<900;i++){
      const x=random()*256,y=random()*256,edge=trailDistance(tx*256+x,ty*256+y);
      R(c,edge<42?['#947353','#765b42','#493e34','#aa8960'][i%4]:['#58634d','#3b5447','#677255','#34423e'][i%4],x,y,i%8===0?3:1,1);
    }
    for(let i=0;i<65;i++){
      const x=random()*256,y=random()*256,edge=trailDistance(tx*256+x,ty*256+y);
      if(edge<28||edge>62)continue;
      if(i%4===0){
        L(c,'#342f2b',x,y,x+9,y+4,3);L(c,'#9a7957',x,y-1,x+9,y+3,1);
        L(c,'#47392e',x+6,y+2,x+14,y-2,2);
      }else for(let n=0;n<5;n++){
        const lx=x+random()*13-6,ly=y+random()*7-3;
        P(c,['#92704a','#aa8553','#685439','#756a46'][n%4],[[lx-3,ly],[lx,ly-2],[lx+4,ly],[lx,ly+2]]);
        R(c,'#bc9a64',lx-1,ly,2,1);
      }
    }
    for(let i=0;i<36;i++){const x=random()*256,y=random()*256,wx=((tx*256+x)%512+512)%512,wy=((ty*256+y)%512+512)%512;if(Math.min(wx,512-wx,wy,512-wy)<80)continue;L(c,'#4c6654',x,y,x-2,y-5,1);L(c,'#78906a',x+2,y,x+3,y-4,1);if(i%5===0){R(c,'#9b759e',x,y-6,2,2);R(c,'#c0a0ab',x+1,y-7,1,1);}}
  }
  _riverTile(c,tx,ty,seed){drawRiverTile(c,tx,ty,seed);}
  drawRiverLandings(c,props){
    for(const p of props){
      if(p.type!=='discovery')continue;
      const lane=Math.round((p.x-1024)/4096),river=riverSection(lane,p.y);
      if(Math.abs(p.x-river.x)>river.halfWidth+p.w/2+12)continue;
      // Existing discovery coordinates are save-stable. A low bank-side pier
      // makes their old paving read naturally beside the new shallow channel.
      const left=p.x-p.w/2-7,top=p.y-22,width=p.w+14;
      R(c,'#26363c',left-2,top+4,width+4,53);
      R(c,'#51474e',left,top,width,49);
      for(let y=top;y<top+49;y+=7){R(c,'#8e7971',left,y,width,5);R(c,'#b29a86',left,y,width,1);R(c,'#554751',left+width*.4,y,1,5);}
      for(const x of [left+4,left+width-7]){R(c,'#493c44',x,top-3,4,55);R(c,'#ae9380',x,top-3,2,55);}
    }
  }
  _broadleaf(c,p,seed){
    const variation=p.variant||0,v=variation%5,random=rng(Math.floor(hash(variation,17,seed+88)*4294967295));
    const height=65+variation%4*8,lean=(variation%3-1)*8,crown=42+variation%4*4;
    shadow(c,2,7,70,24,.4);
    P(c,'#302b35',[[-9,9],[-4,-height+20],[4,-height+20],[7,7],[13,12],[1,9],[-13,12]]);
    R(c,'#826152',-3,-height+21,5,height-14);R(c,'#b08a6a',-3,-height+24,2,height-20);
    L(c,'#73564b',0,-38,-17,-59,4);L(c,'#96745a',1,-46,18,-65,3);
    const colors=v===4?['#394d38','#576a41','#798248','#a1a05b']:['#263e3d','#3e5b43','#617b4d','#8b995e'];
    for(let i=0;i<10+variation%4;i++){
      const w=18+random()*19,h=14+random()*13,x=Math.max(-45+w/2,Math.min(45-w/2,lean+(random()-.5)*crown)),y=-height+random()*38;
      blot(c,x+2,y+4,w+4,h+4,'#203138',random);blot(c,x,y,w,h,colors[1+i%2],random);
      for(let k=0;k<8;k++){const xx=x+(random()-.5)*w*.75,yy=y+(random()-.5)*h*.7;R(c,colors[2+k%2],xx,yy,3+random()*3,2);}
    }
  }
  _condo(c,p,seed){
    const {foot,height,top}=buildingGeometry(p),w=p.w,left=-w/2,v=(p.variant||0)%5;
    const wall=v%2?'#887a79':'#777581',lit=v%2?'#c0aaa0':'#b0a8b0';
    shadow(c,5,foot+9,w+26,24,.58);
    R(c,'#252635',left-3,top,w+10,height+3);R(c,wall,left,top,w,height);
    R(c,'#444455',w/2-13,top,18,height);R(c,lit,left,top,4,height);
    // Offset upper volume and a side roof garden give the condo a stepped skyline.
    const setback=w*.21,upper=w*.69;
    R(c,'#302d40',left+setback-3,top-34,upper+6,35);
    R(c,wall,left+setback,top-31,upper,31);R(c,'#4c4b5a',left+setback+upper-9,top-30,9,31);
    R(c,'#cec0b4',left+setback-6,top-36,upper+13,5);
    for(let x=left+setback+6;x<left+setback+upper-18;x+=24){R(c,'#283c4a',x,top-26,18,22);R(c,'#87a5aa',x+2,top-24,4,18);R(c,'#b6c9c0',x+2,top-24,12,1);}
    R(c,'#494655',left+1,top-11,setback-3,12);R(c,'#c6b3a8',left,top-13,setback,3);
    for(let x=left+2;x<left+setback-3;x+=7)R(c,'#747985',x,top-10,2,10);
    R(c,'#3c3d4c',left+setback+3,top-4,upper-3,3);
    R(c,'#d0bfb6',left-7,top-3,w+19,5);R(c,'#403b4d',left-5,top+3,w+15,4);
    for(let y=top+17;y<foot-47;y+=42){
      for(let x=left+15;x<w/2-27;x+=31)this._window(c,x,y,22,25,PALETTES[1],hash(x,y,seed)>.58?0:1,()=>0);
      R(c,'#25283a',left+7,y+28,w-18,9);R(c,'#b5a6a5',left+5,y+30,w-14,5);R(c,'#514c60',left+6,y+36,w-15,4);
      R(c,'#34404a',left+9,y+18,w-24,3);R(c,'#a8aca8',left+9,y+18,w-24,1);
      for(let x=left+10;x<w/2-15;x+=9)R(c,'#34404a',x,y+20,2,10);
      R(c,'#76604f',left+13,y+24,14,6);R(c,'#6e8957',left+14,y+19,12,5);R(c,'#a4ac70',left+17,y+17,5,3);
    }
    R(c,'#282a3a',left+13,foot-43,w-35,43);R(c,'#416371',left+16,foot-40,w-41,37);
    for(let x=left+18;x<w/2-25;x+=26){R(c,'#8eadae',x,foot-38,3,31);R(c,'#2e3546',x+17,foot-40,3,38);}
    R(c,'#c7b7ad',left+9,foot-47,w-24,5);R(c,'#686173',left-7,foot,w+18,8);R(c,'#bca8a4',left-7,foot+8,w+18,2);
    R(c,'#3b3546',left+12,top-35,27,10);R(c,'#9c8f99',left+13,top-35,25,2);
    for(let x=left+15;x<left+37;x+=4)R(c,'#6a6275',x,top-32,2,5);
    if(w>95){R(c,'#76624f',w/2-37,top-10,21,9);for(let i=0;i<4;i++){O(c,'#607b56',w/2-38+i*5,top-19-i%2*4,10,12);R(c,'#a4ac75',w/2-35+i*5,top-18-i%2*4,3,3);}}
    this._damage(c,p,seed);
  }
  _residentialBrick(c,p,seed){
    const {foot,height,top}=buildingGeometry(p),w=p.w,left=-w/2,wide=w>=100;
    const pal={...PALETTES[2],lit:'#bb8d82'};
    shadow(c,5,foot+10,w+28,22,.5);
    R(c,'#272333',left-5,top,w+12,height+5);R(c,'#865765',left,top+5,w,height-4);
    R(c,'#574454',w/2-12,top+5,16,height);R(c,'#bf9290',left,top+7,3,height-8);
    for(let y=top+13;y<foot-6;y+=10)for(let x=left+4;x<w/2-15;x+=23){
      const xx=x+((Math.floor((y-top)/10)%2)*11);if(xx+18>w/2-12)continue;
      R(c,'#493a4b',xx,y,20,8);R(c,hash(xx,y,seed)>.5?'#a06b75':'#915d6c',xx+1,y,18,7);R(c,'#c18b8d',xx+2,y,15,1);
    }
    const cols=wide?Math.max(2,Math.floor((w-25)/34)):1,gap=(w-20)/cols;
    for(let y=top+20;y<foot-53;y+=43)for(let i=0;i<cols;i++){
      const x=left+10+i*gap;this._window(c,x,y,Math.min(23,gap-9),27,pal,(i+Math.round((y-top)/43))%3===0?0:1,()=>0);
    }
    // Exterior stair alternates its diagonal direction at every landing.
    if(wide){const x=left+12,bw=Math.min(w-35,82);let floor=0;
      for(let y=top+54;y<foot-37;y+=43,floor++){
        R(c,'#252635',x-4,y,bw+7,6);R(c,'#a3969d',x-5,y,bw+8,2);
        R(c,'#424353',x-3,y-15,bw+5,2);for(let xx=x;xx<x+bw;xx+=8)R(c,'#514b5b',xx,y-14,2,15);
        if(y+43<foot-37){const x0=floor%2?x+bw-8:x+7,x1=floor%2?x+7:x+bw-8;
          L(c,'#242636',x0,y+7,x1,y+41,6);L(c,'#9b8f92',x0,y+3,x1,y+37,2);
          for(let i=0;i<8;i++){const t=i/8,xx=x0+(x1-x0)*t,yy=y+8+34*t;R(c,'#b0a0a1',xx-4,yy,9,2);}
        }
      }
    }
    R(c,'#4c404f',left-8,foot-1,w+19,12);R(c,'#ba9e9c',left-8,foot,w+19,3);
    const door=wide?28:24,dx=left+11;R(c,'#292635',dx-3,foot-44,door+6,45);R(c,'#806050',dx,foot-41,door,40);
    R(c,'#294b5c',dx+4,foot-37,door-8,22);R(c,'#9db4b5',dx+5,foot-35,3,18);R(c,'#d9b87d',dx+door-5,foot-12,2,3);
    if(wide){this._window(c,left+53,foot-42,31,30,pal,0,()=>0);R(c,'#75605e',left+50,foot-10,37,10);R(c,'#4c694e',left+52,foot-17,33,8);
      for(let i=0;i<7;i++){R(c,i%2?'#dca5b1':'#bd718f',left+54+i*4,foot-20-i%3*3,3,4);}}
    P(c,'#40394b',[[left-8,top+2],[left+3,top-15],[w/2+7,top-15],[w/2+16,top+2]]);
    P(c,'#bca7a5',[[left-6,top],[left+4,top-12],[w/2+6,top-12],[w/2+13,top]]);R(c,'#d2bbb1',left-6,top,w+20,3);R(c,'#594859',left-4,top+4,w+16,5);
    R(c,'#48414f',left+13,top-29,31,19);R(c,'#a89b9e',left+15,top-28,27,16);for(let x=left+18;x<left+40;x+=4)R(c,'#514b5c',x,top-24,2,10);
    this._damage(c,p,seed);
  }
  _nature(c,p,seed){
    const variation=p.variant||0,v=variation%5,random=rng(Math.floor(hash(variation,0,seed+88)*4294967295));
    shadow(c,2,6,Math.max(38,p.w+20),20,.45);
    if(p.type==='pine'&&(variation%4===1||variation%4===3)){this._broadleaf(c,p,seed);return;}
    if(p.type==='pine'){
      const height=68+variation%5*8,spread=.72+(variation%3)*.12,lean=(variation%3-1)*5;
      P(c,'#302735',[[-8,8],[-4,-height+12],[4,-height+12],[7,8],[13,12],[1,9],[-13,12]]);
      R(c,'#9c776d',-3,-height+15,3,height-9);L(c,'#56404c',3,-50,8,-43,2);
      for(let tier=3;tier>=0;tier--){const top=-height+tier*14,width=(15+tier*8)*spread,base=top+27+tier*3;
        const pts=[[0,top],[-width*.55,top+14],[-width*.35,top+13],[-width,base-4],[-width*.65,base-5],[-width*.88,base+2],[-9,base-2],[-3,base+3],[4,base-2],[width*.8,base+2],[width*.6,base-5],[width,base-4],[width*.4,top+14],[width*.6,top+15]];
        const shift=lean*(3-tier)/3;
        P(c,'#172d36',pts.map(([x,y])=>[x+shift,y+3]));P(c,['#2a494e','#31565a','#345e60','#3b6562'][3-tier],pts.map(([x,y])=>[x+shift,y]));
        for(let branch=0;branch<4;branch++){const yy=top+11+branch*5,span=Math.min(width-3,5+branch*7);L(c,'#527c72',shift-span,yy+5,shift,yy,2);L(c,'#426865',shift,yy,shift+span,yy+6,2);}
        R(c,'#7b9580',shift-2,top+6,2,4);
      }
    }else if(p.type==='rock'){
      const w=Math.max(24,p.w),h=20+v*3;
      P(c,'#202a33',[[-w/2,7],[-w/2+3,-h/2],[-7,-h],[w/2-5,-h+6],[w/2+3,4],[10,12]]);
      P(c,'#5a6063',[[-w/2+2,4],[-w/2+5,-h/2],[-7,-h+2],[w/2-7,-h+8],[w/2,3],[9,9]]);
      P(c,'#7c7a78',[[-w/2+5,-h/2],[-7,-h+2],[w/2-7,-h+8],[0,-h/2+5]]);
      P(c,'#3f4c54',[[0,-h/2+5],[w/2-7,-h+8],[w/2,3],[9,9]]);
      L(c,'#313c45',-5,-h+5,0,-h/2+5,2);L(c,'#303d44',0,-h/2+5,-4,4,1);
      for(let i=0;i<8;i++)R(c,i%2?'#7a8961':'#596c51',-w/2+5+random()*(w-12),-h/2+random()*6,4,2);
    }else if(p.type==='stump'){
      P(c,'#46333d',[[-16,10],[-9,-15],[9,-15],[14,7],[21,13],[4,10],[-4,12]]);R(c,'#825b54',-8,-14,16,23);R(c,'#b18968',-7,-13,3,18);O(c,'#ceac80',-10,-19,21,9);O(c,'#78574e',-6,-17,13,5);O(c,'#b4906b',-4,-16,9,3);L(c,'#493d40',4,-10,3,6,2);
    }else if(p.type==='log'){
      P(c,'#483440',[[-27,-5],[19,-18],[28,-8],[-17,8]]);L(c,'#a47c62',-24,-5,20,-16,3);L(c,'#755545',-18,3,23,-10,5);O(c,'#d0ac7b',-29,-7,15,17);O(c,'#79604e',-26,-4,10,11);O(c,'#b6956d',-24,-2,6,7);L(c,'#4c3f3e',-7,-6,1,-11,2);R(c,'#687654',8,-15,7,3);
    }else{
      P(c,'#3a3447',[[-29,10],[-29,-38],[-20,-38],[-20,-48],[-9,-43],[-9,-16],[8,-16],[8,-58],[20,-58],[20,-43],[29,-43],[29,9]]);
      for(let y=-52;y<8;y+=9)for(let x=-27;x<29;x+=12){if((x< -9&&y> -37)||(x>7&&y> -51)||y> -15){R(c,'#75616d',x+(Math.floor(y/9)%2)*3,y,10,7);R(c,'#a18788',x+(Math.floor(y/9)%2)*3,y,8,1);}}
      for(let i=0;i<9;i++)R(c,i%2?'#6c7d58':'#4c654d',-28+random()*55,-10+random()*19,4,3);
    }
  }
  _damage(c,p,seed){
    const damage=Math.max(0,Math.min(3,p.damage||0));if(!damage)return;
    const random=rng(Math.floor(hash(p.x,p.y,seed+93)*4294967295)),w=p.w,foot=p.artFoot??p.h/2,top=p.artTop??(-p.h/2-43);
    for(let i=0;i<damage*3;i++){
      const x=-w/2+8+random()*(w-20),y=top+15+random()*Math.max(8,foot-top-34);
      if(p.buildingKind==='ruin'&&Math.abs(x)<w*.22+6&&y<foot-46)continue;
      L(c,'#1f2431',x,y,x+4,y+9,2);L(c,'#292533',x+4,y+9,x-2,y+17,2);L(c,'#a28c86',x+5,y+9,x+1,y+15,1);
    }
    for(let side=0;side<2;side++){const x=side?w/2-13:-w/2+8;
      for(let j=0;j<damage*8;j++){const yy=foot-j*4,xx=x+Math.sin(j*1.3)*6;R(c,'#4f654d',xx,yy,4,4);R(c,'#839168',xx+2,yy-2,3,2);}
    }
    for(let i=0;i<damage*3;i++){const x=-w/2+random()*w;R(c,'#635765',x,foot+8+random()*9,5+random()*5,3);R(c,'#a18b89',x,foot+8+random()*8,4,1);}
  }
  _buildingVariant(c,p,seed){
    const kind=p.buildingKind||'apartment',w=p.w,{foot,height,top}=buildingGeometry(p),left=-w/2;
    if(kind==='apartment'){
      if([0,1,3].includes((p.variant||0)%5)){this._condo(c,p,seed);return;}
      this._residentialBrick(c,p,seed);return;
    }
    shadow(c,6,foot+8,w+25,24,.6);R(c,'#433c4a',left-8,foot-3,w+19,17);R(c,'#99858b',left-8,foot+10,w+18,2);
    if(kind==='ruin'){
      const gap=w*.22;
      P(c,'#292333',[[left-3,foot],[left-3,top+20],[left+13,top+20],[left+13,top],[left+30,top+4],[left+30,top+29],[-gap,top+37],[-gap,foot-48],[gap,foot-48],[gap,top+15],[gap+17,top+15],[gap+17,top-9],[w/2-10,top-9],[w/2-10,top+20],[w/2+5,top+25],[w/2+5,foot]]);
      for(let row=top+27;row<foot;row+=10)for(let x=left+2;x<w/2;x+=18){if(Math.abs(x)<gap&&row<foot-45)continue;R(c,'#775466',x+(Math.floor(row/10)%2)*5,row,15,8);R(c,'#a17d83',x+(Math.floor(row/10)%2)*5,row,13,1);}
      L(c,'#a1898e',-gap,foot-50,-gap,top+39,3);L(c,'#a1898e',gap,foot-50,gap,top+16,3);
      for(let i=0;i<10;i++){const x=left+8+i*(w-20)/10;R(c,'#795e6e',x,foot-3+(i%3)*4,10,6);R(c,'#b18e8c',x,foot-3+(i%3)*4,8,1);}
    }else{
      R(c,'#252334',left-3,top-3,w+12,height+5);R(c,kind==='warehouse'?'#4b5960':'#66525c',left,top,w,height);R(c,'#343543',w/2-13,top,18,height);
      if(kind==='warehouse'){
        P(c,'#252b38',[[left-7,top+3],[left+18,top-30],[w/2+5,top-16],[w/2+12,top+3]]);P(c,'#7f7375',[[left-4,top],[left+19,top-27],[w/2+3,top-14],[w/2+8,top]]);
        for(let x=left+5;x<w/2-14;x+=7){R(c,'#7a8280',x,top+2,2,height-5);R(c,'#303d48',x+3,top+4,1,height-7);}
        for(let x=left+10;x<w/2-26;x+=27)this._window(c,x,top+15,20,29,PALETTES[1],Math.round(hash(x,p.y,seed)*5),()=>0);
        R(c,'#b17a5e',left+15,top-45,18,39);R(c,'#dd9c6e',left+16,top-44,4,37);R(c,'#5f4b4c',left+14,top-44,21,3);
        R(c,'#262c37',left+w*.3,foot-46,w*.42,46);R(c,'#67767a',left+w*.3+2,foot-44,w*.42-4,42);for(let y=foot-40;y<foot;y+=5)R(c,'#3b454f',left+w*.3+2,y,w*.42-4,1);
      }else if(kind==='garage'){
        if((p.variant||0)%2===0){
          P(c,'#303b48',[[left-9,top-1],[left+17,top-35],[w/2+5,top-20],[w/2+13,top-1]]);
          P(c,'#657b75',[[left-6,top-3],[left+18,top-32],[w/2+3,top-18],[w/2+9,top-3]]);
          for(let i=0;i<Math.floor(w/8);i++){const xx=left+4+i*8,yy=top-8-(1-(xx-left)/w)*18;L(c,'#a0aca0',xx,yy,xx-9,top-4,1);}
          L(c,'#c0b6a2',left+18,top-32,w/2+3,top-18,2);R(c,'#b4a598',left-8,top-3,w+21,4);
          R(c,'#38424c',w/2-33,top-25,22,13);R(c,'#a5a8a1',w/2-31,top-23,18,9);for(let x=w/2-28;x<w/2-13;x+=4)R(c,'#4a555b',x,top-21,2,5);
        }else{
          R(c,'#9a8989',left-7,top-6,w+18,8);R(c,'#4b4754',left-3,top-11,w+10,6);
          R(c,'#4a4251',left+10,top-26,26,16);R(c,'#9a8c91',left+12,top-24,22,12);for(let x=left+15;x<left+32;x+=4)R(c,'#554d5d',x,top-21,2,7);
        }
        const gx=left+35,gw=w-52;R(c,'#262638',gx-3,top+15,gw+6,height-14);R(c,'#7e7a7b',gx,top+17,gw,height-17);
        for(let y=top+20;y<foot-3;y+=5){R(c,'#3f4351',gx,y,gw,2);R(c,'#a49790',gx+1,y-1,gw-3,1);}
        P(c,'#242534',[[gx+gw*.55,foot],[gx+gw,foot-21],[gx+gw,foot]]);
        this._window(c,left+8,top+17,18,24,PALETTES[1],3,()=>0);R(c,'#393c49',left+6,foot-26,23,27);R(c,'#88918b',left+8,foot-24,2,22);
        R(c,'#252433',-18,top-3,39,11);text(c,'GARAGE',1,top,'#d7ba91',1,'center');
      }else{
        if((p.variant||0)%3===0){
          P(c,'#2b2437',[[left-6,top+1],[0,top-36],[w/2+9,top+1]]);P(c,'#967377',[[left-2,top],[0,top-31],[w/2+5,top]]);L(c,'#d0a28d',left-3,top,0,top-33,2);L(c,'#b78982',0,top-33,w/2+6,top,2);
          O(c,'#372a3d',-12,top-22,24,20);O(c,'#dbb584',-8,top-18,16,12);R(c,'#503c4c',-1,top-17,2,12);
        }else{
          P(c,'#4f4654',[[left-7,top-1],[left+2,top-17],[w/2+4,top-17],[w/2+12,top-1]]);P(c,'#9a888c',[[left-4,top-3],[left+3,top-14],[w/2+3,top-14],[w/2+8,top-3]]);
          R(c,'#c5b2a4',left-6,top-3,w+18,4);R(c,'#534252',left-3,top+2,w+12,3);
          R(c,'#4e4554',left+10,top-29,27,17);R(c,'#a39798',left+12,top-27,23,14);for(let x=left+15;x<left+34;x+=4)R(c,'#514c59',x,top-24,2,8);
          if(w>100){R(c,'#705753',w/2-34,top-17,24,9);for(let i=0;i<5;i++){O(c,'#58704e',w/2-35+i*5,top-26-i%2*3,10,11);R(c,'#97a170',w/2-32+i*5,top-25-i%2*3,3,2);}}
        }
        for(let x=left+10;x<w/2-25;x+=29)this._window(c,x,top+13,22,Math.max(28,height-25),PALETTES[2],0,()=>0);
        R(c,'#2b2336',w/2-28,foot-40,22,41);R(c,'#d49a63',w/2-25,foot-37,16,31);R(c,'#765050',w/2-18,foot-37,2,31);
        for(let x=left-2;x<w/2+2;x+=10){P(c,(Math.floor((x-left+2)/10)%2)?'#bd9c91':'#86485a',[[x,top+8],[x+9,top+8],[x+12,top+22],[x-3,top+22]]);R(c,'#4e3349',x-3,top+22,13,3);}
        const label=['DEPANNEUR','CAFE','FLEURISTE','LIBRAIRIE','MARCHE'][(p.variant||0)%5];
        R(c,'#2b2637',left+4,top-3,w-9,12);R(c,'#b9a08c',left+4,top-4,w-9,1);
        text(c,label,-1,top,'#ead7ac',1,'center');
        // Display shelves and small flower boxes distinguish street shops.
        for(let xx=left+12;xx<w/2-30;xx+=29){R(c,'#55403e',xx,foot-18,19,2);for(let k=0;k<4;k++)R(c,['#c6a16a','#8f7566','#70927c','#b67e7d'][k],xx+k*4,foot-25,3,7);}
        R(c,'#66505a',left+5,foot-7,27,8);R(c,'#87985f',left+7,foot-11,23,5);for(let i=0;i<5;i++)R(c,i%2?'#e1ae93':'#b16f9a',left+9+i*4,foot-14-i%2*2,3,3);
      }
    }
    if(kind==='shop'){this._emission(c,'gold',-2,top+5,w+28,44,.42);this._emission(c,'gold',0,foot+22,w+64,54,.6);}
    // Ivy anchors each building to the same abandoned, reclaimed world.
    this._damage(c,{...p,artFoot:foot,artTop:top,damage:p.damage??2},seed);
    for(let i=0;i<8;i++){const xx=left+4+i*4,yy=(kind==='ruin'?foot-12:top+4)+(i%3)*5;R(c,'#4d6650',xx,yy,4,4);R(c,'#8a9366',xx+1,yy-1,2,2);}
  }

  _tile(tx,ty,seed){
    const key=`${tx}:${ty}`;if(this.tiles.has(key))return this.tiles.get(key);
    const image=canvas(256,256);if(!image)return null;const c=image.getContext('2d');c.imageSmoothingEnabled=false;
    if(biomeForChunk(Math.floor(tx/2),Math.floor(ty/2),seed)==='forest'){this._forestTile(c,tx,ty,seed);this._riverTile(c,tx,ty,seed);this.ambience.set(image,{forest:true,phase:hash(tx,ty,seed+809)*TAU});this.tiles.set(key,image);if(this.tiles.size>48)this.tiles.delete(this.tiles.keys().next().value);return image;}
    const ambient={vents:[],forest:false,phase:hash(tx,ty,seed+809)*TAU};this.ambience.set(image,ambient);
    const random=rng(Math.floor(hash(tx,ty,seed)*4294967295));
    R(c,'#30283f',0,0,256,256);
    // Broad, irregular repairs and worn asphalt have many scales of detail.
    for(let i=0;i<40;i++){const x=random()*280-12,y=random()*280-12,w=12+random()*81,h=6+random()*29;blot(c,x,y,w,h,['#2b263b','#362b43','#382d46','#2c293e','#403146','#33293d'][i%6],random);}
    for(let i=0;i<1050;i++){const x=random()*256,y=random()*256,v=random();R(c,v>.97?'#6a5268':v>.87?'#53415a':v>.66?'#45354f':v>.32?'#3b3046':'#2c263b',x,y,v>.96?2:1,1);}
    // Road blocks match World's 512-unit grid, leaving its central 160 clear.
    const wx=tx*256,wy=ty*256;c.save();c.translate(-wx,-wy);
    // A block's furthest brush reaches from -66 to +428. Skip all other blocks
    // during cold-tile generation rather than relying on canvas clipping.
    const minBX=Math.ceil((wx-428)/512),maxBX=Math.floor((wx+322)/512);
    const minBY=Math.ceil((wy-428)/512),maxBY=Math.floor((wy+322)/512);
    for(let ax=minBX;ax<=maxBX;ax++)for(let ay=minBY;ay<=maxBY;ay++)this._blockGround(c,ax*512,ay*512,seed);
    c.restore();
    // Branching fractures cut across patches instead of forming a repeated grid.
    for(let i=0;i<5;i++){let x=random()*256,y=random()*256;const length=15+random()*48,angle=random()*TAU;for(let j=0;j<4;j++){const nx=x+Math.cos(angle+(random()-.5)*.8)*length/4,ny=y+Math.sin(angle+(random()-.5)*.8)*length/4;L(c,'#171a2d',x,y,nx,ny,2);L(c,'#4f3e56',x+1,y+1,nx+1,ny+1,1);if(j===2)L(c,'#18192b',x,y,x+random()*14-7,y+random()*14-7,1);x=nx;y=ny;}}
    const patches=this._wetPatches(tx,ty,seed);this._wetAsphalt(c,patches,tx,ty,seed);this.puddles.set(image,patches);
    const roadX=tx%2===0?48:208,roadY=44+random()*168;
    if(random()>.68){this._manhole(c,roadX,roadY);ambient.vents.push({x:roadX,y:roadY});}
    if(random()>.32){const x=tx%2===0?65:191,y=35+random()*180;
      blot(c,x,y,24+random()*28,10+random()*13,'#292537',random);
      L(c,'#3e354c',x-9,y+3,x+7,y+5);L(c,'#443449',x-3,y-4,x+10,y-2);
    }
    // Small narrative debris, laid into the ground with contact shadows.
    for(let i=0;i<3;i++)this._litter(c,random()*244+6,random()*244+6,Math.floor(random()*6),random);
    if(random()>.42){const x=24+random()*205,y=20+random()*215;this._drain(c,x,y);ambient.vents.push({x,y});}
    this._forestEdge(c,tx,ty,seed);
    this._riverTile(c,tx,ty,seed);
    this.tiles.set(key,image);if(this.tiles.size>48)this.tiles.delete(this.tiles.keys().next().value);return image;
  }
  _blockGround(c,x,y,seed){
    if(biomeForChunk(Math.floor(x/512),Math.floor(y/512),seed)==='forest')return;
    const v=Math.floor(hash(x,y,seed)*5),p=PALETTES[v];
    // The block is a raised, damaged island with corner cuts and a service yard.
    P(c,'#17192b',[[x+84,y+97],[x+97,y+84],[x+415,y+84],[x+428,y+97],[x+428,y+415],[x+415,y+428],[x+97,y+428],[x+84,y+415]]);
    P(c,'#62566c',[[x+88,y+99],[x+99,y+88],[x+413,y+88],[x+424,y+99],[x+424,y+413],[x+413,y+424],[x+99,y+424],[x+88,y+413]]);
    R(c,'#4c455d',x+91,y+101,330,309);R(c,'#51495f',x+102,y+91,307,330);
    R(c,'#302b40',x+135,y+137,244,242);R(c,'#3b3146',x+143,y+145,228,226);
    // Quiet backlot texture and subtle parking-bay outlines.
    for(let i=0;i<18;i++){const a=hash(x+i,y,seed),b=hash(x,y+i,seed+1);R(c,'#514052',x+147+a*215,y+149+b*215,2+i%3,1);}
    L(c,'#65575e',x+141,y+159,x+141,y+304,1);L(c,'#65575e',x+96,y+160,x+132,y+160,1);L(c,'#65575e',x+96,y+286,x+132,y+286,1);
    // Low planting beds soften service yards while leaving every saved walking
    // route and collision untouched. They are ground texture, never fake walls.
    const garden=rng(Math.floor(hash(x,y,seed+271)*4294967295));
    const bedX=x+144,bedY=y+148,bedW=62+Math.floor(garden()*22),bedH=33+Math.floor(garden()*24);
    P(c,'#555952',[[bedX,bedY+6],[bedX+8,bedY],[bedX+bedW-6,bedY+3],[bedX+bedW,bedY+bedH-5],[bedX+bedW-10,bedY+bedH],[bedX,bedY+bedH-7]]);
    for(let i=0;i<58;i++){const gx=bedX+4+garden()*(bedW-10),gy=bedY+7+garden()*(bedH-15);R(c,i%3?'#55705a':'#779071',gx,gy,3+garden()*4,2);if(i%7===0)R(c,i%2?'#c692a8':'#d4bc8b',gx+1,gy-2,2,2);}
    // Individual slab joins are staggered. Chipped curbs alternate lit and worn blocks.
    for(let q=101;q<420;q+=23){L(c,'#332f45',x+q,y+89,x+q,y+134,1);L(c,'#332f45',x+q,y+381,x+q,y+422,1);R(c,'#97818d',x+q+1,y+88,15,2);R(c,'#8e7c89',x+q+1,y+423,15,2);}
    for(let q=101;q<420;q+=24){L(c,'#353045',x+89,y+q,x+134,y+q,1);L(c,'#353045',x+381,y+q,x+422,y+q,1);R(c,'#8f7c8b',x+88,y+q+1,2,15);R(c,'#9f8493',x+423,y+q+1,2,15);}
    L(c,'#777084',x+92,y+101,x+92,y+407,1);L(c,'#7d7184',x+102,y+92,x+407,y+92,1);
    L(c,'#28263c',x+134,y+136,x+380,y+136,2);L(c,'#28263c',x+136,y+136,x+136,y+379,2);
    for(let i=0;i<15;i++){const a=hash(x+i*7,y,seed+32),b=hash(x,y+i*11,seed+33),px=x+94+a*322,py=y+(i%2?110:400);R(c,'#786679',px,py,4+b*8,1);if(i%4===0)L(c,'#27293c',px,py,px+4,py+7,1);}
    for(const edge of [121,411]){this._crosswalk(c,x,y+edge,false,seed);this._crosswalk(c,x+edge,y,true,seed);}
    // Worn double amber road markings stop before intersections.
    for(let q=155;q<385;q+=47){R(c,'#8a6550',x+q,y-4,26,2);R(c,'#b08b5e',x+q+2,y-4,19,1);R(c,'#8a6550',x+q,y+3,26,2);R(c,'#8a6550',x-4,y+q,2,26);R(c,'#a47c56',x-4,y+q+2,1,19);R(c,'#8a6550',x+3,y+q,2,26);}
    // Graffiti and old yellow loading-bay arrows occupy the side streets.
    if(v%2===0){P(c,'#6d594f',[[x+222,y+29],[x+229,y+20],[x+236,y+29],[x+232,y+29],[x+232,y+43],[x+226,y+43],[x+226,y+29]]);R(c,'#342b40',x+228,y+30,2,7);}
    if(v===3){text(c,'IA ?',x+273,y+389,'#795870',2);L(c,p.neon,x+273,y+403,x+304,y+403,1);}
    this._drain(c,x+104,y+148);this._drain(c,x+400,y+374);
  }
  _crosswalk(c,x,y,vertical,seed){
    // One world-anchored style for both halves of a crossing at a tile seam.
    const random=rng(Math.floor(hash(x,y,seed+163)*4294967295)),style=Math.floor(random()*3),wear=.15+random()*.5;
    const paint=(color,a,b,w,h)=>vertical?R(c,color,x+b,y+a,h,w):R(c,color,x+a,y+b,w,h);
    if(style===2){paint('#9e8b78',-66,-13,132,2);paint('#74655e',-66,12,132,2);}
    const pitch=style===1?25:18,width=style===1?16:10,length=style===2?22:20;
    for(let q=-66;q<65-width;q+=pitch){
      if(random()<wear*.28)continue;
      const inset=Math.floor(random()*3),span=length-Math.floor(random()*wear*8),shade=random()>.4?'#a3907b':'#887768';
      paint(shade,q,-length/2+inset,width,span);paint('#b7a186',q+1,-length/2+inset,width-2,1);
      for(let chip=0;chip<2+Math.floor(wear*6);chip++)paint('#393041',q+Math.floor(random()*(width-2)),-length/2+inset+Math.floor(random()*Math.max(1,span-2)),2+Math.floor(random()*2),1+Math.floor(random()*2));
    }
  }
  _litter(c,x,y,type,random){
    if(type===0){shadow(c,x,y+3,11,4,.28);P(c,'#b8a7ad',[[x-4,y-3],[x+4,y-4],[x+5,y+2],[x+1,y+5],[x-5,y+2]]);L(c,'#685f77',x-2,y-1,x+3,y-1);L(c,'#79637a',x-2,y+1,x+1,y+1);R(c,'#e1c6be',x-3,y-3,4,1);}
    else if(type===1){R(c,'#151b2a',x-3,y,8,4);R(c,'#ab3f66',x-3,y-2,7,5);R(c,'#dc9bad',x-3,y-2,2,4);R(c,'#b9abb9',x-2,y-3,4,1);R(c,'#d0b6c6',x+2,y+2,2,1);}
    else if(type===2){L(c,'#85642d',x-4,y,x,y+3,2);L(c,'#a78f42',x,y+3,x+5,y,2);L(c,'#d0b15a',x-1,y+1,x+2,y-3,1);R(c,'#413b35',x+2,y-4,2,2);}
    else if(type===3){R(c,'#28263a',x-5,y,10,4);L(c,'#6c5d63',x-4,y-1,x+4,y+1,2);R(c,'#a98378',x-3,y-2,3,1);}
    else if(type===4){P(c,'#6d526b',[[x-3,y-3],[x+2,y-4],[x+5,y],[x+1,y+3],[x-4,y+2]]);R(c,'#9c708e',x,y-2,2,1);R(c,'#44334f',x+1,y+1,2,2);}
    else {const n=2+Math.floor(random()*4);for(let j=0;j<n;j++)R(c,j%2?'#8c6c70':'#5e4f66',x+random()*9-4,y+random()*6-3,2,1);}
  }
  _drain(c,x,y){R(c,'#171a2c',x-10,y-6,22,13);R(c,'#63546b',x-9,y-5,20,10);R(c,'#25283d',x-8,y-4,18,8);for(let i=0;i<6;i++)R(c,'#777084',x-7+i*3,y-4,1,8);R(c,'#afa0a9',x-8,y-5,17,1);R(c,'#191a2d',x-9,y+5,20,2);}
  _steam(){
    if(this.steamStrip)return this.steamStrip;
    const image=canvas(24*12,42);if(!image)return null;
    const c=image.getContext('2d');
    for(let frame=0;frame<12;frame++)for(let puff=0;puff<4;puff++){
      const phase=(frame/12+puff/4)%1,rise=phase*34;
      c.globalAlpha=Math.sin(phase*Math.PI)*.12;
      O(c,'#b1b2bc',frame*24+8+Math.sin(phase*6+puff)*3-phase*3,34-rise,5+phase*7,4+phase*4,2);
    }
    this.steamStrip=image;return image;
  }
  _groundLife(ctx,ambient,wx,wy,time){
    if(!ambient)return;
    const phase=ambient.phase,t=time*.7+phase;
    if(!ambient.forest){
      if(ambient.vents.length){
        const strip=this._steam(),frame=((Math.floor(time*8+phase*2)%12)+12)%12;
        if(strip)for(const vent of ambient.vents){
          const x=wx+vent.x,y=wy+vent.y,lane=Math.round((x-1024)/4096),water=riverSection(lane,y);
          if(Math.abs(x-water.x)<65)continue;
          ctx.drawImage(strip,frame*24,0,24,42,x-12,y-37,24,42);
        }
      }
    }else{
      // This district is painted at night. A handful of dim fireflies and grass
      // tips sit below actors, without a particle list that grows during travel.
      for(let i=0;i<4;i++){
        const x=wx+36+((phase*31+i*67)%184)+Math.sin(t*.63+i)*7,y=wy+32+((phase*23+i*41)%190)+Math.cos(t*.47+i)*5;
        const pulse=Math.max(0,Math.sin(t*.8+i*2));ctx.globalAlpha=.12+pulse*.22;
        R(ctx,'#b3bb89',x,y,2,1);ctx.globalAlpha=pulse*.06;R(ctx,'#b3bb89',x-2,y-2,6,5);
      }
      ctx.globalAlpha=.28;
      for(let i=0;i<5;i++){
        const x=wx+24+((phase*19+i*43)%208),y=wy+38+((phase*13+i*71)%184);
        if(trailDistance(x,y)<45)continue;
        R(ctx,'#718269',x+Math.sin(t+i)*1.3,y-3,1,3);
      }
    }
    // A gust carries just two leaves or scraps per tile, fading before wrapping.
    for(let i=0;i<2;i++){
      const cycle=((time*.055+phase*.17+i*.47)%1+1)%1,drift=cycle*38;
      ctx.globalAlpha=Math.sin(cycle*Math.PI)*.34;
      const x=wx+42+((phase*17+i*119)%154)+drift,y=wy+40+((phase*37+i*97)%166)+Math.sin(cycle*TAU+i)*6;
      R(ctx,ambient.forest?'#a18c65':'#8c8090',x,y,3,1);R(ctx,ambient.forest?'#736f50':'#625e74',x+1,y+1,2,1);
    }
  }
  drawGround(ctx,camera,width,height,seed=42,time=0,reduced=false){
    if(this.seed!==seed){this.seed=seed;this.tiles.clear();this.props.clear();this.propBytes=0;this.cutaways.clear();}
    const left=camera.x-width/2,top=camera.y-height*.48,minX=Math.floor(left/256),minY=Math.floor(top/256),maxX=Math.floor((left+width)/256),maxY=Math.floor((top+height)/256);
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const tile=this._tile(x,y,seed);if(!tile){R(ctx,'#30283f',x*256,y*256,256,256);continue;}
      ctx.drawImage(tile,x*256,y*256);
    }
    if(reduced)return;
    ctx.save();
    // Draw after all tiles, so steam and leaves do not clip at cache boundaries.
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const tile=this.tiles.get(`${x}:${y}`);if(!tile)continue;
      this._groundLife(ctx,this.ambience.get(tile),x*256,y*256,time);
      for(const p of this.puddles.get(tile)||[]){
        const shimmer=.5+.5*Math.sin(time*.85+p.phase);ctx.globalAlpha=.1+shimmer*.13;
        const color={pink:'#ff89c9',cyan:'#9bdbe2',gold:'#e7bd80'}[p.color];
        R(ctx,color,x*256+p.x-p.w*.22+Math.sin(time*.6+p.phase)*2,y*256+p.y+2,p.w*(.25+shimmer*.16),1);
        const cycle=((time*.36+p.phase)%1+1)%1,r=2+cycle*8;
        ctx.globalAlpha=Math.sin(cycle*Math.PI)*.18;ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();
        ctx.ellipse(x*256+p.x,y*256+p.y,r,r*.28,0,0,TAU);ctx.stroke();
      }
    }
    ctx.restore();
    drawRiverCurrent(ctx,left,top,width,height,seed,time);
  }

  _building(c,p,seed){
    const w=Math.round(p.w||150),h=Math.round(p.h||180),left=-w/2,foot=h/2,top=-h/2-43;
    const v=(p.variant??Math.floor(hash(p.x,p.y,seed)*5))%5,pal=PALETTES[v],random=rng(Math.floor(hash(p.x,p.y,seed+3)*4294967295));
    // Contact shadow, raised paving and individual chipped entry steps.
    shadow(c,6,foot+8,w+31,27,.63);R(c,'#282237',left-13,foot-9,w+26,28);R(c,'#66596d',left-12,foot-8,w+23,21);R(c,'#99818e',left-12,foot+11,w+23,3);
    for(let x=left-10;x<w/2+10;x+=18){R(c,'#40384f',x,foot-7,1,17);R(c,'#b09a9f',x+2,foot+11,10,1);}
    // A shallow visible side and thick roof give the facade physical weight.
    P(c,INK,[[left-3,top+4],[left+8,top-11],[w/2+8,top-11],[w/2+15,top+4],[w/2+15,foot],[left-3,foot]]);
    R(c,pal.wall,left,top+5,w,h+38);R(c,pal.shade,w/2-17,top+5,30,h+38);
    R(c,pal.lit,left+2,top+7,4,h+32);R(c,'#241e34',w/2-2,top+5,3,h+38);
    // Varied bricks, mortar, plaster scars and water stains are baked into the sprite.
    for(let row=top+16;row<foot-48;row+=10){L(c,'#2c263b',left+5,row,w/2-18,row,1);const offset=(Math.floor(row/10)%2)*10;for(let x=left+7+offset;x<w/2-20;x+=21){R(c,pal.brick,x,row-8,14,1);R(c,'#362b40',x+17,row-8,1,8);if(random()>.8)R(c,pal.lit,x+2,row-6,6,2);}}
    for(let i=0;i<22;i++){const x=left+5+random()*(w-25),y=top+12+random()*(h+18);blot(c,x,y,5+random()*16,4+random()*22,i%3===0?pal.lit:pal.shade,random);}
    for(let i=0;i<6;i++){const x=left+random()*(w-20);R(c,'#2e263b',x,top+13,2,12+random()*19);}
    const shopTop=foot-61,upperBottom=shopTop-8,cols=Math.max(1,Math.floor((w-26)/35)),rows=Math.max(1,Math.floor((upperBottom-top-16)/39)),gap=(w-30)/cols;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const x=left+10+col*gap,y=top+17+row*39,ww=Math.min(24,gap-8),vh=29;
      this._window(c,x,y,ww,vh,pal,Math.floor(random()*7),random);
      if(row===rows-1&&col===0&&w>90){R(c,INK,x-1,y+vh+4,ww+3,11);R(c,'#8a7b88',x,y+vh+4,ww+1,8);for(let j=0;j<6;j++)R(c,'#393748',x+2+j*3,y+vh+6,1,5);R(c,'#b0a0a1',x+1,y+vh+4,ww-2,1);}
    }
    // Corroded corner quoin stones and a loose downpipe.
    for(let y=top+12;y<foot-4;y+=16){R(c,'#796174',left-1,y,8,10);R(c,'#a17b8b',left,y,7,1);R(c,'#302738',left+6,y+2,2,10);}
    L(c,INK,w/2+5,top+12,w/2+5,foot+3,5);L(c,'#62586a',w/2+4,top+12,w/2+4,foot+3,3);R(c,'#ab8294',w/2+3,top+14,1,h+28);L(c,'#847083',w/2+4,foot+2,w/2+11,foot+7,3);
    // Deep shop recesses, shop glass, a damaged roller shutter and a real doorway.
    R(c,INK,left+9,shopTop+23,w-28,39);const entryW=w<95?19:25,doorX=w/2-entryW-16,windowW=Math.max(17,doorX-left-15);
    R(c,'#262238',left+11,shopTop+26,windowW,31);
    if(v===2||v===4){R(c,'#605568',left+12,shopTop+26,windowW-2,29);for(let y=shopTop+28;y<foot-4;y+=4){R(c,'#292b3d',left+12,y,windowW-2,1);R(c,'#8a7180',left+13,y-1,windowW-5,1);}L(c,'#a57c8d',left+14,shopTop+47,left+windowW-1,shopTop+38,2);text(c,'NO IA',left+18,shopTop+42,'#c04a88',1);}
    else {R(c,'#1b243c',left+12,shopTop+26,windowW-2,30);P(c,'#375369',[[left+14,shopTop+27],[left+windowW-3,shopTop+27],[left+14,foot-11]]);R(c,'#5d7190',left+15,shopTop+29,3,21);R(c,'#59415c',left+15,foot-12,windowW-9,7);for(let i=0;i<3;i++){R(c,['#a1588a','#aa945f','#567c82'][i],left+18+i*(windowW-10)/3,foot-19,3,7);}L(c,'#2c2033',left+windowW*.6,shopTop+27,left+windowW*.45,foot-4,2);}
    R(c,'#514351',doorX,shopTop+25,entryW,37);R(c,'#1b2336',doorX+3,shopTop+28,entryW-6,22);L(c,'#647d8d',doorX+5,shopTop+30,doorX+7,shopTop+45,1);R(c,'#ab8d6f',doorX+entryW-6,foot-11,2,3);R(c,'#8a7480',doorX-2,foot-1,entryW+4,3);R(c,'#524553',doorX-5,foot+3,entryW+10,3);
    // A weathered striped awning and a metal-framed neon sign.
    const signY=shopTop-4,signW=w-23;
    R(c,INK,left+5,signY-2,signW+4,22);R(c,'#7e5c72',left+6,signY-1,signW+2,20);R(c,'#201b32',left+8,signY+1,signW-2,16);
    R(c,pal.neon,left+10,signY+2,signW-6,1);R(c,pal.neon,left+10,signY+15,signW-6,1);
    const label=w<95?(v%2?'IA ?':'404'):pal.sign,scale=label.length*8<signW-5?2:1;neon(c,label,left+7+signW/2,signY+(scale===2?4:6),pal.light,scale);
    P(c,INK,[[left+7,shopTop+18],[w/2-14,shopTop+18],[w/2-9,shopTop+28],[left+3,shopTop+28]]);
    const awnW=w-24;for(let i=0;i<awnW;i+=8){const color=i%16?'#a88b93':v%2?'#603858':'#75374d';P(c,color,[[left+8+i,shopTop+19],[left+15+i,shopTop+19],[left+18+i,shopTop+26],[left+5+i,shopTop+26]]);R(c,i%16?'#d1adb0':'#42283e',left+5+i,shopTop+27,9,3+(i%3));}
    // Ripped posters and a distinctive spray-painted crown live at street level.
    R(c,'#a58c8d',w/2+1,foot-56,10,15);R(c,'#e4b7a1',w/2+2,foot-55,7,6);R(c,'#482d47',w/2+3,foot-54,5,2);R(c,'#524259',w/2+5,foot-43,6,3);
    if(w>105){const gx=left+17,gy=shopTop-24;L(c,'#aa3b83',gx,gy,gx+4,gy+13,2);L(c,'#e96cae',gx+4,gy+13,gx+22,gy+13,2);L(c,'#e96cae',gx+22,gy+13,gx+26,gy,2);L(c,'#d9569d',gx+1,gy+2,gx+9,gy+8,2);L(c,'#d9569d',gx+9,gy+8,gx+13,gy-3,2);L(c,'#d9569d',gx+13,gy-3,gx+18,gy+8,2);L(c,'#d9569d',gx+18,gy+8,gx+25,gy+2,2);R(c,'#915177',gx+10,gy+17,2,5);}
    // Roof cornice, gravel, machinery and aerials break the rectangular silhouette.
    P(c,'#80717e',[[left-4,top-3],[left+8,top-17],[w/2+8,top-17],[w/2+16,top-3]]);R(c,'#a88b9c',left-4,top-3,w+20,3);R(c,'#2c253a',left-3,top+1,w+18,5);R(c,'#695267',left-1,top+4,w+13,2);
    P(c,'#4d455b',[[left+4,top-5],[left+12,top-13],[w/2+5,top-13],[w/2+10,top-5]]);
    for(let i=0;i<30;i++)R(c,i%3?'#6f6173':'#a58a96',left+12+random()*(w-12),top-12+random()*7,1,1);
    const acX=left+15;P(c,INK,[[acX,top-8],[acX+3,top-26],[acX+33,top-26],[acX+37,top-8]]);R(c,'#746b7d',acX+3,top-24,29,15);R(c,'#a1919c',acX+4,top-24,27,2);for(let i=0;i<8;i++)R(c,'#353548',acX+6+i*3,top-20,1,9);R(c,'#5b5368',acX+1,top-9,35,2);
    const antX=w/2-20;L(c,INK,antX,top-12,antX,top-48,3);L(c,'#a58b9e',antX,top-12,antX,top-48,1);L(c,'#8a7c94',antX-15,top-38,antX+14,top-38,1);L(c,'#8a7c94',antX-10,top-44,antX+9,top-44,1);L(c,'#8a7c94',antX-10,top-41,antX-10,top-35,1);L(c,'#8a7c94',antX+9,top-41,antX+9,top-35,1);
    if(w>115){const px=left+w*.54;O(c,'#29283c',px,top-21,20,14);O(c,'#9a8795',px+1,top-23,17,11);O(c,'#776d85',px+2,top-23,14,7);L(c,'#c0a2b2',px+8,top-18,px+16,top-27,1);L(c,'#4b4059',px+8,top-14,px+8,top-7,2);}
    // Reflections of the shop sign puddle into the pavement at its actual feet.
    c.save();c.globalAlpha=.24;for(let i=0;i<6;i++)R(c,pal.neon,left+16+i%3*7,foot+16+i*3,w*.5-i*8,1);c.restore();
  }
  _window(c,x,y,w,h,pal,type,random){
    const details=this.facadeDetails.get(c);
    if(details&&[0,1,4].includes(type))details.push({x:x+2,y:y+2,w:w-4,h:Math.min(11,h*.49-3),warm:type!==1});
    R(c,INK,x-3,y-3,w+6,h+7);R(c,'#846a7d',x-2,y-2,w+4,h+4);R(c,'#1b1d33',x,y,w,h);
    const warm=type===0||type===4,glass=warm?'#805c4e':type===2?'#372e46':'#30516b';R(c,glass,x+1,y+1,w-2,h-2);
    if(type!==2){R(c,warm?'#e6a164':'#6793b0',x+2,y+2,warm?6:4,h-5);R(c,warm?'#ad7455':'#3f718e',x+w-7,y+3,5,h-6);P(c,warm?'#e6b77e':'#86b0c8',[[x+3,y+2],[x+11,y+2],[x+3,y+12]]);}
    R(c,'#211d30',x+w/2-1,y,2,h);R(c,'#30243a',x,y+h*.49,w,2);R(c,'#b28a9d',x-4,y+h+1,w+9,2);R(c,'#332a3e',x-3,y+h+3,w+7,2);
    if(type===2||type===5){P(c,'#5c424b',[[x-2,y+5],[x+1,y+1],[x+w+1,y+h-5],[x+w-1,y+h]]);L(c,'#a27879',x,y+4,x+w-1,y+h-3,1);R(c,'#b59d8f',x+1,y+5,1,1);R(c,'#b59d8f',x+w-2,y+h-5,1,1);}
    if(type===3){L(c,'#b0c0cc',x+w-4,y+3,x+w-9,y+12,1);L(c,'#b0c0cc',x+w-9,y+12,x+w-3,y+18,1);L(c,'#1b1b2c',x+w-9,y+12,x+w-14,y+15,2);}
    if(type===6){for(let i=0;i<4;i++)R(c,'#29263b',x+2,y+5+i*5,w-4,2);R(c,'#b2a1aa',x+2,y+3,w-4,1);}
    if(random()>.6)R(c,pal.lit,x-1,y+h+6,2,8);
    if(type===0||type===4||type===1)this._emission(c,warm?'gold':'cyan',x+w/2,y+h/2,w+36,h+30,warm?.40:.22);
  }
  _car(c,p,seed){
    const w=Math.round(p.w||34),h=Math.round(p.h||66),x=-w/2,y=-h/2,v=(p.variant??Math.floor(hash(p.x,p.y,seed)*5))%5;
    const body=['#a76d19','#5c6781','#884b78','#557e80','#77524d'][v],lit=['#edc047','#94a5b8','#ca83b4','#8cb2af','#b17c6a'][v],dark=['#69491e','#353f58','#4c2d54','#2b4b56','#49373b'][v];
    shadow(c,5,7,w+15,h+10,.59);R(c,INK,x-3,y+9,w+6,h-16);R(c,'#373045',x-3,y+13,4,11);R(c,'#373045',x+w-1,y+13,4,11);R(c,'#373045',x-3,y+h-24,4,12);R(c,'#373045',x+w-1,y+h-24,4,12);
    P(c,INK,[[x+6,y-1],[x+w-6,y-1],[x+w+1,y+7],[x+w+1,y+h-7],[x+w-5,y+h+1],[x+5,y+h+1],[x-1,y+h-7],[x-1,y+7]]);
    P(c,body,[[x+6,y+1],[x+w-6,y+1],[x+w-1,y+8],[x+w-1,y+h-8],[x+w-6,y+h-1],[x+6,y+h-1],[x+1,y+h-8],[x+1,y+8]]);
    L(c,lit,x+4,y+8,x+4,y+h-9,2);L(c,dark,x+w-4,y+8,x+w-4,y+h-8,3);
    P(c,lit,[[x+7,y+4],[x+w-7,y+4],[x+w-6,y+16],[x+6,y+16]]);L(c,body,x+8,y+6,x+8,y+14,2);L(c,dark,x+w-9,y+6,x+w-8,y+14,1);
    P(c,'#131d32',[[x+5,y+18],[x+w-5,y+18],[x+w-7,y+29],[x+7,y+29]]);P(c,'#5b7d98',[[x+7,y+19],[x+13,y+19],[x+9,y+27]]);R(c,'#314b66',x+15,y+20,w-23,7);L(c,'#a6b9c7',x+7,y+18,x+w-6,y+18,1);L(c,'#1d2435',x+11,y+27,x+19,y+25,1);
    P(c,dark,[[x+7,y+30],[x+w-7,y+30],[x+w-6,y+44],[x+6,y+44]]);R(c,body,x+8,y+30,w-16,13);R(c,lit,x+9,y+31,w-19,2);R(c,'#a19aa6',x+7,y+30,1,13);
    P(c,'#18253b',[[x+6,y+46],[x+w-6,y+46],[x+w-5,y+54],[x+5,y+54]]);L(c,'#627e97',x+8,y+47,x+10,y+53,2);R(c,lit,x+5,y+h-9,w-10,2);
    R(c,'#241f31',x+3,y+2,w-6,2);R(c,'#fff0b3',x+4,y+3,7,3);R(c,'#e3cf9a',x+w-11,y+3,7,3);R(c,'#c0aba8',x+4,y+h-4,w-8,2);R(c,'#dd5669',x+4,y+h-7,6,3);R(c,'#c7445c',x+w-10,y+h-7,6,3);R(c,'#ece0c4',x+w/2-3,y+h-4,7,2);
    R(c,INK,x-4,y+21,5,4);R(c,body,x-4,y+20,4,3);R(c,INK,x+w-1,y+21,5,4);R(c,lit,x+w,y+20,3,2);
    L(c,'#c0b5b5',x+w-7,y+20,x+w-11,y+24,1);L(c,'#c0b5b5',x+w-11,y+24,x+w-7,y+27,1);L(c,dark,x+7,y+10,x+13,y+14,1);R(c,'#d0b3a2',x+w-6,y+38,2,5);R(c,dark,x+6,y+h-12,5,1);
    if(v===4){P(c,'#3f333c',[[x+2,y+5],[x+9,y+4],[x+13,y+10],[x+8,y+15],[x+2,y+11]]);R(c,'#9a766a',x+4,y+8,5,1);}
  }
  _bike(c,p){
    shadow(c,2,9,61,15,.5);const wheels=[-19,21];
    wheels.forEach(x=>{O(c,INK,x-12,-3,24,27);O(c,'#b0a7b7',x-10,-1,20,23);O(c,'#2c2a40',x-8,1,16,19);for(let i=0;i<8;i++){const a=i/8*TAU;L(c,'#746e88',x,10,x+Math.cos(a)*8,10+Math.sin(a)*9,1);}O(c,'#c4bcc8',x-2,8,5,5);});
    L(c,INK,-19,10,-4,-13,5);L(c,INK,-4,-13,11,10,5);L(c,'#59b0d0',-19,10,-4,-13,2);L(c,'#76d9ed',-4,-13,11,10,2);L(c,'#4381b3',-19,10,11,10,3);L(c,'#9ee8f0',-17,9,9,9,1);L(c,'#65bed9',-4,-13,15,-13,2);L(c,'#d0c4d1',21,10,13,-21,2);L(c,'#ad91ae',-4,-13,-5,-21,2);
    R(c,INK,-12,-24,16,5);R(c,'#796078',-11,-24,14,2);L(c,INK,13,-21,23,-25,4);L(c,'#d5c0cf',13,-22,22,-25,1);R(c,'#e17baa',20,-26,6,3);
    O(c,'#d3bfba',5,5,9,10);O(c,'#534159',7,7,5,6);L(c,'#d9d0cd',10,10,15,16,2);R(c,INK,12,16,8,3);L(c,'#736c84',-18,9,7,10,1);L(c,'#4a4055',2,14,-1,23,2);
    R(c,'#797086',24,-11,7,6);R(c,'#f0ce8f',25,-10,5,3);L(c,'#aa71a2',-25,-2,-14,-6,2);
  }
  _bin(c){
    shadow(c,3,10,43,16,.55);P(c,INK,[[-17,-23],[-14,-30],[14,-29],[20,-20],[17,11],[-14,13]]);P(c,'#625769',[[-15,-22],[16,-22],[14,9],[-12,10]]);R(c,'#a18a9a',-13,-19,5,25);R(c,'#453a51',9,-18,5,26);
    for(let i=-6;i<=7;i+=5){L(c,'#302c42',i,-17,i-1,7,2);L(c,'#887387',i+2,-17,i+1,5,1);}R(c,'#262438',-13,7,28,3);
    P(c,INK,[[-21,-24],[-16,-31],[10,-35],[20,-28],[22,-23]]);P(c,'#8a728a',[[-18,-26],[-14,-30],[10,-32],[18,-27],[19,-25]]);L(c,'#c4a0ae',-14,-30,9,-32,1);L(c,'#55425e',-15,-26,14,-27,2);R(c,INK,-3,-36,11,3);R(c,'#7b637b',-2,-36,8,1);
    R(c,'#b5ab83',-7,-14,9,9);R(c,'#704f71',-6,-13,7,2);R(c,'#d16391',-5,-8,4,2);L(c,'#df82b5',6,-7,13,-10,2);L(c,'#df82b5',7,-11,12,-5,1);
    O(c,INK,11,-1,20,18);O(c,'#393044',13,0,16,15);L(c,'#66556c',18,1,25,10,2);R(c,'#65506b',19,-3,4,4);R(c,'#b2884a',-20,5,7,3);L(c,'#e1bd5f',-19,5,-24,8,2);
  }
  _bench(c){
    shadow(c,1,11,75,18,.55);for(const x of [-25,25]){L(c,INK,x,-18,x,14,5);L(c,'#9f8998',x-1,-17,x-1,12,1);P(c,'#231f34',[[x-3,11],[x+5,11],[x+8,15],[x-6,15]]);}
    for(let row=0;row<3;row++){const y=-27+row*7;R(c,INK,-34,y,68,6);R(c,row===1?'#916071':'#7e5265',-32,y,65,4);R(c,'#c28a92',-31,y,62,1);R(c,'#4e334a',-30,y+3,57,1);R(c,'#c7a29f',-28,y+1,1,1);R(c,'#c7a29f',28,y+1,1,1);if(row===1){R(c,'#392e43',-3,y,7,4);L(c,'#b17a84',4,y,11,y+1,1);}}
    P(c,INK,[[-35,-7],[31,-7],[38,1],[-38,1]]);P(c,'#996577',[[-33,-6],[30,-6],[35,-1],[-35,-1]]);L(c,'#d0929b',-32,-6,29,-6,1);L(c,'#5c3b51',-33,-3,33,-3,1);L(c,'#231e32',-34,-14,-37,-3,4);L(c,'#8d6b83',-34,-14,-36,-5,1);L(c,'#231e32',34,-14,37,-3,4);L(c,'#8d6b83',34,-14,36,-5,1);
    R(c,'#a8a0a1',12,-8,10,5);L(c,'#4e4b61',14,-7,19,-7,1);P(c,'#ac664e',[[-8,0],[-3,-5],[3,-1],[-2,2]]);R(c,'#e3b87a',-5,-2,4,1);
  }
  _lamp(c){
    shadow(c,5,9,32,14,.45);P(c,INK,[[-9,12],[-8,4],[-5,1],[-4,-69],[0,-82],[17,-91],[31,-87],[32,-81],[17,-81],[4,-74],[3,1],[7,5],[9,12]]);R(c,'#3f3a50',-6,3,11,8);R(c,'#8f7b8f',-5,4,3,6);R(c,'#6a6179',-2,-72,3,74);R(c,'#b39aa4',-2,-70,1,70);R(c,'#25283c',1,-72,1,72);R(c,'#7c5e7a',-4,-47,8,3);R(c,'#3b2b43',-4,-45,7,2);
    L(c,'#a691a2',0,-77,18,-87,2);P(c,'#72677c',[[15,-91],[27,-92],[35,-86],[30,-82],[13,-82]]);R(c,'#bca6b0',17,-91,10,2);R(c,'#ffe4aa',15,-84,16,2);R(c,'#efb779',18,-82,11,2);R(c,'#fff3ce',17,-84,11,1);
    R(c,'#9d798e',-3,-28,6,12);R(c,'#e2b2b8',-2,-27,4,5);R(c,'#532c4f',-1,-26,2,2);L(c,'#635068',-4,-8,-6,-2,1);R(c,'#514c5e',-8,10,16,2);
  }
  _mirror(c){
    shadow(c,3,11,41,15,.5);L(c,INK,-6,-8,-11,12,5);L(c,INK,7,-8,13,12,5);L(c,'#9a748c',-6,-8,-10,10,2);L(c,'#9a748c',7,-8,12,10,2);
    P(c,INK,[[-13,-54],[-8,-61],[10,-61],[16,-54],[16,-8],[10,-2],[-9,-2],[-15,-8]]);P(c,'#aa758d',[[-12,-53],[-7,-59],[9,-59],[14,-53],[14,-9],[9,-4],[-8,-4],[-13,-9]]);R(c,'#e5beac',-10,-53,2,43);R(c,'#57344e',10,-52,3,43);R(c,'#28314b',-8,-53,18,43);
    P(c,'#5b8fa1',[[-7,-52],[8,-52],[8,-11],[-7,-11]]);P(c,'#b0c8c9',[[-6,-51],[5,-51],[-6,-31]]);P(c,'#8197b0',[[8,-40],[8,-13],[-3,-13]]);L(c,'#d9dcda',-5,-50,6,-39,1);
    L(c,'#283951',5,-49,-1,-37,1);L(c,'#d8e8e3',6,-49,0,-37,1);L(c,'#26364c',-1,-37,6,-26,1);L(c,'#26364c',-1,-37,-7,-34,1);L(c,'#d8e8e3',0,-37,3,-33,1);L(c,'#34465b',6,-26,0,-14,1);
    for(const [x,y] of [[-5,-59],[7,-59],[-12,-8],[12,-8]]){R(c,'#ffd88c',x,y,3,2);R(c,'#73435c',x,y+2,3,1);}R(c,'#e2a3c6',-15,-27,2,10);R(c,'#e2a3c6',15,-28,1,8);R(c,'#6c4f69',-16,12,33,3);
  }
  _phone(c){
    shadow(c,3,12,40,15,.53);R(c,INK,-5,-16,11,30);R(c,'#655a71',-3,-15,6,27);R(c,'#afa0ad',-3,-12,1,23);R(c,'#292a3e',-12,12,27,4);
    P(c,INK,[[-18,-60],[-13,-65],[16,-65],[21,-59],[19,-13],[-17,-12]]);P(c,'#63546f',[[-15,-58],[-12,-62],[15,-62],[18,-58],[16,-16],[-14,-16]]);R(c,'#a48b9f',-13,-59,4,41);R(c,'#322c46',-8,-58,23,39);R(c,'#a93f83',-13,-62,28,5);R(c,'#f57abb',-12,-62,25,1);text(c,'IA ?',1,-59,'#ffcee8',1,'center');
    R(c,'#151f35',-5,-50,17,17);R(c,'#5d9aa6',-3,-48,13,12);R(c,'#9cd0c7',-2,-47,5,2);L(c,'#c2e3d9',7,-48,2,-42,1);L(c,'#26334c',2,-42,8,-38,2);L(c,'#bfd6d7',2,-42,-2,-38,1);
    R(c,'#b5a8b3',-2,-31,13,10);for(let row=0;row<3;row++)for(let col=0;col<3;col++)R(c,'#3c3b54',col*4-1,row*3-30,2,2);R(c,'#24293d',-1,-20,11,2);R(c,'#d89b9f',1,-20,6,1);
    P(c,INK,[[-14,-48],[-9,-47],[-8,-39],[-10,-36],[-8,-29],[-13,-27],[-17,-31],[-17,-44]]);R(c,'#786175',-15,-44,4,10);R(c,'#b395a4',-15,-43,1,8);L(c,'#171a2c',-11,-29,-18,-20,2);L(c,'#171a2c',-18,-20,-13,-14,2);L(c,'#8c6c87',-17,-20,-13,-15,1);
    R(c,'#c5a883',7,-15,6,5);R(c,'#8d5c6c',8,-14,4,1);R(c,'#c65f96',-16,-23,4,2);
    this._emission(c,'pink',0,-60,72,38,.7);this._emission(c,'cyan',3,-43,48,45,.35);this._emission(c,'pink',0,18,94,35,.5);
  }
  _busShelter(c,p){
    const w=Math.max(75,p.w||86),l=-w/2;
    shadow(c,3,12,w+17,20,.45);R(c,'#453d50',l-5,5,w+11,12);R(c,'#a8959a',l-5,5,w+11,3);
    R(c,'#344651',l+3,-64,w-5,66);R(c,'#63828a',l+5,-62,w-9,62);R(c,'#9eb1b1',l+7,-61,3,53);
    P(c,'#86a1a7',[[l+10,-61],[l+w*.6,-61],[l+10,-22]]);R(c,'#3c505e',l+w*.58,-63,4,65);
    for(const x of [l,l+w-3]){R(c,'#292b3d',x-2,-68,5,77);R(c,'#b1a4a6',x,-68,2,74);}
    R(c,'#51485b',l-7,-71,w+15,7);P(c,'#afa1a5',[[l-8,-71],[l+2,-81],[l+w+5,-81],[l+w+9,-71]]);R(c,'#ddd0bb',l-8,-72,w+18,2);
    R(c,'#534455',l+10,-15,w-21,8);R(c,'#b88d74',l+10,-16,w-21,3);R(c,'#6f565b',l+11,-8,w-23,3);
    for(const x of [l+15,l+w-20])R(c,'#3b3447',x,-6,3,11);
    R(c,'#2b3144',l+w-21,-58,15,26);R(c,'#d8c9ac',l+w-19,-56,11,22);for(let y=-52;y<-36;y+=4)R(c,'#706d75',l+w-17,y,7,1);
    text(c,'BUS',l+13,-59,'#ede4c4',1);
  }
  _streetBoard(c,p){
    const v=(p.variant||0)%5,w=Math.max(75,p.w||86),l=-w/2;
    shadow(c,2,11,w+14,19,.43);R(c,'#514451',l-4,6,w+10,10);R(c,'#a79391',l-4,6,w+10,2);
    for(const x of [l+4,l+w-5]){R(c,'#353244',x-2,-77,5,87);R(c,'#96848a',x,-75,2,83);}
    R(c,'#2b2b3d',l,-75,w,59);R(c,'#aa9791',l+3,-72,w-6,53);R(c,'#ddcbb0',l+6,-69,w-12,47);
    if(v===2){text(c,'QUARTIER',0,-65,'#4b4657',1,'center');
      for(let i=0;i<6;i++){const x=l+9+(i%3)*22,y=-53+Math.floor(i/3)*16;R(c,['#9f757a','#758d8c','#af956e'][i%3],x,y,18,13);R(c,'#e2cdae',x+3,y+3,11,1);R(c,'#564b5b',x+3,y+6,8,1);}
    }else{ text(c,'PLAN DE VILLE',0,-65,'#4b4657',1,'center');R(c,'#80958a',l+10,-53,w-20,27);
      for(let x=l+14;x<w/2-10;x+=15)R(c,'#d1c4a9',x,-52,4,26);for(let y=-49;y<-26;y+=10)R(c,'#c7bda6',l+11,y,w-23,3);
      R(c,'#ac607c',-2,-42,6,6);R(c,'#eedbc3',0,-40,2,2);}
    R(c,'#5a4b59',l-6,-79,w+13,5);R(c,'#c8b5a7',l-6,-79,w+13,2);
  }
  _flowerStand(c,p){
    const w=Math.max(75,p.w||86),l=-w/2;shadow(c,2,12,w+17,21,.44);
    for(const x of [l+4,l+w-5]){R(c,'#332b3d',x-2,-62,5,72);R(c,'#947b74',x,-61,2,69);}
    P(c,'#4f414f',[[l-7,-61],[l+4,-75],[l+w-4,-75],[l+w+8,-61]]);
    for(let x=l-5;x<l+w+6;x+=10)P(c,Math.round((x-l)/10)%2?'#c9ad9c':'#628174',[[x,-61],[x+7,-73],[x+16,-73],[x+10,-61]]);
    R(c,'#d7c2a8',l-6,-61,w+13,3);R(c,'#4a394b',l+8,-56,w-15,10);text(c,'FLEURS',0,-54,'#ead7ae',1,'center');
    for(let row=0;row<2;row++)for(let i=0;i<4;i++){const x=l+6+i*(w-12)/4,y=-18+row*23;
      R(c,'#4b3e4a',x,y,16,14);R(c,'#a17b64',x+1,y+1,14,11);R(c,'#c49b75',x,y,16,3);
      for(let j=0;j<3;j++){L(c,'#628060',x+4+j*4,y,x+2+j*5,y-14-j%2*4,2);O(c,['#c88ba0','#d6b475','#d5a1b3'][(i+j)%3],x-1+j*5,y-18-j%2*3,7,6);R(c,'#ead5a4',x+2+j*5,y-16-j%2*3,2,2);}
    }
  }
  _billboard(c,p){
    const v=(p.variant||0)%5;if(v===1){this._busShelter(c,p);return;}if(v===2||v===4){this._streetBoard(c,p);return;}if(v===3){this._flowerStand(c,p);return;}
    const w=Math.max(75,Math.round(p.w||86)),left=-w/2,top=-80;
    shadow(c,4,13,w+12,17,.53);for(const x of [left+11,-left-12]){R(c,INK,x-3,-23,8,37);R(c,'#5f5b73',x-1,-22,3,34);R(c,'#a38a9b',x-1,-20,1,30);R(c,'#3d334d',x-8,11,17,4);}L(c,'#464059',left+13,-14,-left-11,8,2);L(c,'#464059',left+13,8,-left-11,-14,2);
    P(c,INK,[[left-4,top+5],[left+2,top-1],[-left+2,top-1],[-left+7,top+5],[-left+7,-22],[left-4,-22]]);R(c,'#a38494',left-1,top+2,w+5,57);R(c,'#403248',left+2,top+5,w-1,51);R(c,'#481a35',left+4,top+7,w-5,47);R(c,'#912144',left+6,top+9,w-9,43);
    R(c,'#ef4c6d',left+5,top+8,w-8,1);R(c,'#ef4c6d',left+5,top+51,w-8,1);R(c,'#df83b5',left+2,top+4,w-1,1);R(c,'#33263d',-left+2,top+6,3,50);
    // Oversized warning triangle and hand-drawn display lettering.
    P(c,'#ffd444',[[-2,top+13],[13,top+37],[-17,top+37]]);P(c,'#5c2337',[[-2,top+18],[8,top+34],[-12,top+34]]);R(c,'#ffdf64',-3,top+22,3,7);R(c,'#ffdf64',-3,top+31,3,2);
    text(c,'ERREUR 404',0,top+41,'#ffe3d9',1,'center');R(c,INK,left+6,-20,w-8,15);text(c,'IA HORS LIGNE',0,-16,'#ffc8db',1,'center');
    for(const [x,y] of [[left,top+2],[-left+2,top+2],[left,top+55],[-left+2,top+55]]){R(c,'#d0b4b7',x,y,2,2);R(c,'#4e4052',x,y,1,1);}R(c,'#8f7b89',left+15,top-4,21,3);L(c,'#3b3147',left+25,top-3,left+20,top-10,2);R(c,'#dac2bc',left+14,top-7,22,3);
    // One peeling advertisement survives under the warning display.
    P(c,'#b39b95',[[left+7,-5],[left+24,-5],[left+22,6],[left+13,5],[left+7,7]]);text(c,'EGO',left+9,-3,'#68445d',1);R(c,'#d1b6a4',left+17,5,6,2);
  }
  _foodcart(c,p){
    const v=(p.variant||0)%5,color=['#a34b69','#42747d','#9e644d','#745585','#aa7250'][v];
    shadow(c,3,12,83,20,.55);
    for(const x of [-23,23]){O(c,INK,x-6,2,13,16);O(c,'#786578',x-4,4,9,12);O(c,'#b7a2ad',x-2,6,5,7);R(c,'#41394f',x,7,1,5);}
    P(c,INK,[[-34,-29],[34,-29],[36,8],[-32,8]]);R(c,color,-31,-27,62,32);R(c,'#d8b0b2',-30,-26,59,2);R(c,'#5d384e',-29,-9,58,13);
    R(c,'#dec4b0',-25,-19,50,12);R(c,'#513346',-24,-18,48,10);text(c,'HOT DOG',0,-16,'#ffe2a2',1,'center');R(c,'#b88a85',-31,1,61,2);
    [-29,29].forEach(x=>{R(c,INK,x-2,-58,4,32);R(c,'#b4a2ad',x-1,-56,1,28);});
    P(c,INK,[[-42,-54],[-32,-68],[31,-68],[43,-54],[42,-47],[-42,-47]]);
    for(let x=-38;x<40;x+=9){P(c,(x+38)%18?'#d6b7af':color,[[x,-54],[x+7,-65],[x+15,-65],[x+9,-54]]);R(c,(x+38)%18?'#f3d0b7':'#73334f',x,-53,9,6);R(c,'#3e2a3f',x+1,-48,7,2);}
    L(c,'#f7d8bd',-31,-66,30,-66,1);R(c,'#d1b3a7',-36,-30,73,4);R(c,'#4b3449',-35,-26,69,2);
    // Griddle, a tiny actual hotdog, ketchup and mustard on the counter.
    R(c,'#302b40',-22,-34,27,5);for(let x=-20;x<3;x+=4)R(c,'#7b6c77',x,-33,1,3);
    O(c,'#d3a166',-20,-37,17,6);O(c,'#b75d4d',-19,-36,15,3);L(c,'#f5cb5f',-17,-36,-7,-35,1);
    R(c,'#a63857',11,-40,5,9);R(c,'#e97d83',12,-40,2,7);R(c,'#a09d8b',12,-42,3,2);R(c,'#d8a746',20,-40,5,9);R(c,'#fff0ad',21,-40,1,7);R(c,'#9d8059',21,-42,3,2);
    L(c,'#b19eaa',32,-21,41,-21,2);L(c,'#a38b9d',41,-21,42,-12,2);R(c,'#29283d',-34,4,70,3);
    if(v===2){P(c,'#dac28e',[[-17,-74],[-10,-80],[15,-80],[20,-74],[15,-70],[-12,-70]]);R(c,'#ad5546',-11,-77,25,4);L(c,'#f1c851',-7,-76,10,-75,1);}
    else {R(c,'#33263c',-21,-75,42,7);text(c,v===4?'SANS IA':'CHEZ TOMA',0,-74,'#e8bd94',1,'center');}
    this._emission(c,v===4?'cyan':'gold',0,-71,94,35,.75);this._emission(c,'gold',0,-27,87,42,.45);this._emission(c,v===4?'cyan':'gold',0,22,100,48,.66);
  }
  _vending(c,p){
    const v=(p.variant||0)%5,color=['#6e436a','#3b6977','#8d4b5c','#5d526e','#675b7a'][v];
    shadow(c,3,11,47,18,.57);P(c,INK,[[-20,-68],[16,-68],[23,-62],[23,9],[-20,9]]);R(c,color,-18,-66,35,72);P(c,'#302e45',[[17,-65],[21,-61],[21,7],[17,7]]);R(c,'#a57e98',-17,-65,3,68);R(c,'#b19aa6',-17,-66,33,2);
    R(c,'#221c34',-13,-61,27,9);text(c,v===2?'EGO COLA':'IA SNACK',0,-59,'#e8c6cf',1,'center');R(c,'#ed6eae',-12,-53,24,1);
    R(c,INK,-14,-50,23,36);R(c,'#294657',-12,-48,19,32);R(c,'#75a1a8',-11,-47,2,29);
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){const x=-8+col*5,y=-43+row*10;R(c,['#b97e86','#c7a56b','#759a9b'][(row+col+v)%3],x,y,3,6);R(c,'#e3cbb0',x,y+1,2,1);R(c,'#131c2c',x-2,y+7,7,2);}
    L(c,'#aec6ca',-10,-45,4,-32,1);L(c,'#304154',4,-32,-2,-23,1);R(c,'#33283d',10,-46,5,23);R(c,'#a6bea9',11,-43,3,5);R(c,'#ffd68c',11,-36,2,2);R(c,'#8e78a1',11,-31,2,2);R(c,INK,11,-25,3,1);
    R(c,INK,-12,-10,25,12);R(c,'#584258',-10,-8,21,3);R(c,'#aaa0a6',-9,-8,18,1);R(c,'#211e33',-16,7,33,3);R(c,'#d1a388',12,1,3,3);
    P(c,'#b49b95',[[-19,-25],[-13,-26],[-12,-19],[-18,-17]]);R(c,'#8e476d',-18,-23,4,2);
    this._emission(c,'pink',0,-57,77,38,.62);this._emission(c,'cyan',-3,-32,59,62,.38);this._emission(c,'pink',0,21,94,42,.55);
  }
  _planter(c,p){
    const v=(p.variant||0)%5;shadow(c,1,10,51,15,.5);
    P(c,INK,[[-26,-12],[25,-12],[22,11],[-22,11]]);P(c,v===2?'#735455':'#77707c',[[-23,-9],[23,-9],[20,8],[-19,8]]);R(c,v===2?'#a47573':'#ada1a7',-23,-11,47,4);R(c,'#3e3546',-20,-8,40,4);R(c,'#473a48',-16,-7,33,2);L(c,'#d0b8ae',-21,-9,-18,6,1);R(c,'#524a5c',14,-7,6,12);
    // Foliage stays deliberately desaturated, far below the toxic gas palette.
    for(let i=0;i<7;i++){const x=-19+i*6,tip=-20-((i*7+v*5)%18);P(c,i%2?'#486553':'#304d46',[[x,-7],[x-9,tip+4],[x-4,tip],[x+4,-10]]);L(c,'#7c8a69',x-1,-9,x-5,tip+3,1);}
    if(v===1||v===3){for(const [x,y] of [[-13,-25],[-1,-34],[14,-23]]){O(c,'#b3658a',x-3,y-2,7,5);R(c,'#ddaaa8',x,y-2,2,2);R(c,'#c6a36c',x,y,1,1);}}
    R(c,'#302d40',-15,8,33,3);L(c,'#555062',-6,-1,-2,5,1);R(c,'#aca39f',-16,1,5,3);
  }
  _tree(c,p){
    const v=(p.variant||0)%5;shadow(c,3,11,68,22,.48);
    P(c,INK,[[-25,-9],[24,-9],[20,11],[-21,11]]);P(c,'#67535c',[[-23,-7],[22,-7],[18,8],[-18,8]]);R(c,'#a17c7c',-23,-9,46,3);R(c,'#352e3c',-21,-6,40,4);for(let x=-17;x<20;x+=9)R(c,'#493c4c',x,-5,2,11);
    P(c,INK,[[-8,-4],[-6,-44],[-14,-57],[-9,-61],[-1,-49],[9,-61],[13,-57],[4,-42],[5,-4]]);P(c,'#6d5256',[[-5,-5],[-4,-42],[-10,-57],[-6,-54],[0,-42],[10,-57],[3,-39],[2,-5]]);L(c,'#a57d71',-3,-8,-3,-39,1);L(c,'#413342',1,-11,3,-36,2);
    const leaves=v===4?['#423c55','#5d4c62','#796074']:['#263e3d','#36534b','#54705d'];
    const clumps=[[-24,-58,28,23],[-12,-76,35,28],[12,-62,27,27],[-27,-41,31,22],[-7,-48,39,28],[15,-43,26,22]];
    for(let i=0;i<clumps.length;i++){const [x,y,w,h]=clumps[i];O(c,INK,x-2,y-2,w+4,h+3,2);O(c,leaves[i%2],x,y,w,h,2);O(c,leaves[2],x+2,y+2,w*.55,h*.43,2);for(let n=0;n<5;n++)R(c,v===4?'#a57e8b':'#7b8b71',x+4+(n*7+i*3)%(w-6),y+4+(n*3)%(h-6),2,1);}
    if(v===3){for(const [x,y] of [[-9,-67],[17,-51],[-20,-38],[4,-33]]){R(c,'#b97b92',x,y,3,2);R(c,'#d7a29f',x+1,y-1,2,1);}}
    R(c,'#a88a81',-16,1,7,3);R(c,'#494355',-17,2,5,1);L(c,'#9c8175',-9,-1,-15,4,1);
  }
  _table(c,p){
    const v=(p.variant||0)%5;shadow(c,2,11,69,20,.52);
    for(const x of [-27,27]){L(c,INK,x,-2,x-2,13,4);L(c,'#8f7084',x,-1,x-1,11,1);R(c,INK,x-9,-11,18,4);R(c,'#905a6d',x-8,-11,16,2);R(c,INK,x-8,-6,16,7);R(c,'#a97680',x-7,-5,14,4);}
    L(c,INK,0,-20,0,8,6);L(c,'#9a7b89',-1,-18,-1,6,2);L(c,'#4c3c53',0,7,-10,12,3);L(c,'#4c3c53',0,7,10,12,3);
    O(c,INK,-25,-29,51,18);O(c,v===1?'#68717c':'#aa7783',-23,-28,47,14);O(c,v===1?'#9a9da1':'#c7979a',-21,-28,42,7);L(c,'#6f4b60',-20,-22,18,-22,1);R(c,'#efb9ae',-15,-26,8,1);
    O(c,'#6b4b5a',-11,-24,10,5);R(c,'#e4d3bc',-9,-29,6,6);R(c,'#a34e66',-8,-28,3,4);R(c,'#d8baad',-3,-28,3,4);R(c,'#2c2336',-8,-30,4,1);
    P(c,'#d5b17a',[[4,-25],[15,-24],[10,-18]]);R(c,'#b65b5c',7,-24,5,2);R(c,'#8c9273',9,-22,2,1);R(c,INK,11,-29,9,4);R(c,'#7d94a4',12,-29,6,2);
    if(v===4){L(c,'#a68e9f',0,-26,0,-66,2);P(c,INK,[[-40,-58],[-12,-74],[13,-74],[40,-58],[31,-53],[-31,-53]]);for(let i=-36;i<36;i+=12)P(c,i%24?'#9a6c83':'#c3a4a1',[[i,-58],[0,-72],[i+12,-58],[i+9,-54],[i+3,-54]]);R(c,'#d4bab1',-1,-76,3,4);}
  }
  _cone(c,p){
    const v=(p.variant||0)%5;shadow(c,2,9,26,11,.51);
    if(v===4){P(c,INK,[[-15,3],[-8,-6],[18,-1],[18,7],[-8,11]]);P(c,'#b95d3e',[[-8,-4],[16,0],[16,5],[-8,9]]);P(c,'#ded1ba',[[2,-2],[7,-1],[7,7],[2,8]]);P(c,'#343143',[[-15,2],[-9,-5],[-5,-2],[-5,8],[-10,11]]);return;}
    P(c,INK,[[-13,7],[-9,1],[10,1],[14,7],[12,11],[-11,11]]);P(c,'#403446',[[-11,7],[-8,3],[8,3],[11,7],[10,9],[-9,9]]);P(c,INK,[[-8,5],[-3,-23],[3,-23],[9,5]]);P(c,'#cf693f',[[-6,4],[-2,-22],[2,-22],[7,4]]);P(c,'#f4b47a',[[-4,-7],[4,-7],[5,-2],[-5,-2]]);P(c,'#ead4b9',[[-2,-17],[2,-17],[3,-12],[-3,-12]]);L(c,'#ffa978',-2,-20,-4,-9,1);R(c,'#7a3d3c',4,0,2,3);
  }
  _barricade(c,p){
    shadow(c,3,11,65,17,.52);for(const x of [-21,21]){L(c,INK,x,-19,x-7,11,5);L(c,'#9c8391',x,-18,x-6,9,2);L(c,INK,x,-18,x+6,11,4);L(c,'#625269',x+1,-15,x+5,9,1);R(c,'#302a3e',x-10,10,19,3);}
    R(c,INK,-31,-29,63,17);R(c,'#dac5ac',-29,-27,59,12);for(let x=-31;x<32;x+=16)P(c,'#b45a67',[[x,-27],[x+8,-27],[x+1,-16],[x-7,-16]]);R(c,'#a69095',-28,-14,57,2);R(c,'#f1d2b4',-28,-27,56,1);R(c,'#8d6d7f',-26,-23,2,2);R(c,'#8d6d7f',26,-23,2,2);
    R(c,INK,-3,-35,8,7);O(c,'#a86a3c',-3,-39,9,9);O(c,'#edb15c',-2,-38,7,6);R(c,'#ffe3a3',0,-38,2,2);R(c,'#613c4a',8,-23,14,6);text(c,'IA',15,-22,'#f8d8b0',1,'center');
  }
  _crate(c,p){
    const v=(p.variant||0)%5;shadow(c,2,10,39,15,.54);
    if(v===3){P(c,INK,[[-17,-21],[13,-25],[18,-19],[17,11],[-16,11]]);P(c,'#67516d',[[-15,-19],[13,-23],[16,-18],[15,8],[-14,8]]);for(let row=-17;row<6;row+=7)for(let col=-11;col<13;col+=7)R(c,'#28283c',col,row,5,5);R(c,'#ba8eac',-15,-20,29,3);R(c,'#8b6387',-14,8,29,2);return;}
    P(c,INK,[[-17,-20],[-9,-28],[14,-26],[18,-20],[17,10],[-16,10]]);P(c,'#ac7a66',[[-14,-20],[-8,-25],[13,-24],[15,-20]]);R(c,'#795363',-14,-18,29,26);R(c,'#ad7b75',-13,-18,3,24);R(c,'#4d374d',11,-17,4,25);for(let y=-13;y<6;y+=7){R(c,'#4c384d',-10,y,21,1);R(c,'#b58a7c',-8,y+2,16,1);}P(c,'#b78a79',[[-12,-17],[-8,-17],[13,5],[13,8],[9,8],[-12,-13]]);P(c,'#6d4957',[[10,-17],[14,-17],[-9,8],[-13,8],[-13,4]]);R(c,'#e1b397',-12,-17,2,2);R(c,'#c3a599',11,6,2,2);R(c,'#47394c',-17,8,35,3);
  }
  _pallet(c,p){
    const levels=(p.variant||0)%3+1;shadow(c,2,10,57,18,.5);
    for(let level=0;level<levels;level++){const y=7-level*8;P(c,INK,[[-26,y-9],[-18,y-16],[23,y-15],[29,y-8],[26,y+3],[-25,y+3]]);R(c,'#8c665f',-24,y-8,50,8);R(c,'#b08473',-23,y-8,49,2);for(let x=-19;x<24;x+=17)R(c,'#30283b',x,y-4,11,5);for(let x=-22;x<26;x+=10){P(c,'#aa7c69',[[x,y-9],[x+6,y-15],[x+13,y-15],[x+8,y-9]]);L(c,'#dbab8c',x+2,y-10,x+7,y-14,1);}R(c,'#60444f',-24,y+1,50,2);}
    R(c,'#c5a18d',-17,7,3,1);R(c,'#4a394a',19,0,4,1);
  }
  _bags(c,p){
    shadow(c,1,10,48,16,.57);
    for(const [x,y,w,h] of [[-21,-12,26,25],[-2,-20,27,32]]){O(c,INK,x-2,y-2,w+4,h+3);O(c,'#302d40',x,y,w,h);O(c,'#4b4257',x+2,y+3,w*.6,h*.5);L(c,'#625467',x+7,y+5,x+w-5,y+h-6,1);L(c,'#1b1b2d',x+w/2,y+5,x+w/2-4,y+h-3,2);R(c,'#2a263a',x+w/2-3,y-4,7,6);L(c,'#756475',x+w/2-4,y-2,x+w/2+5,y-2,1);}
    P(c,'#b88a67',[[-25,7],[-18,1],[-10,6],[-14,11]]);R(c,'#dcad7c',-19,5,6,1);R(c,'#b46073',14,7,8,4);R(c,'#d8bbc0',15,7,3,1);
  }
  _trophy(c,p){
    shadow(c,2,11,57,21,.56);P(c,INK,[[-25,-4],[25,-4],[26,11],[-26,11]]);R(c,'#615066',-22,-2,45,11);R(c,'#ad8d96',-22,-2,44,2);R(c,'#30263b',-15,2,31,6);text(c,'MOI',0,3,'#efd3a4',1,'center');R(c,'#34293e',-25,9,51,3);
    P(c,INK,[[-12,-8],[-6,-18],[-5,-30],[5,-30],[6,-18],[13,-8],[15,-4],[-15,-4]]);P(c,'#ad7b24',[[-9,-8],[-3,-19],[-3,-29],[3,-29],[3,-18],[10,-8]]);R(c,'#e8b74a',-4,-24,3,17);R(c,'#f5d984',-8,-8,18,2);
    for(const side of [-1,1]){O(c,INK,side<0?-29:14,-53,17,24);O(c,'#b08532',side<0?-27:16,-51,13,20);O(c,'#30243b',side<0?-24:19,-48,8,14);L(c,'#f0c96c',side*21,-50,side*23,-40,2);}
    P(c,INK,[[-20,-60],[20,-60],[17,-40],[10,-31],[-10,-31],[-17,-40]]);P(c,'#d5a02f',[[-17,-58],[17,-58],[14,-41],[8,-34],[-8,-34],[-14,-41]]);P(c,'#f4cd64',[[-14,-57],[-3,-57],[-5,-35],[-11,-39]]);P(c,'#97651e',[[11,-56],[16,-56],[12,-42],[7,-36]]);R(c,'#fff0a1',-15,-58,28,2);
    // A grandiose, visibly fake face and crown cast into the cheap gold cup.
    L(c,'#67462b',-9,-49,-3,-50,2);L(c,'#67462b',4,-50,10,-49,2);R(c,'#fff0af',-7,-47,3,2);R(c,'#fff0af',5,-47,3,2);P(c,'#7b5128',[[-9,-43],[-5,-40],[6,-40],[10,-44],[8,-36],[-6,-36]]);R(c,'#e9b95f',-4,-42,9,1);
    P(c,INK,[[-16,-63],[-18,-76],[-7,-69],[0,-81],[8,-69],[18,-76],[15,-63]]);P(c,'#e9b446',[[-13,-65],[-14,-72],[-6,-66],[0,-77],[6,-66],[14,-72],[12,-65]]);R(c,'#ffe4a0',-13,-65,26,2);R(c,'#d965a0',-2,-68,5,4);
    R(c,'#8e8a96',11,-41,3,4);R(c,'#b5a5aa',10,-42,2,2);R(c,'#c3a155',-15,14,5,1);R(c,'#d7bc70',15,10,3,2);
  }
  _hydrant(c,p){
    const color=(p.variant||0)%2?'#6c607e':'#a45163';shadow(c,1,9,30,12,.51);
    O(c,INK,-10,-9,21,20);R(c,color,-8,-15,17,21);O(c,'#c98a8b',-7,-25,15,14);O(c,INK,-9,-21,19,9);R(c,color,-8,-20,17,8);R(c,'#deaaa0',-6,-22,10,3);R(c,'#e6b5a2',-6,-13,2,16);R(c,'#63374e',5,-13,3,16);R(c,INK,-15,-12,9,9);R(c,'#b37683',-14,-11,8,7);R(c,'#dec1b4',-14,-10,2,4);R(c,INK,7,-12,9,9);R(c,'#bb7d87',9,-11,6,7);R(c,'#493d52',-10,5,22,5);R(c,'#9c8a99',-8,6,17,2);R(c,'#c4b7b9',-5,-27,10,3);R(c,'#7b5369',-3,-29,6,2);L(c,'#796778',13,-4,17,3,1);L(c,'#796778',17,3,11,8,1);
  }
  isPropVisible(p,camera,width,height){
    // Match the complete cached sprite bounds, including tall roofs whose feet
    // are below the screen. Avoid constructing offscreen images and cycling
    // through the bounded cache on dense city blocks.
    const building=p.type==='building',w=Math.round(p.w||40),h=Math.round(p.h||40);
    const lamp=p.type==='lamp';
    const cw=building?w+74:p.type==='billboard'?Math.max(128,w+30):lamp?264:100;
    const ch=building?h+190:lamp?258:180,ay=building?Math.ceil(h/2)+110:lamp?124:110;
    const x=p.x-Math.floor(cw/2),y=p.y-ay;
    return x+cw>=camera.x-width/2&&x<=camera.x+width/2&&y+ch>=camera.y-height*.48&&y<=camera.y+height*.52;
  }
  _propImage(p,seed,reduced=false){
    if(this.propMode!==reduced){this.props.clear();this.propBytes=0;this.propMode=reduced;}
    const w=Math.round(p.w||40),h=Math.round(p.h||40),baseVariant=p.variant??Math.floor(hash(p.x,p.y,seed)*5),v=p.artVariant??(p.type==='billboard'?((baseVariant+Math.floor(p.x/512)+2*Math.floor(p.y/512))%5+5)%5:baseVariant),detail=p.type==='building'?Math.floor(hash(p.x,p.y,seed+3)*10000):seed,key=`${p.type}:${p.buildingKind||'apartment'}:${p.damage||0}:${w}:${h}:${v}:${detail}`;
    if(this.props.has(key)){const item=this.props.get(key);this.props.delete(key);this.props.set(key,item);return item;}
    const building=p.type==='building',cw=building?w+74:p.type==='billboard'?Math.max(128,w+30):100,ch=building?h+190:180,ax=Math.floor(cw/2),ay=building?Math.ceil(h/2)+110:110;
    const image=canvas(cw,ch);if(!image)return null;const c=image.getContext('2d');c.imageSmoothingEnabled=false;c.translate(ax,ay);
    const details=[];if(building)this.facadeDetails.set(c,details);
    const lit=(building&&p.buildingKind!=='ruin')||['foodcart','vending','phone'].includes(p.type),light=lit?canvas(cw,ch):null;
    if(light){const lc=light.getContext('2d');lc.translate(ax,ay);this.lighting.set(c,lc);}
    if(building)this._buildingVariant(c,p,seed);else if(['pine','rock','stump','log','forestRuin'].includes(p.type))this._nature(c,{...p,variant:v},seed);else if(p.type==='car')this._car(c,p,seed);else if(p.type==='bike')this._bike(c,p);else if(p.type==='bin')this._bin(c);else if(p.type==='bench')this._bench(c);else if(p.type==='lamp')this._lamp(c);else if(p.type==='mirror')this._mirror(c);else if(p.type==='phone')this._phone(c);else if(p.type==='billboard')this._billboard(c,{...p,variant:v});else if(p.type==='foodcart')this._foodcart(c,p);else if(p.type==='vending')this._vending(c,p);else if(p.type==='planter')this._planter(c,p);else if(p.type==='tree')this._tree(c,p);else if(p.type==='table')this._table(c,p);else if(p.type==='cone')this._cone(c,p);else if(p.type==='barricade')this._barricade(c,p);else if(p.type==='crate')this._crate(c,p);else if(p.type==='pallet')this._pallet(c,p);else if(p.type==='bags')this._bags(c,p);else if(p.type==='trophy')this._trophy(c,p);else if(p.type==='hydrant')this._hydrant(c,p);
    this.lighting.delete(c);this.facadeDetails.delete(c);
    if(light){
      c.translate(-ax,-ay);c.globalCompositeOperation='destination-over';c.globalAlpha=reduced?.22:1;c.drawImage(light,0,0);
    }
    const result={image,x:-ax,y:-ay,windows:details.filter((_,i)=>i%4===0).slice(0,2),bytes:cw*ch*4};this.props.set(key,result);this.propBytes+=result.bytes;this._trimProps();return result;
  }
  occludes(p,body,seed=42,reduced=false){
    // Architecture opens a window around Toma rather than hiding his body.
    if(p.type==='building')return false;
    const item=this._propImage(p,seed,reduced);if(!item)return false;
    if(item.coverage===undefined){
      try{
        // These sprites are painted locally, so file:// image taint never enters them.
        const pixels=item.image.getContext('2d').getImageData(0,0,item.image.width,item.image.height).data;
        item.coverage=new Uint8Array(pixels.length/4);
        for(let i=0;i<item.coverage.length;i++)item.coverage[i]=pixels[i*4+3]>192?1:0;
        item.bytes+=item.coverage.length;this.propBytes+=item.coverage.length;this._trimProps();
      }catch(error){if(error.name!=='SecurityError')throw error;item.coverage=null;}
    }
    const scale=p.artScale||1,required=(body.right-body.left)*(body.foot-body.top)*.3;
    if(item.coverage===null){
      // An inscribed core avoids treating transparent canopy margins as cover.
      const tree=p.type==='tree'||p.type==='pine',half=tree?15:Math.min(15,(p.w||30)/3),top=tree?-60:-Math.min(60,p.h||30),foot=tree?-30:-10;
      const width=Math.max(0,Math.min(body.right,p.x+half*scale)-Math.max(body.left,p.x-half*scale)),height=Math.max(0,Math.min(body.foot,p.y+foot*scale)-Math.max(body.top,p.y+top*scale));
      return width*height>=required;
    }
    const x0=Math.round(p.x),y0=Math.round(p.y),w=item.image.width,h=item.image.height;
    let covered=0;
    for(let y=Math.ceil(body.top);y<body.foot;y++)for(let x=Math.ceil(body.left);x<body.right;x++){
      const sx=Math.floor((x-x0)/scale-item.x),sy=Math.floor((y-y0)/scale-item.y);
      if(sx>=0&&sx<w&&sy>=0&&sy<h&&item.coverage[sy*w+sx]&&++covered>=required)return true;
    }
    return false;
  }
  _facadeLife(ctx,p,item,time,seed){
    const phase=hash(p.x,p.y,seed+821),t=time+phase*47;
    ctx.save();
    for(const [i,w]of item.windows.entries()){
      const cycle=(t/(26+i*11)+i*.37)%1,light=.5+.5*Math.tanh(Math.sin(cycle*TAU)*9);
      const tv=i===0&&phase>.83;
      ctx.globalAlpha=tv?.14+.055*Math.sin(t*5.3)+.035*Math.sin(t*8.7):.38*(1-light);
      const color=tv?'#8fbbd4':'#111b2e',half=(w.w-2)/2;
      R(ctx,color,p.x+w.x,p.y+w.y,half,w.h);R(ctx,color,p.x+w.x+half+2,p.y+w.y,half,w.h);
      if(!tv){ctx.globalAlpha=light*.16;R(ctx,w.warm?'#e3b47c':'#90b8c8',p.x+w.x,p.y+w.y,half,w.h);}
    }
    if(p.buildingKind==='shop'){
      const {top,foot}=buildingGeometry(p),breath=.5+.5*Math.sin(t*1.2);
      // Only a seeded minority has a two-beat fault, once per 19 seconds.
      const fault=t%19,stutter=phase>.7&&((fault>0&&fault<.07)||(fault>.15&&fault<.23));
      ctx.globalAlpha=stutter?.32:.06+breath*.06;
      R(ctx,stutter?'#18192b':'#ffe1aa',p.x-p.w/2+6,p.y+top-2,p.w-13,stutter?10:1);
      this._glow(ctx,'gold',p.x,p.y+top+5,p.w+28,36,stutter?.01:.07+breath*.06);
      ctx.globalAlpha=.08+breath*.07;R(ctx,'#c3a280',p.x-p.w*.22+Math.sin(t)*2,p.y+foot+17,p.w*.43,1);
    }
    ctx.restore();
  }
  drawProp(ctx,p,seed=42,time=0,reduced=false,focus=null){
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;const item=this._propImage(p,seed,reduced);if(!item)return;
    const cover=propForegroundBounds(p);
    const coversActor=(actor,padding=16)=>actor&&actor.y+10<cover.foot&&actor.y>cover.top&&actor.y-64<cover.foot&&Math.abs(actor.x-p.x)<cover.halfWidth+padding;
    const architecture=p.type==='building',windows=architecture?this._buildingWindows(p,seed,focus,coversActor,reduced):[];
    const obscures=!architecture&&cover&&focus&&(coversActor(focus)||(focus.companion&&coversActor(focus.girl))||(focus.enemies||[]).some(e=>!e.dead&&e.hp>0&&coversActor(e,38)));
    const image=windows.length?this._cutaway(item,p,windows):item.image;
    if(obscures){ctx.save();ctx.globalAlpha=.34;}
    const swaying=!reduced&&(p.type==='pine'||p.type==='tree');
    if(swaying){const phase=hash(p.x,p.y,seed+811)*TAU,shear=(Math.sin(time*.85+phase)+.35*Math.sin(time*1.7+phase))*.012;ctx.save();ctx.translate(p.x,p.y+10);ctx.transform(1,0,shear,1,0,0);ctx.translate(-p.x,-p.y-10);}
    if(p.artScale&&p.artScale!==1){ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));ctx.scale(p.artScale,p.artScale);ctx.drawImage(image,item.x,item.y);ctx.restore();}
    else ctx.drawImage(image,Math.round(p.x+item.x),Math.round(p.y+item.y));
    if(swaying)ctx.restore();
    if(obscures)ctx.restore();
    if(reduced)return;
    const scaled=p.artScale&&p.artScale!==1;
    if(scaled){ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.artScale,p.artScale);ctx.translate(-p.x,-p.y);}
    // Never paint a light back over the local actor-reveal cutaway.
    if(architecture&&!windows.length)this._facadeLife(ctx,p,item,time,seed);
    // Minute life in an abandoned district: unreliable neon, not whole-screen flashes.
    if(p.type==='lamp'){const breath=.85+.15*Math.sin(time*1.1+p.x);ctx.save();ctx.globalAlpha=.22*breath;O(ctx,'#ffe2a3',p.x+6,p.y-92,37,20,2);ctx.globalAlpha=.45*breath;R(ctx,'#fff0c8',p.x+15,p.y-84,16,2);ctx.restore();}
    else if(['phone','vending','foodcart'].includes(p.type)){
      const phase=hash(p.x,p.y,seed+823),t=time+phase*43,breath=.5+.5*Math.sin(t*1.3),fault=t%23;
      const stutter=phase>.74&&((fault<.065)||(fault>.16&&fault<.23));
      const y=p.type==='phone'?-62:p.type==='vending'?-61:-75,w=p.type==='foodcart'?40:25;
      ctx.save();ctx.globalAlpha=stutter?.4:.1+breath*.12;
      R(ctx,stutter?'#19172b':'#e8b0cc',p.x-w/2,p.y+y,w,stutter?7:1);
      this._glow(ctx,p.type==='foodcart'?'gold':'pink',p.x,p.y+y+3,w+48,32,stutter?.01:.06+breath*.07);ctx.restore();
    }
    else if(p.type==='mirror'&&Math.sin(time*.6+p.x)>.85)star(ctx,p.x+8,p.y-48,'#e6d8ed',2);
    if(scaled)ctx.restore();
  }
}
