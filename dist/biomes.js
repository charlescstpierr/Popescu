// Two-by-two sectors form continuous districts without creating another map.
export function biomeForChunk(cx,cy,seed=42){
  const x=Math.floor(cx/2),y=Math.floor(cy/2);
  if(x===0&&y===0)return 'city';
  if(x===1&&y===0)return 'forest';
  let n=Math.imul(x,374761393)^Math.imul(y,668265263)^(seed|0)^0x37bf128d;
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967296<.36?'forest':'city';
}
export const BUILDING_KINDS=Object.freeze(['apartment','garage','warehouse','shop','ruin']);

// A shallow river follows an existing clear street, so legacy saved positions,
// enemy routes and destruction IDs are unchanged. Crossroads get broad bridges.
// The model is in world coordinates, including negative chunks: tiles never
// invent separate bends or half-bridges at their edges.
export function riverSection(lane,y){
  const base=1024+lane*4096;
  return {x:base+23*Math.sin(y/100)+3*Math.sin(y/37),halfWidth:27+3*Math.sin(y/181),
    bridge:Math.abs(y-Math.round(y/512)*512)<=58};
}
