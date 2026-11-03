import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../dist/renderer.js';
import {Game} from '../dist/engine.js';
import {UPGRADES} from '../dist/content.js';

function fixture(){
 const calls=[],target={calls,fillStyle:'',strokeStyle:'',globalAlpha:1,fillRect(...p){calls.push(['pixel',this.fillStyle,...p]);},stroke(){calls.push(['stroke',this.strokeStyle]);},createRadialGradient(){return{addColorStop(){}};}};
 const ctx=new Proxy(target,{get:(t,k)=>k in t?t[k]:(...p)=>calls.push([k,...p])}),renderer=new Renderer({getContext:()=>ctx}),game=new Game({seed:42});
 renderer._drawGround=()=>{};renderer._actor=()=>{};game.world.getVisible=()=>[];return{calls,ctx,renderer,game};
}
test('real render traversal presents acquisition artwork without altering simulation',()=>{
 const {calls,renderer,game}=fixture();game.s.mode='upgrade';game.s.options=[UPGRADES.find(u=>u.id==='muscle')];game.chooseUpgrade('muscle');
 const state=JSON.stringify(game.s),effects=JSON.stringify(game.powerEffects);renderer.render(game,game.s.elapsed);
 assert(calls.some(c=>c[0]==='stroke'&&c[1]==='#ff43aa'),'Photoshop pink crop corners are actually rendered');
 assert.equal(JSON.stringify(game.s),state);assert.equal(JSON.stringify(game.powerEffects),effects);
});
test('strengthened bullets gain a pink trail, preserving the shot geometry and reduced mode',()=>{
 const {calls,renderer,game}=fixture();const shot={x:80,y:20,vx:460,vy:0,kind:'bullet',damage:22.5};const before=JSON.stringify(shot);
 renderer._shot(shot,game.s);assert(!calls.some(c=>c[1]==='#ff43aa'));calls.length=0;game.s.upg.muscle=1;renderer._shot(shot,game.s);
 assert(calls.some(c=>c[1]==='#ff43aa'));assert.equal(JSON.stringify(shot),before);
 calls.length=0;renderer.reducedEffects=true;renderer._shot(shot,game.s);assert(!calls.some(c=>c[1]==='#ff43aa'),'reduced mode keeps the original compact projectile');
});
test('moving Lamborghini has short gold speed marks only in normal effects',()=>{
 const {calls,renderer}=fixture(),car={x:0,y:0,vx:455,vy:0,kind:'car'};
 renderer._car(car,true);assert(calls.some(c=>c[1]==='#ffd634'&&c[2]<-30),'a short golden speed mark follows the real car');
 calls.length=0;renderer.reducedEffects=true;renderer._car(car,true);assert(!calls.some(c=>c[1]==='#ffd634'&&c[2]<-30));
});
test('legacy saved truth and airplane expanding rings are not replayed as false travelling effects',()=>{
 const {calls,renderer,game}=fixture();game.s.pulses=[{x:0,y:0,r:30,maxr:169,color:'#c9a8ff',life:.5,maxlife:.7},{x:0,y:0,r:30,maxr:455,color:'#8adce6',life:.6,maxlife:1}];
 renderer.render(game,game.s.elapsed);assert(!calls.some(c=>c[1]==='#c9a8ff'||c[1]==='#8adce6'));
});
