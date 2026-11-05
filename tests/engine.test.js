import {propCollisionBounds} from '../dist/prop-geometry.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../dist/engine.js');
const awaitedContent = await import('../dist/content.js');
const game = (opts={}) => {assert.equal(typeof mod.Game,'function','Game implementation is required');return new mod.Game({seed:42,...opts});};
function tick(g,seconds,input={x:0,y:0}) { for(let t=0;t<seconds;t+=.05) g.update(Math.min(.05,seconds-t),input); }
function enemy(type,x,y,extra={}) {return {id:123,type,x,y,hp:200,maxhp:200,r:16,speed:0,phase:'chase',faceX:1,faceY:0,gasPose:0,windup:0,hitFlash:0,charmed:0,dead:false,...extra};}

test('movement is normalized, pause freezes simulation, and road is open', () => {
  const a=game(),b=game();
  tick(a,1,{x:1,y:0}); tick(b,1,{x:1,y:1});
  assert.ok(Math.abs(Math.hypot(b.s.x,b.s.y)-a.s.x)<1);
  a.pause(); const snapshot=JSON.stringify(a.s);tick(a,1,{x:1,y:0});assert.equal(JSON.stringify(a.s),snapshot);
  a.resume();tick(a,.2,{x:1,y:0});assert.ok(a.s.x>100);
});

test('auto fire kills nearby gorillas and collected XP opens exactly three choices', () => {
  const events=[];const g=game({onEvent:(type,payload)=>events.push({type,payload})});
  g.s.enemies.push(enemy('normal',90,0,{hp:1,maxhp:1}));tick(g,.6);
  assert.equal(g.s.kills,1); assert.ok(g.s.drops.some(d=>d.kind==='xp'));
  g.s.drops.push({x:g.s.x,y:g.s.y,kind:'xp',value:100,life:100});g.update(.05);
  assert.equal(g.s.mode,'upgrade');assert.equal(g.s.options.length,3);assert.equal(new Set(g.s.options.map(o=>o.id)).size,3);
  assert.ok(events.some(e=>e.type==='upgrade'));
  const old=g.s.upg[g.s.options[0].id]||0;const id=g.s.options[0].id;assert.equal(g.chooseUpgrade(id),true);assert.equal(g.s.upg[id],old+1);
});

test('gas attack announces its direction before emitting moving clouds', () => {
  const g=game();g.s.shotClock=99;
  const gorilla=enemy('gas',145,0,{cooldown:0});g.s.enemies.push(gorilla);
  g.update(.05);assert.ok(gorilla.windup>0);assert.equal(g.s.clouds.length,0);assert.equal(g.s.hp,g.s.maxhp);
  tick(g,.5);assert.equal(g.s.clouds.length,0);assert.equal(g.s.hp,g.s.maxhp);
  tick(g,.9);assert.ok(gorilla.gasPose>0);assert.ok(g.s.clouds.length>0);assert.ok(g.s.clouds.some(c=>c.vx<0));
});

test('all twelve upgrades have real effects and companion follows and charms', () => {
  const g=game();const ids=['muscle','car','followers','ego','money','airplane','girlfriend','charisma','chopper','truth','filter','validation'];
  for(const id of ids){g.s.mode='upgrade';g.s.options=[{id}];assert.equal(g.chooseUpgrade(id),true,id);}
  assert.equal(g.s.companion,true);assert.ok(g.s.shield>0);assert.ok(g.s.maxhp>100);
  const oldX=g.s.girl.x;tick(g,.6,{x:1,y:0});assert.ok(g.s.girl.x>oldX);
  assert.ok(g.s.vehicles.some(v=>v.kind==='car'),'car upgrade summons a vehicle during its crossing');
  g.s.enemies=[enemy('normal',g.s.girl.x+75,g.s.girl.y)];tick(g,2);
  assert.ok(g.s.enemies.some(e=>e.charmed>0) || g.s.kills>0 || g.s.shots.some(s=>s.kind==='heart'));
});

test('jealous gorillas pursue companion and companion returns after being downed', () => {
  const g=game();g.s.mode='upgrade';g.s.options=[{id:'girlfriend'}];g.chooseUpgrade('girlfriend');
  g.s.x=300;g.s.y=0;g.s.girl.x=0;g.s.girl.y=150;
  const e=enemy('jealous',-80,150,{speed:50});g.s.enemies=[e];g.update(.1);
  assert.equal(e.target,'girl');assert.ok(e.x>-80);assert.ok(e.y>=149);
  g.timers.spawn=g.timers.pack=g.timers.horde=999;g.s.enemies=[];g.s.girl.hp=0;tick(g,.1);assert.ok(g.s.girl.down>0);
  tick(g,13);assert.equal(g.s.girl.down,0);assert.ok(g.s.girl.hp>0);
});

