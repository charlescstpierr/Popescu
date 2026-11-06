import test from 'node:test';
import assert from 'node:assert/strict';
import * as spatial from '../dist/prop-geometry.js';
import {presentSceneryProp} from '../dist/scenery-presentation.js';
const geometry={...spatial,presentSceneryProp};
import {World} from '../dist/world.js';
import {WORLD_REMARKS} from '../dist/content.js';

test('starting street presents tall residential facades across seeds without changing world objects',()=>{
 assert.equal(typeof geometry.presentSceneryProp,'function');
 for(const seed of [42,12345,983424]){
  const world=new World(seed),blocks=[world.chunk(0,0),world.chunk(0,1)],before=JSON.stringify(blocks);
  for(const block of blocks){
   const original=block.find(p=>p.type==='building'&&p.w>=100),shown=geometry.presentSceneryProp(original);
   assert.equal(shown.buildingKind,'apartment');
   for(const key of ['id','x','y','w','h','r','solid','type'])assert.equal(shown[key],original[key]);
   assert.ok(geometry.buildingGeometry(shown).height>=original.h);
  }
  assert.equal(JSON.stringify(blocks),before);
 }
});
test('art presentation never removes a collider or a spoken-about landmark',()=>{
 assert.equal(typeof geometry.presentSceneryProp,'function');
 const world=new World(42);
 for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++)for(const p of world.chunk(x,y)){
  const shown=geometry.presentSceneryProp(p);
  if(p.solid||WORLD_REMARKS[p.type]){assert.ok(shown);assert.equal(shown.type,p.type);}
  if(shown)assert.deepEqual(geometry.presentSceneryProp(shown),shown,'presentation is idempotent');
 }
});
test('presentation removes some repeated nonsolid clutter but not all contextual detail',()=>{
 assert.equal(typeof geometry.presentSceneryProp,'function');
 const world=new World(12345),props=[];
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)props.push(...world.chunk(x,y));
 const extras=props.filter(p=>['bags','crate','cone','pallet','barricade'].includes(p.type));
 const shown=extras.map(geometry.presentSceneryProp).filter(Boolean);
 assert.ok(shown.length>0);assert.ok(shown.length<extras.length*.6);
});
test('foreground safety uses the new tall facade without expanding any collision',()=>{
 assert.equal(typeof geometry.presentSceneryProp,'function');
 const p=new World(12345).chunk(0,0).find(p=>p.type==='building'&&p.w>=100);
 const collision=geometry.propCollisionBounds(p),before=JSON.stringify(p);
 const shown=geometry.presentSceneryProp(p),cover=geometry.propForegroundBounds(p);
 assert.equal(cover.top,p.y+geometry.buildingGeometry(shown).top-45);
 assert.ok(cover.top<p.y+geometry.buildingGeometry(p).top-80);
 assert.deepEqual(geometry.propCollisionBounds(p),collision);assert.equal(JSON.stringify(p),before);
});
test('presentation never shortens architecture above an unchanged legacy collider',()=>{
 const world=new World(983424);
 for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++)for(const p of world.chunk(x,y)){
  if(p.type!=='building')continue;const shown=geometry.presentSceneryProp(p);
  assert.ok(geometry.buildingGeometry(shown).height>=geometry.buildingGeometry(p).height,`${p.id} cannot paint an invisible-wall strip`);
 }
});

test('forest crowns vary their art without changing any solid trunk or save field',()=>{
 const w=new World(42),crowns=new Set();
 for(let x=2;x<4;x++)for(let y=0;y<2;y++)for(const p of w.chunk(x,y)){
  if(p.type!=='pine')continue;const before=JSON.stringify(p),shown=presentSceneryProp(p);
  crowns.add(shown.artVariant);for(const key of Object.keys(p))assert.deepEqual(shown[key],p[key]);
  assert.equal(JSON.stringify(p),before);assert.equal(shown.solid,true);
 }
 assert.ok(crowns.size>=12);
});
