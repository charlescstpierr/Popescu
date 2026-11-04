import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const {createCanvas,Image}=createRequire(import.meta.url)('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=resolve(process.argv[2]||root+'/proof/decor-correction');process.chdir(root+'/dist');mkdirSync(out,{recursive:true});
globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{positionNewRun}=await import('../dist/opening.js'),{beginAnimalAttack}=await import('../dist/animals.js');
const measurements=[];
for(const width of [320,390])for(const seed of [42,12345,983424]){
 const game=new Game({seed}),c=createCanvas(width,844),r=new Renderer(c);await r.ready;r.resize(width,844);game.setViewport(width,844);assert(positionNewRun(game));
 const before=JSON.stringify(game.s),start=performance.now();r.render(game,0);const coldMs=performance.now()-start;
 writeFileSync(`${out}/new-start-${width}-${seed}.png`,c.toBuffer('image/png'));
 const warm=performance.now();for(let i=0;i<120;i++)r.render(game,i/60);const warmMs=(performance.now()-warm)/120;
 assert.equal(JSON.stringify(game.s),before);assert(r.city.tiles.size<=48&&r.city.props.size<=96);
 measurements.push({scene:'new-start',width,seed,coldMs,warmMs,tiles:r.city.tiles.size,props:r.city.props.size});
}
const sample=new Game({seed:42});let condo;
for(let x=-4;x<=4&&!condo;x++)for(let y=-4;y<=4;y++){condo=sample.world.chunk(x,y).find(p=>p.buildingKind==='apartment'&&p.w>=100&&p.variant%2===1);if(condo)break;}
for(const [scene,x,y] of [['street',256,512],['bridge',1024,512],['condo',condo.x-90,condo.y+120]])for(const width of [320,390]){
 const game=new Game({seed:42}),c=createCanvas(width,844),r=new Renderer(c);await r.ready;r.resize(width,844);game.setViewport(width,844);game.s.x=x;game.s.y=y;game.s.elapsed=55;
 assert.equal(game.world.collides(x,y,13),false);
 const types=['ostrich','paparazzi','moose','disco_chicken'];let index=0;
 for(let i=0;i<24&&index<types.length;i++){
  const a=i*Math.PI/12,ex=x+Math.cos(a)*125,ey=y+Math.sin(a)*125;if(game.world.collides(ex,ey,24))continue;
  const e=game.spawnEnemy(types[index++],ex,ey);e.faceX=ex<x?1:-1;beginAnimalAttack(e,game.s);
 }
 assert(index>=3,'multiple simultaneous readable threats');
 const before=JSON.stringify(game.s);r.render(game,55);assert.equal(JSON.stringify(game.s),before);writeFileSync(`${out}/combat-${scene}-${width}-warnings.png`,c.toBuffer('image/png'));
 for(const e of game.s.enemies){e.phase='animal_active';e.animalTime=.2;}
 const active=JSON.stringify(game.s);r.render(game,55);assert.equal(JSON.stringify(game.s),active);writeFileSync(`${out}/combat-${scene}-${width}-active.png`,c.toBuffer('image/png'));
}
writeFileSync(`${out}/new-start-performance.json`,JSON.stringify({measurements,rendererReadOnly:true,caveat:'Native Canvas fixtures; not browser or physical phone proof'},null,2));console.log(JSON.stringify(measurements));