test('twenty minutes starts Charles once and leaving unlocks endless play', () => {
  const events=[];const g=game({onEvent:t=>events.push(t)});g.s.elapsed=1199.98;g.update(.05);
  assert.equal(g.s.mode,'playing');assert.equal(g.s.charles.phase,'intro');assert.equal(events.filter(t=>t==='epilogue-start').length,1);
  tick(g,1);assert.equal(events.filter(t=>t==='victory').length,0);assert.equal(events.filter(t=>t==='epilogue-start').length,1);g.leaveCharlesEpilogue();
  g.continueEndless();assert.equal(g.s.endless,true);assert.equal(g.s.mode,'playing');g.update(.05);assert.equal(g.s.mode,'playing');
});

test('difficulty changes survival pressure and spawns stay outside the visible rectangle', () => {
  const easy=game({difficulty:'easy'}),hard=game({difficulty:'nightmare'});
  assert.ok(easy.s.maxhp>=hard.s.maxhp);tick(easy,2);tick(hard,2);assert.ok(hard.s.enemies.length>easy.s.enemies.length);
  const g=game();g.setViewport(390,844);g.update(.03);assert.ok(g.s.enemies.length>0);
  for(const e of g.s.enemies) assert.ok(Math.abs(e.x-g.s.x)>205 || e.y-g.s.y < -425 || e.y-g.s.y >465);
});

test('city events require proximity and never immediately interrupt the opening', () => {
  const events=[];const g=game({onEvent:(t,p)=>events.push({t,p})});tick(g,5);
  assert.ok(!events.some(e=>e.t==='dialogue'));
  g.s.elapsed=35;const prop=g.world.getVisible(0,0,1500,1500).find(p=>['mirror','phone','bench','bike','bin'].includes(p.type));
  assert.ok(prop);g.s.x=prop.x;g.s.y=prop.y;g.update(.05);
  assert.equal(g.s.mode,'playing');assert.ok(events.some(e=>e.t==='bark'));assert.ok(g.eventSeen.has(prop.type));assert.ok(!events.some(e=>e.t==='dialogue'));
});

test('long travel bounds simulation entities and regenerates the city deterministically', () => {
  const a=game(),b=game();for(let i=0;i<500;i++){a.update(.05,{x:1,y:0});b.update(.05,{x:1,y:0});if(a.s.mode==='upgrade'){a.chooseUpgrade(a.s.options[0].id);b.chooseUpgrade(b.s.options[0].id);}if(a.s.mode==='dialogue'){a.finishDialogue();b.finishDialogue();}}
  assert.deepEqual(a.s,b.s);
  assert.ok(a.s.enemies.length<=300);assert.ok(a.s.shots.length<=320);assert.ok(a.s.drops.length<=260);assert.ok(a.world.chunks.size<=81);
});

function acquire(g,id){g.s.mode='upgrade';g.s.options=[{id}];assert.equal(g.chooseUpgrade(id),true);g.s.invulnerable=0;}

test('girlfriend grants her twenty shield once and later ranks cannot overfill it', () => {
  const g=game();acquire(g,'girlfriend');assert.equal(g.s.shield,20);g.s.shield=7;acquire(g,'girlfriend');assert.equal(g.s.shield,7);
});

test('mode avion clears gas and prevents attacks for a readable temporary window', () => {
  const g=game();acquire(g,'airplane');g.s.enemies=[enemy('gas',90,0,{cooldown:0})];
  g.s.clouds=[{x:0,y:0,r:40,life:10,maxlife:10,vx:0,vy:0}];tick(g,.45);
  assert.equal(g.s.clouds.length,0);assert.ok(g.s.airplane.active);assert.equal(g.s.hp,g.s.maxhp);
  const gas=g.s.enemies[0];assert.ok(gas.cooldown>1);assert.equal(gas.windup,0);
});

test('chopper summons a temporary bike that repels gorillas', () => {
  const g=game();acquire(g,'chopper');const e=enemy('tank',0,22,{hp:10000,maxhp:10000});g.s.enemies=[e];
  tick(g,.5);assert.ok(g.s.vehicles.some(v=>v.kind==='bike'));
  tick(g,1.4);assert.ok(e.hp<10000);assert.ok(Math.abs(e.x)>20 || Math.abs(e.y-22)>20);
});

