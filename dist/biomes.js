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
