import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
import {fileURLToPath} from 'node:url';
import {HeroArt} from '../dist/hero-art.js';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';import {writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=resolve('.'),out=resolve(process.argv[2]||'/tmp/popescu-enemy-gait');mkdirSync(out,{recursive:true});const {Game}=await import(root+'/dist/engine.js'),{Renderer}=await import(root+'/dist/renderer.js');
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
const c=createCanvas(390,422),r=new Renderer(c);await r.ready;r.resize(390,422);r._drawGround=()=>{};r.hero=new HeroArt({loadImage:src=>loadImage(fileURLToPath(src))});await r.hero.ready;
for(const [key,file] of [['enemy','gorilla-walk-v2.png'],['orangutan','orangutan-walk-v3.png'],['rival_rooster','rival_rooster-walk-v3.png'],['rival_goat','rival_goat-walk-v3.png'],['animals','animals-approved.png'],['pelican','pelican-poses.png'],['travestia','travestia-poses.png']])r.actors.images[key]=await loadImage(root+'/dist/assets/'+file);
const data=[];const contact=createCanvas(600,7*160),cc=contact.getContext('2d');cc.fillStyle='#292238';cc.fillRect(0,0,contact.width,contact.height);let row=0;
for(const type of ['normal','orangutan','rival_goat','rival_rooster','ostrich','pelican','travestia']){
 const g=new Game({seed:42});g.s.elapsed=20;g.s.x=0;g.s.y=0;g.world.collides=()=>true;g.world.getVisible=()=>[];const e=g.spawnEnemy(type,0,-120);e.cooldown=100;const init={x:e.x,y:e.y};let frames=[];const orig=r.actors.draw.bind(r.actors);r.actors.draw=(ctx,actor,kind,phase,s,time,...rest)=>{if(actor===e)frames.push(phase);return orig(ctx,actor,kind,phase,s,time,...rest);};const hashes=[];
 for(let i=0;i<4;i++){g.s.elapsed+=.1;g.updateEnemies(.1);r.render(g,g.s.elapsed);const crop=r.ctx.getImageData(130,0,130,130);hashes.push(createHash('sha256').update(crop.data).digest('hex'));const tile=createCanvas(150,150),tc=tile.getContext('2d');r.actors.draw(tc,{...e,x:75,y:145},'enemy',frames.at(-1),g.s,g.s.elapsed);cc.drawImage(tile,i*150,row*160);cc.fillStyle='#fff1cb';cc.font='11px sans-serif';cc.fillText(type+' t+'+((i+1)*.1).toFixed(1),i*150+5,row*160+14);}
 r.actors.draw=orig;data.push({type,actualDistance:Math.hypot(e.x-init.x,e.y-init.y),renderPhases:frames,uniqueCroppedFrames:new Set(hashes).size,peliWalkDistance:e.peliWalkDistance,tailWalkDistance:e.tailWalkDistance});row++;
}
writeFileSync(resolve(out,'blocked-locomotion.json'),JSON.stringify(data,null,2));writeFileSync(resolve(out,'blocked-locomotion.png'),contact.toBuffer('image/png'));console.log(JSON.stringify(data,null,2));

for(const result of data){assert.equal(result.actualDistance,0,result.type);assert.equal(result.uniqueCroppedFrames,1,result.type+' must not walk while blocked');}
