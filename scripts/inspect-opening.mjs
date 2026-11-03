import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js');const {Renderer}=await import('../dist/renderer.js');const {beginTutorial,updateTutorial}=await import('../dist/opening.js');
const output=resolve(root,'proof/opening');mkdirSync(output,{recursive:true});
for(const [w,h] of [[390,844],[320,568]]){
 const game=new Game({seed:42}),canvas=createCanvas(w,h),renderer=new Renderer(canvas);renderer.resize(w,h);game.setViewport(w,h);await renderer.ready;
 const before=JSON.stringify(game.s);renderer.render(game,0);assert.equal(JSON.stringify(game.s),before);writeFileSync(resolve(output,`street-${w}.png`),canvas.toBuffer('image/png'));
 beginTutorial(game);assert.equal(game.s.enemies.length,1);renderer.render(game,0);const waiting=canvas.toBuffer('image/png');game.s.opening.phase='shoot';renderer.render(game,0);assert.deepEqual(canvas.toBuffer('image/png'),waiting,'starting movement must not make the visible tutorial enemy fade away');const tutorial=game.s.opening;delete game.s.opening;renderer.render(game,0);assert.notDeepEqual(canvas.toBuffer('image/png'),waiting,'ordinary spawn fade remains unchanged outside tutorial');game.s.opening=tutorial;game.s.opening.phase='move';renderer.render(game,0);writeFileSync(resolve(output,`tutorial-${w}.png`),canvas.toBuffer('image/png'));
 for(let n=0;n<25;n++){if(updateTutorial(game,{x:1,y:0}))game.update(.02,{x:1,y:0});}renderer.render(game,game.s.elapsed);writeFileSync(resolve(output,`moving-${w}.png`),canvas.toBuffer('image/png'));
 assert.ok(game.s.elapsed>.4);assert.ok(game.s.shots.length>0||game.s.enemies[0].hp<game.s.enemies[0].maxhp);
}
console.log('Real renderer verified at 390×844 and 320×568; one opponent, movement and autofire. Images exclude DOM UI.');
