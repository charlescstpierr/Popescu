import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';

test('tutorial owns movement instructions and the generic hint stays hidden after moving or restoring',async()=>{
 const a=app(new Map());await a.click('play');a.click('skip-dialogue');
 a.game.s.opening={phase:'move',startedAt:0};a.controller.updateHud();
 assert.equal(a.get('opening-help').classList.contains('hidden'),false);
 assert.match(a.get('opening-help-text').textContent,/boug|déplac|gliss/i);
 assert.equal(a.get('control-hint').classList.contains('hidden'),true);
 a.events.keydown({key:'ArrowRight',target:{},preventDefault(){}});a.controller.frame(performance.now()+50);a.controller.updateHud();
 assert.equal(a.game.s.opening.phase,'shoot');assert.equal(a.get('control-hint').classList.contains('hidden'),true);
 a.game.s.opening.phase='done';a.controller.updateHud();assert.equal(a.get('control-hint').classList.contains('hidden'),true);
 a.game.s.opening=null;a.game.s.walkDistance=10;a.controller.updateHud();assert.equal(a.get('control-hint').classList.contains('hidden'),true);
});

test('experience gauge exposes the real progress and flashes only when a level is earned',async()=>{
 const a=app();await a.click('play');const g=a.game,gauge=a.get('xp-gauge');
 g.s.xp=4;a.controller.updateHud();assert.equal(a.get('xp-fill').style.width,'50%');assert.equal(a.get('xp-text').textContent,'EXPÉRIENCE 4 / 8');
 assert.equal(gauge['aria-valuenow'],4);assert.equal(gauge['aria-valuemax'],8);assert.equal(gauge.classList.contains('level-flash'),false);
 g.gainXP(2);assert.equal(a.controller.screen,'upgrades');assert.equal(gauge.classList.contains('level-flash'),true);
 gauge.dispatch('animationend');assert.equal(gauge.classList.contains('level-flash'),false);
 a.controller.updateHud();assert.equal(gauge['aria-valuemax'],g.s.xpNeed);assert.equal(gauge['aria-valuenow'],0);
 g.s.xp=g.s.xpNeed+5;a.controller.updateHud();assert.equal(gauge['aria-valuenow'],g.s.xpNeed);assert.equal(a.get('xp-fill').style.width,'100%');assert.equal(g.s.xp,g.s.xpNeed+5);
});

test('reduced effects keep experience progress without a level flash',async()=>{
 const a=app(new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,reduced:true})]]));await a.click('play');
 a.game.gainXP(4);a.controller.updateHud();assert.equal(a.controller.screen,'upgrades');assert.equal(a.get('xp-gauge').classList.contains('level-flash'),false);assert.equal(a.get('xp-text').textContent,`EXPÉRIENCE 0 / ${a.game.s.xpNeed}`);
});
