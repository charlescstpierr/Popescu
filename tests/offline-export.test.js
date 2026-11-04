import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const root=new URL('../',import.meta.url);
const run=(script,...args)=>spawnSync('python3',[`scripts/${script}`,...args],{encoding:'utf8'});

test('offline exporter creates a reproducible small-file folder with byte-identical source assets',()=>{
 const dir=mkdtempSync(join(tmpdir(),'popescu-offline-'));
 try{
  const out=join(dir,'folder with spaces','Toma_Popescu_JOUER.html');
  let result=run('export-offline.py',out);assert.equal(result.status,0,result.stderr);
  const html=readFileSync(out,'utf8');assert.ok(Buffer.byteLength(html)<1024*1024,'launch HTML must stay under 1 MiB');
  const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(code);
  assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+stylesheet|type="module"|\bimport\.meta\b/);
  assert.doesNotMatch(code,/\bimport\s*\{|\bexport\s+(const|let|class|function)\b/);
  assert.doesNotMatch(code,/\bfetch\s*\(|\bXMLHttpRequest\b|\bimport\s*\(/,'the exported game must not need module or network loading');
  const files=JSON.parse(readFileSync(join(dir,'folder with spaces','OFFLINE_MANIFEST.json'),'utf8')).files;
  const before=new Map();
  for(const entry of files){const bytes=readFileSync(join(dir,'folder with spaces',entry.path));assert.equal(bytes.length,entry.bytes);assert.equal(digest(bytes),entry.sha256);assert.ok(bytes.length<3*1024*1024,entry.path+' exceeds 3 MiB');before.set(entry.path,digest(bytes));}
  for(const name of readdirSync(new URL('dist/assets/',root))){
   const source=readFileSync(new URL('dist/assets/'+name,root)),copy=readFileSync(join(dir,'folder with spaces','assets',name));
   assert.deepEqual(copy,source,'source image must not be recompressed: '+name);
   assert.ok(files.some(entry=>entry.path==='assets/'+name));
  }
  for(const match of html.matchAll(/assets\/([\w.-]+\.(?:png|webp|svg|json))/g))assert.ok(existsSync(join(dir,'folder with spaces','assets',match[1])),match[1]);
  result=run('export-offline.py',out);assert.equal(result.status,0,result.stderr);
  for(const [file,hash]of before)assert.equal(digest(readFileSync(join(dir,'folder with spaces',file))),hash,'repeated export: '+file);
  const single=join(dir,'single.html');result=run('export-standalone.py',single);assert.equal(result.status,0,result.stderr);
  let expanded=html;const mime={'.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
  for(const name of readdirSync(new URL('dist/assets/',root))){const ext=name.slice(name.lastIndexOf('.'));expanded=expanded.replaceAll('assets/'+name,'data:'+mime[ext]+';base64,'+readFileSync(new URL('dist/assets/'+name,root)).toString('base64'));}
  assert.equal(readFileSync(single,'utf8'),expanded,'both formats must contain exactly the same bundled JS/CSS and art');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('standalone export cannot replace the canonical small-file launch HTML',()=>{
 const canonical=new URL('release/Toma_Popescu_JOUER.html',root),before=digest(readFileSync(canonical));
 const result=run('export-standalone.py',canonical.pathname);
 assert.equal(result.status,1);assert.match(result.stderr,/export-offline\.py/);assert.equal(digest(readFileSync(canonical)),before);
});
