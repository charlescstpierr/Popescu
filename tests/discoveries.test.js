import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../dist/world.js';
import {Game} from '../dist/engine.js';

const sites = world => { const result=[]; for(let x=-6;x<=6;x++)for(let y=-6;y<=6;y++)result.push(...world.chunk(x,y).filter(p=>p.type==='discovery'));return result; };
const visit=(g,p)=>{g.s.x=p.x;g.s.y=p.y;g.update(.02);};
const quiet=()=>{const g=new Game({seed:42});g.nextEvent=Infinity;for(const key in g.timers)g.timers[key]=Infinity;return g;};

test('discoveries include all five kinds and regenerate identically without consuming world order',()=>{
 const w=new World(42),before=sites(w);assert.ok(before.length>30);assert.deepEqual(new Set(before.map(p=>p.discoveryType)),new Set(['ruin','cabin','altar','wreck','anomaly']));
 w.update(90000,-90000);assert.deepEqual(sites(w),before);assert.notDeepEqual(sites(new World(43)),before);
 for(const p of before){assert.equal(p.solid,false);assert.equal(w.collides(p.x,p.y,13),false);assert.ok(p.name&&p.description);}
});
test('approaching a site activates one non-modal timed rule and emits discovery',()=>{
 const events=[],g=quiet();g.onEvent=(...e)=>events.push(e);const p=sites(g.world).find(p=>p.discoveryType==='ruin');visit(g,p);
 assert.equal(g.s.mode,'playing');assert.equal(g.s.discovery.count,1);assert.equal(g.s.discovery.active.kind,'ruin');assert.ok(g.s.stats.damage>18);assert.ok(events.some(([type])=>type==='discovery'));
 const duration=g.s.discovery.active.remaining;g.update(.1);assert.equal(g.s.discovery.count,1);assert.ok(g.s.discovery.active.remaining<duration);
});
test('effects freeze in every modal and expire without erasing permanent upgrades',()=>{
 const g=quiet(),p=sites(g.world).find(p=>p.discoveryType==='wreck');g.s.upg.speed=2;g.recalculate();const base=g.s.stats.speed;visit(g,p);assert.ok(g.s.stats.speed>base);
 for(const mode of ['paused','dialogue','upgrade','victory','gameover']){g.s.mode=mode;const before=JSON.stringify(g.s);g.update(.25,{x:1,y:0});assert.equal(JSON.stringify(g.s),before);}
 g.s.mode='playing';g.s.upg.speed=3;g.recalculate();g.s.discovery.active.remaining=.01;g.update(.02);assert.equal(g.s.discovery.active,null);assert.equal(g.s.stats.speed,144*1.24);assert.equal(g.s.discovery.count,1);
});
test('each discovery changes its advertised rule and no effects stack',()=>{
 for(const kind of ['cabin','altar','wreck','anomaly']){const g=quiet(),all=sites(g.world);g.s.hp=30;visit(g,all.find(p=>p.discoveryType===kind));
 if(kind==='cabin'){g.update(.2);assert.ok(g.s.hp>30);assert.ok(g.s.hp<=g.s.maxhp);}
 if(kind==='altar')assert.equal(g.s.stats.magnet,220);
 if(kind==='wreck')assert.equal(g.s.stats.speed,180);
 if(kind==='anomaly'){assert.ok(g.s.stats.fireInterval<.52);assert.ok(g.s.stats.speed<144);}
 visit(g,all.find(p=>p.discoveryType==='ruin'));assert.equal(g.s.discovery.active.kind,kind);assert.equal(g.s.discovery.count,1);
 }
});
test('sites require leaving before reuse and cooldown memory stays bounded on infinite travel',()=>{
 const g=quiet(),p=sites(g.world)[0];visit(g,p);g.s.discovery.active.remaining=.001;g.update(.01);g.s.elapsed+=200;g.update(.1);assert.equal(g.s.discovery.count,1);
 g.s.x=p.x+180;g.update(.01);visit(g,p);assert.equal(g.s.discovery.count,2);
 for(let i=0;i<350;i++){g.s.discovery.active=null;g.recalculate();g.s.elapsed+=1;g.s.x=i*512;g.s.y=0;g.update(.01);const site=g.world.chunk(i,0).find(p=>p.type==='discovery');if(site)visit(g,site);}
 assert.ok(g.discoveryCooldowns.size<=256);assert.ok(g.world.chunks.size<=81);
});

test('a replenished site tells a camping player to leave and return',async()=>{
 const g=quiet(),p=sites(g.world)[0];visit(g,p);g.s.discovery.active.remaining=.001;g.update(.01);g.s.elapsed+=200;g.update(.1);
 assert.equal(g.s.discovery.nearby.needsExit,true);
 const {discoveryPrompt}=await import('../dist/discoveries.js');
 assert.equal(typeof discoveryPrompt,'function');
 assert.equal(discoveryPrompt(g.s.discovery.nearby),'Éloigne-toi du lieu, puis reviens pour explorer.');
 g.s.x=p.x+90;g.update(.01);
 assert.equal(g.s.discovery.nearby.needsExit,false);
 assert.match(discoveryPrompt(g.s.discovery.nearby),/^Approche-toi pour explorer/);
 visit(g,p);assert.equal(g.s.discovery.count,2);
 assert.equal(discoveryPrompt({cooldown:30,needsExit:true}),'Lieu épuisé. Explore un autre secteur.');
});
