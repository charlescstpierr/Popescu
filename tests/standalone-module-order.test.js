import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

test('fresh standalone includes every imported module before its consumers',()=>{
 const dir=mkdtempSync(join(tmpdir(),'popescu-standalone-order-'));
 try{
  const out=join(dir,'game.html'),r=spawnSync('python3',['scripts/export-standalone.py',out],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  const html=readFileSync(out,'utf8');let imports=0;
  for(const m of html.matchAll(/const \{[^}]+\}=modules\[['"](\.\/[^'"]+\.js)['"]\];/g)){
   const assignment=html.indexOf(`modules["${m[1]}"]={`);
   assert.ok(assignment>=0 && assignment<m.index,`${m[1]} must be initialized before import`);imports++;
  }
  assert.ok(imports>50,'the package traverses the real game module graph');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
