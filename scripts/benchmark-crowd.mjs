import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(process.argv[2]||'.');
const {Game}=await import(pathToFileURL(resolve(root,'dist/engine.js')));
export function fixture(Game,seed=42){
 const g=new Game({seed,difficulty:'nightmare'}),s=g.s;
 s.elapsed=600;s.endless=true;s.hp=s.maxhp=1e8;s.xpNeed=1e9;
 s.upg={followers:5,money:5,girlfriend:3,car:3,chopper:3};g.recalculate();s.hp=s.maxhp=1e8;
 for(const k of Object.keys(g.timers))if(!['car','money','airplane','truth','chopper'].includes(k))g.timers[k]=99999;
 g.nextEvent=99999;g.eventSeen=new Set(['chapter:0','chapter:60','chapter:180','chapter:360','chapter:600']);
 const types=['normal','sprinter','gas','tank','jealous','orangutan'];
 for(let i=0;i<300;i++){const a=i*2.399963,r=80+Math.sqrt(i/300)*420;const e=g.spawnEnemy(types[i%types.length],Math.cos(a)*r,Math.sin(a)*r);e.hp=e.maxhp=1e6;}
 return g;
}
function run(){const g=fixture(Game);const times=[];let min=300,max=0;for(let i=0;i<720;i++){
 g.s.mode='playing';g.s.invulnerable=10;const t=performance.now();g.update(1/60,{x:Math.cos(i/130),y:Math.sin(i/130)});times.push(performance.now()-t);min=Math.min(min,g.s.enemies.length);max=Math.max(max,g.s.shots.length);
 }times.sort((a,b)=>a-b);return {mean:times.reduce((a,b)=>a+b,0)/times.length,p50:times[360],p95:times[Math.floor(times.length*.95)],minEnemies:min,maxShots:max,digest:createHash('sha256').update(JSON.stringify(g.s,(_,v)=>v instanceof Set?[...v]:v)).digest('hex')};}
run();const runs=Array.from({length:5},run);console.log(JSON.stringify({node:process.version,root,framesPerRun:720,runs},null,2));
