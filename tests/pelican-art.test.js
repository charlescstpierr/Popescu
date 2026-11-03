import test from 'node:test';
import assert from 'node:assert/strict';
import {ActorArt} from '../dist/actor-art.js';

test('pelican uses its own whole-body atlas and exposes portrait rendering',async()=>{
 const art=new ActorArt({loadImage:async path=>({path,width:1448,height:1086})});await art.ready;
 assert.equal(art.images.pelican?.path,'assets/pelican-poses.png');
 assert.equal(typeof art.drawPelican,'function');
 assert.ok(art.availableFor({type:'pelican'},'enemy'));
});

test('pelican paintings cover every attack and freeze on distance while paused',async()=>{
 const {pelicanFrame}=await import('../dist/pelican-art.js');
 const expected={peli_hug_warning:5,peli_hug:6,peli_zodiac_warning:7,peli_zodiac:7,peli_tarot_warning:8,peli_tarot:9,peli_recover:10};
 for(const [phase,index]of Object.entries(expected))assert.equal(pelicanFrame({phase,peliTime:.5}),index);
 const e={phase:'chase',peliMoving:true,peliWalkDistance:28};
 assert.equal(pelicanFrame(e,1),2);assert.equal(pelicanFrame(e,30),2);
 assert.equal(pelicanFrame({...e,peliMoving:false}),4);
 assert.equal(pelicanFrame({...e,hitFlash:.1}),11);
});

test('pelican danger drawings share exact simulation footprints and safe wedge',async()=>{
 const {pelicanHazards}=await import('../dist/pelican-art.js');
 const {PELICAN,pelicanCards,pelicanRingRadius}=await import('../dist/pelican.js');
 const e={type:'pelican',x:17,y:42,peliX:0,peliY:20,peliDX:.6,peliDY:.8,peliTime:.5};
 const h=pelicanHazards({...e,phase:'peli_hug_warning'});
 assert.equal(h.length,PELICAN.hug.speed*PELICAN.hug.duration);assert.equal(h.width,PELICAN.hug.width);
 const z=pelicanHazards({...e,phase:'peli_zodiac'});
 assert.equal(z.radius,pelicanRingRadius(e.peliTime));assert.equal(z.inner,Math.max(16,z.radius-8));assert.equal(z.outer,z.radius+8);assert.equal(z.gap,.85);
 const w=pelicanHazards({...e,phase:'peli_zodiac_warning'});assert.equal(w.inner,16);assert.equal(w.outer,163);
 const cards={...e,phase:'peli_tarot'};assert.deepEqual(pelicanHazards(cards).cards,pelicanCards(cards));
 for(const phase of ['charmed','suppressed','peli_recover','chase'])assert.equal(pelicanHazards({...e,phase}),null);
});

test('whole-body pelican drawing mirrors once and never mutates the actor',async()=>{
 const art=new ActorArt({loadImage:async path=>({path,width:1448,height:1086})});await art.ready;
 const calls=[],ctx=new Proxy({}, {get:(_,name)=>(...args)=>calls.push([name,...args])});
 const e=Object.freeze({type:'pelican',x:12,y:30,peliDX:-1,peliTime:.5,phase:'peli_hug'});
 art.drawPelican(ctx,e,10);
 assert.equal(calls.filter(c=>c[0]==='drawImage').length,1);
 assert.deepEqual(calls.filter(c=>c[0]==='scale'),[['scale',-1,1]]);
 assert.ok(!calls.some(c=>['transform','rotate','setTransform'].includes(c[0])));
 assert.equal(e.x,12);assert.equal(e.phase,'peli_hug');
});

test('pelican frame selector and telegraphs do not run on unrelated enemies',async()=>{
 const {pelicanHazards,drawPelicanGround,drawPelicanCards}=await import('../dist/pelican-art.js');
 assert.equal(pelicanHazards({type:'normal',phase:'peli_hug_warning'}),null);
 let draws=0;const ctx=new Proxy({}, {get:()=>()=>draws++});
 const quiet={type:'pelican',phase:'suppressed'};
 drawPelicanGround(ctx,quiet);drawPelicanCards(ctx,quiet);assert.equal(draws,0);
});
