import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
function visiting(){const g=new Game({seed:42});g.nextEvent=100000;for(const key of Object.keys(g.timers))g.timers[key]=100000;let site;for(let x=-3;x<=3&&!site;x++)for(let y=-3;y<=3&&!site;y++)site=g.world.chunk(x,y).find(p=>p.type==='discovery'&&p.discoveryType==='ruin');assert.ok(site);g.s.x=site.x;g.s.y=site.y;g.update(.02);return g;}
test('save/resume preserves discovery effects, cooldown Map and contact, with deterministic continuation',()=>{
 const a=visiting(),b=restoreRun(captureRun(a));assert.ok(b.discoveryCooldowns instanceof Map);assert.deepEqual([...b.discoveryCooldowns],[...a.discoveryCooldowns]);assert.equal(b.discoveryContact,a.discoveryContact);assert.deepEqual(b.s.discovery,a.s.discovery);assert.equal(b.s.stats.damage,a.s.stats.damage);for(let i=0;i<200;i++){a.update(.1);b.update(.1);}assert.deepEqual(captureRun(a),captureRun(b));
});
test('restoring at a spent site cannot award discovery twice or restart its duration',()=>{
 const a=visiting();a.s.discovery.active.remaining=.001;a.update(.02);a.s.elapsed+=130;a.update(.01);const b=restoreRun(captureRun(a));b.update(.1);assert.equal(b.s.discovery.count,1);assert.equal(b.s.discovery.active,null);assert.equal(b.s.discovery.nearby.needsExit,true);
});
test('invalid discovery effects and cooldown schemas are rejected',()=>{
 for(const change of [s=>s.game.s.discovery.active.kind='fake',s=>s.game.s.discovery.active.remaining=1e9,s=>s.game.discoveryCooldowns={},s=>s.game.discoveryCooldowns=[['x','oops']],s=>s.game.s.discovery.count=.5]){const snap=captureRun(visiting());change(snap);assert.throws(()=>restoreRun(snap));}
});
