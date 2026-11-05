import {fileURLToPath} from 'node:url';
import {HeroArt} from '../dist/hero-art.js';
// Native Canvas replay of actual Game timers and actual Renderer, not hand-drawn previews.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(process.env.CANVAS_MODULE||'@napi-rs/canvas');
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{ActorArt}=await import('../dist/actor-art.js');
const out=resolve(process.argv[2]||'/tmp/popescu-ordinary-animation-qa');mkdirSync(resolve(out,'frames'),{recursive:true});
globalThis.OffscreenCanvas=class {constructor(w,h){return createCanvas(w,h);}};
const art=new ActorArt({loadImage:path=>loadImage(resolve('dist',path))});await art.ready;
const species=['orangutan','rival_goat','rival_rooster'];
const scenes=[];
for(let row=0;row<2;row++)for(const type of species){
 const game=new Game({seed:42});game.world.collides=()=>false;game.world.getVisible=()=>[];
 game.s.x=row?0:70;game.s.y=row?-70:0;game.s.hp=game.s.maxhp=10000;game.s.elapsed=10;
 const e=game.spawnEnemy(type,0,0);game.updateEnemies(.001);assert.equal(e.phase,'windup');
 const canvas=createCanvas(390,422),renderer=new Renderer(canvas);await renderer.ready;renderer.resize(390,422);renderer.actors=art;renderer._drawGround=()=>{};renderer.hero=new HeroArt({loadImage:src=>loadImage(fileURLToPath(src))});await renderer.hero.ready;
 scenes.push({game,e,canvas,renderer,row,type,seen:new Set()});
}
const records=[],contact=createCanvas(5*390,6*422),cc=contact.getContext('2d');
const targets={orangutan:[0,.4,.61,.73,.84],rival_goat:[0,.42,.81,.95,1.36],rival_rooster:[0,.3,.6,.86,1.46]};
for(let frame=0;frame<54;frame++){
 const sheet=createCanvas(1170,844),ctx=sheet.getContext('2d');
 for(let i=0;i<scenes.length;i++){
  const scene=scenes[i],{game,e,renderer,canvas,type,row}=scene;const time=frame/30;
  const before=JSON.stringify(game.s);renderer.render(game,game.s.elapsed);assert.equal(JSON.stringify(game.s),before,'renderer is read-only');
  const c=canvas.getContext('2d');c.fillStyle='#fff';c.font='12px monospace';c.fillText(`${type} ${row?'back':'front'} ${time.toFixed(2)}s ${e.phase}`,8,20);
  ctx.drawImage(canvas,(i%3)*390,Math.floor(i/3)*422);
  for(let col=0;col<5;col++)if(time>=targets[type][col]&&!scene.seen.has(col)){scene.seen.add(col);cc.drawImage(canvas,col*390,i*422);}
  records.push({frame,type,view:row?'back':'front',phase:e.phase,windup:e.windup,swipe:e.swipe,charge:e.charge,crow:e.crow,x:e.x,y:e.y,playerHP:game.s.hp});
  game.s.elapsed+=1/30;game.updateEnemies(1/30);game.updateShockwaves?.(1/30);
 }
 writeFileSync(resolve(out,'frames',`${String(frame).padStart(3,'0')}.png`),sheet.toBuffer('image/png'));
}
writeFileSync(resolve(out,'contact.png'),contact.toBuffer('image/png'));writeFileSync(resolve(out,'replay.json'),JSON.stringify({render:'actual Game.updateEnemies + actual Renderer.render, native Canvas; no browser/mobile certification',frames:54,fps:30,records},null,2));
console.log(JSON.stringify({out,scenes:6,frames:54,readOnly:true}));
