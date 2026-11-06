import test from 'node:test';
import assert from 'node:assert/strict';
import {drawAnimalWarning,beginAnimalAttack} from '../dist/animals.js';
import {drawEgoGround} from '../dist/ego-art.js';
import {initEgoBeast,beginEgoAttack} from '../dist/ego-beasts.js';
import {drawPelicanGround} from '../dist/pelican-art.js';
import {drawCharlesWarnings} from '../dist/charles-effects.js';
import {enemyAccent} from '../dist/combat-art.js';

function recording(){
 const calls=[],ctx=new Proxy({globalAlpha:1,save(){},restore(){},fill(){calls.push(['fill',this.fillStyle]);}},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>{if(k==='fillStyle'||k==='strokeStyle')calls.push([k,v]);o[k]=v;return true;}});
 return {ctx,calls};
}
const cases=[];
for(const type of ['ostrich','paparazzi','moose','disco_chicken']){
 const e={type,x:0,y:0};beginAnimalAttack(e,{x:80,y:0});cases.push([type,e,(c,e,p)=>drawAnimalWarning(c,e,false,p,10)]);
}
for(const type of ['ego_peacock','ego_toad','ego_rat','ego_chameleon']){
 const e=initEgoBeast({type,x:0,y:0,phase:'chase'});beginEgoAttack(e,{x:80,y:0});cases.push([type,e,(c,e,p)=>drawEgoGround(c,e,false,p,10)]);
}
for(const kind of ['hug','zodiac','tarot']){
 const e={type:'pelican',x:0,y:0,peliX:0,peliY:0,peliDX:1,peliDY:0,peliTime:.6,phase:`peli_${kind}_warning`};cases.push([kind,e,(c,e,p)=>drawPelicanGround(c,e,false,p,10)]);
}
for(const phase of ['shock_warning','shockwave','cape_warning','cape_spin']){
 const e={x:0,y:0,phase,phaseTime:.5,phaseDuration:2,elapsed:10,safeAngle:0,waveMax:300,capeRadius:112};cases.push([phase,e,(c,e,p)=>drawCharlesWarnings(c,e,false,p)]);
}
for(const [name,actor,draw]of cases)test(`${name} fills only the ground and keeps a crisp danger edge`,()=>{
 const before=JSON.stringify(actor),ground=recording(),edge=recording();draw(ground.ctx,actor,'ground');draw(edge.ctx,actor,'edge');
 assert.ok(ground.calls.some(c=>c[0]==='fill'),name);assert.ok(ground.calls.some(c=>c[0]==='fillStyle'&&c[1]==='#ff472b'),name);
 assert.equal(ground.calls.some(c=>c[0]==='stroke'),false);assert.equal(edge.calls.some(c=>c[0]==='fill'&&c[1]==='#ff472b'),false);
 assert.ok(edge.calls.some(c=>c[0]==='strokeStyle'&&c[1]==='#ff8951'));
 assert.equal(JSON.stringify(actor),before);
});
test('crowd accent falloff is smooth, leaves near actors intact and preserves attackers',()=>{
 const s={x:0,y:0},e={x:100,y:0};assert.equal(enemyAccent(e,s),1);
 const samples=[110,175,240,305,370].map(x=>enemyAccent({...e,x},s));
 for(let i=1;i<samples.length;i++)assert.ok(samples[i]<samples[i-1]);assert.ok(samples.at(-1)>.2);
 assert.ok(Math.abs(enemyAccent({...e,x:239.99},s)-enemyAccent({...e,x:240.01},s))<.001);
 for(const fields of [{windup:.1},{swipe:.1},{charge:.1},{crow:.1},{phase:'animal_warning'},{phase:'ego_warning'}])assert.equal(enemyAccent({...e,x:500,...fields},s),1);
});
