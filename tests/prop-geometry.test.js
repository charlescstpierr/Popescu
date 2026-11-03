import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../dist/world.js';
import {CityArt} from '../dist/city-art.js';

test('short building colliders start at visible walls, not the former tower footprint',()=>{
 const w=new World(42),p=w.chunk(-4,-4).find(p=>p.buildingKind==='garage');assert.ok(p);
 const foot=p.h/2,height=Math.max(62,p.h*.42),top=foot-height;
 assert.equal(w.collides(p.x,p.y+top-18,13),false,'empty road above the garage remains walkable');
 assert.equal(w.collides(p.x,p.y+top+5,2),true,'visible garage still blocks movement');
});
test('shared building geometry matches rendered facade and foot-based depth',async()=>{
 const geometry=await import('../dist/prop-geometry.js');
 for(const h of [76,180,203.8])for(const kind of ['apartment','garage','warehouse','shop','ruin']){
  const p={type:'building',x:320,y:270,w:150,h,buildingKind:kind,variant:1,damage:0,solid:true};
  const shape=geometry.buildingGeometry(p),bounds=geometry.propCollisionBounds(p);
  assert.equal(shape.foot,h/2);assert.equal(geometry.propDepth(p),p.y+h/2);
  assert.ok(bounds.y-bounds.h/2>=p.y+shape.top-1e-8,'collider never extends above visible facade');
  assert.ok(Math.abs(bounds.y+bounds.h/2-(p.y+shape.foot))<1e-8);
  const world=new World();world.chunk=()=>[p];
  assert.equal(world.collides(p.x,bounds.y-bounds.h/2-15,13),false);
  assert.equal(world.collides(p.x,bounds.y,2),true);
  const calls=[],ctx=new Proxy({},{get:(_,key)=>(...args)=>calls.push([key,...args]),set:()=>true});
  const art=new CityArt();art._buildingVariant(ctx,p,42);
  if(kind!=='apartment'&&kind!=='ruin')assert.ok(calls.some(([name,x,y,width,height])=>name==='fillRect'&&x===-75&&Math.abs(y-Math.round(shape.top))<=1&&width===150&&Math.abs(height-Math.round(shape.height))<=1));
 }
});