test('death takes precedence over victory at the twenty minute boundary', () => {
  const events=[];const g=game({onEvent:t=>events.push(t)});g.s.elapsed=1199.99;g.s.hp=1;g.s.enemies=[enemy('normal',0,0)];g.update(.05);
  assert.equal(g.s.mode,'gameover');assert.equal(events.filter(t=>t==='victory').length,0);
});

test('gas telegraph keeps its announced aim when the player dodges around the gorilla', () => {
  const g=game();const e=enemy('gas',150,0,{cooldown:0});g.s.enemies=[e];g.update(.05);assert.ok(e.windup>0);
  g.s.x=280;g.update(.05);assert.ok(e.faceX<0,'announced attack must keep facing its original direction');tick(g,1.1);
  assert.ok(g.s.clouds.every(c=>c.vx<0));
});

test('muscle raises actual projectile damage and followers increase the firing cadence', () => {
  const count={base:0,up:0};const base=game({onEvent:(t,p)=>{if(t==='sound'&&p==='shoot')count.base++;}}),up=game({onEvent:(t,p)=>{if(t==='sound'&&p==='shoot')count.up++;}});
  acquire(up,'muscle');acquire(up,'followers');
  for(const g of [base,up]){g.timers.spawn=100;g.s.enemies=[enemy('tank',130,0,{hp:10000,maxhp:10000})];}
  tick(base,3);tick(up,3);assert.ok(count.up>count.base);assert.ok(up.s.enemies[0].hp<base.s.enemies[0].hp);
});

test('money fires cash, ego heals, truth damages and pushes, filter reduces gas, validation regenerates', () => {
  const cash=game();acquire(cash,'money');tick(cash,.45);assert.ok(cash.s.shots.some(p=>p.kind==='bill'));
  const ego=game();ego.s.hp=20;acquire(ego,'ego');assert.equal(ego.s.hp,45);assert.equal(ego.s.maxhp,120);
  const truth=game();acquire(truth,'truth');const e=enemy('tank',70,0,{hp:1000,maxhp:1000});truth.s.enemies=[e];tick(truth,.45);assert.ok(e.hp<1000);assert.ok(e.x>100);
  const plain=game(),filter=game();acquire(filter,'filter');for(const g of [plain,filter]){g.s.clouds=[{x:0,y:0,r:40,life:10,maxlife:10,vx:0,vy:0}];g.update(.01);}assert.ok(filter.s.hp>plain.s.hp);
  const validation=game();acquire(validation,'validation');validation.s.shield=0;validation.lastHit=0;tick(validation,7);assert.ok(validation.s.shield>0);
});

test('charisma slows approaching enemies and companion aura collects XP', () => {
  const base=game(),charm=game();acquire(charm,'charisma');
  for(const g of [base,charm]){g.timers.spawn=100;g.s.enemies=[enemy('normal',100,0,{speed:100})];g.update(.1);}
  assert.ok(charm.s.enemies[0].x>base.s.enemies[0].x);
  const g=game();acquire(g,'girlfriend');g.s.girl.x=-80;g.s.girl.y=0;g.s.drops=[{x:-82,y:0,kind:'xp',value:1,life:30}];g.update(.02);assert.equal(g.s.xp,1);assert.equal(g.s.drops.length,0);
});

test('late endless levels still offer three useful choices after upgrade ranks are exhausted', () => {
  const g=game();const {UPGRADES}=awaitedContent;for(const u of UPGRADES)g.s.upg[u.id]=u.max||5;g.s.evolutions={billionaire:true,viralLove:true};
  g.s.hp=10;g.s.drops=[{x:0,y:0,kind:'xp',value:20,life:10}];g.update(.02);
  assert.equal(g.s.mode,'upgrade');assert.equal(g.s.options.length,3);assert.equal(new Set(g.s.options.map(o=>o.id)).size,3);
  const option=g.s.options.find(o=>o.id==='recovery');assert.ok(option);g.chooseUpgrade('recovery');assert.ok(g.s.hp>10);assert.equal(g.s.mode,'playing');
});

test('explosive weapon kills leave an expanding toxic cloud with a short escape grace', () => {
  const g=game();g.timers.spawn=100;g.s.shotClock=0;g.s.enemies=[enemy('explosive',45,0,{hp:1,maxhp:1})];tick(g,.1);
  assert.equal(g.s.kills,1);assert.equal(g.s.clouds.length,1);assert.equal(g.s.hp,g.s.maxhp);
  const cloud=g.s.clouds[0],initial=cloud.r;g.s.x=cloud.x;g.s.y=cloud.y;tick(g,.15);assert.equal(g.s.hp,g.s.maxhp);
  tick(g,.5);assert.ok(g.s.hp<g.s.maxhp);assert.ok(cloud.r>initial);assert.ok(cloud.maxr>=60);
});

