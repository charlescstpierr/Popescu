import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,symlinkSync,linkSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
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
