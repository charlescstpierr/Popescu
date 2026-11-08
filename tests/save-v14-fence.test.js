import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,cpSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun,RunStore} from '../dist/run-save.js';

test('the unmodified published v13 reader rejects current snapshots and records without replacing them',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'popescu-v13-reader-'));
 try{
  // Relative imports resolve against current, compatible supporting modules.
  // The old reader bytes themselves are preserved unchanged as a provenance fixture.
  cpSync(new URL('../dist',import.meta.url),dir,{recursive:true,filter:path=>!path.includes('/assets')});
  writeFileSync(join(dir,'package.json'),'{"type":"module"}');writeFileSync(join(dir,'run-save.js'),readFileSync(new URL('./fixtures/run-save-v13-source.txt',import.meta.url)));
  const legacy=await import(pathToFileURL(join(dir,'run-save.js'))),g=new Game({seed:42}),current=captureRun(g);
  assert.equal(current.version,16);assert.throws(()=>legacy.restoreRun(current),/Invalid run save/);
  let raw;const storage={getItem:()=>raw??null,setItem:(_k,v)=>raw=v};assert.equal(new RunStore(storage).begin('new-v16',g).ok,true);
  const original=raw,reader=new legacy.RunStore(storage);assert.equal(reader.read().status,'corrupt');assert.equal(reader.begin('replacement',g).ok,false);assert.equal(raw,original);
  const old=JSON.parse(readFileSync(new URL('./fixtures/paused-charles-v13-recover.json',import.meta.url))),migrated=captureRun(restoreRun(old));assert.equal(migrated.game.s.survivalDuration,1200);delete migrated.game.s.survivalDuration;delete migrated.game.encounters;migrated.version=13;delete migrated.game.timers.ego;delete migrated.game.timers.egoIndex;assert.deepEqual(migrated,old);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