test('telegraphed explosive suicide rewards once and creates only one toxic cloud', () => {
  const g=game();g.timers.spawn=100;g.s.shotClock=99;const e=enemy('explosive',50,0);g.s.enemies=[e];g.update(.05);
  assert.ok(e.windup>0);assert.equal(g.s.clouds.length,0);tick(g,.8);
  assert.equal(g.s.kills,1);assert.equal(g.s.clouds.length,1);assert.equal(e.rewarded,true);
});

test('the opening has twice the regular population and introduces orangutan packs by twelve seconds', () => {
  const g=game();g.s.shotClock=999;g.s.maxhp=g.s.hp=10000;
  tick(g,8);assert.ok(g.s.enemies.length>=18,`only ${g.s.enemies.length} enemies in opening`);
  tick(g,4);assert.ok(g.s.enemies.filter(e=>e.type==='orangutan').length>=3,'early pack of female orangutans');
});

test('large mixed hordes arrive near twenty seconds and return after forty-five seconds', () => {
  const g=game(),arrivals=[],spawnHorde=g.spawnHorde.bind(g);g.spawnHorde=()=>{arrivals.push(g.s.elapsed);spawnHorde();};g.timers.rival=999;g.s.shotClock=999;g.s.maxhp=g.s.hp=10000;
  // Optional banter can wait or be omitted while another speaker is reading.
  // Verify the actual horde schedule and enemies, not an incidental joke count.
  tick(g,21);assert.equal(arrivals.length,1);assert.ok(Math.abs(arrivals[0]-20)<.06);
  assert.ok(g.s.enemies.length>=45);assert.ok(g.s.enemies.some(e=>e.type==='orangutan'));
  g.s.enemies=[];tick(g,46);assert.equal(arrivals.length,2);assert.ok(Math.abs(arrivals[1]-arrivals[0]-45)<.06);
  assert.ok(g.s.enemies.some(e=>e.type==='orangutan'));
});

test('female orangutans are a distinct long-arm species with a committed dodgeable swipe', () => {
  const g=game();g.timers.spawn=999;g.s.shotClock=999;const ape=g.spawnEnemy('orangutan',70,0);
  assert.ok(ape.maxhp>=35&&ape.maxhp<=45);assert.equal(ape.r,18);assert.ok(ape.speed>=58&&ape.speed<=70);
  const other=g.spawnEnemy('orangutan',-190,0),oldX=other.x;g.update(.05);assert.ok(other.x>oldX);
  assert.ok(ape.windup>0);assert.equal(g.s.hp,g.s.maxhp);assert.ok(ape.faceX<0);
  g.s.x=140;tick(g,.7);assert.equal(g.s.hp,g.s.maxhp,'crossing behind the committed swipe dodges it');
  assert.ok(ape.cooldown>1);assert.ok(ape.faceX<0,'swipe keeps its announced direction');
});

test('orangutan swipe waits for its warning before hitting a player left in its forward arc', () => {
  const g=game();g.timers.spawn=999;g.s.shotClock=999;g.spawnEnemy('orangutan',70,0);tick(g,.5);assert.equal(g.s.hp,g.s.maxhp);tick(g,.25);assert.ok(g.s.hp<g.s.maxhp);
});

test('spawned packs stay outside the viewport and crowded enemies separate without crossing props', () => {
  const g=game();assert.equal(typeof g.spawnPack,'function');g.spawnPack('orangutan',6);assert.equal(g.s.enemies.length,6);
  for(const e of g.s.enemies){assert.ok(Math.abs(e.x-g.s.x)>g.viewport.width/2+e.r || Math.abs(e.y-g.s.y)>g.viewport.height/2+e.r);assert.equal(g.world.collides(e.x,e.y,e.r*.64),false);}
  g.timers.spawn=999;g.s.shotClock=999;g.s.enemies=[];const a=g.spawnEnemy('normal',-120,0),b=g.spawnEnemy('normal',-120,0);tick(g,.4);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>10,'overlapping monkeys should become separate bodies');
  assert.equal(g.world.collides(a.x,a.y,a.r*.64),false);assert.equal(g.world.collides(b.x,b.y,b.r*.64),false);
});

test('dense hordes retain all original variants and accept three hundred enemies without growing beyond the cap', () => {
  const g=game();g.s.shotClock=999;g.s.maxhp=g.s.hp=10000;g.s.endless=true;
  const variants=['normal','sprinter','gas','tank','jealous','explosive','matriarch','orangutan'];
  for(let i=0;i<360;i++)g.spawnEnemy(variants[i%variants.length],-420+(i%20)*40,-300+Math.floor(i/20)*30);
  assert.equal(g.s.enemies.length,300);assert.ok(variants.every(type=>g.s.enemies.some(e=>e.type===type)));
  tick(g,2);assert.ok(g.s.enemies.length<=300);assert.ok(g.s.shots.length<=320);assert.ok(g.s.clouds.length<=90);assert.ok(g.s.particles.length<=200);
});

