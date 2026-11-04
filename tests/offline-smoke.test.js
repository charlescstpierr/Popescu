import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync,cpSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let skipNativeQA=false;
try{require.resolve('@napi-rs/canvas');}catch(error){
 if(error.code!=='MODULE_NOT_FOUND')throw error;
 skipNativeQA='Optional native Canvas QA requires an already installed @napi-rs/canvas; no package is installed by the tests.';
}

// Catch absolute/cwd-dependent image paths and regressions hidden by inline assets.
for(const name of ['standalone','companion-standalone','lamborghini-standalone'])test(`offline folder ${name} smoke works after moving into a path with spaces`,{skip:skipNativeQA},()=>{
 const dir=mkdtempSync(join(tmpdir(),'popescu-offline-smoke-'));
 try{
  const folder=join(dir,'moved game');cpSync('release',folder,{recursive:true});
  const shot=join(dir,'result.png'),result=spawnSync(process.execPath,[`scripts/inspect-${name}.cjs`,shot,join(folder,'Toma_Popescu_JOUER.html')],{encoding:'utf8',timeout:30000});
  assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout.trim());
  assert.equal(report.actualBrowser,false);assert.equal(report.physicalTouch,false);
  assert.equal(readFileSync(shot).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
