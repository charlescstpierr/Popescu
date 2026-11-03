import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const roots=process.argv.slice(2).map(p=>resolve(p));assert.equal(roots.length,2,'supply approved baseline and candidate roots');
const modules=[];
for(const root of roots)modules.push({...(await import(pathToFileURL(resolve(root,'dist/engine.js')))),...(await import(pathToFileURL(resolve(root,'dist/content.js'))))});
const results=[];
function comparable(g){
 const s=JSON.parse(JSON.stringify(g.s,(_k,v)=>v instanceof Set?[...v]:v));delete s.pulses;
 return {s,rng:g.rng,id:g.id,timers:g.timers,stuntRng:g.stuntRng,rivalRng:g.rivalRng};
}
for(const difficulty of ['easy','normal','hard','nightmare'])for(const seed of [42,91]){
 const games=modules.map(({Game,UPGRADES})=>{
  const g=new Game({seed,difficulty});g.s.hp=g.s.maxhp=1e8;g.s.xpNeed=1e9;g.nextEvent=1e9;
  for(const power of ['car','girlfriend','airplane','muscle','truth']){g.s.mode='upgrade';g.s.options=[UPGRADES.find(u=>u.id===power)];assert(g.chooseUpgrade(power));}
  for(let i=0;i<300;i++){const a=i*2.399963,r=60+Math.sqrt(i/300)*400;g.spawnEnemy(['normal','sprinter','tank','gas','orangutan','jealous'][i%6],Math.cos(a)*r,Math.sin(a)*r);}
  return g;
 });
 for(let frame=0;frame<1200;frame++){
  const input={x:Math.cos(frame/120),y:Math.sin(frame/120)};
  for(const g of games){g.s.mode='playing';g.update(1/60,input);}
  if(frame%60===0)assert.deepEqual(comparable(games[1]),comparable(games[0]),`${difficulty} seed ${seed} frame ${frame}`);
 }
 assert.deepEqual(comparable(games[1]),comparable(games[0]));results.push({difficulty,seed,frames:1200,kills:games[1].s.kills,rng:games[1].rng});
}
console.log(JSON.stringify({matchedGameplayAndRng:true,excludedVisualOnly:'s.pulses',results},null,2));
