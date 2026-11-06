import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CANVAS_MODULE||'@napi-rs/canvas');
const {ActorArt}=await import('../dist/actor-art.js');
const {Game}=await import('../dist/engine.js');
const out=resolve(process.argv[2]||'/tmp/travestia-transitions');mkdirSync(resolve(out,'frames'),{recursive:true});
const art=new ActorArt({loadImage:path=>loadImage(resolve('dist',path))});await art.ready;
const names=['E','SE','S','SW','W','NW','N','NE'];
const samples=[['Turn', 'tail_dash_windup',1.3],['Arm','tail_dash_windup',.8],['Lock','tail_dash_windup',.3],['Dash','tail_dash',.4],['Brake','tail_dash_recover',1.3],['Recover','tail_dash_recover',1],['Rest','tail_dash_recover',.2]];
const sheet=createCanvas(7*220,8*220),sc=sheet.getContext('2d');sc.fillStyle='#23182f';sc.fillRect(0,0,sheet.width,sheet.height);
for(let dir=0;dir<8;dir++)for(let col=0;col<samples.length;col++){
 const [label,phase,tailTime]=samples[col],e={type:'travestia',x:110,y:170,phase,tailTime,tailDashDir:dir,faceX:1,tailFaceX:1,tailMoving:true,tailWalkDistance:42};
 sc.save();sc.translate(col*220,dir*220);sc.fillStyle='#ddd';sc.font='14px sans-serif';sc.fillText(`${names[dir]} · ${label}`,10,20);sc.strokeStyle='#6e6079';sc.beginPath();sc.moveTo(15,181);sc.lineTo(205,181);sc.stroke();const before=JSON.stringify(e);art.drawTravestia(sc,e,0);assert.equal(JSON.stringify(e),before);sc.restore();
}
writeFileSync(resolve(out,'contact.png'),sheet.toBuffer('image/png'));
const games=names.map((_,dir)=>{const game=new Game({seed:42});game.world.collides=()=>false;game.s.x=Math.cos(dir*Math.PI/4)*120;game.s.y=Math.sin(dir*Math.PI/4)*120;const e=game.spawnEnemy('travestia',0,0);e.tailAttackCount=1;game.updateEnemies(.001);assert.equal(e.tailDashDir,dir);return {game,e};});
for(let frame=0;frame<70;frame++){
 const canvas=createCanvas(2400,1000),ctx=canvas.getContext('2d');ctx.fillStyle='#23182f';ctx.fillRect(0,0,canvas.width,canvas.height);
 for(let dir=0;dir<8;dir++){
  const {game,e}=games[dir];ctx.save();ctx.translate((dir%4)*600+300,Math.floor(dir/4)*500+200);ctx.fillStyle='#ddd';ctx.font='18px sans-serif';ctx.fillText(`${names[dir]} · ${e.phase} · ${(frame*.05).toFixed(2)} s`,-280,-170);const before=JSON.stringify(game.s);art.drawTravestia(ctx,e,frame*.05);assert.equal(JSON.stringify(game.s),before);ctx.restore();game.updateEnemies(.05);
 }
 writeFileSync(resolve(out,'frames',`${String(frame).padStart(3,'0')}.png`),canvas.toBuffer('image/png'));
}
console.log(JSON.stringify({out,directions:8,frames:70,renderPure:true,source:'Native ActorArt with actual Game simulation'}));
