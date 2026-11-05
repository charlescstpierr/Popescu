// Deterministic card-selection audit, not a human gameplay or victory rating.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const roots=process.argv.slice(2);if(!roots.length)roots.push('.');
const offense=new Set(['muscle','car','followers','money','girlfriend','chopper','truth','billionaire','viralLove']);
const survival=new Set(['ego','airplane','charisma','filter','validation','speed','detox','recovery','barrier']);
const output=[];
for(const root of roots){
 const {Game}=await import(pathToFileURL(resolve(root,'dist/engine.js'))),g=new Game();
 const counts={},sets=new Set(),slots=[{}, {}, {}];let noOffense=0,noSurvival=0,duplicates=0;
 for(let i=1;i<=10000;i++){
  g.rng=Math.imul(i,0x9e3779b9);const ids=g.rollUpgradeOptions().map(o=>o.id);
  if(!ids.some(id=>offense.has(id)))noOffense++;if(!ids.some(id=>survival.has(id)))noSurvival++;
  if(new Set(ids).size!==ids.length)duplicates++;
  sets.add([...ids].sort().join(','));ids.forEach((id,slot)=>{counts[id]=(counts[id]||0)+1;slots[slot][id]=(slots[slot][id]||0)+1;});
 }
 output.push({root:resolve(root),drafts:10000,noOffense,noSurvival,duplicates,uniqueSets:sets.size,counts,slots});
}
console.log(JSON.stringify(output,null,2));
