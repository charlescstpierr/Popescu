import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const {createCanvas,Image}=createRequire(import.meta.url)('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(resolve(root,'dist'));
globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
const {Game}=await import('../dist/engine.js');const {Renderer}=await import('../dist/renderer.js');const {CityArt}=await import('../dist/city-art.js');
const output=resolve(process.argv[2]||'/tmp/toma-scenery-qa');mkdirSync(output,{recursive:true});
const city=new CityArt(),sheet=createCanvas(1200,440),ctx=sheet.getContext('2d');ctx.fillStyle='#262335';ctx.fillRect(0,0,1200,440);
let index=0;
for(const kind of ['apartment','garage','warehouse','shop','ruin']){const p={type:'building',x:110+index*240,y:220,w:150,h:180,variant:2,buildingKind:kind,damage:3};city.drawProp(ctx,p,42,0,true);ctx.fillStyle='#f8dfb3';ctx.font='15px sans-serif';ctx.fillText({apartment:'Appartement',garage:'Garage',warehouse:'Entrepôt',shop:'Commerce',ruin:'Ruine'}[kind],30+index*240,24);index++;}
for(const [i,type]of ['pine','rock','stump','log','forestRuin'].entries())city.drawProp(ctx,{type,x:100+i*240,y:420,w:type==='pine'?20:40,h:24,variant:i},42,0,true);
writeFileSync(resolve(output,'scenery-contact.png'),sheet.toBuffer('image/png'));
for(const [name,x,y]of [['city',460,220],['forest',1280,256],['transition',1024,256]]){const game=new Game({seed:42}),canvas=createCanvas(780,844),renderer=new Renderer(canvas);await renderer.ready;game.s.x=x;game.s.y=y;const before=JSON.stringify(game.s);renderer.render(game,20);assert.equal(JSON.stringify(game.s),before);writeFileSync(resolve(output,`${name}.png`),canvas.toBuffer('image/png'));assert.ok(renderer.city.tiles.size<=48);assert.ok(renderer.city.props.size<=96);}
console.log(`Scenery QA renders: ${output}`);
