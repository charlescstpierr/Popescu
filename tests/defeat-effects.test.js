import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {CombatArt} from '../dist/combat-art.js';
import {Renderer} from '../dist/renderer.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

test('lethal hits leave one short cue even when spawned and defeated between renders',()=>{
 const events=[],g=new Game({seed:42,onEvent:(type,payload)=>events.push([type,payload])});
 const e=g.spawnEnemy('normal',100,-30);g.hurt(e,1000);
 assert.equal(g.defeatEffects?.length,1,'a renderer-independent defeat record survives removal');
 const cue=g.defeatEffects[0];assert.equal(cue.actor.id,e.id);assert.equal(cue.actor.x,100);assert.equal(cue.actor.y,-30);
 assert.equal(cue.actor.type,'normal');assert.ok(cue.life<=.5);
 assert.equal(g.s.drops.find(d=>d.kind==='xp').value,2,'feedback does not increase rewards');
 g.kill(e);assert.equal(g.defeatEffects.length,1);assert.equal(g.s.kills,1);
 assert.equal(events.filter(([t,v])=>t==='sound'&&v==='kill').length,1);
});

test('horde defeats allocate a fixed budget and no duplicate generic death particles',()=>{
 const g=new Game({seed:42});
 for(let i=0;i<300;i++)g.hurt(g.spawnEnemy('normal',100+(i%10)*4,-100),1000);
 assert.ok(g.defeatEffects?.length>0&&g.defeatEffects.length<=16,'simultaneous kills keep at most sixteen visual records');
 assert.equal(g.s.particles.length,0,'bounded breakup replaces the old generic burst');
 const cues=JSON.stringify(g.defeatEffects);g.pause();g.update(.25);assert.equal(JSON.stringify(g.defeatEffects),cues,'modal time freezes impact');
 g.s.elapsed+=.6;g.updateEffects(0);assert.equal(g.defeatEffects.length,0,'finished impacts are released');
});

test('defeat cues are transient and are not replayed by save/resume',()=>{
 const g=new Game({seed:42});g.hurt(g.spawnEnemy('normal',100,-30),1000);
 assert.equal(g.defeatEffects?.length,1);
 const saved=captureRun(g);assert.equal(saved.game.defeatEffects,undefined);
 const restored=restoreRun(saved);assert.deepEqual(restored.defeatEffects,[]);
 assert.equal(restored.s.kills,1);assert.equal(restored.s.drops.filter(d=>d.kind==='xp').length,1);
});

test('renderer does not mistake offscreen removal for a defeat when a real cue is available',()=>{
 const g=new Game({seed:42}),art=new CombatArt();
 const removed=g.spawnEnemy('normal',900,0),victim=g.spawnEnemy('normal',90,0);
 art.prepare(g.s,g.seed,g.defeatEffects);g.s.enemies=g.s.enemies.filter(e=>e!==removed);g.hurt(victim,1000);
 const state=JSON.stringify(g.s),cues=JSON.stringify(g.defeatEffects);art.prepare(g.s,g.seed,g.defeatEffects);
 assert.equal(art.effects.filter(e=>e.kind==='death').length,0,'only explicit kill records drive defeat visuals');
 assert.equal(JSON.stringify(g.s),state);assert.equal(JSON.stringify(g.defeatEffects),cues);
});

function drawingContext(){
 const calls=[],ctx={calls,globalAlpha:1,fillStyle:'',save(){},restore(){},translate(){},fillRect(x,y,w,h){calls.push({op:'pixel',color:this.fillStyle,x,y,w,h});},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){calls.push({op:'shape',color:this.fillStyle});}};
 return ctx;
}
test('the short breakup is localized, bounded and disabled with reduced effects',()=>{
 const g=new Game({seed:42}),art=new CombatArt();g.hurt(g.spawnEnemy('normal',100,-30),1000);art.prepare(g.s,g.seed,g.defeatEffects);
 assert.equal(typeof art.drawDefeats,'function');
 g.s.elapsed=.12;const full=drawingContext();art.drawDefeats(full,g.s,false);
 assert.ok(full.calls.some(c=>c.color==='#c387d4'),'purple fragments follow the ivory impact');
 assert.ok(full.calls.length<=60,'one defeat does not issue a particle storm');
 for(const p of full.calls.filter(c=>c.op==='pixel'))assert.ok(Math.abs(p.x)<48&&Math.abs(p.y)<48,'fragments stay near the defeated sprite');
 const reduced=drawingContext();art.drawDefeats(reduced,g.s,true);assert.equal(reduced.calls.length,0,'reduced effects have no breakup particles or flashes');
 g.s.elapsed=.46;const expired=drawingContext();art.drawDefeats(expired,g.s,false);assert.equal(expired.calls.length,0);
});

test('visual replacement preserves the established gameplay RNG stream after a defeat',()=>{
 const g=new Game({seed:42});g.hurt(g.spawnEnemy('normal',100,-30),1000);
 // Captured from the approved pre-effect build: two loot draws, then fifteen burst draws.
 assert.equal(g.rng,542285520,'subsequent loot, waves and upgrade choices retain the same seed outcomes');
});


function trailFixture(){
 const ctx=new Proxy(drawingContext(),{get:(target,key)=>key in target?target[key]:()=>{}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 const renderer=new Renderer({getContext:()=>ctx}),game=new Game({seed:42});
 // Isolate drop rendering, retaining the real render traversal and its shared trail budget.
 renderer._drawGround=()=>{};renderer._actor=()=>{};game.world.getVisible=()=>[];
 return {ctx,renderer,game};
}
test('distant XP never spends the trail budget before a later attracted pickup',()=>{
 const {ctx,renderer,game}=trailFixture();
 game.s.drops=Array.from({length:16},(_,i)=>({x:1000+i,y:0,kind:'xp',value:2,life:30}));
 game.s.drops.push({x:40,y:0,kind:'xp',value:2,life:30});renderer.render(game,0);
 assert.equal(ctx.calls.filter(c=>c.op==='pixel'&&c.color==='#75e7f2').length,4,'the nearby pickup keeps its cyan attraction trail');
});
test('visible attraction trails remain capped and vanish in reduced effects',()=>{
 const {ctx,renderer,game}=trailFixture();game.s.drops=Array.from({length:260},()=>({x:40,y:0,kind:'xp',value:2,life:30}));
 renderer.render(game,0);assert.equal(ctx.calls.filter(c=>c.op==='pixel'&&c.color==='#75e7f2').length,64);
 ctx.calls.length=0;renderer.reducedEffects=true;renderer.render(game,0);assert.equal(ctx.calls.filter(c=>c.op==='pixel'&&c.color==='#75e7f2').length,0);
});
