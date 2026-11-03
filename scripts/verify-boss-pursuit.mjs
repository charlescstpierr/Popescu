// Real-engine deterministic scenario audit. Observes without changing health,
// damage, enemies, terrain, loot or spawns. Scripted controllers are not humans.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(process.argv[2]||'.'),seed=Number(process.argv[3]||42),controller=process.argv[4]||'east',difficulty=process.argv[5]||'normal';
const {Game}=await import(pathToFileURL(resolve(root,'dist/engine.js')));
const major=e=>['matriarch','travestia','pelican'].includes(e.type);
let game;const bosses=[],levels=[];let peaks={enemies:0,drops:0},hpDamage=0;
game=new Game({seed,difficulty,onEvent(type){if(type==='upgrade')levels.push({time:game.s.elapsed,level:game.s.level});}});
const spawn=game.spawnEnemy.bind(game);game.spawnEnemy=(...args)=>{const e=spawn(...args);if(e&&major(e))bosses.push({id:e.id,type:e.type,spawn:game.s.elapsed,hp:e.hp,visibleSeconds:0,attackSeconds:0,relocations:0});return e;};
const kill=game.kill.bind(game);game.kill=e=>{const result=kill(e);const row=bosses.find(b=>b.id===e.id);if(row&&e.rewarded)row.defeated=true;return result;};
const damage=game.damage.bind(game);game.damage=(...args)=>{const before=game.s.hp;const r=damage(...args);hpDamage+=before-game.s.hp;return r;};
const inputs={east:()=>({x:1,y:0}),weave:s=>({x:1,y:.85*Math.sin(s.elapsed/9)}),collector:s=>{
 const drops=s.drops.filter(d=>d.kind==='xp');let goal=null,best=500;
 for(const d of drops){const v=Math.hypot(d.x-s.x,d.y-s.y);if(v<best){best=v;goal=d;}}
 const gx=goal?goal.x-s.x:1,gy=goal?goal.y-s.y:.45*Math.sin(s.elapsed/8),gn=Math.hypot(gx,gy)||1;
 let choice={x:1,y:0},score=-Infinity;
 for(let i=0;i<16;i++){const a=i*Math.PI/8,x=Math.cos(a),y=Math.sin(a),px=s.x+x*60,py=s.y+y*60;
  if(game.world.collides(s.x+x*22,s.y+y*22,13)||game.world.collides(px,py,13))continue;
  let value=(x*gx+y*gy)/gn;
  for(const e of s.enemies){const d=Math.hypot(e.x-px,e.y-py);if(d<120)value-=3*(1-d/120);}
  if(value>score){score=value;choice={x,y};}
 }
 return choice;
}};
let frames=0;
while(!['gameover','victory'].includes(game.s.mode)&&game.s.elapsed<1202){
 if(game.s.mode==='upgrade')game.chooseUpgrade(game.s.options[0].id);
 if(game.s.mode==='dialogue')game.finishDialogue();
 const before=game.s.enemies.filter(major).map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp,distance:Math.hypot(e.x-game.s.x,e.y-game.s.y)}));
 game.update(1/30,inputs[controller](game.s));frames++;
 for(const b of before){const e=game.s.enemies.find(e=>e.id===b.id),row=bosses.find(r=>r.id===b.id);if(!row)continue;
  if(!e){row.exit=game.s.elapsed;row.hpBeforeExit=b.hp;row.distanceBeforeExit=b.distance;row.defeated=!!row.defeated;}
  else {if(Math.abs(e.x-b.x)>500||Math.abs(e.y-b.y)>500)row.relocations++;if(Math.abs(e.x-game.s.x)<game.viewport.width/2+e.r&&Math.abs(e.y-game.s.y)<game.viewport.height*.52+e.r)row.visibleSeconds+=1/30;if(e.phase.includes('tail_')||e.phase.includes('peli_'))row.attackSeconds+=1/30;}
 }
 peaks.enemies=Math.max(peaks.enemies,game.s.enemies.length);peaks.drops=Math.max(peaks.drops,game.s.drops.length);
 if(frames>100000)throw new Error('Stalled simulation');
}
for(const r of bosses){r.visibleSeconds=+r.visibleSeconds.toFixed(2);r.attackSeconds=+r.attackSeconds.toFixed(2);const e=game.s.enemies.find(e=>e.id===r.id);if(e)r.remainingHp=e.hp;}
console.log(JSON.stringify({seed,controller,difficulty,mode:game.s.mode,elapsed:game.s.elapsed,hp:game.s.hp,level:game.s.level,kills:game.s.kills,hpDamage,peaks,bosses,levels}));
