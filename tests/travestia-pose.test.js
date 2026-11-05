import test from 'node:test';
import assert from 'node:assert/strict';
import {ActorArt} from '../dist/actor-art.js';
const art=new ActorArt({loadImage:async path=>({path,width:path.includes('dash')?800:1448,height:path.includes('dash')?400:1086})});
await art.ready;
function draw(e,time=0){const calls=[];const ctx={save(){},restore(){},translate(...a){calls.push(['translate',...a]);},scale(...a){calls.push(['scale',...a]);},drawImage(img,...a){calls.push(['image',img.path,...a]);}};art.drawTravestia(ctx,e,time);return calls;}
const actor={type:'travestia',x:50,y:70,faceX:1,tailFaceX:1,tailDashDir:0,tailMoving:true,tailWalkDistance:42};
test('dash anticipation and rest use complete non-walking paintings instead of one held dash frame',()=>{
 const start=draw({...actor,phase:'tail_dash_windup',tailTime:1.3});
 const armed=draw({...actor,phase:'tail_dash_windup',tailTime:.8});
 const dash=draw({...actor,phase:'tail_dash',tailTime:.4});
 const recovery=draw({...actor,phase:'tail_dash_recover',tailTime:1});
 const rest=draw({...actor,phase:'tail_dash_recover',tailTime:.2});
 for(const calls of [start,armed,recovery,rest])assert.equal(calls.find(c=>c[0]==='image')[1],'assets/travestia-poses.png');
 assert.notDeepEqual(start,armed);assert.notDeepEqual(recovery,rest);
 assert.equal(dash.find(c=>c[0]==='image')[1],'assets/travestia-dash.png');
});
test('all eight active directions and their registered floor anchors stay unchanged',()=>{for(let dir=0;dir<8;dir++){
 const image=draw({...actor,phase:'tail_dash',tailTime:.4,tailDashDir:dir}).find(c=>c[0]==='image');
 assert.deepEqual(image.slice(2),[dir%4*200,Math.floor(dir/4)*200,200,200,-50,-93,200,200]);
}});
test('render is pure and independent of wall time in every dash phase',()=>{for(const phase of ['tail_dash_windup','tail_dash','tail_dash_recover'])for(const tailTime of [1.3,1,.8,.5,.2]){
 const e=Object.freeze({...actor,phase,tailTime});const before=JSON.stringify(e);assert.deepEqual(draw(e,0),draw(e,999));assert.equal(JSON.stringify(e),before);
}});
test('transition selection is timer-based, keeps the exact locked direction near impact and does not use walk frames',()=>{
 for(let dir=0;dir<8;dir++)for(const [phase,time,index,directional] of [
 ['tail_dash_windup',1.3,5,false],['tail_dash_windup',.9,6,false],['tail_dash_windup',.5,dir,true],
 ['tail_dash_recover',1.4,dir,true],['tail_dash_recover',1.1,10,false],['tail_dash_recover',.3,4,false]]){
  const calls=draw({...actor,phase,tailTime:time,tailDashDir:dir}),image=calls.find(c=>c[0]==='image');
  const cell=directional?200:362;assert.deepEqual(image.slice(2,6),[index%4*cell,Math.floor(index/4)*cell,cell,cell]);
  if(!directional){assert.deepEqual(calls[0],['translate',50,81]);assert.deepEqual(image.slice(6),[-72,-132,144,144]);assert.equal(calls.some(c=>c[0]==='scale'),[0,1,7].includes(dir));}
 }
});
test('missing directional atlas falls back to a planted idle pose rather than stale walking',()=>{
 const image=art.images.travestia_dash;art.images.travestia_dash=null;
 try{const call=draw({...actor,phase:'tail_dash',tailTime:.4}).find(c=>c[0]==='image');assert.deepEqual(call.slice(2,6),[0,362,362,362]);}finally{art.images.travestia_dash=image;}
});