function quietRun(g){for(const key of ['spawn','pack','horde','boss','chest','bark','rival'])g.timers[key]=100000;g.nextEvent=100000;return g;}
function runUntilSplit(g,limit=19){for(let t=0;t<limit&&!(g.s.stunt?.active);t+=.05)g.update(.05,{x:1,y:0});return g.s.stunt;}

test('split stunts require actual sustained running and never start while idle or pushing a wall', () => {
  const idle=quietRun(game());assert.ok(idle.s.stunt);tick(idle,25);assert.equal(idle.s.stunt.count,0);
  const blocked=quietRun(game());const p=propCollisionBounds(blocked.world.getVisible(0,0,1200,1200).find(p=>p.type==='building'&&p.solid));blocked.s.x=p.x-p.w/2-13;blocked.s.y=p.y;tick(blocked,22,{x:1,y:0});assert.equal(blocked.s.stunt.count,0);
  const running=quietRun(game());const stunt=runUntilSplit(running);assert.equal(stunt.kind,'split');assert.equal(stunt.active,true);assert.ok(running.s.elapsed>=12&&running.s.elapsed<=18.1);assert.equal(stunt.count,1);
});

test('split keeps controls, damage, collision and automatic shooting active throughout its animation', () => {
  const events=[];const g=quietRun(game({onEvent:(t,p)=>events.push({t,p})}));runUntilSplit(g);const before=g.s.x;
  g.s.enemies=[enemy('tank',g.s.x+100,g.s.y,{hp:10000,maxhp:10000})];tick(g,.4,{x:1,y:0});assert.ok(g.s.x>before+50);assert.ok(g.s.enemies[0].hp<10000||g.s.shots.length>0);assert.equal(g.s.invulnerable,0);
  g.s.enemies=[enemy('normal',g.s.x,g.s.y)];g.update(.02,{x:1,y:0});assert.ok(g.s.hp<g.s.maxhp);assert.ok(events.some(e=>e.t==='sound'&&e.p==='split'));
});

test('split progress is bounded, finishes normally, and freezes in every modal mode', () => {
  const g=quietRun(game());runUntilSplit(g);tick(g,.2,{x:1,y:0});
  for(const mode of ['paused','upgrade','dialogue']){g.s.mode=mode;const before=JSON.stringify(g.s.stunt);tick(g,.5,{x:1,y:0});assert.equal(JSON.stringify(g.s.stunt),before);}
  g.s.mode='playing';tick(g,2,{x:1,y:0});assert.equal(g.s.stunt.active,false);assert.equal(g.s.stunt.progress,1);assert.equal(g.s.stunt.time,g.s.stunt.duration);assert.ok(g.s.stunt.duration>=1.1&&g.s.stunt.duration<=1.5);
});

test('split cadence and jokes rotate deterministically over later running intervals', () => {
  const boasts=[];const a=quietRun(game({onEvent:(type,payload)=>{if(type==='bark'&&payload.who==='TOMA')boasts.push(payload.text);}})),b=quietRun(game());let previous=0;const intervals=[];
  for(let i=0;i<2200;i++){a.update(.05,{x:1,y:0});b.update(.05,{x:1,y:0});if((a.s.stunt?.count||0)>intervals.length){intervals.push(a.s.elapsed-previous);previous=a.s.elapsed;}assert.deepEqual(a.s.stunt,b.s.stunt);assert.ok(!a.s.stunt||a.s.stunt.progress>=0&&a.s.stunt.progress<=1);}
  assert.ok(intervals.length>=3);assert.equal(new Set(boasts).size,boasts.length);assert.deepEqual(boasts,awaitedContent.STUNT_BARKS.slice(0,boasts.length).map(b=>b.text));assert.ok(intervals[0]>=12&&intervals[0]<=18.1);assert.ok(intervals.slice(1).every(n=>n>=22&&n<=36.5));
});

