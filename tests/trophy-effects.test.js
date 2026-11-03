import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {updateTrophyEffects,reduceTrophyDamage,notifyTrophyDamage,trophySpeedMultiplier} from '../dist/trophy-effects.js';

function game(chosen={}) { const g=new Game({seed:71});g.s.trophies={chosen,pending:[],cooldowns:{tarot:0,ascendant:0,panache:0,star:0,fanclub:0},tarot:null,panache:null,starLife:0,feedback:null};return g; }
function enemy(g,type,x,y,extra={}) {const e={id:g.id++,type,x,y,r:1,hp:500,maxhp:500,charmed:0,dead:false,...extra};g.s.enemies.push(e);return e;}
function tick(g,t,step=.01){for(let n=0;n<t-1e-9;n+=step)updateTrophyEffects(g,Math.min(step,t-n));}

test('tarot fixed damage, bounded three distinct targets and return to locked origin',()=>{
 const g=game({pelican:'tarot'});g.s.upg={muscle:9,followers:9};g.recalculate();
 const es=[40,80,120,160].map(x=>enemy(g,'tank',x,0));updateTrophyEffects(g,.01);assert.ok(g.s.trophies.tarot);g.s.x=400;tick(g,1.6);
 assert.deepEqual(es.map(e=>e.hp),[464,464,464,500]);assert.equal(g.s.trophies.tarot,null);assert.equal(g.s.shots.length,0);
});
test('tarot sweep hits crossed targets on both legs in one large update',()=>{
 const g=game({pelican:'tarot'}),e=enemy(g,'normal',100,18);updateTrophyEffects(g,.001);updateTrophyEffects(g,1.6);assert.equal(e.hp,464);
});
test('tarot rectangle corner collision is exact and ready waits for target',()=>{
 const g=game({pelican:'tarot'});updateTrophyEffects(g,2);assert.equal(g.s.trophies.cooldowns.tarot,0);assert.equal(g.s.trophies.tarot,null);
 enemy(g,'normal',100,0);const miss=enemy(g,'normal',100,20.01);updateTrophyEffects(g,.001);tick(g,1.6);assert.equal(miss.hp,500);
});
test('ascendant absorbs a single hit after reductions, consumes small hits and recharges',()=>{
 const g=game({pelican:'ascendant'});assert.equal(reduceTrophyDamage(g,8,'touch'),0);assert.equal(g.s.trophies.cooldowns.ascendant,12);assert.equal(g.s.invulnerable,0);assert.equal(reduceTrophyDamage(g,20,'touch'),20);tick(g,12);assert.equal(reduceTrophyDamage(g,20,'touch'),8);
});
test('badge reduces only eligible ordinary gorilla contact, minimum one',()=>{
 const g=game({matriarch:'badge'});for(const type of ['normal','sprinter','gas','tank','jealous','explosive'])assert.equal(reduceTrophyDamage(g,10,'touch',{kind:'ordinary-contact',actorType:type}),8);
 for(const type of ['orangutan','pelican','travestia','matriarch','rival_goat','rival_rooster','ostrich','paparazzi','moose','disco_chicken'])assert.equal(reduceTrophyDamage(g,10,'touch',{kind:'ordinary-contact',actorType:type}),10);
 assert.equal(reduceTrophyDamage(g,10,'touch'),10);assert.equal(reduceTrophyDamage(g,10,'touch',{kind:'swipe',actorType:'normal'}),10);assert.equal(reduceTrophyDamage(g,1,'touch',{kind:'ordinary-contact',actorType:'normal'}),1);
});
test('star is multiplicative, lasts two seconds and does not extend or stack',()=>{
 const g=game({travestia:'star'});notifyTrophyDamage(g);assert.equal(trophySpeedMultiplier(g.s),1.25);assert.equal(g.s.trophies.cooldowns.star,8);tick(g,1);notifyTrophyDamage(g);assert.ok(Math.abs(g.s.trophies.starLife-1)<1e-8);tick(g,1);assert.equal(trophySpeedMultiplier(g.s),1);tick(g,6);notifyTrophyDamage(g);assert.equal(trophySpeedMultiplier(g.s),1.25);
});
test('panache locks its sector and damages once without knocking bosses or rivals',()=>{
 const g=game({travestia:'panache'});g.s.aimX=1;g.s.aimY=0;
 const front=enemy(g,'normal',50,0),back=enemy(g,'normal',-50,0),outside=enemy(g,'normal',0,70),boss=enemy(g,'pelican',70,0),rival=enemy(g,'rival_goat',80,0);
 updateTrophyEffects(g,.01);assert.equal(front.hp,480);assert.equal(front.x,85);assert.equal(boss.x,70);assert.equal(rival.x,80);g.s.aimX=-1;g.s.x=500;tick(g,.4);assert.equal(front.hp,480);assert.equal(back.hp,500);assert.equal(outside.hp,500);assert.equal(g.s.trophies.panache,null);
});
test('fan club takes closest eligible targets, breaks ties by id and interrupts specials',()=>{
 const g=game({matriarch:'fanclub'});g.s.upg.charisma=99;const excluded=['orangutan','pelican','travestia','matriarch','rival_goat','rival_rooster','ostrich','paparazzi','moose','disco_chicken'].map(type=>enemy(g,type,1,0));
 const a=enemy(g,'gas',50,0,{windup:1,gasPose:1,swipe:1,charge:1,crow:1}),b=enemy(g,'explosive',-50,0,{windup:1}),c=enemy(g,'tank',90,0),old=enemy(g,'normal',1,0,{charmed:1});
 g.s.enemies.reverse();updateTrophyEffects(g,.01);assert.equal(a.charmed,2.5);assert.equal(b.charmed,2.5);assert.equal(c.charmed,0);assert.equal(old.charmed,1);assert.ok(excluded.every(e=>e.charmed===0));for(const k of ['windup','gasPose','swipe','charge','crow'])assert.equal(a[k],0);assert.equal(g.s.trophies.cooldowns.fanclub,18);assert.equal(a.trophyCharmLife,2.5);
});
test('fan club remains ready with no eligible target; pause freezes all state and effects use no rng',()=>{
 const g=game({matriarch:'fanclub',pelican:'tarot',travestia:'panache'});const rng=g.rng;updateTrophyEffects(g,5);assert.equal(g.s.trophies.cooldowns.fanclub,0);enemy(g,'normal',50,0);updateTrophyEffects(g,.01);assert.equal(g.rng,rng);g.s.mode='paused';const before=JSON.stringify(g.s);updateTrophyEffects(g,5);assert.equal(JSON.stringify(g.s),before);
});

