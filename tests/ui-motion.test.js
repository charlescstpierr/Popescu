import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';

const has=(a,id,name)=>a.get(id).classList.contains(name);
const prefs=extra=>new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,...extra})]]);

test('hurt vignette observes HP loss once, scales at low HP, and never changes game state',async()=>{
 const a=app();await a.click('play');
 assert.equal(has(a,'damage-vignette','hurt-pulse'),false);
 a.game.s.hp=80;const before=JSON.stringify(a.game.s);a.controller.updateHud();
 assert.equal(JSON.stringify(a.game.s),before);assert.equal(has(a,'damage-vignette','hurt-pulse'),true);
 const normal=a.get('damage-vignette').style['--hurt-strength'];
 a.get('damage-vignette').dispatch('animationend');a.controller.updateHud();
 assert.equal(has(a,'damage-vignette','hurt-pulse'),false);
 a.game.s.hp=20;a.controller.updateHud();assert.equal(has(a,'damage-vignette','low-health'),true);
 assert.ok(a.get('damage-vignette').style['--hurt-strength']>normal);
 a.get('damage-vignette').dispatch('animationend');a.game.s.hp=30;a.controller.updateHud();
 assert.equal(has(a,'damage-vignette','hurt-pulse'),false);assert.equal(has(a,'damage-vignette','low-health'),false);
 a.game.s.hp=0;a.controller.updateHud();assert.equal(has(a,'damage-vignette','low-health'),false);
});

test('pause cancels the hit pulse and retains immediate modal freezing',async()=>{
 const a=app();await a.click('play');a.game.s.hp=20;a.controller.updateHud();
 a.click('pause');assert.equal(has(a,'damage-vignette','hurt-pulse'),false);assert.equal(has(a,'app','playing'),false);
 const elapsed=a.game.s.elapsed;a.controller.frame(performance.now()+100);assert.equal(a.game.s.elapsed,elapsed);
 a.click('resume');assert.equal(has(a,'app','playing'),true);assert.equal(has(a,'pause-screen','hidden'),true);
 assert.equal(a.get('pause-screen').inert,true);assert.equal(a.get('hud').inert,false);
});

test('HUD counters bump only on changes, including a coin purchase',async()=>{
 const a=app();await a.click('play');for(const id of ['coins','gems','kills'])assert.equal(has(a,id,'hud-bump'),false);
 a.game.s.coins=5;a.game.s.gems=2;a.game.s.kills=3;a.controller.updateHud();
 for(const id of ['coins','gems','kills']){assert.equal(has(a,id,'hud-bump'),true);a.get(id).dispatch('animationend');}
 a.controller.updateHud();for(const id of ['coins','gems','kills'])assert.equal(has(a,id,'hud-bump'),false);
 a.game.s.coins=0;a.controller.updateHud();assert.equal(has(a,'coins','hud-bump'),true);
});

test('timer marks minute boundaries and each second of the last minute, without replaying on HUD ticks',async()=>{
 const a=app();await a.click('play');a.game.s.elapsed=59;a.controller.updateHud();assert.equal(has(a,'time','timer-beat'),false);
 a.game.s.elapsed=60;a.controller.updateHud();assert.equal(has(a,'time','timer-beat'),true);
 a.get('time').dispatch('animationend');a.controller.updateHud();assert.equal(has(a,'time','timer-beat'),false);
 a.game.s.elapsed=540;a.controller.updateHud();a.get('time').dispatch('animationend');
 a.game.s.elapsed=541;a.controller.updateHud();assert.equal(has(a,'time','timer-beat'),true);
 a.get('time').dispatch('animationend');a.game.s.endless=true;a.game.s.elapsed=542;a.controller.updateHud();assert.equal(has(a,'time','timer-beat'),false);
});

test('XP completion sweeps and bursts once; a reroll does not replay a level gain',async()=>{
 const a=app();await a.click('play');a.game.s.coins=20;a.game.gainXP(8);
 assert.equal(has(a,'xp-gauge','level-flash'),true);assert.equal(has(a,'xp-gauge','xp-full'),true);
 a.controller.updateHud();a.get('xp-gauge').dispatch('animationend');await a.click('reroll-upgrades');
 assert.equal(has(a,'xp-gauge','level-flash'),false);assert.equal(has(a,'xp-gauge','xp-full'),false);
});

test('choosing a card gives immediate gameplay control while its decorative pop finishes',async()=>{
 const a=app();await a.click('play');a.game.gainXP(8);const card=a.get('upgrade-options').children[0];
 card.dispatch('click');assert.equal(card.classList.contains('chosen'),true);assert.equal(a.controller.screen,'hud');
 assert.equal(a.game.s.mode,'playing');assert.equal(a.get('upgrades').inert,true);
 const level=a.game.s.level;card.dispatch('click');assert.equal(a.game.s.level,level);assert.equal(a.controller.screen,'hud');
});

test('results count up on presentation frames and settle exactly, with no simulation advance',async()=>{
 const clock={now:()=>100};const a=app(undefined,undefined,clock);await a.click('play');
 Object.assign(a.game.s,{mode:'gameover',elapsed:123,kills:42,coins:7,gems:2});await a.controller.renderResult(false);
 assert.equal(a.get('result-kills').textContent,'0');assert.equal(a.get('result-kills')['aria-label'],'42');
 a.controller.frame(200);assert.ok(Number(a.get('result-kills').textContent)>0);assert.ok(Number(a.get('result-kills').textContent)<42);
 a.controller.frame(420);assert.equal(a.get('result-kills').textContent,'42');assert.equal(a.get('result-time').textContent,'02:03');
 assert.equal(a.get('result-coins').textContent,'7');assert.equal(a.get('result-gems').textContent,'2');assert.equal(a.game.s.elapsed,123);
});

for(const system of [false,true])test(`reduced motion skips flashes, bumps and count-up (${system?'system preference':'game setting'})`,async()=>{
 const a=app(prefs({reduced:!system}),undefined,performance,undefined,{reducedMotion:system});await a.click('play');
 a.game.s.hp=10;a.game.s.coins=5;a.controller.updateHud();a.game.gainXP(8);a.controller.updateHud();
 for(const [id,name] of [['damage-vignette','hurt-pulse'],['coins','hud-bump'],['xp-gauge','level-flash'],['xp-gauge','xp-full']])assert.equal(has(a,id,name),false);
 assert.equal(has(a,'app','reduced-fx'),true);assert.equal(a.controller.renderer.reducedEffects,true);assert.equal(a.game.s.reducedEffects,true);
 a.game.s.mode='gameover';a.game.s.kills=42;await a.controller.renderResult(false);assert.equal(a.get('result-kills').textContent,'42');
});
