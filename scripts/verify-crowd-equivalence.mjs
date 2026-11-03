import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// Compare the original and candidate's actual gameplay tick by tick. This uses
// each version's own world, movement, attacks, drops, timers and seeded RNG.
const baseline=resolve(process.argv[2]||'.'),candidate=resolve(process.argv[3]||'.');
assert.notEqual(baseline,candidate,'supply distinct baseline and candidate roots');
const {Game:Original}=await import(pathToFileURL(resolve(baseline,'dist/engine.js')));
const {Game:Candidate}=await import(pathToFileURL(resolve(candidate,'dist/engine.js')));
const types=['normal','sprinter','gas','tank','jealous','explosive','matriarch','orangutan','rival_rooster','rival_goat','travestia','paparazzi','disco_chicken','ostrich','moose'];
function setup(Game,seed,count){
 const events=[],game=new Game({seed,difficulty:'nightmare',onEvent:(type,payload)=>events.push([type,payload])}),s=game.s;
 s.elapsed=600;s.endless=true;s.hp=s.maxhp=1e8;s.xpNeed=1e9;s.companion=true;
 s.upg={followers:5,money:5,girlfriend:3,car:3,chopper:3,charisma:3,airplane:1,truth:3};game.recalculate();
 for(const key of Object.keys(game.timers))if(!['car','money','airplane','truth','chopper'].includes(key))game.timers[key]=99999;
 game.nextEvent=99999;game.eventSeen=new Set(['chapter:0','chapter:60','chapter:180','chapter:360','chapter:600']);
 for(let i=0;i<count;i++){
  const angle=i*2.399963,radius=i%29===0?0:35+Math.sqrt(i/count)*340;
  const e=game.spawnEnemy(types[i%types.length],Math.cos(angle)*radius,Math.sin(angle)*radius);
  if(e){e.hp=e.maxhp=120+i%7*35;e.cooldown=i%9/3;}
 }
 return {game,events};
}
const replacer=(_,value)=>value instanceof Set?[...value]:value instanceof Map?[...value]:value;
const snapshot=({game:g,events})=>JSON.stringify({state:g.s,rng:g.rng,id:g.id,timers:g.timers,eventSeen:g.eventSeen,discoveryCooldowns:g.discoveryCooldowns,events},replacer);
const results=[];
for(const seed of [1,42,831])for(const count of [30,150,300]){
 const old=setup(Original,seed,count),next=setup(Candidate,seed,count);
 let peakShots=0,peakClouds=0;
 for(let tick=0;tick<480;tick++){
  const input={x:Math.cos(tick/67),y:Math.sin(tick/79)},dt=tick%57===0?.1:1/60;
  for(const run of [old,next]){run.game.s.mode='playing';run.game.s.invulnerable=1;run.game.update(dt,input);}
  assert.equal(snapshot(next),snapshot(old),`seed ${seed}, ${count} enemies, tick ${tick}`);
  peakShots=Math.max(peakShots,next.game.s.shots.length);peakClouds=Math.max(peakClouds,next.game.s.clouds.length);
 }
 results.push({seed,count,ticks:480,peakShots,peakClouds,digest:createHash('sha256').update(snapshot(next)).digest('hex')});
}
console.log(JSON.stringify({baseline,candidate,ticksCompared:results.length*480,results},null,2));