test('tarot rectangular collision respects perpendicular corners and locked rotation',()=>{
 const g=game({pelican:'tarot'});enemy(g,'normal',0,30);const hit=enemy(g,'normal',18,70),miss=enemy(g,'normal',20.1,70);updateTrophyEffects(g,.01);tick(g,1.6);assert.equal(hit.hp,464);assert.equal(miss.hp,500);
});
test('tarot never harms charmed allies or acquires beyond 220px',()=>{
 const g=game({pelican:'tarot'});const far=enemy(g,'normal',221,0),friend=enemy(g,'normal',100,0,{charmed:2});updateTrophyEffects(g,.1);assert.equal(g.s.trophies.tarot,null);far.x=220;updateTrophyEffects(g,.01);tick(g,1.6);assert.equal(friend.hp,500);assert.equal(far.hp,464);
});
test('panache circle sector includes edge overlaps but excludes outside arc and rear',()=>{
 const g=game({travestia:'panache'});const edge=enemy(g,'normal',50,87,{r:2}),rim=enemy(g,'normal',101,0,{r:2}),outside=enemy(g,'normal',104,0,{r:2}),rear=enemy(g,'normal',-5,0,{r:2});updateTrophyEffects(g,.01);assert.equal(edge.hp,480);assert.equal(rim.hp,480);assert.equal(outside.hp,500);assert.equal(rear.hp,500);
});
test('badge is applied before ascendant and one feedback record replaces the previous',()=>{
 const g=game({matriarch:'badge',pelican:'ascendant'});assert.equal(reduceTrophyDamage(g,16,'touch',{kind:'ordinary-contact',actorType:'tank'}),2);assert.deepEqual(g.s.trophies.feedback,{id:'ascendant',life:.55,amount:12});tick(g,.55);assert.equal(g.s.trophies.feedback,null);
});

