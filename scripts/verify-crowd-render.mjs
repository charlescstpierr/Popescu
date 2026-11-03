import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
const roots=process.argv.slice(2).map(p=>resolve(p));assert.equal(roots.length,2,'supply baseline and candidate roots');
const runs=[];
for(const root of roots){
 process.chdir(resolve(root,'dist'));
 const {Game}=await import(pathToFileURL(resolve(root,'dist/engine.js'))),{Renderer}=await import(pathToFileURL(resolve(root,'dist/renderer.js')));
 const game=new Game({seed:42}),canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;
 game.s.elapsed=600;game.s.hp=game.s.maxhp=1e8;game.s.xpNeed=1e9;game.s.endless=true;
 for(const key in game.timers)game.timers[key]=99999;game.nextEvent=99999;
 const types=['normal','sprinter','gas','tank','jealous','orangutan','rival_rooster','rival_goat','travestia','ostrich','paparazzi','moose','disco_chicken'];
 for(let i=0;i<300;i++){const a=i*2.399963,r=30+Math.sqrt(i/300)*420,e=game.spawnEnemy(types[i%types.length],Math.cos(a)*r,Math.sin(a)*r);if(e)e.hp=e.maxhp=1000;}
 runs.push({game,canvas,renderer});
}
const result=[];
for(let frame=0;frame<120;frame++){
 for(const {game}of runs){game.s.mode='playing';game.s.invulnerable=10;game.update(1/60,{x:.5,y:-.2});}
 if(frame%20)continue;
 const images=[];
 for(const {game,canvas,renderer}of runs){const before=JSON.stringify(game.s);renderer.render(game,game.s.elapsed);assert.equal(JSON.stringify(game.s),before);images.push(Buffer.from(canvas.getContext('2d').getImageData(0,0,390,844).data));}
 assert.deepEqual(images[0],images[1],`actual Canvas pixels at frame ${frame}`);
 result.push({frame,sha256:createHash('sha256').update(images[0]).digest('hex')});
}
console.log(JSON.stringify({size:[390,844],matchedPixels:true,frames:result},null,2));
