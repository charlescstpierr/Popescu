import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createCanvas,Image}=require('@napi-rs/canvas');
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=process.argv[2]||'/tmp/toma-orangutan-qa';
mkdirSync(output,{recursive:true});process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h)}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js');const{Renderer}=await import('../dist/renderer.js');const{solveHeroAim}=await import('../dist/hero-pose.js');
const game=new Game({seed:42}),s=game.state,canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;
assert.ok(renderer.actors.available('orangutan'));
const contact=createCanvas(1024,900),cc=contact.getContext('2d');cc.fillStyle='#292236';cc.fillRect(0,0,1024,900);cc.fillStyle='#f4dbb5';cc.font='16px sans-serif';cc.fillText('Orangs-outans : vrais sprites et quatre phases, devant / dos / miroirs',18,24);
for(let row=0;row<4;row++)for(let phase=0;phase<4;phase++){
 const tile=createCanvas(128,128),c=tile.getContext('2d'),actor={type:'orangutan',x:64,y:115,faceX:row>=2?-1:1,faceY:row%2?-1:0};
 const before=JSON.stringify(actor);assert.equal(renderer.actors.draw(c,actor,'enemy',phase,s,92),true);assert.equal(JSON.stringify(actor),before);
 cc.imageSmoothingEnabled=false;cc.drawImage(tile,phase*256+22,row*210+40,192,192);cc.fillStyle='#d9cbdf';cc.font='13px sans-serif';cc.fillText(`${row%2?'DOS':'FACE'}${row>=2?' MIROIR':''} · ${phase+1}`,phase*256+24,row*210+54);
}
writeFileSync(resolve(output,'orangutan-all-views.png'),contact.toBuffer('image/png'));
s.elapsed=92;s.walkDistance=21;s.walkMoving=true;s.moveX=.4;s.moveY=0;s.faceX=1;s.faceY=0;s.shield=0;s.upg={muscle:2};s.chests=[];s.drops=[];s.particles=[];
const target=game.spawnEnemy('orangutan',86,-40);target.faceX=-1;target.faceY=0;
for(const[type,x,y,fx,fy]of [['orangutan',-102,75,1,0],['orangutan',102,178,1,-1],['normal',116,-210,-1,0]]){const e=game.spawnEnemy(type,x,y);e.faceX=fx;e.faceY=fy;}
Object.assign(s,solveHeroAim(s,target));renderer.resize(390,844);const before=JSON.stringify(s);renderer.render(game,92);assert.equal(JSON.stringify(s),before);
writeFileSync(resolve(output,'orangutan-mobile.png'),canvas.toBuffer('image/png'));
const enlarged=createCanvas(780,1688),ec=enlarged.getContext('2d');ec.imageSmoothingEnabled=false;ec.drawImage(canvas,0,0,780,1688);writeFileSync(resolve(output,'orangutan-mobile-2x.png'),enlarged.toBuffer('image/png'));
console.log(JSON.stringify({frames:16,simulationUnchanged:true,atlas:[renderer.actors.images.orangutan.width,renderer.actors.images.orangutan.height],output}));
