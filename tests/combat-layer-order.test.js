import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../dist/renderer.js';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
function fixture(){
 const target={fillStyle:'',globalAlpha:1,createRadialGradient(){return{addColorStop(){}};}};
 const ctx=new Proxy(target,{get:(o,k)=>k in o?o[k]:()=>{}}),renderer=new Renderer({getContext:()=>ctx}),game=new Game({seed:42});
 renderer._drawGround=()=>{};game.world.getVisible=()=>[];return{renderer,game};
}
for(const reduced of [false,true])for(const car of [false,true])test(`danger geometry has one foreground pass, reduced=${reduced}, car=${car}`,()=>{
 const {renderer,game}=fixture(),calls=[];renderer.reducedEffects=reduced;
 game.spawnEnemy('normal',0,35);game.s.shockwaves=[{x:0,y:0,r:90,width:12,life:1}];
 if(car)game.s.vehicles=[{x:0,y:0,carRank:1,carDelay:0,life:1}];
 renderer._actor=(a,k)=>calls.push(k);renderer._dangerWarnings=(enemies,waves)=>{assert.equal(enemies,game.s.enemies);assert.equal(waves,game.s.shockwaves);calls.push('danger');};
 renderer.powers.drawForeground=()=>calls.push('ally-effects');renderer.render(game,1);
 assert.equal(calls.filter(c=>c==='danger').length,1);assert.ok(calls.indexOf('danger')>calls.lastIndexOf('enemy'));assert.ok(calls.indexOf('danger')>calls.indexOf('ally-effects'));
});
for(const reduced of [false,true])test(`gas stays at ground depth, reduced=${reduced}`,()=>{
 const {renderer,game}=fixture(),calls=[];renderer.reducedEffects=reduced;game.s.clouds=[{x:0,y:-24,r:42,life:2.2,maxlife:3.2,vx:0,vy:0}];
 renderer._cloud=(c,foreground=false)=>calls.push(foreground?'front-gas':'ground-gas');renderer._actor=()=>calls.push('actor');renderer.render(game,71);
 assert.equal(calls.filter(c=>c==='ground-gas').length,1);assert.ok(!calls.includes('front-gas'));assert.ok(calls.indexOf('ground-gas')<calls.indexOf('actor'));
});
test('300 enemies and overlapping hazards leave saved continuation untouched',()=>{
 const {renderer,game}=fixture();for(let i=0;i<300;i++)game.spawnEnemy('normal',(i%20-10)*18,Math.floor(i/20)*16-80);
 game.s.clouds=[{x:0,y:0,r:35,life:2,maxlife:3,vx:0,vy:0}];const before=captureRun(game);renderer.render(game,1);assert.deepEqual(captureRun(game),before);assert.deepEqual(captureRun(restoreRun(before)),before);
});