test('split banter has at least twelve unique Quebec boasts and a delayed companion reply', () => {
  assert.ok(awaitedContent.STUNT_BARKS?.length>=12);assert.equal(new Set(awaitedContent.STUNT_BARKS.map(b=>b.text)).size,awaitedContent.STUNT_BARKS.length);
  const events=[];const g=quietRun(game({onEvent:(type,payload)=>events.push({type,payload,at:g.s.elapsed})}));acquire(g,'girlfriend');events.length=0;runUntilSplit(g);
  const boasts=events.filter(e=>e.type==='bark'&&e.payload.who==='TOMA');assert.equal(boasts.length,1);g.timers.bark=0;tick(g,2.2,{x:1,y:0});assert.equal(events.filter(e=>e.type==='bark').length,1);
  tick(g,2.4,{x:1,y:0});const reply=events.filter(e=>e.type==='bark'&&e.payload.who==='BLONDE IA');assert.equal(reply.length,1);assert.ok(reply[0].at-boasts[0].at>=4.3);assert.ok(reply[0].at-boasts[0].at<=4.7);
});

test('split never schedules girlfriend dialogue before she is unlocked', () => {
  const events=[];const g=quietRun(game({onEvent:(type,payload)=>events.push({type,payload})}));assert.equal(runUntilSplit(g).active,true);tick(g,4,{x:1,y:0});assert.equal(events.filter(e=>e.type==='bark'&&e.payload.who==='BLONDE IA').length,0);
});

test('persistent weapon aim follows its target while strafing between automatic shots', async () => {
  const {computeHeroPose}=await import('../dist/hero-pose.js');
  const g=quietRun(game());g.s.shotClock=99;g.s.enemies=[enemy('tank',0,-140,{hp:10000,maxhp:10000})];tick(g,.4,{x:1,y:0});
  const p=computeHeroPose(g.s).weapon.pivot,d=Math.hypot(p.x,-140-p.y);assert.ok(Math.abs(g.s.aimX+p.x/d)<.001);assert.ok(Math.abs(g.s.aimY-(-140-p.y)/d)<.001);
  g.s.enemies=[];g.update(.05,{x:-1,y:0});assert.equal(g.s.aimX,-1);assert.equal(g.s.aimY,0);
});

test('automatic bullets originate at the shared held-rifle muzzle during running and a full split', async () => {
  const {computeHeroPose}=await import('../dist/hero-pose.js');
  for(const split of [false,true]){const g=quietRun(game());if(split)runUntilSplit(g);g.s.enemies=[enemy('tank',g.s.x+180,g.s.y+35,{hp:10000,maxhp:10000})];g.s.shots=[];g.s.shotClock=0;g.update(.01,{x:1,y:0});const shot=g.s.shots.find(p=>p.kind==='bullet');assert.ok(shot);const pose=computeHeroPose(g.s);assert.ok(Math.abs(shot.x-shot.vx*.01-pose.muzzle.x)<.001);assert.ok(Math.abs(shot.y-shot.vy*.01-pose.muzzle.y)<.001);}
});

test('rifle direction accounts for the raised pivot and its shots still hit the actual target', async () => {
  const {computeHeroPose}=await import('../dist/hero-pose.js');const g=quietRun(game());g.s.shotClock=0;const e=enemy('tank',180,0,{hp:10000,maxhp:10000});g.s.enemies=[e];g.update(.01,{x:0,y:1});const pose=computeHeroPose(g.s),dx=e.x-pose.weapon.pivot.x,dy=e.y-pose.weapon.pivot.y,d=Math.hypot(dx,dy);assert.ok(Math.abs(pose.aim.x-dx/d)<.001);assert.ok(Math.abs(pose.aim.y-dy/d)<.001);tick(g,.5);assert.ok(e.hp<10000);
});

test('near-vertical aiming keeps its carried shoulder and barrel stable across frames', async () => {
  const {computeHeroPose}=await import('../dist/hero-pose.js');const g=quietRun(game());g.s.shotClock=99;const e=enemy('tank',0,-150,{hp:10000,maxhp:10000});g.s.enemies=[e];const sides=[];
  for(let i=0;i<8;i++){g.update(.02);const pose=computeHeroPose(g.s),dx=e.x-pose.weapon.pivot.x,dy=e.y-pose.weapon.pivot.y,d=Math.hypot(dx,dy);sides.push(pose.side);assert.ok(Math.abs(pose.aim.x-dx/d)<.001);assert.ok(Math.abs(pose.aim.y-dy/d)<.001);}
  assert.equal(new Set(sides).size,1);
});

test('male mini-rivals arrive on an alternating schedule and never exceed two active rivals', () => {
  const g=quietRun(game());g.timers.rival=60;g.s.shotClock=999;g.s.hp=g.s.maxhp=100000;
  tick(g,59);assert.equal(g.s.enemies.filter(e=>e.type.startsWith('rival_')).length,0);tick(g,2);assert.equal(g.s.enemies.filter(e=>e.type==='rival_rooster').length,1);
  tick(g,46);assert.equal(g.s.enemies.filter(e=>e.type==='rival_goat').length,1);tick(g,125);assert.ok(g.s.enemies.filter(e=>e.type.startsWith('rival_')).length<=2);
  assert.equal(g.spawnEnemy('rival_goat',100,0),null);
});

