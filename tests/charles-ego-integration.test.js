import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {Renderer} from '../dist/renderer.js';
import {EGO_BEASTS} from '../dist/ego-beasts.js';
function advance(g,seconds){for(let i=0;i<Math.ceil(seconds*60);i++)g.update(Math.min(1/60,seconds-i/60));}
for(const phase of ['ego_warning','ego_active','ego_recover'])test(`four new creature paintings remain inert and saveable during Charles arrival from ${phase}`,()=>{
 const g=new Game({seed:71});g.s.elapsed=1200;g.s.mode='victory';
 for(const [i,type]of Object.keys(EGO_BEASTS).entries()){
  const e=g.spawnEnemy(type,i*35,40);Object.assign(e,{phase,egoTime:.1,egoDX:1,egoDY:0,hp:1,hitFlash:.1});
 }
 const before=structuredClone(g.s.enemies);g.startCharlesEpilogue();advance(g,3.3);assert.deepEqual(g.s.enemies,before);assert.equal(g.s.kills,0);
 g.pause();const saved=captureRun(g),resumed=restoreRun(saved);assert.deepEqual(captureRun(resumed),saved);resumed.resume();advance(resumed,.9);assert.equal(resumed.s.enemies.length,0);assert.equal(resumed.s.kills,0);assert.equal(resumed.s.coins,0);assert.equal(resumed.s.elapsed,1200);
});
test('combined EGO status markers inherit disappearance alpha without restoring frozen attack cues',()=>{
 const calls=[],stack=[];const ctx=new Proxy({globalAlpha:.25,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();}},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push({kind:k,args,alpha:o.globalAlpha}),set:(o,k,v)=>(o[k]=v,true)});
 const r=Object.create(Renderer.prototype);Object.assign(r,{ctx,actors:{draw(c){c.fillRect(0,0,10,10);return true;}},time:1,reducedEffects:true,_shadow(){}});
 for(const type of Object.keys(EGO_BEASTS)){
  const g=new Game(),e=g.spawnEnemy(type,10,10);Object.assign(e,{phase:'ego_active',egoTime:.1,egoReveal:2,hp:1,hitFlash:.1});g.s.charles={phase:'intro',phaseTime:4.25,phaseDuration:8};calls.length=0;
  r._actor(e,'enemy',0,g.s);assert.ok(calls.filter(c=>c.kind==='fillRect').length>=3,'body and damaged health bar stay present');assert.ok(calls.every(c=>c.alpha<=.25));assert.equal(calls.filter(c=>c.kind==='stroke').length,0,'inactive attack foreground stays hidden');assert.equal(ctx.globalAlpha,.25);
 }
});
