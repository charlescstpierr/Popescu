import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
let native;
try { native=createRequire(import.meta.url)('@napi-rs/canvas'); } catch {}
const optional={skip:!native&&'Optional @napi-rs/canvas is not installed'};
function figure({split=false,shift=0,smallHead=false}={}){
  const c=native.createCanvas(144,128),ctx=c.getContext('2d');ctx.fillStyle='#fff';
  ctx.fillRect(60,smallHead?50:40,smallHead?8:16,smallHead?8:16);
  if(split)ctx.fillRect(30,100+shift,80,11);
  else ctx.fillRect(60,78+shift,20,33);
  return c;
}
test('split diagnostic measures lower-body descent and widening while feet stay grounded',optional,async()=>{
  const {inspectSplitGeometry}=await import('../scripts/inspect-hero.mjs');
  const regular=inspectSplitGeometry(figure(),figure({split:true}),78);
  const smaller=inspectSplitGeometry(figure({smallHead:true}),figure({split:true,smallHead:true}),78);
  assert.deepEqual(smaller,regular,'head-only changes do not alter the body measurement');
  assert.equal(regular.groundShift,0);assert.ok(regular.centroidDrop>0);assert.ok(regular.widthIncrease>0);
});
test('split diagnostic rejects standing-frame reuse and rigid downward translation',optional,async()=>{
  const {inspectSplitGeometry}=await import('../scripts/inspect-hero.mjs');
  assert.throws(()=>inspectSplitGeometry(figure(),figure({smallHead:true}),78),/mass must descend/);
  assert.throws(()=>inspectSplitGeometry(figure(),figure({shift:3}),78),/footprint must widen/);
  assert.throws(()=>inspectSplitGeometry(figure(),figure({split:true,shift:3}),78),/feet must retain/);
});
