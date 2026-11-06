import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';

function down(a,target,x=100,y=160,id=1){
 a.get('app').dispatch('pointerdown',{target,pointerId:id,clientX:x,clientY:y,preventDefault(){}});
}
function banterTarget(a,id){
 return {closest:selector=>selector==='#banter'?a.get('banter'):selector==='.hud-top'?{}:selector==='button'&&id==='banter-close'?a.get(id):null};
}

for(const width of [320,390])test(`a drag can start anywhere on the banter card at ${width}px, including above the usual joystick zone`,async()=>{
 const a=app(undefined,undefined,performance,{left:0,top:0,width,height:844});await a.click('play');
 a.controller.showBanter({who:'TOMA',text:'Moi, je bouge.',encounter:true});
 for(const [id,x,y] of [['banter',12,140],['banter-portrait',30,160],['banter-name',80,155],['banter-text',width-65,175],['banter-system',30,160]]){
  down(a,banterTarget(a,id),x,y);
  assert.equal(a.controller.inputState.pointer,1,id);
  assert.equal(a.get('app').captured,1);
  a.get('app').dispatch('pointermove',{pointerId:1,clientX:x+40,clientY:y,preventDefault(){}});
  assert.equal(a.controller.inputState.input.x,1);
  const before=a.game.s.x;a.game.s.opening=null;a.controller.frame(performance.now()+50);
  assert.ok(a.game.s.x>before,'drag moves Toma through the real controller');
  a.get('app').dispatch('pointerup',{pointerId:1});
  assert.equal(a.controller.inputState.pointer,null);
  assert.equal(a.controller.inputState.input.x,0);
 }
 down(a,banterTarget(a,'banter-close'));assert.equal(a.controller.inputState.pointer,null);
 a.click('banter-close');assert.equal(a.get('banter').classList.contains('hidden'),true);
 down(a,{closest:selector=>selector==='.hud-top'?{}:null});assert.equal(a.controller.inputState.pointer,null);
});

for(const width of [320,390])test(`banter clears the power strip and moving boss nameplates at ${width}px without changing simulation state`,async()=>{
 const a=app(undefined,undefined,performance,{left:0,top:0,width,height:844});await a.click('play');
 a.game.s.mode='paused';a.game.s.opening=null;
 a.get('hud-top').getBoundingClientRect=()=>({left:0,top:0,width,height:132,bottom:132});
 a.get('banter').offsetHeight=width===320?80:64;
 a.get('control-safe-area').getBoundingClientRect=()=>({left:0,top:0,width,height:844,bottom:844});
 a.controller.showBanter({who:'SYSTÈME',text:'La horde te poursuit. Aucun autographe n’est demandé.',encounter:true});
 const boss=a.game.spawnEnemy('pelican',a.game.s.x,a.game.s.y-70);
 for(const type of ['pelican','travestia'])for(const y of [-220,-120,-70,0,80,250,400]){
  boss.type=type;boss.y=a.game.s.y+y;
  const before=structuredClone(a.game.s);a.controller.frame(performance.now());
  const top=parseFloat(a.get('banter').style.top),bottom=top+a.get('banter').offsetHeight;
  const feet=Math.round(boss.y)+Math.round(844*.48-a.game.s.y),labelTop=feet-(type==='pelican'?156:149),labelBottom=feet-(type==='pelican'?131:124);
  assert.ok(top>=138,'card stays below powers');
  assert.equal(a.get('banter').style.visibility,'','card remains readable');
  assert.ok(bottom<=labelTop||top>=labelBottom,`${type} label ${labelTop}–${labelBottom}, card ${top}–${bottom}`);
  assert.deepEqual(a.game.s,before,'layout does not mutate the engine');
 }
 boss.dead=true;a.controller.frame(performance.now());assert.equal(parseFloat(a.get('banter').style.top),138);
});


test('two boss labels share the reserved lane, and a short viewport never forces the card over them',async()=>{
 const a=app(undefined,undefined,performance,{left:0,top:0,width:320,height:568});await a.click('play');
 a.game.s.mode='paused';a.game.s.opening=null;
 a.get('hud-top').getBoundingClientRect=()=>({bottom:132});
 a.get('control-safe-area').getBoundingClientRect=()=>({bottom:568});
 a.get('banter').offsetHeight=80;
 const oy=Math.round(568*.48-a.game.s.y);
 a.game.spawnEnemy('pelican',a.game.s.x,440-oy);
 const second=a.game.spawnEnemy('normal',a.game.s.x,350-oy);second.type='travestia';
 a.controller.showBanter({who:'SYSTÈME',text:'La horde arrive.',encounter:true});
 a.controller.frame(performance.now());
 assert.equal(a.get('banter').style.visibility,'hidden','no readable gap is temporarily hidden');
 a.game.s.enemies.length=0;a.controller.frame(performance.now());
 assert.equal(a.get('banter').style.visibility,'');assert.equal(a.get('banter').style.top,'138px');
});
