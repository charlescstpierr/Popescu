// Art keeps its original anchor/foot while short buildings expose empty space
// above their facade. Collision and sorting consume these same dimensions.
export function buildingGeometry(p){
  const kind=p.buildingKind||'apartment',foot=p.h/2;
  const height=kind==='apartment'?p.h+43:kind==='warehouse'?Math.max(90,p.h*.72):kind==='ruin'?p.h*.83:kind==='shop'?Math.max(76,p.h*.55):Math.max(62,p.h*.42);
  return {foot,height,top:foot-height};
}
export function propCollisionBounds(p){
  if(p.type!=='building')return {x:p.x,y:p.y,w:p.w,h:p.h};
  const {height}=buildingGeometry(p),h=Math.min(p.h,height);
  return {x:p.x,y:p.y+(p.h-h)/2,w:p.w,h};
}
export function propDepth(p){
  if(p.type==='building')return p.y+buildingGeometry(p).foot;
  return p.y+(p.type==='car'?(p.h||30)/2:10);
}

// Conservative foreground extents used for player fading and animal introductions.
// They describe tall painted cover, separately from its ground collision footprint.
export function propForegroundBounds(p){
 if(!['building','pine','tree','billboard','foodcart','vending','trophy','mirror','phone'].includes(p.type))return null;
 const foot=p.type==='building'?p.y+p.h/2:p.y+10;
 const top=p.type==='building'?p.y+buildingGeometry(p).top-45:p.y-112;
 const halfWidth=p.type==='pine'||p.type==='tree'?48:p.w/2+18;
 return {left:p.x-halfWidth,right:p.x+halfWidth,top,foot,halfWidth};
}
