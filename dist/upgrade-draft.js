// Draft roles are about immediate mechanical choices, not power or rarity.
// Attraction and payday remain free-slot options; evolutions count as offense.
const OFFENSE=new Set(['muscle','car','followers','money','girlfriend','chopper','truth','billionaire','viralLove']);
const SURVIVAL=new Set(['ego','airplane','charisma','filter','validation','speed','detox','recovery','barrier']);
const roles=options=>Number(options.some(o=>OFFENSE.has(o.id)))+Number(options.some(o=>SURVIVAL.has(o.id)));

// At most C(15,3)=455 subsets in the current catalog, only when opening cards.
// Prefer both roles, then as many previously unseen cards as possible. Keeping
// all equally eligible subsets avoids a fixed favored power or card position.
export function upgradeDrafts(pool,fixed=[],previous=[]){
 const count=Math.min(3-fixed.length,pool.length),old=new Set(previous.map(o=>o.id));
 let bestRoles=-1,bestFresh=-1,drafts=[];
 function visit(start,picked){
  if(picked.length===count){
   const draft=[...fixed,...picked],coverage=roles(draft),fresh=picked.filter(o=>!old.has(o.id)).length;
   if(coverage<bestRoles||coverage===bestRoles&&fresh<bestFresh)return;
   if(coverage>bestRoles||fresh>bestFresh){bestRoles=coverage;bestFresh=fresh;drafts=[];}
   drafts.push(draft);return;
  }
  for(let i=start;i<=pool.length-(count-picked.length);i++)visit(i+1,[...picked,pool[i]]);
 }
 visit(0,[]);return drafts;
}

export function drawUpgradeDraft(drafts,fixedCount,random){
 const choices=[...drafts[Math.floor(random()*drafts.length)]];
 // Ready evolutions retain their explicit priority. Ordinary cards do not
 // privilege offense in the first position. One RNG draw per non-fixed card.
 for(let i=choices.length-1;i>fixedCount;i--){
  const j=fixedCount+Math.floor(random()*(i-fixedCount+1));
  [choices[i],choices[j]]=[choices[j],choices[i]];
 }
 return choices;
}
