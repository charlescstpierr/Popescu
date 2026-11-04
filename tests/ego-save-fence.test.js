import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,cpSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Game} from '../dist/engine.js';
import {captureRun,RunStore} from '../dist/run-save.js';
test('the exact prior v14 reader rejects new snapshots and records without overwriting them',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'popescu-v14-reader-'));
 try{
  cpSync(new URL('../dist',import.meta.url),dir,{recursive:true,filter:path=>!path.includes('/assets')});
  writeFileSync(join(dir,'package.json'),'{"type":"module"}');writeFileSync(join(dir,'run-save.js'),readFileSync(new URL('./fixtures/run-save-v14-source.txt',import.meta.url)));
  const legacy=await import(pathToFileURL(join(dir,'run-save.js'))),g=new Game({seed:42}),saved=captureRun(g);
  assert.equal(saved.version,15);assert.throws(()=>legacy.restoreRun(saved),/Invalid run save/);
  let raw;const storage={getItem:()=>raw??null,setItem:(_k,v)=>raw=v};assert.equal(new RunStore(storage).begin('new-v15',g).ok,true);
  const original=raw,reader=new legacy.RunStore(storage);assert.equal(reader.read().status,'corrupt');assert.equal(reader.begin('replacement',g).ok,false);assert.equal(raw,original);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
