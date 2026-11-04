import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {compactDrops,pickupAttraction} from '../dist/drops.js';

// Captured from the natural seed42/right/first-choice replay at139.3s, before
// its later death. Real terrain, HP, travel and203XP bank are retained. Only
// unrelated drops/combat are excluded from the collection subsystem probe.
const fixture=JSON.parse(readFileSync(new URL('./fixtures/xp-real-bank-139s.json',import.meta.url),'utf8'));
const total=s=>s.drops.filter(d=>d.kind==='xp').reduce((sum,d)=>sum+d.value,0);
function probe(compact){
 const g=new Game({seed:fixture.seed});g.s=g.state=structuredClone(fixture.s);g.world.setDestroyed(fixture.destroyed);
 const old=g.s.drops.find(d=>d.compact);assert.ok(old.value>=200);assert.ok(g.s.hp>0);assert.ok(g.s.travelX>.99);
 // Trigger the actual relocation threshold through collision-aware movement,
 // not by moving the bank or teleporting the hero to the test endpoint.
 for(let i=0;i<200&&Math.hypot(old.x-g.s.x,old.y-g.s.y)<1800;i++)g.move(g.s,g.s.stats.speed/60,0,13);
 assert.ok(Math.hypot(old.x-g.s.x,old.y-g.s.y)>=1800);
 g.s.faceX=-1;g.s.faceY=0;assert.ok(g.s.faceX*g.s.travelX+g.s.faceY*g.s.travelY<0);
 const before=total(g.s);assert.equal(before,219);
 g.s.drops=compact(g.s,g.world);const bank=g.s.drops.find(d=>d.compact);
 assert.equal(total(g.s),before);assert.equal(bank.value,203);
 assert.notDeepEqual([bank.x,bank.y],[old.x,old.y],'a real relocation must occur, not merely an unexercised assertion');
 const attraction=pickupAttraction(g.s,bank);assert.ok(attraction.distance>attraction.reach+24,'outside player or companion pickup reach');
 const dot=(bank.x-g.s.x)*g.s.travelX+(bank.y-g.s.y)*g.s.travelY;
 g.s.drops=[bank];const xp=g.s.xp,level=g.s.level,hp=g.s.hp;
 for(let i=0;i<120&&g.s.level===level&&g.s.xp===xp;i++){g.move(g.s,g.s.stats.speed/60,0,13);g.updateDrops(1/60);}
 const credited=g.s.level!==level||g.s.xp!==xp;
 assert.equal(g.s.hp,hp+(credited?4:0),'only the ordinary level-up may restore health');
 return {g,dot,credited,bank,xp,level};
}
test('real large bank relocation stays behind travel, conserves all XP and cannot credit a forward runner',()=>{
 const result=probe(compactDrops);assert.ok(result.dot<=1e-8);assert.equal(result.credited,false);assert.equal(total(result.g.s),203);assert.equal(result.g.s.xp,result.xp);assert.equal(result.g.s.level,result.level);
});
test('historical facing/companion-direction negative control is rejected by the real-bank invariant',async()=>{
 let source=readFileSync(new URL('../dist/drops.js',import.meta.url),'utf8');
 const direction='let dx=hasTravel?-state.travelX:packet.x-state.x,dy=hasTravel?-state.travelY:packet.y-state.y;';
 assert.ok(source.includes(direction));assert.ok(source.includes('i<(hasTravel?17:32)'));
 source=source.replace("from './content.js'",`from '${new URL('../dist/content.js',import.meta.url).href}'`).replace(direction,'let dx=girl?state.x-girl.x:-state.faceX,dy=girl?state.y-girl.y:-state.faceY;').replace('i<(hasTravel?17:32)','i<32');
 const {compactDrops:historical}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const result=probe(historical);assert.ok(result.dot>0,'historical direction must put the bank ahead');assert.equal(result.credited,true,'negative control must reproduce remote credit, not vacuously pass');
});
test('returning physically to the real bank still credits its complete203XP',()=>{
 const {g,bank}=probe(compactDrops);let credited=0;const gain=g.gainXP.bind(g);g.gainXP=n=>{credited+=n;return gain(n);};
 for(let i=0;i<400&&g.s.drops.some(d=>d.compact);i++){const dx=bank.x-g.s.x,dy=bank.y-g.s.y,d=Math.hypot(dx,dy),step=Math.min(d,g.s.stats.speed/60);g.move(g.s,dx/(d||1)*step,dy/(d||1)*step,13);g.updateDrops(1/60);}
 assert.equal(credited,203);assert.equal(g.s.drops.length,0);assert.equal(g.s.mode,'upgrade');
});
