import {propCollisionBounds} from '../dist/prop-geometry.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../dist/world.js');

test('city regenerates identical props after distant chunk eviction', () => {
  assert.equal(typeof mod.World, 'function', 'World implementation is required');
  const city = new mod.World(831);
  const before = city.getVisible(-400,-200,1200,1200);
  city.update(70000,-80000);
  const after = city.getVisible(-400,-200,1200,1200);
  assert.deepEqual(after, before);
  assert.ok(new mod.World(832).getVisible(-400,-200,1200,1200).some((p,i)=>JSON.stringify(p)!==JSON.stringify(before[i])));
});

test('world keeps origin and crossing streets walkable while buildings collide', () => {
  assert.equal(typeof mod.World, 'function', 'World implementation is required');
  const city = new mod.World(42);
  const props = city.getVisible(0,0,1400,1400);
  assert.equal(city.collides(0,0,14), false);
  for (let n=-1200;n<=1200;n+=32) {
    assert.equal(city.collides(0,n,14), false, `vertical road at ${n}`);
    assert.equal(city.collides(n,0,14), false, `horizontal road at ${n}`);
  }
  const building = props.find(p=>p.type==='building' && p.solid);
  const solid = building && propCollisionBounds(building);
  assert.ok(solid, 'nearby district has buildings');
  assert.equal(city.collides(solid.x,solid.y,10),true);
  assert.equal(city.collides(solid.x+solid.w/2+20,solid.y,10),false);
});

test('world chunks remain bounded through long travel and large viewports', () => {
  assert.equal(typeof mod.World, 'function', 'World implementation is required');
  const city = new mod.World(99);
  for(let i=0;i<300;i++) city.getVisible(i*230,-i*170,900,1500);
  assert.ok(city.chunks.size<=81, `${city.chunks.size} retained chunks`);
  assert.ok(city.getVisible(0,0,390,844).every(p=>typeof p.id==='string' && Number.isFinite(p.x) && p.w>0 && p.h>0));
});

const STREET_TYPES = new Set(['foodcart','vending','planter','tree','table','cone','barricade','crate','pallet','bags','trophy','hydrant']);
const overlaps = (a,b,gap=0) => Math.abs(a.x-b.x)<(a.w+b.w)/2+gap && Math.abs(a.y-b.y)<(a.h+b.h)/2+gap;

test('districts contain varied curbside clusters rather than one repeated furniture layout', () => {
  const city = new mod.World(42),kinds = new Set(),layouts = new Set();let total=0;
  for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++) {
    const props=city.chunk(x,y);
    if(props.some(p=>p.biome==='forest'))continue; // Forest districts have their own vegetation contract.
    const items=props.filter(p=>STREET_TYPES.has(p.type));
    assert.ok(items.length>=7, `inhabited chunk ${x},${y}: ${items.length} new objects`);
    assert.ok(items.length<=18, 'street dressing has a finite density');
    for(const p of items)kinds.add(p.type);
    layouts.add(JSON.stringify(items.map(p=>[p.type,Math.round(p.x-x*512),Math.round(p.y-y*512)])));
    total+=items.length;
  }
  assert.equal(kinds.size,STREET_TYPES.size,'all twelve new objects appear in the district');
  assert.ok(layouts.size>=20,'chunk position chooses distinct layouts');
  assert.ok(total>=225,'streets gain substantial readable detail');
});

test('new street objects leave crossroads and solid footprints clear without blocking movement', () => {
  for(const seed of [1,42,831]) {
    const city=new mod.World(seed);
    for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++) {
      const all=city.chunk(x,y),items=all.filter(p=>STREET_TYPES.has(p.type));
      for(const p of items) {
        assert.equal(p.solid,false,`${p.type} is decorative`);
        const lx=p.x-x*512,ly=p.y-y*512;
        assert.ok(lx-p.w/2>=84 && lx+p.w/2<=428,`${p.type} stays outside vertical streets`);
        assert.ok(ly-p.h/2>=84 && ly+p.h/2<=428,`${p.type} stays outside horizontal streets`);
        for(const old of all)if(old!==p && (old.solid||STREET_TYPES.has(old.type)))assert.equal(overlaps(p,old),false,`${p.id} overlaps ${old.id}`);
      }
      for(let n=-70;n<=70;n+=14) {
        assert.equal(city.collides(x*512+n,y*512,13),false);
        assert.equal(city.collides(x*512,y*512+n,13),false);
      }
    }
  }
});
