import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
// Diagnostic story traces, not balance measurements: temporary invulnerability
// keeps each seeded run alive long enough to inspect every reading interval.
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {speechDuration} from '../dist/speech.js';
import {UPGRADES,victoryQuote} from '../dist/content.js';
import {BOSS_TROPHIES} from '../dist/boss-trophies.js';

const reports=[];
for(const seed of [42,1729])for(const companion of [false,true]){
 let game,last=null,checks=0,restores=0;const visible=new Map(),sceneLast=new Map(),lines=[];
 const close=at=>{if(last)visible.set(last.id,(visible.get(last.id)||0)+Math.max(0,Math.min(at,last.until)-last.at));};
 const onEvent=(type,payload)=>{
  if(type!=='bark')return;
  const at=game.s.elapsed+(game.s.charles?.elapsed||0),line=game.speech.active,scene=game.speech.scene;
  close(at);last={id:line.id,at,until:line.until};
  if(line.sceneId&&scene){
   const prior=sceneLast.get(scene.id);
   if(scene.index>0&&prior&&prior.id!==line.id){assert.ok((visible.get(prior.id)||0)+1e-6>=speechDuration(prior.text),`unread setup: ${scene.id}`);checks++;}
   sceneLast.set(scene.id,{id:line.id,text:line.text});
  }
  lines.push({at:Number(at.toFixed(2)),who:payload.who,text:payload.text,id:line.id,scene:line.sceneId,index:scene?.index??null});
 };
 game=new Game({seed,onEvent});
 for(const id of companion?['car','girlfriend']:['car']){game.s.mode='upgrade';game.s.options=[UPGRADES.find(x=>x.id===id)];game.chooseUpgrade(id);}
 let frame=0;
 while(game.s.elapsed<1200&&frame<40000){
  if(game.s.mode==='upgrade'){const option=game.s.options.find(x=>companion||x.id!=='girlfriend')||game.s.options[0];game.chooseUpgrade(option.id);}
  if(game.s.mode==='trophy'){const boss=game.s.trophies.pending[0].bossType;game.chooseTrophy(BOSS_TROPHIES[boss].choices[0]);}
  if(game.s.mode==='dialogue')game.finishDialogue();
  game.s.invulnerable=2;game.update(.05,{x:Math.cos(frame/300),y:Math.sin(frame/300)});frame++;
  if(frame%2000===0){const saved=captureRun(game),copy=restoreRun(saved,{onEvent});assert.deepEqual(captureRun(copy),saved);game=copy;restores++;}
 }
 close(game.s.elapsed);assert.equal(game.s.mode,'victory');assert.equal(game.s.endless,false);
 assert.ok(game.eventSeen.has('scene:build-car'));
 assert.ok(companion||lines.every(line=>line.who!=='BLONDE IA'));
 const survival={elapsed:game.s.elapsed,kills:game.s.kills};
 // Charles remains optional. Exiting does not alter the survival clock.
 assert.equal(game.startCharlesEpilogue(),true);game.update(.02);assert.equal(game.leaveCharlesEpilogue(),true);assert.equal(game.s.elapsed,survival.elapsed);
 game.continueEndless();assert.equal(game.s.endless,true);game.update(.02);
 reports.push({seed,companion,mode:'diagnostic invulnerability',survivalSeconds:Number(survival.elapsed.toFixed(2)),readingPredecessorChecks:checks,saveRestores:restores,completedScenes:[...game.eventSeen].filter(x=>x.startsWith('scene:')),lines:lines.length,payoff:victoryQuote(game.s,game.eventSeen),charlesExitAndEndless:'pass',sample:lines.filter(x=>x.scene==='build-car'||x.scene==='companion-local').map(({at,who,text})=>({at,who,text}))});
}
console.log(JSON.stringify(reports,null,2));
