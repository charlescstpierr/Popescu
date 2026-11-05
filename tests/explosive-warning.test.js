import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Game} from '../dist/engine.js';
import {Renderer} from '../dist/renderer.js';

function primed(distance=60){
 const g=new Game({seed:42});g.world.collides=()=>false;g.s.elapsed=10;g.s.x=60;
 const e=g.spawnEnemy('explosive',0,0);g.updateEnemies(.001);
 assert.equal(e.phase,'windup');assert.equal(e.windup,.72);
 g.s.x=distance;return {g,e};
}
function paint(e,time=10,reducedEffects=false){
 const calls=[],ctx=new Proxy({},{get:(_,key)=>(...args)=>calls.push([key,...args]),set:()=>true});
 const renderer=Object.assign(Object.create(Renderer.prototype),{ctx,time,reducedEffects});
 renderer._dangerWarnings([e],[]);return calls;
}

test('explosive warning covers every damaging player-center position, including the 12px contact margin',()=>{
 const {e}=primed();
 for(const reduced of [false,true])for(const time of [0,.1,1,10,100]){
  const calls=paint(e,time,reduced),circles=calls.filter(c=>c[0]==='arc'&&c[1]===0&&c[2]===0);
  assert.ok(circles.some(c=>c[3]===99),'draw the full 87px blast plus the existing 12px player margin');
  assert.ok(circles.every(c=>c[3]===99),'the boundary cannot pulse inward into damaging space');
 }
});

test('leaving the visible explosive warning is sufficient to escape without changing attack balance',()=>{
 for(const [distance,damage] of [[50,23],[86,23],[90,23],[98.99,23],[99,0],[100,0]]){
  const {g,e}=primed(distance),hp=g.s.hp;g.updateEnemies(.71);
  assert.equal(g.s.hp,hp,'the windup itself is harmless');assert.ok(e.windup>0);
  g.updateEnemies(.02);assert.equal(hp-g.s.hp,damage,`distance ${distance}`);assert.equal(g.s.enemies.length,0);
 }
});

test('explosive warning ends immediately after cancellation or defeat and rendering remains read-only',()=>{
 const {g,e}=primed(),before=JSON.stringify(g.s);paint(e);assert.equal(JSON.stringify(g.s),before);
 for(const actor of [{...e,windup:0},{...e,dead:true}])assert.equal(paint(actor).length,0);
 e.charmed=2;e.windup=0;assert.equal(paint(e).length,0);
});

const require=createRequire(import.meta.url);let native;try{native=require('@napi-rs/canvas');}catch{}
test('actual warning pixels cover the former hidden blast band without painting beyond safety', {skip:!native?'@napi-rs/canvas is not installed':false},()=>{
 const {e}=primed(),canvas=native.createCanvas(260,260),ctx=canvas.getContext('2d');
 const actor={...e,x:130,y:130};const renderer=Object.assign(Object.create(Renderer.prototype),{ctx,time:10,reducedEffects:true});
 renderer._dangerWarnings([actor],[]);
 const alpha=(x,y)=>ctx.getImageData(x,y,1,1).data[3];
 for(const [x,y] of [[220,130],[40,130],[130,220],[130,40],[193,193]])assert.ok(alpha(x,y)>0,'90px inside the damaging zone must be visibly warned');
 for(const [x,y] of [[233,130],[27,130],[130,233],[130,27]])assert.equal(alpha(x,y),0,'103px is safely outside the complete warning');
});
