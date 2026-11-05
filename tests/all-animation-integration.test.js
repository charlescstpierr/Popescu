import test from 'node:test';
import assert from 'node:assert/strict';
import {EGO_ART} from '../dist/ego-art.js';
import {ActorArt} from '../dist/actor-art.js';
import {Renderer} from '../dist/renderer.js';
import {Game} from '../dist/engine.js';
function context(){const calls=[],stack=[],ctx=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push({kind:k,args,alpha:o.globalAlpha}),set:(o,k,v)=>(o[k]=v,true)});return {ctx,calls};}
test('new complete attack paintings and hit flashes inherit the Charles disappearance opacity',async()=>{
 const art=new ActorArt({loadImage:async path=>({path,width:path.includes('ego-beasts')?EGO_ART.columns*128:640,height:path.includes('ego-beasts')?EGO_ART.rows*128:256})});await art.ready;
 for(const type of ['orangutan','rival_goat','rival_rooster'])for(const inherited of [1,.25,0]){
  const {ctx,calls}=context();ctx.globalAlpha=inherited;const image=type==='orangutan'?'orangutan_attack':type+'_attack';art.cache.set(`attack:${image}:0:false`,{});
  assert.equal(art.draw(ctx,Object.freeze({type,x:0,y:0,faceX:1,windup:1,hitFlash:.2}),'enemy',3,{},999),true);
  const paints=calls.filter(c=>c.kind==='drawImage');assert.equal(paints.length,2);assert.ok(paints.every(c=>c.alpha<=inherited),`${type} body/flash cannot reappear during fade`);assert.equal(ctx.globalAlpha,inherited);
 }
 assert.equal(art.images.ego.path,'assets/ego-beasts-v2.png');assert.equal(art.available('ego'),true,'new attacks must not restore the old four-column ego atlas');
});
test('Charles arrival freezes ordinary distance gait and hides every inert attack cue',()=>{
 const {ctx}=context(),r=new Renderer({getContext:()=>ctx});r.resize(390,844);const game=new Game({seed:71});game.setViewport(390,844);game.s.elapsed=1200;
 for(const type of ['normal','orangutan','rival_goat','rival_rooster','ego_peacock']){const e=game.spawnEnemy(type,0,0);game.enemyGait.set(e,{distance:20,moving:true});}
 game.s.mode='victory';game.startCharlesEpilogue();game.s.charles.phaseTime=8-3.75;game.s.charles.elapsed=3.75;
 const phases=[];r._drawGround=()=>{};r._actor=(actor,kind,phase)=>{if(kind==='enemy')phases.push([actor.type,phase]);};r._dangerWarnings=()=>assert.fail('arrival must hide warnings');r._rivalAttack=()=>assert.fail('arrival must hide rival foreground cues');
 const before=JSON.stringify(game.s);r.render(game,50);assert.equal(JSON.stringify(game.s),before);assert.equal(phases.length,5);assert.ok(phases.every(([,phase])=>phase===0));
});