test('male rivals retain distinct mini-elite stats and the goat keeps a committed headbutt charge', () => {
  for(const [type,hp,r,speed] of [['rival_rooster',150,20,70],['rival_goat',220,23,42]]){
    const g=quietRun(game());const e=g.spawnEnemy(type,90,0);assert.equal(e.sex,'male');assert.equal(e.maxhp,hp);assert.equal(e.r,r);assert.equal(e.speed,speed);
  }
  const g=quietRun(game());g.s.shotClock=999;const e=g.spawnEnemy('rival_goat',90,0);g.update(.02);assert.ok(e.windup>0);const locked=e.chargeDirX;assert.ok(locked<0);g.s.x=180;tick(g,.88);assert.ok(e.charge>0);assert.equal(e.chargeDirX,locked);assert.ok(e.faceX<0);assert.equal(g.s.hp,g.s.maxhp);
});

test('a player left in the goat headbutt path is hit only after its warning', () => {
  const g=quietRun(game());g.s.shotClock=999;const e=g.spawnEnemy('rival_goat',90,0);g.update(.01);assert.ok(e.windup>0);tick(g,.44);assert.equal(g.s.hp,g.s.maxhp);tick(g,1);assert.ok(g.s.hp<g.s.maxhp);
});

test('vulgar rival banter is male-only, rotates, obeys speech protection and is spaced by ten seconds', () => {
  assert.ok(awaitedContent.RIVAL_BARKS?.length>=12);assert.ok(awaitedContent.RIVAL_BARKS.every(b=>b.who==='TOMA'&&b.target==='male'));
  const events=[];const g=quietRun(game({onEvent:(type,payload)=>events.push({type,payload,at:g.s.elapsed})}));g.s.shotClock=999;g.s.hp=g.s.maxhp=100000;
  g.s.enemies=[enemy('normal',100,0),enemy('orangutan',150,0)];tick(g,15);assert.equal(events.filter(e=>e.type==='bark'&&awaitedContent.RIVAL_BARKS.some(b=>b.text===e.payload.text)).length,0);
  g.s.enemies=[];g.speechUntil=g.s.elapsed+3;g.spawnEnemy('rival_rooster',150,0);tick(g,2);assert.equal(events.filter(e=>e.type==='bark'&&awaitedContent.RIVAL_BARKS.some(b=>b.text===e.payload.text)).length,0);tick(g,2);
  g.spawnEnemy('rival_goat',-150,0);tick(g,9);const first=events.filter(e=>e.type==='bark'&&awaitedContent.RIVAL_BARKS.some(b=>b.text===e.payload.text));assert.ok(first.length>=1);
  tick(g,35);const seen=new Set();const taunts=events.filter(e=>{if(e.type!=='bark'||!awaitedContent.RIVAL_BARKS.some(b=>b.text===e.payload.text)||seen.has(e.payload.speechId))return false;seen.add(e.payload.speechId);return true;});assert.ok(taunts.length>=2);assert.ok(taunts.slice(1).every((b,i)=>b.at-taunts[i].at>=9.99));assert.ok(new Set(taunts.map(b=>b.payload.text)).size>=2);
});

test('male rival charges and banter clocks freeze while the game is paused', () => {
  const g=quietRun(game());g.s.shotClock=999;const e=g.spawnEnemy('rival_goat',90,0);g.update(.05);assert.ok(e.windup>0);g.pause();const before=JSON.stringify(g.s);const clock=g.lastRivalBark;tick(g,4);assert.equal(JSON.stringify(g.s),before);assert.equal(g.lastRivalBark,clock);
});

test('rooster holds an audible crow after a stationary warning and emits a ring without dashing', () => {
  const events=[];const g=quietRun(game({onEvent:(t,p)=>events.push({t,p})}));g.s.shotClock=999;const e=g.spawnEnemy('rival_rooster',90,0);g.update(.02);assert.ok(e.windup>.8);const x=e.x,y=e.y;
  tick(g,.7);assert.equal(e.x,x);assert.equal(e.y,y);assert.equal(g.s.shockwaves.length,0);assert.equal(g.s.hp,g.s.maxhp);
  tick(g,.2);assert.equal(e.charge,0);assert.ok(e.crow>0);assert.equal(e.x,x);assert.equal(e.y,y);assert.equal(g.s.shockwaves.length,1);assert.ok(events.some(a=>a.t==='sound'&&a.p==='rooster'));
  const wave=g.s.shockwaves[0];assert.equal(wave.ownerId,e.id);assert.ok(wave.maxR>=165&&wave.maxR<=190);assert.ok(wave.maxlife>=.9&&wave.maxlife<=1.1);assert.ok(wave.r<90);assert.equal(g.s.hp,g.s.maxhp);
});

