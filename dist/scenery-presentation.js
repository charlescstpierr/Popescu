// Art-only dressing. The World retains every original ID, coordinate, collider,
// destruction record and contextual landmark. Never return this into simulation.
const looseClutter=new Set(['bags','crate','cone','pallet','barricade']);
const smallLandmarks={trophy:.62,vending:.82,phone:.84,mirror:.86};
const mod=(n,m)=>((n%m)+m)%m;
function detailHash(p){
 let n=Math.imul(Math.round(p.x),374761393)^Math.imul(Math.round(p.y),668265263)^(p.variant||0);
 n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;
}
export function presentSceneryProp(p){
 if(!p||p.presentationApplied)return p;
 if(p.type==='pine')return {...p,artVariant:detailHash(p)%20,presentationApplied:true};
 if(!p.solid&&looseClutter.has(p.type)&&detailHash(p)%4!==0)return null;
 if(p.type==='building'&&p.w>=100){
  const district=mod(Math.floor(p.x/512)+2*Math.floor(p.y/512),4);
  // Three residential fronts for one shop/service building. Keep both brick
  // walk-ups and setback condos, rather than sprinkling a rare tower into yards.
  if(district<3)return {...p,buildingKind:'apartment',variant:district===0?1:2,damage:Math.min(p.damage||0,1),presentationApplied:true};
 }
 if(p.type==='billboard')return {...p,artVariant:1+mod(Math.floor(p.x/512)+2*Math.floor(p.y/512),4),presentationApplied:true};
 if(smallLandmarks[p.type])return {...p,artScale:smallLandmarks[p.type],presentationApplied:true};
 return p;
}
