import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,symlinkSync,linkSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let skipNativeQA=false;
try{require.resolve('@napi-rs/canvas');}catch(error){
 if(error.code!=='MODULE_NOT_FOUND')throw error;
 skipNativeQA='Optional native screenshot QA requires an already installed @napi-rs/canvas; output rejection tests remain active.';
}
const root=fileURLToPath(new URL('../',import.meta.url));
const html=path.join(root,'release/Toma_Popescu_JOUER.html');
const script=path.join(root,'scripts/inspect-standalone.cjs');
const hash=()=>createHash('sha256').update(readFileSync(html)).digest('hex');
test('screenshot inspector rejects HTML and non-PNG output without changing standalone',()=>{
 const before=hash();
 for(const target of [html,path.join(root,'release/../release/Toma_Popescu_JOUER.html'),'/tmp/toma-output.txt']){
  const result=spawnSync(process.execPath,[script,target],{encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,/Refusing unsafe screenshot output/);assert.equal(hash(),before);
 }
});
test('screenshot inspector rejects PNG symlink and hardlink aliases to standalone',()=>{
 const tmp=mkdtempSync(path.join(path.dirname(html),'.output-safety-'));
 const before=hash();
 try{
  for(const [name,link] of [['symlink.png',symlinkSync],['hardlink.png',linkSync]]){
   const target=path.join(tmp,name);link(html,target);
   const result=spawnSync(process.execPath,[script,target],{encoding:'utf8'});
   assert.equal(result.status,1);assert.match(result.stderr,/Refusing unsafe screenshot output/);assert.equal(hash(),before);
  }
 }finally{rmSync(tmp,{recursive:true,force:true});}
});

test('screenshot inspector refuses any existing symlink without touching its other target',()=>{
 const tmp=mkdtempSync(path.join(path.dirname(html),'.output-safety-'));
 try{
  const target=path.join(tmp,'other.html'),alias=path.join(tmp,'other.png');
  writeFileSync(target,'preserve this unrelated HTML');symlinkSync(target,alias);
  const result=spawnSync(process.execPath,[script,alias],{encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,/Refusing unsafe screenshot output/);
  assert.equal(readFileSync(target,'utf8'),'preserve this unrelated HTML');
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
test('atomic screenshot publication does not follow a symlink substituted after validation',{skip:skipNativeQA},()=>{
 const tmp=mkdtempSync(path.join(path.dirname(html),'.output-safety-'));
 const before=hash();
 try{
  const output=path.join(tmp,'race.png'),hook=path.join(tmp,'race-hook.cjs');
  writeFileSync(hook,`const fs=require('fs');const original=fs.renameSync;fs.renameSync=function(from,to){fs.symlinkSync(${JSON.stringify(html)},to);return original.call(fs,from,to);};`);
  const result=spawnSync(process.execPath,['--require',hook,script,output],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.equal(hash(),before);
  assert.equal(readFileSync(output).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