function waveAt(x,y,r=28,life=1,ownerId=-1){return {x,y,r,prevR:r,maxR:180,life,maxlife:1,width:12,damage:13,hitPlayer:false,hitGirl:false,ownerId};}

test('rooster shockwave damages the swept annular band, never the filled interior or distant exterior', () => {
  const inside=quietRun(game()),outside=quietRun(game()),band=quietRun(game());
  for(const g of [inside,outside,band])assert.ok(g.s.shockwaves);
  inside.s.shockwaves.push(waveAt(0,0,80,.7));tick(inside,.5);assert.equal(inside.s.hp,inside.s.maxhp);
  outside.s.x=250;outside.s.shockwaves.push(waveAt(0,0));tick(outside,1.1);assert.equal(outside.s.hp,outside.s.maxhp);
  band.s.x=100;band.s.shockwaves.push(waveAt(0,0));tick(band,.25);assert.equal(band.s.hp,band.s.maxhp);tick(band,.25);assert.equal(band.s.hp,band.s.maxhp-13);const hp=band.s.hp;band.s.invulnerable=0;tick(band,.6);assert.equal(band.s.hp,hp);
});

test('a player can remain inside or outrun the crow ring and wave lifetime is bounded', () => {
  const inside=quietRun(game());inside.s.shockwaves.push(waveAt(0,0));tick(inside,1.1);assert.equal(inside.s.hp,inside.s.maxhp);assert.equal(inside.s.shockwaves.length,0);
  const outside=quietRun(game());outside.s.x=150;outside.s.shockwaves.push(waveAt(0,0));tick(outside,1.1,{x:1,y:0});assert.equal(outside.s.hp,outside.s.maxhp);assert.equal(outside.s.shockwaves.length,0);
});

test('crow waves hit the companion at most once and freeze while paused', () => {
  const g=quietRun(game());acquire(g,'girlfriend');g.s.x=100;g.s.girl.x=100;g.s.girl.y=0;g.s.girl.shoot=999;g.s.shockwaves.push(waveAt(0,0));tick(g,.5);const wave=g.s.shockwaves[0];assert.equal(wave.hitGirl,true);assert.ok(g.s.girl.hp<g.s.girl.maxhp);const hp=g.s.girl.hp;g.pause();const before=JSON.stringify(g.s.shockwaves);tick(g,3);assert.equal(JSON.stringify(g.s.shockwaves),before);g.resume();tick(g,.6);assert.equal(g.s.girl.hp,hp);
});

test('charm and mode avion cancel rooster windups and hostile owned waves', () => {
  const charm=quietRun(game());charm.s.shotClock=999;const e=charm.spawnEnemy('rival_rooster',90,0);charm.update(.02);assert.ok(e.windup>0);e.charmed=3;charm.s.shockwaves.push(waveAt(e.x,e.y,28,1,e.id));tick(charm,1.2);assert.equal(e.windup,0);assert.equal(e.crow,0);assert.equal(charm.s.shockwaves.length,0);assert.equal(charm.s.hp,charm.s.maxhp);
  const suppressed=quietRun(game());suppressed.s.shotClock=999;const rooster=suppressed.spawnEnemy('rival_rooster',90,0);suppressed.update(.02);suppressed.s.shockwaves.push(waveAt(rooster.x,rooster.y,28,1,rooster.id));acquire(suppressed,'airplane');suppressed.update(.02);assert.equal(rooster.windup,0);assert.equal(rooster.crow,0);assert.equal(suppressed.s.shockwaves.length,0);assert.equal(suppressed.s.hp,suppressed.s.maxhp);
});

test('hostile crow rings remain capped under repeated emissions', () => {
  const g=quietRun(game());assert.ok(g.s.shockwaves);for(let i=0;i<35;i++)g.s.shockwaves.push(waveAt(0,0));g.update(.01);assert.ok(g.s.shockwaves.length<=12);
});

test('running just outside an expanding crow band is safe when relative motion never crosses it', () => {
  const g=quietRun(game());g.s.x=102;g.s.shockwaves.push(waveAt(0,0,80,.7));tick(g,.7,{x:1,y:0});assert.equal(g.s.hp,g.s.maxhp);
});
