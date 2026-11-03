import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const roots=process.argv.slice(2).map(p=>resolve(p));
assert.equal(roots.length,2,'Supply approved baseline and candidate repository roots');
const immutableAssets=[];
for(const file of (await readdir(resolve(roots[0],'dist/assets'))).sort()){const hashes=await Promise.all(roots.map(async root=>createHash('sha256').update(await readFile(resolve(root,'dist/assets',file))).digest('hex')));assert.equal(hashes[1],hashes[0],`approved sprite/art asset changed: ${file}`);immutableAssets.push(file);}
const modules=[];
for(const root of roots){let m={};for(const file of ['engine','content','evolutions','run-save'])Object.assign(m,await import(pathToFileURL(resolve(root,`dist/${file}.js`))));modules.push(m);}
function comparable(g,m){const snap=m.captureRun(g);delete snap.game.s.pulses;return snap;}
function select(g,id){g.s.mode='upgrade';g.s.options=[{id}];assert(g.chooseUpgrade(id),`valid selection ${id}`);}
function equal(games,label){assert.deepEqual(comparable(games[1],modules[1]),comparable(games[0],modules[0]),label);assert(games[1].s.enemies.length<=300);assert(games[1].powerEffects.length<=16);}
const ids=[...modules[0].UPGRADES.map(u=>u.id),...modules[0].EVOLUTIONS.map(u=>u.id),'recovery','payday','barrier'];
assert.equal(ids.length,20);
for(const id of ids){const games=modules.map(m=>{const g=new m.Game({seed:714});g.s.hp=10;for(const req of m.EVOLUTIONS.find(e=>e.id===id)?.requires||[])for(let i=0;i<3;i++)select(g,req);select(g,id);return g;});equal(games,`individual acquisition ${id}`);}
const results=[];
for(const difficulty of ['easy','normal','hard','nightmare'])for(const seed of [42,91])for(const rank of [1,3,5]){
 let games=modules.map(m=>{
  const g=new m.Game({seed,difficulty});g.s.xpNeed=1e9;g.nextEvent=1e9;
  for(const u of m.UPGRADES)for(let i=0;i<rank;i++)select(g,u.id);
  if(rank>=3)for(const e of m.EVOLUTIONS)select(g,e.id);
  for(const id of ['recovery','payday','barrier'])select(g,id);
  g.s.maxhp=1e6;g.s.hp=999000;g.s.shield=0;g.s.invulnerable=0;
  for(let i=0;i<300;i++){const a=i*2.399963,r=60+Math.sqrt(i/300)*400;g.spawnEnemy(['normal','sprinter','tank','gas','orangutan','jealous'][i%6],Math.cos(a)*r,Math.sin(a)*r);}
  return g;
 });
 equal(games,`${difficulty}/${seed}/${rank} initial`);
 for(let frame=0;frame<600;frame++){
  for(const g of games){g.s.mode='playing';if(frame%90===0){g.s.drops.push({x:g.s.x,y:g.s.y,kind:'coin',value:1,life:30});g.s.invulnerable=0;g.damage(7,'gas');}g.update(1/60,{x:Math.cos(frame/120),y:Math.sin(frame/120)});assert(g.s.enemies.length<=300);assert(g.powerEffects.length<=16);}
  if(frame%60===0)equal(games,`${difficulty}/${seed}/${rank} frame ${frame}`);
  if(frame===300){games=games.map((g,i)=>modules[i].restoreRun(modules[i].captureRun(g)));assert.deepEqual(games[1].powerEffects,[]);equal(games,'resume');}
 }
 equal(games,`${difficulty}/${seed}/${rank} final`);results.push({difficulty,seed,rank,frames:600,kills:games[1].s.kills,rng:games[1].rng});
}
console.log(JSON.stringify({matchedGameplayAndRng:true,immutableAssets,acquisitions:ids,excludedVisualOnly:['s.pulses','unsaved powerEffects'],resumeVerified:true,results},null,2));