test('panache forgets retired actors so saved hit IDs remain bounded across replacements',()=>{
 const g=game({travestia:'panache'});enemy(g,'tank',50,0);updateTrophyEffects(g,.01);g.s.enemies=[];enemy(g,'tank',50,0);updateTrophyEffects(g,.01);assert.equal(g.s.trophies.panache.hitIds.length,1);
});
test('panache knockback stops at actual solid world walls',()=>{
 const g=game({travestia:'panache'});const wall=g.world.chunk(0,0).find(p=>p.type==='building'&&p.solid);const x=wall.x-wall.w/2;g.s.x=x-70;g.s.y=wall.y;const e=enemy(g,'tank',x-15,wall.y,{r:10});assert.equal(g.world.collides(e.x,e.y,e.r*.64),false);updateTrophyEffects(g,.01);assert.ok(e.x<x);assert.equal(g.world.collides(e.x,e.y,e.r*.64),false);assert.equal(e.hp,480);
});

test('Game damage gates ascendant behind invulnerability and Mode avion, after gas filtering',()=>{
 const g=game({pelican:'ascendant'});g.s.invulnerable=1;g.damage(30,'touch');assert.equal(g.s.trophies.cooldowns.ascendant,0);g.s.invulnerable=0;g.s.airplane.active=true;g.damage(30,'gas');assert.equal(g.s.trophies.cooldowns.ascendant,0);g.s.airplane.active=false;g.s.upg.filter=5;g.recalculate();const hp=g.s.hp;g.damage(30,'gas');assert.equal(g.s.hp,hp);assert.equal(g.s.trophies.cooldowns.ascendant,12);assert.equal(g.s.invulnerable,0,'fully absorbed hits add no invulnerability');
});
test('Game star requires actual ordinary shield or HP loss, not full ascendant absorption',()=>{
 const g=game({pelican:'ascendant',travestia:'star'});g.damage(8,'touch');assert.equal(g.s.trophies.starLife,0);g.s.shield=20;g.damage(8,'touch');assert.equal(g.s.shield,12);assert.equal(g.s.trophies.starLife,2);assert.equal(g.s.hp,g.s.maxhp);
});
test('Game badge applies after difficulty damage and never applies to special touch provenance',()=>{
 const g=game({matriarch:'badge'});const hp=g.s.hp;g.damage(10,'touch',{kind:'ordinary-contact',actorType:'tank',actorId:1});assert.equal(g.s.hp,hp-8);g.s.invulnerable=0;g.damage(10,'touch');assert.equal(g.s.hp,hp-18);
});

test('Game star multiplies recalculated current speed and expires during real simulation',()=>{
 const g=game({travestia:'star'});g.s.upg.speed=3;g.recalculate();const base=g.s.stats.speed;g.damage(5,'touch');assert.equal(g.s.stats.speed,base*1.25);g.recalculate();assert.equal(g.s.stats.speed,base*1.25);g.s.upg.speed=4;g.recalculate();assert.equal(g.s.stats.speed,144*1.32*1.25);g.timers.spawn=g.timers.pack=g.timers.horde=999;for(let i=0;i<61;i++)g.update(1/30);assert.equal(g.s.trophies.starLife,0);assert.equal(g.s.stats.speed,144*1.32);
});
test('fan club charm and crown expire together during real simulation',()=>{
 const g=game({matriarch:'fanclub'});g.timers.spawn=g.timers.pack=g.timers.horde=999;g.s.shotClock=999;const e=g.spawnEnemy('tank',100,0);updateTrophyEffects(g,.01);assert.equal(e.charmed,2.5);for(let i=0;i<76;i++)g.update(1/30);assert.equal(e.charmed,0);assert.equal(e.trophyCharmLife,0);assert.equal(g.s.trophies.cooldowns.fanclub>15,true);
});
