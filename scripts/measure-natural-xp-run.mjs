import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
// Preserve the original seed42/right/first-offered-upgrade190s canary as a
// natural balance measurement. Never call early death a passing XP replay.
// Optional argument: another source root, for a matched published comparison.
const root=process.argv[2]?pathToFileURL(resolve(process.argv[2])+'/'):new URL('../',import.meta.url);
const {Game}=await import(new URL('dist/engine.js',root));
const g=new Game({seed:42}),upgrades=[],damage=[];const hurt=g.damage.bind(g);
g.damage=(amount,source,context)=>{const hp=g.s.hp;const returned=hurt(amount,source,context);if(g.s.hp<hp)damage.push({at:g.s.elapsed,loss:hp-g.s.hp,hp:g.s.hp,source,context});return returned;};
while(g.s.elapsed<190&&g.s.mode!=='gameover'){
 if(g.s.mode==='upgrade'){upgrades.push({at:g.s.elapsed,id:g.s.options[0].id});g.chooseUpgrade(g.s.options[0].id);}
 if(g.s.mode==='dialogue')g.finishDialogue();g.update(1/30,{x:1,y:0});
}
const bank=g.s.drops.find(d=>d.compact),times=upgrades.map(u=>u.at),completed=g.s.elapsed>=190;
const assertions={aliveAt190:completed&&g.s.hp>0,levelBelow9:g.s.level<9,no187SecondUpgrade:!times.some(t=>t>=187&&t<188),noInstantUpgradeChain:new Set(times).size===times.length,substantialBankBehind:Boolean(bank&&Number.isInteger(bank.value)&&bank.value>=200&&bank.x<g.s.x),dropCap:g.s.drops.length<=260};
const result={configuration:'Natural Game seed42,normal,from0,0,right at1/30s,first offered upgrade,finish dialogues. No health,enemy,world or damage changes.',source:root.href,at:g.s.elapsed,completed190:completed,coverage:completed?'190-second exploit window exercised':'INCOMPLETE: genuine death before the190-second window',mode:g.s.mode,hp:g.s.hp,death:g.s.deathCause||null,level:g.s.level,kills:g.s.kills,upgrades,bank,assertions,damage};
console.log(JSON.stringify(result,null,2));if(!Object.values(assertions).every(Boolean))process.exitCode=2;
