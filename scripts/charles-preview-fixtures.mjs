import {writeFileSync,mkdirSync} from 'node:fs';import {resolve} from 'node:path';import {Game} from '../dist/engine.js';import {RunStore,captureRun,restoreRun} from '../dist/run-save.js';import {CHARLES} from '../dist/charles.js';
const out=resolve(import.meta.dirname,'../proof/charles');mkdirSync(out,{recursive:true});
const base=()=>{const g=new Game({seed:71});Object.assign(g.s,{elapsed:1200,mode:'victory',level:12,kills:900,coins:75,xpNeed:100});g.s.upg={muscle:3,followers:2,truth:2};g.recalculate();return g;};
function write(name,g,reduced=false){const values=new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,sound:false,reduced})]]);const store=new RunStore({getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)});const result=store.begin('charles-preview-'+name,g,{best:1200,lifetime:900,coins:75});if(!result.ok)throw Error(name);restoreRun(captureRun(g));writeFileSync(out+'/preview-'+name+'-storage.json',JSON.stringify(Object.fromEntries(values),null,2));}
write('victory',base());
for(const name of ['intro','hover','shock_warning','cape_warning','descend','bend','scream','burst','empowered']){const g=base();g.startCharlesEpilogue();const c=g.s.charles;Object.assign(c,{phase:name,phaseTime:CHARLES.phases[name],phaseDuration:CHARLES.phases[name]});if(!['intro','hover','shock_warning','cape_warning'].includes(name)){c.hits=18;c.attackCount=2;c.elapsed=30;}if(name==='empowered')c.powered=true;write(name,g);write(name+'-reduced',g,true);}
for(const outcome of ['left','defeated']){const g=base();g.startCharlesEpilogue();if(outcome==='left')g.leaveCharlesEpilogue();else{const c=g.s.charles;Object.assign(c,{x:g.s.x,y:g.s.y,phase:'cape_spin',phaseTime:.85,phaseDuration:.85});g.update(.01);}write(outcome,g);}
console.log('21 valid storage fixtures written to '+out);
// Real destructible forest checkpoints for landing/takeoff browser verification.
{
 const g=base();g.startCharlesEpilogue();Object.assign(g.s,{x:-151,y:-240,shotClock:100});const c=g.s.charles;
 Object.assign(c,{x:-151,y:-384,phase:'descend',phaseTime:1.25,phaseDuration:1.25,hits:18,attackCount:2,elapsed:30});write('forest-before-landing',g);
 for(let i=0;i<100&&c.phase==='descend';i++)g.update(1/30);if(c.phase!=='bend'||!c.destroyed.length)throw Error('landing fixture');write('forest-landed',g);
 for(let i=0;i<200&&c.phase!=='burst';i++)g.update(1/30);if(c.phase!=='burst')throw Error('takeoff fixture');for(let i=0;i<18;i++)g.update(1/30);write('forest-takeoff',g);write('forest-takeoff-reduced',g,true);
 console.log('Four additional real forest impact fixtures written');
}
