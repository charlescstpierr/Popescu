import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {Renderer} from '../dist/renderer.js';
import {CharlesArt,charlesPose} from '../dist/charles-art.js';
import {drawCharlesForeground} from '../dist/charles-effects.js';
import {CHARLES_ARRIVAL} from '../dist/charles.js';
function context(){const calls=[],stack=[],ctx=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push({kind:k,args,alpha:o.globalAlpha}),set:(o,k,v)=>(o[k]=v,true)});return {ctx,calls};}
function scene(t){const r=context(),renderer=new Renderer({getContext:()=>r.ctx});renderer.resize(320,568);const game=new Game({seed:71});game.setViewport(320,568);game.s.elapsed=1200;game.spawnEnemy('normal',0,0);game.s.mode='victory';game.startCharlesEpilogue();game.s.charles.phaseTime=8-t;game.s.charles.elapsed=t;return {...r,renderer,game};}
test('arrival paints above scenery, fades enemies only, hides inert attack warnings and stays read-only',()=>{
 for(const reduced of [false,true]){const {ctx,renderer,game}=scene((CHARLES_ARRIVAL.snap+CHARLES_ARRIVAL.clear)/2),order=[],alphas=[];
  renderer.reducedEffects=reduced;renderer._drawGround=()=>{};renderer._prop=()=>order.push('prop');renderer.charles.draw=()=>order.push('charles');renderer._actor=(_,kind)=>{order.push(kind);alphas.push([kind,ctx.globalAlpha]);};renderer._dangerWarnings=()=>assert.fail('inert enemies cannot warn of damage');renderer._rivalAttack=()=>assert.fail('inert attacks cannot render');
  const before=JSON.stringify(game.s);renderer.render(game,50);assert.equal(JSON.stringify(game.s),before);assert.equal(order.at(-1),'charles');assert.ok(order.includes('prop'));
  assert.equal(alphas.find(a=>a[0]==='enemy')[1],.5);assert.equal(alphas.find(a=>a[0]==='hero')[1],1);
 }
});
test('complete enemy bodies, impact paint and shadows respect inherited disappearance alpha',async()=>{
 const {ctx,calls,renderer,game}=scene(3.75);await renderer.ready;renderer.actors.images.enemy={width:512,height:256};renderer.actors.frame=()=>({});renderer.actors.availableFor=()=>true;
 const enemy=game.s.enemies[0];enemy.hitFlash=.1;ctx.globalAlpha=.25;renderer._actor(enemy,'enemy',0,game.s);
 const bodies=calls.filter(c=>c.kind==='drawImage');assert.ok(bodies.length>=2);assert.ok(bodies.every(c=>c.alpha<=.25));assert.equal(ctx.globalAlpha,.25);
 renderer._shadow(0,0);assert.equal(ctx.globalAlpha,.25);
});
test('snap cue follows the painted raised hand, is local and finite in reduced effects',()=>{
 for(const reduced of [false,true]){const {ctx,calls}=context(),c={x:65,y:30,phase:'intro',phaseDuration:8,phaseTime:8-3.6,elapsed:3.6};
  drawCharlesForeground(ctx,c,reduced);const arc=calls.find(c=>c.kind==='arc'),pose=charlesPose(c,c.elapsed,reduced);assert.ok(arc);assert.equal(arc.args[0],Math.round(pose.x)+66.725-88);assert.equal(arc.args[1],Math.round(pose.y)+54.365-160);assert.ok(arc.args[2]<=36);assert.ok(calls.flatMap(c=>c.args).filter(a=>typeof a==='number').every(Number.isFinite));assert.ok(!calls.some(c=>['drawImage','filter','scale','rotate'].includes(c.kind)));assert.equal(ctx.globalAlpha,1);
 }
});
test('straightening flight keeps the face near its settled position without deforming paintings',async()=>{
 const before=charlesPose({x:65,y:30,phase:'intro',phaseDuration:8,phaseTime:8-2.599}),after=charlesPose({x:65,y:30,phase:'intro',phaseDuration:8,phaseTime:8-2.601});
 assert.ok(Math.abs(before.x+122-after.x-89)<2,'painted face does not jump backward when the torso straightens');
 const art=new CharlesArt({loadImage:async()=>({})});await art.ready;const r=context();art.draw(r.ctx,{x:65,y:30,phase:'intro',phaseDuration:8,phaseTime:5.401});assert.equal(r.calls.filter(c=>c.kind==='drawImage').length,1);assert.ok(!r.calls.some(c=>['scale','rotate','transform'].includes(c.kind)));
});

test('an already-attacking chameleon loses foreground attack cues during the harmless arrival only',()=>{
 const {ctx,calls,renderer,game}=scene(1);renderer.actors.draw=()=>true;const e=game.spawnEnemy('ego_chameleon',10,10);Object.assign(e,{phase:'ego_active',egoTime:.1,egoDX:1,egoDY:0});
 renderer._actor(e,'enemy',0,game.s);assert.equal(calls.filter(c=>c.kind==='stroke').length,0,'a frozen attack must not still advertise damage');
 game.s.charles.phase='hover';calls.length=0;renderer._actor(e,'enemy',0,game.s);assert.ok(calls.some(c=>c.kind==='stroke'),'ordinary chameleon cues are unchanged');
});
