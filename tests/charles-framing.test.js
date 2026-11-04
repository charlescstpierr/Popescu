import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {Renderer} from '../dist/renderer.js';

// Record actual renderer/whole-body draw coordinates without requiring a browser
// or a Canvas dependency. The HUD boundary comes from the 320×568 browser repro.
function scene(width,height){
 const atlas={},draws=[],stack=[];let x=0,y=0,camera;
 const ctx=new Proxy({
  save(){stack.push([x,y]);},restore(){[x,y]=stack.pop();},
  setTransform(_a,_b,_c,_d,e,f){x=e;y=f;},translate(dx,dy){x+=dx;y+=dy;},
  createRadialGradient:()=>({addColorStop(){}}),
  drawImage(image,...args){if(image===atlas)draws.push({x:x+args[4],y:y+args[5]});}
 },{get:(object,key)=>key in object?object[key]:()=>{}});
 const renderer=new Renderer({getContext:()=>ctx});renderer.resize(width,height);
 renderer.charles.image=atlas;renderer._drawGround=c=>{camera=c;};renderer._actor=()=>{};
 const game=new Game({seed:71});game.setViewport(width,height);game.s.elapsed=1200;game.s.mode='victory';game.startCharlesEpilogue();game.world.getVisible=()=>[];
 return {game,renderer,draws,get camera(){return camera;}};
}

test('short Charles intro clears the permanent HUD without changing world state',()=>{
 const s=scene(320,568),before=JSON.stringify(s.game.s);s.renderer.render(s.game,0);
 assert.equal(s.draws.length,1);
 // Atlas frame 0 has nontransparent pixels from y=28 through y=170.
 assert.ok(s.draws[0].y+28>=164,'Charles head must clear the banner, not merely his feet');
 assert.ok(s.draws[0].y+171<390,'the full body stays above the controls');
 assert.equal(JSON.stringify(s.game.s),before,'framing must not move Charles or Toma in the simulation');
 assert.equal(Math.round(568*.48-s.camera.y+s.game.s.charles.y-48-160),s.draws[0].y,'ground and bodies must use the same camera');
});

test('short Charles framing keeps the same whole-body bounds in reduced effects',()=>{
 const s=scene(320,568);s.renderer.reducedEffects=true;s.renderer.render(s.game,0);
 assert.ok(s.draws[0].y+28>=164);assert.ok(s.draws[0].y+171<390);
});

test('standard Charles portrait also clears the banner while keeping both bodies in view',()=>{
 const s=scene(390,844);s.renderer.render(s.game,0);
 assert.ok(s.draws[0].y+28>=164,'the tall portrait must not hide the crown behind the banner');
 assert.ok(s.draws[0].y+171<440);
 assert.ok(Math.abs(s.camera.y-s.game.s.y)<30,'standard portrait framing changes only enough to clear the header');
});

test('ordinary survival and completed Charles retain their camera framing',()=>{
 const fresh=scene(320,568);fresh.game.s.charles=null;fresh.renderer.render(fresh.game,0);assert.equal(fresh.camera.y,fresh.game.s.y);
 const short=scene(320,568);short.game.leaveCharlesEpilogue();short.renderer.render(short.game,0);
 assert.equal(short.camera.y,short.game.s.y);assert.equal(short.draws.length,0);
 short.game.continueEndless();short.renderer.render(short.game,0);
 assert.equal(short.camera.y,short.game.s.y);
});
