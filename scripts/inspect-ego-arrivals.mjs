import {createRequire} from 'node:module';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {mkdirSync,writeFileSync} from 'node:fs';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require(process.env.POPESCU_CANVAS_MODULE||'@napi-rs/canvas'),root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=resolve(process.argv[2]||'/tmp/ego-arrival-proof');mkdirSync(output,{recursive:true});process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{EGO_BEASTS}=await import('../dist/ego-beasts.js'),{egoFitsViewport}=await import('../dist/ego-entry.js'),{positionNewRun}=await import('../dist/opening.js');
const game=new Game({seed:42});positionNewRun(game);game.s.hp=game.s.maxhp=1e6;game.s.xpNeed=1e9;game.setViewport(390,844);game.setViewportOcclusions([{x:0,y:0,width:390,height:72},{x:24,y:669,width:110,height:110},{x:200,y:720,width:177,height:65}]);
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);renderer.resize(390,844);await renderer.ready;assert(renderer.actors.available('ego'));
const records=[],seen=new Set();for(let i=0;i<120*60&&seen.size<4;i++){
 const a=i/60/15;game.update(1/60,{x:Math.cos(a),y:Math.sin(a)});
 for(const e of game.s.enemies){if(!EGO_BEASTS[e.type]||seen.has(e.type))continue;assert(egoFitsViewport(game,e),e.type+' is fully visible at its real arrival');seen.add(e.type);const before=JSON.stringify(game.s);renderer.render(game,game.s.elapsed);assert.equal(JSON.stringify(game.s),before);writeFileSync(resolve(output,e.type+'.png'),canvas.toBuffer('image/png'));records.push({type:e.type,name:EGO_BEASTS[e.type].name,time:game.s.elapsed,x:e.x,y:e.y,width:canvas.width,height:canvas.height,phase:e.phase});}
 if(game.s.mode==='upgrade')game.chooseUpgrade(game.s.options[0].id);if(game.s.mode==='dialogue')game.finishDialogue(true);
}
assert.equal(seen.size,4,'all four must really spawn');writeFileSync(resolve(output,'arrivals.json'),JSON.stringify({seed:42,viewport:game.viewport,records},null,2));console.log(JSON.stringify(records));
