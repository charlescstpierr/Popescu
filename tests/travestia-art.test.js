import test from 'node:test';
import assert from 'node:assert/strict';
import {travestiaFrame,TRAVESTIA} from '../dist/travestia.js';
import {ActorArt} from '../dist/actor-art.js';
test('complete Travestia paintings cover walk, turn, helicopter and recovery',()=>{assert.deepEqual([1.2,.7,.2].map(tailTime=>travestiaFrame({phase:'tail_windup',tailTime})),[5,6,7]);assert.deepEqual([1.4,1.3].map(tailTime=>travestiaFrame({phase:'tail_spin',tailTime})),[8,9]);assert.equal(travestiaFrame({phase:'tail_recover',tailTime:1}),10);assert.equal(travestiaFrame({phase:'tail_recover',tailTime:.3}),4);assert.equal(TRAVESTIA.radius,105);});
test('actor artwork loads Travestia as its own atlas, never a gorilla',async()=>{const art=new ActorArt({loadImage:async path=>({path})});await art.ready;assert.equal(art.images.travestia.path,'assets/travestia-poses.png');assert.ok(art.availableFor({type:'travestia'},'enemy'));});
test('Travestia walk frames follow distance and remain frozen when simulation pauses',()=>{const e={phase:'chase',tailMoving:true,tailWalkDistance:28};assert.equal(travestiaFrame(e,1),2);assert.equal(travestiaFrame(e,20),2);assert.equal(travestiaFrame({...e,tailMoving:false},20),4);});
