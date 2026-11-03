import test from 'node:test';
import assert from 'node:assert/strict';
import {drawDiscovery} from '../dist/discovery-art.js';
import {DISCOVERIES} from '../dist/discoveries.js';

test('each discovery draws a distinct landmark without mutating world props',()=>{
  const calls=[];
  const ctx=new Proxy({globalAlpha:1},{get:(target,key)=>key in target?target[key]:(...args)=>calls.push([key,...args]),set:(target,key,value)=>(target[key]=value,true)});
  const signatures=[];
  for(const [kind,definition] of Object.entries(DISCOVERIES)){
    calls.length=0;
    const prop={x:100,y:200,type:'discovery',discoveryType:kind,...definition};
    const before=JSON.stringify(prop);
    drawDiscovery(ctx,prop,2,false);
    assert.equal(JSON.stringify(prop),before);
    assert.ok(calls.some(call=>call[0]==='fillRect'));
    assert.equal(calls.filter(call=>call[0]==='save').length,calls.filter(call=>call[0]==='restore').length);
    signatures.push(JSON.stringify(calls));
  }
  assert.equal(new Set(signatures).size,Object.keys(DISCOVERIES).length);
});

test('reduced motion keeps special discovery artwork still',()=>{
  const calls=[];
  const ctx=new Proxy({},{get:(_,key)=>(...args)=>calls.push([key,...args]),set:()=>true});
  const prop={x:0,y:0,discoveryType:'anomaly'};
  drawDiscovery(ctx,prop,0,true);const first=JSON.stringify(calls);calls.length=0;
  drawDiscovery(ctx,prop,9,true);assert.equal(JSON.stringify(calls),first);
});
