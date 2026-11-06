import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';

const visible=(a,id)=>!a.get(id).classList.contains('hidden');
test('banter shows system glyphs for non-character voices and character art for named speakers',async()=>{
 const a=app();await a.click('play');
 for(const who of ['SYSTÈME','RÉSEAU LOCAL','__proto__',undefined]){
  a.controller.showBanter({who,text:'Message du réseau.',encounter:true});
  assert.equal(visible(a,'banter-system'),true);
  assert.equal(visible(a,'banter-portrait'),false);
  assert.equal(visible(a,'banter-rival'),false);
 }
 for(const who of ['TOMA','TOMA POPESCU']){
  a.controller.showBanter({who,text:'Moi.',encounter:true});
  assert.equal(visible(a,'banter-system'),false);
  assert.equal(visible(a,'banter-portrait'),true);
  assert.equal(a.get('banter-portrait').src,'assets/portrait-toma-current.webp');
 }
 for(let rank=1;rank<=5;rank++){
  a.game.s.upg.girlfriend=rank;
  a.controller.showBanter({who:'BLONDE IA',text:'Salut.',encounter:true});
  assert.equal(a.get('banter-portrait').src,rank===1?'assets/portrait-blonde-ia.webp':`assets/companion-portrait-${rank}.png`);
 }
 const actors=a.controller.renderer.actors;
 Object.assign(actors,{frame:()=>null,drawPelican(){},drawTravestia(){}});
 a.get('banter-rival').getContext=()=>({fillRect(){},save(){},scale(){},restore(){},fillText(){},translate(){}});
 for(const who of ['COQ RIVAL','BOUC RIVAL','PÉLI ZODIAQUE','TRAVESTIA','CHARLES']){
  a.controller.showBanter({who,text:'Je suis là.',encounter:true});
  assert.equal(visible(a,'banter-rival'),true);
  assert.equal(visible(a,'banter-portrait'),false);
  assert.equal(visible(a,'banter-system'),false);
 }
});

test('defeat explains the stored lethal source; victory and legacy runs clear that explanation',async()=>{
 const a=app();await a.click('play');
 a.game.s.elapsed=10;a.game.s.hp=0;a.game.s.mode='gameover';
 a.game.s.deathCause={source:'gas',actorType:null,actorId:null,at:10,hpLoss:5};
 await a.controller.renderResult(false);
 assert.equal(visible(a,'result-cause'),true);
 assert.equal(a.get('result-cause').textContent,'DERNIER COUP · Gaz toxique');
 await a.controller.renderResult(true);
 assert.equal(visible(a,'result-cause'),false);
 assert.equal(a.get('result-cause').textContent,'');
 delete a.game.s.deathCause;await a.controller.renderResult(false);
 assert.equal(visible(a,'result-cause'),false);
});


test('the power strip keeps native horizontal scrolling without starting movement',async()=>{
 const a=app();await a.click('play');const target={closest:selector=>selector==='#powers'?a.get('powers'):null};
 a.get('app').dispatch('pointerdown',{pointerId:1,clientX:100,clientY:500,target,preventDefault(){assert.fail('scrolling is native');}});
 assert.equal(a.controller.inputState.pointer,null);
 a.events.keydown({key:'ArrowRight',target,preventDefault(){assert.fail('scrolling is native');}});
 assert.equal(a.controller.inputState.keys.includes('arrowright'),false);
});
