import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// Pure in-memory storage isolates synchronous snapshot/validation overhead.
// This is a Node comparison, not a claim about a physical phone or storage I/O.
const roots=process.argv.slice(2).length?process.argv.slice(2):['.'];
const results=[];
for(const entry of roots){
 const root=resolve(entry),{Game}=await import(pathToFileURL(resolve(root,'dist/engine.js')));
 const {LockedRunStore}=await import(pathToFileURL(resolve(root,'dist/run-save.js')));
 const game=new Game({seed:42}),data=new Map();
 const types=['normal','sprinter','gas','tank','jealous','orangutan'];
 for(let i=0;i<300;i++)game.spawnEnemy(types[i%types.length],300+i%20*35,Math.floor(i/20)*35);
 const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const store=new LockedRunStore(storage,{request:(_key,fn)=>Promise.resolve(fn())});
 if(!(await store.begin('crowd',game)).ok)throw Error('Failed to create benchmark run');
 for(let i=0;i<12;i++)if(!(await store.checkpoint('crowd',game)).ok)throw Error('Warmup checkpoint failed');
 const times=[];let result;
 for(let i=0;i<60;i++){const started=performance.now();result=await store.checkpoint('crowd',game);times.push(performance.now()-started);if(!result.ok)throw Error('Timed checkpoint failed');}
 times.sort((a,b)=>a-b);
 const snapshot=JSON.stringify(result.value.run.snapshot);
 results.push({root,frames:times.length,enemies:game.s.enemies.length,bytes:snapshot.length,meanMs:times.reduce((a,b)=>a+b,0)/times.length,p50Ms:times[30],p95Ms:times[57],snapshotSha256:createHash('sha256').update(snapshot).digest('hex')});
}
console.log(JSON.stringify({node:process.version,results},null,2));
if(new Set(results.map(result=>result.snapshotSha256)).size>1)throw Error('Saved snapshots differ across compared source trees');
