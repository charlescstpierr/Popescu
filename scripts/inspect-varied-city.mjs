import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const {createCanvas,Image}=createRequire(import.meta.url)('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(resolve(root,'dist'));
globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
const {Game}=await import('../dist/engine.js');const {Renderer}=await import('../dist/renderer.js');const {CityArt}=await import('../dist/city-art.js');
const output=resolve(process.argv[2]||resolve(root,'proof/varied-city'));mkdirSync(output,{recursive:true});
const city=new CityArt(),sheet=createCanvas(1300,460),ctx=sheet.getContext('2d');ctx.fillStyle='#262335';ctx.fillRect(0,0,1300,460);
const kinds=['apartment','condo','garage','warehouse','shop','ruin'];
for(const [i,kind]of kinds.entries()){
 const p={type:'building',x:110+i*213,y:223,w:[148,164,116,174,128,112][i],h:[180,203,180,180,180,150][i],variant:kind==='condo'?1:2,buildingKind:kind==='condo'?'apartment':kind,damage:kind==='condo'?1:2};
 city.drawProp(ctx,p,42,0,true);ctx.fillStyle='#f8dfb3';ctx.font='15px sans-serif';ctx.fillText(['Appartement','Condo','Garage','Entrepôt','Commerce','Ruine'][i],30+i*213,24);
}
for(const [i,variant]of [0,1,2,3,4].entries())city.drawProp(ctx,{type:'pine',x:110+i*235,y:450,w:20,h:18,variant},42,0,true);
writeFileSync(resolve(output,'varied-city-contact.png'),sheet.toBuffer('image/png'));
const sample=new Game({seed:42});let condo;
for(let x=-4;x<=4&&!condo;x++)for(let y=-4;y<=4;y++){condo=sample.world.chunk(x,y).find(p=>p.buildingKind==='apartment'&&p.w>=100&&p.variant%2===1);if(condo)break;}
const canopy=sample.world.chunk(2,0).find(p=>p.type==='pine'&&p.variant===0&&!sample.world.collides(p.x,p.y-32,13));
assert.ok(canopy,'a clear route exists behind a canopy');
const scenes=[['city',460,220],['condo',condo.x-90,condo.y+120],['forest',1280,256],['river-bridge',1024,512],['river-ford',1024,256],['negative-river',-3072,-512],['canopy-visibility',canopy.x,canopy.y-32]];
const measurements=[];
for(const width of [320,390])for(const [name,x,y]of scenes){
 const game=new Game({seed:42}),canvas=createCanvas(width,844),renderer=new Renderer(canvas);await renderer.ready;renderer.resize(width,844);assert.equal(canvas.width,width);assert.equal(canvas.height,844);game.setViewport(width,844);
 assert.equal(game.world.collides(x,y,13),false,`${name} player position is traversable`);
 game.s.x=x;game.s.y=y;game.s.faceX=1;game.s.faceY=0;game.s.walkMoving=false;
 const before=JSON.stringify(game.s),cold=performance.now();renderer.render(game,20);const coldMs=performance.now()-cold;
 assert.equal(JSON.stringify(game.s),before);writeFileSync(resolve(output,`${name}-${width}.png`),canvas.toBuffer('image/png'));
 const t=performance.now();for(let i=0;i<60;i++)renderer.render(game,20+i/60);const ms=(performance.now()-t)/60;
 assert.ok(renderer.city.tiles.size<=48);assert.ok(renderer.city.props.size<=96);assert.equal(JSON.stringify(game.s),before);
 const warmTiles=renderer.city.tiles.size,warmProps=renderer.city.props.size;
 renderer.render(game,20);const culled=canvas.getContext('2d').getImageData(0,0,width,844).data;
 const cull=renderer.city.isPropVisible;renderer.city.isPropVisible=()=>true;renderer.render(game,20);renderer.city.isPropVisible=cull;
 assert.deepEqual(canvas.getContext('2d').getImageData(0,0,width,844).data,culled,'culling cannot alter visible pixels');
 measurements.push({scene:name,width,coldMs:+coldMs.toFixed(2),warmMs:+ms.toFixed(2),tiles:warmTiles,props:warmProps,cullingPixelIdentical:true});
}
writeFileSync(resolve(output,'render-report.json'),JSON.stringify({measurements,simulationUnchanged:true,caveat:'Native Canvas timing, not physical phone performance'},null,2));
console.log(JSON.stringify(measurements));
