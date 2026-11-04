import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),canvasModule=require(process.env.POPESCU_CANVAS_MODULE||'@napi-rs/canvas');
const {createCanvas,Image}=canvasModule,root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{EGO_BEASTS,initEgoBeast,beginEgoAttack,egoHeight}=await import('../dist/ego-beasts.js');
const output=resolve(process.argv[2]||'/tmp/ego-art-qa');mkdirSync(output,{recursive:true});
for(const width of [320,390])for(const reduced of [false,true]){
 const canvas=createCanvas(width,844),renderer=new Renderer(canvas);renderer.resize(width,844);await renderer.ready;assert.equal(canvas.width,width);assert.equal(renderer.width,width);assert.ok(renderer.actors.available('ego'),'ego atlas decodes');renderer.reducedEffects=reduced;
 const game=new Game({seed:42});const s=game.state;s.elapsed=110;s.mode='playing';s.enemies=[];
 for(const [i,type]of Object.keys(EGO_BEASTS).entries()){
  const e=initEgoBeast({id:500+i,type,x:(i%2?1:-1)*65,y:Math.floor(i/2)*180-120,phase:'chase',faceX:1,faceY:0,hp:90,maxhp:90,r:EGO_BEASTS[type].r});beginEgoAttack(e,{x:e.x+(type==='ego_chameleon'?-100:35),y:e.y+40});e.faceX=e.egoDX;s.enemies.push(e);
 }
 for(const phase of ['ego_warning','ego_jump','ego_active','ego_recover']){
  for(const e of s.enemies){e.phase=phase==='ego_jump'?'ego_active':phase;e.egoTime=e.phase==='ego_active'?(e.type==='ego_toad'?(phase==='ego_jump'?.6:.1):EGO_BEASTS[e.type].duration-.05):phase==='ego_warning'?.6:.7;if(e.type==='ego_toad'){const p=e.phase==='ego_warning'?0:phase==='ego_jump'?.5:1;e.x=e.egoX+(e.egoLandX-e.egoX)*p;e.y=e.egoY+(e.egoLandY-e.egoY)*p;}}
  const before=JSON.stringify(s);renderer.render(game,110);assert.equal(JSON.stringify(s),before);writeFileSync(resolve(output,`${width}-${reduced?'reduced':'full'}-${phase}.png`),canvas.toBuffer('image/png'));
 }
 const sheet=createCanvas(560,550),ctx=sheet.getContext('2d');ctx.fillStyle='#28223b';ctx.fillRect(0,0,560,550);ctx.font='12px sans-serif';ctx.fillStyle='#fff';
 for(const [row,type]of Object.keys(EGO_BEASTS).entries())for(let col=0;col<4;col++){const e=initEgoBeast({type,x:70+col*140,y:120+row*135,faceX:1,phase:['chase','ego_warning','ego_active','ego_recover'][col],egoTime:.6});e.egoTime=.6;e.y+=egoHeight(e);renderer.actors.draw(ctx,e,'enemy',0,s,0);}
 writeFileSync(resolve(output,'registered-poses.png'),sheet.toBuffer('image/png'));
 const camo=createCanvas(600,330),c=camo.getContext('2d');
 for(const [row,surface]of ['building','asphalt','grass'].entries()){c.fillStyle={building:'#776e78',asphalt:'#352c43',grass:'#4e5938'}[surface];c.fillRect(0,row*110,600,110);for(let col=0;col<3;col++){const e={type:'ego_chameleon',x:100+col*200,y:100+row*110,faceX:1,egoSurface:surface,egoReveal:0,phase:col===1?'chase':'ego_warning',egoTime:.6};renderer.actors.draw(c,e,'enemy',0,s,0);}}
 writeFileSync(resolve(output,'camouflage-surfaces.png'),camo.toBuffer('image/png'));
 assert.ok(renderer.actors.cache.size<=144);
}
console.log(JSON.stringify({ok:true,widths:[320,390],reducedEffects:true,stateUnchanged:true,output}));
