import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {DIFFICULTIES} from '../dist/content.js';
const results=[];
for(const difficulty of Object.keys(DIFFICULTIES))for(const chosen of [{pelican:'tarot',travestia:'panache',matriarch:'badge'},{pelican:'ascendant',travestia:'star',matriarch:'fanclub'}]){
 let g=new Game({difficulty,seed:711});g.s.trophies.chosen=chosen;g.s.upg={muscle:3,followers:3,chopper:2,ego:2,speed:2,validation:2,girlfriend:2,charisma:2};g.s.companion=true;g.recalculate();g.s.hp=g.s.maxhp=1e7;g.s.xpNeed=1e9;g.nextEvent=1e6;
 let peak=0,saves=0,nextSave=40,won=false,bossesAtVictory=0,peakBytes=0;
 while(g.s.elapsed<1500){
  if(g.s.mode==='victory'){assert.equal(won,false);won=true;bossesAtVictory=g.s.enemies.filter(e=>['pelican','travestia','matriarch'].includes(e.type)&&!e.dead).length;g.continueEndless();}
  if(g.s.mode==='dialogue')g.finishDialogue();if(g.s.mode==='upgrade')g.chooseUpgrade(g.s.options[0].id);if(g.s.mode==='trophy')throw Error('a fourth trophy choice appeared');assert.equal(g.s.mode,'playing');
  const i=g.s.elapsed,input={x:Math.cos(i/11),y:Math.sin(i/13)};g.update(.25,input);peak=Math.max(peak,g.s.enemies.length);assert.ok(peak<=300);assert.equal(Object.keys(g.s.trophies.chosen).length,3);
  if(g.s.elapsed>=nextSave){const snapshot=captureRun(g);peakBytes=Math.max(peakBytes,JSON.stringify(snapshot).length);const clone=restoreRun(snapshot);assert.deepEqual(captureRun(clone),snapshot);g.update(.02,input);clone.update(.02,input);assert.deepEqual(captureRun(clone),captureRun(g));g=clone;saves++;nextSave+=40;}
 }
 assert.ok(won&&g.s.endless);results.push({difficulty,trophies:Object.values(chosen),elapsed:g.s.elapsed,won,bossesAtVictory,checkpoints:saves,enemyPeak:peak,maxSnapshotBytes:peakBytes,kills:g.s.kills,remainingHp:g.s.hp});
}
const out={status:'pass',method:'Actual world, AI, weapons and trophy effects through 20:00 victory plus five endless minutes, with exact checkpoint reload and next-step comparison. High HP and fixed upgrades isolate invariants, not player survival or balance.',results};mkdirSync('proof/trophies',{recursive:true});writeFileSync('proof/trophies/soak.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
