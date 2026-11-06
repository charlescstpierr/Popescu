import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Renderer} from '../dist/renderer.js';
import {Game} from '../dist/engine.js';
const require=createRequire(import.meta.url);let native;try{native=require('@napi-rs/canvas');}catch{}
test('warm lamp falloff reaches the road, stays local and remains static in reduced effects',{skip:native?false:'Optional @napi-rs/canvas is not installed'},()=>{
 const old=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
 try{
  const canvas=native.createCanvas(390,844),r=new Renderer(canvas),g=new Game({seed:42});
  r._drawGround=()=>{};r._actor=()=>{};r._prop=()=>{};
  const props=[{type:'lamp',x:-100,y:0,w:20,h:80}];g.world.getVisible=()=>props;
  r.render(g,0);const lit=canvas.getContext('2d').getImageData(0,0,390,844).data;
  props.length=0;r.render(g,0);const dark=canvas.getContext('2d').getImageData(0,0,390,844).data;
  const road=(405*390+195)*4,far=(405*390+270)*4;
  assert.ok(lit[road]>dark[road],'light reaches road pixels about 100 px from the lamp');
  assert.deepEqual(lit.slice(far,far+4),dark.slice(far,far+4),'the pool does not flood the street');
  props.push({type:'lamp',x:-100,y:0,w:20,h:80});r.reducedEffects=true;r.render(g,0);const first=canvas.toBuffer('image/png');r.render(g,30);
  assert.deepEqual(canvas.toBuffer('image/png'),first,'reduced light has no shimmer or pulse');
 }finally{globalThis.OffscreenCanvas=old;}
});
