import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import * as content from '../dist/content.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
function fixture(){const events=[];const g=new Game({onEvent:(type,payload)=>events.push({type,payload})});g.s.elapsed=30;g.timers.bark=100;g.world.getVisible=()=>[{type:'phone',x:g.s.x,y:g.s.y,w:24}];return{g,events};}
test('street encounters speak once without pausing movement or combat',()=>{
 const {g,events}=fixture();g.story(.1);assert.equal(g.s.mode,'playing');assert.equal(events.filter(e=>e.type==='bark').length,1);assert.equal(events.filter(e=>e.type==='dialogue').length,0);assert.ok(g.eventSeen.has('phone'));
 g.s.elapsed=200;g.story(.1);assert.equal(events.length,1);
});
test('street remarks wait for priority speech and preserve unseen encounter',()=>{
 const {g,events}=fixture();g.reactToCrow();g.story(.1);assert.equal(g.eventSeen.has('phone'),false);assert.equal(events.at(-1).payload.text,content.ROOSTER_REACTION.text);
 g.s.elapsed+=5;g.story(.1);assert.ok(g.eventSeen.has('phone'));
});
test('contextual banter requires live relevant enemies and an available companion',()=>{
 assert.equal(typeof content.contextualBarks,'function');const g=new Game();let pool=content.contextualBarks(g.s);assert.ok(pool.every(b=>b.who!=='BLONDE IA'&&b.context!=='orangutan'));
 const enemy=g.spawnEnemy('orangutan',100,0);pool=content.contextualBarks(g.s);assert.ok(pool.some(b=>b.context==='orangutan'));enemy.dead=true;assert.ok(content.contextualBarks(g.s).every(b=>b.context!=='orangutan'));
 g.s.companion=true;assert.ok(content.contextualBarks(g.s).some(b=>b.who==='BLONDE IA'));g.s.girl.down=3;assert.ok(content.contextualBarks(g.s).every(b=>b.who!=='BLONDE IA'));assert.equal(g.bark('BLONDE IA','Allô',true),false);
});
test('milestones persist across save and do not replay old chapters on late restore',()=>{
 const {g,events}=fixture();g.world.getVisible=()=>[];g.s.elapsed=905;g.story(.1);assert.equal(events.length,1);assert.match(events[0].payload.text,/quinze/i);assert.equal(g.s.mode,'playing');
 const copy=restoreRun(captureRun(g));const more=[];copy.onEvent=(type,payload)=>more.push({type,payload});copy.world.getVisible=()=>[];copy.s.elapsed+=10;copy.story(.1);assert.equal(more.length,0);
});
test('victory payoff acknowledges the actual build without inventing an ally',()=>{
 assert.equal(typeof content.victoryQuote,'function');const g=new Game();const solo=content.victoryQuote(g.s);assert.match(solo,/vingt minutes/i);g.s.companion=true;assert.notEqual(content.victoryQuote(g.s),solo);g.s.companion=false;g.s.upg.truth=1;assert.match(content.victoryQuote(g.s),/vérité/i);
});
test('encounter frames retain actual movement, automatic shooting and damage',()=>{
 const {g,events}=fixture();g.world.collides=()=>false;g.spawnWave=()=>{};g.spawnEnemy('normal',g.s.x+90,g.s.y);g.s.shotClock=0;const x=g.s.x,time=g.s.elapsed;g.update(.05,{x:1,y:0});
 assert.ok(g.s.x>x);assert.ok(g.s.elapsed>time);assert.ok(g.s.shots.length);assert.equal(g.s.mode,'playing');assert.ok(events.some(e=>e.type==='bark'));const hp=g.s.hp;g.damage(5,'contact');assert.ok(g.s.hp<hp);
});
test('all chapters happen once and victory still happens at twenty minutes',()=>{
 const {g,events}=fixture();g.world.getVisible=()=>[];g.timers.bark=10000;
 for(const m of content.STORY_MILESTONES){g.s.elapsed=m.at;g.story(.01);assert.equal(events.at(-1).payload.text,m.text);assert.equal(g.s.mode,'playing');g.s.elapsed+=5;g.story(.01);}
 assert.equal(events.length,4);g.spawnWave=()=>{};g.s.elapsed=1199.99;g.update(.02);assert.equal(g.s.mode,'victory');g.continueEndless();assert.equal(g.s.mode,'playing');g.update(.02);assert.equal(events.filter(e=>e.type==='victory').length,1);
});
test('companion shutdown keeps its transition notice but suppresses later chatter',()=>{
 const events=[],g=new Game({onEvent:(type,payload)=>events.push({type,payload})});g.s.companion=true;g.s.girl.hp=0;g.updateCompanion(.1);
 assert.equal(g.s.girl.down,11.9);assert.ok(events.some(e=>e.type==='bark'&&e.payload.text.includes('redémarre')));assert.equal(g.bark('BLONDE IA','Du bavardage',true),false);
});
test('normal narrative reserves its full on-screen reading duration',()=>{
 const {g,events}=fixture();g.bark('TOMA','Une réplique à lire.');g.s.elapsed+=3.2;g.story(.1);assert.equal(events.length,1);assert.equal(g.eventSeen.has('phone'),false);g.s.elapsed+=1.2;g.story(.1);assert.equal(events.length,2);
});
test('five-minute milestone remains true after the AI companion unlock',()=>{
 const {g,events}=fixture();g.s.companion=true;g.s.elapsed=300;g.story(.01);
 assert.match(events.at(-1).payload.text,/Cinq minutes de survie/);
});
